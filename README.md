# Kgotla - Modern Discussion Forum

A full-stack discussion forum application built with React, Express, and PostgreSQL. Designed for deployment with frontend on Vercel and backend on Render.

## 🚀 Quick Start

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. **Run the application**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5000`

### Database Setup

The app uses PostgreSQL. To set up the database:

```bash
# Push schema to database
npm run db:push
```

## 📦 Deployment

This project is configured for separate deployment:
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: Render PostgreSQL (or Neon)

### Detailed Deployment Guide

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step deployment instructions.

### Quick Deployment Steps

#### 1. Deploy Backend (Render)

```bash
# Push to GitHub
git push origin main
```

Then:
1. Create PostgreSQL database on Render
2. Create Web Service on Render
3. Configure environment variables (see DEPLOYMENT.md)
4. Deploy using `build-backend.sh` and `start-backend.sh`

#### 2. Deploy Frontend (Vercel)

1. Import project to Vercel
2. Configure build settings:
   - Build Command: `bash build-frontend.sh`
   - Output Directory: `dist/public`
3. Add environment variables (all `VITE_*` variables)
4. Deploy

## 🏗️ Project Structure

```
kgotla/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and config
│   └── public/            # Static assets
├── server/                # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── firebaseAuth.ts   # Firebase authentication
│   ├── storage.ts        # Database operations
│   └── db.ts             # Database connection
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema & types
├── build-frontend.sh     # Frontend build script
├── build-backend.sh      # Backend build script
├── start-backend.sh      # Backend start script
├── vercel.json          # Vercel configuration
└── render.yaml          # Render configuration
```

## 🔧 Configuration Files

### Frontend Deployment (Vercel)

- **vercel.json**: Vercel deployment configuration
- **build-frontend.sh**: Frontend build script
- Environment variables prefix: `VITE_*`

### Backend Deployment (Render)

- **render.yaml**: Render deployment configuration
- **build-backend.sh**: Backend build script
- **start-backend.sh**: Backend start script
- Environment variables: See `.env.example`

## 🔐 Environment Variables

### Backend Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Firebase service account private key
- `FIREBASE_CLIENT_EMAIL`: Firebase service account email
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins
- `PORT`: Server port (default: 5000 for dev, 10000 for Render)

### Frontend Variables
- `VITE_API_URL`: Backend API URL (e.g., https://your-backend.onrender.com)
- `VITE_FIREBASE_API_KEY`: Firebase web API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID`: Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID`: Firebase app ID

## 📚 Available Scripts

```bash
# Development
npm run dev              # Run full-stack development server

# Building
npm run build           # Build both frontend and backend
bash build-frontend.sh  # Build only frontend (for Vercel)
bash build-backend.sh   # Build only backend (for Render)

# Production
npm start               # Start production server (both)
bash start-backend.sh   # Start only backend (for Render)

# Database
npm run db:push         # Push schema changes to database

# Type checking
npm run check           # Run TypeScript type checking
```

## 🎯 Features

- User authentication with Firebase
- Real-time discussions and comments
- Voting system for posts and comments
- User profiles with reputation
- Community groups/tribes
- Search functionality
- Notifications
- Bookmarks
- Mobile-responsive design
- Progressive Web App (PWA) support

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Radix UI
- TanStack Query (React Query)
- Wouter (routing)
- Firebase (authentication)

### Backend
- Node.js
- Express
- TypeScript
- PostgreSQL
- Drizzle ORM
- Firebase Admin SDK
- WebSocket (for real-time features)

## 📝 License

MIT

## 🤝 Support

For deployment issues, see [DEPLOYMENT.md](./DEPLOYMENT.md) for troubleshooting guides.

For Firebase setup, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).
