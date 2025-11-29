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

