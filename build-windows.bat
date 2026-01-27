@echo off
REM Build script for creating Windows executable

echo Building Timelapse Creator for Windows...

REM Install dependencies if needed
echo Installing dependencies...
pip install -r requirements.txt
pip install pyinstaller

REM Build the executable
echo Building executable with PyInstaller...
pyinstaller --onefile --windowed --name "Time-Lapse-Creator-windows-x64" main.py

echo.
echo Build complete! Executable is in dist\Time-Lapse-Creator-windows-x64.exe
