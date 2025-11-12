import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import CommentSheet from "./comment-sheet";
import { 
  ChevronUp, 
  ChevronDown, 
  MessageCircle, 
  Bookmark, 
  Share,
  MoreHorizontal,
  HelpCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: {
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
    // Updated to expect nested author object from the API
    author: { 
        id: string;
        displayName: string;
        profileImageUrl: string;
        isVerified: boolean;
        verificationBadge?: string | null;
        location?: string;
        createdAt?: string;
    } | null;
  };
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);

  const voteMutation = useMutation({
    mutationFn: async ({ type }: { type: 'upvote' | 'downvote' }) => {
      await apiRequest("POST", "/api/votes", { postId: post.id, type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to vote on post",
        variant: "destructive",
      });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/bookmarks", { postId: post.id });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post bookmarked successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to bookmark post",
        variant: "destructive",
      });
    },
  });

  const handleVote = (type: 'upvote' | 'downvote') => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to vote on posts",
        variant: "destructive",
      });
      return;
    }

    setUserVote(prevVote => prevVote === type ? null : type);
    voteMutation.mutate({ type });
  };

  const handleBookmark = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to bookmark posts",
        variant: "destructive",
      });
      return;
    }

    bookmarkMutation.mutate();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || "Check out this post on Kgotla",
          text: post.content,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share canceled");
      }
    } else {
      // Fallback for browsers that don't support native sharing
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Post link copied to clipboard",
      });
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'elder':
        return 'bg-cultural text-white';
      case 'mentor':
        return 'bg-secondary text-white';
      case 'expert':
        return 'bg-primary text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  const getVerificationBadge = () => {
    const author = post.author;
    
    // Fallbacks if author data is missing or anonymous is checked
    const name = post.isAnonymous ? "Anonymous" : author?.displayName || "Kgotla User";
    const avatarName = author?.displayName || "User";
    const avatarUrl = post.isAnonymous 
      ? `https://ui-avatars.com/api/?name=Anonymous&size=40` 
      : author?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&size=40`;
    const isVerified = author?.isVerified || false;
    const badge = author?.verificationBadge;
    
    // Use fetched location if available
    const location = author?.location || "Online"; 
    
    return (
      <div className="flex items-start space-x-3">
        <img
          src={avatarUrl}
          alt="User avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-neutral">{name}</h3>
            {/* Show verified icon and badge only if not anonymous */}
            {isVerified && !post.isAnonymous && (
              <div className="w-4 h-4 bg-cultural rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
            {badge && !post.isAnonymous && (
              <Badge variant="secondary" className={`text-xs ${getBadgeColor(badge)}`}>
                {/* Capitalize first letter */}
                {badge.charAt(0).toUpperCase() + badge.slice(1)}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {location} • {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal size={16} />
        </Button>
      </div>
    );
  };

  const renderPostContent = () => {
    switch (post.type) {
      case 'poll':
        const pollOptions = post.pollOptions || [
          { text: "Skills training and vocational education", votes: 45 },
          { text: "Entrepreneurship support programs", votes: 32 },
          { text: "Cultural preservation activities", votes: 23 },
        ];
        
        // Mock votes count for display purpose, replace with real logic if implemented
        const totalVotes = pollOptions.reduce((sum: number, option: any) => sum + option.votes, 0);

        return (
          <div className="space-y-3">
            {post.title && <h4 className="font-semibold text-lg text-neutral">{post.title}</h4>}
            <p className="text-neutral leading-relaxed">{post.content}</p>
            <div className="space-y-2">
              {pollOptions.map((option: any, index: number) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral">{option.text}</span>
                    <span className="text-sm text-gray-500">{option.votes}%</span>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${option.votes}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">{totalVotes} votes • Poll closes in 2 days</p>
          </div>
        );

      case 'question':
        return (
          <div className="space-y-3">
            <div className="bg-blue-50 border-l-4 border-primary p-3 rounded-r-lg">
              <div className="flex items-center space-x-2 mb-2">
                <HelpCircle className="text-primary" size={16} />
                <span className="text-sm font-medium text-primary">Question</span>
              </div>
              {post.title && <h4 className="font-semibold text-lg text-neutral mb-1">{post.title}</h4>}
              <p className="text-neutral leading-relaxed">{post.content}</p>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-3">
            <p className="text-neutral leading-relaxed">{post.content}</p>
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt="Post image"
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
          </div>
        );

      default:
        // Text post
        return (
          <div className="space-y-2">
            {post.title && <h4 className="font-semibold text-lg text-neutral">{post.title}</h4>}
            <p className="text-neutral leading-relaxed">{post.content}</p>
          </div>
        )
    }
  };

  return (
    <>
      <Card 
        className="rounded-none border-x-0 border-t-0 border-b shadow-none transition-colors hover:bg-muted/50"
      >
        <CardContent className="p-0">
          <div className="px-4 py-3">
            {getVerificationBadge()}
          </div>
          
          <div className="px-4 pb-3">
            {renderPostContent()}
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {/* Ensure tags is an array of strings before mapping */}
                {Array.isArray(post.tags) && post.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {/* Format tag with # if it doesn't already have one */}
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 pb-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote('upvote')}
                className={`flex items-center space-x-1 ${
                  userVote === 'upvote' ? 'text-primary' : 'text-gray-500 hover:text-primary'
                }`}
              >
                <ChevronUp size={18} />
                <span className="text-sm">{post.upvotes}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote('downvote')}
                className={`flex items-center space-x-1 ${
                  userVote === 'downvote' ? 'text-accent' : 'text-gray-500 hover:text-accent'
                }`}
              >
                <ChevronDown size={18} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCommentSheetOpen(true)}
                className="flex items-center space-x-1 text-gray-500 hover:text-neutral"
              >
                <MessageCircle size={18} />
                <span className="text-sm">{post.commentCount}</span>
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className="text-gray-500 hover:text-secondary"
              >
                <Bookmark size={18} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-gray-500 hover:text-neutral"
              >
                <Share size={18} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <CommentSheet
        isOpen={isCommentSheetOpen}
        onClose={() => setIsCommentSheetOpen(false)}
        postId={post.id}
      />
    </>
  );
}
