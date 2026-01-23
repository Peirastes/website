@echo off
REM Timeline Images Downloader - Using PowerShell with proper delays
REM This batch file downloads public domain images from Wikimedia Commons
REM with appropriate delays to avoid rate limiting

setlocal enabledelayedexpansion

set "TARGET_DIR=C:\Users\Cole\Dropbox\Website\images\timeline_images"

if not exist "!TARGET_DIR!" (
    echo Creating directory: !TARGET_DIR!
    mkdir "!TARGET_DIR!"
)

echo.
echo ================================================
echo Timeline Images Downloader
echo ================================================
echo Target directory: !TARGET_DIR!
echo.
echo This script will download public domain images
echo from Wikimedia Commons with 2-second delays.
echo.
echo For manual downloads, visit:
echo https://commons.wikimedia.org/wiki/
echo.

REM Create PowerShell script for downloading
set "PS_SCRIPT=%TEMP%\download_images.ps1"

(
echo # Download function with retry logic
echo function Download-Image {
echo     param(
echo         [string]$Url,
echo         [string]$OutputPath,
echo         [int]$MaxRetries = 3
echo     )
echo
echo     for ($i = 0; $i -lt $MaxRetries; $i++) {
echo         try {
echo             $headers = @{
echo                 'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64^) AppleWebKit/537.36'
echo             }
echo             Invoke-WebRequest -Uri $Url -OutFile $OutputPath -Headers $headers -TimeoutSec 30
echo             return $true
echo         } catch {
echo             if ($i -lt $MaxRetries - 1^) {
echo                 Write-Host "  Retry $($i+1) in 3 seconds..."
echo                 Start-Sleep -Seconds 3
echo             }
echo         }
echo     }
echo     return $false
echo }
echo.
echo # High-priority images to download
echo $images = @(
echo     @{ Name = 'leonardo-da-vinci-thumb.jpg'; URL = 'https://commons.wikimedia.org/wiki/File:Leonardo_da_Vinci_-_1452-1519_-_Attributed.jpg' },
echo     @{ Name = 'galileo-thumb.jpg'; URL = 'https://commons.wikimedia.org/wiki/File:Justus_Sustermans_-_Portrait_of_Galileo_Galilei,_1636.jpg' },
echo     @{ Name = 'newton-thumb.jpg'; URL = 'https://commons.wikimedia.org/wiki/File:Godfrey_Kneller_-_Portrait_of_Isaac_Newton,_1689.jpg' },
echo     @{ Name = 'kepler-thumb.jpg'; URL = 'https://commons.wikimedia.org/wiki/File:Kepler-15.jpg' },
echo     @{ Name = 'einstein-thumb.jpg'; URL = 'https://commons.wikimedia.org/wiki/File:Albert_Einstein_Head.jpg' },
echo     @{ Name = 'faraday-thumb.jpg'; URL = 'https://commons.wikimedia.org/wiki/File:Faraday,_Michael_-_NPG.jpg' },
echo     @{ Name = 'maxwell-thumb.jpg'; URL = 'https://commons.wikimedia.org/wiki/File:James_Clerk_Maxwell.png' },
echo     @{ Name = 'feynman-thumb.jpg'; URL = 'https://commons.wikimedia.org/wiki/File:RichardFeynman-PaineMansionWoods1984_copyrightTamikoThiel_fixed.jpg' }
echo )
echo.
echo Write-Host "Starting downloads..."
echo $targetDir = '!TARGET_DIR!'
echo.
echo foreach ($image in $images^) {
echo     $filename = $image.Name
echo     $outputPath = Join-Path $targetDir $filename
echo
echo     if (Test-Path $outputPath^) {
echo         Write-Host "Skipping $filename (already exists^)"
echo     } else {
echo         Write-Host "Downloading $filename..."
echo         $success = Download-Image -Url $image.URL -OutputPath $outputPath
echo
echo         if ($success^) {
echo             Write-Host "  OK: $filename downloaded"
echo         } else {
echo             Write-Host "  FAILED: Could not download from $($image.URL^)"
echo             Write-Host "  Please download manually and save as: $outputPath"
echo         }
echo     }
echo
echo     Start-Sleep -Seconds 2
echo }
echo.
echo Write-Host ""
echo Write-Host "Download complete!"
echo Write-Host "Check !TARGET_DIR! for downloaded images"
) > "!PS_SCRIPT!"

echo Running PowerShell downloader...
powershell.exe -ExecutionPolicy Bypass -File "!PS_SCRIPT!"

echo.
echo ================================================
echo Download Summary
echo ================================================
echo Check the following directory for downloaded images:
echo !TARGET_DIR!
echo.
echo For remaining images, visit: https://commons.wikimedia.org/
echo Use the filenames listed in TIMELINE_IMAGES_GUIDE.md
echo.
pause
