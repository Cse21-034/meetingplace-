// client/src/pages/home.tsx
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import MobileLayout from "@/components/mobile-layout";
import PostCard from "@/components/post-card";
import CreatePostModal from "@/components/create-post-modal";
import { Button } from "@/components/ui/button";
import { Plus, Search, Bell, Globe, Crown, Star } from "lucide-react";
import AppMenu from "@/components/app-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SubscriptionModal from "@/components/subscription-modal"; 
import { useLocation } from "wouter";

interface PostAuthor {
  id: string;
  displayName: string;
  profileImageUrl?: string;
  isVerified: boolean;
  verificationBadge?: string | null;
  location?: string;
}

interface Post {
  id: number;
  authorId: string;
  type: string;
  title?: string;
  content: string;
  imageUrl?: string;
  pollOptions?: any;
  tags?: string[];
  isAnonymous: boolean;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  createdAt: string;
  author: PostAuthor | null; 
  currentUserVote?: 'upvote' | 'downvote' | null; 
}

// Static mock for Sponsored Content to restore its original look
const MOCK_SPONSORED_CONTENT = {
  imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=60&h=60&fit=crop&crop=center",
  title: 'Support Local Artisans',
  content: 'Discover authentic handmade crafts from Southern Africa. Shop now and support our community.',
  linkUrl: 'https://kgotla.com/sponsored/local-artisans' 
};

export default function Home() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false); // State for Upgrade Modal
  const [language, setLanguage] = useState<'en' | 'tn'>('en');
  const [, setLocation] = useLocation(); 

  const getRobustAvatarUrl = () => {
    // 1. Use Firebase User's photoURL (which is updated from DB sync in use-auth)
    if (user?.photoURL) {
        return user.photoURL;
    }
    // 2. Fallback to name-based avatar
    const nameForAvatar = user?.displayName || user?.email?.split('@')[0] || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&size=80`;
  };

  if (!loading && !user) {
    return <div>Please sign in to continue</div>;
  }

  // Fetch real posts data (using real API endpoint, removing mock data)
  const { data: posts, isLoading: postsLoading, error } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/"; 
      }, 500);
    }
  }, [error, toast]);

  if (error && isUnauthorizedError(error as Error)) {
    return null;
  }

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'tn' : 'en');
  };

  const handleSearchClick = () => {
    setLocation("/search"); // FIXED: Navigates to search page
  }
  
  const handleSponsoredClick = (url: string) => {
    window.open(url, '_blank');
  };

  const header = (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-3">
        <AppMenu />
        <h1 className="text-xl font-bold text-neutral">
          {language === 'en' ? 'Kgotla' : 'Kgotla'}
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="text-gray-600 hover:text-primary"
        >
          <Globe size={16} className="mr-1" />
          {language === 'en' ? 'EN' : 'TN'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSearchClick} // FIXED: Connects to search navigation
          className="text-gray-600 hover:text-primary"
        >
          <Search size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/notifications")} // FIXED: Connects to notifications navigation
          className="text-gray-600 hover:text-primary relative"
        >
          <Bell size={16} />
          <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-2 h-2"></span>
        </Button>
      </div>
    </header>
  );

  // MOCK STORIES KEPT AS PLACEHOLDERS
  const stories = user ? (
    <section className="px-4 py-3 bg-white border-b border-gray-200">
      <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
        <div className="flex-shrink-0 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full p-0.5">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <img 
                src={getRobustAvatarUrl()}
                alt="Your story" 
                className="w-14 h-14 rounded-full object-cover"
              />
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {language === 'en' ? 'Your Story' : 'Pale ya gago'}
          </p>
        </div>
        <div className="flex-shrink-0 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-secondary to-cultural rounded-full p-0.5">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-lg">👥</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {language === 'en' ? 'Community' : 'Setšhaba'}
          </p>
        </div>
      </div>
    </section>
  ) : null;

  const createPostPrompt = user ? (
    <section className="px-4 py-3 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <img 
          src={getRobustAvatarUrl()}
          alt="Your profile" 
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <Button
            variant="outline"
            onClick={() => setIsCreatePostOpen(true)}
            className="w-full text-left justify-start bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full"
          >
            {language === 'en' ? "What's on your mind?" : "O akanya eng?"}
          </Button>
        </div>
      </div>
    </section>
  ) : null;

  // RESTORED PREMIUM BANNER + ADDED CLICK FUNCTIONALITY
  const premiumBanner = user?.subscriptionTier === 'free' ? (
    <section className="px-4 py-3">
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {language === 'en' ? 'Upgrade to Premium' : 'Tokafatsa go Premium'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Unlock exclusive features from $2/month' : 'Bulela dikarolo tse kgethegile go tswa ko $2/kgwedi'}
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => setIsSubscriptionModalOpen(true)} // FIXED: Opens SubscriptionModal
            >
              <Star className="w-4 h-4" />
              {language === 'en' ? 'Upgrade' : 'Tokafatsa'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  ) : null;

  // RESTORED SPONSORED CONTENT + ADDED CLICK FUNCTIONALITY
  const sponsoredContent = (
    <section className="px-4 py-3">
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
              {language === 'en' ? 'Sponsored' : 'Kgwebisitšo'}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <img 
              src={MOCK_SPONSORED_CONTENT.imageUrl}
              alt={MOCK_SPONSORED_CONTENT.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">
                {language === 'en' ? 'Support Local Artisans' : 'Thusa Baithuti ba Selegae'}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {language === 'en' 
                  ? 'Discover authentic handmade crafts from Southern Africa. Shop now and support our community.'
                  : 'Bona ditiro tse di dirilweng ka matsogo go tswa Aforikaborwa. Reka gompieno o thuse setšhaba sa rona.'
                }
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleSponsoredClick(MOCK_SPONSORED_CONTENT.linkUrl)} // FIXED: Connects to external URL
            >
              {language === 'en' ? 'Learn More' : 'Ithute go oketsi'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );

  const content = (
    <div className="space-y-0">
      {postsLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading posts...</p>
        </div>
      ) : posts && posts.length > 0 ? (
        posts.map((post: Post) => (
          <PostCard key={post.id} post={post} /> // Uses real posts data
        ))
      ) : (
        <Card className="mx-4 mt-8">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {language === 'en' ? 'Welcome to Kgotla!' : 'Kamogelo ko Kgotla!'}
            </h3>
            <p className="text-gray-600 mb-4">
              {language === 'en' 
                ? "Start by creating your first post or joining a community group."
                : "Simolola ka go dira poso ya ntlha kgotsa go tsena setlhopheng sa setšhaba."
              }
            </p>
            <Button 
              onClick={() => setIsCreatePostOpen(true)}
              className="bg-primary hover:bg-blue-600"
            >
              {language === 'en' ? 'Create Your First Post' : 'Dira Poso ya Ntlha'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const fab = (
    <Button
      onClick={() => setIsCreatePostOpen(true)}
      className="fixed bottom-24 right-4 w-14 h-14 bg-primary rounded-full shadow-lg hover:bg-blue-600 z-40"
    >
      <Plus size={24} />
    </Button>
  );

  return (
    <MobileLayout header={header} fab={fab}>
      {stories}
      {createPostPrompt}
      {premiumBanner}
      {sponsoredContent}
      {content}
      <CreatePostModal 
        isOpen={isCreatePostOpen} 
        onClose={() => setIsCreatePostOpen(false)}
        language={language}
      />
      <SubscriptionModal 
        trigger={null} 
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />
    </MobileLayout>
  );
}
