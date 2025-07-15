import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  location: varchar("location"),
  reputation: integer("reputation").default(0),
  isVerified: boolean("is_verified").default(false),
  verificationBadge: varchar("verification_badge"), // "elder", "mentor", "expert"
  // Premium monetization features
  subscriptionTier: varchar("subscription_tier").default("free"), // "free", "elder", "tribe_leader", "community_builder"
  subscriptionExpiry: timestamp("subscription_expiry"),
  wisdomPoints: integer("wisdom_points").default(0),
  totalEarnings: integer("total_earnings").default(0), // In cents
  // Payment integration
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  // Community stats
  totalPosts: integer("total_posts").default(0),
  totalComments: integer("total_comments").default(0),
  helpfulVotes: integer("helpful_votes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Groups/Tribes table
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isPrivate: boolean("is_private").default(false),
  location: varchar("location"),
  category: varchar("category"), // "location", "interest", "cultural"
  memberCount: integer("member_count").default(0),
  creatorId: varchar("creator_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group memberships
export const groupMembers = pgTable("group_members", {
  groupId: integer("group_id").references(() => groups.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role").default("member"), // "admin", "moderator", "member"
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.groupId, table.userId] }),
}));

// Posts table
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id").references(() => users.id),
  groupId: integer("group_id").references(() => groups.id),
  type: varchar("type").notNull(), // "text", "image", "poll", "question", "link"
  title: varchar("title", { length: 200 }),
  content: text("content").notNull(),
  imageUrl: varchar("image_url"),
  linkUrl: varchar("link_url"),
  pollOptions: jsonb("poll_options"), // Array of poll options with vote counts
  tags: jsonb("tags"), // Array of tag strings
  isAnonymous: boolean("is_anonymous").default(false),
  allowComments: boolean("allow_comments").default(true),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  commentCount: integer("comment_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id),
  authorId: varchar("author_id").references(() => users.id),
  parentId: integer("parent_id"),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Votes table
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  postId: integer("post_id").references(() => posts.id),
  commentId: integer("comment_id").references(() => comments.id),
  type: varchar("type").notNull(), // "upvote", "downvote"
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookmarks table
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  postId: integer("post_id").references(() => posts.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userPostUnique: index("user_post_unique").on(table.userId, table.postId),
}));

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type").notNull(), // "comment", "vote", "mention", "follow", "tip", "subscription"
  title: varchar("title", { length: 200 }),
  content: text("content"),
  relatedPostId: integer("related_post_id").references(() => posts.id),
  relatedCommentId: integer("related_comment_id").references(() => comments.id),
  relatedUserId: varchar("related_user_id").references(() => users.id),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Premium subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  plan: varchar("plan").notNull(), // "elder", "tribe_leader", "community_builder"
  status: varchar("status").notNull(), // "active", "canceled", "expired"
  priceId: varchar("price_id"),
  amount: integer("amount"), // In cents
  currency: varchar("currency").default("USD"),
  billingPeriod: varchar("billing_period").default("monthly"), // "monthly", "yearly"
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tips system table
export const tips = pgTable("tips", {
  id: serial("id").primaryKey(),
  fromUserId: varchar("from_user_id").references(() => users.id),
  toUserId: varchar("to_user_id").references(() => users.id),
  postId: integer("post_id").references(() => posts.id),
  commentId: integer("comment_id").references(() => comments.id),
  amount: integer("amount").notNull(), // In cents
  currency: varchar("currency").default("USD"),
  paymentMethod: varchar("payment_method").default("stripe"), // "stripe", "orange_money", "skrill", "myzaka", "smega", "atm_card"
  paymentReference: varchar("payment_reference"),
  message: text("message"),
  status: varchar("status").default("completed"), // "pending", "completed", "failed"
  createdAt: timestamp("created_at").defaultNow(),
});

// Marketplace items table
export const marketplaceItems = pgTable("marketplace_items", {
  id: serial("id").primaryKey(),
  sellerId: varchar("seller_id").references(() => users.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  price: integer("price").notNull(), // In cents
  currency: varchar("currency").default("USD"),
  category: varchar("category"), // "crafts", "food", "services", "digital", "education"
  images: jsonb("images"), // Array of image URLs
  location: varchar("location"),
  isActive: boolean("is_active").default(true),
  featured: boolean("featured").default(false),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sponsored content table
export const sponsoredContent = pgTable("sponsored_content", {
  id: serial("id").primaryKey(),
  sponsorId: varchar("sponsor_id").references(() => users.id),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content"),
  imageUrl: varchar("image_url"),
  linkUrl: varchar("link_url"),
  category: varchar("category"), // "business", "event", "job", "education"
  budget: integer("budget"), // In cents
  spent: integer("spent").default(0),
  targetGroup: varchar("target_group"),
  location: varchar("location"),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Wisdom points transactions table
export const wisdomTransactions = pgTable("wisdom_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type").notNull(), // "earned", "spent", "bonus"
  amount: integer("amount").notNull(),
  source: varchar("source"), // "helpful_vote", "post_engagement", "survey", "reward"
  description: text("description"),
  relatedPostId: integer("related_post_id").references(() => posts.id),
  relatedCommentId: integer("related_comment_id").references(() => comments.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment settings table
export const paymentSettings = pgTable("payment_settings", {
  id: serial("id").primaryKey(),
  method: varchar("method").notNull(), // "stripe", "orange_money", "skrill", "myzaka", "smega", "atm_card"
  isEnabled: boolean("is_enabled").default(false),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  configuration: jsonb("configuration"), // Store API keys, merchant IDs, etc.
  fees: jsonb("fees"), // Fee structure for each method
  supportedCurrencies: jsonb("supported_currencies"), // Array of currency codes
  minAmount: integer("min_amount").default(100), // Minimum transaction amount in cents
  maxAmount: integer("max_amount").default(100000), // Maximum transaction amount in cents
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User payment methods table
export const userPaymentMethods = pgTable("user_payment_methods", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  method: varchar("method").notNull(), // "stripe", "orange_money", "skrill", "myzaka", "smega", "atm_card"
  accountDetails: jsonb("account_details"), // Phone number, account ID, etc.
  isDefault: boolean("is_default").default(false),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// App configuration table
export const appConfig = pgTable("app_config", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  value: text("value"),
  type: varchar("type").default("string"), // "string", "number", "boolean", "json"
  description: text("description"),
  category: varchar("category").default("general"), // "payment", "features", "ui", "monetization"
  isPublic: boolean("is_public").default(false), // Whether this setting can be viewed publicly
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transactions table for all payment methods
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type").notNull(), // "subscription", "tip", "marketplace", "sponsored_content"
  amount: integer("amount").notNull(),
  currency: varchar("currency").default("USD"),
  paymentMethod: varchar("payment_method").notNull(),
  paymentReference: varchar("payment_reference"),
  status: varchar("status").default("pending"), // "pending", "completed", "failed", "refunded"
  relatedId: integer("related_id"), // ID of subscription, tip, marketplace item, etc.
  metadata: jsonb("metadata"), // Additional transaction data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  votes: many(votes),
  bookmarks: many(bookmarks),
  notifications: many(notifications),
  groupMemberships: many(groupMembers),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [posts.groupId],
    references: [groups.id],
  }),
  comments: many(comments),
  votes: many(votes),
  bookmarks: many(bookmarks),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments),
  votes: many(votes),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, {
    fields: [groups.creatorId],
    references: [users.id],
  }),
  members: many(groupMembers),
  posts: many(posts),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  upvotes: true,
  downvotes: true,
  commentCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  upvotes: true,
  downvotes: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  memberCount: true,
  createdAt: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Monetization insert schemas
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertTipSchema = createInsertSchema(tips).omit({
  id: true,
  createdAt: true,
});

export const insertMarketplaceItemSchema = createInsertSchema(marketplaceItems).omit({
  id: true,
  views: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSponsoredContentSchema = createInsertSchema(sponsoredContent).omit({
  id: true,
  spent: true,
  createdAt: true,
});

export const insertWisdomTransactionSchema = createInsertSchema(wisdomTransactions).omit({
  id: true,
  createdAt: true,
});

// Payment system insert schemas
export const insertPaymentSettingSchema = createInsertSchema(paymentSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserPaymentMethodSchema = createInsertSchema(userPaymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppConfigSchema = createInsertSchema(appConfig).omit({
  id: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Monetization types
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertTip = z.infer<typeof insertTipSchema>;
export type Tip = typeof tips.$inferSelect;
export type InsertMarketplaceItem = z.infer<typeof insertMarketplaceItemSchema>;
export type MarketplaceItem = typeof marketplaceItems.$inferSelect;
export type InsertSponsoredContent = z.infer<typeof insertSponsoredContentSchema>;
export type SponsoredContent = typeof sponsoredContent.$inferSelect;
export type InsertWisdomTransaction = z.infer<typeof insertWisdomTransactionSchema>;
export type WisdomTransaction = typeof wisdomTransactions.$inferSelect;

// Payment system types
export type InsertPaymentSetting = z.infer<typeof insertPaymentSettingSchema>;
export type PaymentSetting = typeof paymentSettings.$inferSelect;
export type InsertUserPaymentMethod = z.infer<typeof insertUserPaymentMethodSchema>;
export type UserPaymentMethod = typeof userPaymentMethods.$inferSelect;
export type InsertAppConfig = z.infer<typeof insertAppConfigSchema>;
export type AppConfig = typeof appConfig.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
