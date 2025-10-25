/**
 * Authentication Hook - FIXED VERSION
 * 
 * Properly syncs Firebase users with PostgreSQL database
 * Handles authentication state and errors gracefully
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "firebase/auth";
import { onAuthStateChange, signOutUser } from "@/lib/firebase";
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
    // Listen for auth state changes
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get fresh token
          const token = await firebaseUser.getIdToken(true);
          
          // Sync user with backend using POST method
          const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/firebase`, {
            method: 'POST', // IMPORTANT: Must be POST
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            }),
          });

          if (response.ok) {
            setUser(firebaseUser);
            
            // Only show welcome toast for new logins (not on page refresh)
            if (!sessionStorage.getItem('hasShownWelcome')) {
              toast({
                title: "Welcome back!",
                description: `Signed in as ${firebaseUser.displayName || firebaseUser.email}`,
              });
              sessionStorage.setItem('hasShownWelcome', 'true');
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error("Backend sync failed:", errorData);
            
            // Still set user even if backend sync fails
            setUser(firebaseUser);
            
            toast({
              title: "Partial Login",
              description: "You're logged in, but profile sync had issues. Some features may be limited.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Backend sync error:", error);
          // Still set user even if backend sync fails
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
        sessionStorage.removeItem('hasShownWelcome');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [toast]);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setUser(null);
      sessionStorage.removeItem('hasShownWelcome');
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
