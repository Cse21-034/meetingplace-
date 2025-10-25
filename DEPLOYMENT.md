# Deployment Guide - Kgotla App

This guide will help you deploy the Kgotla app with the frontend on Vercel and backend on Render.

## Architecture

- **Frontend**: React + Vite on Vercel
- **Backend**: Node.js + Express on Render
- **Database**: PostgreSQL on Render (or Neon)

## Prerequisites

1. GitHub account
2. Vercel account (https://vercel.com)
3. Render account (https://render.com)
4. Firebase project with Authentication enabled

## Part 1: Backend Deployment (Render)

### Step 1: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/kgotla.git
git push -u origin main
```

### Step 2: Create PostgreSQL Database on Render

1. Go to Render Dashboard
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name**: `kgotla-db`
   - **Database**: `kgotla`
   - **Plan**: Free (or your choice)
4. Click **Create Database**
5. Copy the **Internal Database URL** (you'll need this)

### Step 3: Deploy Backend on Render

1. Go to Render Dashboard
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `kgotla-backend`
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build:backend`
   - **Start Command**: `npm run start:backend`
   - **Plan**: Free (or your choice)

5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `DATABASE_URL`: (paste the Internal Database URL from step 2)
   - `SESSION_SECRET`: (generate a random string - use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `FIREBASE_PROJECT_ID`: (from Firebase Console)
   - `FIREBASE_PRIVATE_KEY`: (from Firebase service account JSON - include quotes and newlines)
   - `FIREBASE_CLIENT_EMAIL`: (from Firebase service account JSON)
   - `ALLOWED_ORIGINS`: `https://your-app-name.vercel.app` (update after deploying frontend)

6. Click **Create Web Service**

7. Wait for deployment to complete. Your backend URL will be: `https://kgotla-backend.onrender.com`

### Step 4: Run Database Migrations

After backend deploys successfully, you need to push the database schema:

1. In Render dashboard, go to your web service
2. Click **Shell** tab
3. Run: `npm run db:push`

## Part 2: Frontend Deployment (Vercel)

### Step 1: Deploy to Vercel

1. Go to Vercel Dashboard
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build:frontend`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

5. Add Environment Variables:
   - `VITE_API_URL`: `https://kgotla-backend.onrender.com` (your Render backend URL)
   - `VITE_FIREBASE_API_KEY`: (from Firebase Console → Project Settings → General)
   - `VITE_FIREBASE_AUTH_DOMAIN`: `your-project.firebaseapp.com`
   - `VITE_FIREBASE_PROJECT_ID`: (your Firebase project ID)
   - `VITE_FIREBASE_STORAGE_BUCKET`: `your-project.appspot.com`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: (from Firebase)
   - `VITE_FIREBASE_APP_ID`: (from Firebase)

6. Click **Deploy**

7. Your frontend will be live at: `https://your-app-name.vercel.app`

### Step 2: Update Backend CORS

1. Go back to Render Dashboard → Your Web Service
2. Go to **Environment** tab
3. Update `ALLOWED_ORIGINS` to include your Vercel URL:
   ```
   https://your-app-name.vercel.app,https://your-custom-domain.com
   ```
4. Save changes (this will trigger a redeploy)

## Part 3: Firebase Setup

### Get Firebase Service Account (for Backend)

1. Go to Firebase Console → Project Settings
2. Click **Service Accounts** tab
3. Click **Generate New Private Key**
4. Download the JSON file
5. Extract these values for Render environment variables:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and \n characters)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

### Get Firebase Web Config (for Frontend)

1. Go to Firebase Console → Project Settings → General
2. Scroll to "Your apps" section
3. Add a web app or select existing one
4. Copy the config values for Vercel environment variables

## Part 4: Custom Domain (Optional)

### Vercel Custom Domain

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain
3. Follow DNS instructions

### Render Custom Domain

1. Render Dashboard → Your Service → Settings → Custom Domain
2. Add your domain
3. Follow DNS instructions

## Part 5: Monitoring & Logs

### Render Logs

- View logs: Render Dashboard → Your Service → Logs tab
- Set up alerts: Settings → Notifications

### Vercel Logs

- View logs: Vercel Dashboard → Your Project → Deployments → Click deployment
- Real-time logs available during deployment

## Troubleshooting

### Backend Issues

**Database Connection Error**
- Verify `DATABASE_URL` is correct
- Check database is running on Render
- Ensure you ran `npm run db:push`

**CORS Errors**
- Update `ALLOWED_ORIGINS` in Render to include your Vercel URL
- Ensure no trailing slashes in URLs

**Firebase Authentication Fails**
- Verify all Firebase environment variables are set correctly
- Check `FIREBASE_PRIVATE_KEY` includes quotes and newline characters
- Ensure service account has proper permissions

### Frontend Issues

**API Calls Failing**
- Verify `VITE_API_URL` points to correct Render backend URL
- Check browser console for CORS errors
- Ensure backend is running on Render

**Firebase Not Working**
- Verify all `VITE_FIREBASE_*` variables are set
- Check Firebase console for authentication settings
- Ensure authorized domains include your Vercel domain

**Build Fails**
- Check build logs in Vercel
- Ensure all dependencies are in `dependencies` not `devDependencies`
- Verify Node version compatibility

### Free Tier Limitations

**Render Free Tier**
- Service spins down after 15 minutes of inactivity
- First request after spin down takes ~30 seconds
- 750 hours/month limit

**Vercel Free Tier**
- 100GB bandwidth/month
- Unlimited deployments
- Custom domains supported

## Production Checklist

- [ ] Database backed up regularly
- [ ] Environment variables secured
- [ ] CORS configured correctly
- [ ] Firebase authentication working
- [ ] Custom domains configured (if needed)
- [ ] Monitoring/alerts set up
- [ ] SSL/HTTPS enabled (automatic on both platforms)
- [ ] Session secret is strong and unique
- [ ] API rate limiting configured
- [ ] Error logging set up

## Support

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Firebase Docs: https://firebase.google.com/docs

## Quick Commands

```bash
# Local development
npm run dev

# Build frontend
npm run build:frontend

# Build backend
npm run build:backend

# Start production backend
npm run start:backend

# Database push (development)
npm run db:push
```
