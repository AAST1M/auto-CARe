import { Router } from 'express';
import prisma from '../prismaClient';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const RATE_PER_KM = 20; // EGP per km

// ─── POST /api/wallet/topup — Add funds to wallet (any user role) ─────────────
// For WINCH_DRIVERs with commissionOwed > 0, commission is auto-deducted first.
router.post('/topup', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user!.id;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'A valid positive amount is required' });
    }

    const parsedAmount = Number(amount);

    // Fetch current user to check commission debt
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, commissionOwed: true, walletBalance: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let commissionDeducted = 0;
    let netCredit = parsedAmount;

    // Auto-deduct commission for WINCH_DRIVER if they owe
    if (user.role === 'WINCH_DRIVER' && user.commissionOwed > 0) {
      const owed = user.commissionOwed;

      if (parsedAmount >= owed) {
        // Full commission can be paid from this top-up
        commissionDeducted = owed;
        netCredit = parsedAmount - owed;
      } else {
        // Partial payment — reduce debt by top-up amount, no wallet credit
        commissionDeducted = parsedAmount;
        netCredit = 0;
      }
    }

    const currentCommissionOwed = user.commissionOwed || 0;
    const newCommissionOwed = Math.max(0, currentCommissionOwed - commissionDeducted);

    await prisma.$transaction(async (tx) => {
      // Update wallet balance and commission owed atomically
      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: { increment: netCredit },
          ...(user.role === 'WINCH_DRIVER' && { commissionOwed: newCommissionOwed })
        }
      });

      // Record the top-up transaction
      await tx.transaction.create({
        data: {
          userId,
          amount: parsedAmount,
          commission: 0,
          type: 'TopUp',
          status: 'Completed'
        }
      });

      // If commission was deducted, record a separate commission payment transaction
      if (commissionDeducted > 0) {
        await tx.transaction.create({
          data: {
            userId,
            amount: commissionDeducted,
            commission: commissionDeducted,
            type: 'Commission Payment',
            status: 'Completed'
          }
        });
      }
    });

    const updated = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true, commissionOwed: true }
    });

    res.json({
      success: true,
      newBalance: updated?.walletBalance,
      commissionOwed: updated?.commissionOwed,
      commissionDeducted,
      netCredit,
      message: commissionDeducted > 0
        ? `Commission payment of ${commissionDeducted.toFixed(2)} EGP deducted. ${netCredit > 0 ? `${netCredit.toFixed(2)} EGP added to your wallet.` : 'No remaining balance added.'}`
        : `${parsedAmount.toFixed(2)} EGP added to your wallet.`
    });
  } catch (error) {
    console.error('Wallet topup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/wallet/calculate-trip-price — Haversine distance pricing ───────
router.post('/calculate-trip-price', authenticateToken, async (req, res) => {
  try {
    const { pickupLat, pickupLng, dropLat, dropLng, ratePerKm } = req.body;

    if (
      pickupLat === undefined || pickupLng === undefined ||
      dropLat === undefined || dropLng === undefined
    ) {
      return res.status(400).json({ error: 'pickupLat, pickupLng, dropLat, dropLng are required' });
    }

    const rate = Number(ratePerKm) > 0 ? Number(ratePerKm) : RATE_PER_KM;
    const distanceKm = haversineKm(
      Number(pickupLat), Number(pickupLng),
      Number(dropLat), Number(dropLng)
    );
    const price = Math.ceil(distanceKm * rate);

    res.json({ distanceKm: Math.round(distanceKm * 10) / 10, price, ratePerKm: rate });
  } catch (error) {
    console.error('Price calc error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/wallet/settle-commission — Settle commission debt using wallet balance ───
router.post('/settle-commission', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'WINCH_DRIVER') {
      return res.status(400).json({ error: 'Only winch drivers can settle commission debts' });
    }
    const debt = user.commissionOwed;
    if (debt <= 0) {
      return res.status(400).json({ error: 'No commission debt to settle' });
    }
    const balance = user.walletBalance;
    if (balance <= 0) {
      return res.status(400).json({ error: 'Insufficient wallet balance to settle commission debt' });
    }
    const amountToSettle = Math.min(debt, balance);
    
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: { decrement: amountToSettle },
          commissionOwed: { decrement: amountToSettle }
        }
      });
      await tx.transaction.create({
        data: {
          userId,
          amount: amountToSettle,
          commission: amountToSettle,
          type: 'Commission Settlement',
          status: 'Completed'
        }
      });
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true, commissionOwed: true }
    });

    return res.json({
      success: true,
      newBalance: updatedUser?.walletBalance,
      commissionOwed: updatedUser?.commissionOwed,
      settledAmount: amountToSettle,
      message: `Successfully settled ${amountToSettle.toFixed(2)} EGP of platform commission debt.`
    });
  } catch (error) {
    console.error('Commission settlement error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/wallet/withdraw — Withdraw funds from wallet ─────────────
router.post('/withdraw', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user!.id;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'A valid positive amount is required' });
    }

    const parsedAmount = Number(amount);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.walletBalance < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: { decrement: parsedAmount }
        }
      });

      await tx.transaction.create({
        data: {
          userId,
          amount: parsedAmount,
          commission: 0,
          type: 'Withdrawal',
          status: 'Completed'
        }
      });
    });

    const updated = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true }
    });

    res.json({
      success: true,
      newBalance: updated?.walletBalance,
      message: `Withdrawal request for ${parsedAmount.toFixed(2)} EGP sent to your bank.`
    });
  } catch (error) {
    console.error('Wallet withdrawal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Haversine formula ────────────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default router;
