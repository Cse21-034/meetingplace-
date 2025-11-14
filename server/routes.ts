import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupFirebaseAuth, verifyFirebaseToken } from "./firebaseAuth";
import { insertPostSchema, insertCommentSchema, insertVoteSchema, insertBookmarkSchema, type MarketplaceItem } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// Utility function to enrich Marketplace Item data with Seller info
async function enrichMarketplaceItem(item: MarketplaceItem): Promise<any> {
  const seller = item.sellerId ? await storage.getUser(item.sellerId) : null;
  
  return {
    ...item,
    // Price from cents back to major currency unit
    price: item.price / 100, 
    images: item.images || [],
    seller: seller ? {
      id: seller.id,
      name: seller.displayName || seller.firstName || 'Anonymous Seller',
      // Robust avatar fallback logic
      avatar: seller.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.firstName || "User")}&size=40`,
      // Mocked logic for rating/reviews using existing user data
      rating: parseFloat((Math.min(5, 4.0 + (seller.reputation || 0) / 100)).toFixed(1)) || 4.5, 
      reviews: (seller.totalPosts || 0) + (seller.totalComments || 0) + 10, // Mocked logic
    } : {
      id: 'anonymous',
      name: 'Anonymous Seller',
      avatar: 'https://ui-avatars.com/api/?name=Anonymous+Seller&size=40',
      rating: 0,
      reviews: 0
    },
    currency: item.currency || "USD",
    isSponsored: item.featured || false,
    views: item.views || 0,
    likes: 0, 
    createdAt: item.createdAt || new Date(),
  };
}


export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for monitoring and deployment platforms
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Setup Firebase authentication only
  setupFirebaseAuth(app);
  
  // Simple image upload endpoint using base64 (NO MULTER)
  app.post('/api/upload', verifyFirebaseToken, async (req: any, res) => {
    try {
      const { imageData, fileName } = req.body;

      if (!imageData) {
        return res.status(400).json({ message: 'No image data provided' });
      }

      // Validate that it's a base64 image
      if (!imageData.startsWith('data:image/')) {
        return res.status(400).json({ message: 'Invalid image format' });
      }

      // Return the base64 data as the imageUrl
      const imageUrl = imageData;

      res.json({ 
        success: true, 
        imageUrl,
        message: 'Image uploaded successfully'
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // Enhanced post creation with image support
  app.post('/api/posts-with-image', verifyFirebaseToken, async (req: any, res) => {
    try {
      if (!req.firebaseUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const userId = req.firebaseUser.uid;
      
      const { type, content, title, tags, isAnonymous, allowComments, pollOptions, imageData } = req.body;

      // Validate required fields
      if (!content || !content.trim()) {
        return res.status(400).json({ message: 'Content is required' });
      }

      // For image posts, validate image data
      if (type === 'image' && (!imageData || !imageData.startsWith('data:image/'))) {
        return res.status(400).json({ message: 'Valid image is required for image posts' });
      }

      // Prepare post data
      const postData: any = {
        type,
        content: content.trim(),
        authorId: userId,
        isAnonymous: isAnonymous || false,
        allowComments: allowComments !== false,
      };

      if (title && title.trim()) {
        postData.title = title.trim();
      }

      if (tags && Array.isArray(tags)) {
        postData.tags = tags;
      }

      if (type === 'poll' && Array.isArray(pollOptions)) {
        const validOptions = pollOptions.filter(opt => opt && opt.text && opt.text.trim());
        if (validOptions.length < 2) {
          return res.status(400).json({ message: 'At least 2 poll options are required' });
        }
        postData.pollOptions = validOptions;
      }

      // Add image URL if provided
      if (imageData && imageData.startsWith('data:image/')) {
        postData.imageUrl = imageData;
      }

      // Validate with schema
      const validation = insertPostSchema.safeParse(postData);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid post data",
          errors: fromZodError(validation.error).toString()
        });
      }

      const post = await storage.createPost(validation.data);
      
      // Fetch author data for response
      const author = await storage.getUser(userId);
      const postWithAuthor = {
        ...post,
        author: author ? {
          id: author.id,
          displayName: author.displayName || author.firstName || 'Anonymous',
          profileImageUrl: author.profileImageUrl,
          isVerified: author.isVerified,
          verificationBadge: author.verificationBadge,
          location: author.location
        } : null
      };
      
      res.json(postWithAuthor);
    } catch (error) {
      console.error("Error creating post with image:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });
  
  // Seed database with sample data in development
  if (process.env.NODE_ENV === 'development') {
    const { seedDatabase } = await import('./seedData');
    await seedDatabase();
  }

  // Search endpoint
  app.get('/api/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length === 0) {
        return res.json([]);
      }
      
      const results = await storage.searchPosts(query.trim());
      res.json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Posts with authors endpoint
  app.get('/api/posts-with-authors', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const posts = await storage.getPosts(limit, offset);
      
      // Fetch author data for each post
      const postsWithAuthors = await Promise.all(
        posts.map(async (post) => {
          const author = post.authorId ? await storage.getUser(post.authorId) : null;
          return {
            ...post,
            author: author ? {
              id: author.id,
              displayName: author.displayName || author.firstName || 'Anonymous',
              profileImageUrl: author.profileImageUrl,
              isVerified: author.isVerified,
              verificationBadge: author.verificationBadge,
              location: author.location
            } : null
          };
        })
      );
      
      res.json(postsWithAuthors);
    } catch (error) {
      console.error("Error fetching posts with authors:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Post routes - UPDATED to include author data
  app.get('/api/posts', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const posts = await storage.getPosts(limit, offset);
      
      // Fetch author data for each post
      const postsWithAuthors = await Promise.all(
        posts.map(async (post) => {
          const author = post.authorId ? await storage.getUser(post.authorId) : null;
          return {
            ...post,
            author: author ? {
              id: author.id,
              displayName: author.displayName || author.firstName || 'Anonymous',
              profileImageUrl: author.profileImageUrl,
              isVerified: author.isVerified,
              verificationBadge: author.verificationBadge,
              location: author.location
            } : null
          };
        })
      );
      
      res.json(postsWithAuthors);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get('/api/posts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getPostById(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Fetch author data
      const author = post.authorId ? await storage.getUser(post.authorId) : null;
      const postWithAuthor = {
        ...post,
        author: author ? {
          id: author.id,
          displayName: author.displayName || author.firstName || 'Anonymous',
          profileImageUrl: author.profileImageUrl,
          isVerified: author.isVerified,
          verificationBadge: author.verificationBadge,
          location: author.location
        } : null
      };
      
      res.json(postWithAuthor);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post('/api/posts', verifyFirebaseToken, async (req: any, res) => {
    try {
      if (!req.firebaseUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const userId = req.firebaseUser.uid;
      const validation = insertPostSchema.safeParse({ ...req.body, authorId: userId });
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid post data",
          errors: fromZodError(validation.error).toString()
        });
      }

      const post = await storage.createPost(validation.data);
      
      // Fetch author data for response
      const author = await storage.getUser(userId);
      const postWithAuthor = {
        ...post,
        author: author ? {
          id: author.id,
          displayName: author.displayName || author.firstName || 'Anonymous',
          profileImageUrl: author.profileImageUrl,
          isVerified: author.isVerified,
          verificationBadge: author.verificationBadge,
          location: author.location
        } : null
      };
      
      res.json(postWithAuthor);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.put('/api/posts/:id', verifyFirebaseToken, async (req: any, res) => {
    try {
      if (!req.firebaseUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const id = parseInt(req.params.id);
      const userId = req.firebaseUser.uid;
      
      const existingPost = await storage.getPostById(id);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (existingPost.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this post" });
      }

      const post = await storage.updatePost(id, req.body);
      
      // Fetch author data for response
      const author = await storage.getUser(userId);
      const postWithAuthor = {
        ...post,
        author: author ? {
          id: author.id,
          displayName: author.displayName || author.firstName || 'Anonymous',
          profileImageUrl: author.profileImageUrl,
          isVerified: author.isVerified,
          verificationBadge: author.verificationBadge,
          location: author.location
        } : null
      };
      
      res.json(postWithAuthor);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.delete('/api/posts/:id', verifyFirebaseToken, async (req: any, res) => {
    try {
      if (!req.firebaseUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const id = parseInt(req.params.id);
      const userId = req.firebaseUser.uid;
      
      const existingPost = await storage.getPostById(id);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (existingPost.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this post" });
      }

      await storage.deletePost(id);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Comment routes - UPDATED to include author data
  app.get('/api/posts/:id/comments', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const comments = await storage.getCommentsByPostId(postId);
      
      // Fetch author data for each comment
      const commentsWithAuthors = await Promise.all(
        comments.map(async (comment) => {
          const author = comment.authorId ? await storage.getUser(comment.authorId) : null;
          return {
            ...comment,
            author: author ? {
              id: author.id,
              displayName: author.displayName || author.firstName || 'Anonymous',
              profileImageUrl: author.profileImageUrl,
              isVerified: author.isVerified,
              verificationBadge: author.verificationBadge
            } : null
          };
        })
      );
      
      res.json(commentsWithAuthors);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/posts/:id/comments', verifyFirebaseToken, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (!req.firebaseUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const userId = req.firebaseUser.uid;
      
      const validation = insertCommentSchema.safeParse({ 
        ...req.body, 
        postId,
        authorId: userId 
      });
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid comment data",
          errors: fromZodError(validation.error).toString()
        });
      }

      const comment = await storage.createComment(validation.data);
      
      // Fetch author data for response
      const author = await storage.getUser(userId);
      const commentWithAuthor = {
        ...comment,
        author: author ? {
          id: author.id,
          displayName: author.displayName || author.firstName || 'Anonymous',
          profileImageUrl: author.profileImageUrl,
          isVerified: author.isVerified,
          verificationBadge: author.verificationBadge
        } : null
      };
      
      res.json(commentWithAuthor);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Vote routes
  app.post('/api/votes', verifyFirebaseToken, async (req: any, res) => {
    try {
      if (!req.firebaseUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const userId = req.firebaseUser.uid;
      const { postId, commentId, type } = req.body;

      // Check if vote already exists
      const existingVote = await storage.getVote(userId, postId, commentId);
      
      if (existingVote) {
        if (existingVote.type === type) {
          // Remove vote if same type
          await storage.deleteVote(existingVote.id);
          return res.json({ message: "Vote removed" });
        } else {
          // Update vote if different type
          const updatedVote = await storage.updateVote(existingVote.id, type);
          return res.json(updatedVote);
        }
      }

      const validation = insertVoteSchema.safeParse({ 
        userId, 
        postId, 
        commentId, 
        type 
      });
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid vote data",
          errors: fromZodError(validation.error).toString()
        });
      }

      const vote = await storage.createVote(validation.data);
      res.json(vote);
    } catch (error) {
      console.error("Error creating vote:", error);
      res.status(500).json({ message: "Failed to create vote" });
    }
  });

  // Bookmark routes
  app.get('/api/bookmarks', verifyFirebaseToken, async (req: any, res) => {
    try {
      if (!req.firebaseUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const userId = req.firebaseUser.uid;
      const bookmarks = await storage.getBookmarks(userId);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  app.post('/api/bookmarks', verifyFirebaseToken, async (req: any, res) => {
    try {
      if (!req.firebaseUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const userId = req.firebaseUser.uid;
      const { postId } = req.body;

      const bookmark = await storage.createBookmark({ userId, postId });
      res.json(bookmark);
    } catch (error) {
      console.error("Error creating bookmark:", error);
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  app.delete('/api/bookmarks/:postId', verifyFirebaseToken, async (req: any, res) => {
    try {
      if (!req.firebaseUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const userId = req.firebaseUser.uid;
      const postId = parseInt(req.params.postId);

      await storage.deleteBookmark(userId, postId);
      res.json({ message: "Bookmark removed successfully" });
    } catch (error) {
      console.error("Error removing bookmark:", error);
      res.status(500).json({ message: "Failed to remove bookmark" });
    }
  });

  // Notification routes
  app.get('/api/notifications', verifyFirebaseToken, async (req: any, res) => {
    try {
      if (!req.firebaseUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const userId = req.firebaseUser.uid;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put('/api/notifications/:id/read', verifyFirebaseToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificationAsRead(id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Group routes
  app.get('/api/groups', async (req, res) => {
    try {
      const groups = await storage.getGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.post('/api/groups/:id/join', verifyFirebaseToken, async (req: any, res) => {
    try {
      const groupId = parseInt(req.params.id);
      if (!req.firebaseUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const userId = req.firebaseUser.uid;

      await storage.joinGroup(groupId, userId);
      res.json({ message: "Successfully joined group" });
    } catch (error) {
      console.error("Error joining group:", error);
      res.status(500).json({ message: "Failed to join group" });
    }
  });

  app.post('/api/groups/:id/leave', verifyFirebaseToken, async (req: any, res) => {
    try {
      const groupId = parseInt(req.params.id);
      if (!req.firebaseUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const userId = req.firebaseUser.uid;

      await storage.leaveGroup(groupId, userId);
      res.json({ message: "Successfully left group" });
    } catch (error) {
      console.error("Error leaving group:", error);
      res.status(500).json({ message: "Failed to leave group" });
    }
  });

  // Payment settings routes
  app.get('/api/payment-settings', async (req, res) => {
    try {
      const settings = await storage.getPaymentSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      res.status(500).json({ message: 'Failed to fetch payment settings' });
    }
  });

  app.post('/api/payment-settings', async (req, res) => {
    try {
      const newSetting = await storage.createPaymentSetting(req.body);
      res.json(newSetting);
    } catch (error) {
      console.error('Error creating payment setting:', error);
      res.status(500).json({ message: 'Failed to create payment setting' });
    }
  });

  app.put('/api/payment-settings/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedSetting = await storage.updatePaymentSetting(id, req.body);
      res.json(updatedSetting);
    } catch (error) {
      console.error('Error updating payment setting:', error);
      res.status(500).json({ message: 'Failed to update payment setting' });
    }
  });

  // App configuration routes
  app.get('/api/app-config', async (req, res) => {
    try {
      const category = req.query.category as string;
      const config = await storage.getAppConfig(category);
      res.json(config);
    } catch (error) {
      console.error('Error fetching app config:', error);
      res.status(500).json({ message: 'Failed to fetch app config' });
    }
  });

  app.put('/api/app-config/:key', async (req, res) => {
    try {
      const key = req.params.key;
      const { value } = req.body;
      const updatedConfig = await storage.updateAppConfig(key, value);
      res.json(updatedConfig);
    } catch (error) {
      console.error('Error updating app config:', error);
      res.status(500).json({ message: 'Failed to update app config' });
    }
  });

  // Subscription routes
  app.get('/api/subscriptions', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      const subscriptions = await storage.getSubscriptions(userId);
      res.json(subscriptions);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      res.status(500).json({ message: 'Failed to fetch subscriptions' });
    }
  });

  app.post('/api/subscriptions', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      const subscription = await storage.createSubscription({
        ...req.body,
        userId
      });
      res.json(subscription);
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ message: 'Failed to create subscription' });
    }
  });

  // Tips routes
  app.get('/api/tips', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      const tips = await storage.getTips(userId);
      res.json(tips);
    } catch (error) {
      console.error('Error fetching tips:', error);
      res.status(500).json({ message: 'Failed to fetch tips' });
    }
  });

  app.post('/api/tips', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      const { toUserId, postId, commentId, amount, currency, paymentMethod, message } = req.body;

      // Validate required fields
      if (!toUserId || !amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid tip data' });
      }

      // Create tip record
      const tip = await storage.createTip({
        fromUserId: userId,
        toUserId,
        postId: postId || null,
        commentId: commentId || null,
        amount,
        currency: currency || 'USD',
        paymentMethod: paymentMethod || 'stripe',
        message: message || null,
        status: 'pending'
      });

      // Create transaction record
      await storage.createTransaction({
        userId,
        type: 'tip_sent',
        amount: -amount,
        currency: currency || 'USD',
        description: `Tip sent to user ${toUserId}`,
        relatedId: tip.id.toString(),
        paymentMethod: paymentMethod || 'stripe',
        status: 'completed'
      });

      // Create transaction for recipient
      await storage.createTransaction({
        userId: toUserId,
        type: 'tip_received',
        amount,
        currency: currency || 'USD',
        description: `Tip received from user ${userId}`,
        relatedId: tip.id.toString(),
        paymentMethod: paymentMethod || 'stripe',
        status: 'completed'
      });

      // Award wisdom points to recipient
      const wisdomPoints = Math.floor(amount / 100 * 10); // 10 points per dollar
      await storage.createWisdomTransaction({
        userId: toUserId,
        type: 'tip_received',
        points: wisdomPoints,
        description: `Wisdom points from tip received`,
        relatedId: tip.id.toString()
      });

      await storage.updateUserWisdomPoints(toUserId, wisdomPoints);

      res.json({ ...tip, wisdomPointsAwarded: wisdomPoints });
    } catch (error) {
      console.error('Error creating tip:', error);
      res.status(500).json({ message: 'Failed to create tip' });
    }
  });

  // Marketplace routes - MODIFIED to fetch real data with seller info and filters
  app.get('/api/marketplace', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const query = req.query.q as string;
      const category = req.query.category as string;
      
      const rawItems = await storage.getMarketplaceItems(limit, offset, query, category);
      
      const itemsWithSellers = await Promise.all(rawItems.map(enrichMarketplaceItem));

      res.json(itemsWithSellers);
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
      res.status(500).json({ message: 'Failed to fetch marketplace items' });
    }
  });

  // Marketplace create endpoint - MODIFIED to handle image payload and return enriched data
  app.post('/api/marketplace', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      const { images, ...rest } = req.body;
      
      const itemData: any = {
        ...rest,
        sellerId: userId,
        // Ensure images is saved as a JSON array of strings (base64 or URL)
        images: Array.isArray(images) ? images : (images ? [images] : []), 
        price: rest.price, // price is already converted to cents in the client/route logic
      }

      // Basic validation for images if the array is not empty
      if (itemData.images.length > 0 && !itemData.images[0].startsWith('data:image/')) {
        return res.status(400).json({ message: 'Invalid image data provided. Must be Base64.' });
      }
      
      const item = await storage.createMarketplaceItem(itemData);
      
      // Return the enriched item to match the GET request format
      const enrichedItem = await enrichMarketplaceItem(item);
      
      res.json(enrichedItem);
    } catch (error) {
      console.error('Error creating marketplace item:', error);
      res.status(500).json({ message: 'Failed to create marketplace item' });
    }
  });


  // Transactions routes
  app.get('/api/transactions', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });

  app.post('/api/transactions', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      const transaction = await storage.createTransaction({
        ...req.body,
        userId
      });
      res.json(transaction);
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ message: 'Failed to create transaction' });
    }
  });

  // Subscriptions routes
  app.get('/api/subscriptions', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      const subscriptions = await storage.getSubscriptions(userId);
      res.json(subscriptions);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      res.status(500).json({ message: 'Failed to fetch subscriptions' });
    }
  });

  app.post('/api/subscriptions', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      const { plan, currency, amount, paymentMethod, billing } = req.body;

      // Validate required fields
      if (!plan || !amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid subscription data' });
      }

      // Create subscription record
      const subscription = await storage.createSubscription({
        userId,
        plan,
        status: 'active',
        billing: billing || 'monthly',
        amount,
        currency: currency || 'USD',
        paymentMethod: paymentMethod || 'stripe',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        cancelAtPeriodEnd: false
      });

      // Create transaction record
      await storage.createTransaction({
        userId,
        type: 'subscription_payment',
        amount: -amount,
        currency: currency || 'USD',
        description: `${plan} subscription payment`,
        relatedId: subscription.id.toString(),
        paymentMethod: paymentMethod || 'stripe',
        status: 'completed'
      });

      // Award wisdom points for subscription
      const wisdomPoints = Math.floor(amount / 100 * 50); // 50 points per dollar for subscriptions
      await storage.createWisdomTransaction({
        userId,
        type: 'subscription_reward',
        points: wisdomPoints,
        description: `Wisdom points from ${plan} subscription`,
        relatedId: subscription.id.toString()
      });

      await storage.updateUserWisdomPoints(userId, wisdomPoints);

      res.json({ ...subscription, wisdomPointsAwarded: wisdomPoints });
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ message: 'Failed to create subscription' });
    }
  });

  app.put('/api/subscriptions/:id/cancel', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      const subscriptionId = parseInt(req.params.id);
      
      const subscription = await storage.updateSubscription(subscriptionId, {
        cancelAtPeriodEnd: true,
        status: 'cancelled'
      });

      res.json(subscription);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({ message: 'Failed to cancel subscription' });
    }
  });

  // Wisdom points routes
  app.get('/api/wisdom-transactions', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      const transactions = await storage.getWisdomTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching wisdom transactions:', error);
      res.status(500).json({ message: 'Failed to fetch wisdom transactions' });
    }
  });

  app.post('/api/wisdom-transactions', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      const transaction = await storage.createWisdomTransaction({
        ...req.body,
        userId
      });
      res.json(transaction);
    } catch (error) {
      console.error('Error creating wisdom transaction:', error);
      res.status(500).json({ message: 'Failed to create wisdom transaction' });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'subscribe':
            // Subscribe to specific channels (posts, comments, etc.)
            break;
          case 'unsubscribe':
            // Unsubscribe from channels
            break;
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Broadcast function for real-time updates
  const broadcast = (message: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  };

  // Add broadcast to app for use in routes
  (app as any).broadcast = broadcast;

  return httpServer;
}
