import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/auth/me — returns the current authenticated user's profile
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      gender: user.gender,
      dob: user.dob,
      walletBalance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/auth/me — update the current user's profile
router.patch('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, phone, gender, dob } = req.body;

    // Server-side validation
    if (name !== undefined && name.trim().length < 3) {
      return res.status(400).json({ error: 'Name must be at least 3 characters' });
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(gender !== undefined && { gender }),
        ...(dob !== undefined && { dob }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        gender: true,
        dob: true,
        walletBalance: true
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/wallet/topup — Add funds to wallet (simulating payment gateway)
router.post('/wallet/topup', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'A valid amount is required' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        walletBalance: { increment: Number(amount) }
      },
      select: {
        id: true, email: true, name: true, role: true, walletBalance: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Server error during top-up' });
  }
});

// POST /api/auth/register — create a new account
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;

    // --- Server-side validation ---
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number' });
    }
    // ------------------------------------

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) return res.status(400).json({ error: 'An account with this email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash: hashedPassword,
        name: name?.trim() || null,
        phone: phone?.trim() || null,
        role: role || 'USER'
      }
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

export default router;
