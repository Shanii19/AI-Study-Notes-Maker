/**
 * LocalStorage utilities for saving and managing study notes history
 */

import { SavedNote, SortOption } from './types';

const STORAGE_KEY = 'study-notes-history';
const MAX_PREVIEW_LENGTH = 200;

/**
 * Get all saved notes from localStorage
 */
export function getAllNotes(): SavedNote[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as SavedNote[];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

/**
 * Save a note to localStorage
 */
export function saveNote(note: Omit<SavedNote, 'id' | 'createdAt' | 'updatedAt' | 'preview'>): SavedNote {
  if (typeof window === 'undefined') {
    throw new Error('localStorage is not available');
  }

  const notes = getAllNotes();
  const now = new Date().toISOString();
  const preview = note.notes.substring(0, MAX_PREVIEW_LENGTH) + (note.notes.length > MAX_PREVIEW_LENGTH ? '...' : '');
  
  const newNote: SavedNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...note,
    preview,
    createdAt: now,
    updatedAt: now,
  };

  notes.push(newNote);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  
  return newNote;
}

/**
 * Update an existing note
 */
export function updateNote(id: string, updates: Partial<SavedNote>): SavedNote | null {
  if (typeof window === 'undefined') {
    throw new Error('localStorage is not available');
  }

  const notes = getAllNotes();
  const index = notes.findIndex(n => n.id === id);
  
  if (index === -1) {
    return null;
  }

  const updatedNote: SavedNote = {
    ...notes[index],
    ...updates,
    id, // Ensure ID doesn't change
    updatedAt: new Date().toISOString(),
    preview: updates.notes 
      ? updates.notes.substring(0, MAX_PREVIEW_LENGTH) + (updates.notes.length > MAX_PREVIEW_LENGTH ? '...' : '')
      : notes[index].preview,
  };

  notes[index] = updatedNote;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  
  return updatedNote;
}

/**
 * Delete a note by ID
 */
export function deleteNote(id: string): boolean {
  if (typeof window === 'undefined') {
    throw new Error('localStorage is not available');
  }

  const notes = getAllNotes();
  const filtered = notes.filter(n => n.id !== id);
  
  if (filtered.length === notes.length) {
    return false; // Note not found
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Get a note by ID
 */
export function getNoteById(id: string): SavedNote | null {
  const notes = getAllNotes();
  return notes.find(n => n.id === id) || null;
}

/**
 * Clear all notes
 */
export function clearAllNotes(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export all notes as JSON
 */
export function exportNotes(): string {
  const notes = getAllNotes();
  return JSON.stringify(notes, null, 2);
}

/**
 * Import notes from JSON string
 */
export function importNotes(jsonString: string): { success: boolean; count: number; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, count: 0, error: 'localStorage is not available' };
  }

  try {
    const imported = JSON.parse(jsonString) as SavedNote[];
    
    if (!Array.isArray(imported)) {
      return { success: false, count: 0, error: 'Invalid format: expected an array' };
    }

    // Validate structure
    for (const note of imported) {
      if (!note.id || !note.metadata || !note.notes || !note.sourceType) {
        return { success: false, count: 0, error: 'Invalid note structure' };
      }
    }

    // Merge with existing notes (avoid duplicates by ID)
    const existing = getAllNotes();
    const existingIds = new Set(existing.map(n => n.id));
    const newNotes = imported.filter(n => !existingIds.has(n.id));
    
    const merged = [...existing, ...newNotes];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    
    return { success: true, count: newNotes.length };
  } catch (error) {
    return { 
      success: false, 
      count: 0, 
      error: error instanceof Error ? error.message : 'Failed to parse JSON' 
    };
  }
}

/**
 * Filter and sort notes
 */
export function filterAndSortNotes(
  notes: SavedNote[],
  searchQuery: string,
  dateRange: { start: string | null; end: string | null },
  sourceType: string,
  tags: string[],
  sortBy: SortOption
): SavedNote[] {
  let filtered = [...notes];

  // Search by subject or tags
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(note => 
      note.metadata.subject.toLowerCase().includes(query) ||
      note.metadata.tags.some(tag => tag.toLowerCase().includes(query)) ||
      note.notes.toLowerCase().includes(query)
    );
  }

  // Filter by date range
  if (dateRange.start) {
    filtered = filtered.filter(note => note.metadata.date >= dateRange.start!);
  }
  if (dateRange.end) {
    filtered = filtered.filter(note => note.metadata.date <= dateRange.end!);
  }

  // Filter by source type
  if (sourceType !== 'all') {
    filtered = filtered.filter(note => note.sourceType === sourceType);
  }

  // Filter by tags
  if (tags.length > 0) {
    filtered = filtered.filter(note =>
      tags.some(tag => note.metadata.tags.includes(tag))
    );
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime();
      case 'date-asc':
        return new Date(a.metadata.date).getTime() - new Date(b.metadata.date).getTime();
      case 'subject-asc':
        return a.metadata.subject.localeCompare(b.metadata.subject);
      case 'subject-desc':
        return b.metadata.subject.localeCompare(a.metadata.subject);
      default:
        return 0;
    }
  });

  return filtered;
}

/**
 * Get all unique tags from all notes
 */
export function getAllTags(): string[] {
  const notes = getAllNotes();
  const tagSet = new Set<string>();
  notes.forEach(note => {
    note.metadata.tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

