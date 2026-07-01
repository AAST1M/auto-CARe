import request from 'supertest';
import express from 'express';
import winchRoutes from '../routes/winch';
import { prismaMock } from './setup';

let mockUser: any = { id: 'test-user-id', role: 'USER' };

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = mockUser;
    next();
  },
  requireRole: (...roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!roles.includes(mockUser.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }
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

  describe('POST /api/winch/bookings/cash', () => {
    it('should create a new cash winch booking', async () => {
      // Mock the transaction required by POST /bookings/cash
      prismaMock.$transaction.mockImplementation(async (callback) => {
        return [{
          id: 'booking-id',
          userId: 'test-user-id',
          driverId: 'driver-id',
          driverName: 'Test Driver',
          vehicle: 'Flatbed',
          price: 150,
          status: 'Active',
          userLat: 30.0,
          userLng: 31.0,
          destLat: 30.1,
          destLng: 31.1,
          createdAt: new Date(),
          updatedAt: new Date()
        }];
      });

      const res = await request(app)
        .post('/api/winch/bookings/cash')
        .send({
          driverId: 'driver-id',
          driverName: 'Test Driver',
          vehicle: 'Flatbed',
          price: 150,
          userLat: 30.0,
          userLng: 31.0,
          destLat: 30.1,
          destLng: 31.1
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', 'booking-id');
    });
  });

  describe('POST /api/winch/location', () => {
    it('should update driver location for a booking', async () => {
      mockUser = { id: 'driver-id', role: 'WINCH_DRIVER' };

      prismaMock.winchBooking.findUnique.mockResolvedValue({
        id: 'booking-id',
        driverId: 'driver-id'
      } as any);

      prismaMock.winchBooking.update.mockResolvedValue({
        id: 'booking-id',
        driverLat: 30.5,
        driverLng: 31.5
      } as any);

      const res = await request(app)
        .post('/api/winch/location')
        .send({ bookingId: 'booking-id', lat: 30.5, lng: 31.5 });

      expect(res.statusCode).toEqual(200);
      expect(prismaMock.winchBooking.update).toHaveBeenCalledWith({
        where: { id: 'booking-id' },
        data: { driverLat: 30.5, driverLng: 31.5 }
      });
    });
  });
});
