# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Fixed

- Fixed Linux executable compatibility issue by building on Ubuntu 18.04 instead of Ubuntu 19.10
  - Previous builds required glibc 2.30, which was not available on Ubuntu 18.04
  - New builds require only glibc 2.27, ensuring compatibility with Ubuntu 18.04 and later distributions

### Added

- GitHub Actions workflow for automated building of Linux and Windows executables
- Build scripts for manual local builds (`build-linux.sh` and `build-windows.bat`)
- BUILD.md documentation with detailed build instructions and compatibility information

## Version 0.1.0 - 2020-05-12

### Added

- Multiple Video Support - Batch Processing
- Video File Selector
- Videos auto-converted to MP4
- GUI with Progress Bar
- Multi-threading Support - GUI does not freeze while processing
- Convert Button gets disabled during processing to avoid repeated triggers