import { usePlayerStore } from "@/stores/usePlayerStore";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Heart 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect, useRef } from "react";
import { formatTime } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface PlayerControlsProps {
  minimal?: boolean;
  showTrackInfo?: boolean;
  className?: string;
}

const PlayerControls = ({ 
  minimal = false, 
  showTrackInfo = true, 
  className 
}: PlayerControlsProps) => {
  const { t } = useTranslation();
  const [isSeeking, setIsSeeking] = useState(false);
  
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    repeatMode,
    isShuffled,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleShuffle,
    setRepeatMode,
    seekTo
  } = usePlayerStore();
  
  const handleSeek = (value: number[]) => {
    seekTo(value[0]);
  };
  
  const toggleRepeat = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };
  
  if (!currentTrack) {
    return null;
  }
  
  return (
    <div className={className}>
      {showTrackInfo && (
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 rounded overflow-hidden mr-3">
            {/* This would be the album art */}
            <div className="w-full h-full bg-background-highlight flex items-center justify-center">
              <span className="text-xs text-center truncate p-1">{currentTrack.albumTitle}</span>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-sm">{currentTrack.title}</h3>
            <p className="text-xs text-muted-foreground">{currentTrack.artistName}</p>
            <Button
              variant="ghost"
              size="icon"
              className="mt-1 text-muted-foreground hover:text-white h-7 w-7 p-0"
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-center space-x-4 mb-4">
        {!minimal && (
          <Button
            variant="ghost"
            size="icon"
            className={`text-muted-foreground hover:text-white h-8 w-8 ${isShuffled ? 'text-primary' : ''}`}
            onClick={toggleShuffle}
            title={t('player.shuffle')}
          >
            <Shuffle className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-white h-8 w-8"
          onClick={prevTrack}
          title={t('player.previous')}
        >
          <SkipBack className="h-5 w-5" />
        </Button>
        
        <Button
          variant="default"
          size="icon"
          className="bg-primary hover:bg-primary/90 text-white rounded-full h-10 w-10 flex items-center justify-center"
          onClick={togglePlay}
          title={isPlaying ? t('player.pause') : t('player.play')}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-white h-8 w-8"
          onClick={nextTrack}
          title={t('player.next')}
        >
          <SkipForward className="h-5 w-5" />
        </Button>
        
        {!minimal && (
          <Button
            variant="ghost"
            size="icon"
            className={`text-muted-foreground hover:text-white h-8 w-8 ${repeatMode !== 'off' ? 'text-primary' : ''}`}
            onClick={toggleRepeat}
            title={t('player.repeat')}
          >
            <Repeat className="h-4 w-4" />
            {repeatMode === 'one' && <span className="absolute text-[10px] font-bold">1</span>}
          </Button>
        )}
      </div>
      
      <div className="flex items-center">
        <span className="text-xs text-muted-foreground mr-2 w-8 text-right">
          {formatTime(progress)}
        </span>
        <div className="flex-1 h-1">
          <Slider
            value={[progress]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="h-1"
          />
        </div>
        <span className="text-xs text-muted-foreground ml-2 w-8">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

export default PlayerControls;
