# Firebase Setup Instructions

## Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `kgotla-forum` (or your preferred name)
4. Accept terms and click "Continue"
5. Disable Google Analytics (optional) and click "Create project"

## Step 2: Add Web App
1. In your Firebase project, click the Web icon (`</>`)
2. App nickname: `Kgotla Web App`
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. Copy the configuration values (you'll need these for Replit secrets)

## Step 3: Enable Authentication
1. In the Firebase console, go to "Authentication" > "Get started"
2. Go to "Sign-in method" tab
3. Click on "Google" provider
4. Toggle "Enable"
5. Enter support email (your email address)
6. Click "Save"

## Step 4: Configure Authorized Domains
**This is the critical step to fix the "unauthorized domain" error:**

1. Still in "Authentication" > "Sign-in method"
2. Scroll down to "Authorized domains" section
3. Click "Add domain"
4. Add your Replit domain: `YOUR_REPL_NAME.YOUR_USERNAME.repl.co`
   - Example: `kgotla-forum.myusername.repl.co`
5. If you plan to deploy elsewhere, also add:
   - `localhost` (for local development)
   - Your production domain (e.g., `kgotla.com`)
6. Click "Save"

## Step 5: Set Replit Secrets
In your Replit project, go to Secrets tab and add:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

## Step 6: Test Authentication
1. Restart your Replit application
2. Try signing in with Google
3. The error should be resolved

## Current Domain to Add
Based on your Replit URL, add this domain to Firebase:
```
YOUR_REPL_DOMAIN.repl.co
```

You can find your exact domain in the Replit webview URL at the top of your browser.

## Troubleshooting
- If you still get errors, double-check the domain spelling
- Make sure there are no extra spaces in the domain
- Wait a few minutes after adding the domain for changes to take effect
- Check that all three Firebase secrets are correctly set in Replit