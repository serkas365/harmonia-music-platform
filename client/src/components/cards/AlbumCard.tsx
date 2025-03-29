import { Album } from "@shared/schema";
import { Play } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface AlbumCardProps {
  album: Album;
  className?: string;
  showArtist?: boolean;
}

const AlbumCard = ({ album, className, showArtist = true }: AlbumCardProps) => {
  const playTracks = usePlayerStore((state) => state.playTracks);
  
  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (album.tracks && album.tracks.length > 0) {
      playTracks(album.tracks, 0);
    }
  };
  
  return (
    <Link href={`/albums/${album.id}`}>
      <a className={cn(
        "block bg-background-elevated rounded-lg overflow-hidden group hover:bg-background-highlight transition-all duration-300",
        className
      )}>
        <div className="relative aspect-square">
          <img 
            src={album.coverImage} 
            alt={`${album.title} by ${album.artistName}`} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <button 
            className="absolute right-2 bottom-2 bg-primary text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            onClick={handlePlay}
            aria-label="Play album"
          >
            <Play className="h-4 w-4" />
          </button>
        </div>
        <div className="p-3">
          <h3 className="font-bold text-sm truncate">{album.title}</h3>
          {showArtist && (
            <p className="text-xs text-muted-foreground truncate">{album.artistName}</p>
          )}
        </div>
      </a>
    </Link>
  );
};

export default AlbumCard;
