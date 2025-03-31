import { Album } from "@shared/schema";
import { Play, ShoppingCart } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useCartStore } from "@/stores/useCartStore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface AlbumCardProps {
  album: Album;
  className?: string;
  showArtist?: boolean;
  showBuyButton?: boolean;
}

const AlbumCard = ({ album, className, showArtist = true, showBuyButton = false }: AlbumCardProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const playTracks = usePlayerStore((state) => state.playTracks);
  const addAlbumToCart = useCartStore((state) => state.addAlbum);
  const cartItems = useCartStore((state) => state.items);
  
  const isInCart = cartItems.some(item => item.id === album.id && item.type === 'album');
  
  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (album.tracks && album.tracks.length > 0) {
      playTracks(album.tracks, 0);
    }
  };
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addAlbumToCart(album);
    
    toast({
      title: t('cart.addedToCart'),
      description: `${album.title} - ${album.artistName}`,
    });
  };
  
  return (
    <div 
      className={cn(
        "block bg-background-elevated rounded-lg overflow-hidden group hover:bg-background-highlight transition-all duration-300 cursor-pointer",
        className
      )}
      onClick={() => window.location.href = `/albums/${album.id}`}
    >
      <div className="relative aspect-square">
        <img 
          src={album.coverImage} 
          alt={`${album.title} by ${album.artistName}`} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button 
          className="absolute right-2 bottom-2 bg-primary text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            handlePlay(e);
          }}
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
        
        {showBuyButton && (
          <div className="mt-3">
            <Button
              variant={isInCart ? "secondary" : "outline"}
              size="sm"
              className={cn(
                "w-full text-xs h-8",
                isInCart ? "bg-secondary/20 text-secondary border-secondary/20" : ""
              )}
              onClick={handleAddToCart}
              disabled={isInCart}
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              {isInCart ? t('store.addedToCart') : t('store.buyAlbum')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlbumCard;
