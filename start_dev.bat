@echo off
echo ========================================
echo   AI Study Notes Maker - Dev Server
echo ========================================
echo.
echo Starting development server...
echo.

REM Change to the project directory
cd /d "%~dp0"

REM Run npm dev using cmd instead of PowerShell
cmd /c "npm run dev"

pause
