/**
 * Video transcription utilities using Groq Whisper API
 */

import OpenAI from 'openai';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Get Groq client for Whisper API
 */
function getGroqClient(): OpenAI {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY is not set in environment variables');
    }

    return new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
    });
}

/**
 * Extract audio from video file using ffmpeg
 * Note: This requires ffmpeg to be installed on the system
 */
async function extractAudioFromVideo(videoPath: string): Promise<string> {
    const audioPath = videoPath.replace(/\.[^.]+$/, '.mp3');

    try {
        // Check if ffmpeg is available
        let ffmpegPath = 'ffmpeg';
        try {
            // Try to use ffmpeg-static if available
            const ffmpegStatic = require('ffmpeg-static');
            if (ffmpegStatic) {
                ffmpegPath = ffmpegStatic;
                console.log('Using ffmpeg-static:', ffmpegPath);
            } else {
                // Fallback to system ffmpeg
                await execAsync('ffmpeg -version');
            }
        } catch (error) {
            // Try common Windows installation path as last resort
            const commonPath = 'C:\\ffmpeg\\bin\\ffmpeg.exe';
            try {
                const { stdout } = await execAsync(`"${commonPath}" -version`);
                if (stdout.includes('ffmpeg version')) {
                    ffmpegPath = `"${commonPath}"`;
                    console.log('Using FFmpeg from absolute path:', ffmpegPath);
                } else {
                    throw new Error('FFmpeg not found in PATH or common location');
                }
            } catch (innerError) {
                console.error('FFmpeg detection failed:', innerError);
                throw new Error('FFmpeg is not installed. Please install FFmpeg to process video files.');
            }
        }

        // Extract audio using ffmpeg
        // -i: input file
        // -vn: disable video
        // -acodec libmp3lame: use MP3 codec
        // -ar 16000: sample rate 16kHz (optimal for speech)
        // -ac 1: mono audio
        // -b:a 64k: bitrate 64kbps (sufficient for speech)
        const command = `${ffmpegPath} -i "${videoPath}" -vn -acodec libmp3lame -ar 16000 -ac 1 -b:a 64k "${audioPath}" -y`;

        console.log('Extracting audio from video...');
        await execAsync(command);
        console.log('Audio extracted successfully');

        return audioPath;
    } catch (error) {
        console.error('Error extracting audio:', error);
        throw new Error(`Failed to extract audio from video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Transcribe audio/video file using Groq Whisper API
 */
export async function transcribeAudio(filePath: string, originalFilename?: string): Promise<string> {
    try {
        const client = getGroqClient();

        // Read the file
        const fileBuffer = await readFile(filePath);

        // Determine mime type based on extension
        const ext = (originalFilename || filePath).split('.').pop()?.toLowerCase() || 'mp3';
        let mimeType = 'audio/mpeg';

        const mimeTypes: Record<string, string> = {
            'mp3': 'audio/mpeg',
            'mp4': 'video/mp4',
            'mpeg': 'video/mpeg',
            'mpga': 'audio/mpeg',
            'm4a': 'audio/mp4',
            'wav': 'audio/wav',
            'webm': 'video/webm',
            'ogg': 'audio/ogg',
            'flac': 'audio/flac'
        };

        if (mimeTypes[ext]) {
            mimeType = mimeTypes[ext];
        }

        // Create a File object from the buffer
        // Note: The filename is important for the API to detect format
        const fileObj = new File([fileBuffer], originalFilename || `audio.${ext}`, { type: mimeType });

        console.log(`Sending ${ext} file to Groq Whisper API...`);

        // Use Groq's Whisper API for transcription
        const transcription = await client.audio.transcriptions.create({
            file: fileObj,
            model: 'whisper-large-v3', // Groq's Whisper model
            language: 'en', // You can change this or make it auto-detect
            response_format: 'text',
        });

        console.log('Transcription completed successfully');

        if (typeof transcription === 'string') {
            return transcription;
        }

        // If it's an object with text property
        return (transcription as any).text || '';
    } catch (error) {
        console.error('Error transcribing file:', error);
        throw new Error(`Failed to transcribe file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Main function to transcribe video file
 */
export async function transcribeVideo(videoPath: string): Promise<string> {
    const supportedDirectFormats = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm', 'ogg', 'flac'];
    const ext = videoPath.split('.').pop()?.toLowerCase();

    try {
        console.log(`Starting video transcription for: ${videoPath}`);

        // Try direct transcription (Groq supports video files directly)
        // We removed the FFmpeg fallback because it's not supported in the Vercel serverless environment
        // without complex configuration. Groq's Whisper API handles most common video formats.

        console.log(`Attempting direct transcription for .${ext} file...`);
        const transcription = await transcribeAudio(videoPath, `video.${ext}`);

        if (transcription && transcription.trim().length > 0) {
            console.log(`Direct transcription successful: ${transcription.length} characters`);
            return transcription;
        }

        throw new Error('No transcription generated. The video might not contain any speech or the format is not supported.');
    } catch (error) {
        console.error('Video transcription error:', error);
        throw error;
    }
}

/**
 * Alternative: Transcribe video without ffmpeg (browser-based approach)
 * This uses the video file directly if it's in a supported format
 */
export async function transcribeVideoSimple(videoFile: File): Promise<string> {
    try {
        const client = getGroqClient();

        // Save video to temp file
        const tempPath = join(tmpdir(), `video-${Date.now()}-${videoFile.name}`);
        const bytes = await videoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(tempPath, buffer);

        try {
            // Try to transcribe directly (works for some formats)
            const transcription = await transcribeVideo(tempPath);
            return transcription;
        } finally {
            // Clean up temp file
            try {
                await unlink(tempPath);
            } catch (e) {
                console.error('Failed to cleanup temp video file:', e);
            }
        }
    } catch (error) {
        console.error('Simple video transcription error:', error);
        throw error;
    }
}
