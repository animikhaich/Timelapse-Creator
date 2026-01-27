# Build Instructions

This document provides instructions for building the Timelapse Creator executable files for distribution.

## Background

The executable files are built using PyInstaller, which bundles Python and all dependencies into a single executable file. 

### Linux Compatibility Issue (Fixed)

Previously, Linux executables were compiled on Ubuntu 19.10, which uses glibc 2.30. This caused compatibility issues when users tried to run the executable on older systems like Ubuntu 18.04, which only has glibc 2.27.

**Solution**: We now build Linux executables on Ubuntu 18.04, ensuring compatibility with both older and newer Linux distributions. Executables built on older systems will work on newer systems, but not vice versa.

## Automated Builds (Recommended)

The repository includes a GitHub Actions workflow that automatically builds executables for both Linux and Windows when a new release is published.

### Workflow Details

- **Linux**: Built on `ubuntu-18.04` for maximum compatibility
- **Windows**: Built on `windows-2019`
- **Python Version**: 3.8

The workflow is triggered automatically when you create a new release on GitHub, and the executables are automatically uploaded to the release.

To manually trigger the workflow:
1. Go to the Actions tab in the GitHub repository
2. Select "Build Release" workflow
3. Click "Run workflow"

## Manual Local Builds

If you need to build executables locally for testing or development:

### Linux

**Important**: For maximum compatibility, build on Ubuntu 18.04 or earlier.

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
| Ubuntu 18.04  | Ubuntu 18.04+, Debian 10+, Most modern Linux distributions |
| Windows 2019  | Windows 7+, Windows Server 2012+ |

## Additional Resources

- [PyInstaller Documentation](https://pyinstaller.readthedocs.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
