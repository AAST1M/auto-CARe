import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Protect all chat routes
router.use(authenticateToken);

// Get chat history for a user
router.get('/', async (req, res) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    
    const { cursor, take } = req.query;

    const chats = await prisma.chatHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }, // Order descending to get newest first
      ...(take ? { take: Number(take) } : { take: 50 }), // default take 50
      ...(cursor ? { cursor: { id: String(cursor) }, skip: 1 } : {})
    });

    // Reverse to send chronological order to frontend
    res.json(chats.reverse());
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Server error fetching chat history' });
  }
});

// Save a new chat message
router.post('/', async (req, res) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { role, content, mediaType, mediaData } = req.body;

    const chat = await prisma.chatHistory.create({
      data: {
        userId,
        role,
        content,
        mediaType,
        mediaData
      }
    });
    
    res.status(201).json(chat);
  } catch (error) {
    console.error('Error saving chat message:', error);
    res.status(500).json({ error: 'Server error saving chat message' });
  }
});

// Clear chat history
router.delete('/', async (req, res) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    await prisma.chatHistory.deleteMany({
      where: { userId }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    res.status(500).json({ error: 'Server error deleting chat history' });
  }
});

export default router;
