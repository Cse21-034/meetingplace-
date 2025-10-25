#!/bin/bash
# Start script for backend (Render)
echo "Starting backend server..."
export NODE_ENV=production
node dist/index.js
