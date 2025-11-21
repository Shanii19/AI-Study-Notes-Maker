/**
 * Tests for the /api/generate route
 */

import { POST } from '@/app/api/generate/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/gemini-client');

describe('/api/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error if text is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        inputType: 'text',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Text content is required');
  });

  it('should return error if input type is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Test text',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Valid input type is required');
  });

  it('should return error if text is too long', async () => {
    const longText = 'a'.repeat(100001);

    const request = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        text: longText,
        inputType: 'text',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('too long');
  });

  it('should generate notes successfully', async () => {
    const { generateStudyNotes } = require('@/lib/gemini-client');
    generateStudyNotes.mockResolvedValue('# Study Notes\n\n- Key point 1\n- Key point 2');

    const request = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Test content for notes generation',
        inputType: 'text',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.notes).toContain('Study Notes');
    expect(generateStudyNotes).toHaveBeenCalledWith('Test content for notes generation', 'text');
  });

  it('should handle API quota errors', async () => {
    const { generateStudyNotes } = require('@/lib/gemini-client');
    generateStudyNotes.mockRejectedValue(new Error('API quota exceeded'));

    const request = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Test content',
        inputType: 'text',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain('quota');
  });
});

