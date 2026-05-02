import { GoogleGenAI } from "@google/genai";

// Initialize the client.
const apiKey = process.env.API_KEY || 'mock-key'; 
const ai = new GoogleGenAI({ apiKey });

export interface MediaInput {
  mimeType: string;
  data: string; // Base64 string
}

export const diagnoseCarIssue = async (symptom: string, media?: MediaInput): Promise<string> => {
  if (apiKey === 'mock-key') {
    // Simulation for prototype if no key is provided
    return new Promise((resolve) => {
      setTimeout(() => {
        if (media?.mimeType.startsWith('image')) {
             resolve(`(AI Simulation) Analyzing the visual data... I've detected a warning light on your dashboard corresponding to the 'Check Engine'. Based on the visual wear on the hoses, I recommend checking for vacuum leaks.`);
        } else if (media?.mimeType.startsWith('audio')) {
             resolve(`(AI Simulation) Analyzing audio frequency... I hear a rhythmic ticking noise. This is consistent with a valve lifter issue or low oil pressure. Please check your oil level immediately.`);
        } else {
             resolve(`(AI Simulation) Based on "${symptom}", this sounds like it could be a worn serpentine belt or a tensioner pulley issue. I recommend checking the belt for cracks. Would you like me to find a mechanic nearby?`);
        }
      }, 2000);
    });
  }

  try {
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
      model: 'gemini-2.5-flash-image', // Using a multimodal capable model
      contents: { parts },
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });
    return response.text || "I'm having trouble analyzing that right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Connection to AI Core interrupted. Please check your network or try again later.";
  }
};