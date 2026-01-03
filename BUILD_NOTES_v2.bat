@echo off
cd /d "%~dp0"
setlocal

set "ROOT=%CD%"
set "QMD=%ROOT%\documents\qmd"
set "OUT=%ROOT%\documents\build"
set "PDFOUT=%ROOT%\documents\pdf"
set "INJECTOR=%ROOT%\documents\inject.py"
set "PY=C:\Users\Cole\anaconda3\envs\anims\python.exe"

if not exist "%PY%" (
  echo ERROR: Python not found at "%PY%"
  pause
  exit /b 1
)

if not exist "%OUT%" mkdir "%OUT%"
if not exist "%PDFOUT%" mkdir "%PDFOUT%"

echo ===== Render + Inject all QMD files in %QMD% =====

for %%F in ("%QMD%\*.qmd") do (
  call :build_one "%%~fF" "%%~nF"
)

echo.
echo Done.
pause
exit /b 0

:build_one
set "SRC=%~1"
set "NAME=%~2"
set "HTML=%OUT%\%NAME%.html"
set "HTML_INJECT=%OUT%\%NAME%__inject.html"
set "PDF=%PDFOUT%\%NAME%.pdf"
set "TGT=%ROOT%\projects\%NAME%.html"

echo.
echo --- %NAME% ---

echo Rendering HTML...
quarto render "%SRC%" --to html --output-dir "%OUT%"
if errorlevel 1 (
  echo ERROR: Quarto HTML render failed for %NAME%
  goto :fail
)

REM Rewrite image paths for injected page context:
REM - QMD/PDF/build context: ../../images/...
REM - Injected page lives in Website\projects\... so it needs ../images/...
echo Rewriting image paths for injection...
%PY% -c "import sys,pathlib,functools; dq=chr(34); sq=chr(39); inp,outp=sys.argv[1],sys.argv[2]; t=pathlib.Path(inp).read_text(encoding='utf-8'); reps=[('src='+dq+'../../images/','src='+dq+'../images/'),('href='+dq+'../../images/','href='+dq+'../images/'),('src='+sq+'../../images/','src='+sq+'../images/'),('href='+sq+'../../images/','href='+sq+'../images/'),('src='+dq+'../../Website/images/','src='+dq+'../images/'),('href='+dq+'../../Website/images/','href='+dq+'../images/'),('src='+sq+'../../Website/images/','src='+sq+'../images/'),('href='+sq+'../../Website/images/','href='+sq+'../images/')]; t=functools.reduce(lambda s,ab: s.replace(ab[0],ab[1]), reps, t); pathlib.Path(outp).write_text(t,encoding='utf-8')" "%HTML%" "%HTML_INJECT%"
if errorlevel 1 (
  echo ERROR: Path rewrite step failed for %NAME%
  goto :fail
)

if not exist "%HTML_INJECT%" (
  echo ERROR: Expected rewritten file not created: "%HTML_INJECT%"
  goto :fail
)

echo Injecting into %TGT% ...
%PY% "%INJECTOR%" "%HTML_INJECT%" "%TGT%"
if errorlevel 1 (
  echo ERROR: Injection failed for %NAME%
  goto :fail
)

echo Rendering PDF...
quarto render "%SRC%" --to pdf --output-dir "%PDFOUT%"
if errorlevel 1 (
  echo ERROR: Quarto PDF render failed for %NAME%
  goto :fail
)

exit /b 0

:fail
echo.
echo Build failed. Scroll up to the first error.
pause
exit /b 1
