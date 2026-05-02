import { Router } from 'express';
import prisma from '../prismaClient';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all workshops
router.get('/', async (req, res) => {
  try {
    const workshops = await prisma.workshop.findMany();
    res.json(workshops);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new workshop
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  if (req.user?.role !== 'WORKSHOP_OWNER') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const { name, services, address, hours, description } = req.body;
    const workshop = await prisma.workshop.create({
      data: {
        name,
        services: JSON.stringify(services), // Storing array as string for sqlite simplicity
        address,
        hours,
        description,
        ownerId: req.user.id
      }
    });
    res.json(workshop);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Book an appointment
router.post('/:id/book', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { serviceType, time, carDetails, price } = req.body;
    
    const appointment = await prisma.appointment.create({
      data: {
        userId: req.user!.id,
        workshopId: id as string,
        serviceType,
        time,
        carDetails,
        price
      }
    });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
