import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import Stripe from "stripe";
import { auth } from "./firebase-admin";

// Initialize Stripe - will be null if no API key is provided
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Firebase authentication endpoints
  app.post("/api/auth/verify-token", async (req, res) => {
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        return res.status(400).json({ message: "ID token is required" });
      }
      
      // Verify the Firebase ID token
      const decodedToken = await auth.verifyIdToken(idToken);
      
      // Get or create user in our system
      let user = await storage.getUserByEmail(decodedToken.email || "");
      
      if (!user) {
        // Create a new user with Firebase info
        const displayName = decodedToken.name || decodedToken.email?.split('@')[0] || 'User';
        user = await storage.createUser({
          username: displayName,
          displayName: displayName,
          email: decodedToken.email || "",
          password: "", // Firebase handles authentication
          role: "listener",
          firebaseUid: decodedToken.uid,
          profileImage: decodedToken.picture || "",
        });
      } else if (!user.firebaseUid) {
        // Update existing user with Firebase UID if not set
        user = await storage.updateUser(user.id, {
          firebaseUid: decodedToken.uid,
          profileImage: user.profileImage || decodedToken.picture || "",
        }) || user;
      }
      
      // Add a password property to satisfy the Express.User interface
      const userWithPassword = { ...user, password: "" } as any;
      
      // Log in the user using session-based auth
      req.login(userWithPassword, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to create session" });
        }
        
        return res.status(200).json(user);
      });
    } catch (error: any) {
      console.error("Error verifying Firebase token:", error);
      res.status(401).json({ message: "Invalid token" });
    }
  });

  // API routes
  app.get("/api/tracks", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const tracks = await storage.getTracks(limit, offset);
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tracks" });
    }
  });

  app.get("/api/tracks/:id", async (req, res) => {
    try {
      const track = await storage.getTrack(parseInt(req.params.id));
      if (!track) {
        return res.status(404).json({ message: "Track not found" });
      }
      res.json(track);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch track" });
    }
  });
  
  app.get("/api/tracks/:id/similar", async (req, res) => {
    try {
      const trackId = parseInt(req.params.id);
      const track = await storage.getTrack(trackId);
      
      if (!track) {
        return res.status(404).json({ message: "Track not found" });
      }
      
      // For now, just fetch some tracks from the same artist
      // or with similar genres in a real app
      const artistTracks = await storage.getArtistTracks(track.artistId);
      
      // Filter out the original track and return up to 5 similar tracks
      const similarTracks = artistTracks
        .filter(t => t.id !== trackId)
        .slice(0, 5);
      
      res.json(similarTracks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch similar tracks" });
    }
  });

  app.get("/api/albums", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const albums = await storage.getAlbums(limit, offset);
      res.json(albums);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch albums" });
    }
  });

  app.get("/api/albums/:id", async (req, res) => {
    try {
      const album = await storage.getAlbum(parseInt(req.params.id));
      if (!album) {
        return res.status(404).json({ message: "Album not found" });
      }
      
      // Fetch album tracks
      const tracks = await storage.getAlbumTracks(album.id);
      const albumWithTracks = { ...album, tracks };
      
      res.json(albumWithTracks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch album" });
    }
  });

  app.get("/api/artists", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const artists = await storage.getArtists(limit, offset);
      res.json(artists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch artists" });
    }
  });

  app.get("/api/artists/:id", async (req, res) => {
    try {
      const artist = await storage.getArtist(parseInt(req.params.id));
      if (!artist) {
        return res.status(404).json({ message: "Artist not found" });
      }
      
      res.json(artist);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch artist" });
    }
  });
  
  app.get("/api/artists/:id/albums", async (req, res) => {
    try {
      const artistId = parseInt(req.params.id);
      const albums = await storage.getArtistAlbums(artistId);
      res.json(albums);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch artist albums" });
    }
  });
  
  app.get("/api/artists/:id/tracks", async (req, res) => {
    try {
      const artistId = parseInt(req.params.id);
      const tracks = await storage.getArtistTracks(artistId);
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch artist tracks" });
    }
  });

  app.get("/api/new-releases", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const tracks = await storage.getNewReleases(limit);
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch new releases" });
    }
  });

  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      
      const results = await storage.searchMusic(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // USER LIBRARY ROUTES
  // These routes should be protected - only accessible to authenticated users
  
  const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized - Login required" });
  };

  // User Library
  app.get("/api/me/library/tracks/liked", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const tracks = await storage.getUserLikedTracks(req.user!.id);
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch liked tracks" });
    }
  });

  app.get("/api/me/library/albums/liked", ensureAuthenticated, async (req, res) => {
    try {
      const albums = await storage.getUserLikedAlbums(req.user!.id);
      res.json(albums);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch liked albums" });
    }
  });

  app.get("/api/me/library/tracks/downloaded", ensureAuthenticated, async (req, res) => {
    try {
      const tracks = await storage.getUserDownloadedTracks(req.user!.id);
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch downloaded tracks" });
    }
  });

  app.get("/api/me/library/tracks/purchased", ensureAuthenticated, async (req, res) => {
    try {
      const tracks = await storage.getUserPurchasedTracks(req.user!.id);
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchased tracks" });
    }
  });

  app.get("/api/me/library/albums/purchased", ensureAuthenticated, async (req, res) => {
    try {
      const albums = await storage.getUserPurchasedAlbums(req.user!.id);
      res.json(albums);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchased albums" });
    }
  });

  app.post("/api/me/library/tracks/:id/like", ensureAuthenticated, async (req, res) => {
    try {
      const trackId = parseInt(req.params.id);
      await storage.addTrackToUserLibrary(req.user!.id, trackId, { isLiked: true });
      res.status(200).json({ message: "Track liked successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to like track" });
    }
  });

  app.delete("/api/me/library/tracks/:id/like", ensureAuthenticated, async (req, res) => {
    try {
      const trackId = parseInt(req.params.id);
      await storage.removeTrackFromUserLibrary(req.user!.id, trackId);
      res.status(200).json({ message: "Track removed from likes" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove track from likes" });
    }
  });

  app.post("/api/me/library/albums/:id/like", ensureAuthenticated, async (req, res) => {
    try {
      const albumId = parseInt(req.params.id);
      await storage.addAlbumToUserLibrary(req.user!.id, albumId, { isLiked: true });
      res.status(200).json({ message: "Album liked successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to like album" });
    }
  });

  app.delete("/api/me/library/albums/:id/like", ensureAuthenticated, async (req, res) => {
    try {
      const albumId = parseInt(req.params.id);
      await storage.removeAlbumFromUserLibrary(req.user!.id, albumId);
      res.status(200).json({ message: "Album removed from likes" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove album from likes" });
    }
  });

  // Playlists
  app.get("/api/me/playlists", ensureAuthenticated, async (req, res) => {
    try {
      const playlists = await storage.getUserPlaylists(req.user!.id);
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch playlists" });
    }
  });

  app.get("/api/playlists/:id", async (req, res) => {
    try {
      const playlist = await storage.getPlaylist(parseInt(req.params.id));
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      // Only allow access to private playlists if the user owns them
      if (!playlist.isPublic && (!req.user || req.user.id !== playlist.userId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(playlist);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch playlist" });
    }
  });

  app.post("/api/playlists", ensureAuthenticated, async (req, res) => {
    try {
      const { name, isPublic } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Playlist name is required" });
      }
      
      const playlist = await storage.createPlaylist(req.user!.id, name, isPublic);
      res.status(201).json(playlist);
    } catch (error) {
      res.status(500).json({ message: "Failed to create playlist" });
    }
  });

  app.put("/api/playlists/:id", ensureAuthenticated, async (req, res) => {
    try {
      const playlistId = parseInt(req.params.id);
      const playlist = await storage.getPlaylist(playlistId);
      
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      // Only allow updates to playlists owned by the user
      if (req.user!.id !== playlist.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { name, isPublic } = req.body;
      const updatedPlaylist = await storage.updatePlaylist(playlistId, { name, isPublic });
      res.json(updatedPlaylist);
    } catch (error) {
      res.status(500).json({ message: "Failed to update playlist" });
    }
  });

  app.delete("/api/playlists/:id", ensureAuthenticated, async (req, res) => {
    try {
      const playlistId = parseInt(req.params.id);
      const playlist = await storage.getPlaylist(playlistId);
      
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      // Only allow deletion of playlists owned by the user
      if (req.user!.id !== playlist.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deletePlaylist(playlistId);
      res.status(200).json({ message: "Playlist deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete playlist" });
    }
  });

  app.post("/api/playlists/:id/tracks", ensureAuthenticated, async (req, res) => {
    try {
      const playlistId = parseInt(req.params.id);
      const { trackId, position = 0 } = req.body;
      
      if (!trackId) {
        return res.status(400).json({ message: "Track ID is required" });
      }
      
      const playlist = await storage.getPlaylist(playlistId);
      
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      // Only allow adding tracks to playlists owned by the user
      if (req.user!.id !== playlist.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.addTrackToPlaylist(playlistId, parseInt(trackId), position);
      res.status(200).json({ message: "Track added to playlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to add track to playlist" });
    }
  });

  app.delete("/api/playlists/:id/tracks/:trackId", ensureAuthenticated, async (req, res) => {
    try {
      const playlistId = parseInt(req.params.id);
      const trackId = parseInt(req.params.trackId);
      
      const playlist = await storage.getPlaylist(playlistId);
      
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      // Only allow removing tracks from playlists owned by the user
      if (req.user!.id !== playlist.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.removeTrackFromPlaylist(playlistId, trackId);
      res.status(200).json({ message: "Track removed from playlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove track from playlist" });
    }
  });

  // User profile and settings
  app.get("/api/me", ensureAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });
  
  app.patch("/api/me", ensureAuthenticated, async (req, res) => {
    try {
      const { displayName, profileImage } = req.body;
      const updatedUser = await storage.updateUser(req.user!.id, { 
        displayName, 
        profileImage 
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  app.get("/api/me/preferences", ensureAuthenticated, async (req, res) => {
    try {
      const preferences = await storage.getUserPreferences(req.user!.id);
      if (!preferences) {
        return res.status(404).json({ message: "User preferences not found" });
      }
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user preferences" });
    }
  });

  app.post("/api/me/preferences", ensureAuthenticated, async (req, res) => {
    try {
      const preferences = req.body;
      const updatedPreferences = await storage.saveUserPreferences(req.user!.id, preferences);
      res.json(updatedPreferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });
  
  // Keep this for backward compatibility
  app.put("/api/me/preferences", ensureAuthenticated, async (req, res) => {
    try {
      const preferences = req.body;
      const updatedPreferences = await storage.saveUserPreferences(req.user!.id, preferences);
      res.json(updatedPreferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });

  // Subscription plans
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.get("/api/me/subscription", ensureAuthenticated, async (req, res) => {
    try {
      const subscription = await storage.getUserSubscription(req.user!.id);
      res.json(subscription || { active: false });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user subscription" });
    }
  });
  
  app.post("/api/me/subscription", ensureAuthenticated, async (req, res) => {
    try {
      const { planId } = req.body;
      
      if (!planId || typeof planId !== 'number') {
        return res.status(400).json({ message: "Valid plan ID is required" });
      }
      
      // Verify that the plan exists
      const plan = await storage.getSubscriptionPlans().then(plans => 
        plans.find(p => p.id === planId)
      );
      
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Check if user already has a subscription
      const existingSubscription = await storage.getUserSubscription(req.user!.id);
      
      // For demo purposes, we'll handle both cases simply without Stripe integration
      const subscriptionData = {
        userId: req.user!.id,
        planId: planId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        autoRenew: true,
        paymentMethod: 'credit_card', // Simplified for demo
      };
      
      let subscription;
      
      if (existingSubscription) {
        // Update existing subscription
        subscription = await storage.updateUserSubscription(existingSubscription.id, {
          ...subscriptionData
        });
      } else {
        // Create new subscription
        subscription = await storage.createUserSubscription(subscriptionData);
      }
      
      res.status(200).json({ 
        success: true, 
        subscription,
        message: "Subscription updated successfully" 
      });
    } catch (error) {
      console.error("Subscription update error:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", ensureAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ 
          message: "Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables." 
        });
      }

      const { items, amount } = req.body;
      
      if (!items || !items.length) {
        return res.status(400).json({ message: "No items provided for purchase" });
      }

      // Validate amount
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // In a production app, you'd calculate the amount server-side
      // based on the items to prevent tampering
      const totalAmount = Math.round(amount * 100); // Convert to cents

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: "usd",
        // In a real app, you might want to store which items were purchased
        metadata: {
          userId: req.user!.id.toString(),
          items: JSON.stringify(items.map((item: {id: number; type: string}) => ({ id: item.id, type: item.type })))
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.status(200).json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        message: "Failed to create payment intent", 
        error: error.message 
      });
    }
  });

  // Webhook endpoint to handle Stripe events (payment succeeded, failed, etc.)
  app.post("/api/webhook", async (req, res) => {
    // This endpoint would usually validate the webhook signature
    // and process events like 'payment_intent.succeeded'
    // In a real app, you would add the purchased items to the user's library here
    
    // For simplicity in this prototype, we'll handle purchase operations client-side
    res.status(200).json({ received: true });
  });

  // Handle successful payments
  app.post("/api/payment-success", ensureAuthenticated, async (req, res) => {
    try {
      const { paymentIntentId, items } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID is required" });
      }
      
      if (!items || !items.length) {
        return res.status(400).json({ message: "No items provided" });
      }
      
      // In a real app, you would verify the payment was successful with Stripe
      // and then add the items to the user's library
      
      // Process purchased items
      for (const item of items as Array<{id: number; type: string}>) {
        if (item.type === 'track') {
          await storage.addTrackToUserLibrary(req.user!.id, item.id, { isPurchased: true });
        } else if (item.type === 'album') {
          await storage.addAlbumToUserLibrary(req.user!.id, item.id, { isPurchased: true });
        }
      }
      
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error processing payment success:", error);
      res.status(500).json({ 
        message: "Failed to process payment success", 
        error: error.message 
      });
    }
  });

  // Artist Profile and Dashboard Routes
  
  // Artist profile management
  app.get("/api/me/artist-profile", ensureAuthenticated, async (req, res) => {
    try {
      // Check if user is an artist
      if (!req.user!.role || (req.user!.role !== 'artist' && req.user!.role !== 'admin')) {
        return res.status(403).json({ message: "Access denied - Artist role required" });
      }
      
      // Verify the user has an artist profile
      if (!req.user!.artistId) {
        return res.status(404).json({ message: "Artist profile not found" });
      }
      
      const artist = await storage.getArtist(req.user!.artistId);
      if (!artist) {
        return res.status(404).json({ message: "Artist profile not found" });
      }
      
      res.json(artist);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch artist profile" });
    }
  });
  
  app.patch("/api/me/artist-profile", ensureAuthenticated, async (req, res) => {
    try {
      // Check if user is an artist
      if (!req.user!.role || (req.user!.role !== 'artist' && req.user!.role !== 'admin')) {
        return res.status(403).json({ message: "Access denied - Artist role required" });
      }
      
      // Verify the user has an artist profile
      if (!req.user!.artistId) {
        return res.status(404).json({ message: "Artist profile not found" });
      }
      
      const artistId = req.user!.artistId;
      const updates = req.body;
      
      // Validate updates
      if (!updates) {
        return res.status(400).json({ message: "No updates provided" });
      }
      
      // Get current artist data
      const currentArtist = await storage.getArtist(artistId);
      if (!currentArtist) {
        return res.status(404).json({ message: "Artist profile not found" });
      }
      
      // Prepare updates while maintaining data integrity
      const updatedArtist = {
        ...currentArtist,
        ...updates,
        // Handle socialLinks specially, as it's an object
        socialLinks: {
          ...currentArtist.socialLinks,
          ...(updates.socialLinks || {})
        }
      };
      
      // If genre property is being set, make sure genres array is updated too
      if (updates.genre && typeof updates.genre === 'string') {
        // If it's the first genre or replacing empty genres
        if (!updatedArtist.genres || updatedArtist.genres.length === 0) {
          updatedArtist.genres = [updates.genre];
        } 
        // Otherwise, update the first genre in the array
        else if (updatedArtist.genres.length > 0) {
          updatedArtist.genres[0] = updates.genre;
        }
      }
      
      const result = await storage.updateArtist(artistId, updatedArtist);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to update artist profile" });
    }
  });
  
  // Artist dashboard analytics - requires artist role
  const ensureArtistRole = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user && (req.user.role === 'artist' || req.user.role === 'admin')) {
      return next();
    }
    res.status(403).json({ message: "Access denied - Artist role required" });
  };
  
  app.get("/api/artist-dashboard/analytics", ensureArtistRole, async (req, res) => {
    try {
      // Verify the user has an artist profile
      if (!req.user!.artistId) {
        return res.status(404).json({ message: "Artist profile not found" });
      }
      
      const period = (req.query.period as 'day' | 'week' | 'month' | 'year' | 'all') || 'all';
      const analytics = await storage.getArtistAnalytics(req.user!.artistId, period);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch artist analytics" });
    }
  });
  
  app.get("/api/artist-dashboard/followers", ensureArtistRole, async (req, res) => {
    try {
      // Verify the user has an artist profile
      if (!req.user!.artistId) {
        return res.status(404).json({ message: "Artist profile not found" });
      }
      
      const followers = await storage.getArtistFollowers(req.user!.artistId);
      res.json(followers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch artist followers" });
    }
  });
  
  // Artist Events
  app.get("/api/artist-dashboard/events", ensureArtistRole, async (req, res) => {
    try {
      // Verify the user has an artist profile
      if (!req.user!.artistId) {
        return res.status(404).json({ message: "Artist profile not found" });
      }
      
      const events = await storage.getArtistEvents(req.user!.artistId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch artist events" });
    }
  });
  
  app.get("/api/artist-dashboard/events/:id", ensureArtistRole, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getArtistEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Verify the requesting artist is the owner of this event
      if (event.artistId !== req.user!.artistId) {
        return res.status(403).json({ message: "Not authorized to access this event" });
      }
      
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event details" });
    }
  });
  
  app.post("/api/artist-dashboard/events", ensureArtistRole, async (req, res) => {
    try {
      // Verify the user has an artist profile
      if (!req.user!.artistId) {
        return res.status(404).json({ message: "Artist profile not found" });
      }
      
      const eventData = {
        ...req.body,
        artistId: req.user!.artistId
      };
      
      const event = await storage.createArtistEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to create event" });
    }
  });
  
  app.put("/api/artist-dashboard/events/:id", ensureArtistRole, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getArtistEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Verify the requesting artist is the owner of this event
      if (event.artistId !== req.user!.artistId) {
        return res.status(403).json({ message: "Not authorized to modify this event" });
      }
      
      const updatedEvent = await storage.updateArtistEvent(eventId, req.body);
      res.json(updatedEvent);
    } catch (error) {
      res.status(500).json({ message: "Failed to update event" });
    }
  });
  
  app.delete("/api/artist-dashboard/events/:id", ensureArtistRole, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getArtistEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Verify the requesting artist is the owner of this event
      if (event.artistId !== req.user!.artistId) {
        return res.status(403).json({ message: "Not authorized to delete this event" });
      }
      
      await storage.deleteArtistEvent(eventId);
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });
  
  // Public events endpoint to get events for a specific artist
  app.get("/api/artists/:id/events", async (req, res) => {
    try {
      const artistId = parseInt(req.params.id);
      const events = await storage.getArtistEvents(artistId);
      
      // Sort events by date (upcoming first)
      const sortedEvents = events.sort((a, b) => 
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      );
      
      res.json(sortedEvents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch artist events" });
    }
  });
  
  // Artist Follow/Unfollow
  app.post("/api/artists/:id/follow", ensureAuthenticated, async (req, res) => {
    try {
      const artistId = parseInt(req.params.id);
      await storage.followArtist(req.user!.id, artistId);
      res.status(200).json({ message: "Artist followed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to follow artist" });
    }
  });
  
  app.delete("/api/artists/:id/follow", ensureAuthenticated, async (req, res) => {
    try {
      const artistId = parseInt(req.params.id);
      await storage.unfollowArtist(req.user!.id, artistId);
      res.status(200).json({ message: "Artist unfollowed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to unfollow artist" });
    }
  });
  
  app.get("/api/artists/:id/follow", ensureAuthenticated, async (req, res) => {
    try {
      const artistId = parseInt(req.params.id);
      const isFollowing = await storage.isFollowingArtist(req.user!.id, artistId);
      res.json({ following: isFollowing });
    } catch (error) {
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });
  
  // API endpoint to get YouTube videos for an artist
  app.get("/api/artists/:id/youtube-videos", async (req, res) => {
    try {
      const artistId = parseInt(req.params.id);
      const artist = await storage.getArtist(artistId);
      
      if (!artist) {
        return res.status(404).json({ message: "Artist not found" });
      }
      
      // Sample YouTube videos for demonstration purposes
      // In a real app, this would fetch from YouTube API using the artist's YouTube channel ID
      const videos = [
        {
          id: "dQw4w9WgXcQ", // Sample YouTube video ID
          title: `${artist.name} - Official Music Video`,
          thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
        },
        {
          id: "jNQXAC9IVRw", // Sample YouTube video ID
          title: `${artist.name} - Live at Madison Square Garden`,
          thumbnailUrl: "https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg"
        },
        {
          id: "VYOjWnS4cMY", // Sample YouTube video ID
          title: `${artist.name} - Acoustic Session`,
          thumbnailUrl: "https://img.youtube.com/vi/VYOjWnS4cMY/maxresdefault.jpg"
        },
        {
          id: "9bZkp7q19f0", // Sample YouTube video ID
          title: `${artist.name} - Behind the Scenes`,
          thumbnailUrl: "https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg"
        }
      ];
      
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch YouTube videos" });
    }
  });
  
  // API endpoint to get videos for an artist (alternate endpoint for backward compatibility)
  app.get("/api/artists/:id/videos", async (req, res) => {
    try {
      const artistId = parseInt(req.params.id);
      const artist = await storage.getArtist(artistId);
      
      if (!artist) {
        return res.status(404).json({ message: "Artist not found" });
      }
      
      // Use same sample videos as the youtube-videos endpoint
      const videos = [
        {
          id: "dQw4w9WgXcQ",
          title: `${artist.name} - Official Music Video`,
          thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
        },
        {
          id: "jNQXAC9IVRw",
          title: `${artist.name} - Live at Madison Square Garden`,
          thumbnailUrl: "https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg"
        },
        {
          id: "VYOjWnS4cMY",
          title: `${artist.name} - Acoustic Session`,
          thumbnailUrl: "https://img.youtube.com/vi/VYOjWnS4cMY/maxresdefault.jpg"
        },
        {
          id: "9bZkp7q19f0",
          title: `${artist.name} - Behind the Scenes`,
          thumbnailUrl: "https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg"
        }
      ];
      
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });
  
  // Get artist's social media posts (Twitter/Instagram)
  app.get("/api/artists/:id/social-posts", async (req, res) => {
    try {
      const artistId = parseInt(req.params.id);
      const platform = req.query.platform as string || 'twitter';
      const artist = await storage.getArtist(artistId);
      
      if (!artist) {
        return res.status(404).json({ message: "Artist not found" });
      }
      
      const now = new Date();
      const day = 24 * 60 * 60 * 1000; // 1 day in milliseconds
      
      if (platform === 'twitter' && artist.twitterUsername) {
        const twitterPosts = [
          {
            id: `twitter-${artistId}-1`,
            platform: 'twitter',
            content: `Just finished recording our new single! Can't wait for you all to hear it. 🎵 #NewMusic #ComingSoon`,
            url: 'https://twitter.com',
            date: new Date(now.getTime() - 2 * day).toISOString(),
            likes: 128,
            comments: 24,
            shares: 15,
            userLiked: false,
            userCommented: false,
            userShared: false
          },
          {
            id: `twitter-${artistId}-2`,
            platform: 'twitter',
            content: `Tickets for our summer tour are now available! Get them before they sell out. Link in bio. 🎫 #Tour #LiveMusic`,
            imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
            url: 'https://twitter.com',
            date: new Date(now.getTime() - 4 * day).toISOString(),
            likes: 245,
            comments: 42,
            shares: 78,
            userLiked: false,
            userCommented: false,
            userShared: false
          },
          {
            id: `twitter-${artistId}-3`,
            platform: 'twitter',
            content: `Thank you to everyone who came to our show last night! You were amazing! ❤️`,
            url: 'https://twitter.com',
            date: new Date(now.getTime() - 6 * day).toISOString(),
            likes: 312,
            comments: 18,
            shares: 5,
            userLiked: false,
            userCommented: false,
            userShared: false
          },
          {
            id: `twitter-${artistId}-4`,
            platform: 'twitter',
            content: `We're excited to announce we'll be performing at @MusicFestival this year! See you there! 🎉 #Festival #LiveMusic`,
            imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
            url: 'https://twitter.com',
            date: new Date(now.getTime() - 8 * day).toISOString(),
            likes: 518,
            comments: 64,
            shares: 93,
            userLiked: false,
            userCommented: false,
            userShared: false
          }
        ];
        
        return res.json(twitterPosts);
      } else if (platform === 'instagram' && artist.instagramUsername) {
        const instagramPosts = [
          {
            id: `instagram-${artistId}-1`,
            platform: 'instagram',
            content: `Studio session today. Working on something special for you all. 🎧 #StudioLife`,
            imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1528&q=80',
            url: 'https://instagram.com',
            date: new Date(now.getTime() - 1 * day).toISOString(),
            likes: 2458,
            comments: 143,
            shares: 56,
            userLiked: false,
            userCommented: false,
            userShared: false
          },
          {
            id: `instagram-${artistId}-2`,
            platform: 'instagram',
            content: `Behind the scenes from our latest music video shoot. 🎬 #BTS #MusicVideo`,
            imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
            url: 'https://instagram.com',
            date: new Date(now.getTime() - 3 * day).toISOString(),
            likes: 3124,
            comments: 198,
            shares: 73,
            userLiked: false,
            userCommented: false,
            userShared: false
          },
          {
            id: `instagram-${artistId}-3`,
            platform: 'instagram',
            content: `New merch drop! Link in bio to shop. 👕 #MerchDrop`,
            imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
            url: 'https://instagram.com',
            date: new Date(now.getTime() - 5 * day).toISOString(),
            likes: 1893,
            comments: 87,
            shares: 41,
            userLiked: false,
            userCommented: false,
            userShared: false
          },
          {
            id: `instagram-${artistId}-4`,
            platform: 'instagram',
            content: `Soundcheck for tonight's show. See you soon! 🎤 #TourLife`,
            imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
            url: 'https://instagram.com',
            date: new Date(now.getTime() - 7 * day).toISOString(),
            likes: 2751,
            comments: 124,
            shares: 38,
            userLiked: false,
            userCommented: false,
            userShared: false
          }
        ];
        
        return res.json(instagramPosts);
      }
      
      return res.json([]);
    } catch (error) {
      console.error('Error fetching social posts:', error);
      res.status(500).json({ message: "Failed to fetch social posts" });
    }
  });
  
  // Handle social media interactions
  app.post("/api/social/like", async (req, res) => {
    try {
      // In a real app, this would interact with the social platform's API
      // or track user likes in our database
      
      // For now, just return success
      res.json({ success: true });
    } catch (error) {
      console.error('Error processing social interaction:', error);
      res.status(500).json({ message: "Failed to process interaction" });
    }
  });

  // Handle social media comments
  app.post("/api/social/comment", async (req, res) => {
    try {
      const { postId, platform, comment } = req.body;
      
      if (!postId || !platform || !comment) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // In a real app, this would store the comment in a database
      // and potentially forward to the social platform's API
      console.log(`New comment on ${platform} post ${postId}: ${comment}`);
      
      // Mock successful response
      res.status(200).json({ 
        success: true,
        comment: {
          id: `comment-${Date.now()}`,
          content: comment,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });
  
  // Handle social media shares
  app.post("/api/social/share", async (req, res) => {
    try {
      const { postId, platform } = req.body;
      
      if (!postId || !platform) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // In a real app, this would track shares in the database
      // and potentially integrate with the social platform's sharing API
      console.log(`Sharing ${platform} post ${postId}`);
      
      // Mock successful response
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error sharing post:", error);
      res.status(500).json({ message: "Failed to share post" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
