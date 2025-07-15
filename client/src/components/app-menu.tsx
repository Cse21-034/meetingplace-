/**
 * App Menu Component
 * 
 * Provides navigation menu and app directory functionality.
 * Displays user profile, settings, and app information.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  Menu, 
  User, 
  Settings, 
  HelpCircle, 
  Info, 
  LogOut,
  Home,
  Search,
  Users,
  Bell,
  ShoppingBag,
  MessageSquare,
  Globe,
  Database,
  Smartphone
} from "lucide-react";

export default function AppMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();

  const navigate = (path: string) => {
    setLocation(path);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const menuItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: Users, label: "Groups", path: "/groups" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: ShoppingBag, label: "Marketplace", path: "/marketplace" },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="p-2">
          <Menu size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <MessageSquare className="text-white" size={20} />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold text-green-800">Kgotla</SheetTitle>
              <p className="text-sm text-gray-600">v1.0.0</p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* User Profile */}
          {user && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={user.photoURL || ''} />
                    <AvatarFallback>
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {user.displayName || 'Kgotla User'}
                    </p>
                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="space-y-1">
            <h3 className="font-medium text-gray-900 mb-2">Navigation</h3>
            {menuItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className="w-full justify-start h-10 px-3"
                onClick={() => navigate(item.path)}
              >
                <item.icon size={18} className="mr-3" />
                {item.label}
              </Button>
            ))}
          </div>

          <Separator />

          {/* App Features */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">App Features</h3>
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-3 cursor-pointer hover:bg-gray-50">
                <div className="text-center">
                  <Globe className="mx-auto mb-2 text-blue-600" size={24} />
                  <p className="text-xs font-medium">Multi-language</p>
                </div>
              </Card>
              <Card className="p-3 cursor-pointer hover:bg-gray-50">
                <div className="text-center">
                  <Database className="mx-auto mb-2 text-green-600" size={24} />
                  <p className="text-xs font-medium">Cloud Sync</p>
                </div>
              </Card>
              <Card className="p-3 cursor-pointer hover:bg-gray-50">
                <div className="text-center">
                  <Smartphone className="mx-auto mb-2 text-purple-600" size={24} />
                  <p className="text-xs font-medium">PWA Ready</p>
                </div>
              </Card>
              <Card className="p-3 cursor-pointer hover:bg-gray-50">
                <div className="text-center">
                  <MessageSquare className="mx-auto mb-2 text-orange-600" size={24} />
                  <p className="text-xs font-medium">Real-time Chat</p>
                </div>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Settings & Actions */}
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start h-10 px-3"
              onClick={() => navigate("/profile")}
            >
              <User size={18} className="mr-3" />
              Profile
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-10 px-3"
              onClick={() => navigate("/settings")}
            >
              <Settings size={18} className="mr-3" />
              Settings
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-10 px-3"
            >
              <HelpCircle size={18} className="mr-3" />
              Help & Support
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-10 px-3"
            >
              <Info size={18} className="mr-3" />
              About Kgotla
            </Button>
          </div>

          <Separator />

          {/* Database Configuration */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Database</h3>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">PostgreSQL</p>
                    <p className="text-xs text-gray-600">Connected & Synced</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sign Out */}
          {user && (
            <>
              <Separator />
              <Button
                variant="ghost"
                className="w-full justify-start h-10 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleSignOut}
              >
                <LogOut size={18} className="mr-3" />
                Sign Out
              </Button>
            </>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 pt-4">
            <p>© 2025 Kgotla</p>
            <p>Made with ❤️ for Southern Africa</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}