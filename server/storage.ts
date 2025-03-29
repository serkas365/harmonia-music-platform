import { 
  User, InsertUser, Track, Album, Artist, Playlist, 
  UserPreferences, UserSubscription, SubscriptionPlan
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

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
  
  // Session Store
  sessionStore: session.SessionStore;
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
  
  currentUserId: number;
  currentTrackId: number;
  currentAlbumId: number;
  currentArtistId: number;
  currentPlaylistId: number;
  currentSubscriptionPlanId: number;
  currentUserSubscriptionId: number;
  
  sessionStore: session.SessionStore;

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
    
    this.currentUserId = 1;
    this.currentTrackId = 1;
    this.currentAlbumId = 1;
    this.currentArtistId = 1;
    this.currentPlaylistId = 1;
    this.currentSubscriptionPlanId = 1;
    this.currentUserSubscriptionId = 1;
    
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
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
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
      }
    };
    this.users.set(id, user);
    
    // Initialize empty collections for the user
    this.userLikedTracks.set(id, new Set());
    this.userLikedAlbums.set(id, new Set());
    this.userDownloadedTracks.set(id, new Set());
    this.userPurchasedTracks.set(id, new Set());
    this.userPurchasedAlbums.set(id, new Set());
    
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
  
  // Sample data initialization - this would be removed in a real application
  // but is useful for development purposes
  private initializeSampleData() {
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
  }
}

export const storage = new MemStorage();
