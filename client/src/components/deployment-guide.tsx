/**
 * Deployment Guide Component
 * 
 * Provides comprehensive deployment instructions for various hosting platforms.
 * Makes the app easy to deploy and migrate between servers.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Cloud, 
  Server, 
  Container, 
  Download, 
  Copy, 
  ExternalLink,
  CheckCircle,
  Smartphone
} from "lucide-react";

export default function DeploymentGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const dockerCommands = {
    dockerfile: `# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

EXPOSE 5000

# Start the application
CMD ["npm", "start"]`,

    dockerCompose: `# docker-compose.yml
version: '3.8'

services:
  kgotla-app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://username:password@db:5432/kgotla
      - SESSION_SECRET=your-session-secret-here
      - VITE_FIREBASE_API_KEY=your-firebase-api-key
      - VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
      - VITE_FIREBASE_APP_ID=your-firebase-app-id
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=kgotla
      - POSTGRES_USER=username
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:`
  };

  const deploymentSteps = {
    vercel: [
      "Install Vercel CLI: npm i -g vercel",
      "Login to Vercel: vercel login",
      "Deploy: vercel --prod",
      "Set environment variables in Vercel dashboard",
      "Configure PostgreSQL database connection"
    ],
    heroku: [
      "Install Heroku CLI",
      "Create Heroku app: heroku create your-app-name",
      "Add PostgreSQL addon: heroku addons:create heroku-postgresql:hobby-dev",
      "Set config vars: heroku config:set SESSION_SECRET=...",
      "Deploy: git push heroku main"
    ],
    digitalocean: [
      "Create a Droplet with Node.js",
      "Clone repository: git clone your-repo-url",
      "Install dependencies: npm install",
      "Set up PostgreSQL database",
      "Configure environment variables",
      "Set up PM2 for process management",
      "Configure nginx reverse proxy"
    ],
    docker: [
      "Create Dockerfile (see Docker tab)",
      "Build image: docker build -t kgotla .",
      "Run container: docker run -p 5000:5000 kgotla",
      "Or use docker-compose: docker-compose up -d"
    ]
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Cloud size={16} />
          Deployment Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server size={20} />
            Kgotla Deployment Guide
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cloud">Cloud</TabsTrigger>
            <TabsTrigger value="docker">Docker</TabsTrigger>
            <TabsTrigger value="mobile">Mobile</TabsTrigger>
            <TabsTrigger value="env">Environment</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Start</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Kgotla is a production-ready PWA that can be deployed on any Node.js hosting platform.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Requirements</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Node.js 18+</li>
                      <li>• PostgreSQL database</li>
                      <li>• Firebase project</li>
                      <li>• SSL certificate (recommended)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Features</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• PWA ready for Play Store</li>
                      <li>• Real-time WebSocket support</li>
                      <li>• Multi-language support</li>
                      <li>• Database migrations</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Build Commands</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-gray-100 p-2 rounded text-sm">
                    <code>npm run build</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard("npm run build", "build")}
                    >
                      {copiedText === "build" ? <CheckCircle size={14} /> : <Copy size={14} />}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between bg-gray-100 p-2 rounded text-sm">
                    <code>npm run db:push</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard("npm run db:push", "db")}
                    >
                      {copiedText === "db" ? <CheckCircle size={14} /> : <Copy size={14} />}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between bg-gray-100 p-2 rounded text-sm">
                    <code>npm start</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard("npm start", "start")}
                    >
                      {copiedText === "start" ? <CheckCircle size={14} /> : <Copy size={14} />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cloud" className="space-y-4">
            <div className="grid gap-4">
              {Object.entries(deploymentSteps).map(([platform, steps]) => (
                <Card key={platform}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base capitalize flex items-center gap-2">
                      <Cloud size={16} />
                      {platform}
                      {platform === 'vercel' && <Badge variant="outline">Recommended</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-1 text-sm">
                      {steps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary font-medium">{index + 1}.</span>
                          <span className="text-gray-700">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="docker" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Container size={16} />
                  Docker Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Dockerfile</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(dockerCommands.dockerfile, "dockerfile")}
                    >
                      {copiedText === "dockerfile" ? <CheckCircle size={14} /> : <Copy size={14} />}
                      Copy
                    </Button>
                  </div>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {dockerCommands.dockerfile}
                  </pre>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Docker Compose</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(dockerCommands.dockerCompose, "compose")}
                    >
                      {copiedText === "compose" ? <CheckCircle size={14} /> : <Copy size={14} />}
                      Copy
                    </Button>
                  </div>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {dockerCommands.dockerCompose}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mobile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone size={16} />
                  PWA & Play Store Deployment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">PWA Features Ready</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>✅ Web App Manifest configured</li>
                    <li>✅ Service Worker for offline support</li>
                    <li>✅ App icons in all required sizes</li>
                    <li>✅ Responsive mobile-first design</li>
                    <li>✅ Touch-friendly interface</li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Play Store Deployment Steps</h4>
                  <ol className="space-y-1 text-sm text-gray-600">
                    <li>1. Use Trusted Web Activity (TWA)</li>
                    <li>2. Install Android Studio</li>
                    <li>3. Create TWA project pointing to your domain</li>
                    <li>4. Configure app signing</li>
                    <li>5. Build APK/AAB file</li>
                    <li>6. Upload to Google Play Console</li>
                  </ol>
                </div>

                <Card className="bg-blue-50">
                  <CardContent className="p-3">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Tip:</strong> Use tools like PWABuilder or Bubblewrap for easy TWA generation
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="env" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Environment Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-medium">Required Variables</h4>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-4 py-2 border-b">
                      <strong>Variable</strong>
                      <strong>Description</strong>
                      <strong>Example</strong>
                    </div>
                    <div className="grid grid-cols-3 gap-4 py-2 border-b text-gray-600">
                      <code>DATABASE_URL</code>
                      <span>PostgreSQL connection string</span>
                      <span>postgresql://user:pass@host:5432/db</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 py-2 border-b text-gray-600">
                      <code>SESSION_SECRET</code>
                      <span>Session encryption key</span>
                      <span>random-32-char-string</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 py-2 border-b text-gray-600">
                      <code>VITE_FIREBASE_API_KEY</code>
                      <span>Firebase API key</span>
                      <span>AIza...</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 py-2 border-b text-gray-600">
                      <code>VITE_FIREBASE_PROJECT_ID</code>
                      <span>Firebase project ID</span>
                      <span>your-project-id</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 py-2 text-gray-600">
                      <code>VITE_FIREBASE_APP_ID</code>
                      <span>Firebase app ID</span>
                      <span>1:123...</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-6">
          <Button asChild variant="outline">
            <a href="https://kgotla-docs.example.com" target="_blank" className="flex items-center gap-2">
              <ExternalLink size={14} />
              Full Documentation
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="https://github.com/kgotla/deploy-examples" target="_blank" className="flex items-center gap-2">
              <Download size={14} />
              Example Configs
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}