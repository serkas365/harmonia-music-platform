import { 
  User, InsertUser, Track, Album, Artist, Playlist, 
  UserPreferences, UserSubscription, SubscriptionPlan
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
  
  currentUserId: number;
  currentTrackId: number;
  currentAlbumId: number;
  currentArtistId: number;
  currentPlaylistId: number;
  currentSubscriptionPlanId: number;
  currentUserSubscriptionId: number;
  
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
