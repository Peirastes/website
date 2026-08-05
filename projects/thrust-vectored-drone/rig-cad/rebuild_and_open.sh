#!/bin/sh
# Close FreeCAD, rebuild, reopen. Closing is NOT optional: FreeCAD holds a write
# lock on the open .FCStd, so a headless build silently fails to save while the
# GUI has it open. One command instead of three.
#
# NB: FreeCAD needs a WINDOWS path. $PWD under Git Bash is POSIX (/c/...) and
# FreeCAD reports "does not exist" for it.
cd "$(dirname "$0")" || exit 1
WINDIR='C:\Users\Cole\Dropbox\Website\projects\thrust-vectored-drone\rig-cad'
FCEXE='C:\Program Files\FreeCAD 1.1\bin\FreeCAD.exe'

powershell -NoProfile -Command "Stop-Process -Name freecad -Force -ErrorAction SilentlyContinue" 2>/dev/null
sleep 2

"/c/Program Files/FreeCAD 1.1/bin/freecadcmd.exe" run_build.py > /tmp/tvd_build.log 2>&1
if ! grep -aq "saved ->" /tmp/tvd_build.log; then
    echo "BUILD DID NOT SAVE -- not reopening:"
    grep -aE "Exception|Error|read-only|not found" /tmp/tvd_build.log | head -5
    exit 1
fi
grep -aE "fasteners:|visibility:|GuiDocument" /tmp/tvd_build.log

powershell -NoProfile -Command "Start-Process -FilePath '$FCEXE' -ArgumentList '\"$WINDIR\TVD_TestRig_Mk0.FCStd\"'" 2>/dev/null
sleep 4
powershell -NoProfile -Command "if (Get-Process freecad -ErrorAction SilentlyContinue) { 'reopened: PID ' + (Get-Process freecad).Id } else { 'REOPEN FAILED' }"
