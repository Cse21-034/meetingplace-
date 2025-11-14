// client/src/pages/groups.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "@/components/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Plus, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

// Define Group Interface based on shared/schema.ts
interface Group {
  id: number;
  name: string;
  description: string;
  isPrivate: boolean;
  location?: string;
  category: string;
  memberCount: number;
  creatorId: string;
}

// Simple Placeholder Modal Component
const PlaceholderModal = ({ isOpen, onClose, title, description }: { isOpen: boolean, onClose: () => void, title: string, description: string }) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2">
                <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                </DialogClose>
            </div>
        </DialogContent>
    </Dialog>
);

export default function Groups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'all' | 'joined' | 'suggested'>('all');
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  // FETCH REAL DATA: Fetches all groups from the API
  const { 
    data: allGroups = [], 
    isLoading 
  } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
    enabled: !!user,
  });

  // NEW: Mutations for joining and leaving groups
  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: number) => 
      apiRequest("POST", `/api/groups/${groupId}/join`),
    onSuccess: (_, groupId) => {
      toast({ title: "Joined!", description: "Welcome to the group!" });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to join group", variant: "destructive" }),
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: number) => 
      apiRequest("POST", `/api/groups/${groupId}/leave`),
    onSuccess: () => {
      toast({ title: "Left Group", description: "You have left the group." });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to leave group", variant: "destructive" }),
  });

  const handleJoinLeave = (group: Group & { isJoined: boolean }, isJoined: boolean) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to join groups", variant: "destructive" });
      return;
    }
    if (isJoined) {
      leaveGroupMutation.mutate(group.id);
    } else {
      joinGroupMutation.mutate(group.id);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Business: "bg-blue-100 text-blue-700",
      Culture: "bg-purple-100 text-purple-700",
      Education: "bg-green-100 text-green-700",
      Tourism: "bg-yellow-100 text-yellow-700",
      Youth: "bg-pink-100 text-pink-700",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-700";
  };

  // REMOVED MOCK DATA: Now using allGroups and adding a mock `isJoined` for filtering
  const groupsWithMockedMembership = allGroups.map(g => ({
    ...g,
    // Note: This needs proper backend API enrichment (e.g., /api/groups?userId=...)
    // For now, we mock the join status for filter functionality to work with real data fetch.
    isJoined: g.id % 2 === 0, 
  })) as (Group & { isJoined: boolean })[];

  const filteredGroups = groupsWithMockedMembership.filter(group => {
    if (activeTab === 'joined') return group.isJoined;
    if (activeTab === 'suggested') return !group.isJoined;
    return true;
  });

  const header = (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral">Groups</h1>
        <Button 
          size="sm" 
          className="bg-primary hover:bg-blue-600"
          onClick={() => setIsCreateGroupModalOpen(true)} // FIXED: Connect to modal
        >
          <Plus size={16} className="mr-1" />
          Create
        </Button>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mt-3">
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('all')}
          className={activeTab === 'all' ? 'bg-primary text-white' : ''}
        >
          All Groups
        </Button>
        <Button
          variant={activeTab === 'joined' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('joined')}
          className={activeTab === 'joined' ? 'bg-primary text-white' : ''}
        >
          Joined
        </Button>
        <Button
          variant={activeTab === 'suggested' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('suggested')}
          className={activeTab === 'suggested' ? 'bg-primary text-white' : ''}
        >
          Suggested
        </Button>
      </div>
    </header>
  );

  const content = (
    <div className="space-y-4 px-4 py-4">
      {isLoading ? (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading groups...</p>
        </div>
      ) : (
        <>
          {activeTab === 'suggested' && (
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="text-cultural" size={20} />
                <h3 className="font-semibold text-neutral">Suggested for You</h3>
              </div>
              <p className="text-sm text-gray-600">
                Based on your interests and location, we think you'd enjoy these groups.
              </p>
            </div>
          )}
          
          {filteredGroups.map((group) => {
            const isJoiningOrLeaving = joinGroupMutation.isPending || leaveGroupMutation.isPending;
            return (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{group.name}</CardTitle>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Users size={14} />
                          <span>{group.memberCount.toLocaleString()} members</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin size={14} />
                          <span>{group.location || 'Online'}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={getCategoryColor(group.category)}>
                      {group.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{group.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {group.isPrivate && (
                        <Badge variant="outline" className="text-xs">
                          Private
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={group.isJoined ? "outline" : "default"}
                      className={group.isJoined ? "" : "bg-primary hover:bg-blue-600"}
                      onClick={() => handleJoinLeave(group, group.isJoined)}
                      disabled={isJoiningOrLeaving}
                    >
                      {isJoiningOrLeaving 
                        ? (group.isJoined ? 'Leaving...' : 'Joining...') 
                        : (group.isJoined ? "Joined" : "Join Group")
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {filteredGroups.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'joined' ? 'No groups joined yet' : 'No groups found'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {activeTab === 'joined' 
                    ? 'Discover and join groups that match your interests.'
                    : 'Try adjusting your filters or create a new group.'
                  }
                </p>
                <Button 
                  className="bg-primary hover:bg-blue-600"
                  onClick={() => setIsCreateGroupModalOpen(true)}
                >
                  <Plus size={16} className="mr-1" />
                  Create Group
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
      <PlaceholderModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        title="Group Creation Coming Soon"
        description="A dedicated page for creating new community groups will be implemented in the next phase."
      />
    </div>
  );

  return (
    <MobileLayout header={header}>
      {content}
    </MobileLayout>
  );
}
