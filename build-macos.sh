#!/bin/bash
# Build script for creating macOS executable

set -e

echo "Building Timelapse Creator for macOS..."

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "Error: This script should be run on macOS"
    exit 1
fi

# Install dependencies if needed
echo "Installing dependencies..."
pip install -r requirements.txt
pip install pyinstaller

# Build the executable
echo "Building executable with PyInstaller..."
pyinstaller --onefile --windowed --name "Time-Lapse-Creator-macos" main.py

echo "Build complete! Executable is in dist/Time-Lapse-Creator-macos"
echo ""
echo "Note: The executable will be compatible with your current macOS version and later."
