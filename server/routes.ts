import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

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
  
  const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized - Login required" });
  };

  // User Library
  app.get("/api/me/library/tracks/liked", ensureAuthenticated, async (req, res) => {
    try {
      const tracks = await storage.getUserLikedTracks(req.user.id);
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch liked tracks" });
    }
  });

  app.get("/api/me/library/albums/liked", ensureAuthenticated, async (req, res) => {
    try {
      const albums = await storage.getUserLikedAlbums(req.user.id);
      res.json(albums);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch liked albums" });
    }
  });

  app.get("/api/me/library/tracks/downloaded", ensureAuthenticated, async (req, res) => {
    try {
      const tracks = await storage.getUserDownloadedTracks(req.user.id);
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch downloaded tracks" });
    }
  });

  app.get("/api/me/library/tracks/purchased", ensureAuthenticated, async (req, res) => {
    try {
      const tracks = await storage.getUserPurchasedTracks(req.user.id);
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchased tracks" });
    }
  });

  app.get("/api/me/library/albums/purchased", ensureAuthenticated, async (req, res) => {
    try {
      const albums = await storage.getUserPurchasedAlbums(req.user.id);
      res.json(albums);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchased albums" });
    }
  });

  app.post("/api/me/library/tracks/:id/like", ensureAuthenticated, async (req, res) => {
    try {
      const trackId = parseInt(req.params.id);
      await storage.addTrackToUserLibrary(req.user.id, trackId, { isLiked: true });
      res.status(200).json({ message: "Track liked successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to like track" });
    }
  });

  app.delete("/api/me/library/tracks/:id/like", ensureAuthenticated, async (req, res) => {
    try {
      const trackId = parseInt(req.params.id);
      await storage.removeTrackFromUserLibrary(req.user.id, trackId);
      res.status(200).json({ message: "Track removed from likes" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove track from likes" });
    }
  });

  app.post("/api/me/library/albums/:id/like", ensureAuthenticated, async (req, res) => {
    try {
      const albumId = parseInt(req.params.id);
      await storage.addAlbumToUserLibrary(req.user.id, albumId, { isLiked: true });
      res.status(200).json({ message: "Album liked successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to like album" });
    }
  });

  app.delete("/api/me/library/albums/:id/like", ensureAuthenticated, async (req, res) => {
    try {
      const albumId = parseInt(req.params.id);
      await storage.removeAlbumFromUserLibrary(req.user.id, albumId);
      res.status(200).json({ message: "Album removed from likes" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove album from likes" });
    }
  });

  // Playlists
  app.get("/api/me/playlists", ensureAuthenticated, async (req, res) => {
    try {
      const playlists = await storage.getUserPlaylists(req.user.id);
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
      
      const playlist = await storage.createPlaylist(req.user.id, name, isPublic);
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
      if (req.user.id !== playlist.userId) {
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
      if (req.user.id !== playlist.userId) {
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
      if (req.user.id !== playlist.userId) {
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
      if (req.user.id !== playlist.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.removeTrackFromPlaylist(playlistId, trackId);
      res.status(200).json({ message: "Track removed from playlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove track from playlist" });
    }
  });

  // User settings
  app.get("/api/me/preferences", ensureAuthenticated, async (req, res) => {
    try {
      const preferences = await storage.getUserPreferences(req.user.id);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user preferences" });
    }
  });

  app.put("/api/me/preferences", ensureAuthenticated, async (req, res) => {
    try {
      const preferences = req.body;
      const updatedPreferences = await storage.saveUserPreferences(req.user.id, preferences);
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
      const subscription = await storage.getUserSubscription(req.user.id);
      res.json(subscription || { active: false });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user subscription" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
