import request from 'supertest';
import express from 'express';
import geminiRoutes from '../routes/gemini';

// Mock the middleware
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', role: 'USER' };
    next();
  }
}));

// Mock GoogleGenAI
const mockGenerateContent = jest.fn();
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent
    }
  }))
}));

const app = express();
app.use(express.json());
app.use('/api/gemini', geminiRoutes);

describe('Gemini AI Routes', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-api-key';
    mockGenerateContent.mockClear();
  });

  describe('POST /api/gemini/diagnose', () => {
    it('should return parsed JSON response from Gemini API', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          reply: 'Based on the symptom, it sounds like an engine issue. Is the car moving?',
          action: 'ASK_MOBILITY'
        })
      });

      const res = await request(app)
        .post('/api/gemini/diagnose')
        .send({ symptom: 'My engine is making a clicking noise', language: 'en' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('reply');
      expect(res.body).toHaveProperty('action', 'ASK_MOBILITY');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should fall back to simulated response if Gemini API fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API quota exceeded'));

      const res = await request(app)
        .post('/api/gemini/diagnose')
        .send({ symptom: 'My car is completely broken down and not moving' });

      expect(res.statusCode).toEqual(200);
      // Our fallback logic in gemini.ts checks for keywords like "not moving"
      expect(res.body.action).toEqual('WINCH');
      expect(res.body.reply).toContain('Simulated');
      expect(res.body.reply).toContain('Winch');
    });

    it('should use simulation immediately if no API key is provided', async () => {
      delete process.env.GEMINI_API_KEY;

      const res = await request(app)
        .post('/api/gemini/diagnose')
        .send({ symptom: 'Flat tire' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.response).toContain('Backend Simulation');
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/gemini/identify-part', () => {
    it('should identify a part given an image', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          partName: 'Spark Plug',
          description: 'A standard spark plug with some carbon deposit.'
        })
      });

      const res = await request(app)
        .post('/api/gemini/identify-part')
        .send({
          media: {
            mimeType: 'image/jpeg',
            data: 'base64_image_data_here'
          }
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.partName).toEqual('Spark Plug');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if media is missing', async () => {
      const res = await request(app)
        .post('/api/gemini/identify-part')
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Image media is required.');
    });
  });
});
