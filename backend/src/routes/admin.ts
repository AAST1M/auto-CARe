import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { getAdminStats, getAdminTransactions, getAdminUsers } from '../services/adminService';

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

export default router;
