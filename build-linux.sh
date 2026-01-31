#!/bin/bash
# Build script for creating Linux executable
# For maximum compatibility, run on the oldest Ubuntu LTS available (e.g., Ubuntu 20.04)

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
echo "Note: For maximum compatibility, build on an older Ubuntu LTS release."
echo "This ensures the executable works on both old and new Linux distributions."
