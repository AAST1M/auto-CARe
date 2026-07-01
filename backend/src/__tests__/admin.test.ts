import request from 'supertest';
import express from 'express';
import adminRoutes from '../routes/admin';
import { prismaMock } from './setup';

let currentMockUser: any = { id: 'admin-id', role: 'ADMIN' };

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = currentMockUser;
    next();
  },
  requireRole: (...roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!roles.includes(currentMockUser.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      next();
    };
  }
}));

// Mock socket.ts to avoid network issues or unexpected imports
jest.mock('../socket', () => ({
  getOnlineUserIds: jest.fn().mockReturnValue([]),
  getOnlineUsersCount: jest.fn().mockReturnValue(0)
}));

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Admin Routes', () => {
  beforeEach(() => {
    currentMockUser = { id: 'admin-id', role: 'ADMIN' };
    jest.clearAllMocks();
  });

  describe('GET /api/admin/stats', () => {
    it('should return admin dashboard statistics', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        { role: 'USER' }, { role: 'USER' },
        { role: 'WINCH_DRIVER' },
        { role: 'WORKSHOP_OWNER' }
      ] as any);
      
      prismaMock.workshop.count.mockResolvedValue(5);
      
      prismaMock.appointment.findMany.mockResolvedValue([]);
      prismaMock.appointment.count.mockResolvedValue(50);
      
      prismaMock.winchBooking.findMany.mockResolvedValue([]);
      
      const res = await request(app).get('/api/admin/stats');

      expect(res.statusCode).toEqual(200);
      expect(res.body.users).toHaveProperty('USER', 2);
      expect(res.body.users).toHaveProperty('WINCH_DRIVER', 1);
      expect(res.body.users).toHaveProperty('WORKSHOP_OWNER', 1);
      expect(res.body).toHaveProperty('workshops', 5);
      expect(res.body).toHaveProperty('activeAppointments', 50);
    });

    it('should deny access if not an admin', async () => {
      currentMockUser = { id: 'user-id', role: 'USER' };
      const res = await request(app).get('/api/admin/stats');
      expect(res.statusCode).toEqual(403);
    });
  });

  describe('PATCH /api/admin/users/:id/approve', () => {
    it('should approve a user successfully', async () => {
      prismaMock.user.update.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test Driver',
        role: 'WINCH_DRIVER',
        approvalStatus: 'APPROVED'
      } as any);

      const res = await request(app).patch('/api/admin/users/user-id/approve');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('approvalStatus', 'APPROVED');
    });
  });

  describe('PATCH /api/admin/users/:id/reject', () => {
    it('should reject a user successfully', async () => {
      prismaMock.user.update.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test Driver',
        role: 'WINCH_DRIVER',
        approvalStatus: 'REJECTED'
      } as any);

      const res = await request(app).patch('/api/admin/users/user-id/reject');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('approvalStatus', 'REJECTED');
    });
  });
});
