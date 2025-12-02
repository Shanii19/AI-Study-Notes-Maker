/**
 * YouTube transcript and audio processing utilities
 * Updated to use YouTube Data API v3 for Vercel compatibility
 */

import { extractYouTubeId } from './utils';

/**
 * Fetch transcript from YouTube video using YouTube Data API v3
 * 
 * Note: The official YouTube Data API v3 'captions' endpoint requires OAuth 2.0 for 
 * downloading captions of third-party videos. API Key access is restricted.
 * 
 * Therefore, this implementation uses a hybrid approach:
 * 1. Tries 'youtube-transcript' library first (scrapes transcript, works for most public videos)
 * 2. If that fails, uses YouTube Data API v3 to fetch video Title and Description as a fallback.
 * 
 * This avoids downloading the video/audio (ytdl-core/ffmpeg) which fails on Vercel.
 */
export async function fetchYouTubeTranscript(videoUrl: string): Promise<string> {
  const videoId = extractYouTubeId(videoUrl);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  // 1. Try to fetch transcript using youtube-transcript library
  // This is the most reliable way to get actual text without downloading video
  try {
    console.log(`Attempting to fetch transcript for video ${videoId}...`);

    // Dynamic import to avoid build issues
    const { YoutubeTranscript } = require('youtube-transcript');
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

    if (transcriptItems && transcriptItems.length > 0) {
      const text = transcriptItems.map((item: any) => item.text).join(' ');
      if (text && text.trim().length > 0) {
        console.log(`Successfully fetched transcript, ${text.length} characters`);
        return text;
      }
    }
  } catch (transcriptError) {
    console.log('Direct transcript fetch failed:', transcriptError);
  }

  // 2. Fallback: Use YouTube Data API v3 to get Video Title & Description
  // This is 100% reliable with a valid API Key and works on Vercel
  try {
    console.log('Attempting to fetch video metadata via YouTube Data API v3...');
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY is not set in environment variables');
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const snippet = data.items[0].snippet;
      const title = snippet.title;
      const description = snippet.description;

      let text = `Video Title: ${title}\n\n`;

      if (description) {
        // Limit description length to avoid token limits if it's huge
        const maxDescLength = 5000;
        text += `Video Description:\n${description.length > maxDescLength ? description.substring(0, maxDescLength) + '...' : description}\n\n`;
      }

      text += "\n[Note: Full transcript could not be retrieved. Notes are generated based on the video title and description.]";

      console.log(`Successfully fetched metadata via API, ${text.length} characters`);
      return text;
    } else {
      console.log('No video details found via API');
    }
  } catch (apiError) {
    console.error('YouTube Data API fallback failed:', apiError);
  }

  // 3. Final Fallback: Attempt to use the 'captions' endpoint (Experimental)
  // Note: This usually returns 403 Forbidden for API Keys on third-party videos, but implemented as requested.
  try {
    console.log('Attempting to list captions via YouTube Data API...');
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (apiKey) {
      const listUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`;
      const listResp = await fetch(listUrl);

      if (listResp.ok) {
        const listData = await listResp.json();
        if (listData.items && listData.items.length > 0) {
          // Try to find an English track or the first one
          const track = listData.items.find((i: any) => i.snippet.language === 'en') || listData.items[0];
          const trackId = track.id;

          console.log(`Found caption track ${trackId}, attempting download...`);

          // Note: This download endpoint requires OAuth for third-party videos
          const downloadUrl = `https://www.googleapis.com/youtube/v3/captions/${trackId}?key=${apiKey}`;
          const downResp = await fetch(downloadUrl, {
            headers: { 'Accept': 'application/json' } // Requesting JSON/SRT if possible
          });

          if (downResp.ok) {
            const captionText = await downResp.text();
            if (captionText && captionText.length > 50) {
              return captionText;
            }
          } else {
            console.log(`Caption download failed: ${downResp.status} (Expected 403 for API Key)`);
          }
        }
      }
    }
  } catch (e) {
    console.log('Caption API flow failed', e);
  }

  throw new Error('Could not retrieve transcript. Please ensure the video has captions enabled or try a different video.');
}

// Deprecated/Removed functions (ytdl/ffmpeg) to ensure Vercel compatibility
export async function downloadYouTubeAudio(videoUrl: string): Promise<string> {
  throw new Error('Audio download is disabled in this serverless environment.');
}

export async function cleanupAudioFile(filePath: string): Promise<void> {
  // No-op
}
