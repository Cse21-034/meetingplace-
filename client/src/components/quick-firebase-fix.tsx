/**
 * Quick Firebase Fix Component
 * 
 * Provides a simple alert with instructions to fix Firebase authentication.
 * Shows up when users encounter the unauthorized domain error.
 */

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function QuickFirebaseFix() {
  const [copied, setCopied] = useState(false);
  const currentDomain = window.location.hostname;

  const copyDomain = () => {
    navigator.clipboard.writeText(currentDomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-sm">
        <div className="space-y-2">
          <p className="font-medium text-orange-800">
            🔧 Quick Fix for "unauthorized domain" error:
          </p>
          <ol className="text-xs space-y-1 text-orange-700">
            <li>1. Open <a href="https://console.firebase.google.com/" target="_blank" className="text-blue-600 underline">Firebase Console</a></li>
            <li>2. Go to Authentication → Sign-in method</li>
            <li>3. Scroll to "Authorized domains" and click "Add domain"</li>
            <li>4. Add this domain: 
              <div className="flex items-center gap-1 mt-1">
                <code className="bg-orange-100 px-1 py-0.5 rounded text-xs">{currentDomain}</code>
                <Button size="sm" variant="ghost" onClick={copyDomain} className="h-5 w-5 p-0">
                  {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </li>
            <li>5. Click "Save" and try signing in again</li>
          </ol>
        </div>
      </AlertDescription>
    </Alert>
  );
}