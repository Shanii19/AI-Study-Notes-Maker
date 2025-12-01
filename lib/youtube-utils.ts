/**
 * YouTube transcript and audio processing utilities
 */

import { YoutubeTranscript } from 'youtube-transcript';
import ytdl from '@distube/ytdl-core';
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

  // 2. Try to get captions via ytdl-core (works even if main transcript library fails)
  try {
    console.log('Attempting to fetch captions via ytdl-core...');
    const info = await ytdl.getInfo(videoUrl, {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        }
      },
      // @ts-ignore
      client: {
        clientName: 'ANDROID',
        clientVersion: '17.31.35',
      },
    });

    const captions = info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (captions && captions.length > 0) {
      // Prefer English, then auto-generated English, then first available
      const track = captions.find((c: any) => c.languageCode === 'en' && !c.kind) ||
        captions.find((c: any) => c.languageCode === 'en') ||
        captions[0];

      if (track && track.baseUrl) {
        console.log(`Found caption track: ${track.name?.simpleText || 'Unknown'} (${track.languageCode})`);
        const response = await fetch(track.baseUrl);
        const xml = await response.text();

        // Simple regex to extract text from XML
        // Format: <text start="0" dur="1">Hello</text>
        const textMatches = xml.match(/<text[^>]*>([^<]+)<\/text>/g);

        if (textMatches && textMatches.length > 0) {
          const text = textMatches
            .map(t => t.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'))
            .join(' ');

          if (text && text.trim().length > 50) {
            console.log(`Successfully extracted captions via ytdl, ${text.length} characters`);
            return text;
          }
        }
      }
    }
  } catch (ytdlError) {
    console.log('ytdl-core caption fetch failed:', ytdlError);
  }

  // 3. Fallback: Download audio and transcribe using Groq Whisper
  // DISABLED for Vercel/Serverless stability. 
  // ytdl-core often fails in serverless environments due to IP blocking, 
  // and file system access is limited.
  /*
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
  */

  // 4. Secondary fallback: Try to get video info and use description via ytdl-core
  try {
    console.log('Transcript not available, trying to get video information via ytdl-core...');
    const info = await ytdl.getInfo(videoUrl);

    let text = '';
    if (info.videoDetails) {
      const title = info.videoDetails.title;
      // Validate title to avoid generic YouTube pages
      if (title && !title.includes('YouTube') && !title.includes('Before you continue')) {
        text += `Video Title: ${title}\n\n`;
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

  // 5. Tertiary fallback: Raw HTML fetch (cheerio-style regex)
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
      const title = titleMatch[1];
      if (!title.includes('YouTube') && !title.includes('Before you continue')) {
        text += `Video Title: ${title}\n\n`;
      }
    } else {
      const titleTagMatch = html.match(/<title>([^<]*)<\/title>/);
      if (titleTagMatch && titleTagMatch[1]) {
        const title = titleTagMatch[1].replace(' - YouTube', '');
        if (!title.includes('YouTube') && !title.includes('Before you continue')) {
          text += `Video Title: ${title}\n\n`;
        }
      }
    }

    // Extract Description
    const descMatch = html.match(/<meta name="description" content="([^"]*)"/);
    if (descMatch && descMatch[1]) {
      text += `Video Description:\n${descMatch[1]}\n\n`;
    }

    if (text.trim().length > 50) {
      console.log(`Using video title and description from raw HTML (${text.length} characters)`);
      return text + "\n\n[Note: Full transcript could not be retrieved. Notes are based on video title and description.]";
    }
  } catch (htmlError) {
    console.error('Raw HTML fetch failed:', htmlError);
  }

  // Final fallback: throw error with helpful message
  throw new Error('Could not retrieve transcript. Please ensure the video has captions enabled. (Note: Audio transcription is disabled on the web version for performance).');
}

/**
 * Download audio from YouTube video
 */
export async function downloadYouTubeAudio(videoUrl: string): Promise<string> {
  const videoId = extractYouTubeId(videoUrl);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  const outputFormat = 'mp3';
  const outputPath = join(tmpdir(), `${videoId}.${outputFormat}`);

  return new Promise((resolve, reject) => {
    // Use robust options for ytdl to avoid bot detection
    const stream = ytdl(videoUrl, {
      quality: 'lowestaudio',
      filter: 'audioonly',
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        }
      },
      // @ts-ignore - distube/ytdl-core supports this but types might be outdated
      client: {
        clientName: 'ANDROID',
        clientVersion: '17.31.35',
      },
    });

    const writeStream = createWriteStream(outputPath);

    stream.pipe(writeStream);

    stream.on('error', (err) => {
      console.error('ytdl stream error:', err);
      reject(err);
    });

    writeStream.on('finish', () => {
      console.log(`Audio downloaded successfully to ${outputPath}`);
      resolve(outputPath);
    });

    writeStream.on('error', (err) => {
      console.error('File write error:', err);
      reject(err);
    });
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
