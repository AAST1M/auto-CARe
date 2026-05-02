export interface MediaInput {
  mimeType: string;
  data: string; // Base64 string
}

export const diagnoseCarIssue = async (symptom: string, media?: MediaInput): Promise<string> => {
  try {
    const response = await fetch('http://localhost:5001/api/gemini/diagnose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({ symptom, media })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.response || "I'm having trouble analyzing that right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Connection to AI Core interrupted. Please check your network or try again later.";
  }
};