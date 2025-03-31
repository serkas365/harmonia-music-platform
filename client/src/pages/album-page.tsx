import { useState } from "react";
import { useParams, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Album, Track } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Play, 
  Shuffle,
  Heart,
  Share,
  DownloadCloud,
  Clock, 
  Plus,
  MoreHorizontal
} from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { useCartStore } from "@/stores/useCartStore";
import { formatTime, formatDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Extended Album interface with purchase properties for the store functionality
interface ExtendedAlbum extends Album {
  purchaseAvailable?: boolean;
  purchasePrice?: number;
}

const AlbumPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const playTracks = usePlayerStore((state) => state.playTracks);
  const addLikedAlbum = useLibraryStore((state) => state.addLikedAlbum);
  const likedAlbums = useLibraryStore((state) => state.likedAlbums);
  const addToCart = useCartStore((state) => state.addAlbum);
  
  // Fetch album details
  const {
    data: album,
    isLoading: isLoadingAlbum,
    error: albumError,
  } = useQuery<Album>({
    queryKey: [`/api/albums/${id}`],
    enabled: !!id,
  });
  
  // Check if this album is liked by the user
  const isLiked = album ? likedAlbums.some(a => a.id === album.id) : false;
  
  // Handle play album
  const handlePlayAlbum = () => {
    if (album && album.tracks && album.tracks.length > 0) {
      playTracks(album.tracks, 0);
    }
  };
  
  // Handle shuffle play
  const handleShufflePlay = () => {
    if (album && album.tracks && album.tracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * album.tracks.length);
      playTracks(album.tracks, randomIndex, true); // true enables shuffle mode
    }
  };
  
  // Handle like album
  const handleLikeAlbum = () => {
    if (album) {
      addLikedAlbum(album);
    }
  };
  
  // Handle add to cart
  const handleAddToCart = () => {
    if (album) {
      addToCart(album);
    }
  };
  
  // Handle track play
  const handlePlayTrack = (track: Track, index: number) => {
    if (album && album.tracks) {
      playTracks(album.tracks, index);
    }
  };
  
  if (albumError) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{t('common.error')}</h1>
          <p className="text-muted-foreground mb-4">{t('common.albumNotFound')}</p>
          <Button asChild>
            <Link href="/">{t('common.backToHome')}</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-6">
      {/* Album Header */}
      <div className="mb-8">
        {isLoadingAlbum ? (
          <div className="flex flex-col md:flex-row gap-6">
            <Skeleton className="w-48 h-48 md:w-64 md:h-64" />
            <div className="flex-1">
              <Skeleton className="h-10 w-48 mb-2" />
              <Skeleton className="h-5 w-36 mb-4" />
              <Skeleton className="h-5 w-24 mb-8" />
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
              </div>
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          </div>
        ) : album && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-48 h-48 md:w-64 md:h-64 flex-shrink-0">
              <img 
                src={album.coverImage} 
                alt={album.title}
                className="w-full h-full object-cover rounded-md shadow-lg"
              />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{album.title}</h1>
              <div className="flex items-center gap-1 mb-4">
                <Link href={`/artists/${album.artistId}`}>
                  <a className="text-primary hover:underline text-lg font-medium">
                    {album.artistName}
                  </a>
                </Link>
                <span className="text-muted-foreground mx-2">•</span>
                <span className="text-muted-foreground">
                  {formatDate(album.releaseDate)}
                </span>
                <span className="text-muted-foreground mx-2">•</span>
                <span className="text-muted-foreground">
                  {album.tracks ? album.tracks.length : 0} {t('common.tracks')}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {album.genres.map((genre, index) => (
                  <span key={index} className="px-3 py-1 bg-background-highlight rounded-full text-xs">
                    {genre}
                  </span>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <Button 
                  variant="default" 
                  className="gap-2" 
                  onClick={handlePlayAlbum}
                  disabled={!album.tracks || album.tracks.length === 0}
                >
                  <Play className="h-4 w-4" /> {t('player.play')}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleShufflePlay}
                  disabled={!album.tracks || album.tracks.length === 0}
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className={isLiked ? "text-primary" : ""}  
                  onClick={handleLikeAlbum}
                >
                  <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
                </Button>
                {/* Cast to ExtendedAlbum for purchase properties */}
                {(album as ExtendedAlbum).purchaseAvailable && (
                  <Button 
                    variant="secondary" 
                    className="gap-2"
                    onClick={handleAddToCart}
                  >
                    <DownloadCloud className="h-4 w-4" /> {t('store.buy')} ${(album as ExtendedAlbum).purchasePrice?.toFixed(2)}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(window.location.href)}>
                      <Share className="h-4 w-4 mr-2" /> {t('common.share')}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Plus className="h-4 w-4 mr-2" /> {t('common.addToPlaylist')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {(album as ExtendedAlbum).purchaseAvailable && (
                <p className="text-sm text-muted-foreground">
                  {t('store.purchaseInfo')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Track List */}
      <div>
        <h2 className="text-xl font-bold mb-4">{t('common.tracks')}</h2>
        
        {/* Track List Header */}
        <div className="grid grid-cols-[auto,1fr,auto] md:grid-cols-[auto,1fr,auto,auto] gap-4 border-b border-border px-4 py-2 text-sm text-muted-foreground">
          <div className="w-8 text-center">#</div>
          <div>{t('common.title')}</div>
          <div className="hidden md:block">{t('common.duration')}</div>
          <div className="w-10"></div>
        </div>
        
        {/* Track List Items */}
        <div className="divide-y divide-border">
          {isLoadingAlbum ? (
            // Loading skeletons
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[auto,1fr,auto] md:grid-cols-[auto,1fr,auto,auto] gap-4 px-4 py-3 hover:bg-background-highlight">
                <div className="w-8 text-center">
                  <Skeleton className="h-5 w-5 mx-auto" />
                </div>
                <div>
                  <Skeleton className="h-5 w-48 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="hidden md:block">
                  <Skeleton className="h-5 w-10" />
                </div>
                <div className="w-10">
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))
          ) : album && album.tracks ? (
            album.tracks.map((track, index) => (
              <div 
                key={track.id} 
                className="grid grid-cols-[auto,1fr,auto] md:grid-cols-[auto,1fr,auto,auto] gap-4 px-4 py-3 hover:bg-background-highlight group"
                onDoubleClick={() => handlePlayTrack(track, index)}
              >
                <div className="w-8 flex items-center justify-center">
                  <span className="group-hover:hidden">{track.trackNumber}</span>
                  <Play 
                    className="h-4 w-4 hidden group-hover:block cursor-pointer" 
                    onClick={() => handlePlayTrack(track, index)}
                  />
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <div className="font-medium truncate">{track.title}</div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    {track.explicit && (
                      <span className="mr-2 px-1.5 bg-accent/20 text-accent text-xs rounded uppercase font-semibold">
                        E
                      </span>
                    )}
                    {track.purchaseAvailable && (
                      <span className="mr-2 px-1.5 bg-secondary/20 text-secondary text-xs rounded uppercase font-semibold">
                        ${track.purchasePrice?.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="hidden md:flex items-center text-sm text-muted-foreground">
                  {formatTime(track.duration)}
                </div>
                <div className="w-10 flex items-center justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Heart className="h-4 w-4 mr-2" /> {t('common.addToLibrary')}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Plus className="h-4 w-4 mr-2" /> {t('common.addToPlaylist')}
                      </DropdownMenuItem>
                      {track.purchaseAvailable && (
                        <DropdownMenuItem>
                          <DownloadCloud className="h-4 w-4 mr-2" /> {t('store.buy')} ${track.purchasePrice?.toFixed(2)}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => navigator.clipboard.writeText(window.location.href)}>
                        <Share className="h-4 w-4 mr-2" /> {t('common.share')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('common.noTracks')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlbumPage;