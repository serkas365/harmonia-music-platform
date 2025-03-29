import { Track } from "@shared/schema";
import { Heart, Plus, Play } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useLibraryStore } from "@/stores/useLibraryStore";

interface TrackCardProps {
  track: Track;
  className?: string;
  compact?: boolean;
}

const TrackCard = ({ track, className, compact = false }: TrackCardProps) => {
  const { t } = useTranslation();
  const playTrack = usePlayerStore((state) => state.playTrack);
  const addLikedTrack = useLibraryStore((state) => state.addLikedTrack);
  const likedTracks = useLibraryStore((state) => state.likedTracks);
  
  const isLiked = likedTracks.some(t => t.id === track.id);
  
  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playTrack(track);
  };
  
  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addLikedTrack(track);
  };
  
  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Open playlist selection dialog
    console.log("Add to playlist:", track.id);
  };
  
  return (
    <div className={cn(
      "bg-background-elevated rounded-lg p-3 flex items-center hover:bg-background-highlight transition-colors group",
      className
    )}>
      <div className="w-14 h-14 rounded overflow-hidden mr-3 flex-shrink-0">
        {/* This would typically be the album cover */}
        <div className="w-full h-full bg-background-highlight flex items-center justify-center">
          <span className="text-xs truncate">{track.albumTitle}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm truncate">{track.title}</h3>
        <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
        <div className="flex items-center mt-1">
          <span className="text-xs text-primary mr-2">{formatTime(track.duration)}</span>
          {track.explicit && (
            <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-sm uppercase font-semibold">
              {t('tracks.explicit')}
            </span>
          )}
          {track.purchaseAvailable && (
            <span className="text-xs bg-secondary/20 text-secondary px-1.5 py-0.5 rounded-sm uppercase font-semibold ml-1">
              {t('tracks.forPurchase')}
            </span>
          )}
          {!track.purchaseAvailable && (
            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-sm uppercase font-semibold ml-1">
              {t('tracks.premium')}
            </span>
          )}
        </div>
      </div>
      {!compact && (
        <div className="flex items-center space-x-3 ml-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-white h-8 w-8"
            onClick={handleLike}
          >
            <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-white h-8 w-8"
            onClick={handleAddToPlaylist}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="bg-primary hover:bg-primary/90 text-white rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handlePlay}
          >
            <Play className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default TrackCard;
