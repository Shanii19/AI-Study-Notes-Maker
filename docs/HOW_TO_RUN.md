# How to Run the Development Server

## Problem
PowerShell execution policy is blocking npm commands.

## Solutions

### ✅ **Option 1: Use the Batch File (Recommended)**
Simply double-click `start_dev.bat` in the project folder, or run:
```bash
.\start_dev.bat
```

### ✅ **Option 2: Use npm.cmd directly**
In PowerShell, run:
```powershell
npm.cmd run dev
```

### ✅ **Option 3: Use cmd.exe**
In PowerShell, run:
```powershell
cmd /c "npm run dev"
```

### Option 4: Change PowerShell Execution Policy (Admin Required)
If you want to fix this permanently:

1. Open PowerShell as Administrator
2. Run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
3. Type `Y` to confirm
4. Now you can use `npm run dev` normally

## Quick Start

**The easiest way:**
1. Double-click `start_dev.bat` in the project folder
2. Wait for the server to start
3. Open your browser to `http://localhost:3000`

## Environment Setup

Make sure you have your `.env.local` file with:
```
GROQ_API_KEY=your_api_key_here
```

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Make sure you ran `npm install` first
- Verify your `.env.local` file exists

### API errors
- Verify your GROQ_API_KEY is correct
- Check your internet connection
- Ensure the API key has proper permissions

## All Available Commands

```bash
# Development server
npm.cmd run dev

# Build for production
npm.cmd run build

# Start production server
npm.cmd run start

# Run linter
npm.cmd run lint
```
