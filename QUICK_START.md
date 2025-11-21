# Quick Start Guide - Running the Application

## Prerequisites

- Node.js 18+ installed ([Download](https://nodejs.org/))
- npm (comes with Node.js)

## Step-by-Step Instructions

### 1. Open Terminal/Command Prompt

**Windows:**
- Press `Win + R`, type `cmd`, press Enter
- OR open PowerShell
- Navigate to project folder: `cd "G:\AI study notes maker"`

**Mac/Linux:**
- Open Terminal
- Navigate to project folder: `cd "/path/to/AI study notes maker"`

### 2. Install Dependencies (First Time Only)

```bash
npm install
```

This will install all required packages. Wait for it to complete (may take 1-2 minutes).

### 3. Set Up Environment Variables

Create a file named `.env.local` in the project root with:

```env
GROK_API_KEY=gsk_YOUR_API_KEY_HERE
```

**On Windows (Command Prompt):**
```cmd
echo GROK_API_KEY=gsk_YOUR_API_KEY_HERE > .env.local
```

**On Windows (PowerShell):**
```powershell
Set-Content -Path .env.local -Value "GROK_API_KEY=gsk_YOUR_API_KEY_HERE"
```

**On Mac/Linux:**
```bash
echo 'GROK_API_KEY=gsk_YOUR_API_KEY_HERE' > .env.local
```

Or create the file manually in your code editor.

### 4. Run the Development Server

```bash
npm run dev
```

You should see output like:
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

### 5. Open in Browser

Open your web browser and go to:
```
http://localhost:3000
```

## Common Commands

### Development Mode
```bash
npm run dev
```
- Starts development server
- Auto-reloads on file changes
- Accessible at http://localhost:3000

### Production Build
```bash
npm run build
npm start
```
- Creates optimized production build
- Runs production server

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
```

## Stopping the Server

Press `Ctrl + C` in the terminal to stop the development server.

## Troubleshooting

### "npm: command not found"
- Install Node.js from https://nodejs.org/
- Restart terminal after installation

### "Port 3000 is already in use"
```bash
npm run dev -- -p 3001
```
Then open http://localhost:3001

### "Module not found" errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json  # Mac/Linux
rmdir /s node_modules package-lock.json # Windows
npm install
```

### "GEMINI_API_KEY not found"
- Verify `.env.local` exists in project root
- Check file has correct content (no extra spaces)
- Restart the dev server after creating/editing `.env.local`

## What You'll See

When you run `npm run dev`, the terminal will show:
- Next.js compilation status
- Any errors or warnings
- Server URL (usually http://localhost:3000)
- Ready message when server starts

The application will automatically reload when you make code changes.

## Next Steps

1. ✅ Server running at http://localhost:3000
2. Open browser and test the application
3. Generate some notes
4. Try saving notes with metadata
5. Check the History page

Enjoy using the AI Study Notes Maker! 🎉

