// client/src/pages/search.tsx
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MobileLayout from "@/components/mobile-layout";
import PostCard from "@/components/post-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search as SearchIcon, Filter, TrendingUp } from "lucide-react";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["/api/search", { q: debouncedQuery }],
    enabled: debouncedQuery.length > 0,
  });

  const header = (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Search posts, people, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-full focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <Button variant="ghost" size="sm">
          <Filter size={20} />
        </Button>
      </div>
    </header>
  );

  const content = (
    <div className="space-y-4">
      {!searchQuery ? (
        <>
          {/* REMOVED MOCK TRENDING TOPICS - Showing placeholder */}
          <section className="px-4 py-3">
            <h2 className="text-lg font-semibold text-neutral mb-3 flex items-center">
              <TrendingUp className="mr-2 text-primary" size={20} />
              Start Searching
            </h2>
            <Card className="text-center">
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">
                  Enter keywords above to search across all posts, people, and community groups.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="secondary" size="sm" className="pointer-events-none">#Culture</Button>
                    <Button variant="secondary" size="sm" className="pointer-events-none">#Business</Button>
                    <Button variant="secondary" size="sm" className="pointer-events-none">#Education</Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* REMOVED MOCK Recent Searches */}
        </>
      ) : (
        <div className="px-4">
          {searchLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 mt-2">Searching for "{searchQuery}"...</p>
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                {searchResults.length} results for "{searchQuery}"
              </p>
              {searchResults.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : debouncedQuery ? (
            <Card>
              <CardContent className="p-8 text-center">
                <SearchIcon className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search terms or browse suggested tags.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );

  return (
    <MobileLayout header={header}>
      {content}
    </MobileLayout>
  );
}
