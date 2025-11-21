# Setup Instructions

## Step 1: Install Dependencies

Run the following command in the project root directory:

```bash
npm install
```

This will install all required dependencies including:
- Next.js and React
- OpenAI SDK (for Grok API compatibility)
- PDF, DOCX, and PPTX text extraction libraries
- YouTube transcript utilities
- Testing libraries

## Step 2: Configure Environment Variables

Create a `.env.local` file in the root directory with the following content:

```env
GROK_API_KEY=gsk_YOUR_API_KEY_HERE
```

**Important Security Notes:**
- Never commit `.env.local` to version control (it's already in `.gitignore`)
- Replace the API key with your own Grok API key if needed
- Get your API key from: https://console.x.ai/

## Step 3: Run the Development Server

```bash
npm run dev
```

The application will be available at: http://localhost:3000

## Step 4: Test the Application

1. Open http://localhost:3000 in your browser
2. Try different input types:
   - Paste some text and generate notes
   - Upload a PDF file
   - Try a YouTube video URL (with captions)

## Running Tests

```bash
npm test
```

## Building for Production

```bash
npm run build
npm start
```

## Troubleshooting

### Module Not Found Errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

### API Key Errors
- Verify `.env.local` exists in the root directory
- Check that the API key is correct
- Ensure no extra spaces or quotes around the key

### Port Already in Use
- Change the port: `npm run dev -- -p 3001`
- Or kill the process using port 3000

