# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Fixed

- Fixed Linux executable compatibility issue by building on Ubuntu 20.04 with modern GitHub Actions
  - Updated from deprecated ubuntu-18.04 runner to ubuntu-20.04
  - Ensures compatibility with Ubuntu 20.04+ and most modern Linux distributions

### Added

- GitHub Actions workflow for automated multi-platform building (Linux, Windows, macOS)
  - Triggers on release publication
  - Triggers on push to master branch for continuous integration
  - Can be manually triggered via workflow_dispatch
- Build scripts for manual local builds (`build-linux.sh`, `build-windows.bat`, and `build-macos.sh`)
- BUILD.md documentation with detailed build instructions and compatibility information
- macOS executable support

### Changed

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