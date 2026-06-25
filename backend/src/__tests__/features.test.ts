import request from 'supertest';
import express from 'express';
import walletRoutes from '../routes/wallet';
import workshopRoutes from '../routes/workshops';
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
      // Mock role-based restriction pass
      next();
    };
  }
}));

const app = express();
app.use(express.json());
app.use('/api/wallet', walletRoutes);
app.use('/api/workshops', workshopRoutes);

describe('Auto Care AI Core Features E2E & Unit Tests', () => {
  beforeEach(() => {
    mockUser = { id: 'test-user-id', role: 'USER' };
  });

  // ─── 1. WINCH & DYNAMIC TRIP PRICING ──────────────────────────────────────────
  describe('Winch Route & Dynamic Distance Pricing', () => {
    it('should calculate the dynamic trip price based on distance (20 EGP/km)', async () => {
      const payload = {
        pickupLat: 30.0500,  // Cairo Center
        pickupLng: 31.2400,
        dropLat: 30.0450,    // Cairo Outskirts (500m / ~0.74 km away)
        dropLng: 31.2350
      };

      const res = await request(app)
        .post('/api/wallet/calculate-trip-price')
        .send(payload);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('distanceKm');
      expect(res.body).toHaveProperty('price');
      expect(res.body).toHaveProperty('ratePerKm', 20);
      
      // Math: ~0.74 km * 20 EGP/km = ~15 EGP
      expect(res.body.price).toBeGreaterThan(0);
      expect(res.body.price).toEqual(15);
    });

    it('should calculate exactly 200 EGP for a 10 km trip at 20 EGP/km rate', async () => {
      // Cairo center to outskirts ~10.0km apart
      // lat diff of 0.08993 degrees at lon 31.0 is exactly 10.0 km
      const payload = {
        pickupLat: 30.0,
        pickupLng: 31.0,
        dropLat: 30.08993,
        dropLng: 31.0,
        ratePerKm: 20
      };

      const res = await request(app)
        .post('/api/wallet/calculate-trip-price')
        .send(payload);

      expect(res.statusCode).toEqual(200);
      expect(res.body.distanceKm).toEqual(10.0);
      expect(res.body.price).toEqual(200);
      expect(res.body.ratePerKm).toEqual(20);
    });

    it('should return 400 bad request if coordinates are missing', async () => {
      const res = await request(app)
        .post('/api/wallet/calculate-trip-price')
        .send({ pickupLat: 30.0500 });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toContain('are required');
    });
  });

  // ─── 2. WALLET SYSTEM, COMMISSION, AND ADDING FUNDS ───────────────────────────
  describe('Digital Wallet, Top-Ups & Commission Deductions', () => {
    it('should allow users, drivers, or workshops to top up (add funds) to their wallet', async () => {
      const updateSpy = jest.fn().mockResolvedValue({ id: 'test-user-id', walletBalance: 500 });
      const createSpy = jest.fn().mockResolvedValue({ id: 'tx-123' });

      prismaMock.$transaction.mockImplementation(async (callback) => {
        const tx = {
          user: {
            update: updateSpy
          },
          transaction: {
            create: createSpy
          }
        };
        return await callback(tx as any);
      });

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        walletBalance: 500
      } as any);

      const res = await request(app)
        .post('/api/wallet/topup')
        .send({ amount: 500 });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toMatchObject({ success: true, newBalance: 500 });

      expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'test-user-id' },
        data: expect.objectContaining({ walletBalance: { increment: 500 } })
      }));

      expect(createSpy).toHaveBeenCalledWith({
        data: {
          userId: 'test-user-id',
          amount: 500,
          commission: 0,
          type: 'TopUp',
          status: 'Completed'
        }
      });
    });

    it('should deduct booking amount from customer and add 90% (10% commission) to workshop wallet', async () => {
      const workshopOwnerId = 'owner-id';
      const workshopId = 'workshop-id';
      const bookingPrice = 1000;

      // Mock database workshop entity
      prismaMock.workshop.findUnique.mockResolvedValue({
        id: workshopId,
        ownerId: workshopOwnerId,
        name: 'Al-Ahlia Mechanics',
        priceEstimate: '$$'
      } as any);

      // Mock appointment conflicts check
      prismaMock.appointment.findFirst.mockResolvedValue(null);

      // Mock customer info
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        walletBalance: 2000 // sufficient funds
      } as any);

      const updateSpy = jest.fn().mockResolvedValue({ id: 'test-user-id' });
      const createSpy = jest.fn().mockResolvedValue({ id: 'tx-booking' });

      // Mock interactive transaction
      prismaMock.$transaction.mockImplementation(async (callback) => {
        const tx = {
          user: {
            update: updateSpy
          },
          transaction: {
            create: createSpy
          }
        };
        return await callback(tx as any);
      });

      // Mock appointment creation
      prismaMock.appointment.create.mockResolvedValue({
        id: 'appointment-123',
        userId: 'test-user-id',
        workshopId,
        serviceType: 'General Inspection',
        date: '2026-10-14',
        time: '11:00 AM',
        price: bookingPrice,
        status: 'Pending',
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      const res = await request(app)
        .post(`/api/workshops/${workshopId}/book`)
        .send({
          serviceType: 'General Inspection',
          date: '2026-10-14',
          time: '11:00 AM',
          carDetails: 'BMW 320i',
          price: bookingPrice,
          paymentMethod: 'wallet'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual('appointment-123');

      // Verify commission deduction logic in database transaction updates:
      // Customer balance decrement
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { walletBalance: { decrement: 1000 } }
      });

      // Workshop owner balance increment (90%)
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 'owner-id' },
        data: { walletBalance: { increment: 900 } }
      });

      // Transaction log creation (10% commission recorded)
      expect(createSpy).toHaveBeenCalledWith({
        data: {
          userId: 'test-user-id',
          providerId: 'owner-id',
          amount: 1000,
          commission: 100,
          type: 'Workshop',
          status: 'Completed'
        }
      });
    });
  });

  // ─── 3. WORKSHOP PROFILE DISPLAY ──────────────────────────────────────────────
  describe('Workshop Profile Display Details', () => {
    it('should return complete workshop details including commercial register and rating', async () => {
      prismaMock.workshop.findUnique.mockResolvedValue({
        id: 'workshop-123',
        name: 'Al-Ahlia Mechanics',
        rating: 4.8,
        latitude: 30.0444,
        longitude: 31.2357,
        commercialRegister: 'base64_register_thumbnail',
        address: 'Tahrir Square',
        specialty: 'European Cars',
        priceEstimate: '$$',
        owner: {
          name: 'Ahlia Owner',
          taxCard: 'base64_tax_card_thumbnail'
        }
      } as any);

      const res = await request(app).get('/api/workshops/workshop-123');

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toEqual('Al-Ahlia Mechanics');
      expect(res.body.rating).toEqual(4.8);
      expect(res.body.latitude).toEqual(30.0444);
      expect(res.body.longitude).toEqual(31.2357);
      expect(res.body.commercialRegister).toEqual('base64_register_thumbnail');
      expect(res.body.owner.taxCard).toEqual('base64_tax_card_thumbnail');
    });
  });

  // ─── 4. BOOKING & SCHEDULING CALENDAR + CONFLICT PREVENTION ──────────────────
  describe('Booking Calendar, Slots & Conflict Prevention', () => {
    it('should list available hourly slots excluding already booked slots', async () => {
      const workshopId = 'workshop-123';
      
      // Mock existing booked slot at 11:00 AM
      prismaMock.appointment.findMany.mockResolvedValue([
        {
          id: 'appt-1',
          workshopId,
          date: '2026-10-14',
          time: '11:00 AM',
          status: 'Confirmed'
        }
      ] as any);

      const res = await request(app)
        .get(`/api/workshops/${workshopId}/available-slots`)
        .query({ date: '2026-10-14' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.date).toEqual('2026-10-14');
      
      // Total slots = 9
      expect(res.body.allSlots).toContain('11:00 AM');
      // Booked slots list must contain 11:00 AM
      expect(res.body.bookedSlots).toContain('11:00 AM');
      // Available slots list must NOT contain 11:00 AM
      expect(res.body.availableSlots).not.toContain('11:00 AM');
    });

    it('should reject a booking request with 409 Conflict if the slot is already booked', async () => {
      const workshopId = 'workshop-123';

      // Mock workshop details
      prismaMock.workshop.findUnique.mockResolvedValue({
        id: workshopId,
        ownerId: 'owner-id',
        name: 'Al-Ahlia Mechanics',
        priceEstimate: '$$'
      } as any);

      // Mock existing booking in database
      prismaMock.appointment.findFirst.mockResolvedValue({
        id: 'existing-booking-id',
        workshopId,
        date: '2026-10-14',
        time: '11:00 AM',
        status: 'Pending'
      } as any);

      const res = await request(app)
        .post(`/api/workshops/${workshopId}/book`)
        .send({
          serviceType: 'General Inspection',
          date: '2026-10-14',
          time: '11:00 AM',
          carDetails: 'BMW 320i',
          price: 500,
          paymentMethod: 'cash'
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body.error).toContain('already booked');
    });
  });
});
