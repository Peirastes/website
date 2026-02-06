@echo off
cd /d "%~dp0"
setlocal

REM === Build script for Sources, Fields, and the Architecture of Change ===
REM Renders QMD to HTML, injects into website template, and generates PDF

set "ROOT=%~dp0"
set "WEBSITE=%ROOT%..\.."
set "QMD_FILE=%ROOT%on-dynamical-systems.qmd"
set "HTML_OUT=%ROOT%on-dynamical-systems.html"
set "HTML_INJECT=%ROOT%on-dynamical-systems__inject.html"
set "PDF_OUT=%ROOT%on-dynamical-systems.pdf"
set "TEMPLATE=%WEBSITE%\projects\on-dynamical-systems.html"
set "INJECTOR=%WEBSITE%\documents\inject.py"
set "PY=C:\Users\Cole\anaconda3\envs\anims\python.exe"

echo.
echo ===== Dynamical Systems Build Pipeline =====
echo.
echo QMD Source:  %QMD_FILE%
echo HTML Output: %HTML_OUT%
echo PDF Output:  %PDF_OUT%
echo Template:    %TEMPLATE%
echo.

REM Check prerequisites
if not exist "%PY%" (
    echo ERROR: Python not found at "%PY%"
    echo Trying system Python...
    set "PY=python"
)

if not exist "%QMD_FILE%" (
    echo ERROR: QMD file not found: %QMD_FILE%
    pause
    exit /b 1
)

if not exist "%TEMPLATE%" (
    echo ERROR: Website template not found: %TEMPLATE%
    pause
    exit /b 1
)

if not exist "%INJECTOR%" (
    echo ERROR: Injector script not found: %INJECTOR%
    pause
    exit /b 1
)

REM Step 1: Render HTML
echo [1/5] Rendering QMD to HTML...
quarto render "%QMD_FILE%" --to html
if errorlevel 1 (
    echo ERROR: Quarto HTML render failed
    pause
    exit /b 1
)
echo      HTML rendered successfully.

REM Step 2: Rewrite paths for website context
REM The template lives at projects/on-dynamical-systems.html
REM The _files folder is at projects/dynamical-systems/on-dynamical-systems_files/
REM So paths like "on-dynamical-systems_files/..." become "dynamical-systems/on-dynamical-systems_files/..."
echo [2/5] Rewriting asset paths for website context...
%PY% -c "import sys,pathlib; f=pathlib.Path(sys.argv[1]); t=f.read_text(encoding='utf-8'); t=t.replace('\"on-dynamical-systems_files/', '\"dynamical-systems/on-dynamical-systems_files/'); t=t.replace(\"'on-dynamical-systems_files/\", \"'dynamical-systems/on-dynamical-systems_files/\"); pathlib.Path(sys.argv[2]).write_text(t, encoding='utf-8')" "%HTML_OUT%" "%HTML_INJECT%"
if errorlevel 1 (
    echo ERROR: Path rewriting failed
    pause
    exit /b 1
)
echo      Paths rewritten successfully.

REM Step 3: Inject into website template
echo [3/5] Injecting content into website template...
%PY% "%INJECTOR%" "%HTML_INJECT%" "%TEMPLATE%"
if errorlevel 1 (
    echo ERROR: Injection failed
    pause
    exit /b 1
)
echo      Content injected successfully.

REM Step 4: Render PDF (using xelatex for Unicode support)
echo [4/5] Rendering QMD to PDF...
quarto render "%QMD_FILE%" --to pdf --pdf-engine xelatex
if errorlevel 1 (
    echo ERROR: Quarto PDF render failed
    echo      Note: PDF generation requires LaTeX with xelatex
    pause
    exit /b 1
)
echo      PDF rendered successfully.

REM Step 5: Summary
echo [5/5] Build complete!
echo.
echo === Output Files ===
echo HTML (standalone): %HTML_OUT%
echo HTML (website):    %TEMPLATE%
echo PDF:               %PDF_OUT%
echo.

pause
exit /b 0
