#!/bin/bash
# Build script for frontend (Vercel)
echo "Building frontend for Vercel deployment..."
npm install
npx vite build
echo "Frontend build complete!"
