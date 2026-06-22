const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        text: 'What is this audio?',
      }, {
        inlineData: {
          mimeType: 'audio/webm',
          data: 'GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGkVfA8EAAAAAAAAB5wADgQKGhQUCh4EAQoaDBUaIAeEAAAAAAAAB84ECgQ2BBUKGAwHhAAAAAAAAAvOBAoEJgQRChgMD4QAAAAAAAALzgQKBAoEEQoYDAuEAAAAAAAAC84EBQoaDDUaIAuEAAAAAAAAB84ECgQ2BBUKGAwHhAAAAAAAAAvOBAoEJgQRChgMD4QAAAAAAAALzgQKBAoEEQoYDAuEAAAAAAAAC84EBgQSF'
        }
      }]
    });
    console.log(response.text);
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
