import { Router } from 'express';
import prisma from '../prismaClient';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

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

// Create a winch offer (WINCH_DRIVER only)
router.post('/offers', authenticateToken, requireRole('WINCH_DRIVER'), async (req: any, res) => {
  try {
    const { driverName, price, eta, vehicle } = req.body;

    if (!driverName || !driverName.trim()) {
      return res.status(400).json({ error: 'Driver name is required' });
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({ error: 'A valid price is required' });
    }
    if (!eta || !eta.trim()) {
      return res.status(400).json({ error: 'ETA is required' });
    }
    if (!vehicle || !vehicle.trim()) {
      return res.status(400).json({ error: 'Vehicle type is required' });
    }

    const offer = await prisma.winchOffer.create({
      data: { 
        driverId: req.user!.id,
        driverName: driverName.trim(), 
        price: Number(price), 
        eta: eta.trim(), 
        vehicle: vehicle.trim() 
      }
    });
    res.json(offer);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a winch booking (when user accepts offer) — authenticated users only
router.post('/bookings', authenticateToken, async (req: any, res) => {
  try {
    const { driverId, driverName, price, vehicle } = req.body;

    // Validation
    if (!driverId || !driverId.trim()) {
      return res.status(400).json({ error: 'Driver ID is required' });
    }
    if (!driverName || !driverName.trim()) {
      return res.status(400).json({ error: 'Driver name is required' });
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({ error: 'A valid price is required' });
    }
    if (!vehicle || !vehicle.trim()) {
      return res.status(400).json({ error: 'Vehicle type is required' });
    }
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const parsedPrice = parseFloat(price);

    // Check user balance
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.walletBalance < parsedPrice) {
      return res.status(402).json({ error: 'Insufficient funds. Please top up your wallet.' });
    }

    // Process Transaction
    await prisma.$transaction(async (tx) => {
      // Deduct full amount
      await tx.user.update({
        where: { id: user.id },
        data: { walletBalance: { decrement: parsedPrice } }
      });

      // Add 90% to winch driver
      await tx.user.update({
        where: { id: driverId },
        data: { walletBalance: { increment: parsedPrice * 0.9 } }
      });
    });

    const booking = await prisma.winchBooking.create({
      data: {
        userId: req.user.id,
        driverId: driverId.trim(),
        driverName: driverName.trim(),
        price: parsedPrice,
        vehicle: vehicle.trim(),
        status: 'Completed'
      }
    });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's winch bookings
router.get('/bookings/me', authenticateToken, async (req: any, res) => {
  try {
    const role = req.user.role;
    let bookings;
    
    if (role === 'WINCH_DRIVER') {
      bookings = await prisma.winchBooking.findMany({
        where: { driverId: req.user.id },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      bookings = await prisma.winchBooking.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' }
      });
    }
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update location for a winch booking
router.post('/location', authenticateToken, async (req: any, res) => {
  try {
    const { bookingId, lat, lng } = req.body;
    if (!bookingId || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'bookingId, lat, and lng are required' });
    }

    const booking = await prisma.winchBooking.findUnique({ where: { id: bookingId } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Verify participant
    if (booking.userId !== req.user.id && booking.driverId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const isDriver = booking.driverId === req.user.id;
    
    const updated = await prisma.winchBooking.update({
      where: { id: bookingId },
      data: isDriver 
        ? { driverLat: lat, driverLng: lng }
        : { userLat: lat, userLng: lng }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get location for a winch booking
router.get('/location/:id', authenticateToken, async (req: any, res) => {
  try {
    const booking = await prisma.winchBooking.findUnique({
      where: { id: req.params.id }
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.userId !== req.user.id && booking.driverId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({
      id: booking.id,
      status: booking.status,
      userLat: booking.userLat,
      userLng: booking.userLng,
      driverLat: booking.driverLat,
      driverLng: booking.driverLng
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
