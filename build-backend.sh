#!/bin/bash
# Build script for backend (Render)
echo "Building backend for Render deployment..."
npm install
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
echo "Backend build complete!"
