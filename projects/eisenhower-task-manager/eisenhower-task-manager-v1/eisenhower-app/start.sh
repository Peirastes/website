#!/bin/bash

echo "========================================"
echo "  Eisenhower Task Manager Setup"
echo "========================================"
echo ""

echo "[1/3] Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Installation failed!"
    echo "Please make sure Node.js is installed."
    echo "Download from: https://nodejs.org/"
    read -p "Press enter to exit..."
    exit 1
fi

echo ""
echo "========================================"
echo "  ✅ Setup Complete!"
echo "========================================"
echo ""
echo "Choose how to run the app:"
echo ""
echo "  [1] Simple mode (localStorage)"
echo "      Run: npm run dev"
echo "      Data stored in browser"
echo ""
echo "  [2] File-based mode (recommended)"
echo "      Run: npm start"
echo "      Data stored in ./data folder"
echo ""
echo "========================================"
echo ""

read -p "Select mode (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "Starting in Simple mode..."
    echo "Opening http://localhost:5173"
    sleep 2
    
    # Try to open browser (Mac or Linux)
    if command -v open &> /dev/null; then
        open http://localhost:5173
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:5173
    fi
    
    npm run dev
else
    echo ""
    echo "Starting in File-based mode..."
    echo "Opening http://localhost:5173"
    sleep 2
    
    # Try to open browser (Mac or Linux)
    if command -v open &> /dev/null; then
        open http://localhost:5173
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:5173
    fi
    
    npm start
fi
