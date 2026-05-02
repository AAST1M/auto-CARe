import { Router } from 'express';
import prisma from '../prismaClient';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get available winch offers
router.get('/offers', async (req, res) => {
  try {
    const offers = await prisma.winchOffer.findMany();
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a winch offer (driver)
router.post('/offers', authenticateToken, async (req: any, res) => {
  if (req.user?.role !== 'WINCH_DRIVER') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    const { driverName, price, eta, vehicle } = req.body;
    const offer = await prisma.winchOffer.create({
      data: {
        driverName,
        price,
        eta,
        vehicle
      }
    });
    res.json(offer);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
