/**
 * Improved Login Modal Component
 * 
 * Better error handling and user experience
 * Includes accessibility fixes
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FcGoogle } from "react-icons/fc";
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
  const [, setLocation] = useLocation();

  const handleGoogleSignIn = async (useRedirect = false) => {
    setIsLoading(true);
    try {
      if (useRedirect) {
        await signInWithGoogleRedirect();
      } else {
        const user = await signInWithGooglePopup();
        if (user) {
          toast({
            title: "Welcome back!",
            description: `Signed in as ${user.displayName || user.email}`,
          });
          onClose();
        }
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Don't show error for user-cancelled popups
      if (error.code === 'auth/popup-closed-by-user') {
        toast({
          title: "Sign-in cancelled",
          description: "You closed the sign-in window. Please try again if you want to sign in.",
        });
        return;
      }
      
      let errorMessage = "Failed to sign in with Google";
      
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized. Please check the Firebase setup.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Popup was blocked. Please allow popups or use the mobile sign-in option.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection.";
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
    
    // Email/password authentication not yet implemented
    toast({
      title: "Coming Soon",
      description: "Email sign-in will be available soon. Please use Google sign-in for now.",
    });
  };

  const handleSignUpRedirect = () => {
    onClose();
    setLocation("/signup");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-green-800">
            Welcome to Kgotla
          </DialogTitle>
          <DialogDescription className="text-center">
            Sign in to join the conversation and connect with your community
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Google Sign In */}
          <Button
            onClick={() => handleGoogleSignIn(false)}
            disabled={isLoading}
            className="w-full flex items-center gap-3 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
            variant="outline"
          >
            <FcGoogle className="w-5 h-5" />
            {isLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          {/* Mobile Redirect Option */}
          <div className="md:hidden">
            <Button
              onClick={() => handleGoogleSignIn(true)}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              Sign in with Google (Mobile)
            </Button>
          </div>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
              or
            </span>
          </div>

          {/* Email Form - Coming Soon */}
          <form onSubmit={handleEmailSignIn} className="space-y-3 opacity-50">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled
              />
            </div>
            <div>
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled
              />
            </div>
            <Button type="submit" className="w-full" disabled>
              Coming Soon
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={handleSignUpRedirect}
                className="text-primary hover:underline font-medium"
              >
                Sign Up
              </button>
            </p>
          </div>

          <p className="text-xs text-center text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
