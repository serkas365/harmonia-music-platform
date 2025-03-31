import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Volume2, 
  VolumeX, 
  ListMusic, 
  Maximize, 
  Heart, 
  Info,
  ShoppingCart
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import QueueManagement from "@/components/player/QueueManagement";

const MusicPlayer = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    progress,
    duration,
    repeatMode,
    isShuffled,
    isPreviewMode,
    previewDuration,
    togglePlay,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    setProgress,
    setDuration,
    toggleShuffle,
    setRepeatMode,
    exitPreviewMode,
  } = usePlayerStore();
  
  const likedTracks = useLibraryStore((state) => state.likedTracks);
  const addLikedTrack = useLibraryStore((state) => state.addLikedTrack);
  const removeLikedTrack = useLibraryStore((state) => state.removeLikedTrack);
  
  const isLiked = currentTrack ? likedTracks.some(track => track.id === currentTrack.id) : false;

  // Initialize audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (!isSeeking && audio.currentTime) {
        setProgress(audio.currentTime);
        
        // If in preview mode and we've reached the preview limit, pause the audio
        if (isPreviewMode && audio.currentTime >= previewDuration) {
          audio.pause();
          setIsLoading(false);
          
          // Show a toast notification with purchase option
          if (currentTrack && currentTrack.purchaseAvailable) {
            toast({
              title: t('player.previewLimitReached'),
              description: t('player.previewPurchaseMessage'),
              action: (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.href = '/store'}
                  className="mt-2"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {t('player.purchaseTrack')}
                </Button>
              ),
              duration: 5000, // Show for 5 seconds
            });
          }
        }
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const onEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(error => {
          console.error('Error replaying audio:', error);
        });
      } else {
        nextTrack();
      }
    };
    
    const onLoadStart = () => {
      setIsLoading(true);
    };
    
    const onError = () => {
      setIsLoading(false);
      console.error('Audio playback error');
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('loadstart', onLoadStart);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('loadstart', onLoadStart);
      audio.removeEventListener('error', onError);
    };
  }, [
    isSeeking, 
    isPreviewMode, 
    nextTrack, 
    previewDuration, 
    repeatMode, 
    setDuration, 
    setProgress, 
    toast, 
    t, 
    currentTrack
  ]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      setIsLoading(true);
      audio.play()
        .then(() => {
          setIsLoading(false);
        })
        .catch(error => {
          setIsLoading(false);
          console.error('Error playing audio:', error);
        });
    } else {
      audio.pause();
      setIsLoading(false);
    }
  }, [isPlaying]);

  // Handle track change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    setIsLoading(true);
    audio.src = currentTrack.audioUrl;
    setProgress(0);
    
    if (isPlaying) {
      audio.play()
        .then(() => {
          setIsLoading(false);
        })
        .catch(error => {
          setIsLoading(false);
          console.error('Error playing audio:', error);
        });
    }
  }, [currentTrack, isPlaying, setProgress]);

  // Handle volume change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const handleSeek = (value: number) => {
    setProgress(value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const toggleRepeat = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  if (!currentTrack) {
    return null; // Don't render player if no track is selected
  }

  return (
    <div className="fixed bottom-20 md:bottom-0 left-0 right-0 bg-background-elevated border-t border-gray-800 py-2 md:py-4 px-4 md:px-8 z-20">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />
      
      {/* Queue Management Dialog */}
      <QueueManagement 
        open={isQueueOpen} 
        onClose={() => setIsQueueOpen(false)} 
      />
      
      {/* Preview Mode Banner */}
      {isPreviewMode && currentTrack.purchaseAvailable && (
        <div className="bg-accent text-accent-foreground px-4 py-1 text-center text-sm">
          <span className="font-medium">{t('player.previewMode')}: {previewDuration} {t('player.previewSeconds')}</span>
          <button 
            className="underline font-semibold hover:text-primary transition-colors ml-2"
            onClick={() => {
              // Navigate to store page
              window.location.href = '/store';
            }}
          >
            {t('player.purchaseTrack')} ${(currentTrack.purchasePrice || 0) / 100}
          </button>
        </div>
      )}
      
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center">
          {/* Currently Playing */}
          <div className="flex items-center mr-4 flex-shrink-0">
            <div className="hidden sm:block w-14 h-14 rounded overflow-hidden mr-3 relative">
              {/* Album cover placeholder */}
              <div className="w-full h-full bg-background-highlight flex items-center justify-center">
                <span className="text-xs truncate">{currentTrack.albumTitle}</span>
              </div>
              {isLoading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 mr-4">
              <h4 className="font-bold text-sm truncate">{currentTrack.title}</h4>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.artistName}</p>
            </div>
            <div className="hidden sm:flex items-center space-x-3">
              <button 
                className={`hover:text-white ${isLiked ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={() => isLiked ? removeLikedTrack(currentTrack.id) : addLikedTrack(currentTrack)}
                title={isLiked ? t('player.unlike') : t('player.like')}
              >
                <Heart className="h-4 w-4" fill={isLiked ? 'currentColor' : 'none'} />
              </button>
              <button 
                className="text-muted-foreground hover:text-white"
                title={t('player.info')}
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Player Controls */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex items-center justify-center space-x-4 mb-2">
              <button 
                className={`text-muted-foreground hover:text-white hidden sm:block ${isShuffled ? 'text-primary' : ''}`}
                onClick={toggleShuffle}
                title={t('player.shuffle')}
                disabled={isLoading}
              >
                <Shuffle className="h-4 w-4" />
              </button>
              <button 
                className="text-muted-foreground hover:text-white"
                onClick={prevTrack}
                title={t('player.previous')}
                disabled={isLoading}
              >
                <SkipBack className="h-5 w-5" />
              </button>
              <Button
                variant="default"
                size="icon"
                className="bg-primary hover:bg-primary/90 text-white rounded-full h-10 w-10 flex items-center justify-center"
                onClick={togglePlay}
                title={isPlaying ? t('player.pause') : t('player.play')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              <button 
                className="text-muted-foreground hover:text-white"
                onClick={nextTrack}
                title={t('player.next')}
                disabled={isLoading}
              >
                <SkipForward className="h-5 w-5" />
              </button>
              <button 
                className={`text-muted-foreground hover:text-white hidden sm:block ${repeatMode !== 'off' ? 'text-primary' : ''}`}
                onClick={toggleRepeat}
                title={t('player.repeat')}
                disabled={isLoading}
              >
                <Repeat className="h-4 w-4" />
                {repeatMode === 'one' && <span className="absolute text-[10px] font-bold">1</span>}
              </button>
            </div>
            
            <div className="w-full max-w-xl flex items-center">
              <span className="text-xs text-muted-foreground mr-2 hidden sm:block">
                {formatTime(progress)}
              </span>
              <div className="relative flex-1 h-1">
                <Slider
                  value={[progress]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={(value) => handleSeek(value[0])}
                  className="h-1"
                  disabled={isLoading}
                />
              </div>
              <span className="text-xs text-muted-foreground ml-2 hidden sm:block">
                {formatTime(duration)}
              </span>
            </div>
          </div>
          
          {/* Volume Controls */}
          <div className="hidden md:flex items-center space-x-4 ml-4 flex-shrink-0">
            <button 
              className="text-muted-foreground hover:text-white"
              onClick={() => setIsQueueOpen(true)}
              title={t('player.queue')}
            >
              <ListMusic className="h-4 w-4" />
            </button>
            <button 
              className="text-muted-foreground hover:text-white"
              onClick={toggleMute}
              title={t('player.volume')}
            >
              {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <div className="w-24">
              <Slider
                value={[volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="h-1"
              />
            </div>
            <button 
              className="text-muted-foreground hover:text-white"
              title={t('player.fullscreen')}
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
