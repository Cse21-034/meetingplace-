import {
  users,
  posts,
  comments,
  votes,
  bookmarks,
  notifications,
  groups,
  groupMembers,
  subscriptions,
  tips,
  marketplaceItems,
  sponsoredContent,
  wisdomTransactions,
  paymentSettings,
  userPaymentMethods,
  appConfig,
  transactions,
  type User,
  type UpsertUser,
  type InsertPost,
  type Post,
  type InsertComment,
  type Comment,
  type InsertVote,
  type Vote,
  type InsertBookmark,
  type Bookmark,
  type InsertNotification,
  type Notification,
  type InsertGroup,
  type Group,
  type InsertSubscription,
  type Subscription,
  type InsertTip,
  type Tip,
  type InsertMarketplaceItem,
  type MarketplaceItem,
  type InsertSponsoredContent,
  type SponsoredContent,
  type InsertWisdomTransaction,
  type WisdomTransaction,
  type InsertPaymentSetting,
  type PaymentSetting,
  type InsertUserPaymentMethod,
  type UserPaymentMethod,
  type InsertAppConfig,
  type AppConfig,
  type InsertTransaction,
  type Transaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, count } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getPosts(limit?: number, offset?: number): Promise<Post[]>;
  getPostById(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, updates: Partial<Post>): Promise<Post>;
  deletePost(id: number): Promise<void>;
  getCommentsByPostId(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, updates: Partial<Comment>): Promise<Comment>;
  deleteComment(id: number): Promise<void>;
  getVote(userId: string, postId?: number, commentId?: number): Promise<Vote | undefined>;
  createVote(vote: InsertVote): Promise<Vote>;
  updateVote(id: number, type: string): Promise<Vote>;
  deleteVote(id: number): Promise<void>;
  getBookmarks(userId: string): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(userId: string, postId: number): Promise<void>;
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  getGroups(): Promise<Group[]>;
  getGroupById(id: number): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  joinGroup(groupId: number, userId: string): Promise<void>;
  leaveGroup(groupId: number, userId: string): Promise<void>;
  searchPosts(query: string, limit?: number): Promise<Post[]>;
  getSubscriptions(userId: string): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription>;
  cancelSubscription(id: number): Promise<void>;
  getTips(userId: string): Promise<Tip[]>;
  createTip(tip: InsertTip): Promise<Tip>;
  updateTip(id: number, updates: Partial<Tip>): Promise<Tip>;
  getMarketplaceItems(limit?: number, offset?: number): Promise<MarketplaceItem[]>;
  getMarketplaceItemById(id: number): Promise<MarketplaceItem | undefined>;
  createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem>;
  updateMarketplaceItem(id: number, updates: Partial<MarketplaceItem>): Promise<MarketplaceItem>;
  deleteMarketplaceItem(id: number): Promise<void>;
  getSponsoredContent(limit?: number): Promise<SponsoredContent[]>;
  createSponsoredContent(content: InsertSponsoredContent): Promise<SponsoredContent>;
  updateSponsoredContent(id: number, updates: Partial<SponsoredContent>): Promise<SponsoredContent>;
  getWisdomTransactions(userId: string): Promise<WisdomTransaction[]>;
  createWisdomTransaction(transaction: InsertWisdomTransaction): Promise<WisdomTransaction>;
  updateUserWisdomPoints(userId: string, points: number): Promise<void>;
  getPaymentSettings(): Promise<PaymentSetting[]>;
  updatePaymentSetting(id: number, updates: Partial<PaymentSetting>): Promise<PaymentSetting>;
  createPaymentSetting(setting: InsertPaymentSetting): Promise<PaymentSetting>;
  getUserPaymentMethods(userId: string): Promise<UserPaymentMethod[]>;
  createUserPaymentMethod(method: InsertUserPaymentMethod): Promise<UserPaymentMethod>;
  updateUserPaymentMethod(id: number, updates: Partial<UserPaymentMethod>): Promise<UserPaymentMethod>;
  deleteUserPaymentMethod(id: number): Promise<void>;
  getAppConfig(category?: string): Promise<AppConfig[]>;
  updateAppConfig(key: string, value: string): Promise<AppConfig>;
  createAppConfig(config: InsertAppConfig): Promise<AppConfig>;
  getTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      console.log('Upserting user with data:', userData);
      
      const existingUser = await this.getUser(userData.id);
      
      if (existingUser) {
        const [updatedUser] = await db
          .update(users)
          .set({
            email: userData.email || existingUser.email,
            username: userData.username || existingUser.username,
            displayName: userData.displayName || existingUser.displayName,
            firstName: userData.firstName || existingUser.firstName,
            lastName: userData.lastName || existingUser.lastName,
            profileImageUrl: userData.profileImageUrl || existingUser.profileImageUrl,
            avatarUrl: userData.avatarUrl || existingUser.avatarUrl,
            lastActiveAt: new Date(),
            isOnline: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userData.id))
          .returning();
        
        console.log('User updated successfully:', updatedUser.id);
        return updatedUser;
      } else {
        const newUserData = {
          id: userData.id,
          email: userData.email || '',
          username: userData.username || userData.email?.split('@')[0] || userData.id,
          displayName: userData.displayName || userData.username || userData.id,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          profileImageUrl: userData.profileImageUrl || '',
          avatarUrl: userData.avatarUrl || userData.profileImageUrl || '',
          isOnline: true,
          lastActiveAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const [newUser] = await db.insert(users).values(newUserData).returning();
        console.log('New user created successfully:', newUser.id);
        return newUser;
      }
    } catch (error) {
      console.error('User upsert error:', error);
      
      const fallbackUser = await this.getUser(userData.id);
      if (fallbackUser) {
        return fallbackUser;
      }
      
      const [minimalUser] = await db.insert(users).values({
        id: userData.id,
        email: userData.email || '',
        username: userData.username || userData.id,
        displayName: userData.displayName || userData.id,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
      }).returning();
      
      return minimalUser;
    }
  }

  // Post operations - UPDATED FOR STABILITY
  async getPosts(limit = 20, offset = 0): Promise<Post[]> {
    try {
        const result = await db
          .select({
            // Post fields
            id: posts.id,
            authorId: posts.authorId,
            groupId: posts.groupId,
            type: posts.type,
            title: posts.title,
            content: posts.content,
            imageUrl: posts.imageUrl,
            linkUrl: posts.linkUrl,
            pollOptions: posts.pollOptions,
            tags: posts.tags,
            isAnonymous: posts.isAnonymous,
            allowComments: posts.allowComments,
            upvotes: posts.upvotes,
            downvotes: posts.downvotes,
            commentCount: posts.commentCount,
            createdAt: posts.createdAt,
            updatedAt: posts.updatedAt,
            // Flattened Author fields
            authorId_f: users.id, 
            authorDisplayName: users.displayName,
            authorProfileImageUrl: users.profileImageUrl,
            authorIsVerified: users.isVerified,
            authorVerificationBadge: users.verificationBadge,
            authorLocation: users.location,
            authorCreatedAt: users.createdAt,
          })
          .from(posts)
          .leftJoin(users, eq(posts.authorId, users.id))
          .orderBy(desc(posts.createdAt))
          .limit(limit)
          .offset(offset);
    
        // Manually map the flattened result into the expected nested Post structure
        return result.map(row => {
            // Only create the author object if we found an author (authorId_f exists)
            const author = row.authorId_f ? {
                id: row.authorId_f,
                displayName: row.authorDisplayName,
                profileImageUrl: row.authorProfileImageUrl,
                isVerified: row.authorIsVerified,
                verificationBadge: row.authorVerificationBadge,
                location: row.authorLocation,
                createdAt: row.authorCreatedAt,
            } : null;

            // Extract post fields and assign the constructed author object
            const { 
              authorId_f, authorDisplayName, authorProfileImageUrl, 
              authorIsVerified, authorVerificationBadge, authorLocation, authorCreatedAt, 
              ...postFields 
            } = row;

            return { ...postFields, author } as unknown as Post;
        });
    } catch (error) {
        // Log detailed error and rethrow for the API route to handle the 500 status
        console.error("Database error fetching posts:", error);
        throw new Error("Failed to fetch posts due to a database issue.");
    }
  }

  async getPostById(id: number): Promise<Post | undefined> {
    try {
      const [result] = await db
        .select({
          // Post fields
          id: posts.id,
          authorId: posts.authorId,
          groupId: posts.groupId,
          type: posts.type,
          title: posts.title,
          content: posts.content,
          imageUrl: posts.imageUrl,
          linkUrl: posts.linkUrl,
          pollOptions: posts.pollOptions,
          tags: posts.tags,
          isAnonymous: posts.isAnonymous,
          allowComments: posts.allowComments,
          upvotes: posts.upvotes,
          downvotes: posts.downvotes,
          commentCount: posts.commentCount,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          // Flattened Author fields
          authorId_f: users.id, 
          authorDisplayName: users.displayName,
          authorProfileImageUrl: users.profileImageUrl,
          authorIsVerified: users.isVerified,
          authorVerificationBadge: users.verificationBadge,
          authorLocation: users.location,
          authorCreatedAt: users.createdAt,
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(eq(posts.id, id));

      if (!result) return undefined;
      
      const author = result.authorId_f ? {
          id: result.authorId_f,
          displayName: result.authorDisplayName,
          profileImageUrl: result.authorProfileImageUrl,
          isVerified: result.authorIsVerified,
          verificationBadge: result.authorVerificationBadge,
          location: result.authorLocation,
          createdAt: result.authorCreatedAt,
      } : null;

      const { 
        authorId_f, authorDisplayName, authorProfileImageUrl, 
        authorIsVerified, authorVerificationBadge, authorLocation, authorCreatedAt, 
        ...postFields 
      } = result;

      return { ...postFields, author } as unknown as Post;
    } catch (error) {
        console.error("Database error fetching single post:", error);
        throw new Error("Failed to fetch post due to a database issue.");
    }
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async updatePost(id: number, updates: Partial<Post>): Promise<Post> {
    const [updatedPost] = await db
      .update(posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return updatedPost;
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  // Comment operations - UPDATED FOR STABILITY
  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    try {
      const result = await db
        .select({
          // Comment fields
          id: comments.id,
          postId: comments.postId,
          authorId: comments.authorId,
          parentId: comments.parentId,
          content: comments.content,
          upvotes: comments.upvotes,
          downvotes: comments.downvotes,
          createdAt: comments.createdAt,
          updatedAt: comments.updatedAt,
          // Flattened Author fields
          authorId_f: users.id,
          authorDisplayName: users.displayName,
          authorProfileImageUrl: users.profileImageUrl,
          authorIsVerified: users.isVerified,
          authorVerificationBadge: users.verificationBadge,
        })
        .from(comments)
        .leftJoin(users, eq(comments.authorId, users.id))
        .where(eq(comments.postId, postId))
        .orderBy(desc(comments.createdAt));

      // Manually map the flattened result into the expected nested Comment structure
      return result.map(row => {
          const author = row.authorId_f ? {
              id: row.authorId_f,
              displayName: row.authorDisplayName,
              profileImageUrl: row.authorProfileImageUrl,
              isVerified: row.authorIsVerified,
              verificationBadge: row.authorVerificationBadge,
          } : null;

          const { 
            authorId_f, authorDisplayName, authorProfileImageUrl, 
            authorIsVerified, authorVerificationBadge,
            ...commentFields 
          } = row;

          return { ...commentFields, author } as unknown as Comment;
      });
    } catch (error) {
        console.error("Database error fetching comments:", error);
        throw new Error("Failed to fetch comments due to a database issue.");
    }
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    
    // Update post comment count
    if (newComment.postId) {
      await db
        .update(posts)
        .set({ commentCount: sql`${posts.commentCount} + 1` })
        .where(eq(posts.id, newComment.postId));
    }
    
    return newComment;
  }

  async updateComment(id: number, updates: Partial<Comment>): Promise<Comment> {
    const [updatedComment] = await db
      .update(comments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteComment(id: number): Promise<void> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    if (comment) {
      await db.delete(comments).where(eq(comments.id, id));
      
      // Update post comment count
      if (comment.postId) {
        await db
          .update(posts)
          .set({ commentCount: sql`${posts.commentCount} - 1` })
          .where(eq(posts.id, comment.postId));
      }
    }
  }

  // Vote operations
  async getVote(userId: string, postId?: number, commentId?: number): Promise<Vote | undefined> {
    const conditions = [eq(votes.userId, userId)];
    
    if (postId) {
      conditions.push(eq(votes.postId, postId));
    }
    
    if (commentId) {
      conditions.push(eq(votes.commentId, commentId));
    }
    
    const [vote] = await db
      .select()
      .from(votes)
      .where(and(...conditions));
    
    return vote;
  }

  async createVote(vote: InsertVote): Promise<Vote> {
    const [newVote] = await db.insert(votes).values(vote).returning();
    
    // Update vote counts
    if (vote.postId) {
      const field = vote.type === "upvote" ? "upvotes" : "downvotes";
      await db
        .update(posts)
        .set({ [field]: sql`${field} + 1` })
        .where(eq(posts.id, vote.postId));
    }
    
    if (vote.commentId) {
      const field = vote.type === "upvote" ? "upvotes" : "downvotes";
      await db
        .update(comments)
        .set({ [field]: sql`${field} + 1` })
        .where(eq(comments.id, vote.commentId));
    }
    
    return newVote;
  }

  async updateVote(id: number, type: string): Promise<Vote> {
    const [vote] = await db.select().from(votes).where(eq(votes.id, id));
    
    if (vote) {
      // Update vote counts based on old and new type
      if (vote.postId) {
        const oldField = vote.type === "upvote" ? "upvotes" : "downvotes";
        const newField = type === "upvote" ? "upvotes" : "downvotes";
        
        await db
          .update(posts)
          .set({ 
            [oldField]: sql`${oldField} - 1`,
            [newField]: sql`${newField} + 1`
          })
          .where(eq(posts.id, vote.postId));
      }
      
      if (vote.commentId) {
        const oldField = vote.type === "upvote" ? "upvotes" : "downvotes";
        const newField = type === "upvote" ? "upvotes" : "downvotes";
        
        await db
          .update(comments)
          .set({ 
            [oldField]: sql`${oldField} - 1`,
            [newField]: sql`${newField} + 1`
          })
          .where(eq(comments.id, vote.commentId));
      }
    }
    
    const [updatedVote] = await db
      .update(votes)
      .set({ type })
      .where(eq(votes.id, id))
      .returning();
    
    return updatedVote;
  }

  async deleteVote(id: number): Promise<void> {
    const [vote] = await db.select().from(votes).where(eq(votes.id, id));
    
    if (vote) {
      await db.delete(votes).where(eq(votes.id, id));
      
      // Update vote counts
      if (vote.postId) {
        const field = vote.type === "upvote" ? "upvotes" : "downvotes";
        await db
          .update(posts)
          .set({ [field]: sql`${field} - 1` })
          .where(eq(posts.id, vote.postId));
      }
      
      if (vote.commentId) {
        const field = vote.type === "upvote" ? "upvotes" : "downvotes";
        await db
          .update(comments)
          .set({ [field]: sql`${field} - 1` })
          .where(eq(comments.id, vote.commentId));
      }
    }
  }

  // Bookmark operations
  async getBookmarks(userId: string): Promise<Bookmark[]> {
    return await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));
  }

  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    const [newBookmark] = await db.insert(bookmarks).values(bookmark).returning();
    return newBookmark;
  }

  async deleteBookmark(userId: string, postId: number): Promise<void> {
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)));
  }

  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  // Group operations
  async getGroups(): Promise<Group[]> {
    return await db
      .select()
      .from(groups)
      .orderBy(desc(groups.createdAt));
  }

  async getGroupById(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db.insert(groups).values(group).returning();
    return newGroup;
  }

  async joinGroup(groupId: number, userId: string): Promise<void> {
    await db.insert(groupMembers).values({ groupId, userId });
    
    // Update member count
    await db
      .update(groups)
      .set({ memberCount: sql`member_count + 1` })
      .where(eq(groups.id, groupId));
  }

  async leaveGroup(groupId: number, userId: string): Promise<void> {
    await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    
    // Update member count
    await db
      .update(groups)
      .set({ memberCount: sql`member_count - 1` })
      .where(eq(groups.id, groupId));
  }

  // Search operations
  async searchPosts(query: string, limit = 20): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(
        or(
          sql`${posts.title} ILIKE ${`%${query}%`}`,
          sql`${posts.content} ILIKE ${`%${query}%`}`
        )
      )
      .orderBy(desc(posts.createdAt))
      .limit(limit);
  }

  // Monetization operations
  async getSubscriptions(userId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    return newSubscription;
  }

  async updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription> {
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  async cancelSubscription(id: number): Promise<void> {
    await db
      .update(subscriptions)
      .set({ 
        status: 'canceled',
        canceledAt: new Date()
      })
      .where(eq(subscriptions.id, id));
  }

  // Tips operations
  async getTips(userId: string): Promise<Tip[]> {
    return await db
      .select()
      .from(tips)
      .where(or(
        eq(tips.fromUserId, userId),
        eq(tips.toUserId, userId)
      ))
      .orderBy(desc(tips.createdAt));
  }

  async createTip(tip: InsertTip): Promise<Tip> {
    const [newTip] = await db.insert(tips).values(tip).returning();
    
    // Update recipient's wisdom points and earnings
    if (tip.toUserId) {
      await db
        .update(users)
        .set({ 
          wisdomPoints: sql`${users.wisdomPoints} + ${Math.floor(tip.amount / 10)}`,
          totalEarnings: sql`${users.totalEarnings} + ${tip.amount}`
        })
        .where(eq(users.id, tip.toUserId));
    }
    
    return newTip;
  }

  async updateTip(id: number, updates: Partial<Tip>): Promise<Tip> {
    const [updatedTip] = await db
      .update(tips)
      .set(updates)
      .where(eq(tips.id, id))
      .returning();
    return updatedTip;
  }

  // Marketplace operations
  async getMarketplaceItems(limit = 20, offset = 0): Promise<MarketplaceItem[]> {
    return await db
      .select()
      .from(marketplaceItems)
      .where(eq(marketplaceItems.isActive, true))
      .orderBy(desc(marketplaceItems.featured), desc(marketplaceItems.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getMarketplaceItemById(id: number): Promise<MarketplaceItem | undefined> {
    const [item] = await db
      .select()
      .from(marketplaceItems)
      .where(eq(marketplaceItems.id, id));
    
    if (item) {
      // Update view count
      await db
        .update(marketplaceItems)
        .set({ views: sql`${marketplaceItems.views} + 1` })
        .where(eq(marketplaceItems.id, id));
    }
    
    return item;
  }

  async createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem> {
    const [newItem] = await db.insert(marketplaceItems).values(item).returning();
    return newItem;
  }

  async updateMarketplaceItem(id: number, updates: Partial<MarketplaceItem>): Promise<MarketplaceItem> {
    const [updatedItem] = await db
      .update(marketplaceItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketplaceItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteMarketplaceItem(id: number): Promise<void> {
    await db
      .update(marketplaceItems)
      .set({ isActive: false })
      .where(eq(marketplaceItems.id, id));
  }

  // Sponsored content operations
  async getSponsoredContent(limit = 10): Promise<SponsoredContent[]> {
    return await db
      .select()
      .from(sponsoredContent)
      .where(and(
        eq(sponsoredContent.isActive, true),
        sql`${sponsoredContent.endDate} > NOW()`
      ))
      .orderBy(desc(sponsoredContent.createdAt))
      .limit(limit);
  }

  async createSponsoredContent(content: InsertSponsoredContent): Promise<SponsoredContent> {
    const [newContent] = await db.insert(sponsoredContent).values(content).returning();
    return newContent;
  }

  async updateSponsoredContent(id: number, updates: Partial<SponsoredContent>): Promise<SponsoredContent> {
    const [updatedContent] = await db
      .update(sponsoredContent)
      .set(updates)
      .where(eq(sponsoredContent.id, id))
      .returning();
    return updatedContent;
  }

  // Wisdom transactions
  async getWisdomTransactions(userId: string): Promise<WisdomTransaction[]> {
    return await db
      .select()
      .from(wisdomTransactions)
      .where(eq(wisdomTransactions.userId, userId))
      .orderBy(desc(wisdomTransactions.createdAt));
  }

  async createWisdomTransaction(transaction: InsertWisdomTransaction): Promise<WisdomTransaction> {
    const [newTransaction] = await db.insert(wisdomTransactions).values(transaction).returning();
    
    // Update user's wisdom points
    if (transaction.userId) {
      await db
        .update(users)
        .set({ wisdomPoints: sql`${users.wisdomPoints} + ${transaction.amount}` })
        .where(eq(users.id, transaction.userId));
    }
    
    return newTransaction;
  }

  async updateUserWisdomPoints(userId: string, points: number): Promise<void> {
    await db
      .update(users)
      .set({ wisdomPoints: sql`${users.wisdomPoints} + ${points}` })
      .where(eq(users.id, userId));
  }

  // Payment settings
  async getPaymentSettings(): Promise<PaymentSetting[]> {
    return await db
      .select()
      .from(paymentSettings)
      .where(eq(paymentSettings.isActive, true))
      .orderBy(paymentSettings.method);
  }

  async updatePaymentSetting(id: number, updates: Partial<PaymentSetting>): Promise<PaymentSetting> {
    const [updatedSetting] = await db
      .update(paymentSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(paymentSettings.id, id))
      .returning();
    return updatedSetting;
  }

  async createPaymentSetting(setting: InsertPaymentSetting): Promise<PaymentSetting> {
    const [newSetting] = await db.insert(paymentSettings).values(setting).returning();
    return newSetting;
  }

  // User payment methods
  async getUserPaymentMethods(userId: string): Promise<UserPaymentMethod[]> {
    return await db
      .select()
      .from(userPaymentMethods)
      .where(eq(userPaymentMethods.userId, userId))
      .orderBy(desc(userPaymentMethods.isDefault), userPaymentMethods.method);
  }

  async createUserPaymentMethod(method: InsertUserPaymentMethod): Promise<UserPaymentMethod> {
    const [newMethod] = await db.insert(userPaymentMethods).values(method).returning();
    return newMethod;
  }

  async updateUserPaymentMethod(id: number, updates: Partial<UserPaymentMethod>): Promise<UserPaymentMethod> {
    const [updatedMethod] = await db
      .update(userPaymentMethods)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userPaymentMethods.id, id))
      .returning();
    return updatedMethod;
  }

  async deleteUserPaymentMethod(id: number): Promise<void> {
    await db.delete(userPaymentMethods).where(eq(userPaymentMethods.id, id));
  }

  // App configuration
  async getAppConfig(category?: string): Promise<AppConfig[]> {
    const query = db.select().from(appConfig);
    
    if (category) {
      return await query.where(eq(appConfig.category, category));
    }
    
    return await query.orderBy(appConfig.category, appConfig.key);
  }

  async updateAppConfig(key: string, value: string): Promise<AppConfig> {
    const [updatedConfig] = await db
      .update(appConfig)
      .set({ value, updatedAt: new Date() })
      .where(eq(appConfig.key, key))
      .returning();
    return updatedConfig;
  }

  async createAppConfig(config: InsertAppConfig): Promise<AppConfig> {
    const [newConfig] = await db.insert(appConfig).values(config).returning();
    return newConfig;
  }

  // Transactions
  async getTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }
}

export const storage = new DatabaseStorage();
