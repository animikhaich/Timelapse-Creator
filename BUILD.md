# Build Instructions

This document provides detailed instructions for building the Timelapse Creator desktop application.

## Overview

Timelapse Creator is built using:
- **Rust** - Backend logic and video processing
- **Tauri** - Desktop application framework
- **React + TypeScript** - Frontend UI
- **Vite** - Frontend build tool
- **FFmpeg** - Video processing (external dependency)

## Prerequisites

### Required Software

1. **Rust** (latest stable)
   ```bash
   # Install via rustup
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Node.js** (v20 or later)
   ```bash
   # Download from https://nodejs.org/
   # Or use nvm:
   nvm install 20
   nvm use 20
   ```

3. **FFmpeg** (for runtime, not build)
   - Windows: `choco install ffmpeg`
   - macOS: `brew install ffmpeg`
   - Linux: `sudo apt install ffmpeg`

### Platform-Specific Requirements

#### Windows
- Microsoft Visual Studio C++ Build Tools
- WebView2 Runtime (usually pre-installed on Windows 10/11)

#### macOS
- Xcode Command Line Tools
  ```bash
  xcode-select --install
  ```

#### Linux
- Build essentials and WebKit2GTK
  ```bash
  # Ubuntu/Debian
  sudo apt update
  sudo apt install libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libappindicator3-dev \
    librsvg2-dev \
    patchelf \
    ffmpeg
  ```

## Development Build

1. **Clone the repository**
   ```bash
   git clone https://github.com/animikhaich/Timelapse-Creator.git
   cd Timelapse-Creator
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Run in development mode**
   ```bash
   cd src-tauri
   cargo tauri dev
   ```

   This will:
   - Start the Vite development server for hot-reloading
   - Compile and run the Rust backend
   - Open the application window

## Production Build

### Build for Current Platform

```bash
cd src-tauri
cargo tauri build
```

The built executables will be in `src-tauri/target/release/bundle/`.

### Build Outputs by Platform

| Platform | Output Location | Formats |
|----------|-----------------|---------|
| Windows | `target/release/bundle/msi/` | `.msi`, `.exe` |
| macOS | `target/release/bundle/macos/` | `.app`, `.dmg` |
| Linux | `target/release/bundle/` | `.AppImage`, `.deb`, `.rpm` |

## Cross-Compilation

Tauri does not support cross-compilation out of the box. To build for multiple platforms:

### Option 1: GitHub Actions (Recommended)

The repository includes a GitHub Actions workflow that automatically builds for all platforms:

```yaml
# .github/workflows/build-release.yml will build on:
# - windows-latest
# - macos-latest
# - ubuntu-22.04
```

### Option 2: Build Machines

Use separate build machines or VMs for each target platform.

## Build Configuration

### Tauri Configuration

Edit `src-tauri/tauri.conf.json` to customize:
- Application name and version
- Window size and behavior
- Bundle settings
- Update configuration

### Release Optimizations

The `Cargo.toml` includes release optimizations:
```toml
[profile.release]
panic = "abort"     # Smaller binary
codegen-units = 1   # Better optimization
lto = true          # Link-time optimization
opt-level = "z"     # Optimize for size
strip = true        # Strip symbols
```

## Troubleshooting

### Build Errors

**"WebView2 not found" (Windows)**
- Download and install WebView2 from Microsoft

**"webkit2gtk not found" (Linux)**
- Install the WebKit2GTK development package for your distribution

**"Command 'tauri' not found"**
```bash
cargo install tauri-cli
```

### Runtime Issues

**"FFmpeg not found"**
- Ensure FFmpeg is installed and in your PATH
- Verify with: `ffmpeg -version`

**Application crashes on startup**
- Check the developer console for errors
- Verify all dependencies are installed

## Project Structure

```
Timelapse-Creator/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── App.tsx          # Main application component
│   │   ├── main.tsx         # Entry point
│   │   └── styles.css       # Global styles
│   ├── package.json
│   └── vite.config.ts
├── src-tauri/               # Rust backend
│   ├── src/
│   │   ├── main.rs          # Application entry
│   │   ├── commands.rs      # Tauri commands
│   │   └── video.rs         # Video processing
│   ├── Cargo.toml
│   └── tauri.conf.json      # Tauri configuration
└── assets/                  # Icons and images
```

## Version Bumping and Releases

### Automated Release Process

The repository uses an automated CI/CD pipeline that creates releases when version tags are pushed:

1. **Update version** in all three locations:
   - `src-tauri/Cargo.toml` - `version = "X.Y.Z"`
   - `src-tauri/tauri.conf.json` - `"version": "X.Y.Z"`
   - `frontend/package.json` - `"version": "X.Y.Z"`

2. **Commit the version changes:**
   ```bash
   git add src-tauri/Cargo.toml src-tauri/tauri.conf.json frontend/package.json
   git commit -m "Bump version to X.Y.Z"
   ```

3. **Push the commit and create a version tag:**
   ```bash
   git push origin master
   git tag -a vX.Y.Z -m "Release version X.Y.Z"
   git push origin vX.Y.Z
   ```

4. **Automated build and release:**
   - The GitHub Actions workflow automatically triggers on version tags
   - Tests run first to ensure quality
   - A new GitHub Release is created with an auto-generated changelog
   - Builds are created for all platforms (Linux, Windows, macOS Intel, macOS ARM)
   - Built executables are automatically uploaded to the release

### Release Artifacts

When a release is created, the following artifacts are automatically built and attached:

| Platform | Files |
|----------|-------|
| **Linux** | `.AppImage`, `.deb` |
| **Windows** | `.exe`, `.msi` |
| **macOS Intel** | `.dmg` |
| **macOS ARM** | `.dmg` |

### macOS Code Signing

The macOS builds are configured with `signingIdentity: null` to prevent "damaged and can't be opened" errors on unsigned builds. Users may need to:
1. Right-click the app and select "Open"
2. Or use: `xattr -cr /path/to/Timelapse\ Creator.app`

For production releases with proper code signing, you'll need to:
1. Set up Apple Developer certificates
2. Configure signing in `tauri.conf.json`
3. Add signing secrets to GitHub Actions

### Changelog

The release changelog is automatically generated from git commits between tags. Each release includes:
- All commit messages (excluding merges)
- Commit short hashes
- Link to full changelog comparing the previous tag (for releases where a previous tag exists)

For the very first release (when there is no previous tag), the changelog includes all commits and links directly to the release tag instead of a comparison.

## Additional Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Tauri GitHub](https://github.com/tauri-apps/tauri)
- [React Documentation](https://react.dev/)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
