/**
 * Tests for the /api/process route
 */

import { POST } from '@/app/api/process/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/youtube-utils');
jest.mock('@/lib/text-extractors');
jest.mock('@/lib/utils');

describe('/api/process', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error if input type is missing', async () => {
    const formData = new FormData();
    const request = new NextRequest('http://localhost:3000/api/process', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Input type is required');
  });

  it('should process pasted text input', async () => {
    const formData = new FormData();
    formData.append('inputType', 'text');
    formData.append('pastedText', 'This is test text content');

    const request = new NextRequest('http://localhost:3000/api/process', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.text).toBe('This is test text content');
    expect(data.inputType).toBe('text');
  });

  it('should return error for empty pasted text', async () => {
    const formData = new FormData();
    formData.append('inputType', 'text');
    formData.append('pastedText', '');

    const request = new NextRequest('http://localhost:3000/api/process', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Pasted text is required');
  });

  it('should return error for invalid YouTube URL', async () => {
    const { extractYouTubeId } = require('@/lib/utils');
    extractYouTubeId.mockReturnValue(null);

    const formData = new FormData();
    formData.append('inputType', 'youtube');
    formData.append('youtubeUrl', 'invalid-url');

    const request = new NextRequest('http://localhost:3000/api/process', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid YouTube URL');
  });

  it('should return error for unsupported input type', async () => {
    const formData = new FormData();
    formData.append('inputType', 'unsupported');

    const request = new NextRequest('http://localhost:3000/api/process', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Unsupported input type');
  });
});

