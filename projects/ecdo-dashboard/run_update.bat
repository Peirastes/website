@echo off
cd /d %~dp0

echo [1/3] Installing/updating Python deps...
python -m pip install -r requirements.txt

echo [2/3] Updating dashboard assets (charts + summary)...
python scripts\update_ecdo_dashboard.py

echo [3/3] Rendering Quarto page...
quarto render ecdo-index.qmd

echo Done. Open: projects/ecdo-dashboard/index.html
pause
