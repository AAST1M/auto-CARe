import request from 'supertest';
import express from 'express';
import workshopRoutes from '../routes/workshops';
import { prismaMock } from './setup';

// Use a getter so the mock always reads the latest value
let currentMockUser: any = { id: 'workshop-owner-id', role: 'WORKSHOP_OWNER' };

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 'workshop-owner-id', role: 'WORKSHOP_OWNER' };
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
app.use('/api/workshops', workshopRoutes);

describe('Workshop Appointments & States', () => {
  beforeEach(() => {
    currentMockUser = { id: 'workshop-owner-id', role: 'WORKSHOP_OWNER' };
    jest.clearAllMocks();
  });

  describe('PATCH /api/workshops/appointments/:id/progress', () => {
    it('should update appointment status and progress integer correctly', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({
        id: 'appt-id',
        workshopId: 'workshop-id'
      } as any);

      // Verify owner
      prismaMock.workshop.findFirst.mockResolvedValue({
        id: 'workshop-id',
        ownerId: 'workshop-owner-id'
      } as any);

      prismaMock.appointment.update.mockResolvedValue({
        id: 'appt-id',
        status: 'Repairing',
        progress: 25
      } as any);

      const res = await request(app)
        .patch('/api/workshops/appointments/appt-id/progress')
        .send({ progress: 25 });

      expect(res.statusCode).toEqual(200);
    });

    it('should return 403 if the workshop owner does not own the appointment', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({
        id: 'appt-id',
        workshopId: 'workshop-id'
      } as any);

      // Verify owner fails
      prismaMock.workshop.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/workshops/appointments/appt-id/progress')
        .send({ progress: 25 });

      expect(res.statusCode).toEqual(403);
      expect(res.body.error).toContain('Unauthorized');
    });

    it('should allow completing the appointment to 100%', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({
        id: 'appt-id',
        workshopId: 'workshop-id'
      } as any);

      // Verify owner
      prismaMock.workshop.findFirst.mockResolvedValue({
        id: 'workshop-id',
        ownerId: 'workshop-owner-id'
      } as any);

      prismaMock.appointment.update.mockResolvedValue({
        id: 'appt-id',
        status: 'Ready',
        progress: 100
      } as any);

      const res = await request(app)
        .patch('/api/workshops/appointments/appt-id/progress')
        .send({ progress: 100 });

      expect(res.statusCode).toEqual(200);
    });
  });
});
