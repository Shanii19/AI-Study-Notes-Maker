/**
 * API route for generating study notes using Groq API
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateStudyNotes } from '@/lib/groq-client';
import { InputType } from '@/lib/utils';

// Verify API key is available (optional warning, don't throw)
if (!process.env.GROQ_API_KEY) {
  console.warn('WARNING: GROQ_API_KEY not found in environment variables');
} else {
  const key = process.env.GROQ_API_KEY;
  console.log(`GROQ_API_KEY loaded: ${key.substring(0, 8)}... (Length: ${key.length})`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, inputType, detailLevel } = body;

    console.log('Generate request received:', { inputType, textLength: text?.length, detailLevel });

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.error('No text provided in generate request');
      return NextResponse.json(
        { error: 'Text content is required. Please ensure the file was processed correctly.' },
        { status: 400 }
      );
    }

    if (!inputType || !['youtube', 'video', 'pdf', 'docx', 'pptx', 'text'].includes(inputType)) {
      return NextResponse.json(
        { error: 'Valid input type is required' },
        { status: 400 }
      );
    }

    // Check text length (Groq has token limits)
    if (text.length > 200000) {
      return NextResponse.json(
        { error: 'Text content is too long. Maximum length: 200,000 characters' },
        { status: 400 }
      );
    }

    // Warn if text is very short
    if (text.trim().length < 50) {
      console.warn('Very short text provided, notes may be limited');
    }

    try {
      console.log('Calling generateStudyNotes...');
      const notes = await generateStudyNotes(
        text,
        inputType as InputType,
        (detailLevel as 'easy' | 'medium' | 'detailed') || 'medium'
      );
      console.log('Successfully generated notes');

      if (!notes || notes.trim().length === 0) {
        return NextResponse.json(
          {
            error: 'Generated notes are empty',
            details: 'The AI model did not return any content. Please try again or check your input.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        notes,
        inputType,
      });
    } catch (apiError: any) {
      console.error('Error generating notes:', apiError);

      // Handle API-specific errors
      if (apiError?.status === 429) {
        return NextResponse.json(
          {
            error: 'API Rate Limit Exceeded',
            details: 'Too many requests to Groq API. Please try again in a few minutes.',
          },
          { status: 429 }
        );
      }

      if (apiError?.status === 413 || (apiError?.message && apiError.message.includes('too large'))) {
        return NextResponse.json(
          {
            error: 'Content Too Large',
            details: 'The PDF content is too long for the AI model. Please try a shorter document.',
          },
          { status: 413 }
        );
      }

      if (apiError?.status === 400) {
        return NextResponse.json(
          {
            error: 'Invalid Request',
            details: apiError.message || 'The content might be malformed.',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to generate notes',
          details: apiError.message || 'An unknown error occurred while generating notes.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating notes:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
