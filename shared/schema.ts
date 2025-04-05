import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User-related tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  profileImage: text("profile_image"),
  city: text("city"),
  favoriteArtists: text("favorite_artists"),
  socialMedia: jsonb("social_media").notNull().default({}),
  role: text("role").notNull().default("user"), // Can be 'user', 'artist', or 'admin'
  artistId: integer("artist_id").references(() => artists.id), // Only for artist users
  subscriptionTier: text("subscription_tier").notNull().default("free"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  firebaseUid: text("firebase_uid").unique(), // Firebase user ID for Firebase Auth integration
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  userId: integer("user_id").references(() => users.id).primaryKey(),
  language: text("language").notNull().default("en"),
  theme: text("theme").notNull().default("dark"),
  audioQuality: text("audio_quality").notNull().default("standard"),
  autoplay: boolean("autoplay").notNull().default(true),
  notifications: jsonb("notifications").notNull().default({}),
});

// Music-related tables
export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  image: text("image").notNull(),
  bio: text("bio").notNull(),
  genres: text("genres").array().notNull(),
  socialLinks: jsonb("social_links").notNull().default({}),
  verified: boolean("verified").notNull().default(false),
  youtubeChannelId: text("youtube_channel_id"),
  twitterUsername: text("twitter_username"),
  instagramUsername: text("instagram_username"),
  monthlyListeners: integer("monthly_listeners").default(0),
});

export const albums = pgTable("albums", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artistId: integer("artist_id").references(() => artists.id).notNull(),
  artistName: text("artist_name").notNull(),
  coverImage: text("cover_image").notNull(),
  releaseDate: timestamp("release_date").notNull(),
  genres: text("genres").array().notNull(),
  type: text("type"), // 'album', 'single', 'ep', etc.
});

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artistId: integer("artist_id").references(() => artists.id).notNull(),
  artistName: text("artist_name").notNull(),
  albumId: integer("album_id").references(() => albums.id).notNull(),
  albumTitle: text("album_title").notNull(),
  duration: integer("duration").notNull(), // in seconds
  audioUrl: text("audio_url").notNull(),
  purchasePrice: integer("purchase_price"), // null/undefined if streaming only
  purchaseAvailable: boolean("purchase_available").notNull().default(false),
  explicit: boolean("explicit").notNull().default(false),
  trackNumber: integer("track_number").notNull(),
  featuring: integer("featuring").array(), // Array of artist IDs that are featured on this track
});

// Purchase-related tables
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  totalAmount: integer("total_amount").notNull(),
  paymentMethod: text("payment_method").notNull(),
  purchaseDate: timestamp("purchase_date").notNull().defaultNow(),
  receiptUrl: text("receipt_url").notNull(),
});

export const purchaseItems = pgTable("purchase_items", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id").references(() => purchases.id).notNull(),
  trackId: integer("track_id").references(() => tracks.id),
  albumId: integer("album_id").references(() => albums.id),
  itemType: text("item_type").notNull(), // 'track' or 'album'
  price: integer("price").notNull(),
  title: text("title").notNull(),
  artistName: text("artist_name").notNull(),
});

// Subscription-related tables
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 'Free', 'Premium', 'Ultimate'
  price: integer("price").notNull(),
  interval: text("interval").notNull(), // 'month' or 'year'
  features: text("features").array().notNull(),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  planId: integer("plan_id").references(() => subscriptionPlans.id).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  autoRenew: boolean("auto_renew").notNull().default(true),
  paymentMethod: text("payment_method").notNull(),
});

// Playlist tables
export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  coverImage: text("cover_image"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const playlistTracks = pgTable("playlist_tracks", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").references(() => playlists.id).notNull(),
  trackId: integer("track_id").references(() => tracks.id).notNull(),
  addedAt: timestamp("added_at").notNull().defaultNow(),
  position: integer("position").notNull(),
});

// User Library tables
export const userLibraryTracks = pgTable("user_library_tracks", {
  userId: integer("user_id").references(() => users.id).notNull(),
  trackId: integer("track_id").references(() => tracks.id).notNull(),
  addedAt: timestamp("added_at").notNull().defaultNow(),
  isPurchased: boolean("is_purchased").notNull().default(false),
  isLiked: boolean("is_liked").notNull().default(false),
});

export const userLibraryAlbums = pgTable("user_library_albums", {
  userId: integer("user_id").references(() => users.id).notNull(),
  albumId: integer("album_id").references(() => albums.id).notNull(),
  addedAt: timestamp("added_at").notNull().defaultNow(),
  isPurchased: boolean("is_purchased").notNull().default(false),
  isLiked: boolean("is_liked").notNull().default(false),
});

// Artist Dashboard tables
export const artistAnalytics = pgTable("artist_analytics", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id").references(() => artists.id).notNull(),
  streamCount: integer("stream_count").notNull().default(0),
  purchaseCount: integer("purchase_count").notNull().default(0),
  revenue: integer("revenue").notNull().default(0), // In cents
  followerCount: integer("follower_count").notNull().default(0),
  period: text("period").notNull(), // 'day', 'week', 'month', 'year', 'all'
  date: timestamp("date").notNull(),
  // Added fields for more detailed analytics
  trackId: integer("track_id").references(() => tracks.id),
  albumId: integer("album_id").references(() => albums.id),
  countryCode: text("country_code"),
  platform: text("platform"),
});

export const artistFollowers = pgTable("artist_followers", {
  userId: integer("user_id").references(() => users.id).notNull(),
  artistId: integer("artist_id").references(() => artists.id).notNull(),
  followedAt: timestamp("followed_at").notNull().defaultNow(),
});

// Artist Uploads (for tracking upload status)
export const artistUploads = pgTable("artist_uploads", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id").references(() => artists.id).notNull(),
  uploadType: text("upload_type").notNull(), // 'track' or 'album'
  title: text("title").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'completed', 'failed'
  details: jsonb("details").notNull().default({}), // For storing upload details
  trackId: integer("track_id").references(() => tracks.id), // If a track was created
  albumId: integer("album_id").references(() => albums.id), // If an album was created
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Artist Royalties
export const artistRoyalties = pgTable("artist_royalties", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id").references(() => artists.id).notNull(),
  amount: integer("amount").notNull(), // In cents
  source: text("source").notNull(), // 'stream', 'purchase', etc.
  description: text("description").notNull(),
  trackId: integer("track_id").references(() => tracks.id),
  albumId: integer("album_id").references(() => albums.id),
  status: text("status").notNull().default("pending"), // 'pending', 'paid', 'cancelled'
  transactionId: text("transaction_id"), // For payment processing reference
  createdAt: timestamp("created_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
});

// Artist Events
export const artistEvents = pgTable("artist_events", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id").references(() => artists.id).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  eventDate: timestamp("event_date").notNull(),
  eventTime: text("event_time").notNull(),
  venue: text("venue").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  ticketLink: text("ticket_link"),
  tourName: text("tour_name"),
  guestArtists: text("guest_artists").array(),
  eventImage: text("event_image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// TypeScript interfaces
export interface User {
  id: number;
  email: string;
  username: string;
  displayName: string;
  profileImage?: string;
  city?: string;
  favoriteArtists?: string;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    soundcloud?: string;
  };
  role: 'user' | 'artist' | 'admin';
  artistId?: number;
  subscriptionTier: 'free' | 'premium' | 'ultimate';
  subscriptionEndDate?: Date;
  firebaseUid?: string; // Firebase user ID when using Firebase Auth
  createdAt: Date;
  preferences?: UserPreferences;
  artist?: Artist; // Associated artist profile if the user is an artist
}

export interface UserPreferences {
  language: 'en' | 'fr';
  theme: 'dark' | 'light';
  audioQuality: 'standard' | 'high' | 'lossless';
  autoplay: boolean;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  newReleases: boolean;
  playlists: boolean;
}

export interface Artist {
  id: number;
  name: string;
  image: string;
  bio: string;
  genres: string[];
  socialLinks: {
    website?: string;
    youtube?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
    tiktok?: string;
    soundcloud?: string;
  };
  verified: boolean;
  youtubeChannelId?: string;
  twitterUsername?: string;
  instagramUsername?: string;
  monthlyListeners?: number;
}

export interface Album {
  id: number;
  title: string;
  artistId: number;
  artistName: string;
  coverImage: string;
  releaseDate: Date;
  genres: string[];
  type?: string; // 'album', 'single', 'ep', etc.
  tracks?: Track[];
}

export interface Track {
  id: number;
  title: string;
  artistId: number;
  artistName: string;
  albumId: number;
  albumTitle: string;
  duration: number;
  audioUrl: string;
  purchasePrice?: number;
  purchaseAvailable: boolean;
  explicit: boolean;
  trackNumber: number;
  featuring?: number[]; // Array of artist IDs that are featured on this track
}

export interface Purchase {
  id: number;
  userId: number;
  items: PurchaseItem[];
  totalAmount: number;
  paymentMethod: string;
  purchaseDate: Date;
  receiptUrl: string;
}

export interface PurchaseItem {
  id: number;
  purchaseId: number;
  trackId?: number;
  albumId?: number;
  itemType: 'track' | 'album';
  price: number;
  title: string;
  artistName: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

export interface UserSubscription {
  id: number;
  userId: number;
  planId: number;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentMethod: string;
}

export interface Playlist {
  id: number;
  name: string;
  userId: number;
  coverImage?: string;
  isPublic: boolean;
  createdAt: Date;
  tracks?: PlaylistTrack[];
  isDefault?: boolean; // Flag to identify system-generated playlists
}

export interface PlaylistTrack {
  id: number;
  playlistId: number;
  trackId: number;
  addedAt: Date;
  position: number;
  track?: Track;
}

export interface ArtistAnalytics {
  id: number;
  artistId: number;
  streamCount: number;
  purchaseCount: number;
  revenue: number;
  followerCount: number;
  period: 'day' | 'week' | 'month' | 'year' | 'all';
  date: Date;
  trackId?: number;
  albumId?: number;
  countryCode?: string;
  platform?: string;
}

export interface ArtistFollower {
  userId: number;
  artistId: number;
  followedAt: Date;
}

export interface ArtistUpload {
  id: number;
  artistId: number;
  uploadType: 'track' | 'album';
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  details: {
    coverImage?: string;
    audioFile?: string;
    genres?: string[];
    description?: string;
    errorMessage?: string;
    tracklist?: { title: string, audioFile: string, trackNumber: number }[];
  };
  trackId?: number;
  albumId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArtistRoyalty {
  id: number;
  artistId: number;
  amount: number;
  source: 'stream' | 'purchase' | 'other';
  description: string;
  trackId?: number;
  albumId?: number;
  status: 'pending' | 'paid' | 'cancelled';
  transactionId?: string;
  createdAt: Date;
  paidAt?: Date;
}

export interface ArtistEvent {
  id: number;
  artistId: number;
  name: string;
  description: string;
  eventDate: Date;
  eventTime: string;
  venue: string;
  city: string;
  country: string;
  ticketLink?: string;
  tourName?: string;
  guestArtists: string[];
  eventImage?: string;
  createdAt: Date;
}

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  subscriptionEndDate: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences);
export const insertArtistSchema = createInsertSchema(artists).omit({ id: true });
export const insertAlbumSchema = createInsertSchema(albums).omit({ id: true });
export const insertTrackSchema = createInsertSchema(tracks).omit({ id: true });
export const insertPurchaseSchema = createInsertSchema(purchases).omit({ id: true, purchaseDate: true });
export const insertPurchaseItemSchema = createInsertSchema(purchaseItems).omit({ id: true });
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ id: true });
export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({ id: true });
export const insertPlaylistSchema = createInsertSchema(playlists).omit({ id: true, createdAt: true });
export const insertPlaylistTrackSchema = createInsertSchema(playlistTracks).omit({ id: true, addedAt: true });
export const insertArtistAnalyticsSchema = createInsertSchema(artistAnalytics).omit({ id: true });
export const insertArtistFollowerSchema = createInsertSchema(artistFollowers).omit({ followedAt: true });
export const insertArtistUploadSchema = createInsertSchema(artistUploads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertArtistRoyaltySchema = createInsertSchema(artistRoyalties).omit({ id: true, createdAt: true, paidAt: true });
export const insertArtistEventSchema = createInsertSchema(artistEvents).omit({ id: true, createdAt: true });

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type InsertArtist = z.infer<typeof insertArtistSchema>;
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;
export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type InsertPurchaseItem = z.infer<typeof insertPurchaseItemSchema>;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type InsertPlaylistTrack = z.infer<typeof insertPlaylistTrackSchema>;
export type InsertArtistAnalytics = z.infer<typeof insertArtistAnalyticsSchema>;
export type InsertArtistFollower = z.infer<typeof insertArtistFollowerSchema>;
export type InsertArtistUpload = z.infer<typeof insertArtistUploadSchema>;
export type InsertArtistRoyalty = z.infer<typeof insertArtistRoyaltySchema>;
export type InsertArtistEvent = z.infer<typeof insertArtistEventSchema>;

// Select types
export type UserSelect = typeof users.$inferSelect;
export type UserPreferencesSelect = typeof userPreferences.$inferSelect;
export type ArtistSelect = typeof artists.$inferSelect;
export type AlbumSelect = typeof albums.$inferSelect;
export type TrackSelect = typeof tracks.$inferSelect;
export type PurchaseSelect = typeof purchases.$inferSelect;
export type PurchaseItemSelect = typeof purchaseItems.$inferSelect;
export type SubscriptionPlanSelect = typeof subscriptionPlans.$inferSelect;
export type UserSubscriptionSelect = typeof userSubscriptions.$inferSelect;
export type PlaylistSelect = typeof playlists.$inferSelect;
export type PlaylistTrackSelect = typeof playlistTracks.$inferSelect;
export type ArtistAnalyticsSelect = typeof artistAnalytics.$inferSelect;
export type ArtistFollowerSelect = typeof artistFollowers.$inferSelect;
export type ArtistUploadSelect = typeof artistUploads.$inferSelect;
export type ArtistRoyaltySelect = typeof artistRoyalties.$inferSelect;
export type ArtistEventSelect = typeof artistEvents.$inferSelect;

// Auth-specific schemas
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginData = z.infer<typeof loginSchema>;

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterData = z.infer<typeof registerSchema>;
