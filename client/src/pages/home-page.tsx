import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Album, Artist, Track, Playlist } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import AlbumCard from "@/components/cards/AlbumCard";
import ArtistCard from "@/components/cards/ArtistCard";
import TrackCard from "@/components/cards/TrackCard";
import PlaylistCard from "@/components/cards/PlaylistCard";
import { Button } from "@/components/ui/button";
import { Play, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

// Mock hero data (would be fetched from API)
const heroData = {
  title: "The Weekend",
  subtitle: "After Hours - Deluxe Edition",
  image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1200&h=400&crop=entropy",
};

const HomePage = () => {
  const { t } = useTranslation();
  
  // Fetch recently played albums
  const { data: recentlyPlayed, isLoading: isLoadingRecent } = useQuery<Album[]>({
    queryKey: ['/api/me/recently-played'],
    // This would typically come from the API, fallback for development
    queryFn: async () => {
      return [];
    }
  });
  
  // Fetch top artists
  const { data: topArtists, isLoading: isLoadingArtists } = useQuery<Artist[]>({
    queryKey: ['/api/me/top-artists'],
    // This would typically come from the API, fallback for development
    queryFn: async () => {
      return [];
    }
  });
  
  // Fetch new releases
  const { data: newReleases, isLoading: isLoadingReleases } = useQuery<Track[]>({
    queryKey: ['/api/new-releases'],
    // This would typically come from the API, fallback for development
    queryFn: async () => {
      return [];
    }
  });
  
  // Fetch personalized playlists
  const { data: madeForYou, isLoading: isLoadingPlaylists } = useQuery<Playlist[]>({
    queryKey: ['/api/me/made-for-you'],
    // This would typically come from the API, fallback for development
    queryFn: async () => {
      return [];
    }
  });

  // Use empty arrays if loading or undefined
  const albums = recentlyPlayed || [];
  const artists = topArtists || [];
  const tracks = newReleases || [];
  const playlists = madeForYou || [];
  
  return (
    <div className="p-4 md:p-8">
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
        <img 
          src={heroData.image} 
          alt="Music banner" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4 md:p-8">
          <span className="text-xs font-semibold text-primary-light mb-2 block">{t('common.newRelease')}</span>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{heroData.title}</h1>
          <p className="text-lg md:text-xl text-gray-300 mb-4">{heroData.subtitle}</p>
          <div className="flex space-x-3">
            <Button className="bg-primary hover:bg-primary-hover text-white rounded-full">
              <Play className="mr-2 h-4 w-4" /> {t('common.play')}
            </Button>
            <Button variant="outline" className="bg-background-elevated hover:bg-background-highlight text-white rounded-full">
              <ShoppingBag className="mr-2 h-4 w-4" /> {t('common.buy')}
            </Button>
          </div>
        </div>
      </div>

      {/* Recently Played Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold">{t('common.recentlyPlayed')}</h2>
          <Link href="/recently-played">
            <a className="text-sm text-muted-foreground hover:text-white">{t('common.seeAll')}</a>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {isLoadingRecent ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-background-elevated rounded-lg overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-3">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : albums.length > 0 ? (
            albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              <p>{t('common.recentlyPlayed')} {t('common.loading')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Top Artists Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold">{t('common.topArtists')}</h2>
          <Link href="/top-artists">
            <a className="text-sm text-muted-foreground hover:text-white">{t('common.seeAll')}</a>
          </Link>
        </div>
        
        <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
          {isLoadingArtists ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-32 md:w-40">
                <Skeleton className="aspect-square rounded-full mb-3" />
                <Skeleton className="h-4 w-20 mx-auto mb-2" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))
          ) : artists.length > 0 ? (
            artists.map((artist) => (
              <ArtistCard 
                key={artist.id} 
                artist={artist} 
                followers={Math.floor(Math.random() * 20000000)} // Mock follower count
              />
            ))
          ) : (
            <div className="flex-1 text-center py-8 text-muted-foreground">
              <p>{t('common.topArtists')} {t('common.loading')}</p>
            </div>
          )}
        </div>
      </section>

      {/* New Releases Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold">{t('common.newReleases')}</h2>
          <Link href="/new-releases">
            <a className="text-sm text-muted-foreground hover:text-white">{t('common.seeAll')}</a>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoadingReleases ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-background-elevated rounded-lg p-3 flex items-center">
                <Skeleton className="w-14 h-14 rounded mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))
          ) : tracks.length > 0 ? (
            tracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              <p>{t('common.newReleases')} {t('common.loading')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Made For You Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold">{t('common.madeForYou')}</h2>
          <Link href="/made-for-you">
            <a className="text-sm text-muted-foreground hover:text-white">{t('common.seeAll')}</a>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {isLoadingPlaylists ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-background-elevated rounded-lg overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-3">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : playlists.length > 0 ? (
            playlists.map((playlist) => (
              <PlaylistCard 
                key={playlist.id} 
                playlist={playlist} 
                overlayTitle={playlist.name.includes("Weekly") ? "Weekly Mix" : "Daily Mix"}
                tracks={playlist.tracks?.map(pt => pt.track).filter(Boolean)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              <p>{t('common.madeForYou')} {t('common.loading')}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
