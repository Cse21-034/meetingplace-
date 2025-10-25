#!/bin/bash
# Start script for backend (Render)
echo "Starting backend server..."

# Create dummy public directory to prevent startup errors
mkdir -p dist/public
echo '<!DOCTYPE html><html><body><h1>Backend API Running</h1></body></html>' > dist/public/index.html

export NODE_ENV=production
node dist/index.js
