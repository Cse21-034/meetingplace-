// cse21-034/meetingplace-/meetingplace--a19add74c19c86b1799e84b4cd1980c120a5392d/server/firebaseAuth.ts

import type { Express, Request, Response, NextFunction } from "express";
import * as admin from 'firebase-admin'; 
import { storage } from "./storage";
// WARNING: Do not use ES Modules 'import fs from "fs"' in this file to avoid conflicts.
// The built-in Node.js 'fs' module is available in your runtime.

// Define the expected path for the secret file (Render Secret File)
const SERVICE_ACCOUNT_FILE_PATH = '/etc/secrets/firebase-admin-key.json'; 

// Initialize Firebase Admin SDK
let firebaseAdmin: admin.app.App | null = null;

try {
  let serviceAccount: any = null;
  
  // 1. Load entire service account object from the Secret File (Priority Method)
  // We use Node's built-in require.
  const fs = require('fs');
  
  try {
    const fileContent = fs.readFileSync(SERVICE_ACCOUNT_FILE_PATH, 'utf8');
    serviceAccount = JSON.parse(fileContent);

    // If loaded from file, the private_key string already contains proper '\n' characters due to JSON parsing.
    console.log(`Firebase Admin: Read credentials from Secret File: ${SERVICE_ACCOUNT_FILE_PATH}`);

  } catch (fileError) {
    // 2. Fallback to Environment Variables
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        
        // Clean and process private key from ENV
        privateKey = privateKey.trim().replace(/^["']|["']$/g, '');
        privateKey = privateKey.replace(/\\n/g, '\n'); // Convert escaped newlines to actual newlines
        
        serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: privateKey,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        };
        console.log('Firebase Admin: Falling back to reading private key from ENV var.');
        
    } else {
        console.log('Required Firebase Admin credentials are missing in both file and environment.');
    }
  }

  // Final initialization attempt
  if (serviceAccount) {
    if (admin.apps.length === 0) {
      console.log('Firebase Admin: Attempting final initialization...');
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully');
    } else {
      firebaseAdmin = admin.app();
      console.log('Firebase Admin SDK already initialized');
    }

  } else {
    // This is the clean path to the REST API fallback, without throwing an error
    console.log('Firebase Admin credentials not available. Proceeding with REST API fallback.');
  }
  
} catch (error) {
  // Catch any unexpected initialization errors, likely deep in the SDK.
  console.error('Firebase Admin fatal initialization error:', error);
  console.log('Falling back to REST API verification');
}

/**
 * Middleware to verify Firebase ID tokens
 */
export const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    // ... (rest of verifyFirebaseToken remains the same)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Try to verify with Firebase Admin SDK first
    if (firebaseAdmin) {
      try {
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
        
        // Attach user info to request
        (req as any).firebaseUser = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          displayName: decodedToken.name,
          photoURL: decodedToken.picture,
          emailVerified: decodedToken.email_verified
        };
        
        return next();
      } catch (adminError) {
        console.error('Firebase Admin verification failed, trying REST API fallback:', adminError);
      }
    }
    
    // Fallback to REST API verification (for development)
    const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
    if (!apiKey) {
      return res.status(401).json({ message: 'Unauthorized: Firebase API key not configured' });
    }
    
    const response = await fetch(`https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token })
    });

    if (!response.ok) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }

    const data = await response.json();
    const user = data.users[0];

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    // Attach user info to request
    (req as any).firebaseUser = {
      uid: user.localId,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoUrl,
      emailVerified: user.emailVerified
    };

    next();
  } catch (error) {
    console.error('Firebase token verification error:', error);
    res.status(401).json({ message: 'Unauthorized: Token verification failed' });
  }
};


/**
 * Setup Firebase authentication routes
 */
export function setupFirebaseAuth(app: Express) {
  // Firebase user sync endpoint
  app.post('/api/auth/firebase', verifyFirebaseToken, async (req: any, res) => {
    try {
      const { uid, email, displayName, photoURL } = req.firebaseUser;
      
      // Sync user with our database
      const userData = {
        id: uid,
        email: email || '',
        username: email?.split('@')[0] || uid,
        displayName: displayName || email?.split('@')[0] || uid,
        avatarUrl: photoURL || '',
        isVerified: true,
        lastActiveAt: new Date(),
      };

      const user = await storage.upsertUser(userData);
      res.json({ success: true, user });
    } catch (error) {
      console.log('Firebase user sync handled gracefully:', error);
      res.status(200).json({ message: 'User session updated' });
    }
  });

  // Get current user endpoint
  app.get('/api/auth/user', verifyFirebaseToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.firebaseUser.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  });
}
