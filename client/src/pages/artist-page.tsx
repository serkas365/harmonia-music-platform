import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Artist, Album, Track } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, ExternalLink, Calendar, Music } from "lucide-react";
import AlbumCard from "@/components/cards/AlbumCard";
import TrackCard from "@/components/cards/TrackCard";
import { formatDate } from "@/lib/utils";

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
      <div className="mb-8">
        {isLoadingArtist ? (
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Skeleton className="w-32 h-32 md:w-48 md:h-48 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-10 w-48 mb-2" />
              <Skeleton className="h-5 w-24 mb-4" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ) : artist && (
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <img 
                src={artist.image} 
                alt={artist.name}
                className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover"
              />
              {artist.verified && (
                <span className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1">
                  <BadgeCheck className="h-5 w-5" />
                </span>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold">{artist.name}</h1>
                {artist.verified && (
                  <BadgeCheck className="h-6 w-6 text-primary" />
                )}
              </div>
              
              <p className="text-muted-foreground mb-4">
                {artist.genres.join(' • ')}
              </p>
              
              <p className="mb-6 max-w-3xl">{artist.bio}</p>
              
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
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
          <TabsTrigger value="about">{t('common.about')}</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8">
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
          
          {/* Albums Section */}
          <section>
            <h2 className="text-xl font-bold mb-4">{t('common.albums')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {isLoadingAlbums ? (
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
              ) : albums && albums.length > 0 ? (
                albums.slice(0, 6).map(album => (
                  <AlbumCard key={album.id} album={album} showArtist={false} />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground bg-background-elevated rounded-lg">
                  <p>{t('common.noAlbums')}</p>
                </div>
              )}
            </div>
            
            {albums && albums.length > 6 && (
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => setActiveTab("albums")}>
                  {t('common.seeAllAlbums')}
                </Button>
              </div>
            )}
          </section>
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
            <div className="max-w-3xl space-y-6">
              <section>
                <h2 className="text-xl font-bold mb-3">{t('common.biography')}</h2>
                <p className="text-muted-foreground">{artist.bio}</p>
              </section>
              
              <section>
                <h2 className="text-xl font-bold mb-3">{t('common.genres')}</h2>
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
              
              <section>
                <h2 className="text-xl font-bold mb-3">{t('common.socialLinks')}</h2>
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
                </div>
              </section>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ArtistPage;