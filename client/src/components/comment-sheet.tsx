import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ThumbsUp, Send, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CommentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
}

export default function CommentSheet({ isOpen, onClose, postId }: CommentSheetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState<number | null>(null);

  const { data: comments, isLoading, error } = useQuery({
    queryKey: ["/api/posts", postId, "comments"],
    enabled: isOpen,
    retry: false,
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: number }) => {
      await apiRequest("POST", `/api/posts/${postId}/comments`, {
        content,
        parentId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setNewComment("");
      setReplyToId(null);
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
        description: "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to comment",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    createCommentMutation.mutate({
      content: newComment,
      parentId: replyToId || undefined,
    });
  };

  const handleReply = (commentId: number) => {
    setReplyToId(commentId);
  };

  const cancelReply = () => {
    setReplyToId(null);
  };

  if (error && isUnauthorizedError(error as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  // Mock comments data for display
  const mockComments = [
    {
      id: 1,
      content: "Yes! My grandmother always said to watch the behavior of cattle and birds. They know when the rains are coming! 🐄🐦",
      author: {
        name: "Dineo Mogwe",
        avatar: "https://ui-avatars.com/api/?name=Dineo+Mogwe&size=32",
      },
      upvotes: 5,
      createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      parentId: null,
    },
    {
      id: 2,
      content: "@Dineo Mogwe That's fascinating! Could you share more about these traditional signs? I'd love to learn more about our ancestral wisdom.",
      author: {
        name: "Kagiso Molefe",
        avatar: "https://ui-avatars.com/api/?name=Kagiso+Molefe&size=32",
      },
      upvotes: 2,
      createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      parentId: 1,
    },
  ];

  const renderComment = (comment: any, isReply = false) => (
    <div key={comment.id} className={`flex space-x-3 ${isReply ? 'ml-8' : ''}`}>
      <img
        src={comment.author.avatar}
        alt={comment.author.name}
        className="w-8 h-8 rounded-full object-cover"
      />
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <h4 className="text-sm font-medium text-neutral">{comment.author.name}</h4>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
        <div className="flex items-center space-x-4 mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-1 text-gray-500 hover:text-primary h-8 px-2"
          >
            <ThumbsUp size={12} />
            <span className="text-xs">{comment.upvotes}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleReply(comment.id)}
            className="text-xs text-gray-500 hover:text-neutral h-8 px-2"
          >
            Reply
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] max-w-sm mx-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Comments</SheetTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 mt-2 text-sm">Loading comments...</p>
            </div>
          ) : mockComments.length > 0 ? (
            mockComments.map((comment) => (
              <div key={comment.id}>
                {renderComment(comment, false)}
                {/* Render replies */}
                {mockComments
                  .filter(c => c.parentId === comment.id)
                  .map(reply => renderComment(reply, true))}
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500 text-sm">No comments yet.</p>
              <p className="text-gray-400 text-xs mt-1">Be the first to comment!</p>
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="border-t pt-4">
          {replyToId && (
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg mb-3">
              <span className="text-sm text-gray-600">
                Replying to {mockComments.find(c => c.id === replyToId)?.author.name}
              </span>
              <Button variant="ghost" size="sm" onClick={cancelReply}>
                <X size={14} />
              </Button>
            </div>
          )}
          
          <div className="flex space-x-3">
            <img
              src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.firstName || "User")}&size=32`}
              alt="Your profile"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                  className="flex-1 rounded-full border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || createCommentMutation.isPending}
                  className="rounded-full bg-primary hover:bg-blue-600"
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
