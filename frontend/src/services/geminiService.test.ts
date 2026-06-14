import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { diagnoseCarIssue } from './geminiService';
import { API_URL } from '../config';

// Mock the config module to ensure API_URL is known
vi.mock('../config', () => ({
  API_URL: 'http://localhost:3000'
}));

describe('geminiService', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;

    // Mock fetch
    global.fetch = vi.fn();

    // Mock localStorage
    Storage.prototype.getItem = vi.fn(() => 'test-token');
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('should successfully diagnose an issue without media', async () => {
    const mockResponse = { response: 'The issue is a flat tire.' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const symptom = 'My car is making a clunking noise';
    const result = await diagnoseCarIssue(symptom);

    expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/api/gemini/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({ symptom, media: undefined })
    });
    expect(result).toBe(mockResponse.response);
  });

  it('should successfully diagnose an issue with media', async () => {
    const mockResponse = { response: 'The issue is a broken belt.' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const symptom = 'What is this broken thing?';
    const media = { mimeType: 'image/jpeg', data: 'base64data' };
    const result = await diagnoseCarIssue(symptom, media);

    expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/api/gemini/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({ symptom, media })
    });
    expect(result).toBe(mockResponse.response);
  });

  it('should handle a missing token in localStorage', async () => {
    const mockResponse = { response: 'Test response' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Override getItem for this test specifically
    Storage.prototype.getItem = vi.fn(() => null);

    const result = await diagnoseCarIssue('test');

    expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/api/gemini/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '
      },
      body: JSON.stringify({ symptom: 'test', media: undefined })
    });
    expect(result).toBe(mockResponse.response);
  });

  it('should handle HTTP errors gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await diagnoseCarIssue('engine light on');

    expect(result).toBe("Connection to AI Core interrupted. Please check your network or try again later.");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle API response without response field', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ someOtherField: 'value' }),
    });

    const result = await diagnoseCarIssue('engine light on');

    expect(result).toBe("I'm having trouble analyzing that right now.");
  });

  it('should handle network errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network disconnected'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await diagnoseCarIssue('engine light on');

    expect(result).toBe("Connection to AI Core interrupted. Please check your network or try again later.");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
