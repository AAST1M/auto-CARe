import { Router } from 'express';
import prisma from '../prismaClient';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { getCache, setCache, clearCache } from '../redisClient';

const router = Router();

// Get all workshops (Cached)
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'workshops:all';
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const workshops = await prisma.workshop.findMany({
      include: { owner: { select: { name: true } } }
    });

    await setCache(cacheKey, workshops, 3600); // cache for 1 hour
    res.json(workshops);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get workshop details by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const workshop = await prisma.workshop.findUnique({
      where: { id },
      include: { owner: { select: { name: true, phone: true } } }
    });
    if (!workshop) return res.status(404).json({ error: 'Workshop not found' });
    res.json(workshop);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new workshop (WORKSHOP_OWNER only)
router.post('/', authenticateToken, requireRole('WORKSHOP_OWNER'), async (req: AuthRequest, res) => {

  try {
    const { name, services, address, hours, description } = req.body;
    const workshop = await prisma.workshop.create({
      data: {
        name,
        services: JSON.stringify(services), // Storing array as string for sqlite simplicity
        address,
        hours,
        description,
        ownerId: req.user!.id
      }
    });
    await clearCache('workshops:all');
    res.json(workshop);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Book an appointment (authenticated users only — not workshop owners)
router.post('/:id/book', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { serviceType, time, carDetails, price, paymentMethod } = req.body;

    // Validation
    if (!serviceType || !serviceType.trim()) {
      return res.status(400).json({ error: 'Service type is required' });
    }
    if (!time || !time.trim()) {
      return res.status(400).json({ error: 'Appointment time is required' });
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({ error: 'A valid price is required' });
    }

    const parsedPrice = Number(price);

    // Workshop owners cannot book their own workshops
    let workshop;
    if (req.user!.role === 'WORKSHOP_OWNER') {
      workshop = await prisma.workshop.findFirst({
        where: { id: id as string, ownerId: req.user!.id }
      });
      if (workshop) {
        return res.status(403).json({ error: 'Workshop owners cannot book their own workshops' });
      }
    }
    
    // Fetch workshop to get ownerId
    if (!workshop) {
      workshop = await prisma.workshop.findUnique({ where: { id: id as string } });
      if (!workshop) return res.status(404).json({ error: 'Workshop not found' });
    }

    // Check user balance only if paying with card
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (paymentMethod !== 'cash') {
      if (!user || user.walletBalance < parsedPrice) {
        return res.status(402).json({ error: 'Insufficient funds in digital wallet. Please choose Cash on Delivery or top up your wallet.' });
      }

      // Process Transaction (Deduct from user, give 90% to workshop owner)
      await prisma.$transaction(async (tx) => {
        // Deduct full amount
        await tx.user.update({
          where: { id: user!.id },
          data: { walletBalance: { decrement: parsedPrice } }
        });

        // Add 90% to workshop owner
        await tx.user.update({
          where: { id: workshop!.ownerId },
          data: { walletBalance: { increment: parsedPrice * 0.9 } }
        });

        // Platform keeps 10%
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId: req.user!.id,
        workshopId: id as string,
        serviceType: serviceType.trim(),
        time: time.trim(),
        carDetails: carDetails?.trim() || null,
        price: parsedPrice
      }
    });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get appointments for the authenticated user/owner
router.get('/appointments', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const role = req.user!.role;
    const userId = req.user!.id;

    if (role === 'WORKSHOP_OWNER') {
      // Find all workshops owned by this owner
      const workshops = await prisma.workshop.findMany({
        where: { ownerId: userId }
      });
      const workshopIds = workshops.map(w => w.id);

      // Find all appointments for these workshops
      const appointments = await prisma.appointment.findMany({
        where: { workshopId: { in: workshopIds } },
        include: {
          user: {
            select: { name: true, email: true, phone: true }
          },
          workshop: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json(appointments);
    } else {
      // It's a standard user, fetch their booked appointments
      const appointments = await prisma.appointment.findMany({
        where: { userId },
        include: {
          workshop: {
            select: { name: true, specialty: true, priceEstimate: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(appointments);
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update appointment status
router.patch('/appointments/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const userId = req.user!.id;
    const role = req.user!.role;

    if (role === 'WORKSHOP_OWNER') {
      const workshop = await prisma.workshop.findFirst({
        where: { id: appointment.workshopId, ownerId: userId }
      });
      if (!workshop) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    } else {
      if (appointment.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update appointment progress (0-100)
router.patch('/appointments/:id/progress', authenticateToken, requireRole('WORKSHOP_OWNER'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { progress } = req.body;

    if (progress === undefined || isNaN(Number(progress)) || Number(progress) < 0 || Number(progress) > 100) {
      return res.status(400).json({ error: 'Progress must be a number between 0 and 100' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify ownership
    const workshop = await prisma.workshop.findFirst({
      where: { id: appointment.workshopId, ownerId: req.user!.id }
    });
    if (!workshop) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { progress: Number(progress) }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
