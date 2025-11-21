/**
 * YouTube transcript and audio processing utilities
 */

import { YoutubeTranscript } from 'youtube-transcript';
import ytdl from 'ytdl-core';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { unlink } from 'fs/promises';
import { extractYouTubeId } from './utils';
import { transcribeAudio } from './video-transcription';

/**
 * Fetch transcript from YouTube video
 * Tries multiple languages and auto-generated captions
 */
export async function fetchYouTubeTranscript(videoUrl: string): Promise<string> {
  const videoId = extractYouTubeId(videoUrl);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  // 1. Try to fetch transcript (library handles language detection automatically)
  try {
    console.log(`Attempting to fetch transcript for video ${videoId}...`);

    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

    if (transcriptItems && transcriptItems.length > 0) {
      const text = transcriptItems.map(item => item.text).join(' ');
      if (text && text.trim().length > 0) {
        console.log(`Successfully fetched transcript, ${text.length} characters`);
        return text;
      }
    }
  } catch (transcriptError) {
    console.log('Direct transcript fetch failed:', transcriptError);
  }

  // 2. NEW FALLBACK: Download audio and transcribe using Groq Whisper
  // This handles videos without captions!
  let audioPath: string | null = null;
  try {
    console.log('Attempting to download and transcribe audio (fallback)...');
    audioPath = await downloadYouTubeAudio(videoUrl);
    console.log(`Audio downloaded to ${audioPath}, starting transcription...`);

    const transcription = await transcribeAudio(audioPath);

    if (transcription && transcription.trim().length > 50) {
      console.log(`Successfully transcribed YouTube audio, ${transcription.length} characters`);
      return transcription;
    }
  } catch (transcriptionError) {
    console.error('Audio transcription fallback failed:', transcriptionError);
  } finally {
    if (audioPath) {
      await cleanupAudioFile(audioPath);
    }
  }

  // 3. Secondary fallback: Try to get video info and use description via ytdl-core
  try {
    console.log('Transcript not available, trying to get video information via ytdl-core...');
    const info = await ytdl.getInfo(videoUrl);

    let text = '';
    if (info.videoDetails) {
      if (info.videoDetails.title) {
        text += `Video Title: ${info.videoDetails.title}\n\n`;
      }
      if (info.videoDetails.description) {
        const description = info.videoDetails.description;
        const maxDescLength = 10000;
        text += `Video Description:\n${description.length > maxDescLength
          ? description.substring(0, maxDescLength) + '...'
          : description}\n\n`;
      }
    }

    if (text.trim().length > 50) {
      console.log(`Using video title and description from ytdl (${text.length} characters)`);
      return text + "\n\n[Note: Full transcript could not be retrieved. Notes are based on video title and description.]";
    }
  } catch (error) {
    console.error('ytdl-core failed:', error);
  }

  // 4. Tertiary fallback: Raw HTML fetch (cheerio-style regex)
  try {
    console.log('Trying raw HTML fetch for metadata...');
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const html = await response.text();

    let text = '';

    // Extract Title
    const titleMatch = html.match(/<meta name="title" content="([^"]*)"/);
    if (titleMatch && titleMatch[1]) {
      text += `Video Title: ${titleMatch[1]}\n\n`;
    } else {
      const titleTagMatch = html.match(/<title>([^<]*)<\/title>/);
      if (titleTagMatch && titleTagMatch[1]) {
        text += `Video Title: ${titleTagMatch[1].replace(' - YouTube', '')}\n\n`;
      }
    }

    // Extract Description
    const descMatch = html.match(/<meta name="description" content="([^"]*)"/);
    if (descMatch && descMatch[1]) {
      text += `Video Description:\n${descMatch[1]}\n\n`;
    }

    if (text.trim().length > 20) {
      console.log(`Using video title and description from raw HTML (${text.length} characters)`);
      return text + "\n\n[Note: Full transcript could not be retrieved. Notes are based on video title and description.]";
    }
  } catch (htmlError) {
    console.error('Raw HTML fetch failed:', htmlError);
  }

  // Final fallback: throw error with helpful message
  throw new Error('Could not retrieve transcript or video description. Please ensure the video has captions enabled or try a different video.');
}

/**
 * Download audio from YouTube video
 */
export async function downloadYouTubeAudio(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const videoId = extractYouTubeId(videoUrl);
      if (!videoId) {
        reject(new Error('Invalid YouTube URL'));
        return;
      }

      // Use mp3 extension for better compatibility with Whisper
      const outputPath = join(tmpdir(), `youtube-audio-${videoId}-${Date.now()}.mp3`);

      // Get audio stream
      const stream = ytdl(videoUrl, {
        quality: 'lowestaudio',
        filter: 'audioonly',
      });

      const writeStream = createWriteStream(outputPath);
      stream.pipe(writeStream);

      stream.on('error', (error) => {
        reject(new Error(`Failed to download audio: ${error.message}`));
      });

      writeStream.on('finish', () => {
        resolve(outputPath);
      });

      writeStream.on('error', (error) => {
        reject(new Error(`Failed to save audio: ${error.message}`));
      });
    } catch (error) {
      reject(new Error(`Failed to process YouTube video: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

/**
 * Clean up downloaded audio file
 */
export async function cleanupAudioFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    console.error(`Failed to cleanup audio file ${filePath}:`, error);
  }
}
