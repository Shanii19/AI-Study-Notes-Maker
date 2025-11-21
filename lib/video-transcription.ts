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
            await execAsync('ffmpeg -version');
        } catch (error) {
            // Try common Windows installation path
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
                throw new Error('FFmpeg is not installed. Please install FFmpeg to process video files. Visit: https://ffmpeg.org/download.html');
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
 * Transcribe audio file using Groq Whisper API
 */
async function transcribeAudio(audioPath: string): Promise<string> {
    try {
        const client = getGroqClient();

        // Read the audio file
        const audioBuffer = await readFile(audioPath);

        // Create a File object from the buffer
        const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });

        console.log('Sending audio to Groq Whisper API...');

        // Use Groq's Whisper API for transcription
        const transcription = await client.audio.transcriptions.create({
            file: audioFile,
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
        console.error('Error transcribing audio:', error);
        throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Main function to transcribe video file
 */
export async function transcribeVideo(videoPath: string): Promise<string> {
    let audioPath: string | null = null;

    try {
        console.log(`Starting video transcription for: ${videoPath}`);

        // Step 1: Extract audio from video
        audioPath = await extractAudioFromVideo(videoPath);

        // Step 2: Transcribe the audio
        const transcription = await transcribeAudio(audioPath);

        if (!transcription || transcription.trim().length === 0) {
            throw new Error('No transcription generated. The video might not contain any speech.');
        }

        console.log(`Transcription completed: ${transcription.length} characters`);
        return transcription;
    } catch (error) {
        console.error('Video transcription error:', error);
        throw error;
    } finally {
        // Clean up temporary audio file
        if (audioPath) {
            try {
                await unlink(audioPath);
                console.log('Cleaned up temporary audio file');
            } catch (cleanupError) {
                console.error('Failed to cleanup audio file:', cleanupError);
            }
        }
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
