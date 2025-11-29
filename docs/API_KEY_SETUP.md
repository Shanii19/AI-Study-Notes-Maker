# API Key Setup Instructions

## The Issue

You're seeing the error: **"Server returned an error. Please check the server logs and ensure the API key is set correctly"**

This happens because the application needs a **GROQ_API_KEY** to generate study notes using the Groq AI API.

## Solution

### Step 1: Get a Groq API Key

1. Visit [https://console.groq.com/](https://console.groq.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (it will look like: `gsk_...`)

### Step 2: Set Up Your Environment File

1. Open the file `.env.local` in the root directory of the project
2. Make sure it contains:
   ```
   GROQ_API_KEY=your_actual_api_key_here
   ```
3. Replace `your_actual_api_key_here` with your actual Groq API key

**Example:**
```
GROQ_API_KEY=gsk_abc123xyz456def789ghi012jkl345mno678pqr901stu234vwx567
```

### Step 3: Restart the Development Server

After updating the `.env.local` file:

1. Stop the current development server (press `Ctrl+C` in the terminal)
2. Restart it:
   ```bash
   npm run dev
   ```
   Or use the provided batch file:
   ```bash
   start_dev.bat
   ```

### Step 4: Verify It's Working

1. Open your browser to `http://localhost:3000`
2. Try uploading a PDF or pasting some text
3. Click "Generate Notes"
4. If the API key is set correctly, you should see notes being generated!

## Important Notes

- **Never commit your `.env.local` file to Git** - it's already in `.gitignore`
- **Keep your API key secret** - don't share it publicly
- **Free tier limits** - Groq has rate limits on the free tier, so if you make too many requests, you might hit the limit

## Alternative: Check if .env.local Exists

If you don't have a `.env.local` file:

1. Create a new file in the root directory called `.env.local`
2. Add the line: `GROQ_API_KEY=your_actual_api_key_here`
3. Save the file
4. Restart the server

## Still Having Issues?

Check the terminal/console where you're running `npm run dev` for error messages. They will tell you:
- If the API key is missing
- If there are rate limit issues
- If there are other API errors

The logs will show something like:
```
WARNING: GROQ_API_KEY not found in environment variables
```

Or if it's working:
```
GROQ_API_KEY loaded: gsk_jrxI... (Length: 56)
```
