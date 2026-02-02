#!/bin/bash

# Script to run all tests locally, matching the CI workflow

echo "Running local tests to match CI..."

FAILED=0

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
if ! npm ci; then
  echo "Frontend dependencies installation failed"
  FAILED=1
fi
cd ..

# Run frontend tests
echo "Running frontend tests..."
cd frontend
if ! npm test; then
  echo "Frontend tests failed"
  FAILED=1
fi
cd ..

# Run Rust tests
echo "Running Rust tests..."
cd src-tauri
if ! cargo test --verbose; then
  echo "Rust tests failed"
  FAILED=1
fi
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
if ! npm run build; then
  echo "Frontend build failed"
  FAILED=1
fi
cd ..

# Check Rust compilation
echo "Checking Rust compilation..."
cd src-tauri
if ! cargo check --verbose; then
  echo "Rust check failed"
  FAILED=1
fi
cd ..

if [ $FAILED -eq 0 ]; then
  echo "All tests passed! 🎉"
else
  echo "Some tests failed! ❌"
  exit 1
fi