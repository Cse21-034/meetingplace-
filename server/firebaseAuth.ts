/**
 * Firebase Authentication Integration for Backend
 * 
 * Handles Firebase token verification and user management on the server side.
 * Integrates with existing database storage system.
 */

// For now, we'll use Firebase REST API for token verification
// In production, you'd want to use firebase-admin with a service account
import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Note: For production deployment, initialize Firebase Admin SDK with service account
// const admin = require('firebase-admin');
// const serviceAccount = require('./path/to/serviceAccountKey.json');
// admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

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
    
    // For development, we'll verify tokens using Firebase REST API
    const response = await fetch(`https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${process.env.VITE_FIREBASE_API_KEY}`, {
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