# AI Study Notes Maker

A Next.js application that generates clean, well-organized study notes from various input sources including YouTube videos, PDFs, Word documents, PowerPoint presentations, and pasted text using Grok AI (xAI).

## Features

- **Multiple Input Types**:
  - YouTube video links (with transcript extraction)
  - PDF files
  - DOCX/DOC files
  - PPTX/PPT files
  - Pasted text
  - Video files (requires additional API setup)

- **AI-Powered Note Generation**:
  - Uses Grok API (xAI) to generate structured study notes
  - Includes headings, bullet points, and examples
  - Clean, readable format

- **User-Friendly Interface**:
  - Progress indicators
  - File validation
  - Error handling
  - Copy and download functionality
  - Accessible design

## Prerequisites

- Node.js 18+ and npm/yarn
- Grok API key from xAI ([Get one here](https://console.x.ai/))

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd "AI study notes maker"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   GROK_API_KEY=gsk_YOUR_API_KEY_HERE
   ```
   
   **Important**: Replace with your own API key if needed.

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
.
├── app/
│   ├── api/
│   │   ├── process/        # API route for processing inputs
│   │   └── generate/       # API route for generating notes
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page component
├── lib/
│   ├── gemini-client.ts    # Google Gemini API client
│   ├── text-extractors.ts  # Text extraction utilities
│   ├── utils.ts            # General utilities
│   └── youtube-utils.ts    # YouTube transcript utilities
├── __tests__/              # Test files
├── package.json
├── tsconfig.json
└── next.config.js
```

## Usage

### 1. Select Input Type
Choose from the dropdown:
- **Paste Text**: Directly paste your text content
- **YouTube Video**: Enter a YouTube video URL (must have captions enabled)
- **PDF File**: Upload a PDF document (max 10MB)
- **DOCX File**: Upload a Word document (max 10MB)
- **PPTX File**: Upload a PowerPoint presentation (max 10MB)
- **Video File**: Upload a video file (max 50MB, requires additional setup)

### 2. Provide Input
- For YouTube: Paste the video URL
- For files: Click to select and upload
- For text: Paste your content in the text area

### 3. Generate Notes
Click the "Generate Notes" button and wait for processing:
- Text extraction progress
- AI note generation progress
- Results displayed in the output panel

### 4. Use Your Notes
- **Copy**: Click the "Copy" button to copy notes to clipboard
- **Download**: Click the "Download" button to save as a text file

## API Routes

### POST `/api/process`
Processes different input types and extracts text.

**Request Body** (FormData):
- `inputType`: One of 'youtube', 'video', 'pdf', 'docx', 'pptx', 'text'
- Additional fields based on input type:
  - `youtubeUrl`: For YouTube input
  - `pastedText`: For text input
  - `pdfFile`, `docxFile`, `pptxFile`, `videoFile`: File uploads

**Response**:
```json
{
  "success": true,
  "text": "Extracted text content...",
  "inputType": "pdf",
  "textLength": 1234
}
```

### POST `/api/generate`
Generates study notes from extracted text.

**Request Body** (JSON):
```json
{
  "text": "Content to generate notes from...",
  "inputType": "pdf"
}
```

**Response**:
```json
{
  "success": true,
  "notes": "# Study Notes\n\n- Key point 1...",
  "inputType": "pdf"
}
```

## Testing

Run tests with:
```bash
npm test
```

Test files are located in the `__tests__` directory:
- `__tests__/api/process.test.ts` - Tests for input processing
- `__tests__/api/generate.test.ts` - Tests for note generation
- `__tests__/lib/utils.test.ts` - Tests for utility functions

## Error Handling

The application handles various error scenarios:

- **Missing Transcripts**: YouTube videos without captions will show an error
- **Invalid File Types**: Only supported file types are accepted
- **File Size Limits**: Files exceeding size limits are rejected
- **API Errors**: Quota exceeded or invalid API key errors are displayed
- **Network Errors**: Connection issues are handled gracefully

## Accessibility Features

- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- Focus indicators
- High contrast text
- Responsive design for mobile devices

## File Size Limits

- **PDF/DOCX/PPTX**: 10MB maximum
- **Video Files**: 50MB maximum
- **Text Content**: 100,000 characters maximum

## Supported File Types

- **PDF**: `.pdf`
- **Word**: `.docx`, `.doc`
- **PowerPoint**: `.pptx`, `.ppt`
- **Video**: `.mp4`, `.webm`, `.ogg`, `.mov`, `.avi`

## Limitations

1. **Video Speech-to-Text**: Video file processing requires additional API setup (e.g., Google Cloud Speech-to-Text, AWS Transcribe). Currently returns a helpful error message.

2. **YouTube Transcripts**: Videos must have captions enabled. If not available, the app will show an error.

3. **PPTX Extraction**: Basic text extraction from PowerPoint files. Complex formatting may not be preserved.

4. **API Quota**: Subject to Google Gemini API rate limits and quotas.

## Security Notes

- API keys are stored in `.env.local` and never exposed client-side
- File uploads are validated for type and size
- Temporary files are cleaned up after processing
- No sensitive data is stored

## Development

### Build for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Troubleshooting

### "API quota exceeded" Error
- Check your Google Gemini API quota
- Verify your API key is correct
- Wait for quota reset or upgrade your plan

### "Transcript not available" Error
- Ensure the YouTube video has captions enabled
- Try a different video with captions
- Use the paste text option instead

### File Upload Fails
- Check file size (must be under limits)
- Verify file type is supported
- Ensure stable internet connection

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check Node.js version (18+ required)
- Verify environment variables are set

## License

This project is for educational and personal use.

## Contributing

Feel free to submit issues and enhancement requests!

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Grok AI](https://x.ai/) - AI model (xAI)
- [pdf-parse](https://www.npmjs.com/package/pdf-parse) - PDF text extraction
- [mammoth](https://www.npmjs.com/package/mammoth) - DOCX text extraction
- [youtube-transcript](https://www.npmjs.com/package/youtube-transcript) - YouTube transcript fetching

