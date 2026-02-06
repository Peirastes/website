#!/bin/bash

# Electrostatics Lab - Local Testing Server
# This script starts a simple HTTP server for testing the electrostatics lab deployment

echo "🚀 Starting Electrostatics Lab Testing Server..."
echo ""
echo "📍 Server will be available at: http://localhost:8000/electrostatics-lab.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "Using Python 3 HTTP Server..."
    cd "$(dirname "$0")"
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "Using Python 2 HTTP Server..."
    cd "$(dirname "$0")"
    python -m SimpleHTTPServer 8000
else
    echo "❌ Error: Python not found. Please install Python 3."
    exit 1
fi
