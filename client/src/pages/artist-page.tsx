import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Artist, Album, Track, ArtistEvent } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, ExternalLink, Calendar, Music, MapPin, Clock, Users, Ticket, Globe, User, Info, Play, History, Youtube, Instagram, Twitter, Facebook } from "lucide-react";
import AlbumCard from "@/components/cards/AlbumCard";
import TrackCard from "@/components/cards/TrackCard";
import { formatDate } from "@/lib/utils";
import YoutubeVideoSection from "@/components/youtube-video-section";
import SocialMediaFeed from "@/components/social-media-feed";
import FeaturedArtists from "@/components/featured-artists";
import { Badge } from "@/components/ui/badge";

// Video interface matching YoutubeVideoSection props
interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
}

// SocialPost interface matching SocialMediaFeed props
interface SocialPost {
  id: string;
  platform: 'twitter' | 'instagram';
  content: string;
  imageUrl?: string;
  postedAt: Date;
  likes: number;
  comments: number;
  url: string;
}

// Collaboration interface matching FeaturedArtists props
interface Collaboration {
  id: number;
  artistId: number;
  name: string;
  imageUrl: string;
  trackTitle: string;
  trackId: number;
}

// Default placeholder image for albums without cover art
const defaultAlbumCover = "https://placehold.co/400x400/333/FFF?text=No+Cover";

const ArtistPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch artist details
  const {
    data: artist,
    isLoading: isLoadingArtist,
    error: artistError,
  } = useQuery<Artist>({
    queryKey: [`/api/artists/${id}`],
    enabled: !!id,
  });
  
  // Fetch artist's albums
  const {
    data: albums,
    isLoading: isLoadingAlbums,
    error: albumsError,
  } = useQuery<Album[]>({
    queryKey: [`/api/artists/${id}/albums`],
    enabled: !!id,
  });
  
  // Fetch artist's tracks
  const {
    data: tracks,
    isLoading: isLoadingTracks,
    error: tracksError,
  } = useQuery<Track[]>({
    queryKey: [`/api/artists/${id}/tracks`],
    enabled: !!id,
  });
  
  // Fetch artist's events
  const {
    data: events,
    isLoading: isLoadingEvents,
    error: eventsError,
  } = useQuery<ArtistEvent[]>({
    queryKey: [`/api/artists/${id}/events`],
    enabled: !!id,
  });
  
  // Fetch artist's YouTube videos
  const {
    data: videos,
    isLoading: isLoadingVideos
  } = useQuery<Video[]>({
    queryKey: [`/api/artists/${id}/videos`],
    enabled: !!id,
  });
  
  // Fetch artist's social media posts
  const {
    data: socialPosts,
    isLoading: isLoadingSocialPosts
  } = useQuery<SocialPost[]>({
    queryKey: [`/api/artists/${id}/social-posts`],
    enabled: !!id,
  });
  
  // Fetch artist's collaborations
  const {
    data: collaborations,
    isLoading: isLoadingCollaborations
  } = useQuery<Collaboration[]>({
    queryKey: [`/api/artists/${id}/collaborations`],
    enabled: !!id,
  });
  
  if (artistError) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{t('common.error')}</h1>
          <p className="text-muted-foreground mb-4">{t('common.artistNotFound')}</p>
          <Button asChild>
            <Link href="/">{t('common.backToHome')}</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-6">
      {/* Artist Header */}
      <div className="mb-8 -mx-4 md:-mx-6">
        {isLoadingArtist ? (
          <div>
            {/* Banner skeleton */}
            <div className="relative w-full h-80 md:h-96 lg:h-[500px] overflow-hidden">
              <Skeleton className="w-full h-full" />
            </div>
            
            {/* Content skeleton */}
            <div className="relative p-4 md:p-8 -mt-32 md:-mt-44">
              <div className="text-center md:text-left space-y-4">
                <Skeleton className="h-6 w-32 mb-2 mx-auto md:mx-0" />
                <Skeleton className="h-16 w-72 mb-2 mx-auto md:mx-0" />
                <Skeleton className="h-5 w-48 mb-4 mx-auto md:mx-0" />
                <div className="flex gap-4 justify-center md:justify-start">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-12 w-24" />
                </div>
              </div>
            </div>
          </div>
        ) : artist && (
          <div className="relative">
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-background z-0"></div>
            
            {/* Artist Banner Image */}
            <div className="relative w-full h-80 md:h-96 lg:h-[500px] overflow-hidden">
              <img 
                src={artist.image} 
                alt={artist.name}
                className="w-full h-full object-cover object-center"
              />
              
              {/* Gradient overlay on the image for better text contrast */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90"></div>
            </div>
            
            {/* Artist Info - positioned at the bottom of the banner */}
            <div className="relative z-10 p-4 md:p-8 -mt-32 md:-mt-44">
              <div className="text-center md:text-left">
                {/* Verified Artist badge */}
                {artist.verified && (
                  <div className="flex items-center gap-2 text-white bg-primary/90 px-3 py-1 rounded-full w-fit mb-4 mx-auto md:mx-0">
                    <BadgeCheck className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('common.verifiedArtist')}</span>
                  </div>
                )}
                
                {/* Artist name */}
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-2">{artist.name}</h1>
                
                {/* Monthly listeners */}
                <p className="text-white/80 mb-8 text-lg">
                  {artist.monthlyListeners?.toLocaleString() || '500,000'} {t('common.monthlyListeners')}
                </p>
                
                {/* Action buttons */}
                <div className="flex items-center gap-4 justify-center md:justify-start">
                  <Button size="lg" className="rounded-full px-8 shadow-lg">
                    <span className="sr-only">{t('common.play')}</span>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M8 5.14v14l11-7-11-7z" />
                    </svg>
                  </Button>
                  <Button variant="outline" size="lg" className="rounded-full border-white/20 text-white bg-white/10 hover:bg-white/20">
                    {t('common.follow')}
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/10">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm1-11h-2v3H8v2h3v3h2v-3h3v-2h-3z" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">{t('common.overview')}</TabsTrigger>
          <TabsTrigger value="discography">{t('common.discography')}</TabsTrigger>
          <TabsTrigger value="events">{t('common.events')}</TabsTrigger>
          <TabsTrigger value="about">{t('common.about')}</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab - Single Column Layout */}
        <TabsContent value="overview" className="space-y-12">
          {/* 1. Latest Releases Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Latest Releases</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {isLoadingTracks || isLoadingAlbums ? (
                // Loading skeletons
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-background-elevated rounded-lg overflow-hidden">
                    <Skeleton className="aspect-square w-full" />
                    <div className="p-3">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : tracks && albums ? (
                // Combine latest tracks and albums, sort by release date, and take the 4 most recent
                [...(tracks || []), ...(albums || [])]
                  .sort((a, b) => {
                    // Use a type guard to handle the difference between Album and Track
                    // Safe type checking and date conversion
                    let dateA: Date;
                    if ('releaseDate' in a && a.releaseDate) {
                      dateA = new Date(String(a.releaseDate));
                    } else if ('createdAt' in a && a.createdAt) {
                      dateA = new Date(String(a.createdAt));
                    } else {
                      dateA = new Date(0);
                    }
                    
                    let dateB: Date;
                    if ('releaseDate' in b && b.releaseDate) {
                      dateB = new Date(String(b.releaseDate));
                    } else if ('createdAt' in b && b.createdAt) {
                      dateB = new Date(String(b.createdAt));
                    } else {
                      dateB = new Date(0);
                    }
                    return dateB.getTime() - dateA.getTime();
                  })
                  .slice(0, 4)
                  .map(item => {
                    if ('trackNumber' in item) {
                      // It's a track
                      return <TrackCard key={`track-${item.id}`} track={item} />;
                    } else {
                      // It's an album
                      return <AlbumCard key={`album-${item.id}`} album={item} showArtist={false} />;
                    }
                  })
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground bg-background-elevated rounded-lg">
                  <p>{t('common.noReleases')}</p>
                </div>
              )}
            </div>
          </section>
          
          {/* 2. Popular Tracks Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Popular Tracks</h2>
              {tracks && tracks.length > 5 && (
                <Button variant="link" className="text-primary" onClick={() => setActiveTab("discography")}>
                  View All
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {isLoadingTracks ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-background-elevated rounded-lg p-3 flex items-center">
                    <Skeleton className="w-12 h-12 rounded mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="w-16 h-8 rounded-md" />
                  </div>
                ))
              ) : tracks && tracks.length > 0 ? (
                tracks.slice(0, 5).map(track => (
                  <TrackCard key={track.id} track={track} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-background-elevated rounded-lg">
                  <p>{t('common.noTracks')}</p>
                </div>
              )}
            </div>
            

          </section>
          
          {/* 3. Latest Music Videos Section */}
          <YoutubeVideoSection 
            artistId={Number(id)}
            videos={videos} 
            channelId={artist?.socialLinks?.youtube?.split('/').pop() || undefined}
          />
          
          {/* 4. Albums Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Albums</h2>
              {albums && albums.length > 4 && (
                <Button variant="outline" size="sm" onClick={() => setActiveTab("discography")}>
                  View All
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {isLoadingAlbums ? (
                // Loading skeletons
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-background-elevated rounded-lg overflow-hidden">
                    <Skeleton className="aspect-square w-full" />
                    <div className="p-3">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : albums && albums.length > 0 ? (
                albums.slice(0, 4).map(album => (
                  <AlbumCard key={album.id} album={album} showArtist={false} />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground bg-background-elevated rounded-lg">
                  <p>{t('common.noAlbums')}</p>
                </div>
              )}
            </div>
            

          </section>
          
          {/* 5. About Section */}
          {artist && (
            <section className="bg-background-elevated rounded-lg p-6 space-y-4">
              <h2 className="text-2xl font-bold mb-4">About</h2>
              
              {/* Biography */}
              <div className="flex items-start gap-2">
                <User className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">{t('common.biography')}</h3>
                  <p className="text-muted-foreground text-sm">{artist.bio || "This artist has not provided a biography yet."}</p>
                </div>
              </div>
              
              {/* Genres */}
              <div className="flex items-start gap-2">
                <Music className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">{t('common.genres')}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {artist.genres && artist.genres.length > 0 ? (
                      artist.genres.map((genre, index) => (
                        <Badge key={index} variant="outline" className="rounded-full">
                          {genre}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No genres specified</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">{t('common.location')}</h3>
                  <p className="text-muted-foreground text-sm">New York, United States</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">{t('common.memberSince')}</h3>
                  <p className="text-muted-foreground text-sm">January 2022</p>
                </div>
              </div>
              
              {artist.socialLinks.website && (
                <div className="flex items-start gap-2">
                  <Globe className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-sm">{t('common.website')}</h3>
                    <a 
                      href={artist.socialLinks.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary text-sm hover:underline"
                    >
                      {artist.socialLinks.website.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  </div>
                </div>
              )}
              
              {/* Social Media Links */}
              <div className="pt-2">
                <h3 className="font-medium text-sm mb-2">{t('common.connectWithArtist')}</h3>
                <div className="flex flex-wrap gap-2">
                  {artist.socialLinks.youtube && (
                    <Button variant="outline" size="sm" asChild className="rounded-md">
                      <a href={artist.socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                        <svg
                          className="w-4 h-4 mr-1.5 fill-current"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                        YouTube
                      </a>
                    </Button>
                  )}
                  {artist.socialLinks.instagram && (
                    <Button variant="outline" size="sm" asChild className="rounded-md">
                      <a href={artist.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                        <svg
                          className="w-4 h-4 mr-1.5 fill-current"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                        </svg>
                        Instagram
                      </a>
                    </Button>
                  )}
                  {artist.socialLinks.twitter && (
                    <Button variant="outline" size="sm" asChild className="rounded-md">
                      <a href={artist.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                        <svg
                          className="w-4 h-4 mr-1.5 fill-current"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                        Twitter
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </section>
          )}
          
          {/* 6. Social Media Feed */}
          {artist && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Social Media</h2>
              <SocialMediaFeed 
                artistId={Number(id)}
                artistName={artist.name}
                twitterUsername={artist.socialLinks?.twitter?.split('/').pop() || "ElectricDreams"}
                instagramUsername={artist.socialLinks?.instagram?.split('/').pop() || "ElectricDreams"}
              />
            </section>
          )}
          
          {/* 7. Upcoming Events Section */}
          {events && events.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Upcoming Events</h2>
                {events.length > 4 && (
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("events")}>
                    View All
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.slice(0, 4).map(event => (
                  <div key={event.id} className="bg-background-elevated rounded-lg p-6 space-y-3">
                    <h3 className="text-base font-bold">{event.name}</h3>
                    
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{formatDate(new Date(event.eventDate))}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>{event.eventTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{event.venue}, {event.city}</span>
                      </div>
                    </div>
                    
                    {event.ticketLink && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={event.ticketLink} target="_blank" rel="noopener noreferrer">
                          <Ticket className="mr-1 h-4 w-4" /> {t('common.getTickets')}
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              

            </section>
          )}
        </TabsContent>
        
        {/* Discography Tab */}
        <TabsContent value="discography">
          <div className="space-y-8">
            <h2 className="text-2xl font-bold">Discography</h2>
            
            {/* Albums Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Albums</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {isLoadingAlbums ? (
                  // Loading skeletons
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-background-elevated rounded-lg overflow-hidden">
                      <Skeleton className="aspect-square w-full" />
                      <div className="p-3">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : albums && albums.length > 0 ? (
                  albums.map(album => (
                    <AlbumCard key={album.id} album={album} showArtist={false} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-muted-foreground bg-background-elevated rounded-lg">
                    <p>No albums available</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Singles & EPs Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Singles & EPs</h3>
              <div className="space-y-2">
                {isLoadingTracks ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-background-elevated rounded-lg p-3 flex items-center">
                      <Skeleton className="w-12 h-12 rounded mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="w-16 h-8 rounded-md" />
                    </div>
                  ))
                ) : tracks && tracks.length > 0 ? (
                  tracks
                    .filter(track => !track.albumId) // Only show singles (tracks without albums)
                    .map(track => (
                      <TrackCard key={track.id} track={track} />
                    ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground bg-background-elevated rounded-lg">
                    <p>No singles available</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Featured On Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Featured On</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {isLoadingTracks ? (
                  // Loading skeletons
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-background-elevated rounded-lg overflow-hidden">
                      <Skeleton className="aspect-square w-full" />
                      <div className="p-3">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : collaborations && collaborations.length > 0 ? (
                  collaborations.map(collab => (
                    <div key={collab.id} className="bg-background-elevated rounded-lg overflow-hidden">
                      <div className="aspect-square relative overflow-hidden">
                        <img 
                          src={collab.imageUrl || defaultAlbumCover} 
                          alt={collab.name} 
                          className="w-full h-full object-cover transition-transform hover:scale-105" 
                        />
                        <Button 
                          size="icon"
                          variant="default"
                          className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground"
                        >
                          <Play className="h-4 w-4" />
                          <span className="sr-only">Play</span>
                        </Button>
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-sm line-clamp-1">{collab.trackTitle}</h4>
                        <p className="text-muted-foreground text-xs line-clamp-1">
                          with {collab.name}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-muted-foreground bg-background-elevated rounded-lg">
                    <p>No collaborations available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Events Tab */}
        <TabsContent value="events">
          <div className="space-y-8">
            <h2 className="text-2xl font-bold">Upcoming Events</h2>
            
            {events && events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map(event => (
                  <div key={event.id} className="bg-background-elevated rounded-lg p-6 space-y-4">
                    <h3 className="text-lg font-bold">{event.name}</h3>
                    
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{formatDate(new Date(event.eventDate))}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>{event.eventTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{event.venue}, {event.city}</span>
                      </div>
                      {event.description && (
                        <div className="flex items-start gap-2 mt-1">
                          <Info className="h-4 w-4 text-primary mt-1" />
                          <p className="text-muted-foreground">{event.description}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                      {event.ticketLink && (
                        <Button size="sm" asChild>
                          <a href={event.ticketLink} target="_blank" rel="noopener noreferrer">
                            <Ticket className="mr-1 h-4 w-4" /> Get Tickets
                          </a>
                        </Button>
                      )}
                      
                      {/* Additional event info button removed as eventLink is not in the schema */}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-background-elevated rounded-lg">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Events</h3>
                <p className="text-muted-foreground">Check back later for upcoming events</p>
              </div>
            )}
            
            {/* Past Events Section */}
            <h2 className="text-2xl font-bold mt-12">Past Events</h2>
            <div className="text-center py-12 bg-background-elevated rounded-lg">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Past Events</h3>
              <p className="text-muted-foreground">Past events will be archived here</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="about">
          {/* About tab content */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold">About</h2>
            
            {/* Biography */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Biography</h3>
              <p className="text-muted-foreground">{artist?.bio || 'This artist has not added a bio yet.'}</p>
            </div>
            
            {/* Genres */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {artist?.genres && artist.genres.length > 0 ? (
                  artist.genres.map((genre, index) => (
                    <Badge key={index} variant="outline" className="rounded-full">
                      {genre}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">No genres specified</p>
                )}
              </div>
            </div>
            
            {/* Social Links */}
            {artist?.socialLinks && Object.values(artist.socialLinks).some(link => !!link) && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">On the web</h3>
                <div className="flex gap-4">
                  {artist.socialLinks.youtube && (
                    <a href={artist.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                        <path d="m10 15 5-3-5-3z" />
                      </svg>
                    </a>
                  )}
                  {artist.socialLinks.instagram && (
                    <a href={artist.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                      </svg>
                    </a>
                  )}
                  {artist.socialLinks.twitter && (
                    <a href={artist.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                      </svg>
                    </a>
                  )}
                  {artist.socialLinks.facebook && (
                    <a href={artist.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
            
            {/* Monthly Listeners */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Monthly Listeners</h3>
              <p className="text-muted-foreground">
                {artist?.monthlyListeners?.toLocaleString() || '500,000'} listeners
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ArtistPage;
