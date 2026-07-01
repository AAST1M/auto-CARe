import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import workshopRoutes from './routes/workshops';
import winchRoutes from './routes/winch';
import geminiRoutes from './routes/gemini';
import adminRoutes from './routes/admin';
import { apiLimiter } from './middleware/rateLimiter';
import prisma from './prismaClient';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupSocket } from './socket';
import cookieParser from 'cookie-parser';

dotenv.config();

// Initialize cron jobs
import './cron';

// ─── SECURITY CHECK: Refuse to start with a weak or missing JWT secret ────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('❌  FATAL: JWT_SECRET is missing or too short (must be ≥ 32 characters).');
  console.error('   Set a strong secret in your backend/.env file and restart.');
  process.exit(1);
}

// (Password stripping is handled explicitly in the auth routes via `select` or explicit payload mapping in Prisma 6)

const app = express();
app.use(cookieParser());
const httpServer = createServer(app);
const PORT = process.env.PORT || 5001;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Restrict which origins can call this API.
// In development: http://localhost:3000
// In production: set ALLOWED_ORIGIN in your .env
const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004')
  .split(',')
  .map(o => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, mobile apps, server-to-server)
      if (!origin) return callback(null, true);
      
      // Auto-permit any localhost or 127.0.0.1 port in development
      const isLocalhost = process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      
      if (isLocalhost || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin '${origin}' is not allowed.`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-playwright-test'],
    credentials: true
  })
);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isLocalhost = process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (isLocalhost || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: Origin '${origin}' is not allowed.`));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

setupSocket(io);

// ─── HELMET — Security HTTP headers ───────────────────────────────────────────
app.use(
  helmet({
    // Content Security Policy: restrict sources for scripts, styles, fonts, etc.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],   // inline scripts needed for Vite SPA
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://picsum.photos', 'https://*.tile.openstreetmap.org', 'https://cdnjs.cloudflare.com', 'https://raw.githubusercontent.com'],
        connectSrc: ["'self'", 'http://localhost:5001', 'ws://localhost:5001', 'wss:', 'https://generativelanguage.googleapis.com'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    // Prevent browsers from MIME-sniffing the content type
    noSniff: true,
    // Prevent clickjacking by disallowing iframes
    frameguard: { action: 'deny' },
    // Don't leak referrer information to other sites
    referrerPolicy: { policy: 'no-referrer' },
    // Hide Express version from response headers
    hidePoweredBy: true,
    // Force HTTPS in production (HSTS)
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  })
);

// ─── BODY SIZE LIMIT ──────────────────────────────────────────────────────────
// Reject requests with a JSON body larger than 50mb
app.use(express.json({ limit: '50mb' }));



// ─── GENERAL RATE LIMIT — apply to all /api routes ────────────────────────────
app.use('/api', apiLimiter);

import partsRoutes from './routes/parts';
import chatRoutes from './routes/chat';
import biddingRoutes from './routes/bidding';
import walletRoutes from './routes/wallet';
import utilsRoutes from './routes/utils';
import { setIo } from './routes/workshops';

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/workshops', workshopRoutes);
app.use('/api/winch', winchRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/bidding', biddingRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/utils', utilsRoutes);

// Pass the io instance to workshops so it can emit real-time events
setIo(io);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── SERVE FRONTEND (production only) ─────────────────────────────────────────
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
const fs = require('fs');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  // ─── SPA CATCH-ALL ──────────────────────────────────────────────────────────
  app.get('/*splat', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Handle CORS errors
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`✅  Server running on port ${PORT} (bound to 0.0.0.0)`);
  console.log(`🛡️  Security: Helmet ✓ | CORS (${allowedOrigins.join(', ')}) ✓ | Rate Limiting ✓ | Body limit: 50mb ✓`);
});
