import { Playlist, Track } from "@shared/schema";
import { Play } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface PlaylistCardProps {
  playlist: Playlist;
  overlayTitle: string;
  gradientColors?: string;
  tracks?: Track[];
  className?: string;
}

const PlaylistCard = ({ 
  playlist, 
  overlayTitle, 
  gradientColors = "from-primary to-accent", 
  tracks,
  className 
}: PlaylistCardProps) => {
  const playTracks = usePlayerStore((state) => state.playTracks);
  
  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (tracks && tracks.length > 0) {
      playTracks(tracks, 0);
    }
  };
  
  // Use up to 4 tracks for the grid visualization
  const displayTracks = tracks ? tracks.slice(0, 4) : [];
  
  return (
    <div 
      className={cn(
        "block bg-background-elevated rounded-lg overflow-hidden group hover:bg-background-highlight hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer",
        className
      )}
      onClick={() => window.location.href = `/playlists/${playlist.id}`} // We'll fix the navigation properly later
    >
      <div className="relative aspect-square">
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-gradient-to-r from-primary/90 to-accent/90 group-hover:opacity-90 transition-opacity",
          gradientColors
        )}>
          <div className="bg-black/75 px-4 py-3 rounded-md w-3/4 flex items-center justify-center border border-white/20 shadow-lg">
            <span className="text-white font-bold text-base md:text-lg text-center tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">{overlayTitle}</span>
          </div>
        </div>
        
        {displayTracks.length > 0 ? (
          <div className="grid grid-cols-2 h-full">
            {displayTracks.map((track, index) => (
              <div key={index} className="w-full h-full bg-background-highlight">
                {/* This would typically show album covers */}
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs text-center p-2 truncate">{track.title}</span>
                </div>
              </div>
            ))}
            
            {/* Fill in remaining grid spaces */}
            {Array.from({ length: 4 - displayTracks.length }).map((_, i) => (
              <div key={`empty-${i}`} className="w-full h-full bg-background-highlight"></div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full bg-background-highlight flex items-center justify-center">
            <span className="text-white opacity-70">No tracks</span>
          </div>
        )}
        
        <button 
          className="absolute right-2 bottom-2 bg-primary text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            handlePlay(e);
          }}
          aria-label="Play playlist"
        >
          <Play className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-sm truncate">{playlist.name}</h3>
        <p className="text-xs text-muted-foreground truncate">
          {displayTracks.length} tracks
        </p>
      </div>
    </div>
  );
};

export default PlaylistCard;
