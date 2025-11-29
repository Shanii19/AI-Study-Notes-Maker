import { NextRequest, NextResponse } from 'next/server';
import { chatWithNotes } from '@/lib/groq-client';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { notes, messages, question } = body;

        if (!notes || !question) {
            return NextResponse.json(
                { error: 'Notes and question are required' },
                { status: 400 }
            );
        }

        const response = await chatWithNotes(notes, messages || [], question);

        return NextResponse.json({
            success: true,
            response,
        });
    } catch (error) {
        console.error('Error in chat route:', error);
        return NextResponse.json(
            {
                error: 'Failed to process chat request',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
