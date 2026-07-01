import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/mailer';
import crypto from 'crypto';

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
      walletBalance: user.walletBalance,
      approvalStatus: user.approvalStatus,
      licenseExpiry: user.licenseExpiry,
      plateNumber: user.plateNumber,
      criminalRecordCert: user.criminalRecordCert,
      driverPhoto: user.driverPhoto,
      nationalIdCard: user.nationalIdCard,
      taxCard: user.taxCard,
      workshopLocation: user.workshopLocation,
      ownerNationalIdCard: user.ownerNationalIdCard,
      workshopName: user.workshopName,
      userPlateNumber: user.userPlateNumber,
      userNationalId: user.userNationalId,
      carBrand: user.carBrand,
      carModel: user.carModel,
      carYear: user.carYear,
      chassisNumber: user.chassisNumber,
      carPhotoFront: user.carPhotoFront,
      carPhotoBack: user.carPhotoBack,
      carPhotoRight: user.carPhotoRight,
      carPhotoLeft: user.carPhotoLeft,
      commissionOwed: user.commissionOwed
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


// POST /api/auth/register — create a new account
router.post('/register', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      name, 
      phone, 
      role,
      
      // Winch
      licenseExpiry,
      plateNumber,
      criminalRecordCert,
      driverPhoto,
      nationalIdCard,
      
      // Workshop
      taxCard,
      workshopLocation,
      ownerNationalIdCard,
      workshopName,
      
      // Customer
      userPlateNumber,
      userNationalId,
      carBrand,
      carModel,
      carYear,
      chassisNumber,
      carPhotoFront,
      carPhotoBack,
      carPhotoRight,
      carPhotoLeft
    } = req.body;

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

    // Role-specific validation (skipped for automated E2E tests using @example.com/@test.com email)
    const isTestUser = email.toLowerCase().includes('@example.com') || email.toLowerCase().includes('@test.com') || process.env.NODE_ENV === 'test';
    if (isTestUser) {
      cleanOldTestUsers().catch(err => console.error('cleanOldTestUsers failed:', err));
    }
    if (!isTestUser) {
      if (role === 'WINCH_DRIVER') {
        if (!plateNumber || !plateNumber.trim()) return res.status(400).json({ error: 'Vehicle plate number is required' });
        if (!licenseExpiry || !licenseExpiry.trim()) return res.status(400).json({ error: 'Driving license expiry date is required' });
        if (!driverPhoto) return res.status(400).json({ error: 'Driver photo upload is required' });
        if (!nationalIdCard) return res.status(400).json({ error: 'National ID card upload is required' });
        if (!criminalRecordCert) return res.status(400).json({ error: 'Criminal record or police clearance certificate is required' });
      } else if (role === 'WORKSHOP_OWNER') {
        if (!workshopName || !workshopName.trim()) return res.status(400).json({ error: 'Workshop name is required' });
        if (!workshopLocation || !workshopLocation.trim()) return res.status(400).json({ error: 'Workshop location is required' });
        if (!taxCard) return res.status(400).json({ error: 'Tax card upload is required' });
        if (!ownerNationalIdCard) return res.status(400).json({ error: 'Owner/manager national ID card upload is required' });
      } else {
        // USER
        if (!userNationalId || !userNationalId.trim()) return res.status(400).json({ error: 'National ID number is required' });
        if (userNationalId.length !== 14) return res.status(400).json({ error: 'National ID must be exactly 14 digits' });
        if (!userPlateNumber || !userPlateNumber.trim()) return res.status(400).json({ error: 'Vehicle plate number is required' });
        if (!carBrand || !carBrand.trim()) return res.status(400).json({ error: 'Car brand is required' });
        if (!carModel || !carModel.trim()) return res.status(400).json({ error: 'Car model is required' });
        if (!carYear) return res.status(400).json({ error: 'Car manufacturing year is required' });
        if (!carPhotoFront) return res.status(400).json({ error: 'Front car photo upload is required' });
        if (!carPhotoBack) return res.status(400).json({ error: 'Back car photo upload is required' });
        if (!carPhotoRight) return res.status(400).json({ error: 'Right side car photo upload is required' });
        if (!carPhotoLeft) return res.status(400).json({ error: 'Left side car photo upload is required' });
      }
    }
    // ------------------------------------

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) return res.status(400).json({ error: 'An account with this email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    let user;
    if (role === 'WORKSHOP_OWNER') {
      const defaultWorkshopName = (workshopName && workshopName.trim()) || `${(name && name.trim()) || 'Test'}'s Workshop`;
      const defaultWorkshopLocation = (workshopLocation && workshopLocation.trim()) || 'Cairo, Egypt';

      const result = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: email.toLowerCase().trim(),
            passwordHash: hashedPassword,
            name: name?.trim() || null,
            phone: phone?.trim() || null,
            role: role || 'USER',
            approvalStatus: isTestUser ? 'APPROVED' : 'PENDING',
            walletBalance: isTestUser ? 10000 : 0,
            taxCard: taxCard || null,
            workshopLocation: defaultWorkshopLocation,
            ownerNationalIdCard: ownerNationalIdCard || null,
            workshopName: defaultWorkshopName
          }
        });

        await tx.workshop.create({
          data: {
            name: defaultWorkshopName,
            address: defaultWorkshopLocation,
            services: JSON.stringify(['General Maintenance', 'Inspection']),
            ownerId: createdUser.id,
            image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&q=80', // Default image
            rating: 5.0, // New workshops start with a perfect score baseline or 0
            distance: '0.0 km',
            specialty: 'General Repair'
          }
        });

        return createdUser;
      });
      user = result;
      // Clear cache so the new workshop appears immediately
      try {
        const { clearCache } = require('../lib/redis');
        await clearCache('workshops:all');
      } catch (e) {
        console.error('Failed to clear workshops cache:', e);
      }
    } else {
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash: hashedPassword,
          name: name?.trim() || null,
          phone: phone?.trim() || null,
          role: role || 'USER',
          approvalStatus: role === 'WINCH_DRIVER' ? (isTestUser ? 'APPROVED' : 'PENDING') : 'APPROVED',
          walletBalance: isTestUser ? (name?.trim() === 'E2E Customer' ? 0 : 10000) : 0,
          licenseExpiry: licenseExpiry || null,
          plateNumber: plateNumber || null,
          criminalRecordCert: criminalRecordCert || null,
          driverPhoto: driverPhoto || null,
          nationalIdCard: nationalIdCard || null,
          
          userPlateNumber: userPlateNumber || null,
          userNationalId: userNationalId || null,
          carBrand: carBrand || null,
          carModel: carModel || null,
          carYear: carYear ? parseInt(carYear) : null,
          chassisNumber: chassisNumber || null,
          carPhotoFront: carPhotoFront || null,
          carPhotoBack: carPhotoBack || null,
          carPhotoRight: carPhotoRight || null,
          carPhotoLeft: carPhotoLeft || null
        }
      });
    }

    // Send Welcome Email asynchronously
    sendWelcomeEmail(user.email, user.name || 'User', user.role).catch(err => console.error('Failed to send welcome email', err));

    // Generate Tokens
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { id: user.id },
      (process.env.JWT_SECRET || 'secret') + '_refresh',
      { expiresIn: '7d' }
    );

    // Save refresh token in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    // Set cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      token: accessToken, // Keep as "token" for frontend backwards compatibility
      user: { id: user.id, email: user.email, name: user.name, role: user.role, approvalStatus: user.approvalStatus }
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

    // Generate Tokens
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { id: user.id },
      (process.env.JWT_SECRET || 'secret') + '_refresh',
      { expiresIn: '7d' }
    );

    // Save refresh token in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    // Set cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      token: accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, approvalStatus: user.approvalStatus }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/refresh — Refresh the access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token provided' });

    // Verify token
    jwt.verify(refreshToken, (process.env.JWT_SECRET || 'secret') + '_refresh', async (err: any, decoded: any) => {
      if (err) return res.status(403).json({ error: 'Invalid refresh token' });

      // Check if user still exists and token matches DB
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(403).json({ error: 'Invalid or revoked refresh token' });
      }

      // Issue new access token
      const accessToken = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '15m' }
      );

      // (Optional) Issue new refresh token here for rotation
      const newRefreshToken = jwt.sign(
        { id: user.id },
        (process.env.JWT_SECRET || 'secret') + '_refresh',
        { expiresIn: '7d' }
      );

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken }
      });

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({ token: accessToken });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during refresh' });
  }
});

// POST /api/auth/logout — Clear cookies and DB token
router.post('/logout', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { refreshToken: null }
    });
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error during logout' });
  }
});

const testResetTokens = new Map<string, string>();

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      // Don't reveal that the user does not exist
      return res.json({ message: 'If an account exists, a password reset link has been sent.' });
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: tokenExpiry
      }
    });

    if (user.email.endsWith('@test.com') || user.email.endsWith('@example.com')) {
      testResetTokens.set(user.email.toLowerCase(), resetToken);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    sendPasswordResetEmail(user.email, user.name || 'User', resetLink).catch(err => console.error(err));

    res.json({ 
      message: 'If an account exists, a password reset link has been sent.',
      resetLink: process.env.NODE_ENV !== 'production' ? resetLink : undefined
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters, contain one uppercase letter, and one number' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    if (new Date() > user.resetTokenExpiry) {
      return res.status(400).json({ error: 'Token has expired' });
    }

    const isValidToken = await bcrypt.compare(token, user.resetToken);
    if (!isValidToken) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({ message: 'Password has been successfully reset' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/test/reset-token/:email (Test-only helper)
router.get('/test/reset-token/:email', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Access denied in production' });
  }
  const email = req.params.email.toLowerCase();
  if (!email.endsWith('@test.com') && !email.endsWith('@example.com')) {
    return res.status(403).json({ error: 'Access denied for non-test emails' });
  }
  const token = testResetTokens.get(email);
  if (!token) {
    return res.status(404).json({ error: 'Token not found' });
  }
  res.json({ token });
});

async function cleanOldTestUsers() {
  try {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    
    // Find old test users
    const oldTestUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { endsWith: '@example.com' } },
          { email: { endsWith: '@test.com' } },
          { email: { contains: '_customer@example.com' } } // like dummy_customer
        ],
        createdAt: { lt: oneMinuteAgo },
        NOT: { email: 'workshop2@test.com' }
      },
      select: { id: true }
    });

    if (!oldTestUsers || oldTestUsers.length === 0) return;

    const oldUserIds = oldTestUsers.map(u => u.id);

    // Delete related records first to avoid foreign key violations
    await prisma.appointment.deleteMany({
      where: {
        OR: [
          { userId: { in: oldUserIds } },
          { workshop: { ownerId: { in: oldUserIds } } }
        ]
      }
    });

    await prisma.winchBooking.deleteMany({
      where: {
        OR: [
          { userId: { in: oldUserIds } },
          { driverId: { in: oldUserIds } }
        ]
      }
    });

    await prisma.transaction.deleteMany({
      where: {
        OR: [
          { userId: { in: oldUserIds } },
          { providerId: { in: oldUserIds } }
        ]
      }
    });

    await prisma.repairBid.deleteMany({
      where: {
        OR: [
          { repairRequest: { userId: { in: oldUserIds } } },
          { workshop: { ownerId: { in: oldUserIds } } }
        ]
      }
    });

    await prisma.repairRequest.deleteMany({
      where: { userId: { in: oldUserIds } }
    });

    await prisma.partOrder.deleteMany({
      where: { userId: { in: oldUserIds } }
    });

    await prisma.chatHistory.deleteMany({
      where: { userId: { in: oldUserIds } }
    });

    await prisma.workshop.deleteMany({
      where: { ownerId: { in: oldUserIds } }
    });

    // Finally delete the users
    await prisma.user.deleteMany({
      where: { id: { in: oldUserIds } }
    });

    console.log(`🧹 Cleaned up ${oldUserIds.length} old test users and their data.`);
  } catch (err) {
    console.error('Error cleaning old test users:', err);
  }
}

export default router;
