import { create } from 'zustand';
import { Album, Track, Playlist } from '@shared/schema';

interface LibraryState {
  likedTracks: Track[];
  likedAlbums: Album[];
  playlists: Playlist[];
  downloadedTracks: Track[];
  purchasedTracks: Track[];
  purchasedAlbums: Album[];
  
  // Actions
  addLikedTrack: (track: Track) => void;
  removeLikedTrack: (trackId: number) => void;
  addLikedAlbum: (album: Album) => void;
  removeLikedAlbum: (albumId: number) => void;
  addPlaylist: (playlist: Playlist) => void;
  updatePlaylist: (playlist: Playlist) => void;
  removePlaylist: (playlistId: number) => void;
  addTrackToPlaylist: (playlistId: number, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: number, trackId: number) => void;
  addDownloadedTrack: (track: Track) => void;
  removeDownloadedTrack: (trackId: number) => void;
  addPurchasedTrack: (track: Track) => void;
  addPurchasedAlbum: (album: Album) => void;
  clearLibrary: () => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  likedTracks: [],
  likedAlbums: [],
  playlists: [],
  downloadedTracks: [],
  purchasedTracks: [],
  purchasedAlbums: [],
  
  addLikedTrack: (track) => set((state) => ({
    likedTracks: [...state.likedTracks.filter(t => t.id !== track.id), track]
  })),
  
  removeLikedTrack: (trackId) => set((state) => ({
    likedTracks: state.likedTracks.filter(track => track.id !== trackId)
  })),
  
  addLikedAlbum: (album) => set((state) => ({
    likedAlbums: [...state.likedAlbums.filter(a => a.id !== album.id), album]
  })),
  
  removeLikedAlbum: (albumId) => set((state) => ({
    likedAlbums: state.likedAlbums.filter(album => album.id !== albumId)
  })),
  
  addPlaylist: (playlist) => set((state) => ({
    playlists: [...state.playlists, playlist]
  })),
  
  updatePlaylist: (playlist) => set((state) => ({
    playlists: state.playlists.map(p => 
      p.id === playlist.id ? playlist : p
    )
  })),
  
  removePlaylist: (playlistId) => set((state) => ({
    playlists: state.playlists.filter(playlist => playlist.id !== playlistId)
  })),
  
  addTrackToPlaylist: (playlistId, track) => set((state) => {
    const playlist = state.playlists.find(p => p.id === playlistId);
    if (!playlist || !playlist.tracks) return state;
    
    // Check if track is already in playlist
    if (playlist.tracks.some(t => t.trackId === track.id)) return state;
    
    const updatedPlaylist = {
      ...playlist,
      tracks: [...playlist.tracks, {
        id: Date.now(), // temporary ID
        playlistId,
        trackId: track.id,
        addedAt: new Date(),
        position: playlist.tracks.length,
        track
      }]
    };
    
    return {
      playlists: state.playlists.map(p => 
        p.id === playlistId ? updatedPlaylist : p
      )
    };
  }),
  
  removeTrackFromPlaylist: (playlistId, trackId) => set((state) => {
    const playlist = state.playlists.find(p => p.id === playlistId);
    if (!playlist || !playlist.tracks) return state;
    
    const updatedPlaylist = {
      ...playlist,
      tracks: playlist.tracks.filter(t => t.trackId !== trackId)
        .map((t, i) => ({ ...t, position: i }))
    };
    
    return {
      playlists: state.playlists.map(p => 
        p.id === playlistId ? updatedPlaylist : p
      )
    };
  }),
  
  addDownloadedTrack: (track) => set((state) => ({
    downloadedTracks: [...state.downloadedTracks.filter(t => t.id !== track.id), track]
  })),
  
  removeDownloadedTrack: (trackId) => set((state) => ({
    downloadedTracks: state.downloadedTracks.filter(track => track.id !== trackId)
  })),
  
  addPurchasedTrack: (track) => set((state) => ({
    purchasedTracks: [...state.purchasedTracks.filter(t => t.id !== track.id), track]
  })),
  
  addPurchasedAlbum: (album) => set((state) => ({
    purchasedAlbums: [...state.purchasedAlbums.filter(a => a.id !== album.id), album]
  })),
  
  clearLibrary: () => set({
    likedTracks: [],
    likedAlbums: [],
    playlists: [],
    downloadedTracks: [],
    purchasedTracks: [],
    purchasedAlbums: []
  })
}));
