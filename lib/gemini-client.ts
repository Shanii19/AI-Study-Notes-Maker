/**
 * Google Gemini API client for generating study notes
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient() {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables. Please add it to .env.local');
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(API_KEY);
  }
  return genAI;
}

export async function generateStudyNotes(
  text: string,
  inputType: 'youtube' | 'video' | 'pdf' | 'docx' | 'pptx' | 'text'
): Promise<string> {
  try {
    // Truncate text if too long (Gemini has token limits)
    const maxLength = 30000;
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '\n\n[Content truncated due to length...]' : text;
    const model = getGeminiClient().getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are an expert study notes generator. Create clean, well-organized study notes from the following content.\n\nInput source: ${inputType}\n\nRequirements:\n1. Use clear, hierarchical headings (H1, H2, H3 format)\n2. Include short, concise bullet points for key concepts\n3. Provide ONE short, practical example per key concept\n4. Organize content logically by topic\n5. Highlight important terms and definitions\n6. Keep the notes concise but comprehensive\n\nContent to process:\n${truncatedText}\n\nGenerate the study notes now:`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const notes = response.text();
    if (!notes || notes.trim().length === 0) throw new Error('Generated notes are empty');
    return notes;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('quota') || error.message.includes('429')) {
        throw new Error('API quota exceeded or invalid API key. Please check your API key and quota limits.');
      }
      if (error.message.includes('400') || error.message.includes('Bad Request')) {
        throw new Error('Invalid request to AI model. The content might be too long or malformed.');
      }
      throw new Error(`Failed to generate notes: ${error.message}`);
    }
    throw new Error('Failed to generate notes: Unknown error');
  }
}

