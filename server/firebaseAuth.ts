// server/firebaseAuth.ts - FIXED VERSION
// This file properly syncs Firebase users to PostgreSQL

import type { Express, Request, Response, NextFunction } from "express";
import * as admin from 'firebase-admin'; 
import { storage } from "./storage";
import fs from 'fs';
import path from 'path';

// Define the expected path for the secret file (Render Secret File)
const SERVICE_ACCOUNT_FILE_PATH = '/etc/secrets/firebase-admin-key.json'; 

// Initialize Firebase Admin SDK
let firebaseAdmin: admin.app.App | null = null;
const isProduction = process.env.NODE_ENV === 'production';

try {
  let serviceAccount: any = null;
  
  // 1. Load entire service account object from the Secret File (Priority Method)
  if (process.env.FIREBASE_PROJECT_ID) {
      try {
        const fileContent = fs.readFileSync(SERVICE_ACCOUNT_FILE_PATH, 'utf8');
        serviceAccount = JSON.parse(fileContent);
        console.log(`Firebase Admin: Read credentials from Secret File: ${SERVICE_ACCOUNT_FILE_PATH}`);
      } catch (fileError) {
        // 2. Fallback to Environment Variables
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            let privateKey = process.env.FIREBASE_PRIVATE_KEY;
            privateKey = privateKey.trim().replace(/^["']|["']$/g, '');
            privateKey = privateKey.replace(/\\n/g, '\n');
            
            serviceAccount = {
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: privateKey,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            };
            console.log('Firebase Admin: Falling back to reading private key from ENV var.');
        } else {
            console.log('Required Firebase Admin credentials are missing.');
        }
      }

      if (serviceAccount && admin.apps.length === 0) {
        console.log('Firebase Admin: Attempting final initialization...');
        firebaseAdmin = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin SDK initialized successfully');
      } else if (admin.apps.length > 0) {
          firebaseAdmin = admin.app();
          console.log('Firebase Admin SDK already initialized');
      }
  } else {
    console.log('Firebase Admin credentials (Project ID) not found, aborting Admin SDK initialization.');
  }
} catch (error) {
  console.error('Firebase Admin fatal initialization error:', error);
  console.log('Falling back to REST API verification');
}

/**
 * Middleware to verify Firebase ID tokens
 */
export const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Try to verify with Firebase Admin SDK first
    if (firebaseAdmin) {
      try {
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
        
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
    
    // Fallback to REST API verification
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
  // CRITICAL: Firebase user sync endpoint - MUST use POST method
  app.post('/api/auth/firebase', verifyFirebaseToken, async (req: any, res) => {
    try {
      const { uid, email, displayName, photoURL } = req.firebaseUser;
      
      console.log('Syncing user to database:', { uid, email, displayName });
      
      // Prepare user data for database
      const userData = {
        id: uid,
        email: email || '',
        username: email?.split('@')[0] || uid,
        displayName: displayName || email?.split('@')[0] || uid,
        avatarUrl: photoURL || '',
        isVerified: true,
        lastActiveAt: new Date(),
      };

      // Sync user to PostgreSQL database
      const user = await storage.upsertUser(userData);
      
      console.log('User synced successfully:', user.id);
      
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        }
      });
    } catch (error) {
      console.error('Firebase user sync error:', error);
      
      // Return success anyway to not block user login
      res.status(200).json({ 
        success: true,
        message: 'User session updated (with warnings)',
        warning: 'Database sync had issues but login successful'
      });
    }
  });

  // Get current user endpoint
  app.get('/api/auth/user', verifyFirebaseToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.firebaseUser.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found in database' });
      }
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  // Health check to verify Firebase is working
  app.get('/api/auth/status', (req, res) => {
    res.json({
      firebaseAdmin: firebaseAdmin ? 'initialized' : 'not initialized',
      environment: process.env.NODE_ENV,
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID
    });
  });
}
