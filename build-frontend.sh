#!/bin/bash
# Build script for frontend (Vercel)
echo "Building frontend for Vercel deployment..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the frontend using Vite
echo "Running Vite build..."
npx vite build --config vite.config.ts

# Verify the build output exists
if [ -d "dist/public" ]; then
  echo "Frontend build complete! Output directory: dist/public"
  ls -la dist/public
else
  echo "ERROR: Build output directory not found!"
  exit 1
fi
