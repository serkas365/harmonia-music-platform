import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Artist, Album, Track, ArtistEvent } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, ExternalLink, Calendar, Music, MapPin, Clock, Users, Ticket, Globe } from "lucide-react";
import AlbumCard from "@/components/cards/AlbumCard";
import TrackCard from "@/components/cards/TrackCard";
import { formatDate } from "@/lib/utils";
import YoutubeVideoSection from "@/components/youtube-video-section";
import SocialMediaFeed from "@/components/social-media-feed";
import FeaturedArtists from "@/components/featured-artists";

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
    // Fallback for demo purposes if the endpoint is not implemented yet
    queryFn: async () => {
      const response = await fetch(`/api/artists/${id}/videos`);
      if (!response.ok) {
        if (response.status === 404) {
          // Return sample videos for demo
          return [
            {
              id: "video1",
              title: "Official Music Video - Latest Single",
              thumbnailUrl: "https://i.ytimg.com/vi/sample1/hqdefault.jpg"
            },
            {
              id: "video2",
              title: "Live Performance at Madison Square Garden",
              thumbnailUrl: "https://i.ytimg.com/vi/sample2/hqdefault.jpg"
            }
          ];
        }
        throw new Error("Failed to fetch videos");
      }
      return response.json();
    }
  });
  
  // Fetch artist's social media posts
  const {
    data: socialPosts,
    isLoading: isLoadingSocialPosts
  } = useQuery<SocialPost[]>({
    queryKey: [`/api/artists/${id}/social-posts`],
    enabled: !!id,
    // Fallback for demo purposes if the endpoint is not implemented yet
    queryFn: async () => {
      const response = await fetch(`/api/artists/${id}/social-posts`);
      if (!response.ok) {
        if (response.status === 404) {
          // Return sample posts for demo
          return [
            {
              id: "post1",
              platform: "twitter",
              content: "Just finished recording a new track! Can't wait to share it with all of you. #NewMusic #ComingSoon",
              postedAt: new Date(Date.now() - 86400000), // 1 day ago
              likes: 1250,
              comments: 84,
              url: "https://twitter.com/sample/status/123456"
            },
            {
              id: "post2",
              platform: "instagram",
              content: "Behind the scenes from our latest music video shoot! 🎬 #BTS #MusicVideo",
              imageUrl: "https://example.com/sample-image.jpg",
              postedAt: new Date(Date.now() - 172800000), // 2 days ago
              likes: 3480,
              comments: 142,
              url: "https://instagram.com/p/sample123"
            }
          ];
        }
        throw new Error("Failed to fetch social posts");
      }
      return response.json();
    }
  });
  
  // Fetch artist's collaborations
  const {
    data: collaborations,
    isLoading: isLoadingCollaborations
  } = useQuery<Collaboration[]>({
    queryKey: [`/api/artists/${id}/collaborations`],
    enabled: !!id,
    // Fallback for demo purposes if the endpoint is not implemented yet
    queryFn: async () => {
      const response = await fetch(`/api/artists/${id}/collaborations`);
      if (!response.ok) {
        if (response.status === 404) {
          // Return sample collaborations for demo
          return [
            {
              id: 1,
              artistId: 2,
              name: "Featured Artist 1",
              imageUrl: "https://example.com/artist1.jpg",
              trackTitle: "Collaborative Track Title 1",
              trackId: 101
            },
            {
              id: 2,
              artistId: 3,
              name: "Featured Artist 2",
              imageUrl: "https://example.com/artist2.jpg",
              trackTitle: "Collaborative Track Title 2",
              trackId: 102
            },
            {
              id: 3,
              artistId: 4,
              name: "Featured Artist 3",
              imageUrl: "https://example.com/artist3.jpg",
              trackTitle: "Collaborative Track Title 3",
              trackId: 103
            },
            {
              id: 4,
              artistId: 5,
              name: "Featured Artist 4",
              imageUrl: "https://example.com/artist4.jpg",
              trackTitle: "Collaborative Track Title 4",
              trackId: 104
            }
          ];
        }
        throw new Error("Failed to fetch collaborations");
      }
      return response.json();
    }
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
          <div className="p-4 md:p-8 pt-8 md:pt-12">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <Skeleton className="w-64 h-64 shrink-0" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-16 w-72 mb-2" />
                <Skeleton className="h-5 w-48 mb-4" />
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-12 w-24" />
                </div>
              </div>
            </div>
          </div>
        ) : artist && (
          <div className="relative">
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-background z-0"></div>
            
            {/* Background image - blurred version of artist image */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30 z-[-1]" 
              style={{ 
                backgroundImage: `url(${artist.image})`,
                filter: 'blur(100px)'
              }}
            ></div>
            
            <div className="relative z-10 p-4 md:p-8 pt-8 md:pt-12">
              {/* Flex container for the header content */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Artist Image */}
                <div className="shrink-0 z-10">
                  <img 
                    src={artist.image} 
                    alt={artist.name}
                    className="w-64 h-64 object-cover shadow-2xl"
                    style={{ aspectRatio: '1/1' }}
                  />
                </div>
                
                {/* Artist Info */}
                <div className="flex-1 z-10 text-center md:text-left">
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
                  <div className="flex items-center gap-4 mb-8 justify-center md:justify-start">
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
                  
                  {/* Social links in a more subtle position */}
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    {artist.socialLinks.youtube && (
                      <Button variant="ghost" size="sm" asChild className="bg-white/10 hover:bg-white/20 text-white">
                        <a href={artist.socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                          YouTube <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {artist.socialLinks.instagram && (
                      <Button variant="ghost" size="sm" asChild className="bg-white/10 hover:bg-white/20 text-white">
                        <a href={artist.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                          Instagram <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {artist.socialLinks.twitter && (
                      <Button variant="ghost" size="sm" asChild className="bg-white/10 hover:bg-white/20 text-white">
                        <a href={artist.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                          Twitter <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
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
          <TabsTrigger value="albums">{t('common.albums')}</TabsTrigger>
          <TabsTrigger value="tracks">{t('common.tracks')}</TabsTrigger>
          <TabsTrigger value="events">{t('common.events')}</TabsTrigger>
          <TabsTrigger value="about">{t('common.about')}</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8">
          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content column - 2/3 width on large screens */}
            <div className="lg:col-span-2 space-y-8">
              {/* Popular Tracks Section */}
              <section>
                <h2 className="text-xl font-bold mb-4">{t('common.popularTracks')}</h2>
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
                
                {tracks && tracks.length > 5 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" onClick={() => setActiveTab("tracks")}>
                      {t('common.seeAllTracks')}
                    </Button>
                  </div>
                )}
              </section>
              
              {/* YouTube Videos Section */}
              <YoutubeVideoSection 
                artistId={Number(id)}
                videos={videos} 
                channelId={artist?.socialLinks?.youtube?.split('/').pop() || undefined}
              />
              
              {/* Albums Section */}
              <section>
                <h2 className="text-xl font-bold mb-4">{t('common.albums')}</h2>
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
                
                {albums && albums.length > 4 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" onClick={() => setActiveTab("albums")}>
                      {t('common.seeAllAlbums')}
                    </Button>
                  </div>
                )}
              </section>
            </div>
            
            {/* Sidebar column - 1/3 width on large screens */}
            <div className="space-y-8">
              {/* Artist Information */}
              {artist && (
                <section className="bg-background-elevated rounded-lg p-6 space-y-4">
                  <h2 className="text-xl font-bold">{t('common.about')}</h2>
                  
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
                </section>
              )}
              
              {/* Social Media Feed */}
              {socialPosts && socialPosts.length > 0 && (
                <SocialMediaFeed 
                  posts={socialPosts} 
                  twitterUsername={artist?.socialLinks?.twitter?.split('/').pop() || undefined}
                  instagramUsername={artist?.socialLinks?.instagram?.split('/').pop() || undefined}
                />
              )}
              
              {/* Featured Artists */}
              {collaborations && collaborations.length > 0 && (
                <FeaturedArtists collaborations={collaborations} />
              )}
              
              {/* Upcoming Events Section */}
              {events && events.length > 0 && (
                <section className="bg-background-elevated rounded-lg p-6 space-y-4">
                  <h2 className="text-xl font-bold">{t('common.upcomingEvents')}</h2>
                  
                  <div className="space-y-4">
                    {events.slice(0, 2).map(event => (
                      <div key={event.id} className="space-y-3 border-b border-border pb-3 last:border-0 last:pb-0">
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
                  
                  {events.length > 2 && (
                    <div className="text-center mt-4">
                      <Button variant="outline" onClick={() => setActiveTab("events")}>
                        {t('common.seeAllEvents')}
                      </Button>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Albums Tab */}
        <TabsContent value="albums">
          <h2 className="text-xl font-bold mb-4">{t('common.discography')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {isLoadingAlbums ? (
              // Loading skeletons
              Array.from({ length: 12 }).map((_, i) => (
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
                <p>{t('common.noAlbums')}</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Tracks Tab */}
        <TabsContent value="tracks">
          <h2 className="text-xl font-bold mb-4">{t('common.allTracks')}</h2>
          <div className="space-y-2">
            {isLoadingTracks ? (
              // Loading skeletons
              Array.from({ length: 10 }).map((_, i) => (
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
              tracks.map(track => (
                <TrackCard key={track.id} track={track} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-background-elevated rounded-lg">
                <p>{t('common.noTracks')}</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Events Tab */}
        <TabsContent value="events">
          <h2 className="text-xl font-bold mb-4">{t('common.allEvents')}</h2>
          
          {isLoadingEvents ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-background-elevated rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1">
                    <Skeleton className="w-full h-40 rounded-md" />
                  </div>
                  <div className="md:col-span-3">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-3" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </div>
            ))
          ) : events && events.length > 0 ? (
            <div className="space-y-4">
              {events.map(event => (
                <div key={event.id} className="bg-background-elevated rounded-lg p-4 hover:bg-background-highlight transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Event Image */}
                    <div className="md:col-span-1">
                      <img 
                        src={event.eventImage || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=600&h=400'} 
                        alt={event.name}
                        className="w-full h-40 object-cover rounded-md"
                      />
                    </div>
                    
                    {/* Event Details */}
                    <div className="md:col-span-3">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold">{event.name}</h3>
                        {event.tourName && (
                          <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                            {event.tourName}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-4">
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
                          <span>{event.venue}, {event.city}, {event.country}</span>
                        </div>
                        {event.guestArtists.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span>{t('common.with')} {event.guestArtists.join(', ')}</span>
                          </div>
                        )}
                      </div>
                      
                      {event.ticketLink && (
                        <Button size="sm" asChild>
                          <a href={event.ticketLink} target="_blank" rel="noopener noreferrer">
                            <Ticket className="mr-1 h-4 w-4" /> {t('common.getTickets')}
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground bg-background-elevated rounded-lg">
              <p>{t('common.noEvents')}</p>
            </div>
          )}
        </TabsContent>
        
        {/* About Tab */}
        <TabsContent value="about">
          {isLoadingArtist ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-20 w-full mb-6" />
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : artist && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content - 2/3 width */}
              <div className="lg:col-span-2 space-y-8">
                <section className="bg-background-elevated rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">{t('common.biography')}</h2>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-muted-foreground">{artist.bio}</p>
                  </div>
                </section>
                
                <section className="bg-background-elevated rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">{t('common.genres')}</h2>
                  <div className="flex flex-wrap gap-2">
                    {artist.genres.map((genre, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1 bg-background-highlight rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </section>
                
                {/* YouTube Videos Section */}
                <YoutubeVideoSection 
                  artistId={Number(id)}
                  videos={videos} 
                  channelId={artist?.socialLinks?.youtube?.split('/').pop() || undefined}
                />
              </div>
              
              {/* Sidebar - 1/3 width */}
              <div className="space-y-6">
                {/* Artist Details Card */}
                <section className="bg-background-elevated rounded-lg p-6 space-y-4">
                  <h2 className="text-xl font-bold mb-3">{t('common.about')}</h2>
                  
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
                </section>
                
                {/* Social Links */}
                <section className="bg-background-elevated rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">{t('common.socialLinks')}</h2>
                  <div className="flex flex-wrap gap-3">
                    {artist.socialLinks.youtube && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={artist.socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                          YouTube <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {artist.socialLinks.instagram && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={artist.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                          Instagram <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {artist.socialLinks.twitter && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={artist.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                          Twitter <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {artist.socialLinks.facebook && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={artist.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                          Facebook <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </section>
                
                {/* Featured Artists */}
                {collaborations && collaborations.length > 0 && (
                  <FeaturedArtists collaborations={collaborations} />
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ArtistPage;