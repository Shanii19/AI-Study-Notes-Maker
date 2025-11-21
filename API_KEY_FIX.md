# API Key & Model Name Fix

## Issues Fixed

### 1. ✅ Wrong Model Name
**Error**: `models/gemini-pro is not found for API version v1`

**Problem**: The model name `gemini-pro` is deprecated and no longer available.

**Solution**: Changed to `gemini-1.5-flash` (or `gemini-1.5-pro` for better quality).

**File Changed**: `lib/gemini-client.ts`
- Updated model name from `gemini-pro` to `gemini-1.5-flash`

### 2. ✅ API Key Verification
**Problem**: Need to verify API key is being read correctly.

**Solution**: 
- Added better logging to verify API key is loaded
- Added warning if API key is missing
- Better error messages for API key issues

## How to Fix

### Step 1: Verify .env.local File

Make sure `.env.local` exists in the root directory with:

```env
GEMINI_API_KEY=AIzaSyAPinQsZel4l_4yHC34m_9BymOvj9R1RHw
```

**Important**: 
- No spaces around the `=` sign
- No quotes around the key
- File must be named exactly `.env.local`
- Must be in the root directory (same level as `package.json`)

### Step 2: Restart Server

After creating or modifying `.env.local`, you MUST restart the dev server:

```powershell
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Check Server Logs

When the server starts, you should see:
```
Gemini API key loaded: AIzaSyAPin...
API key length: 39
```

If you see "NOT SET", the API key is not being read.

## Model Names Available

The code now uses `gemini-1.5-flash` which is:
- ✅ Faster
- ✅ More cost-effective
- ✅ Available with most API keys

To use better quality (slower, more expensive), change in `lib/gemini-client.ts`:
```typescript
const modelName = 'gemini-1.5-pro'; // Instead of 'gemini-1.5-flash'
```

## Testing

1. **Check API Key**:
   - Look at server terminal when starting
   - Should see "Gemini API key loaded: ..."
   - If not, check `.env.local` file

2. **Test PDF Upload**:
   - Upload a PDF
   - Should extract text and generate notes
   - Check browser console for errors

3. **Test YouTube**:
   - Paste YouTube URL
   - Should process and generate notes
   - Check console for processing logs

## Troubleshooting

### "API key not set"
- Verify `.env.local` exists in root directory
- Check file has `GEMINI_API_KEY=...` (no spaces)
- Restart dev server after creating/modifying `.env.local`

### "Model not found"
- Already fixed by changing to `gemini-1.5-flash`
- If still occurs, try `gemini-1.5-pro`

### "Invalid API key"
- Verify your API key is correct
- Get a new key from: https://makersuite.google.com/app/apikey
- Make sure key has access to Gemini API

### "Quota exceeded"
- Check your Google Cloud/Gemini API quota
- Wait for quota reset or upgrade plan

## What Changed

1. **Model Name**: `gemini-pro` → `gemini-1.5-flash`
2. **API Key Logging**: Better verification
3. **Error Messages**: More helpful for debugging
4. **Error Handling**: Handles 404 (model not found) errors

The app should now work correctly! 🎉

