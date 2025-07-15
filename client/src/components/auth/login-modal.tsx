/**
 * Login Modal Component
 * 
 * Provides authentication options including Google sign-in and email/password.
 * Handles both popup and redirect authentication flows.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FcGoogle } from "react-icons/fc";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, AlertTriangle } from "lucide-react";
import { signInWithGooglePopup, signInWithGoogleRedirect } from "@/lib/firebase";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleGoogleSignIn = async (useRedirect = false) => {
    setIsLoading(true);
    try {
      if (useRedirect) {
        await signInWithGoogleRedirect();
      } else {
        const user = await signInWithGooglePopup();
        if (user) {
          toast({
            title: "Welcome to Kgotla!",
            description: `Signed in as ${user.displayName || user.email}`,
          });
          onClose();
        }
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      let errorMessage = "Failed to sign in with Google";
      
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "Domain not authorized. Please check the Firebase setup instructions below.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Popup was blocked. Try again or use redirect sign-in.";
      }
      
      toast({
        title: "Sign-in failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    // For now, redirect to Google auth - can implement email/password later
    await handleGoogleSignIn();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-green-800 dark:text-green-400">
            Join Kgotla
          </DialogTitle>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Traditional meeting place for modern voices
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Google Sign In */}
          <Button
            onClick={() => handleGoogleSignIn()}
            disabled={isLoading}
            className="w-full flex items-center gap-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            variant="outline"
          >
            <FcGoogle className="w-5 h-5" />
            Continue with Google
          </Button>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 px-2 text-sm text-gray-500">
              or
            </span>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Mobile Redirect Option */}
          <div className="md:hidden">
            <Button
              onClick={() => handleGoogleSignIn(true)}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              Use Google (Mobile)
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Firebase Setup Instructions */}
        <Alert className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Getting "unauthorized domain" error?</strong><br/>
            1. Go to <a href="https://console.firebase.google.com/" target="_blank" className="text-blue-600 underline">Firebase Console</a><br/>
            2. Authentication → Sign-in method → Authorized domains<br/>
            3. Add: <code className="bg-gray-100 px-1 rounded">{window.location.hostname}</code><br/>
            4. Make sure Firebase secrets are set in Replit
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  );
}