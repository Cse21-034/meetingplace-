// server/firebaseAuth.ts - COMPLETE FIX
import type { Express, Request, Response, NextFunction } from "express";
import * as admin from 'firebase-admin'; 
import { storage } from "./storage";
import fs from 'fs';

const SERVICE_ACCOUNT_FILE_PATH = '/etc/secrets/firebase-admin-key.json'; 

let firebaseAdmin: admin.app.App | null = null;

try {
  let serviceAccount: any = null;
  
  if (process.env.FIREBASE_PROJECT_ID) {
    try {
      const fileContent = fs.readFileSync(SERVICE_ACCOUNT_FILE_PATH, 'utf8');
      serviceAccount = JSON.parse(fileContent);
      console.log('Firebase Admin: Read credentials from Secret File');
    } catch (fileError) {
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        privateKey = privateKey.trim().replace(/^["']|["']$/g, '');
        privateKey = privateKey.replace(/\\n/g, '\n');
        
        serviceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: privateKey,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        };
        console.log('Firebase Admin: Using environment variables');
      }
    }

    if (serviceAccount && admin.apps.length === 0) {
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully');
    } else if (admin.apps.length > 0) {
      firebaseAdmin = admin.app();
    }
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

export const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    
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
        console.error('Firebase Admin verification failed:', adminError);
      }
    }
    
    const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
    if (!apiKey) {
      return res.status(401).json({ message: 'Unauthorized: Firebase API key not configured' });
    }
    
    const response = await fetch(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token })
      }
    );

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

export function setupFirebaseAuth(app: Express) {
  // FIXED: Proper user sync with complete data extraction
  app.post('/api/auth/firebase', verifyFirebaseToken, async (req: any, res) => {
    try {
      const firebaseUser = req.firebaseUser;
      
      // Extract first and last name from displayName
      const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || firebaseUser.uid;
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || displayName;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      console.log('Syncing Firebase user:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName,
        firstName: firstName,
        lastName: lastName
      });
      
      // Complete user data for database
      const userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        username: firebaseUser.email?.split('@')[0] || firebaseUser.uid,
        displayName: displayName,
        firstName: firstName,
        lastName: lastName,
        profileImageUrl: firebaseUser.photoURL || '',
        avatarUrl: firebaseUser.photoURL || '',
        isVerified: firebaseUser.emailVerified || false,
        lastActiveAt: new Date(),
        isOnline: true,
      };

      // Upsert user to database
      const user = await storage.upsertUser(userData);
      
      console.log('User synced successfully:', {
        id: user.id,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName
      });
      
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          profileImageUrl: user.profileImageUrl,
        }
      });
    } catch (error) {
      console.error('Firebase user sync error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to sync user data'
      });
    }
  });

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

  app.get('/api/auth/status', (req, res) => {
    res.json({
      firebaseAdmin: firebaseAdmin ? 'initialized' : 'not initialized',
      environment: process.env.NODE_ENV,
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID
    });
  });
}
