/**
 * Text extraction functions for different file types
 */

import { readFile } from 'fs-extra';
import { join } from 'path';
import { tmpdir } from 'os';
import { writeFile, unlink } from 'fs/promises';
import { createReadStream } from 'fs';

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    console.log(`Reading PDF file from: ${filePath}`);
    const dataBuffer = await readFile(filePath);
    console.log(`PDF file size: ${dataBuffer.length} bytes`);

    if (dataBuffer.length === 0) {
      throw new Error('PDF file is empty');
    }

    console.log('Parsing PDF content...');
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(dataBuffer);

    if (!data || !data.text) {
      throw new Error('No text content found in PDF. The PDF might be image-based or corrupted.');
    }

    const extractedText = data.text.trim();
    console.log(`Extracted ${extractedText.length} characters from PDF`);

    if (extractedText.length === 0) {
      throw new Error('PDF appears to be empty or contains only images. Please use a PDF with selectable text.');
    }

    return extractedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    if (error instanceof Error) {
      // Provide more helpful error messages
      if (error.message.includes('Invalid PDF')) {
        throw new Error('Invalid PDF file. Please ensure the file is a valid PDF document.');
      }
      if (error.message.includes('image')) {
        throw new Error('This PDF appears to be image-based. Please use a PDF with selectable text, or convert images to text first.');
      }
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
    throw new Error(`Failed to extract text from PDF: Unknown error`);
  }
}

/**
 * Extract text from DOCX file
 */
export async function extractTextFromDOCX(filePath: string): Promise<string> {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from PPTX file
 * PPTX files are ZIP archives containing XML files
 */
export async function extractTextFromPPTX(filePath: string): Promise<string> {
  try {
    // PPTX files are ZIP archives, we need to extract and parse XML
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();

    let text = '';

    // Extract text from slide XML files
    for (const entry of zipEntries) {
      if (entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml')) {
        const content = entry.getData().toString('utf8');

        // Simple XML text extraction (remove tags and get text content)
        // This is a basic implementation - for production, use a proper XML parser
        const textMatches = content.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
        if (textMatches) {
          for (const match of textMatches) {
            const textContent = match.replace(/<[^>]*>/g, '');
            if (textContent.trim()) {
              text += textContent.trim() + '\n';
            }
          }
        }
      }
    }

    return text.trim() || 'No text found in presentation';
  } catch (error) {
    throw new Error(`Failed to extract text from PPTX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Save uploaded file to temporary location
 */
export async function saveTemporaryFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const tempPath = join(tmpdir(), `upload-${Date.now()}-${file.name}`);
  await writeFile(tempPath, buffer);
  return tempPath;
}

/**
 * Clean up temporary file
 */
export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    console.error(`Failed to cleanup temp file ${filePath}:`, error);
  }
}

