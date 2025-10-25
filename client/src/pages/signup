/**
 * Sign Up Page Component
 * 
 * Dedicated signup page with Firebase Google authentication
 * and account creation flow
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, CheckCircle } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { signInWithGooglePopup, signInWithGoogleRedirect } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export default function SignUp() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [email, setEmail] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  const handleGoogleSignUp = async (useRedirect = false) => {
    if (!acceptTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the Terms of Service and Privacy Policy to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (useRedirect) {
        await signInWithGoogleRedirect();
      } else {
        const user = await signInWithGooglePopup();
        if (user) {
          toast({
            title: "Welcome to Kgotla! 🎉",
            description: `Account created successfully as ${user.displayName || user.email}`,
          });
          setLocation("/");
        }
      }
    } catch (error: any) {
      console.error('Google sign-up error:', error);
      
      // Don't show error for user-cancelled popups
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      
      let errorMessage = "Failed to create account with Google";
      
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized. Please contact support.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Popup was blocked. Please allow popups or use the mobile sign-up option.";
      }
      
      toast({
        title: "Sign-up failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-sm mx-auto bg-white min-h-screen">
        {/* Header */}
        <header className="bg-white px-4 py-6 text-center border-b">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <MessageSquare className="text-white" size={24} />
            </div>
            <h1 className="text-3xl font-bold text-neutral">Kgotla</h1>
          </div>
          <p className="text-gray-600">Join the conversation</p>
        </header>

        <div className="px-4 py-8">
          {/* Sign Up Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Create Account</CardTitle>
              <CardDescription className="text-center">
                Join thousands of community members sharing wisdom and building connections
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Benefits List */}
              <div className="bg-green-50 p-4 rounded-lg space-y-2 mb-4">
                <h3 className="font-semibold text-green-800 mb-2">What you'll get:</h3>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-green-700">
                    <CheckCircle size={16} className="mr-2 flex-shrink-0" />
                    <span>Connect with your community</span>
                  </div>
                  <div className="flex items-center text-sm text-green-700">
                    <CheckCircle size={16} className="mr-2 flex-shrink-0" />
                    <span>Share and gain wisdom</span>
                  </div>
                  <div className="flex items-center text-sm text-green-700">
                    <CheckCircle size={16} className="mr-2 flex-shrink-0" />
                    <span>Earn reputation and badges</span>
                  </div>
                  <div className="flex items-center text-sm text-green-700">
                    <CheckCircle size={16} className="mr-2 flex-shrink-0" />
                    <span>Access to marketplace & tips</span>
                  </div>
                </div>
              </div>

              {/* Google Sign Up */}
              <Button
                onClick={() => handleGoogleSignUp(false)}
                disabled={isLoading || !acceptTerms}
                className="w-full flex items-center gap-3 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                variant="outline"
              >
                <FcGoogle className="w-5 h-5" />
                {isLoading ? "Creating account..." : "Sign up with Google"}
              </Button>

              {/* Mobile Option */}
              <div className="md:hidden">
                <Button
                  onClick={() => handleGoogleSignUp(true)}
                  disabled={isLoading || !acceptTerms}
                  className="w-full"
                  variant="outline"
                >
                  Sign up with Google (Mobile)
                </Button>
              </div>

              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
                  or with email
                </span>
              </div>

              {/* Email Sign Up Form (Coming Soon) */}
              <div className="space-y-3 opacity-50">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    disabled
                  />
                </div>
                <Button className="w-full" disabled>
                  Coming Soon
                </Button>
                <p className="text-xs text-center text-gray-500">
                  Email sign-up will be available soon
                </p>
              </div>

              {/* Terms & Privacy */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                />
                <label htmlFor="terms" className="text-xs text-gray-600 leading-tight">
                  I agree to the{" "}
                  <a href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Sign In Link */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <button
                    onClick={() => setLocation("/")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <h3 className="font-semibold text-gray-900 mb-3">Why Kgotla?</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>🌍 Built for African communities</p>
              <p>🗣️ Available in Setswana & English</p>
              <p>🤝 Connect with elders & mentors</p>
              <p>💼 Marketplace for local businesses</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-4 py-6 text-center text-xs text-gray-500 border-t">
          <p>© 2025 Kgotla. Made with ❤️ for Southern Africa</p>
        </footer>
      </div>
    </div>
  );
}
