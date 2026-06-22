import { API_URL } from '../config';

export interface MediaInput {
  mimeType: string;
  data: string; // Base64 string
}

export interface DiagnosticResponse {
  reply: string;
  action: string | null;
}

export const diagnoseCarIssue = async (symptom: string, media?: MediaInput, language: string = 'ar'): Promise<DiagnosticResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/gemini/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({ symptom, media, language })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return {
      reply: data.reply || "I'm having trouble analyzing that right now.",
      action: data.action || null
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      reply: "Connection to AI Core interrupted. Please check your network or try again later.",
      action: null
    };
  }
};