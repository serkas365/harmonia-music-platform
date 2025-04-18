import { 
  User, InsertUser, Track, Album, Artist, Playlist, 
  UserPreferences, UserSubscription, SubscriptionPlan,
  ArtistAnalytics, ArtistFollower, InsertArtistAnalytics, InsertArtistFollower,
  ArtistUpload, ArtistRoyalty, ArtistEvent, InsertArtistUpload, InsertTrack, InsertAlbum, 
  InsertArtistRoyalty, InsertArtistEvent
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { Store } from "express-session";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User Management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // User Preferences
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  saveUserPreferences(userId: number, preferences: UserPreferences): Promise<UserPreferences>;
  
  // Library Management
  getUserLikedTracks(userId: number): Promise<Track[]>;
  getUserLikedAlbums(userId: number): Promise<Album[]>;
  getUserDownloadedTracks(userId: number): Promise<Track[]>;
  getUserPurchasedTracks(userId: number): Promise<Track[]>;
  getUserPurchasedAlbums(userId: number): Promise<Album[]>;
  addTrackToUserLibrary(userId: number, trackId: number, options: { isLiked?: boolean; isPurchased?: boolean }): Promise<void>;
  addAlbumToUserLibrary(userId: number, albumId: number, options: { isLiked?: boolean; isPurchased?: boolean }): Promise<void>;
  removeTrackFromUserLibrary(userId: number, trackId: number): Promise<void>;
  removeAlbumFromUserLibrary(userId: number, albumId: number): Promise<void>;
  
  // Playlist Management
  getUserPlaylists(userId: number): Promise<Playlist[]>;
  getPlaylist(id: number): Promise<Playlist | undefined>;
  createPlaylist(userId: number, name: string, isPublic?: boolean): Promise<Playlist>;
  updatePlaylist(id: number, updates: Partial<Playlist>): Promise<Playlist | undefined>;
  deletePlaylist(id: number): Promise<boolean>;
  addTrackToPlaylist(playlistId: number, trackId: number, position: number): Promise<void>;
  removeTrackFromPlaylist(playlistId: number, trackId: number): Promise<void>;
  
  // Music Catalog
  getTracks(limit?: number, offset?: number): Promise<Track[]>;
  getTrack(id: number): Promise<Track | undefined>;
  getAlbums(limit?: number, offset?: number): Promise<Album[]>;
  getAlbum(id: number): Promise<Album | undefined>;
  getArtists(limit?: number, offset?: number): Promise<Artist[]>;
  getArtist(id: number): Promise<Artist | undefined>;
  updateArtist(id: number, updates: Partial<Artist>): Promise<Artist | undefined>;
  getNewReleases(limit?: number): Promise<Track[]>;
  getArtistTracks(artistId: number): Promise<Track[]>;
  getArtistAlbums(artistId: number): Promise<Album[]>;
  getAlbumTracks(albumId: number): Promise<Track[]>;
  searchMusic(query: string): Promise<{ tracks: Track[]; albums: Album[]; artists: Artist[] }>;
  
  // Subscription
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getUserSubscription(userId: number): Promise<UserSubscription | undefined>;
  createUserSubscription(subscription: Omit<UserSubscription, 'id'>): Promise<UserSubscription>;
  updateUserSubscription(id: number, updates: Partial<UserSubscription>): Promise<UserSubscription | undefined>;
  
  // Artist Dashboard
  getArtistAnalytics(artistId: number, period?: 'day' | 'week' | 'month' | 'year' | 'all'): Promise<ArtistAnalytics[]>;
  createArtistAnalytics(analytics: InsertArtistAnalytics): Promise<ArtistAnalytics>;
  updateArtistAnalytics(id: number, updates: Partial<ArtistAnalytics>): Promise<ArtistAnalytics | undefined>;
  getArtistFollowers(artistId: number): Promise<ArtistFollower[]>;
  followArtist(userId: number, artistId: number): Promise<void>;
  unfollowArtist(userId: number, artistId: number): Promise<void>;
  isFollowingArtist(userId: number, artistId: number): Promise<boolean>;
  
  // Artist Uploads
  getArtistUploads(artistId: number): Promise<ArtistUpload[]>;
  getArtistUpload(id: number): Promise<ArtistUpload | undefined>;
  createArtistUpload(upload: InsertArtistUpload): Promise<ArtistUpload>;
  updateArtistUpload(id: number, updates: Partial<ArtistUpload>): Promise<ArtistUpload | undefined>;
  createTrackFromUpload(artistId: number, trackData: InsertTrack): Promise<Track>;
  createAlbumFromUpload(artistId: number, albumData: InsertAlbum, tracks?: InsertTrack[]): Promise<Album>;
  
  // Artist Royalties
  getArtistRoyalties(artistId: number): Promise<ArtistRoyalty[]>;
  getArtistRoyalty(id: number): Promise<ArtistRoyalty | undefined>;
  createArtistRoyalty(royalty: InsertArtistRoyalty): Promise<ArtistRoyalty>;
  updateArtistRoyalty(id: number, updates: Partial<ArtistRoyalty>): Promise<ArtistRoyalty | undefined>;
  getArtistTotalEarnings(artistId: number): Promise<number>; // Returns total earnings in cents
  
  // Artist Events
  getArtistEvents(artistId: number): Promise<ArtistEvent[]>;
  getArtistEvent(id: number): Promise<ArtistEvent | undefined>;
  createArtistEvent(event: InsertArtistEvent): Promise<ArtistEvent>;
  updateArtistEvent(id: number, updates: Partial<ArtistEvent>): Promise<ArtistEvent | undefined>;
  deleteArtistEvent(id: number): Promise<boolean>;
  
  // Session Store
  sessionStore: Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userPreferences: Map<number, UserPreferences>;
  private tracks: Map<number, Track>;
  private albums: Map<number, Album>;
  private artists: Map<number, Artist>;
  private playlists: Map<number, Playlist>;
  private userLikedTracks: Map<number, Set<number>>; // userId -> Set of trackIds
  private userLikedAlbums: Map<number, Set<number>>; // userId -> Set of albumIds
  private userDownloadedTracks: Map<number, Set<number>>; // userId -> Set of trackIds
  private userPurchasedTracks: Map<number, Set<number>>; // userId -> Set of trackIds
  private userPurchasedAlbums: Map<number, Set<number>>; // userId -> Set of albumIds
  private subscriptionPlans: Map<number, SubscriptionPlan>;
  private userSubscriptions: Map<number, UserSubscription>;
  private defaultPlaylists: { name: string; coverImage: string; isPublic: boolean; tracks: any[] }[];
  private artistAnalytics: Map<number, ArtistAnalytics>; // Analytics by ID
  private artistFollowers: Map<number, Set<number>>; // artistId -> Set of userIds
  private artistUploads: Map<number, ArtistUpload>; // Upload records by ID
  private artistRoyalties: Map<number, ArtistRoyalty>; // Royalty records by ID
  private artistEvents: Map<number, ArtistEvent>; // Event records by ID
  
  currentUserId: number;
  currentTrackId: number;
  currentAlbumId: number;
  currentArtistId: number;
  currentPlaylistId: number;
  currentSubscriptionPlanId: number;
  currentUserSubscriptionId: number;
  currentAnalyticsId: number;
  currentUploadId: number;
  currentRoyaltyId: number;
  currentEventId: number;
  
  sessionStore: Store;

  constructor() {
    this.users = new Map();
    this.userPreferences = new Map();
    this.tracks = new Map();
    this.albums = new Map();
    this.artists = new Map();
    this.playlists = new Map();
    this.userLikedTracks = new Map();
    this.userLikedAlbums = new Map();
    this.userDownloadedTracks = new Map();
    this.userPurchasedTracks = new Map();
    this.userPurchasedAlbums = new Map();
    this.subscriptionPlans = new Map();
    this.userSubscriptions = new Map();
    this.defaultPlaylists = [];
    this.artistAnalytics = new Map();
    this.artistFollowers = new Map();
    this.artistUploads = new Map();
    this.artistRoyalties = new Map();
    this.artistEvents = new Map();
    
    this.currentUserId = 1;
    this.currentTrackId = 1;
    this.currentAlbumId = 1;
    this.currentArtistId = 1;
    this.currentPlaylistId = 1;
    this.currentSubscriptionPlanId = 1;
    this.currentUserSubscriptionId = 1;
    this.currentAnalyticsId = 1;
    this.currentUploadId = 1;
    this.currentRoyaltyId = 1;
    this.currentEventId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    this.initializeSampleData();
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    // Ensure profileImage is undefined rather than null
    const { profileImage, ...restInsertUser } = insertUser;
    // Make sure artistId is properly typed (null to undefined conversion)
    const { artistId, ...otherProps } = restInsertUser;
    
    const user: User = { 
      ...otherProps,
      profileImage: profileImage || undefined, 
      id,
      createdAt: now,
      role: (restInsertUser.role || 'user') as 'user' | 'artist' | 'admin',
      artistId: typeof artistId === 'number' ? artistId : undefined,
      city: undefined,
      favoriteArtists: undefined,
      socialMedia: {
        instagram: '',
        twitter: '',
        facebook: '',
        youtube: '',
        soundcloud: ''
      },
      preferences: {
        language: 'en',
        theme: 'dark',
        audioQuality: 'standard',
        autoplay: true,
        notifications: {
          email: true,
          push: true,
          newReleases: true,
          playlists: true
        }
      },
      subscriptionTier: 'free',
      firebaseUid: restInsertUser.firebaseUid || undefined
    };
    this.users.set(id, user);
    
    // Initialize empty collections for the user
    this.userLikedTracks.set(id, new Set());
    this.userLikedAlbums.set(id, new Set());
    this.userDownloadedTracks.set(id, new Set());
    this.userPurchasedTracks.set(id, new Set());
    this.userPurchasedAlbums.set(id, new Set());
    
    // Create default playlists for the user
    if (this.defaultPlaylists) {
      for (const template of this.defaultPlaylists) {
        const playlistId = this.currentPlaylistId++;
        const playlist: Playlist = {
          id: playlistId,
          name: template.name,
          userId: id,
          coverImage: template.coverImage,
          isPublic: template.isPublic,
          isDefault: true, // Mark as a system-generated playlist
          createdAt: now,
          tracks: []
        };
        this.playlists.set(playlistId, playlist);
      }
    }
    
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // User Preferences
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const user = await this.getUser(userId);
    return user?.preferences;
  }
  
  async saveUserPreferences(userId: number, preferences: UserPreferences): Promise<UserPreferences> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    user.preferences = preferences;
    this.users.set(userId, user);
    return preferences;
  }
  
  // Library Management
  async getUserLikedTracks(userId: number): Promise<Track[]> {
    const trackIds = this.userLikedTracks.get(userId) || new Set();
    return Array.from(trackIds).map(id => this.tracks.get(id)).filter(Boolean) as Track[];
  }
  
  async getUserLikedAlbums(userId: number): Promise<Album[]> {
    const albumIds = this.userLikedAlbums.get(userId) || new Set();
    return Array.from(albumIds).map(id => this.albums.get(id)).filter(Boolean) as Album[];
  }
  
  async getUserDownloadedTracks(userId: number): Promise<Track[]> {
    const trackIds = this.userDownloadedTracks.get(userId) || new Set();
    return Array.from(trackIds).map(id => this.tracks.get(id)).filter(Boolean) as Track[];
  }
  
  async getUserPurchasedTracks(userId: number): Promise<Track[]> {
    const trackIds = this.userPurchasedTracks.get(userId) || new Set();
    return Array.from(trackIds).map(id => this.tracks.get(id)).filter(Boolean) as Track[];
  }
  
  async getUserPurchasedAlbums(userId: number): Promise<Album[]> {
    const albumIds = this.userPurchasedAlbums.get(userId) || new Set();
    return Array.from(albumIds).map(id => this.albums.get(id)).filter(Boolean) as Album[];
  }
  
  async addTrackToUserLibrary(userId: number, trackId: number, options: { isLiked?: boolean; isPurchased?: boolean } = {}): Promise<void> {
    if (options.isLiked) {
      const userLiked = this.userLikedTracks.get(userId) || new Set();
      userLiked.add(trackId);
      this.userLikedTracks.set(userId, userLiked);
    }
    
    if (options.isPurchased) {
      const userPurchased = this.userPurchasedTracks.get(userId) || new Set();
      userPurchased.add(trackId);
      this.userPurchasedTracks.set(userId, userPurchased);
    }
  }
  
  async addAlbumToUserLibrary(userId: number, albumId: number, options: { isLiked?: boolean; isPurchased?: boolean } = {}): Promise<void> {
    if (options.isLiked) {
      const userLiked = this.userLikedAlbums.get(userId) || new Set();
      userLiked.add(albumId);
      this.userLikedAlbums.set(userId, userLiked);
    }
    
    if (options.isPurchased) {
      const userPurchased = this.userPurchasedAlbums.get(userId) || new Set();
      userPurchased.add(albumId);
      this.userPurchasedAlbums.set(userId, userPurchased);
    }
  }
  
  async removeTrackFromUserLibrary(userId: number, trackId: number): Promise<void> {
    const userLiked = this.userLikedTracks.get(userId);
    if (userLiked) userLiked.delete(trackId);
    
    const userDownloaded = this.userDownloadedTracks.get(userId);
    if (userDownloaded) userDownloaded.delete(trackId);
    
    const userPurchased = this.userPurchasedTracks.get(userId);
    if (userPurchased) userPurchased.delete(trackId);
  }
  
  async removeAlbumFromUserLibrary(userId: number, albumId: number): Promise<void> {
    const userLiked = this.userLikedAlbums.get(userId);
    if (userLiked) userLiked.delete(albumId);
    
    const userPurchased = this.userPurchasedAlbums.get(userId);
    if (userPurchased) userPurchased.delete(albumId);
  }
  
  // Playlist Management
  async getUserPlaylists(userId: number): Promise<Playlist[]> {
    return Array.from(this.playlists.values())
      .filter(playlist => playlist.userId === userId);
  }
  
  async getPlaylist(id: number): Promise<Playlist | undefined> {
    return this.playlists.get(id);
  }
  
  async createPlaylist(userId: number, name: string, isPublic: boolean = false): Promise<Playlist> {
    const id = this.currentPlaylistId++;
    const now = new Date();
    
    const playlist: Playlist = {
      id,
      name,
      userId,
      isPublic,
      isDefault: false, // Mark as user-created playlist
      createdAt: now,
      tracks: []
    };
    
    this.playlists.set(id, playlist);
    return playlist;
  }
  
  async updatePlaylist(id: number, updates: Partial<Playlist>): Promise<Playlist | undefined> {
    const playlist = await this.getPlaylist(id);
    if (!playlist) return undefined;
    
    const updatedPlaylist = { ...playlist, ...updates };
    this.playlists.set(id, updatedPlaylist);
    return updatedPlaylist;
  }
  
  async deletePlaylist(id: number): Promise<boolean> {
    return this.playlists.delete(id);
  }
  
  async addTrackToPlaylist(playlistId: number, trackId: number, position: number): Promise<void> {
    const playlist = await this.getPlaylist(playlistId);
    if (!playlist) throw new Error('Playlist not found');
    
    const track = await this.getTrack(trackId);
    if (!track) throw new Error('Track not found');
    
    const playlistTrack = {
      id: Date.now(), // Use timestamp as ID for simplicity
      playlistId,
      trackId,
      addedAt: new Date(),
      position,
      track
    };
    
    if (!playlist.tracks) {
      playlist.tracks = [];
    }
    
    // Remove if already exists
    playlist.tracks = playlist.tracks.filter(t => t.trackId !== trackId);
    
    // Insert at specified position
    playlist.tracks.splice(position, 0, playlistTrack);
    
    // Update positions for all tracks
    playlist.tracks = playlist.tracks.map((t, i) => ({
      ...t,
      position: i
    }));
    
    this.playlists.set(playlistId, playlist);
  }
  
  async removeTrackFromPlaylist(playlistId: number, trackId: number): Promise<void> {
    const playlist = await this.getPlaylist(playlistId);
    if (!playlist || !playlist.tracks) return;
    
    playlist.tracks = playlist.tracks
      .filter(t => t.trackId !== trackId)
      .map((t, i) => ({ ...t, position: i }));
    
    this.playlists.set(playlistId, playlist);
  }
  
  // Music Catalog
  async getTracks(limit: number = 50, offset: number = 0): Promise<Track[]> {
    return Array.from(this.tracks.values())
      .slice(offset, offset + limit);
  }
  
  async getTrack(id: number): Promise<Track | undefined> {
    return this.tracks.get(id);
  }
  
  async getAlbums(limit: number = 50, offset: number = 0): Promise<Album[]> {
    return Array.from(this.albums.values())
      .slice(offset, offset + limit);
  }
  
  async getAlbum(id: number): Promise<Album | undefined> {
    return this.albums.get(id);
  }
  
  async getArtists(limit: number = 50, offset: number = 0): Promise<Artist[]> {
    return Array.from(this.artists.values())
      .slice(offset, offset + limit);
  }
  
  async getArtist(id: number): Promise<Artist | undefined> {
    return this.artists.get(id);
  }
  
  async updateArtist(id: number, updates: Partial<Artist>): Promise<Artist | undefined> {
    const artist = await this.getArtist(id);
    if (!artist) return undefined;
    
    const updatedArtist = { ...artist, ...updates };
    this.artists.set(id, updatedArtist);
    return updatedArtist;
  }
  
  async getNewReleases(limit: number = 10): Promise<Track[]> {
    // In a real app, would sort by release date
    return Array.from(this.tracks.values())
      .slice(0, limit);
  }
  
  async getArtistTracks(artistId: number): Promise<Track[]> {
    return Array.from(this.tracks.values())
      .filter(track => track.artistId === artistId);
  }
  
  async getArtistAlbums(artistId: number): Promise<Album[]> {
    return Array.from(this.albums.values())
      .filter(album => album.artistId === artistId);
  }
  
  async getAlbumTracks(albumId: number): Promise<Track[]> {
    return Array.from(this.tracks.values())
      .filter(track => track.albumId === albumId)
      .sort((a, b) => a.trackNumber - b.trackNumber);
  }
  
  async searchMusic(query: string): Promise<{ tracks: Track[]; albums: Album[]; artists: Artist[] }> {
    const lowerQuery = query.toLowerCase();
    
    const tracks = Array.from(this.tracks.values())
      .filter(track => 
        track.title.toLowerCase().includes(lowerQuery) || 
        track.artistName.toLowerCase().includes(lowerQuery)
      );
    
    const albums = Array.from(this.albums.values())
      .filter(album => 
        album.title.toLowerCase().includes(lowerQuery) || 
        album.artistName.toLowerCase().includes(lowerQuery)
      );
    
    const artists = Array.from(this.artists.values())
      .filter(artist => 
        artist.name.toLowerCase().includes(lowerQuery)
      );
    
    return { tracks, albums, artists };
  }
  
  // Subscription
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values());
  }
  
  async getUserSubscription(userId: number): Promise<UserSubscription | undefined> {
    return Array.from(this.userSubscriptions.values())
      .find(sub => sub.userId === userId);
  }
  
  async createUserSubscription(subscription: Omit<UserSubscription, 'id'>): Promise<UserSubscription> {
    const id = this.currentUserSubscriptionId++;
    const newSubscription = { ...subscription, id };
    
    this.userSubscriptions.set(id, newSubscription);
    
    // Update user's subscription tier
    const plan = this.subscriptionPlans.get(subscription.planId);
    if (plan) {
      const user = await this.getUser(subscription.userId);
      if (user) {
        user.subscriptionTier = plan.name.toLowerCase() as 'free' | 'premium' | 'ultimate';
        user.subscriptionEndDate = subscription.endDate;
        this.users.set(user.id, user);
      }
    }
    
    return newSubscription;
  }
  
  async updateUserSubscription(id: number, updates: Partial<UserSubscription>): Promise<UserSubscription | undefined> {
    const subscription = this.userSubscriptions.get(id);
    if (!subscription) return undefined;
    
    const updatedSubscription = { ...subscription, ...updates };
    this.userSubscriptions.set(id, updatedSubscription);
    
    // Update user's subscription end date if changed
    if (updates.endDate) {
      const user = await this.getUser(subscription.userId);
      if (user) {
        user.subscriptionEndDate = updates.endDate;
        this.users.set(user.id, user);
      }
    }
    
    return updatedSubscription;
  }
  
  // Artist Dashboard
  async getArtistAnalytics(artistId: number, period: 'day' | 'week' | 'month' | 'year' | 'all' = 'all'): Promise<ArtistAnalytics[]> {
    return Array.from(this.artistAnalytics.values())
      .filter(analytics => analytics.artistId === artistId && (period === 'all' || analytics.period === period))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  async createArtistAnalytics(analytics: InsertArtistAnalytics): Promise<ArtistAnalytics> {
    const id = this.currentAnalyticsId++;
    // Ensure all required fields have values
    const newAnalytics: ArtistAnalytics = { 
      ...analytics, 
      id,
      streamCount: analytics.streamCount || 0,
      purchaseCount: analytics.purchaseCount || 0,
      revenue: analytics.revenue || 0,
      followerCount: analytics.followerCount || 0,
      period: (analytics.period || 'day') as 'day' | 'week' | 'month' | 'year' | 'all'
    };
    this.artistAnalytics.set(id, newAnalytics);
    return newAnalytics;
  }
  
  async updateArtistAnalytics(id: number, updates: Partial<ArtistAnalytics>): Promise<ArtistAnalytics | undefined> {
    const analytics = this.artistAnalytics.get(id);
    if (!analytics) return undefined;
    
    const updatedAnalytics = { ...analytics, ...updates };
    this.artistAnalytics.set(id, updatedAnalytics);
    return updatedAnalytics;
  }
  
  async getArtistFollowers(artistId: number): Promise<ArtistFollower[]> {
    const followerIds = this.artistFollowers.get(artistId) || new Set();
    return Array.from(followerIds).map(userId => ({
      userId,
      artistId,
      followedAt: new Date() // In real app would store actual follow date
    }));
  }
  
  async followArtist(userId: number, artistId: number): Promise<void> {
    const followers = this.artistFollowers.get(artistId) || new Set();
    followers.add(userId);
    this.artistFollowers.set(artistId, followers);
  }
  
  async unfollowArtist(userId: number, artistId: number): Promise<void> {
    const followers = this.artistFollowers.get(artistId);
    if (followers) {
      followers.delete(userId);
    }
  }
  
  async isFollowingArtist(userId: number, artistId: number): Promise<boolean> {
    const followers = this.artistFollowers.get(artistId) || new Set();
    return followers.has(userId);
  }
  
  // Artist Uploads
  async getArtistUploads(artistId: number): Promise<ArtistUpload[]> {
    return Array.from(this.artistUploads.values())
      .filter(upload => upload.artistId === artistId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first
  }
  
  async getArtistUpload(id: number): Promise<ArtistUpload | undefined> {
    return this.artistUploads.get(id);
  }
  
  async createArtistUpload(upload: InsertArtistUpload): Promise<ArtistUpload> {
    const id = this.currentUploadId++;
    const now = new Date();
    const newUpload: ArtistUpload = {
      ...upload,
      id,
      status: (upload.status || 'pending') as 'pending' | 'processing' | 'completed' | 'failed',
      createdAt: now,
      updatedAt: now,
      details: upload.details || {
        coverImage: '',
        audioFile: '',
        genres: [],
        description: ''
      }
    };
    
    this.artistUploads.set(id, newUpload);
    return newUpload;
  }
  
  async updateArtistUpload(id: number, updates: Partial<ArtistUpload>): Promise<ArtistUpload | undefined> {
    const upload = this.artistUploads.get(id);
    if (!upload) return undefined;
    
    const updatedUpload = { 
      ...upload, 
      ...updates,
      updatedAt: new Date() 
    };
    this.artistUploads.set(id, updatedUpload);
    return updatedUpload;
  }
  
  async createTrackFromUpload(artistId: number, trackData: InsertTrack): Promise<Track> {
    const id = this.currentTrackId++;
    const artist = await this.getArtist(artistId);
    if (!artist) throw new Error('Artist not found');
    
    const track: Track = {
      ...trackData,
      id,
      artistId,
      artistName: artist.name,
      albumTitle: trackData.albumTitle || 'Single',
      purchaseAvailable: trackData.purchaseAvailable ?? true,
      explicit: trackData.explicit ?? false
    };
    
    this.tracks.set(id, track);
    return track;
  }
  
  async createAlbumFromUpload(artistId: number, albumData: InsertAlbum, tracks?: InsertTrack[]): Promise<Album> {
    const id = this.currentAlbumId++;
    const artist = await this.getArtist(artistId);
    if (!artist) throw new Error('Artist not found');
    
    const album: Album = {
      ...albumData,
      id,
      artistId,
      artistName: artist.name
    };
    
    this.albums.set(id, album);
    
    // Create associated tracks if provided
    if (tracks && tracks.length > 0) {
      let trackNumber = 1;
      for (const trackData of tracks) {
        const trackId = this.currentTrackId++;
        const track: Track = {
          ...trackData,
          id: trackId,
          artistId,
          artistName: artist.name,
          albumId: id,
          albumTitle: album.title,
          trackNumber: trackData.trackNumber || trackNumber++,
          purchaseAvailable: trackData.purchaseAvailable ?? true,
          explicit: trackData.explicit ?? false
        };
        this.tracks.set(trackId, track);
      }
    }
    
    return album;
  }
  
  // Artist Royalties
  async getArtistRoyalties(artistId: number): Promise<ArtistRoyalty[]> {
    return Array.from(this.artistRoyalties.values())
      .filter(royalty => royalty.artistId === artistId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first
  }
  
  async getArtistRoyalty(id: number): Promise<ArtistRoyalty | undefined> {
    return this.artistRoyalties.get(id);
  }
  
  async createArtistRoyalty(royalty: InsertArtistRoyalty): Promise<ArtistRoyalty> {
    const id = this.currentRoyaltyId++;
    const now = new Date();
    const newRoyalty: ArtistRoyalty = {
      ...royalty,
      id,
      status: (royalty.status || 'pending') as 'pending' | 'paid' | 'cancelled',
      createdAt: now
    };
    
    this.artistRoyalties.set(id, newRoyalty);
    return newRoyalty;
  }
  
  async updateArtistRoyalty(id: number, updates: Partial<ArtistRoyalty>): Promise<ArtistRoyalty | undefined> {
    const royalty = this.artistRoyalties.get(id);
    if (!royalty) return undefined;
    
    // If status is changing to paid, set the paidAt date
    const paidAt = updates.status === 'paid' && royalty.status !== 'paid' 
      ? new Date() 
      : royalty.paidAt;
    
    const updatedRoyalty = { 
      ...royalty, 
      ...updates,
      paidAt
    };
    
    this.artistRoyalties.set(id, updatedRoyalty);
    return updatedRoyalty;
  }
  
  async getArtistTotalEarnings(artistId: number): Promise<number> {
    const royalties = await this.getArtistRoyalties(artistId);
    const totalPaid = royalties
      .filter(r => r.status === 'paid')
      .reduce((total, r) => total + r.amount, 0);
    
    const totalPending = royalties
      .filter(r => r.status === 'pending')
      .reduce((total, r) => total + r.amount, 0);
    
    // Return total amount (paid + pending)
    return totalPaid + totalPending;
  }
  
  // Artist Events
  async getArtistEvents(artistId: number): Promise<ArtistEvent[]> {
    return Array.from(this.artistEvents.values())
      .filter(event => event.artistId === artistId)
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }
  
  async getArtistEvent(id: number): Promise<ArtistEvent | undefined> {
    return this.artistEvents.get(id);
  }
  
  async createArtistEvent(event: InsertArtistEvent): Promise<ArtistEvent> {
    const id = this.currentEventId++;
    const now = new Date();
    
    const newEvent: ArtistEvent = {
      ...event,
      id,
      createdAt: now,
      // Ensure guestArtists is an array if not provided
      guestArtists: event.guestArtists || []
    };
    
    this.artistEvents.set(id, newEvent);
    return newEvent;
  }
  
  async updateArtistEvent(id: number, updates: Partial<ArtistEvent>): Promise<ArtistEvent | undefined> {
    const event = this.artistEvents.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...updates };
    this.artistEvents.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async deleteArtistEvent(id: number): Promise<boolean> {
    return this.artistEvents.delete(id);
  }
  
  // Sample data initialization - this would be removed in a real application
  // but is useful for development purposes
  private initializeSampleData() {
    // Create sample users (casting as any to ignore type-checking)
    // This is temporary until we implement Firebase authentication
    const sampleUsers: any[] = [
      {
        id: this.currentUserId++,
        username: 'niki23',
        password: 'password123', // Using plaintext for testing only
        email: 'niki23@gmail.com',
        displayName: 'Niki Johnson',
        role: 'user',
        profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100&h=100',
        city: 'Los Angeles, CA',
        favoriteArtists: 'Electric Dreams, Quantum Beats, Sonic Wave',
        socialMedia: {
          instagram: '@niki_music_lover',
          twitter: '@niki23',
          facebook: 'nikijohnson',
          youtube: '',
          soundcloud: 'niki23'
        },
        createdAt: new Date('2023-01-01'),
        preferences: {
          language: 'en',
          theme: 'dark',
          audioQuality: 'standard',
          autoplay: true,
          notifications: {
            email: true,
            push: true,
            newReleases: true,
            playlists: true
          }
        },
        subscriptionTier: 'free'
      },
      {
        id: this.currentUserId++,
        username: 'melodycreator',
        password: 'password123', // Using plaintext for testing only
        email: 'melodycreator@artistmail.com',
        displayName: 'Electric Dreams',
        role: 'artist',
        artistId: 1, // Electric Dreams
        firebaseUid: 'qUPQo7ekEwf35uTUhvlBK77zv423', // UID from Firebase
        profileImage: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=100&h=100',
        city: 'New York, NY',
        favoriteArtists: 'Midnight Cruise, Nova Flames',
        socialMedia: {
          instagram: '@electricdreams',
          twitter: '@electricdreams',
          facebook: 'electricdreamsofficial',
          youtube: 'ElectricDreamsMusic',
          soundcloud: 'electricdreams'
        },
        createdAt: new Date('2023-01-01'),
        preferences: {
          language: 'en',
          theme: 'dark',
          audioQuality: 'high',
          autoplay: true,
          notifications: {
            email: true,
            push: true,
            newReleases: true,
            playlists: true
          }
        },
        subscriptionTier: 'premium'
      },
      {
        id: this.currentUserId++,
        username: 'beatsmith',
        password: 'password123', // Using plaintext for testing only
        email: 'beatsmith@artistmail.com', 
        displayName: 'Quantum Beats',
        role: 'artist',
        artistId: 3, // Quantum Beats
        firebaseUid: 'OZ2MUJR3QOQnfTW4pGy4WX43w0E3', // UID from Firebase
        profileImage: 'https://images.unsplash.com/photo-1573497161161-c3e73707e25c?auto=format&fit=crop&q=80&w=100&h=100',
        city: 'London, UK',
        favoriteArtists: 'Electric Dreams, Luna Shadows',
        socialMedia: {
          instagram: '@quantumbeats',
          twitter: '@quantumbeats',
          facebook: 'quantumbeatsmusic',
          youtube: 'QuantumBeatsOfficial',
          soundcloud: 'quantumbeats'
        },
        createdAt: new Date('2023-01-01'),
        preferences: {
          language: 'en',
          theme: 'dark',
          audioQuality: 'high',
          autoplay: true,
          notifications: {
            email: true,
            push: true,
            newReleases: true,
            playlists: true
          }
        },
        subscriptionTier: 'premium'
      }
    ];
    
    // Add users to storage and initialize their collections
    sampleUsers.forEach(user => {
      this.users.set(user.id, user);
      
      // Initialize empty collections for the user
      this.userLikedTracks.set(user.id, new Set());
      this.userLikedAlbums.set(user.id, new Set());
      this.userDownloadedTracks.set(user.id, new Set());
      this.userPurchasedTracks.set(user.id, new Set());
      this.userPurchasedAlbums.set(user.id, new Set());
      
      // Create default playlists for the user
      if (this.defaultPlaylists) {
        for (const template of this.defaultPlaylists) {
          const playlistId = this.currentPlaylistId++;
          const playlist: Playlist = {
            id: playlistId,
            name: template.name,
            userId: user.id,
            coverImage: template.coverImage,
            isPublic: template.isPublic,
            isDefault: true, // Mark as a system-generated playlist
            tracks: template.tracks,
            createdAt: new Date()
          };
          this.playlists.set(playlistId, playlist);
        }
      }
    });
    
    // Create artist analytics samples
    const analyticsData = [
      // Electric Dreams (artistId: 1)
      {
        artistId: 1,
        date: new Date('2023-10-01'),
        period: 'day',
        streamCount: 120,
        purchaseCount: 15,
        revenue: 2500, // $25.00
        followerCount: 350
      },
      {
        artistId: 1,
        date: new Date('2023-10-02'),
        period: 'day',
        streamCount: 135,
        purchaseCount: 18,
        revenue: 2800, // $28.00
        followerCount: 358
      },
      // Quantum Beats (artistId: 3)
      {
        artistId: 3,
        date: new Date('2023-10-01'),
        period: 'day',
        streamCount: 95,
        purchaseCount: 12,
        revenue: 1800, // $18.00
        followerCount: 280
      },
      {
        artistId: 3,
        date: new Date('2023-10-02'),
        period: 'day',
        streamCount: 105,
        purchaseCount: 14,
        revenue: 2100, // $21.00
        followerCount: 285
      }
    ];
    
    analyticsData.forEach(analytics => {
      this.createArtistAnalytics(analytics);
    });
    
    // Create subscription plans
    const freePlan: SubscriptionPlan = {
      id: this.currentSubscriptionPlanId++,
      name: 'Free',
      price: 0,
      interval: 'month',
      features: ['Ad-supported streaming', 'Standard audio quality', 'Mobile and desktop access']
    };
    
    const premiumPlan: SubscriptionPlan = {
      id: this.currentSubscriptionPlanId++,
      name: 'Premium',
      price: 999, // $9.99
      interval: 'month',
      features: ['Ad-free streaming', 'High audio quality', 'Offline listening', 'Unlimited skips']
    };
    
    const ultimatePlan: SubscriptionPlan = {
      id: this.currentSubscriptionPlanId++,
      name: 'Ultimate',
      price: 1499, // $14.99
      interval: 'month',
      features: ['Ad-free streaming', 'Lossless audio quality', 'Offline listening', 'Unlimited skips', 'Exclusive content']
    };
    
    this.subscriptionPlans.set(freePlan.id, freePlan);
    this.subscriptionPlans.set(premiumPlan.id, premiumPlan);
    this.subscriptionPlans.set(ultimatePlan.id, ultimatePlan);
    
    // Create artists
    const artists = [
      {
        id: this.currentArtistId++,
        name: 'Electric Dreams',
        image: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?auto=format&fit=crop&q=80&w=300&h=300',
        bio: 'Electronic music duo known for their atmospheric soundscapes and innovative beats.',
        genres: ['Electronic', 'Ambient', 'Downtempo'],
        socialLinks: {
          youtube: 'https://youtube.com/electricdreams',
          instagram: 'https://instagram.com/electricdreams',
          twitter: 'https://twitter.com/electricdreams'
        },
        verified: true
      },
      {
        id: this.currentArtistId++,
        name: 'Luna Shadows',
        image: 'https://images.unsplash.com/photo-1593697821252-0c9137d9fc45?auto=format&fit=crop&q=80&w=300&h=300',
        bio: 'Indie pop sensation with haunting vocals and ethereal melodies that captivate listeners.',
        genres: ['Indie Pop', 'Dream Pop', 'Alternative'],
        socialLinks: {
          youtube: 'https://youtube.com/lunashadows',
          instagram: 'https://instagram.com/lunashadows'
        },
        verified: true
      },
      {
        id: this.currentArtistId++,
        name: 'Quantum Beats',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=300&h=300',
        bio: 'Hip-hop collective pushing the boundaries of the genre with futuristic production and intelligent lyrics.',
        genres: ['Hip Hop', 'Electronic', 'Experimental'],
        socialLinks: {
          youtube: 'https://youtube.com/quantumbeats',
          instagram: 'https://instagram.com/quantumbeats',
          twitter: 'https://twitter.com/quantumbeats'
        },
        verified: true
      },
      {
        id: this.currentArtistId++,
        name: 'Aurora Skies',
        image: 'https://images.unsplash.com/photo-1526218626217-dc65a29bb444?auto=format&fit=crop&q=80&w=300&h=300',
        bio: 'Folk-inspired acoustic ensemble bringing heartfelt lyrics and lush harmonies to listeners worldwide.',
        genres: ['Folk', 'Acoustic', 'Indie'],
        socialLinks: {
          youtube: 'https://youtube.com/auroraskies',
          instagram: 'https://instagram.com/auroraskies'
        },
        verified: false
      },
      {
        id: this.currentArtistId++,
        name: 'Midnight Cruise',
        image: 'https://images.unsplash.com/photo-1577375729152-4c8b5fcda381?auto=format&fit=crop&q=80&w=300&h=300',
        bio: 'Synth-wave band creating nostalgia-infused tracks perfect for night drives and contemplation.',
        genres: ['Synthwave', '80s', 'Electronic'],
        socialLinks: {
          youtube: 'https://youtube.com/midnightcruise',
          instagram: 'https://instagram.com/midnightcruise',
          twitter: 'https://twitter.com/midnightcruise'
        },
        verified: true
      },
      {
        id: this.currentArtistId++,
        name: 'Nova Flames',
        image: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&q=80&w=300&h=300',
        bio: 'Rock band blending classic influences with modern production for an energetic, timeless sound.',
        genres: ['Rock', 'Alternative', 'Indie Rock'],
        socialLinks: {
          youtube: 'https://youtube.com/novaflames',
          instagram: 'https://instagram.com/novaflames'
        },
        verified: true
      }
    ];
    
    // Add artists to storage
    artists.forEach(artist => {
      this.artists.set(artist.id, artist);
    });
    
    // Create albums
    const albums = [
      {
        id: this.currentAlbumId++,
        title: 'Digital Horizons',
        artistId: 1,
        artistName: 'Electric Dreams',
        coverImage: 'https://images.unsplash.com/photo-1496293455970-f8581aae0e3b?auto=format&fit=crop&q=80&w=300&h=300',
        releaseDate: new Date('2023-04-15'),
        genres: ['Electronic', 'Ambient']
      },
      {
        id: this.currentAlbumId++,
        title: 'Moonlight Wanderer',
        artistId: 2,
        artistName: 'Luna Shadows',
        coverImage: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&q=80&w=300&h=300',
        releaseDate: new Date('2023-06-21'),
        genres: ['Indie Pop', 'Dream Pop']
      },
      {
        id: this.currentAlbumId++,
        title: 'Future State',
        artistId: 3,
        artistName: 'Quantum Beats',
        coverImage: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&q=80&w=300&h=300',
        releaseDate: new Date('2023-02-10'),
        genres: ['Hip Hop', 'Electronic']
      },
      {
        id: this.currentAlbumId++,
        title: 'Northern Whispers',
        artistId: 4,
        artistName: 'Aurora Skies',
        coverImage: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&q=80&w=300&h=300',
        releaseDate: new Date('2023-01-05'),
        genres: ['Folk', 'Acoustic']
      },
      {
        id: this.currentAlbumId++,
        title: 'Neon Drive',
        artistId: 5,
        artistName: 'Midnight Cruise',
        coverImage: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&q=80&w=300&h=300',
        releaseDate: new Date('2023-03-18'),
        genres: ['Synthwave', 'Electronic']
      },
      {
        id: this.currentAlbumId++,
        title: 'Ember Rise',
        artistId: 6,
        artistName: 'Nova Flames',
        coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=300&h=300',
        releaseDate: new Date('2023-05-12'),
        genres: ['Rock', 'Alternative']
      }
    ];
    
    // Add albums to storage
    albums.forEach(album => {
      this.albums.set(album.id, album);
    });
    
    // Create tracks
    let trackNumber = 1;
    const tracks = [
      // Electric Dreams - Digital Horizons
      {
        id: this.currentTrackId++,
        title: 'Binary Sunset',
        artistId: 1,
        artistName: 'Electric Dreams',
        albumId: 1,
        albumTitle: 'Digital Horizons',
        duration: 245, // 4:05
        audioUrl: '/assets/audio/sample1.mp3',
        purchasePrice: 129, // $1.29
        purchaseAvailable: true,
        explicit: false,
        trackNumber: trackNumber++
      },
      {
        id: this.currentTrackId++,
        title: 'Neural Network',
        artistId: 1,
        artistName: 'Electric Dreams',
        albumId: 1,
        albumTitle: 'Digital Horizons',
        duration: 218, // 3:38
        audioUrl: '/assets/audio/sample2.mp3',
        purchasePrice: 129, // $1.29
        purchaseAvailable: true,
        explicit: false,
        trackNumber: trackNumber++
      },
      
      // Reset track number for new album
      ...(trackNumber = 1, []),
      
      // Luna Shadows - Moonlight Wanderer
      {
        id: this.currentTrackId++,
        title: 'Silver Light',
        artistId: 2,
        artistName: 'Luna Shadows',
        albumId: 2,
        albumTitle: 'Moonlight Wanderer',
        duration: 197, // 3:17
        audioUrl: '/assets/audio/sample3.mp3',
        purchasePrice: 129, // $1.29
        purchaseAvailable: true,
        explicit: false,
        trackNumber: trackNumber++
      },
      {
        id: this.currentTrackId++,
        title: 'Ethereal',
        artistId: 2,
        artistName: 'Luna Shadows',
        albumId: 2,
        albumTitle: 'Moonlight Wanderer',
        duration: 224, // 3:44
        audioUrl: '/assets/audio/sample4.mp3',
        purchasePrice: 129, // $1.29
        purchaseAvailable: true,
        explicit: false,
        trackNumber: trackNumber++
      },
      
      // Reset track number for new album
      ...(trackNumber = 1, []),
      
      // Quantum Beats - Future State
      {
        id: this.currentTrackId++,
        title: 'Time Traveler',
        artistId: 3,
        artistName: 'Quantum Beats',
        albumId: 3,
        albumTitle: 'Future State',
        duration: 182, // 3:02
        audioUrl: '/assets/audio/sample5.mp3',
        purchasePrice: 129, // $1.29
        purchaseAvailable: true,
        explicit: true,
        trackNumber: trackNumber++
      },
      {
        id: this.currentTrackId++,
        title: 'Particle Wave',
        artistId: 3,
        artistName: 'Quantum Beats',
        albumId: 3,
        albumTitle: 'Future State',
        duration: 231, // 3:51
        audioUrl: '/assets/audio/sample6.mp3',
        purchasePrice: 129, // $1.29
        purchaseAvailable: true,
        explicit: true,
        trackNumber: trackNumber++
      },
      
      // More recent tracks (for new releases)
      {
        id: this.currentTrackId++,
        title: 'Cosmic Dawn',
        artistId: 1,
        artistName: 'Electric Dreams',
        albumId: 1,
        albumTitle: 'Digital Horizons',
        duration: 263, // 4:23
        audioUrl: '/assets/audio/sample7.mp3',
        purchasePrice: 129, // $1.29
        purchaseAvailable: true,
        explicit: false,
        trackNumber: 3
      },
      {
        id: this.currentTrackId++,
        title: 'Midnight Echoes',
        artistId: 2,
        artistName: 'Luna Shadows',
        albumId: 2,
        albumTitle: 'Moonlight Wanderer',
        duration: 205, // 3:25
        audioUrl: '/assets/audio/sample8.mp3',
        purchasePrice: 129, // $1.29
        purchaseAvailable: true,
        explicit: false,
        trackNumber: 3
      },
      {
        id: this.currentTrackId++,
        title: 'Quantum Leap',
        artistId: 3,
        artistName: 'Quantum Beats',
        albumId: 3,
        albumTitle: 'Future State',
        duration: 198, // 3:18
        audioUrl: '/assets/audio/sample9.mp3',
        purchasePrice: 129, // $1.29
        purchaseAvailable: true,
        explicit: true,
        trackNumber: 3
      },
      {
        id: this.currentTrackId++,
        title: 'Aurora Borealis',
        artistId: 4,
        artistName: 'Aurora Skies',
        albumId: 4,
        albumTitle: 'Northern Whispers',
        duration: 274, // 4:34
        audioUrl: '/assets/audio/sample10.mp3',
        purchasePrice: 129, // $1.29
        purchaseAvailable: true,
        explicit: false,
        trackNumber: 1
      }
    ];
    
    // Add tracks to storage
    tracks.forEach(track => {
      this.tracks.set(track.id, track);
    });
    
    // Create sample artist events
    const events = [
      // Electric Dreams events
      {
        artistId: 1,
        name: "Electric Dreams Summer Tour",
        description: "Join Electric Dreams for an unforgettable summer night of electronic music at the iconic Sunset Amphitheater.",
        eventDate: new Date("2025-07-15"),
        eventTime: "20:00",
        venue: "Sunset Amphitheater",
        city: "Los Angeles",
        country: "USA",
        ticketLink: "https://ticketmaster.com/electric-dreams-tour",
        tourName: "Cosmic Waves Tour 2025",
        guestArtists: ["Luna Shadows", "Midnight Cruise"],
        eventImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600&h=400",
        createdAt: new Date()
      },
      {
        artistId: 1,
        name: "Electronic Music Festival",
        description: "Electric Dreams will be headlining the annual Electronic Music Festival, featuring the best in ambient and downtempo.",
        eventDate: new Date("2025-08-20"),
        eventTime: "18:30",
        venue: "Central Park",
        city: "New York",
        country: "USA",
        ticketLink: "https://ticketmaster.com/electronic-music-festival",
        tourName: "Cosmic Waves Tour 2025",
        guestArtists: ["Quantum Beats", "Nova Flames"],
        eventImage: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=600&h=400",
        createdAt: new Date()
      },
      // Quantum Beats events
      {
        artistId: 3,
        name: "Future Beats Showcase",
        description: "Quantum Beats presents an evening of cutting-edge hip-hop and electronic fusion.",
        eventDate: new Date("2025-06-10"),
        eventTime: "21:00",
        venue: "The Echo",
        city: "Los Angeles",
        country: "USA",
        ticketLink: "https://ticketmaster.com/quantum-beats-showcase",
        tourName: "Quantum Leap Tour",
        guestArtists: ["Electric Dreams"],
        eventImage: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=600&h=400",
        createdAt: new Date()
      },
      {
        artistId: 3,
        name: "London Underground",
        description: "Quantum Beats returns to London for an intimate show featuring new material.",
        eventDate: new Date("2025-09-05"),
        eventTime: "20:30",
        venue: "Roundhouse",
        city: "London",
        country: "UK",
        ticketLink: "https://ticketmaster.co.uk/quantum-beats-underground",
        tourName: "Quantum Leap Tour",
        guestArtists: [],
        eventImage: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=600&h=400",
        createdAt: new Date()
      }
    ];
    
    // Add events to storage
    events.forEach(event => {
      const id = this.currentEventId++;
      this.artistEvents.set(id, { ...event, id });
    });
    
    // Create default playlist templates that will be cloned for each new user
    this.defaultPlaylists = [
      {
        name: 'Chill Vibes',
        coverImage: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=300&h=300',
        isPublic: true,
        tracks: []
      },
      {
        name: 'Workout Mix',
        coverImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=300&h=300',
        isPublic: true,
        tracks: []
      },
      {
        name: 'My Weekly Mix',
        coverImage: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?auto=format&fit=crop&q=80&w=300&h=300',
        isPublic: false,
        tracks: []
      }
    ];
  }
}

export const storage = new MemStorage();
