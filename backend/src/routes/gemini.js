"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const genai_1 = require("@google/genai");
const router = (0, express_1.Router)();
// Endpoint to securely call Gemini
router.post('/diagnose', auth_1.authenticateToken, async (req, res) => {
    const { symptom, media } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        // Return mock response if no API key is configured
        return res.json({ response: "(Backend Simulation) Based on '" + symptom + "', please check the hoses for vacuum leaks." });
    }
    try {
        const ai = new genai_1.GoogleGenAI({ apiKey });
        const parts = [{ text: `You are Auto-Care AI, an expert automotive mechanic assistant. The user is reporting: "${symptom}". Analyze the input (text, image, or audio) and provide a concise technical diagnosis and a recommendation.` }];
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
    }
    catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: 'Connection to AI Core interrupted.' });
    }
});
exports.default = router;
