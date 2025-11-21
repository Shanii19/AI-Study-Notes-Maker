@echo off
echo ========================================
echo   Pushing to GitHub...
echo ========================================

echo.
echo Current Remote URL:
git remote -v

echo.
echo Pushing to main branch...
git push -u origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo   Push Failed!
    echo ========================================
    echo.
    echo Possible reasons:
    echo 1. You are not logged in to GitHub.
    echo    Try running: git credential-manager login
    echo    Or: gh auth login (if GitHub CLI is installed)
    echo.
    echo 2. The repository already has content.
    echo    Try force pushing (be careful): git push -u origin main --force
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================
echo   Push Successful!
echo ========================================
echo.
pause
