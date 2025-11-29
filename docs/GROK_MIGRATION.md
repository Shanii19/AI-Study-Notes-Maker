# Migration from Gemini to Grok API

## Changes Made

### 1. ✅ API Client Updated
- **Old**: `lib/gemini-client.ts` (using Google Gemini)
- **New**: `lib/grok-client.ts` (using Grok API from xAI)

### 2. ✅ Dependencies Updated
- **Removed**: `@google/generative-ai`
- **Added**: `openai` (OpenAI SDK, compatible with Grok API)

### 3. ✅ Environment Variable Changed
- **Old**: `GEMINI_API_KEY=...`
- **New**: `GROK_API_KEY=gsk_YOUR_API_KEY_HERE`

### 4. ✅ API Endpoint
- **Base URL**: `https://api.x.ai/v1`
- **Model**: `grok-beta` (or `grok-2`)

## Setup Instructions

### Step 1: Update .env.local

Update your `.env.local` file:

```env
GROK_API_KEY=gsk_YOUR_API_KEY_HERE
```

**Remove the old line**:
```env
GEMINI_API_KEY=...
```

### Step 2: Install New Dependencies

```powershell
npm install
```

This will install the `openai` package needed for Grok API.

### Step 3: Restart Server

```powershell
npm run dev
```

## What Changed in Code

### API Client (`lib/grok-client.ts`)
- Uses OpenAI SDK with Grok's base URL
- Model: `grok-beta`
- Same function signature: `generateStudyNotes(text, inputType)`

### API Route (`app/api/generate/route.ts`)
- Updated import from `gemini-client` to `grok-client`
- Updated environment variable check

### Package.json
- Replaced `@google/generative-ai` with `openai`

## Testing

After migration:

1. **Check API Key**:
   - Server should log: `✓ Grok API key loaded: ...`

2. **Test PDF Upload**:
   - Upload a PDF
   - Should generate notes using Grok

3. **Test YouTube**:
   - Paste YouTube URL
   - Should generate notes using Grok

## Grok API Details

- **Provider**: xAI (Elon Musk's company)
- **API Endpoint**: `https://api.x.ai/v1`
- **Models Available**: 
  - `grok-beta` (recommended)
  - `grok-2`
  - `grok-v2-beta`
- **SDK**: OpenAI-compatible SDK

## Troubleshooting

### "GROK_API_KEY not set"
- Verify `.env.local` has `GROK_API_KEY=...`
- Restart server after updating `.env.local`

### "Model not found"
- Try changing model name in `lib/grok-client.ts`:
  - `grok-beta` → `grok-2` or `grok-v2-beta`

### "Invalid API key"
- Verify API key is correct
- Check key has access to Grok API
- Get new key from: https://console.x.ai/

## Benefits of Grok

- ✅ Fast response times
- ✅ Good quality outputs
- ✅ OpenAI-compatible API (easy to use)
- ✅ Competitive pricing

The migration is complete! 🎉

