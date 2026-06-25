import request from 'supertest';
import express from 'express';
import winchRoutes from '../routes/winch';
import { prismaMock } from './setup';

// Setup dynamic user mock for auth middleware
let mockUser: any = { id: 'test-user-id', role: 'USER' };

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = mockUser;
    next();
  },
  requireRole: (...roles: string[]) => {
    return (req: any, res: any, next: any) => {
      next();
    };
  }
}));

const app = express();
app.use(express.json());
app.use('/api/winch', winchRoutes);

describe('Winch Routes', () => {
  beforeEach(() => {
    mockUser = { id: 'test-user-id', role: 'USER' };
  });

  describe('GET /offers', () => {
    it('should return available winch offers (happy path)', async () => {
      const mockOffers = [
        { id: '1', driverName: 'John', price: 100, eta: '10 mins', vehicle: 'Truck' }
      ];
      // @ts-ignore
      prismaMock.winchOffer.findMany.mockResolvedValue(mockOffers);

      const res = await request(app).get('/api/winch/offers');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockOffers);
      expect(prismaMock.winchOffer.findMany).toHaveBeenCalled();
    });

    it('should handle database errors and return 500 status (error handling)', async () => {
      prismaMock.winchOffer.findMany.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/api/winch/offers');

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({ error: 'Server error' });
    });
  });
});
