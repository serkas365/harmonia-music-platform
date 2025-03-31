import { useState } from "react";
import { useParams, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Track, Album } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { 
  Play, 
  Heart,
  Share,
  DownloadCloud,
  Plus,
  MoreHorizontal,
  Music,
  Disc
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
import AlbumCard from "@/components/cards/AlbumCard";
import TrackCard from "@/components/cards/TrackCard";

const TrackPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const playTrack = usePlayerStore((state) => state.playTrack);
  const addLikedTrack = useLibraryStore((state) => state.addLikedTrack);
  const likedTracks = useLibraryStore((state) => state.likedTracks);
  const addToCart = useCartStore((state) => state.addTrack);
  
  // Fetch track details
  const {
    data: track,
    isLoading: isLoadingTrack,
    error: trackError,
  } = useQuery<Track>({
    queryKey: [`/api/tracks/${id}`],
    enabled: !!id,
  });
  
  // Fetch album for this track
  const {
    data: album,
    isLoading: isLoadingAlbum,
  } = useQuery<Album>({
    queryKey: [`/api/albums/${track?.albumId}`],
    enabled: !!track?.albumId,
  });
  
  // Fetch similar tracks
  const {
    data: similarTracks,
    isLoading: isLoadingSimilarTracks,
  } = useQuery<Track[]>({
    queryKey: [`/api/tracks/${id}/similar`],
    enabled: !!id,
  });
  
  // Check if this track is liked by the user
  const isLiked = track ? likedTracks.some(t => t.id === track.id) : false;
  
  // Handle play track
  const handlePlayTrack = () => {
    if (track) {
      playTrack(track);
    }
  };
  
  // Handle like track
  const handleLikeTrack = () => {
    if (track) {
      addLikedTrack(track);
    }
  };
  
  // Handle add to cart
  const handleAddToCart = () => {
    if (track) {
      addToCart(track);
    }
  };
  
  if (trackError) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{t('common.error')}</h1>
          <p className="text-muted-foreground mb-4">{t('common.trackNotFound')}</p>
          <Button asChild>
            <Link href="/">{t('common.backToHome')}</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-6">
      {/* Track Header */}
      <div className="mb-8">
        {isLoadingTrack ? (
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
        ) : track && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-48 h-48 md:w-64 md:h-64 flex-shrink-0 bg-background-highlight flex items-center justify-center">
              {isLoadingAlbum ? (
                <Skeleton className="w-full h-full" />
              ) : album ? (
                <img 
                  src={album.coverImage} 
                  alt={album.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music className="w-16 h-16 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{track.title}</h1>
              <div className="flex items-center gap-1 mb-4">
                <Link href={`/artists/${track.artistId}`}>
                  <a className="text-primary hover:underline text-lg font-medium">
                    {track.artistName}
                  </a>
                </Link>
                <span className="text-muted-foreground mx-2">•</span>
                <Link href={`/albums/${track.albumId}`}>
                  <a className="text-muted-foreground hover:text-white text-lg">
                    {track.albumTitle}
                  </a>
                </Link>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {track.explicit && (
                  <span className="px-2 py-1 bg-accent/20 text-accent rounded text-xs font-semibold uppercase">
                    {t('tracks.explicit')}
                  </span>
                )}
                {track.purchaseAvailable && (
                  <span className="px-2 py-1 bg-secondary/20 text-secondary rounded text-xs font-semibold">
                    {t('tracks.forPurchase')} ${track.purchasePrice?.toFixed(2)}
                  </span>
                )}
                <span className="px-2 py-1 bg-background-highlight rounded text-xs">
                  {formatTime(track.duration)}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <Button 
                  variant="default" 
                  className="gap-2" 
                  onClick={handlePlayTrack}
                >
                  <Play className="h-4 w-4" /> {t('player.play')}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className={isLiked ? "text-primary" : ""}  
                  onClick={handleLikeTrack}
                >
                  <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
                </Button>
                {track.purchaseAvailable && (
                  <Button 
                    variant="secondary" 
                    className="gap-2"
                    onClick={handleAddToCart}
                  >
                    <DownloadCloud className="h-4 w-4" /> {t('store.buy')} ${track.purchasePrice?.toFixed(2)}
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
              
              {track.purchaseAvailable && (
                <p className="text-sm text-muted-foreground">
                  {t('store.purchaseInfo')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* From the album */}
      {track && album && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">{t('common.fromTheAlbum')}</h2>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-full sm:w-48 flex-shrink-0">
              <AlbumCard album={album} />
            </div>
            <div className="flex-1 w-full">
              <div className="bg-background-elevated rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3">{t('common.tracklist')}</h3>
                {album.tracks && album.tracks.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                    {album.tracks.map((albumTrack, index) => (
                      <div 
                        key={albumTrack.id}
                        className={`flex items-center justify-between p-2 rounded hover:bg-background-highlight 
                                  ${albumTrack.id === track.id ? 'bg-background-highlight' : ''}`}
                      >
                        <div className="flex items-center">
                          <div className="w-8 text-center text-muted-foreground text-sm">
                            {albumTrack.trackNumber}
                          </div>
                          <div>
                            <div className={`font-medium ${albumTrack.id === track.id ? 'text-primary' : ''}`}>
                              {albumTrack.title}
                            </div>
                            <div className="text-sm text-muted-foreground">{formatTime(albumTrack.duration)}</div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 opacity-0 hover:opacity-100 focus:opacity-100"
                          onClick={() => albumTrack.id !== track.id && playTrack(albumTrack)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>{t('common.noTracks')}</p>
                  </div>
                )}
                <div className="mt-4">
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/albums/${album.id}`}>
                      {t('common.viewAlbum')}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Similar Tracks */}
      <div>
        <h2 className="text-xl font-bold mb-4">{t('common.youMightAlsoLike')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoadingSimilarTracks ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-background-elevated rounded-lg p-3 flex items-center">
                <Skeleton className="w-14 h-14 rounded mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))
          ) : similarTracks && similarTracks.length > 0 ? (
            similarTracks.map(similarTrack => (
              <TrackCard key={similarTrack.id} track={similarTrack} />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground bg-background-elevated rounded-lg">
              <p>{t('common.noSimilarTracks')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackPage;