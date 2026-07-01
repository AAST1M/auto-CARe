import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { getAdminStats, getAdminTransactions, getAdminUsers, getDriverCommissions } from '../services/adminService';
import prisma from '../prismaClient';

const router = Router();

// Get platform stats
router.get('/stats', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const stats = await getAdminStats();
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all transactions
router.get('/transactions', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const transactions = await getAdminTransactions();
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users
router.get('/users', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const users = await getAdminUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/admin/commission — Get all winch drivers with pending commission ─
router.get('/commission', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const drivers = await getDriverCommissions();
    res.json(drivers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PATCH /api/admin/users/:id/commission — Admin sets commission amount ──────
router.patch('/users/:id/commission', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { commissionOwed } = req.body;

    if (commissionOwed === undefined || isNaN(Number(commissionOwed)) || Number(commissionOwed) < 0) {
      return res.status(400).json({ error: 'A valid non-negative commission amount is required' });
    }

    // Verify it's a winch driver
    const driver = await prisma.user.findUnique({
      where: { id: id as string },
      select: { role: true, name: true, email: true }
    });
    if (!driver) return res.status(404).json({ error: 'User not found' });
    if (driver.role !== 'WINCH_DRIVER') {
      return res.status(400).json({ error: 'Commission can only be set for winch drivers' });
    }

    const updated = await prisma.user.update({
      where: { id: id as string },
      data: { commissionOwed: parseFloat(Number(commissionOwed).toFixed(2)) },
      select: { id: true, email: true, name: true, role: true, commissionOwed: true }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve user
router.patch('/users/:id/approve', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.user.update({
      where: { id: id as string },
      data: { approvalStatus: 'APPROVED' },
      select: { id: true, email: true, name: true, role: true, approvalStatus: true }
    });
    
    // Clear workshops cache so newly approved workshops show up
    if (updated.role === 'WORKSHOP_OWNER') {
      const { clearCache } = require('../lib/redis');
      await clearCache('workshops:all').catch(console.error);
    }
    
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject user
router.patch('/users/:id/reject', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.user.update({
      where: { id: id as string },
      data: { approvalStatus: 'REJECTED' },
      select: { id: true, email: true, name: true, role: true, approvalStatus: true }
    });
    
    // Clear workshops cache so rejected workshops are hidden
    if (updated.role === 'WORKSHOP_OWNER') {
      const { clearCache } = require('../lib/redis');
      await clearCache('workshops:all').catch(console.error);
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
