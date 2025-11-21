/**
 * Type definitions for the study notes application
 */

export type InputType = 'youtube' | 'video' | 'pdf' | 'docx' | 'pptx' | 'text';

export interface NoteMetadata {
  date: string; // ISO date string
  subject: string;
  tags: string[]; // Array of tag strings
}

export interface SavedNote {
  id: string; // Unique identifier (timestamp-based)
  metadata: NoteMetadata;
  notes: string; // The generated notes content
  sourceType: InputType;
  sourceId: string; // YouTube video ID, filename, or 'pasted-text'
  preview: string; // First 200 characters of notes
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface HistoryFilters {
  searchQuery: string;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  sourceType: InputType | 'all';
  tags: string[];
}

export type SortOption = 'date-desc' | 'date-asc' | 'subject-asc' | 'subject-desc';

