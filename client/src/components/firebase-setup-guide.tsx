/**
 * Firebase Setup Guide Component
 * 
 * Provides step-by-step instructions for configuring Firebase authentication.
 * Helps users resolve the "unauthorized domain" error.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Globe
} from "lucide-react";

export default function FirebaseSetupGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const currentDomain = window.location.hostname;

  const firebaseSecrets = `VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_APP_ID=your_app_id_here`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings size={16} />
          Fix Google Sign-in
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={20} />
            Fix Firebase Authentication Error
          </DialogTitle>
        </DialogHeader>

        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            The "unauthorized domain" error occurs because your current domain ({currentDomain}) is not authorized in Firebase. Follow these steps to fix it.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                Open Firebase Console
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Go to your Firebase project's authentication settings.
              </p>
              <Button asChild className="w-full">
                <a href="https://console.firebase.google.com/" target="_blank" className="flex items-center gap-2">
                  <ExternalLink size={16} />
                  Open Firebase Console
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                Navigate to Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="text-sm space-y-2 text-gray-600">
                <li>• Click on "Authentication" in the left sidebar</li>
                <li>• Go to the "Sign-in method" tab</li>
                <li>• Scroll down to "Authorized domains" section</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                Add Your Domain
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Click "Add domain" and add your current domain:
              </p>
              <div className="flex items-center justify-between bg-gray-100 p-3 rounded text-sm">
                <code className="font-mono">{currentDomain}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(currentDomain, "domain")}
                >
                  {copiedText === "domain" ? <CheckCircle size={14} /> : <Copy size={14} />}
                </Button>
              </div>
              <Alert>
                <Globe className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  If you plan to deploy elsewhere, also add localhost and your production domain.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
                Verify Firebase Secrets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Make sure these secrets are set in your Replit project:
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-gray-100 p-2 rounded text-xs">
                  <pre className="font-mono">{firebaseSecrets}</pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(firebaseSecrets, "secrets")}
                  >
                    {copiedText === "secrets" ? <CheckCircle size={14} /> : <Copy size={14} />}
                  </Button>
                </div>
              </div>
              <Alert>
                <AlertDescription className="text-xs">
                  Go to Replit Secrets tab (lock icon in sidebar) and add these with your actual Firebase values.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</span>
                Test the Fix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="text-sm space-y-2 text-gray-600">
                <li>• Click "Save" in Firebase console</li>
                <li>• Wait 2-3 minutes for changes to take effect</li>
                <li>• Restart your Replit application</li>
                <li>• Try Google sign-in again</li>
              </ol>
              <Badge variant="outline" className="text-green-600">
                The error should be resolved!
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-4" />

        <div className="space-y-3">
          <h4 className="font-medium">Quick Links</h4>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="https://console.firebase.google.com/" target="_blank" className="flex items-center gap-1">
                <ExternalLink size={12} />
                Firebase Console
              </a>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              Restart App
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}