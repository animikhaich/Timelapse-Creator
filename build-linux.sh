#!/bin/bash
# Build script for creating Linux executable
# This should be run on Ubuntu 18.04 or earlier for maximum compatibility

set -e

echo "Building Timelapse Creator for Linux..."

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo "Error: This script should be run on Linux"
    exit 1
fi

# Install dependencies if needed
echo "Installing dependencies..."
pip install -r requirements.txt
pip install pyinstaller

# Build the executable
echo "Building executable with PyInstaller..."
pyinstaller --onefile --windowed --name "Time-Lapse-Creator-linux-x64" main.py

echo "Build complete! Executable is in dist/Time-Lapse-Creator-linux-x64"
echo ""
echo "Note: For maximum compatibility, build on Ubuntu 18.04 or earlier."
echo "This ensures the executable works on both old and new Linux distributions."
