import { Router } from 'express';
import prisma from '../prismaClient';
import { authenticateToken, requireRole } from '../middleware/auth';
import { getCache, setCache, clearCache } from '../redisClient';

const router = Router();

// GET all spare parts
router.get('/', async (req, res) => {
  try {
    const { category, search, cursor, take } = req.query;
    
    // Create cache key based on query params
    const cacheKey = `parts:all:cat=${category || 'All'}:search=${search || ''}:cursor=${cursor || ''}:take=${take || ''}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    let whereClause: any = {};
    if (category && category !== 'All') {
      whereClause.category = category;
    }
    if (search) {
      whereClause.name = {
        contains: String(search),
        mode: 'insensitive',
      };
    }

    const parts = await prisma.sparePart.findMany({
      where: whereClause,
      include: {
        workshop: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      // Cursor pagination logic (to be added in step 6, leaving structure ready)
      ...(take ? { take: Number(take) } : {}),
      ...(cursor ? { cursor: { id: String(cursor) }, skip: 1 } : {})
    });

    await setCache(cacheKey, parts, 300); // cache for 5 minutes
    res.json(parts);
  } catch (error) {
    console.error('Error fetching spare parts:', error);
    res.status(500).json({ error: 'Failed to fetch spare parts' });
  }
});

// POST a new spare part (Workshop Owner only)
router.post('/', authenticateToken, requireRole('WORKSHOP_OWNER'), async (req: any, res) => {
  try {
    const { name, category, price, stock, condition, image, workshopId } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: 'Name, category, and price are required' });
    }

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock) || 0;

    const part = await prisma.sparePart.create({
      data: {
        name,
        category,
        price: parsedPrice,
        stock: parsedStock,
        condition: condition || 'New',
        image: image || 'https://picsum.photos/400/300?car-part',
        workshopId: workshopId || null,
      }
    });

    await clearCache('parts:all');
    res.status(201).json(part);
  } catch (error) {
    console.error('Error creating spare part:', error);
    res.status(500).json({ error: 'Failed to create spare part' });
  }
});

// POST to order a spare part
router.post('/order', authenticateToken, async (req: any, res) => {
  try {
    const { partId, quantity } = req.body;
    const qty = parseInt(quantity) || 1;

    if (!partId) {
      return res.status(400).json({ error: 'Part ID is required' });
    }

    // Run transaction: Check part stock, check user wallet, create order, deduct wallet, deduct stock
    const order = await prisma.$transaction(async (tx) => {
      const part = await tx.sparePart.findUnique({ where: { id: partId } });
      if (!part) throw new Error('Part not found');
      if (part.stock < qty) throw new Error('Insufficient stock');

      const user = await tx.user.findUnique({ where: { id: req.user.id } });
      if (!user) throw new Error('User not found');

      const totalPrice = part.price * qty;
      if (user.walletBalance < totalPrice) throw new Error('Insufficient wallet balance');

      // Deduct wallet
      await tx.user.update({
        where: { id: user.id },
        data: { walletBalance: { decrement: totalPrice } }
      });

      // Deduct stock
      await tx.sparePart.update({
        where: { id: partId },
        data: { stock: { decrement: qty } }
      });

      // Add to Workshop owner's wallet if part belongs to a workshop
      if (part.workshopId) {
        const workshop = await tx.workshop.findUnique({ where: { id: part.workshopId } });
        if (workshop) {
           await tx.user.update({
             where: { id: workshop.ownerId },
             data: { walletBalance: { increment: totalPrice * 0.95 } } // Platform takes 5%
           });
        }
      }

      // Create order
      return await tx.partOrder.create({
        data: {
          userId: user.id,
          partId: part.id,
          quantity: qty,
          totalPrice,
          status: 'Processing',
        },
        include: {
          part: true
        }
      });
    });

    await clearCache('parts:all');
    res.status(201).json(order);
  } catch (error: any) {
    console.error('Error ordering part:', error);
    if (error.message === 'Part not found' || error.message === 'Insufficient stock' || error.message === 'Insufficient wallet balance') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to place order' });
    }
  }
});

// GET user's part orders
router.get('/orders/me', authenticateToken, async (req: any, res) => {
  try {
    const orders = await prisma.partOrder.findMany({
      where: { userId: req.user.id },
      include: {
        part: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;
