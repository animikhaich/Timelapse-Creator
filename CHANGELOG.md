# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- Automatic version bumping on merge to master branch
  - Version is automatically incremented (patch version) when code is merged to master
  - Version information stored in `version.py`
  - Version displayed in application title bar
- Automatic release creation upon CI/CD merge and job run
  - GitHub Actions workflow automatically creates a new release when code is pushed to master
  - Release includes automated release notes from recent commits
- Auto-deployment of built assets to GitHub Releases
  - All platform executables (Linux, Windows, macOS) are automatically built and uploaded to releases
  - Assets are available for download directly from the releases page
  - Workflow supports manual triggering via workflow_dispatch

### Changed

- Enhanced GitHub Actions workflow with three trigger modes:
  - Automatic: On push to master (creates release and uploads assets)
  - Manual: Via workflow_dispatch (builds assets only)
  - Release: On release publication (builds and uploads assets)
- Application window title now displays version number

### Fixed

- Fixed Linux executable compatibility issue by building on Ubuntu 20.04 with modern GitHub Actions
  - Updated from deprecated ubuntu-18.04 runner to ubuntu-20.04
  - Ensures compatibility with Ubuntu 20.04+ and most modern Linux distributions

### Added (Previous)

- GitHub Actions workflow for automated multi-platform building (Linux, Windows, macOS)
  - Triggers on release publication
  - Triggers on push to master branch for continuous integration
  - Can be manually triggered via workflow_dispatch
- Build scripts for manual local builds (`build-linux.sh`, `build-windows.bat`, and `build-macos.sh`)
- BUILD.md documentation with detailed build instructions and compatibility information
- macOS executable support

### Changed (Previous)

- Updated GitHub Actions to use latest stable versions:
  - actions/checkout@v2 → actions/checkout@v4
  - actions/setup-python@v2 → actions/setup-python@v5
  - actions/upload-artifact@v2 → actions/upload-artifact@v4
  - actions/upload-release-asset@v1 → softprops/action-gh-release@v1
- Updated build platform from ubuntu-18.04 to ubuntu-20.04 (ubuntu-18.04 runner is deprecated)
- Documentation updated to reflect actual build environments and multi-platform support

## Version 0.1.0 - 2020-05-12

### Added

- Multiple Video Support - Batch Processing
- Video File Selector
- Videos auto-converted to MP4
- GUI with Progress Bar
- Multi-threading Support - GUI does not freeze while processing
- Convert Button gets disabled during processing to avoid repeated triggers