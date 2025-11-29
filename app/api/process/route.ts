/**
 * API route for processing different input types
 * Handles: YouTube links, video files, PDFs, DOCX, PPTX, and pasted text
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchYouTubeTranscript, downloadYouTubeAudio } from '@/lib/youtube-utils';
import { extractTextFromPDF, extractTextFromDOCX, extractTextFromPPTX, saveTemporaryFile, cleanupTempFile } from '@/lib/text-extractors';
import { extractYouTubeId, validateFileType, validateFileSize, InputType } from '@/lib/utils';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// File size limits (50MB for videos, 10MB for documents)
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Configure body size limit for this route
export const maxDuration = 60; // 60 seconds
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const inputType = formData.get('inputType') as InputType;

    if (!inputType) {
      return NextResponse.json(
        { error: 'Input type is required' },
        { status: 400 }
      );
    }

    console.log(`Processing input type: ${inputType}`);
    let extractedText = '';

    switch (inputType) {
      case 'youtube': {
        const youtubeUrl = formData.get('youtubeUrl') as string;
        if (!youtubeUrl) {
          return NextResponse.json(
            { error: 'YouTube URL is required' },
            { status: 400 }
          );
        }

        const videoId = extractYouTubeId(youtubeUrl);
        if (!videoId) {
          return NextResponse.json(
            { error: 'Invalid YouTube URL' },
            { status: 400 }
          );
        }

        try {
          console.log(`Fetching YouTube transcript for: ${youtubeUrl}`);
          // Try to fetch transcript (will try multiple languages and fallbacks)
          extractedText = await fetchYouTubeTranscript(youtubeUrl);
          console.log(`Extracted ${extractedText.length} characters from YouTube`);

          if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('No text could be extracted from the video.');
          }

          // If we got very little text (just title/description), still continue but log warning
          if (extractedText.length < 100) {
            console.warn('Very little text extracted, may not generate comprehensive notes');
            // Don't throw error, just continue with what we have
          }
        } catch (transcriptError) {
          console.error('YouTube processing error:', transcriptError);

          // Try one more time with direct ytdl approach
          try {
            console.log('Attempting direct video info extraction...');
            const ytdl = require('@distube/ytdl-core');
            const info = await ytdl.getInfo(youtubeUrl);

            let fallbackText = '';
            if (info.videoDetails && info.videoDetails.title) {
              fallbackText += `Video: ${info.videoDetails.title}\n\n`;
            }
            if (info.videoDetails && info.videoDetails.description) {
              const desc = info.videoDetails.description;
              fallbackText += desc.length > 5000 ? desc.substring(0, 5000) : desc;
            }

            if (fallbackText.trim().length > 10) {
              console.log(`Using fallback text: ${fallbackText.length} characters`);
              extractedText = fallbackText;
            } else {
              throw transcriptError; // Re-throw if fallback also failed
            }
          } catch (fallbackError) {
            // Both methods failed
            const errorMsg = transcriptError instanceof Error ? transcriptError.message : 'Unknown error';
            return NextResponse.json(
              {
                error: `Unable to process YouTube video: ${errorMsg}`,
                details: 'The video may not have captions enabled. Please try a video with captions or use a different source.'
              },
              { status: 400 }
            );
          }
        }
        break;
      }

      case 'video': {
        const videoFile = formData.get('videoFile') as File;
        if (!videoFile) {
          return NextResponse.json(
            { error: 'Video file is required' },
            { status: 400 }
          );
        }

        // Validate file type
        if (!validateFileType(videoFile.name, ['mp4', 'webm', 'ogg', 'mov', 'avi'])) {
          return NextResponse.json(
            { error: 'Invalid video file type. Supported: mp4, webm, ogg, mov, avi' },
            { status: 400 }
          );
        }

        // Validate file size
        if (!validateFileSize(videoFile.size, MAX_VIDEO_SIZE)) {
          return NextResponse.json(
            { error: `Video file too large. Maximum size: ${MAX_VIDEO_SIZE / 1024 / 1024}MB` },
            { status: 400 }
          );
        }

        console.log(`Processing video: ${videoFile.name}, size: ${videoFile.size}`);

        try {
          // Import the transcription module
          const { transcribeVideoSimple } = await import('@/lib/video-transcription');

          console.log('Starting video transcription...');
          extractedText = await transcribeVideoSimple(videoFile);
          console.log(`Transcribed ${extractedText.length} characters from video`);

          if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('No speech could be transcribed from the video.');
          }
        } catch (error) {
          console.error('Video transcription error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          // Check for specific errors
          if (errorMessage.includes('FFmpeg')) {
            return NextResponse.json(
              {
                error: 'FFmpeg not installed',
                details: 'Video processing requires FFmpeg. Please install it from https://ffmpeg.org/download.html or use YouTube links with transcripts instead.'
              },
              { status: 501 }
            );
          }

          return NextResponse.json(
            {
              error: `Failed to transcribe video: ${errorMessage}`,
              details: 'Please ensure the video contains clear speech. Alternatively, use YouTube links with captions or upload text directly.'
            },
            { status: 400 }
          );
        }
        break;
      }

      case 'pdf': {
        const pdfFile = formData.get('pdfFile') as File;
        if (!pdfFile) {
          return NextResponse.json(
            { error: 'PDF file is required' },
            { status: 400 }
          );
        }

        if (!validateFileType(pdfFile.name, ['pdf'])) {
          return NextResponse.json(
            { error: 'Invalid file type. Only PDF files are supported.' },
            { status: 400 }
          );
        }

        if (!validateFileSize(pdfFile.size, MAX_DOCUMENT_SIZE)) {
          return NextResponse.json(
            { error: `PDF file too large. Maximum size: ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB` },
            { status: 400 }
          );
        }

        console.log(`Processing PDF: ${pdfFile.name}, size: ${pdfFile.size}`);
        let tempPath: string | null = null;
        try {
          tempPath = await saveTemporaryFile(pdfFile);
          console.log(`Saved PDF to temp path: ${tempPath}`);
          extractedText = await extractTextFromPDF(tempPath);
          console.log(`Extracted ${extractedText.length} characters from PDF`);

          if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('No text could be extracted from the PDF. The file might be image-based or corrupted.');
          }
        } catch (error) {
          console.error('PDF extraction error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          // Provide more specific error messages
          if (errorMessage.includes('image') || errorMessage.includes('Image')) {
            return NextResponse.json(
              {
                error: 'This PDF appears to be image-based (scanned document). Please use a PDF with selectable text, or convert the images to text first.',
                details: 'The PDF contains only images, not extractable text.'
              },
              { status: 400 }
            );
          }

          if (errorMessage.includes('Invalid') || errorMessage.includes('corrupted')) {
            return NextResponse.json(
              {
                error: 'Invalid or corrupted PDF file. Please ensure the file is a valid PDF document.',
                details: errorMessage
              },
              { status: 400 }
            );
          }

          return NextResponse.json(
            {
              error: `Failed to extract text from PDF: ${errorMessage}`,
              details: 'Please ensure the PDF contains selectable text and is not corrupted.'
            },
            { status: 400 }
          );
        } finally {
          if (tempPath) {
            await cleanupTempFile(tempPath);
          }
        }
        break;
      }

      case 'docx': {
        const docxFile = formData.get('docxFile') as File;
        if (!docxFile) {
          return NextResponse.json(
            { error: 'DOCX file is required' },
            { status: 400 }
          );
        }

        if (!validateFileType(docxFile.name, ['docx', 'doc'])) {
          return NextResponse.json(
            { error: 'Invalid file type. Only DOCX files are supported.' },
            { status: 400 }
          );
        }

        if (!validateFileSize(docxFile.size, MAX_DOCUMENT_SIZE)) {
          return NextResponse.json(
            { error: `DOCX file too large. Maximum size: ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB` },
            { status: 400 }
          );
        }

        console.log(`Processing DOCX: ${docxFile.name}, size: ${docxFile.size}`);
        const tempPath = await saveTemporaryFile(docxFile);
        try {
          extractedText = await extractTextFromDOCX(tempPath);
          console.log(`Extracted ${extractedText.length} characters from DOCX`);
          if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('No text could be extracted from the DOCX file.');
          }
        } catch (error) {
          console.error('DOCX extraction error:', error);
          throw error;
        } finally {
          await cleanupTempFile(tempPath);
        }
        break;
      }

      case 'pptx': {
        const pptxFile = formData.get('pptxFile') as File;
        if (!pptxFile) {
          return NextResponse.json(
            { error: 'PPTX file is required' },
            { status: 400 }
          );
        }

        if (!validateFileType(pptxFile.name, ['pptx', 'ppt'])) {
          return NextResponse.json(
            { error: 'Invalid file type. Only PPTX files are supported.' },
            { status: 400 }
          );
        }

        if (!validateFileSize(pptxFile.size, MAX_DOCUMENT_SIZE)) {
          return NextResponse.json(
            { error: `PPTX file too large. Maximum size: ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB` },
            { status: 400 }
          );
        }

        console.log(`Processing PPTX: ${pptxFile.name}, size: ${pptxFile.size}`);
        const tempPath = await saveTemporaryFile(pptxFile);
        try {
          extractedText = await extractTextFromPPTX(tempPath);
          console.log(`Extracted ${extractedText.length} characters from PPTX`);
          if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('No text could be extracted from the PPTX file.');
          }
        } catch (error) {
          console.error('PPTX extraction error:', error);
          throw error;
        } finally {
          await cleanupTempFile(tempPath);
        }
        break;
      }

      case 'text': {
        const pastedText = formData.get('pastedText') as string;
        if (!pastedText || pastedText.trim().length === 0) {
          return NextResponse.json(
            { error: 'Pasted text is required' },
            { status: 400 }
          );
        }
        extractedText = pastedText;
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unsupported input type: ${inputType}` },
          { status: 400 }
        );
    }

    if (!extractedText || extractedText.trim().length === 0) {
      console.error('No text extracted from input');
      return NextResponse.json(
        { error: 'No text could be extracted from the input. Please try a different file or source.' },
        { status: 400 }
      );
    }

    console.log(`Successfully processed ${inputType}, extracted ${extractedText.length} characters`);
    return NextResponse.json({
      success: true,
      text: extractedText,
      inputType,
      textLength: extractedText.length,
    });
  } catch (error) {
    console.error('Error processing input:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to process input',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

