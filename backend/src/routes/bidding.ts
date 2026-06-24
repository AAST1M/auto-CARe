import express from 'express';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import prisma from '../prismaClient';

const router = express.Router();

// ── USER: Post a Repair Request ────────────────────────────────────────────────
router.post('/request', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { carDetails, issue, imageUrl } = req.body;
    if (!carDetails || !issue) return res.status(400).json({ error: 'Car details and issue are required' });

    const request = await prisma.repairRequest.create({
      data: {
        userId: req.user!.id,
        carDetails,
        issue,
        imageUrl,
      },
      include: { user: { select: { name: true } } }
    });

    // We rely on the frontend to emit 'new_repair_request' socket event after receiving this,
    // or we can attach io to req and emit it directly from here if we had `req.app.get('io')`.
    // For simplicity, we'll return it and let frontend broadcast it via its socket connection.
    res.status(201).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create repair request' });
  }
});

// ── GET: List Open Requests (For Workshops) ────────────────────────────────────
router.get('/requests', authenticateToken, requireRole('WORKSHOP_OWNER'), async (req: AuthRequest, res) => {
  try {
    const ownerUser = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!ownerUser || ownerUser.approvalStatus !== 'APPROVED') {
      return res.status(403).json({ error: 'Your account is pending admin approval or has been rejected.' });
    }

    const requests = await prisma.repairRequest.findMany({
      where: { status: 'Open' },
      include: { user: { select: { name: true } }, bids: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET: User's Own Requests (For Users) ───────────────────────────────────────
router.get('/my-requests', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const requests = await prisma.repairRequest.findMany({
      where: { userId: req.user!.id },
      include: { 
        bids: { 
          include: { workshop: { select: { name: true, rating: true, image: true } } } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── WORKSHOP: Submit a Bid ─────────────────────────────────────────────────────
router.post('/bid', authenticateToken, requireRole('WORKSHOP_OWNER'), async (req: AuthRequest, res) => {
  try {
    const ownerUser = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!ownerUser || ownerUser.approvalStatus !== 'APPROVED') {
      return res.status(403).json({ error: 'Your account is pending admin approval or has been rejected.' });
    }

    const { repairRequestId, price, comment } = req.body;
    
    // Find the workshop id of the logged in owner
    let workshop = await prisma.workshop.findFirst({ where: { ownerId: req.user!.id } });
    if (!workshop) {
      const ownerUser = await prisma.user.findUnique({ where: { id: req.user!.id } });
      const workshopName = ownerUser?.name ? `${ownerUser.name}'s Workshop` : 'My Workshop';
      // Auto-create a default workshop for this owner if they haven't set one up
      workshop = await prisma.workshop.create({
        data: {
          ownerId: req.user!.id,
          name: workshopName,
          services: 'General Repair',
          address: 'Cairo, Egypt'
        }
      });
    }

    const bid = await prisma.repairBid.create({
      data: {
        repairRequestId,
        workshopId: workshop.id,
        price,
        comment
      },
      include: { workshop: { select: { name: true, rating: true, image: true } } }
    });

    res.status(201).json(bid);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit bid' });
  }
});

// ── USER: Accept a Bid ─────────────────────────────────────────────────────────
router.post('/accept-bid', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { bidId } = req.body;
    
    const bid = await prisma.repairBid.findUnique({ 
      where: { id: bidId },
      include: { repairRequest: true, workshop: true }
    });
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.repairRequest.userId !== req.user!.id) return res.status(403).json({ error: 'Unauthorized' });

    await prisma.$transaction(async (tx) => {
      // 1. Mark request as Accepted
      await tx.repairRequest.update({
        where: { id: bid.repairRequestId },
        data: { status: 'Accepted' }
      });
      // 2. Mark bid as Accepted
      await tx.repairBid.update({
        where: { id: bidId },
        data: { status: 'Accepted' }
      });
      // 3. Reject other bids
      await tx.repairBid.updateMany({
        where: { repairRequestId: bid.repairRequestId, id: { not: bidId } },
        data: { status: 'Rejected' }
      });
      // 4. Create an Appointment
      await tx.appointment.create({
        data: {
          userId: req.user!.id,
          workshopId: bid.workshopId,
          serviceType: 'Bidded Repair',
          carDetails: bid.repairRequest.carDetails,
          time: new Date().toISOString(),
          price: bid.price,
          status: 'Pending'
        }
      });
    });

    res.json({ message: 'Bid accepted successfully', workshopId: bid.workshopId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
