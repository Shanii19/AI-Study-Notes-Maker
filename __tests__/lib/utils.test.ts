/**
 * Tests for utility functions
 */

import {
  validateFileType,
  validateFileSize,
  extractYouTubeId,
  formatFileSize,
} from '@/lib/utils';

describe('utils', () => {
  describe('validateFileType', () => {
    it('should return true for valid file type', () => {
      expect(validateFileType('document.pdf', ['pdf', 'docx'])).toBe(true);
    });

    it('should return false for invalid file type', () => {
      expect(validateFileType('document.txt', ['pdf', 'docx'])).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(validateFileType('document.PDF', ['pdf'])).toBe(true);
    });
  });

  describe('validateFileSize', () => {
    it('should return true for file within size limit', () => {
      expect(validateFileSize(1024, 2048)).toBe(true);
    });

    it('should return false for file exceeding size limit', () => {
      expect(validateFileSize(2048, 1024)).toBe(false);
    });
  });

  describe('extractYouTubeId', () => {
    it('should extract ID from standard YouTube URL', () => {
      expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from short YouTube URL', () => {
      expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid URL', () => {
      expect(extractYouTubeId('https://example.com')).toBe(null);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
    });
  });
});

