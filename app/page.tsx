'use client';

import { useState, FormEvent, ChangeEvent, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { NoteMetadata } from '@/lib/types';
import { saveNote, getNoteById, updateNote } from '@/lib/storage';
import { jsPDF } from 'jspdf';

interface ProcessingState {
  isProcessing: boolean;
  isGenerating: boolean;
  progress: number;
  message: string;
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteId = searchParams.get('id');

  // Input state
  const [inputType, setInputType] = useState<'pdf' | 'youtube' | 'video' | 'text'>('pdf');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [metadata, setMetadata] = useState<NoteMetadata>({
    date: new Date().toISOString().split('T')[0],
    subject: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState<string>('');
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    isGenerating: false,
    progress: 0,
    message: '',
  });

  // Load note from history if ID is in URL
  useEffect(() => {
    if (noteId) {
      const savedNote = getNoteById(noteId);
      if (savedNote) {
        setGeneratedNotes(savedNote.notes);
        setMetadata(savedNote.metadata);
        setSourceId(savedNote.sourceId);
        setCurrentNoteId(savedNote.id);
        setShowMetadataForm(false); // Don't show form for reopened notes
      }
    }
  }, [noteId]);

  // File size limits
  const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

  const validateFile = (file: File, maxSize: number, allowedTypes: string[]): string | null => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedTypes.includes(extension)) {
      return `Invalid file type. Allowed: ${allowedTypes.join(', ')}`;
    }
    if (file.size > maxSize) {
      return `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`;
    }
    return null;
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void,
    maxSize: number,
    allowedTypes: string[]
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      setter(null);
      setError('');
      return;
    }

    const validationError = validateFile(file, maxSize, allowedTypes);
    if (validationError) {
      setError(validationError);
      setter(null);
      e.target.value = '';
    } else {
      setError('');
      setter(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await generateNotes('medium'); // Default to medium
  };

  const generateNotes = async (level: 'easy' | 'medium' | 'detailed') => {
    setError('');
    setProcessingState({
      isProcessing: true,
      isGenerating: false,
      progress: 0,
      message: `Generating ${level} notes...`,
    });

    try {
      // Step 1: Process input and extract text
      const formData = new FormData();
      formData.append('inputType', inputType);

      if (inputType === 'pdf') {
        if (!pdfFile) throw new Error('Please upload a PDF file');
        formData.append('pdfFile', pdfFile);
      } else if (inputType === 'youtube') {
        if (!youtubeUrl) throw new Error('Please enter a YouTube URL');
        formData.append('youtubeUrl', youtubeUrl);
      } else if (inputType === 'text') {
        if (!pastedText) throw new Error('Please paste some text');
        formData.append('pastedText', pastedText);
      } else if (inputType === 'video') {
        if (!videoFile) throw new Error('Please upload a video file');
        formData.append('videoFile', videoFile);
      }

      setProcessingState(prev => ({
        ...prev,
        progress: 30,
        message: 'Extracting text from input...',
      }));

      const processResponse = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      // Check if response is JSON before parsing
      const contentType = processResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await processResponse.text();
        console.error('Non-JSON response from /api/process:', text.substring(0, 200));
        throw new Error('Server returned an error. Please check the server logs and ensure the API key is set correctly.');
      }

      const processData = await processResponse.json();

      if (!processResponse.ok) {
        throw new Error(processData.error || processData.details || 'Failed to process input');
      }

      setProcessingState(prev => ({
        ...prev,
        progress: 60,
        message: `Generating ${level} study notes...`,
        isGenerating: true,
      }));

      // Step 2: Generate study notes
      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: processData.text,
          inputType: processData.inputType,
          detailLevel: level,
        }),
      });

      // Check if response is JSON before parsing
      const generateContentType = generateResponse.headers.get('content-type');
      if (!generateContentType || !generateContentType.includes('application/json')) {
        const text = await generateResponse.text();
        console.error('Non-JSON response from /api/generate:', text.substring(0, 200));
        throw new Error('Server returned an error while generating notes. Please check the server logs and ensure the Groq API key is set correctly in .env.local');
      }

      const generateData = await generateResponse.json();

      if (!generateResponse.ok) {
        console.error('Generate API error:', generateData);
        const errorMsg = generateData.error || 'Failed to generate notes';
        const details = generateData.details ? ` ${generateData.details}` : '';
        throw new Error(`${errorMsg}${details}`);
      }

      setProcessingState({
        isProcessing: false,
        isGenerating: false,
        progress: 100,
        message: 'Notes generated successfully!',
      });

      setGeneratedNotes(generateData.notes);
      setShowMetadataForm(true);
      setCurrentNoteId(null); // Reset for new note

      // Extract source ID based on input type
      let extractedSourceId = '';
      if (inputType === 'pdf') extractedSourceId = pdfFile?.name || 'unknown.pdf';
      else if (inputType === 'youtube') extractedSourceId = youtubeUrl;
      else if (inputType === 'video') extractedSourceId = videoFile?.name || 'unknown.mp4';
      else if (inputType === 'text') extractedSourceId = 'pasted-text-' + Date.now();

      setSourceId(extractedSourceId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('Error in generateNotes:', err);
      setError(errorMessage);
      setProcessingState({
        isProcessing: false,
        isGenerating: false,
        progress: 0,
        message: '',
      });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedNotes);
      setCopySuccess(true);
      setError('');
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      setError('Failed to copy notes to clipboard');
      setCopySuccess(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedNotes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-notes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxLineWidth = pageWidth - (margin * 2);
      const lineHeight = 7;

      // Title
      doc.setFontSize(20);
      doc.text("Study Notes", margin, margin);

      // Metadata
      doc.setFontSize(10);
      doc.setTextColor(100);
      const dateStr = `Generated on: ${new Date().toLocaleDateString()}`;
      doc.text(dateStr, margin, margin + 10);
      if (metadata.subject) {
        doc.text(`Subject: ${metadata.subject}`, margin, margin + 15);
      }

      // Content
      doc.setFontSize(12);
      doc.setTextColor(0);

      // Split text to fit page width
      const textLines = doc.splitTextToSize(generatedNotes, maxLineWidth);

      let cursorY = margin + 25;

      textLines.forEach((line: string) => {
        if (cursorY + lineHeight > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }
        doc.text(line, margin, cursorY);
        cursorY += lineHeight;
      });

      doc.save(`study-notes-${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError('Failed to generate PDF');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !metadata.tags.includes(tag)) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleSaveNote = () => {
    if (!metadata.subject.trim()) {
      setError('Please enter a subject');
      return;
    }

    if (!generatedNotes.trim()) {
      setError('No notes to save');
      return;
    }

    try {
      console.log('Saving note with:', { inputType, sourceId, subject: metadata.subject });

      if (currentNoteId) {
        // Update existing note
        console.log('Updating existing note:', currentNoteId);
        updateNote(currentNoteId, {
          metadata,
          notes: generatedNotes,
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        // Save new note
        console.log('Creating new note');
        const saved = saveNote({
          metadata,
          notes: generatedNotes,
          sourceType: inputType, // Use actual input type
          sourceId,
        });
        console.log('Note saved successfully:', saved.id);
        setCurrentNoteId(saved.id);
        setSaveSuccess(true);
        setShowMetadataForm(false);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
      setError('');
    } catch (err) {
      console.error('Error saving note:', err);
      setError(err instanceof Error ? err.message : 'Failed to save note');
    }
  };

  const handleEditMetadata = () => {
    setShowMetadataForm(true);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>AI Study Notes Maker</h1>
        <p>Generate clean study notes from PDF files</p>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Generator</Link>

        </nav>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${inputType === 'pdf' ? styles.activeTab : ''}`}
          onClick={() => setInputType('pdf')}
        >
          PDF Document
        </button>
        <button
          className={`${styles.tab} ${inputType === 'youtube' ? styles.activeTab : ''}`}
          onClick={() => setInputType('youtube')}
        >
          YouTube Video
        </button>
        <button
          className={`${styles.tab} ${inputType === 'text' ? styles.activeTab : ''}`}
          onClick={() => setInputType('text')}
        >
          Paste Text
        </button>
        <button
          className={`${styles.tab} ${inputType === 'video' ? styles.activeTab : ''}`}
          onClick={() => setInputType('video')}
        >
          Upload Video
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.card}>
        {inputType === 'pdf' && (
          <div className={styles.inputGroup}>
            <label htmlFor="pdfFile" className={styles.label}>
              Upload PDF File
            </label>
            <div className={styles.fileInput}>
              <input
                id="pdfFile"
                type="file"
                accept=".pdf"
                onChange={e => handleFileChange(e, setPdfFile, MAX_PDF_SIZE, ['pdf'])}
                aria-label="Upload PDF file"
              />
              <label htmlFor="pdfFile" className={styles.fileInputLabel}>
                {pdfFile ? (
                  <>
                    <span className={styles.fileName}>{pdfFile.name}</span>
                    <span className={styles.fileSize}>({formatFileSize(pdfFile.size)})</span>
                  </>
                ) : (
                  'Click to select PDF file (max 10MB)'
                )}
              </label>
            </div>
            <p className={styles.hint}>Note: Only text content will be extracted. Images and diagrams are not currently processed.</p>
          </div>
        )}

        {inputType === 'youtube' && (
          <div className={styles.inputGroup}>
            <label htmlFor="youtubeUrl" className={styles.label}>
              YouTube Video URL
            </label>
            <input
              id="youtubeUrl"
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={styles.input}
            />
          </div>
        )}

        {inputType === 'text' && (
          <div className={styles.inputGroup}>
            <label htmlFor="pastedText" className={styles.label}>
              Paste Text Content
            </label>
            <textarea
              id="pastedText"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste your study material here..."
              className={styles.textarea}
              rows={10}
            />
          </div>
        )}

        {inputType === 'video' && (
          <div className={styles.inputGroup}>
            <label htmlFor="videoFile" className={styles.label}>
              Upload Video File
            </label>
            <div className={styles.fileInput}>
              <input
                id="videoFile"
                type="file"
                accept="video/*"
                onChange={e => handleFileChange(e, setVideoFile, MAX_VIDEO_SIZE, ['mp4', 'mov', 'avi', 'webm'])}
                aria-label="Upload video file"
              />
              <label htmlFor="videoFile" className={styles.fileInputLabel}>
                {videoFile ? (
                  <>
                    <span className={styles.fileName}>{videoFile.name}</span>
                    <span className={styles.fileSize}>({formatFileSize(videoFile.size)})</span>
                  </>
                ) : (
                  'Click to select video file (max 50MB)'
                )}
              </label>
            </div>
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <button
          type="submit"
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={processingState.isProcessing}
        >
          {processingState.isProcessing ? (
            <>
              <span className={styles.loadingSpinner}></span>
              {processingState.message}
            </>
          ) : (
            'Generate Notes'
          )}
        </button>

        {processingState.isProcessing && (
          <div className={styles.progressContainer}>
            <div className={styles.progress}>
              <div
                className={styles.progressBar}
                style={{ width: `${processingState.progress}%` }}
              ></div>
            </div>
            <p className={styles.progressMessage}>{processingState.message}</p>
          </div>
        )}
      </form>

      {generatedNotes && (
        <div className={styles.card}>
          <div className={styles.resultsHeader}>
            <h2>Generated Study Notes</h2>
            <div className={styles.actions}>
              <button onClick={() => generateNotes('easy')} className={styles.btn}>Easy</button>
              <button onClick={() => generateNotes('medium')} className={styles.btn}>Medium</button>
              <button onClick={() => generateNotes('detailed')} className={styles.btn}>Detailed</button>
              <button onClick={handleCopy} className={`${styles.btn} ${styles.btnSecondary}`}>
                {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button onClick={handleDownload} className={`${styles.btn} ${styles.btnSecondary}`}>
                Download Text
              </button>
              <button onClick={handleDownloadPdf} className={`${styles.btn} ${styles.btnSecondary}`}>
                Save as PDF
              </button>

            </div>
          </div>



          <div className={styles.notesOutput}>
            <pre>{generatedNotes}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
