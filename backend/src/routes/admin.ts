import { Router, Response } from 'express';
import prisma from '../prismaClient';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Middleware to authorize admin only
const requireAdmin = (req: AuthRequest, res: Response, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  next();
};

// Get platform stats
router.get('/stats', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    // 1. Count users by role
    const users = await prisma.user.findMany({
      select: { role: true }
    });
    const roleCounts = {
      USER: 0,
      WINCH_DRIVER: 0,
      WORKSHOP_OWNER: 0,
      ADMIN: 0
    };
    users.forEach(u => {
      if (u.role in roleCounts) {
        roleCounts[u.role as keyof typeof roleCounts]++;
      }
    });

    // 2. Count workshops
    const workshopCount = await prisma.workshop.count();

    // 3. Workshop Appointments stats
    const appointments = await prisma.appointment.findMany({
      where: {
        status: { in: ['Completed', 'Confirmed', 'Checked-In'] }
      },
      select: { price: true, status: true }
    });

    const activeApptCount = await prisma.appointment.count({
      where: {
        status: { in: ['Pending', 'Confirmed', 'Checked-In'] }
      }
    });

    // 4. Winch Bookings stats
    const winchBookings = await prisma.winchBooking.findMany({
      where: { status: 'Completed' },
      select: { price: true }
    });

    // Calculations
    const workshopRevenue = appointments.reduce((sum, item) => sum + item.price, 0);
    const winchRevenue = winchBookings.reduce((sum, item) => sum + item.price, 0);
    const totalRevenue = workshopRevenue + winchRevenue;
    
    // 10% platform commission
    const totalCommission = totalRevenue * 0.1;

    res.json({
      users: roleCounts,
      workshops: workshopCount,
      revenue: totalRevenue,
      commission: totalCommission,
      activeAppointments: activeApptCount,
      completedAppointments: appointments.filter(a => a.status === 'Completed').length,
      completedWinchBookings: winchBookings.length,
      systemHealth: 'OK'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all transactions
router.get('/transactions', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    // Fetch workshop appointments
    const appointments = await prisma.appointment.findMany({
      include: {
        workshop: {
          select: { name: true }
        },
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch winch bookings
    const winchBookings = await prisma.winchBooking.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Fetch specific users needed for winch bookings (since there's no direct Prisma relation in the schema for it)
    const winchUserIds = [...new Set(winchBookings.map(wb => wb.userId))];
    const winchUsers = await prisma.user.findMany({
      where: { id: { in: winchUserIds } },
      select: { id: true, name: true, email: true }
    });
    const winchUserMap = new Map(winchUsers.map(u => [u.id, u.name || u.email]));

    // Format workshop transactions
    const formattedAppts = appointments.map(appt => ({
      id: appt.id,
      type: 'Workshop Booking',
      date: appt.createdAt,
      customerName: appt.user ? (appt.user.name || appt.user.email) : 'Unknown User',
      providerName: appt.workshop.name,
      amount: appt.price,
      commission: appt.price * 0.1,
      status: appt.status
    }));

    // Format winch transactions
    const formattedWinch = winchBookings.map(wb => ({
      id: wb.id,
      type: 'Winch Ride',
      date: wb.createdAt,
      customerName: winchUserMap.get(wb.userId) || 'Unknown User',
      providerName: wb.driverName,
      amount: wb.price,
      commission: wb.price * 0.1,
      status: wb.status
    }));

    // Combine and sort by date descending
    const allTransactions = [...formattedAppts, ...formattedWinch].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    res.json(allTransactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        walletBalance: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
