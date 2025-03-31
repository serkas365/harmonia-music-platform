import { create } from 'zustand';
import { Track } from '@shared/schema';

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  history: Track[];
  volume: number;
  progress: number;
  duration: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: 'off' | 'all' | 'one';
  isPreviewMode: boolean;
  previewDuration: number;
  
  // Actions
  setCurrentTrack: (track: Track | null) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  playTrack: (track: Track, isPreview?: boolean) => void;
  playTracks: (tracks: Track[], startIndex: number, shuffle?: boolean) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  seekTo: (time: number) => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: 'off' | 'all' | 'one') => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  exitPreviewMode: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  queue: [],
  history: [],
  volume: 1,
  progress: 0,
  duration: 0,
  isMuted: false,
  isShuffled: false,
  repeatMode: 'off',
  isPreviewMode: false,
  previewDuration: 15, // 15 seconds preview
  
  setCurrentTrack: (track) => set({ currentTrack: track }),
  
  play: () => set({ isPlaying: true }),
  
  pause: () => set({ isPlaying: false }),
  
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  playTrack: (track, isPreview = false) => {
    const { currentTrack, history } = get();
    // Add current track to history if it exists
    if (currentTrack) {
      set({ history: [...history, currentTrack] });
    }
    set({ 
      currentTrack: track, 
      isPlaying: true, 
      progress: 0,
      isPreviewMode: isPreview
    });
  },
  
  playTracks: (tracks, startIndex, shuffle = false) => {
    const currentTrack = tracks[startIndex];
    let remainingTracks = [...tracks.slice(startIndex + 1), ...tracks.slice(0, startIndex)];
    
    // If shuffle is enabled, randomize the queue order
    if (shuffle) {
      remainingTracks = remainingTracks.sort(() => Math.random() - 0.5);
    }
    
    set({ 
      currentTrack, 
      queue: remainingTracks, 
      isPlaying: true, 
      progress: 0,
      isShuffled: shuffle 
    });
  },
  
  nextTrack: () => {
    const { currentTrack, queue, history, repeatMode } = get();
    if (queue.length === 0) {
      if (repeatMode === 'all' && history.length > 0) {
        // Start over with history
        const tracksToPlay = [...history];
        if (currentTrack) tracksToPlay.push(currentTrack);
        set({ 
          currentTrack: tracksToPlay[0], 
          queue: tracksToPlay.slice(1),
          history: [],
          progress: 0,
          isPlaying: true 
        });
      } else if (repeatMode === 'one' && currentTrack) {
        // Repeat current track
        set({ progress: 0, isPlaying: true });
      }
      return;
    }
    
    const nextTrack = queue[0];
    const newQueue = queue.slice(1);
    const newHistory = currentTrack ? [...history, currentTrack] : history;
    
    set({ 
      currentTrack: nextTrack, 
      queue: newQueue, 
      history: newHistory,
      progress: 0,
      isPlaying: true 
    });
  },
  
  prevTrack: () => {
    const { currentTrack, queue, history } = get();
    
    // If we're in the first few seconds of the track, go to previous track
    // Otherwise restart the current track
    if (get().progress > 3) {
      set({ progress: 0 });
      return;
    }
    
    if (history.length === 0) return;
    
    const prevTrack = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    const newQueue = currentTrack ? [currentTrack, ...queue] : queue;
    
    set({ 
      currentTrack: prevTrack, 
      queue: newQueue, 
      history: newHistory,
      progress: 0,
      isPlaying: true
    });
  },
  
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  
  toggleMute: () => {
    const { isMuted, volume } = get();
    set({ 
      isMuted: !isMuted,
      volume: isMuted ? (volume > 0 ? volume : 1) : 0
    });
  },
  
  setProgress: (progress) => set({ progress }),
  
  setDuration: (duration) => set({ duration }),
  
  seekTo: (time) => set({ progress: time }),
  
  toggleShuffle: () => {
    const { queue, isShuffled } = get();
    if (!isShuffled) {
      // Shuffle the queue
      const shuffledQueue = [...queue].sort(() => Math.random() - 0.5);
      set({ queue: shuffledQueue, isShuffled: true });
    } else {
      // We would need the original order here, but for simplicity
      // we'll just toggle the flag, in a real app you'd store the 
      // original order and restore it
      set({ isShuffled: false });
    }
  },
  
  setRepeatMode: (mode) => set({ repeatMode: mode }),
  
  addToQueue: (track) => set((state) => ({ 
    queue: [...state.queue, track] 
  })),
  
  removeFromQueue: (index) => set((state) => ({
    queue: state.queue.filter((_, i) => i !== index)
  })),
  
  clearQueue: () => set({ queue: [] }),
  
  exitPreviewMode: () => set({ isPreviewMode: false })
}));