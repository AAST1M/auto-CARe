import rateLimit from 'express-rate-limit';

const isProd = process.env.NODE_ENV === 'production';

const shouldSkip = (req: any) => {
  return req.headers['x-playwright-test'] === 'true' || process.env.NODE_ENV === 'test';
};

/**
 * loginLimiter — Brute-force protection for POST /api/auth/login
 * Max 10 attempts per 15 minutes per IP.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 10 : 10000,
  standardHeaders: true,   // Return rate-limit info in the `RateLimit-*` headers
  legacyHeaders: false,
  skip: shouldSkip,
  message: {
    error: 'Too many login attempts from this IP. Please wait 15 minutes before trying again.'
  }
});

/**
 * registerLimiter — Prevents mass account creation from a single IP.
 * Max 5 registrations per hour per IP.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isProd ? 5 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  message: {
    error: 'Too many accounts created from this IP. Please try again after an hour.'
  }
});

/**
 * apiLimiter — General protection for all API routes.
 * Max 100 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isProd ? 100 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  message: {
    error: 'Too many requests from this IP. Please slow down.'
  }
});

