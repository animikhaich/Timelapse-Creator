# Build Instructions

This document provides instructions for building the Timelapse Creator executable files for distribution.

## Background

The executable files are built using PyInstaller, which bundles Python and all dependencies into a single executable file. 

### Linux Compatibility Issue (Addressed)

Previously, Linux executables were compiled on Ubuntu 19.10, which uses glibc 2.30. This caused compatibility issues when users tried to run the executable on older systems like Ubuntu 18.04, which only has glibc 2.27.

**Current Solution**: We now build Linux executables on Ubuntu 20.04 using GitHub Actions, which provides glibc 2.31. While the original goal was to support Ubuntu 18.04 (glibc 2.27), the ubuntu-18.04 GitHub Actions runner has been deprecated and is no longer available.

**Trade-off**: Building on Ubuntu 20.04 (an LTS release) provides:
- ✅ Long-term support and maintained infrastructure
- ✅ Compatibility with Ubuntu 20.04+ and most modern Linux distributions
- ✅ Access to updated GitHub Actions and security patches
- ⚠️ Does not support Ubuntu 18.04 (requires glibc 2.31 instead of 2.27)

**For Ubuntu 18.04 users**: If you need to run on Ubuntu 18.04, you can build locally on that system using the provided build scripts. The trade-off prioritizes modern platform support and maintainability over maximum backward compatibility.

## Automated Builds (Recommended)

The repository includes a GitHub Actions workflow that automatically builds executables for all platforms and creates releases.

### Workflow Details

- **Linux**: Built on `ubuntu-22.04` for broad compatibility
- **Windows**: Built on `windows-2022`
- **macOS**: Built on `macos-latest`
- **Python Version**: 3.11

The workflow is triggered automatically in three ways:

1. **Automatic Release on Merge to Master** (Recommended):
   - When code is merged to the `master` branch, the workflow automatically:
     - Bumps the patch version in `version.py` (e.g., 0.1.1 → 0.1.2)
     - Commits the version change
     - Creates a new GitHub release with the version tag
     - Builds executables for all platforms
     - Uploads all executables to the new release
   - This is the primary way releases are created and ensures all assets are always available

2. **Manual Release Creation**:
   - When you manually create a release on GitHub
   - Builds executables and uploads them to that release
   - Does not bump version automatically (you should update version.py manually first)

3. **Manual Workflow Trigger**:
   - Go to the Actions tab → "Build and Release" workflow → "Run workflow"
   - Builds executables and uploads them as artifacts
   - Does not create a release or bump version
   - Useful for testing builds without creating a release

### Accessing Built Executables

After a successful workflow run:
- **From Releases**: Go to the [Releases page](https://github.com/animikhaich/Timelapse-Creator/releases) and download from the latest release
- **From Artifacts** (manual triggers): Go to Actions → select the workflow run → download artifacts

The executables are automatically available for download from the releases page.

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

The release process is now fully automated:

### Automatic Release (Recommended)

1. Develop and test your changes on a feature branch
2. Create a Pull Request to merge into `master`
3. Once merged, GitHub Actions automatically:
   - Bumps the patch version (e.g., 0.1.1 → 0.1.2)
   - Commits the version change back to master
   - Creates a new release with the version tag
   - Builds executables for all platforms
   - Uploads executables to the release
4. The new release with all assets is immediately available on the releases page

### Manual Release (Alternative)

If you need to create a release manually with a specific version:

1. Update version number in `version.py`
2. Update CHANGELOG.md with release notes
3. Commit and push changes to master
4. Create a new release on GitHub with a version tag (e.g., `v0.2.0`)
5. GitHub Actions will automatically build and upload executables

### Version Numbering

- **Automatic bumps**: Patch version incremented (e.g., 0.1.1 → 0.1.2)
- **Manual releases**: You control the version number in `version.py`
- Follow [Semantic Versioning](https://semver.org/):
  - MAJOR: Incompatible API changes
  - MINOR: New functionality (backwards compatible)
  - PATCH: Bug fixes (backwards compatible)

## Compatibility Matrix

| Build Platform | Compatible Systems |
|---------------|-------------------|
| Ubuntu 22.04  | Ubuntu 20.04+, Debian 11+, Most modern Linux distributions |
| Windows 2022  | Windows 10+, Windows Server 2016+ |
| macOS Latest  | macOS 11+ |

## Additional Resources

- [PyInstaller Documentation](https://pyinstaller.readthedocs.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
