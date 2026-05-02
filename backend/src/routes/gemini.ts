import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// Endpoint to securely call Gemini
router.post('/diagnose', authenticateToken, async (req, res) => {
  const { symptom, media } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Return mock response if no API key is configured
    return res.json({ response: "(Backend Simulation) Based on '" + symptom + "', please check the hoses for vacuum leaks." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const parts: any[] = [{ text: `You are Auto-Care AI, an expert automotive mechanic assistant. The user is reporting: "${symptom}". Analyze the input (text, image, or audio) and provide a concise technical diagnosis and a recommendation.` }];
    
    if (media) {
      parts.push({
        inlineData: {
          mimeType: media.mimeType,
          data: media.data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts }
    });

    res.json({ response: response.text || "I'm having trouble analyzing that right now." });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: 'Connection to AI Core interrupted.' });
  }
});

export default router;
