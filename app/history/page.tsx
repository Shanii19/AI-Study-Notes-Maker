'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { SavedNote, InputType, SortOption } from '@/lib/types';
import { getAllNotes, deleteNote, filterAndSortNotes, getAllTags } from '@/lib/storage';

export default function HistoryPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<SavedNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sourceTypeFilter, setSourceTypeFilter] = useState<InputType | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, []);

  // Filter and sort notes when filters change
  useEffect(() => {
    const filtered = filterAndSortNotes(
      notes,
      searchQuery,
      { start: dateRange.start || null, end: dateRange.end || null },
      sourceTypeFilter,
      selectedTags,
      sortBy
    );
    setFilteredNotes(filtered);
  }, [notes, searchQuery, dateRange, sourceTypeFilter, selectedTags, sortBy]);

  const loadNotes = () => {
    const allNotes = getAllNotes();
    setNotes(allNotes);
    setAvailableTags(getAllTags());
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNote(id);
      loadNotes();
      setSuccess('Note deleted successfully');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const handleOpenNote = (id: string) => {
    router.push(`/?id=${id}`);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSourceTypeLabel = (type: InputType) => {
    const labels: Record<InputType, string> = {
      youtube: 'YouTube',
      video: 'Video',
      pdf: 'PDF',
      docx: 'DOCX',
      pptx: 'PPTX',
      text: 'Text',
    };
    return labels[type];
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Study Notes History</h1>
        <p>View, search, and manage your saved study notes</p>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Generator</Link>
          <Link href="/history" className={styles.navLink}>History</Link>
        </nav>
      </header>

      {/* Filters and Controls */}
      <div className={styles.card}>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label htmlFor="search" className={styles.label}>
              Search
            </label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject, tags, or content..."
              className={styles.input}
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="sortBy" className={styles.label}>
              Sort By
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className={styles.select}
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="subject-asc">Subject (A-Z)</option>
              <option value="subject-desc">Subject (Z-A)</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="sourceType" className={styles.label}>
              Source Type
            </label>
            <select
              id="sourceType"
              value={sourceTypeFilter}
              onChange={(e) => setSourceTypeFilter(e.target.value as InputType | 'all')}
              className={styles.select}
            >
              <option value="all">All Types</option>
              <option value="youtube">YouTube</option>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
              <option value="pptx">PPTX</option>
              <option value="text">Text</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="dateStart" className={styles.label}>
              Date Range
            </label>
            <div className={styles.dateRange}>
              <input
                id="dateStart"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className={styles.input}
                placeholder="Start date"
              />
              <span>to</span>
              <input
                id="dateEnd"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className={styles.input}
                placeholder="End date"
              />
            </div>
          </div>
        </div>

        {availableTags.length > 0 && (
          <div className={styles.filterGroup}>
            <label className={styles.label}>Filter by Tags</label>
            <div className={styles.tagsContainer}>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`${styles.tag} ${selectedTags.includes(tag) ? styles.tagActive : ''}`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className={styles.clearTags}
              >
                Clear tags
              </button>
            )}
          </div>
        )}

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className={styles.success} role="alert">
            {success}
          </div>
        )}
      </div>

      {/* Notes List */}
      <div className={styles.card}>
        <h2>
          {filteredNotes.length === notes.length
            ? `All Notes (${notes.length})`
            : `Filtered Notes (${filteredNotes.length} of ${notes.length})`}
        </h2>

        {filteredNotes.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{notes.length === 0 ? 'No notes saved yet.' : 'No notes match your filters.'}</p>
            {notes.length === 0 && (
              <Link href="/" className={styles.btn}>
                Generate Your First Note
              </Link>
            )}
          </div>
        ) : (
          <div className={styles.notesList}>
            {filteredNotes.map((note) => (
              <div key={note.id} className={styles.noteCard}>
                <div className={styles.noteHeader}>
                  <h3>{note.metadata.subject}</h3>
                  <div className={styles.noteMeta}>
                    <span className={styles.sourceType}>{getSourceTypeLabel(note.sourceType)}</span>
                    <span className={styles.date}>{formatDate(note.metadata.date)}</span>
                  </div>
                </div>
                <div className={styles.notePreview}>{note.preview}</div>
                {note.metadata.tags.length > 0 && (
                  <div className={styles.noteTags}>
                    {note.metadata.tags.map((tag, idx) => (
                      <span key={idx} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className={styles.noteActions}>
                  <button
                    onClick={() => handleOpenNote(note.id)}
                    className={`${styles.btn} ${styles.btnPrimary}`}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className={`${styles.btn} ${styles.btnDanger}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
