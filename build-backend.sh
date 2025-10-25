#!/bin/bash
# Build script for backend (Render)
echo "Building backend for Render deployment..."

# Install dependencies
npm install

# Build with esbuild - explicitly mark built-in Node modules (fs, path) as external
echo "Bundling backend code..."
npx esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --external:firebase-admin \
  --external:fs \
  --external:path \
  --bundle \
  --format=esm \
  --outdir=dist

echo "Backend build complete!"

# Run database migrations
if [ -n "$DATABASE_URL" ]; then
  echo "Running database migrations..."
  npm run db:push
  echo "Database migrations complete!"
else
  echo "WARNING: DATABASE_URL not set, skipping database migrations"
fi
