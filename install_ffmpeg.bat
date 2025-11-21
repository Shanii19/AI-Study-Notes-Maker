@echo off
echo ========================================
echo   FFmpeg Installation Helper
echo ========================================
echo.
echo This script will help you install FFmpeg for video processing.
echo.
echo OPTION 1: Install using Chocolatey (Recommended)
echo ------------------------------------------------
echo If you have Chocolatey installed, run:
echo   choco install ffmpeg
echo.
echo OPTION 2: Install using Scoop
echo ------------------------------
echo If you have Scoop installed, run:
echo   scoop install ffmpeg
echo.
echo OPTION 3: Manual Installation
echo ------------------------------
echo 1. Visit: https://www.gyan.dev/ffmpeg/builds/
echo 2. Download: ffmpeg-release-essentials.zip
echo 3. Extract to: C:\ffmpeg
echo 4. Add C:\ffmpeg\bin to your PATH
echo.
echo ========================================
echo.
echo After installation, restart this terminal and run:
echo   ffmpeg -version
echo.
echo Then restart the dev server:
echo   start_dev.bat
echo.
pause
