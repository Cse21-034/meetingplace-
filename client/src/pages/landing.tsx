import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Heart, Globe } from "lucide-react";
import LoginModal from "@/components/auth/login-modal";
import QuickFirebaseFix from "@/components/quick-firebase-fix";

export default function Landing() {
  const [showLoginModal, setShowLoginModal] = useState(false);

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
          <p className="text-gray-600">Traditional Meeting Place for Modern Voices</p>
        </header>

        {/* Hero Section */}
        <div className="px-4 py-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-neutral mb-4">
              Connect with Your Community
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Join discussions, share wisdom, and build connections with people across Southern Africa. 
              From traditional knowledge to modern innovation.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Users className="text-primary" size={20} />
                  <span>Community Groups</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Join location-based and interest-based groups to connect with like-minded individuals.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Heart className="text-secondary" size={20} />
                  <span>Elder Wisdom</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Learn from verified elders and community leaders who share traditional knowledge and life experiences.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Globe className="text-cultural" size={20} />
                  <span>Cultural Bridge</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Available in Setswana and English, preserving culture while embracing modern communication.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <Button 
              onClick={() => setShowLoginModal(true)}
              className="w-full h-12 text-lg font-medium bg-primary hover:bg-blue-600"
            >
              Join Kgotla Today
            </Button>
            <p className="text-xs text-gray-500 text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-4 py-6 text-center text-xs text-gray-500 border-t">
          <p>© 2025 Kgotla. Made with ❤️ for Southern Africa</p>
        </footer>

        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />

        {/* Firebase Setup Help */}
        <div className="px-4 pb-4">
          <QuickFirebaseFix />
        </div>
      </div>
    </div>
  );
}
