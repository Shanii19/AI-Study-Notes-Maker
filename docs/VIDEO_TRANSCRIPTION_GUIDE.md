# Video Transcription Setup Guide

## 🎥 Video Upload Feature

Your AI Study Notes Maker now supports **video file uploads** with automatic speech-to-text transcription using **Groq's Whisper API**!

## ✅ What's Working

- **Automatic transcription** of video files to text
- **Free API** - Uses your existing GROQ_API_KEY
- **Multiple formats** supported: MP4, WebM, OGG, MOV, AVI
- **High accuracy** - Powered by Whisper Large V3 model
- **No additional cost** - Included in Groq's free tier

## 📋 Requirements

### 1. FFmpeg Installation (Required)

FFmpeg is needed to extract audio from video files before transcription.

#### **Windows Installation:**

**Option A: Using Chocolatey (Recommended)**
```powershell
# Run PowerShell as Administrator
choco install ffmpeg
```

**Option B: Manual Installation**
1. Download FFmpeg from: https://www.gyan.dev/ffmpeg/builds/
2. Download the "ffmpeg-release-essentials.zip"
3. Extract to `C:\ffmpeg`
4. Add to PATH:
   - Open "Environment Variables" in Windows
   - Edit "Path" under System Variables
   - Add: `C:\ffmpeg\bin`
   - Click OK and restart your terminal

**Option C: Using Scoop**
```powershell
scoop install ffmpeg
```

#### **Verify Installation:**
```bash
ffmpeg -version
```

You should see FFmpeg version information.

## 🚀 How to Use

### Step 1: Upload a Video
1. Go to your app at http://localhost:3000
2. Click the **"Upload Video"** tab
3. Select a video file (max 50MB)
4. Supported formats: MP4, WebM, OGG, MOV, AVI

### Step 2: Generate Notes
1. Click **"Generate Notes"**
2. The app will:
   - Extract audio from your video
   - Transcribe speech to text using Groq Whisper
   - Generate study notes from the transcription
3. Wait for processing (may take 30-60 seconds depending on video length)

### Step 3: Get Your Notes
- View, copy, download, or save your generated notes!

## ⚙️ How It Works

```
Video File → FFmpeg (Extract Audio) → Groq Whisper API (Transcribe) → Study Notes
```

1. **Audio Extraction**: FFmpeg extracts audio from video as MP3
   - Sample rate: 16kHz (optimal for speech)
   - Mono audio
   - Compressed for faster upload

2. **Transcription**: Groq Whisper API converts speech to text
   - Model: whisper-large-v3
   - Language: English (can be changed)
   - High accuracy for clear speech

3. **Note Generation**: Your existing Groq AI generates study notes from the transcription

## 📊 Limitations

- **File Size**: Maximum 50MB per video
- **Duration**: Recommended under 10 minutes for best results
- **Speech Quality**: Clear speech works best
- **Language**: Currently set to English (can be modified)
- **API Limits**: Subject to Groq's free tier rate limits

## 🔧 Troubleshooting

### Error: "FFmpeg not installed"
**Solution:** Install FFmpeg following the instructions above.

### Error: "No speech could be transcribed"
**Possible causes:**
- Video has no audio
- Audio is too quiet or unclear
- Background noise is too loud

**Solutions:**
- Use a video with clear speech
- Try a YouTube link instead (if available)
- Upload text directly

### Error: "Video file too large"
**Solution:** 
- Compress your video
- Use a shorter clip
- Try a YouTube link if the video is online

### Slow Processing
**Normal behavior:**
- Extracting audio: 5-15 seconds
- Transcribing: 20-40 seconds
- Generating notes: 10-20 seconds
- **Total: 30-75 seconds** for a typical video

## 🎯 Best Practices

### For Best Results:
1. **Clear Audio**: Use videos with clear, audible speech
2. **Minimal Background Noise**: Quiet environments work best
3. **Single Speaker**: Works best with one person speaking
4. **Good Microphone**: Higher quality audio = better transcription
5. **Shorter Videos**: Under 10 minutes processes faster

### Recommended Video Types:
- ✅ Lectures and presentations
- ✅ Tutorial videos
- ✅ Educational content
- ✅ Interviews
- ✅ Podcasts (video format)

### Not Recommended:
- ❌ Music videos
- ❌ Videos with heavy background music
- ❌ Multiple overlapping speakers
- ❌ Poor audio quality recordings

## 💡 Alternative Options

If you don't want to install FFmpeg or encounter issues:

1. **Use YouTube Links**: If your video is on YouTube, use the YouTube tab instead
2. **Upload Text**: Manually transcribe or paste text content
3. **Use PDF**: Convert your content to PDF format

## 🔐 Privacy & Security

- **Local Processing**: Audio extraction happens on your server
- **Groq API**: Transcription uses Groq's secure API
- **Temporary Files**: Audio files are automatically deleted after processing
- **No Storage**: Videos are not permanently stored

## 📝 Technical Details

### Audio Extraction Settings:
```
Format: MP3
Sample Rate: 16kHz
Channels: Mono (1)
Bitrate: 64kbps
```

### Whisper Model:
```
Model: whisper-large-v3
Provider: Groq
Language: English
Response Format: Text
```

## 🆘 Need Help?

1. **Check FFmpeg**: Run `ffmpeg -version` in terminal
2. **Check Logs**: Look at the terminal where `npm run dev` is running
3. **Try Alternatives**: Use YouTube links or text upload
4. **File Size**: Ensure video is under 50MB

## 🎉 Success!

Once FFmpeg is installed, you can:
- ✅ Upload any video file
- ✅ Get automatic transcription
- ✅ Generate study notes
- ✅ All using your existing Groq API key!

No additional API keys or services needed! 🚀
