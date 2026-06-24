import request from 'supertest';
import express from 'express';
import partsRoutes from '../routes/parts';
import { prismaMock } from './setup';
import jwt from 'jsonwebtoken';

// Mock the auth middleware completely
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: '1', role: 'USER' };
    next();
  },
  requireRole: (...roles: string[]) => {
    return (req: any, res: any, next: any) => next();
  }
}));



const app = express();
app.use(express.json());
app.use('/api/parts', partsRoutes);

describe('Parts Routes - Checkout', () => {
  describe('POST /api/parts/order', () => {
    it('should successfully place an order and deduct wallet and stock', async () => {
      prismaMock.sparePart.findUnique.mockResolvedValue({
        id: '1',
        name: 'Oil Filter',
        price: 100,
        stock: 5,
        condition: 'New',
        image: null,
        category: 'Engine',
        workshopId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      // Use a mock function for prisma.$transaction
      prismaMock.$transaction.mockImplementation(async (callback) => {
        // We mock the interactive transaction proxy
        const tx = {
          user: {
            findUnique: jest.fn().mockResolvedValue({ id: '1', walletBalance: 500 }),
            update: jest.fn()
          },
          sparePart: {
            findUnique: jest.fn().mockResolvedValue({
              id: '1',
              name: 'Oil Filter',
              price: 100,
              stock: 5,
              condition: 'New',
              image: null,
              category: 'Engine',
              workshopId: null,
              createdAt: new Date(),
              updatedAt: new Date()
            }),
            update: jest.fn()
          },
          workshop: {
            findUnique: jest.fn(),
            update: jest.fn()
          },
          partOrder: {
            create: jest.fn().mockResolvedValue({ id: 'order_1', status: 'Processing' })
          }
        };
        return await callback(tx as any);
      });

      const res = await request(app)
        .post('/api/parts/order')
        .send({ partId: '1', qty: 2 });

      expect(res.statusCode).toEqual(201);
      expect(res.body.id).toEqual('order_1');
    });

    it('should fail if user has insufficient funds', async () => {
      prismaMock.sparePart.findUnique.mockResolvedValue({
        id: '1',
        name: 'Oil Filter',
        price: 100,
        stock: 5,
        condition: 'New',
        image: null,
        category: 'Engine',
        workshopId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      prismaMock.$transaction.mockImplementation(async (callback) => {
        const tx = {
          user: {
            findUnique: jest.fn().mockResolvedValue({ id: '1', walletBalance: 50 }) // 50 < 200
          },
          sparePart: {
            findUnique: jest.fn().mockResolvedValue({
              id: '1',
              name: 'Oil Filter',
              price: 100,
              stock: 5,
              condition: 'New',
              image: null,
              category: 'Engine',
              workshopId: null,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        };
        return await callback(tx as any);
      });

      const res = await request(app)
        .post('/api/parts/order')
        .send({ partId: '1', qty: 2 });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Insufficient wallet balance');
    });
  });
});
