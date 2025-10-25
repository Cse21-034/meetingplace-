/**
 * Firebase Authentication Integration for Backend
 * 
 * Handles Firebase token verification and user management on the server side.
 * Integrates with existing database storage system.
 */

import type { Express, Request, Response, NextFunction } from "express";
import * as admin from 'firebase-admin';
import { storage } from "./storage";

// Initialize Firebase Admin SDK
// In production, this uses environment variables from Render
// In development, it falls back to REST API verification
let firebaseAdmin: admin.app.App | null = null;

try {
  // Check if we have Firebase Admin credentials
  if (process.env.FIREBASE_PROJECT_ID && 
      process.env.FIREBASE_PRIVATE_KEY && 
      process.env.FIREBASE_CLIENT_EMAIL) {
    
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      })
    });
    console.log('Firebase Admin SDK initialized successfully');
  } else {
    console.log('Firebase Admin credentials not found, using REST API fallback');
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
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
        const decodedToken = await admin.auth().verifyIdToken(token);
        
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
    const apiKey = process.env.VITE_FIREBASE_API_KEY;
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