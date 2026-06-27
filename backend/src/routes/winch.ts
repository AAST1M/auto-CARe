import { Router } from 'express';
import prisma from '../prismaClient';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Get available winch offers
router.get('/offers', authenticateToken, async (req, res) => {
  try {
    const offers = await prisma.winchOffer.findMany();
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a winch offer (WINCH_DRIVER only)
// Blocked if driver has unpaid commission
router.post('/offers', authenticateToken, requireRole('WINCH_DRIVER'), async (req: any, res) => {
  try {
    const { driverName, price, eta, vehicle } = req.body;

    // ─── Commission Debt Check ─────────────────────────────────────────────
    const driver = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { commissionOwed: true }
    });
    if (driver && driver.commissionOwed > 0) {
      return res.status(403).json({
        error: `You have an unpaid commission of ${driver.commissionOwed.toFixed(2)} EGP. Please pay it before going online.`,
        commissionOwed: driver.commissionOwed,
        code: 'COMMISSION_DEBT'
      });
    }
    // ──────────────────────────────────────────────────────────────────────

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

// ─── POST /api/winch/bookings — Electronic/wallet payment ride ────────────────
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

    // Process Transaction — deduct from customer, give 90% to driver
    await prisma.$transaction(async (tx) => {
      // Deduct full amount from customer
      await tx.user.update({
        where: { id: user.id },
        data: { walletBalance: { decrement: parsedPrice } }
      });

      // Add 90% to winch driver (10% is platform commission, auto-collected)
      await tx.user.update({
        where: { id: driverId },
        data: { walletBalance: { increment: parsedPrice * 0.9 } }
      });

      // Record platform commission transaction
      await tx.transaction.create({
        data: {
          userId: user.id,
          providerId: driverId,
          amount: parsedPrice,
          commission: parsedPrice * 0.1,
          type: 'Winch Ride',
          status: 'Completed'
        }
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

// ─── POST /api/winch/bookings/cash — Cash payment ride ───────────────────────
// Customer paid cash directly to driver. Platform records the commission debt.
router.post('/bookings/cash', authenticateToken, async (req: any, res) => {
  try {
    const { driverId, driverName, price, vehicle } = req.body;

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

    const parsedPrice = parseFloat(price);
    const commissionAmount = parseFloat((parsedPrice * 0.1).toFixed(2));

    // Record cash booking and add commission debt to driver
    const [booking] = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.winchBooking.create({
        data: {
          userId: req.user!.id,
          driverId: driverId.trim(),
          driverName: driverName.trim(),
          price: parsedPrice,
          vehicle: vehicle.trim(),
          status: 'Completed'
        }
      });

      // Increment commission owed on driver
      await tx.user.update({
        where: { id: driverId },
        data: { commissionOwed: { increment: commissionAmount } }
      });

      // Record the pending commission transaction
      await tx.transaction.create({
        data: {
          userId: req.user!.id,
          providerId: driverId,
          amount: parsedPrice,
          commission: commissionAmount,
          type: 'Winch Ride (Cash)',
          status: 'Commission Pending'
        }
      });

      return [newBooking];
    });

    res.json({
      ...booking,
      commissionCharged: commissionAmount,
      message: `Cash ride recorded. Driver owes ${commissionAmount} EGP in platform commission.`
    });
  } catch (error) {
    console.error('Cash booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/winch/commission-status — Driver checks own commission debt ─────
router.get('/commission-status', authenticateToken, requireRole('WINCH_DRIVER'), async (req: any, res) => {
  try {
    const driver = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { commissionOwed: true, walletBalance: true }
    });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json({
      commissionOwed: driver.commissionOwed,
      walletBalance: driver.walletBalance,
      canGoOnline: driver.commissionOwed <= 0
    });
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
      driverLng: booking.driverLng,
      destLat: booking.destLat,
      destLng: booking.destLng,
      price: booking.price,
      driverName: booking.driverName,
      vehicle: booking.vehicle
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get winch booking history
router.get('/history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    
    let whereClause = {};
    if (role === 'WINCH_DRIVER') {
      whereClause = { driverId: userId };
    } else {
      whereClause = { userId: userId };
    }

    const bookings = await prisma.winchBooking.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching history' });
  }
});

export default router;
