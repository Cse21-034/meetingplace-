import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import MobileLayout from "@/components/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Heart, 
  Star, 
  MapPin, 
  Eye,
  MessageCircle,
  Share2,
  X,
  Upload
} from "lucide-react";

const categories = [
  "All",
  "Traditional Crafts",
  "Food & Beverages",
  "Clothing & Accessories",
  "Books & Media",
  "Services",
  "Electronics",
  "Home & Garden",
  "Health & Beauty",
  "Other"
];

// Interface to match the expected ENRICHED data structure from the API
interface MarketplaceItem {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  location: string;
  seller: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    reviews: number;
  };
  views: number;
  likes: number;
  isSponsored: boolean;
  createdAt: string;
}

export default function Marketplace() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null); 
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    price: "",
    currency: "USD",
    category: "Other",
    location: "",
  });

  // NEW: Fetch real data from the API
  const { 
    data: filteredItems = [], 
    isLoading: isMarketplaceLoading 
  } = useQuery<MarketplaceItem[]>({
    queryKey: ["/api/marketplace", selectedCategory, searchQuery],
    queryFn: async ({ queryKey }) => {
      const [path, category, query] = queryKey as [string, string, string];
      
      const params = new URLSearchParams();
      if (category && category !== "All") {
        params.append("category", category);
      }
      if (query) {
        params.append("q", query);
      }
      
      // The server will enrich the raw item data with seller details.
      const response = await apiRequest("GET", `/api/marketplace?${params.toString()}`);
      return response.json();
    }
  });

  // NEW: Image select handler
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file',
          description: 'Please select an image file',
          variant: "destructive",
        });
        return;
      }
      
      // 5MB max limit check
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB',
          variant: "destructive",
        });
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const createMarketplaceItem = useMutation({
    mutationFn: async (itemData: any) => 
      apiRequest("POST", "/api/marketplace", itemData),
    onSuccess: () => {
      toast({
        title: "Item Listed!",
        description: "Your item has been added to the marketplace"
      });
      setIsCreateModalOpen(false);
      // Reset form on success
      setNewItem({
        title: "",
        description: "",
        price: "",
        currency: "USD",
        category: "Other",
        location: "",
      });
      setImageFile(null);
      setImagePreview(null);
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace"] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
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
        description: error.message || "Failed to create item",
        variant: "destructive",
      });
    },
  });

  // MODIFIED: handleCreateItem to include image processing
  const handleCreateItem = async () => {
    if (!newItem.title || !newItem.description || !newItem.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    let payload: any = {
      ...newItem,
      price: Math.round(parseFloat(newItem.price) * 100) // Convert to cents
    };

    if (imageFile) {
      try {
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
        // Pass the base64 string as the single item in the images array
        payload.images = [base64Image]; 
      } catch (e) {
        toast({
          title: "Image Error",
          description: "Failed to process image file.",
          variant: "destructive",
        });
        return;
      }
    }

    createMarketplaceItem.mutate(payload);
  };

  const header = (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-neutral">Marketplace</h1>
        {isAuthenticated && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Sell
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>List an Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* NEW IMAGE FIELD */}
                <div>
                  <Label htmlFor="image">Image (First image is primary)</Label>
                  {!imagePreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mt-1">
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Choose an image file (max 5MB)</p>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('image')?.click()}
                      >
                        Upload Image
                      </Button>
                    </div>
                  ) : (
                    <div className="relative mt-1">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={removeImage}
                        className="absolute top-2 right-2 flex items-center gap-1"
                      >
                        <X size={12} />
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
                {/* END NEW IMAGE FIELD */}

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newItem.title}
                    onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                    placeholder="Item name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    placeholder="Describe your item..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newItem.price}
                      onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={newItem.currency} onValueChange={(value) => setNewItem({...newItem, currency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="ZAR">ZAR</SelectItem>
                        <SelectItem value="BWP">BWP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newItem.category} onValueChange={(value) => setNewItem({...newItem, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.slice(1).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newItem.location}
                    onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                    placeholder="City, Country"
                  />
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateItem} disabled={createMarketplaceItem.isPending}>
                    {createMarketplaceItem.isPending ? "Creating..." : "List Item"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </header>
  );

  const content = (
    <div className="space-y-4">
      {isMarketplaceLoading ? (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading marketplace items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="mx-4">
          <CardContent className="p-8 text-center">
            <ShoppingBag className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No items found
            </h3>
            <p className="text-gray-600">
              {searchQuery || selectedCategory !== "All" 
                ? "Try adjusting your search or category filter"
                : "Be the first to list an item in the marketplace"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 px-4">
          {filteredItems.map((item: MarketplaceItem) => (
            <Card key={item.id} className="overflow-hidden">
              {item.isSponsored && (
                <Badge className="absolute top-2 right-2 bg-yellow-500 text-white z-10">
                  Sponsored
                </Badge>
              )}
              
              <div className="relative">
                <img
                  src={item.images?.[0] || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400"}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
                <button className="absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white">
                  <Heart className="w-4 h-4" />
                </button>
              </div>
              
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">
                      {item.currency === "USD" ? "$" : item.currency === "ZAR" ? "R" : "P"}
                      {item.price.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    {item.location}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  {item.seller && (
                  <div className="flex items-center gap-2">
                    <img
                      src={item.seller.avatar}
                      alt={item.seller.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <div>
                      <div className="text-sm font-medium">{item.seller.name}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {item.seller.rating.toFixed(1)} ({item.seller.reviews})
                      </div>
                    </div>
                  </div>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {item.views}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {item.likes}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <Button className="flex-1" size="sm">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Contact
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
