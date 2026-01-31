# Build Instructions

This document provides instructions for building the Timelapse Creator executable files for distribution.

## Background

The executable files are built using PyInstaller, which bundles Python and all dependencies into a single executable file. 

### Linux Compatibility Issue (Fixed)

Previously, Linux executables were compiled on Ubuntu 19.10, which uses glibc 2.30. This caused compatibility issues when users tried to run the executable on older systems like Ubuntu 18.04, which only has glibc 2.27.

**Solution**: We now build Linux executables on Ubuntu 20.04 using GitHub Actions, which provides glibc 2.31. While this is newer than the original target of glibc 2.27, Ubuntu 20.04 is an LTS release that ensures broad compatibility across modern Linux distributions. Executables built on older systems generally work on newer systems, but not vice versa.

For users on very old Linux distributions (Ubuntu 18.04 or earlier), consider building locally on your target system for maximum compatibility.

## Automated Builds (Recommended)

The repository includes a GitHub Actions workflow that automatically builds executables for both Linux and Windows when a new release is published.

### Workflow Details

- **Linux**: Built on `ubuntu-20.04` for broad compatibility
- **Windows**: Built on `windows-2019`
- **macOS**: Built on `macos-latest`
- **Python Version**: 3.8

The workflow is triggered automatically:
- When you create a new release on GitHub
- When code is pushed to the `master` branch
- Manually via workflow_dispatch

The executables are automatically uploaded to the release when triggered by a release event.

To manually trigger the workflow:
1. Go to the Actions tab in the GitHub repository
2. Select "Build Release" workflow
3. Click "Run workflow"

## Manual Local Builds

If you need to build executables locally for testing or development:

### Linux

**Note**: For maximum compatibility with older systems, build on the oldest supported Ubuntu LTS release available to you.

```bash
# Make the script executable (first time only)
chmod +x build-linux.sh

# Run the build script
./build-linux.sh
```

The executable will be created in `dist/Time-Lapse-Creator-linux-x64`

### Windows

```cmd
# Run the build script
build-windows.bat
```

The executable will be created in `dist\Time-Lapse-Creator-windows-x64.exe`

### macOS

```bash
# Make the script executable (first time only)
chmod +x build-macos.sh

# Run the build script
./build-macos.sh
```

The executable will be created in `dist/Time-Lapse-Creator-macos`

## Prerequisites for Manual Builds

- Python 3.6 or higher
- pip (Python package manager)
- All dependencies from `requirements.txt`
- PyInstaller (`pip install pyinstaller`)

## Build Options

The build scripts use the following PyInstaller options:

- `--onefile`: Creates a single executable file
- `--windowed`: Suppresses the console window (GUI application)
- `--name`: Specifies the output filename

## Troubleshooting

### Linux: Symbol not found or glibc version errors

If users report errors like "GLIBC_X.XX not found", the executable was built on a system that's too new. Rebuild on an older system (Ubuntu 18.04 is recommended).

### Missing Dependencies

If the executable fails to run due to missing dependencies, ensure all dependencies are listed in `requirements.txt` and that PyInstaller is detecting them correctly.

You can use `--hidden-import` flag with PyInstaller to explicitly include modules that aren't detected automatically.

## Release Process

1. Update version numbers in code and documentation
2. Update CHANGELOG.md
3. Create a new release on GitHub
4. GitHub Actions will automatically build and upload executables
5. Verify the executables work on target platforms

## Compatibility Matrix

| Build Platform | Compatible Systems |
|---------------|-------------------|
| Ubuntu 20.04  | Ubuntu 20.04+, Debian 11+, Most modern Linux distributions |
| Windows 2019  | Windows 7+, Windows Server 2012+ |
| macOS Latest  | macOS 10.15+ |

## Additional Resources

- [PyInstaller Documentation](https://pyinstaller.readthedocs.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
