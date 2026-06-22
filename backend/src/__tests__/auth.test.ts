import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth';
import { prismaMock } from './setup';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'supersecret_test_key_minimum_32_chars_long';
    process.env.REFRESH_TOKEN_SECRET = 'supersecret_refresh_key_minimum_32_chars_long';
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        name: 'Test User',
        role: 'USER',
        phone: '1234567890',
        gender: null,
        dob: null,
        walletBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        resetToken: null,
        resetTokenExpiry: null,
        refreshToken: null
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'Password123', name: 'Test User', phone: '1234567890' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should return 400 if user already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        name: 'Test User',
        role: 'USER',
        phone: '1234567890',
        gender: null,
        dob: null,
        walletBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        resetToken: null,
        resetTokenExpiry: null,
        refreshToken: null
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123', name: 'Test User', phone: '1234567890' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@example.com', password: 'Password123' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Invalid credentials');
    });
  });
});
