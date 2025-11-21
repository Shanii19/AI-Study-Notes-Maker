/**
 * Unit tests for the Gemini API client
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// We need to use a dynamic import inside the test to load the module
// after we've set the environment variable.
let generateStudyNotes: (
  text: string,
  inputType: 'youtube' | 'video' | 'pdf' | 'docx' | 'pptx' | 'text'
) => Promise<string>;

// Mock the entire @google/generative-ai library
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({
  generateContent: mockGenerateContent,
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

describe('lib/gemini-client', () => {
  beforeEach(async () => {
    // Reset mocks and environment before each test
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-api-key';

    // Dynamically import the module to re-evaluate it with the set environment variable
    const module = await import('@/lib/gemini-client');
    generateStudyNotes = module.generateStudyNotes;
  });

  it('should generate study notes successfully for valid input', async () => {
    const mockNotes = '# Study Notes\n\n- Point 1';
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => mockNotes,
      },
    });

    const notes = await generateStudyNotes('Some text content', 'text');

    expect(notes).toBe(mockNotes);
    expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-1.5-flash' });
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    expect(mockGenerateContent.mock.calls[0][0]).toContain('Some text content');
  });

  it('should truncate text that is too long', async () => {
    const longText = 'a'.repeat(30001);
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'notes' },
    });

    await generateStudyNotes(longText, 'pdf');

    const passedPrompt = mockGenerateContent.mock.calls[0][0] as string;
    expect(passedPrompt).toContain('[Content truncated due to length...]');
    expect(passedPrompt.length).toBeLessThan(longText.length);
  });

  it('should throw a specific error for API quota issues', async () => {
    mockGenerateContent.mockRejectedValue(new Error('API quota exceeded'));

    await expect(generateStudyNotes('test', 'text')).rejects.toThrow(
      'API quota exceeded or invalid API key. Please check your API key and quota limits.'
    );
  });

  it('should throw a specific error for bad requests (400)', async () => {
    mockGenerateContent.mockRejectedValue(new Error('A 400 Bad Request error occurred'));

    await expect(generateStudyNotes('test', 'text')).rejects.toThrow(
      'Invalid request to AI model. The content might be too long or malformed.'
    );
  });

  it('should throw an error if the generated notes are empty', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => ' ', // Empty or whitespace-only string
      },
    });

    await expect(generateStudyNotes('test', 'text')).rejects.toThrow('Failed to generate notes: Generated notes are empty');
  });

  it('should throw a generic error for other failures', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Some other network error'));

    await expect(generateStudyNotes('test', 'text')).rejects.toThrow('Failed to generate notes: Some other network error');
  });

  it('should throw an error if GEMINI_API_KEY is not set', async () => {
    // Unset the environment variable
    delete process.env.GEMINI_API_KEY;

    // Reset modules to force re-import and re-evaluation of the top-level code
    jest.resetModules();

    // We expect the import itself to throw the error
    await expect(import('@/lib/gemini-client')).rejects.toThrow(
      'GEMINI_API_KEY is not set in environment variables. Please add it to .env.local'
    );

    // Restore the mock for other tests
    jest.mock('@google/generative-ai', () => ({
      GoogleGenerativeAI: jest.fn(() => ({
        getGenerativeModel: mockGetGenerativeModel,
      })),
    }));
  });
});