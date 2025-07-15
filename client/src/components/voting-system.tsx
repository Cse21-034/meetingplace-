/**
 * Voting System Component
 * 
 * Handles upvoting and downvoting for posts and comments.
 * Provides visual feedback and real-time vote updates.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface VotingSystemProps {
  itemId: number;
  itemType: 'post' | 'comment';
  initialUpvotes: number;
  initialDownvotes: number;
  userVote?: 'upvote' | 'downvote' | null;
  onVoteChange?: (votes: { upvotes: number; downvotes: number }) => void;
}

export default function VotingSystem({
  itemId,
  itemType,
  initialUpvotes,
  initialDownvotes,
  userVote,
  onVoteChange
}: VotingSystemProps) {
  const [currentVote, setCurrentVote] = useState(userVote);
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const voteMutation = useMutation({
    mutationFn: async ({ type }: { type: 'upvote' | 'downvote' }) => {
      const endpoint = itemType === 'post' ? '/api/votes' : '/api/votes';
      const body = itemType === 'post' 
        ? { postId: itemId, type }
        : { commentId: itemId, type };
      
      const response = await apiRequest("POST", endpoint, body);
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update local state
      const newVote = currentVote === variables.type ? null : variables.type;
      setCurrentVote(newVote);
      
      // Update vote counts based on the vote change
      let newUpvotes = upvotes;
      let newDownvotes = downvotes;
      
      if (currentVote === 'upvote') {
        newUpvotes--;
      } else if (currentVote === 'downvote') {
        newDownvotes--;
      }
      
      if (newVote === 'upvote') {
        newUpvotes++;
      } else if (newVote === 'downvote') {
        newDownvotes++;
      }
      
      setUpvotes(newUpvotes);
      setDownvotes(newDownvotes);
      
      // Notify parent component
      onVoteChange?.({ upvotes: newUpvotes, downvotes: newDownvotes });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      if (itemType === 'comment') {
        queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Vote failed",
        description: error.message || "Failed to register vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVote = (type: 'upvote' | 'downvote') => {
    voteMutation.mutate({ type });
  };

  const totalScore = upvotes - downvotes;

  return (
    <div className="flex items-center space-x-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('upvote')}
        disabled={voteMutation.isPending}
        className={`p-1 h-8 w-8 ${
          currentVote === 'upvote' 
            ? 'text-green-600 bg-green-50 hover:bg-green-100' 
            : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
        }`}
      >
        <ChevronUp size={16} />
      </Button>
      
      <span className={`text-sm font-medium min-w-[2rem] text-center ${
        totalScore > 0 ? 'text-green-600' : 
        totalScore < 0 ? 'text-red-600' : 
        'text-gray-600'
      }`}>
        {totalScore > 0 ? '+' : ''}{totalScore}
      </span>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('downvote')}
        disabled={voteMutation.isPending}
        className={`p-1 h-8 w-8 ${
          currentVote === 'downvote' 
            ? 'text-red-600 bg-red-50 hover:bg-red-100' 
            : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
        }`}
      >
        <ChevronDown size={16} />
      </Button>
    </div>
  );
}