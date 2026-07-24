import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { diagnoseCarIssue, MediaInput } from './geminiService';
import { API_URL } from '../config';

describe('geminiService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue('test-token')
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully diagnose an issue without media', async () => {
    const mockResponse = { reply: 'It sounds like a loose belt.', action: null };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const symptom = 'My car is making a clunking noise';
    const result = await diagnoseCarIssue(symptom);

    expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/api/gemini/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({ symptom, media: undefined, language: 'ar' })
    });
    expect(result).toEqual(mockResponse);
  });

  it('should successfully diagnose an issue with media', async () => {
    const mockResponse = { reply: 'That looks like a cracked hose.', action: 'BOOK_APPOINTMENT' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const symptom = 'What is this broken thing?';
    const media: MediaInput = { mimeType: 'image/jpeg', data: 'base64data' };
    const result = await diagnoseCarIssue(symptom, media);

    expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/api/gemini/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({ symptom, media, language: 'ar' })
    });
    expect(result).toEqual(mockResponse);
  });

  it('should handle a missing token in localStorage', async () => {
    (global.localStorage.getItem as any).mockReturnValueOnce(null);
    const mockResponse = { reply: 'Success', action: null };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await diagnoseCarIssue('test');

    expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/api/gemini/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '
      },
      body: JSON.stringify({ symptom: 'test', media: undefined, language: 'ar' })
    });
    expect(result).toEqual(mockResponse);
  });

  it('should handle HTTP errors gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await diagnoseCarIssue('engine light on');

    expect(result).toEqual({
      reply: "Connection to AI Core interrupted. Please check your network or try again later.",
      action: null
    });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle API response without reply field', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    const result = await diagnoseCarIssue('engine light on');

    expect(result).toEqual({
      reply: "I'm having trouble analyzing that right now.",
      action: null
    });
  });

  it('should handle network errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network failure'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await diagnoseCarIssue('engine light on');

    expect(result).toEqual({
      reply: "Connection to AI Core interrupted. Please check your network or try again later.",
      action: null
    });
    expect(consoleSpy).toHaveBeenCalled();
  });
});
