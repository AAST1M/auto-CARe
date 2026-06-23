import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// Endpoint to securely call Gemini
router.post('/diagnose', authenticateToken, async (req, res) => {
  const { symptom, media, language = 'ar' } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Return mock response if no API key is configured
    return res.json({ response: "(Backend Simulation) Based on '" + symptom + "', please check the hoses for vacuum leaks." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Strict JSON Schema Definition
    const diagnosticSchema = {
      type: "OBJECT",
      properties: {
        reply: {
          type: "STRING",
          description: "The professional mechanical advice or diagnosis."
        },
        action: {
          type: "STRING",
          description: "The required next step based on vehicle mobility. Must be 'WINCH' or 'ASK_MOBILITY' if unknown.",
          enum: ["WINCH", "ASK_MOBILITY"]
        }
      },
      required: ["reply", "action"]
    };

    const targetLanguage = language === 'ar' ? 'Arabic' : 'English';

    const systemPrompt = `You are Auto-Care AI, a highly professional expert automotive diagnostic assistant.
Your goal is to provide excellent, accurate, and structured mechanical advice based on the user's input (text, image, or audio).

CRITICAL RULES:
1. You MUST ALWAYS output valid JSON matching the provided schema.
2. If the user does not specify if the car is moving, set action to "ASK_MOBILITY" and ask them "Is your car currently moving or not?" at the end of your reply.
3. If the user's car is NOT moving, broken down, or requires towing, set action to "WINCH".
4. You MUST ALWAYS write your 'reply' (including the question about mobility) in the ${targetLanguage} language ONLY. Do not use any other languages in your reply.
5. CAREFULLY LISTEN to any audio provided: if it contains car/motor/system sounds, analyze the noise (e.g. clicking, grinding, squealing) to diagnose the problem. If it contains voice, listen to the user's spoken symptoms.
6. CAREFULLY LOOK at any photos provided: analyze dashboards for warning lights, or engine bays/parts for leaks, wear, or damage.

The user is reporting: "${symptom}". Analyze the input (and any attached media) and respond professionally.`;

    const parts: any[] = [{ text: systemPrompt }];    
    if (media) {
      parts.push({
        inlineData: {
          mimeType: media.mimeType,
          data: media.data
        }
      });
    }

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: parts,
        config: {
          responseMimeType: "application/json",
          responseSchema: diagnosticSchema,
        }
      });
    } catch (e: any) {
      console.log("gemini-2.5-flash failed, falling back to gemini-2.0-flash", e.message);
      response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: parts,
        config: {
          responseMimeType: "application/json",
          responseSchema: diagnosticSchema,
        }
      });
    }

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Gemini API Error:", error.message || error);
    
    let mockReply = "(Simulated - AI Core Offline) I recommend checking the hoses for vacuum leaks.";
    let mockAction = "ASK_MOBILITY";
    const userText = (symptom || "").toLowerCase();

    if (userText.includes("not moving") || userText.includes("broken") || userText.includes("stuck") || userText.includes("tow")) {
      mockReply = "(Simulated) Since your car is not moving, I recommend requesting a Winch immediately.";
      mockAction = "WINCH";
    } else if (userText.includes("hi") || userText.includes("hello") || userText.includes("hey")) {
      mockReply = "(Simulated) Hello! How can I help you today? Is your car currently moving?";
      mockAction = "ASK_MOBILITY";
    }

    return res.json({ 
      reply: mockReply, 
      action: mockAction 
    });
  }
});

// Endpoint to identify a spare part from an image
router.post('/identify-part', authenticateToken, async (req, res) => {
  const { media } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.json({ partName: 'Brake Pads (Ceramic)', description: '(Backend Simulation) Looks like ceramic brake pads.' });
  }

  if (!media) {
    return res.status(400).json({ error: 'Image media is required.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const identificationSchema = {
      type: "OBJECT",
      properties: {
        partName: {
          type: "STRING",
          description: "The name of the car part identified. Match common categories if possible (e.g., Brake Pads, Oil Filter, Spark Plugs, Car Battery, Alternator, Tire, etc.). Keep it short."
        },
        description: {
          type: "STRING",
          description: "A short description of what you see."
        }
      },
      required: ["partName", "description"]
    };

    const systemPrompt = `You are an expert automotive spare parts specialist. Analyze the provided image of a car part and identify it.`;

    const parts: any[] = [
      { text: systemPrompt },
      {
        inlineData: {
          mimeType: media.mimeType,
          data: media.data
        }
      }
    ];

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: parts,
        config: {
          responseMimeType: "application/json",
          responseSchema: identificationSchema,
        }
      });
    } catch (e: any) {
      console.log("gemini-2.5-flash failed, falling back to gemini-2.0-flash", e.message);
      response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: parts,
        config: {
          responseMimeType: "application/json",
          responseSchema: identificationSchema,
        }
      });
    }

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Gemini API Error (Identify Part):", error.message);
    if (error.status === 429 || (error.message && error.message.includes("429"))) {
      return res.json({ 
        partName: 'Brake Pads (Ceramic)', 
        description: '(Simulated due to AI Quota Limit) Looks like ceramic brake pads.' 
      });
    }
    res.status(500).json({ error: 'Connection to AI Core interrupted.' });
  }
});

export default router;
