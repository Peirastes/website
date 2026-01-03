@echo off
cd /d "%~dp0"

set "ROOT=%CD%"
set "QMD=%ROOT%\documents\qmd"
set "OUT=%ROOT%\documents\build"
set "PDFOUT=%ROOT%\documents\pdf"
set "INJECTOR=%ROOT%\documents\inject.py"
set "PY=C:\Users\Cole\anaconda3\envs\anims\python.exe"

if not exist "%OUT%" mkdir "%OUT%"
if not exist "%PDFOUT%" mkdir "%PDFOUT%"

echo ===== Render + Inject all QMD files in %QMD% =====

for %%F in ("%QMD%\*.qmd") do (
  set "BASENAME=%%~nF"
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
set "PDF=%PDFOUT%\%NAME%.pdf"
set "TGT=%ROOT%\projects\%NAME%.html"

echo.
echo --- %NAME% ---

echo Rendering HTML...
quarto render "%SRC%" --to html --output-dir "%OUT%"
if errorlevel 1 goto :fail

echo Injecting into %TGT% ...
%PY% "%INJECTOR%" "%HTML%" "%TGT%"
if errorlevel 1 goto :fail

echo Rendering PDF...
quarto render "%SRC%" --to pdf --output-dir "%PDFOUT%"
if errorlevel 1 goto :fail

exit /b 0

:fail
echo.
echo Build failed. Scroll up to the first error.
pause
exit /b 1
