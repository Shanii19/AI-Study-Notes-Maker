Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FFmpeg Auto-Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if FFmpeg is already installed
try {
    $ffmpegVersion = ffmpeg -version 2>&1
    Write-Host "FFmpeg is already installed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Version info:" -ForegroundColor Yellow
    Write-Host $ffmpegVersion[0]
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Green
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 0
} catch {
    Write-Host "FFmpeg not found. Installing..." -ForegroundColor Yellow
    Write-Host ""
}

# Define paths
$ffmpegUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$downloadPath = "$env:TEMP\ffmpeg.zip"
$extractPath = "C:\ffmpeg"
$ffmpegBinPath = "$extractPath\bin"

Write-Host "Step 1: Downloading FFmpeg..." -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri $ffmpegUrl -OutFile $downloadPath -UseBasicParsing
    Write-Host "Download complete!" -ForegroundColor Green
} catch {
    Write-Host "Download failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please download manually from: https://www.gyan.dev/ffmpeg/builds/" -ForegroundColor Yellow
    Write-Host "Press any key to exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host ""
Write-Host "Step 2: Extracting files..." -ForegroundColor Cyan
try {
    if (Test-Path $extractPath) {
        Remove-Item $extractPath -Recurse -Force
    }
    New-Item -ItemType Directory -Path $extractPath -Force | Out-Null
    
    Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force
    
    $nestedDir = Get-ChildItem -Path $extractPath -Directory | Select-Object -First 1
    if ($nestedDir) {
        Get-ChildItem -Path $nestedDir.FullName | Move-Item -Destination $extractPath -Force
        Remove-Item $nestedDir.FullName -Recurse -Force
    }
    
    Write-Host "Extraction complete!" -ForegroundColor Green
} catch {
    Write-Host "Extraction failed: $_" -ForegroundColor Red
    Write-Host "Press any key to exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host ""
Write-Host "Step 3: Adding to PATH..." -ForegroundColor Cyan
try {
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    
    if ($currentPath -notlike "*$ffmpegBinPath*") {
        $newPath = $currentPath + ";" + $ffmpegBinPath
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        $env:Path = $env:Path + ";" + $ffmpegBinPath
        Write-Host "Added to PATH!" -ForegroundColor Green
    } else {
        Write-Host "Already in PATH!" -ForegroundColor Green
    }
} catch {
    Write-Host "Failed to add to PATH: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please add manually:" -ForegroundColor Yellow
    Write-Host "  1. Open Environment Variables in Windows" -ForegroundColor Yellow
    Write-Host "  2. Edit Path under User Variables" -ForegroundColor Yellow
    Write-Host "  3. Add: $ffmpegBinPath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 4: Cleaning up..." -ForegroundColor Cyan
try {
    Remove-Item $downloadPath -Force
    Write-Host "Cleanup complete!" -ForegroundColor Green
} catch {
    Write-Host "Cleanup failed (not critical)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "FFmpeg has been installed to: $extractPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Please close and reopen your terminal" -ForegroundColor Yellow
Write-Host "Then verify installation by running:" -ForegroundColor Yellow
Write-Host "  ffmpeg -version" -ForegroundColor White
Write-Host ""
Write-Host "After that, restart your dev server:" -ForegroundColor Yellow
Write-Host "  start_dev.bat" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
