/**
 * Authentication Hook
 * 
 * Provides authentication state and methods throughout the app.
 * Integrates Firebase auth with the backend API.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "firebase/auth";
import { onAuthStateChange, signOutUser, handleGoogleRedirectResult } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Handle redirect result on app load
    handleGoogleRedirectResult().catch((error) => {
      console.error("Redirect result error:", error);
    });

    // Listen for auth state changes
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        // Sync user with backend
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch('/api/auth/firebase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            }),
          });

          if (response.ok) {
            setUser(firebaseUser);
            toast({
              title: "Welcome back!",
              description: `Signed in as ${firebaseUser.displayName || firebaseUser.email}`,
            });
          }
        } catch (error) {
          console.error("Backend sync error:", error);
          setUser(firebaseUser); // Still set user even if backend sync fails
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [toast]);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setUser(null);
      toast({
        title: "Signed out",
        description: "See you next time!",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign out failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}