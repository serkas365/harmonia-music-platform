import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Album, Track, Playlist } from "@shared/schema";
import AlbumCard from "@/components/cards/AlbumCard";
import TrackCard from "@/components/cards/TrackCard";
import PlaylistCard from "@/components/cards/PlaylistCard";
import { PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

const LibraryPage = () => {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("playlists");
  
  const {
    likedTracks,
    likedAlbums,
    playlists,
    downloadedTracks,
    purchasedTracks,
    purchasedAlbums,
    addPlaylist,
    addLikedTrack,
    addLikedAlbum,
    addDownloadedTrack,
    addPurchasedTrack,
    addPurchasedAlbum
  } = useLibraryStore();

  // Fetch user's playlists
  const { data: playlistsData, isLoading: isLoadingPlaylists } = useQuery<Playlist[]>({
    queryKey: ['/api/me/playlists']
  });

  // Fetch user's liked tracks
  const { data: likedTracksData, isLoading: isLoadingLikedTracks } = useQuery<Track[]>({
    queryKey: ['/api/me/library/tracks/liked']
  });

  // Fetch user's liked albums
  const { data: likedAlbumsData, isLoading: isLoadingLikedAlbums } = useQuery<Album[]>({
    queryKey: ['/api/me/library/albums/liked']
  });

  // Fetch user's downloaded tracks
  const { data: downloadedTracksData, isLoading: isLoadingDownloadedTracks } = useQuery<Track[]>({
    queryKey: ['/api/me/library/tracks/downloaded']
  });

  // Fetch user's purchased tracks
  const { data: purchasedTracksData, isLoading: isLoadingPurchasedTracks } = useQuery<Track[]>({
    queryKey: ['/api/me/library/tracks/purchased']
  });

  // Fetch user's purchased albums
  const { data: purchasedAlbumsData, isLoading: isLoadingPurchasedAlbums } = useQuery<Album[]>({
    queryKey: ['/api/me/library/albums/purchased']
  });

  // Loading state
  const isLoading = 
    isLoadingPlaylists || 
    isLoadingLikedTracks ||
    isLoadingLikedAlbums ||
    isLoadingDownloadedTracks ||
    isLoadingPurchasedTracks ||
    isLoadingPurchasedAlbums;

  // Reset playlists state on component mount
  useEffect(() => {
    useLibraryStore.setState({ playlists: [] });
  }, []);

  // Update library store when data is loaded - only include user created playlists
  useEffect(() => {
    if (playlistsData && Array.isArray(playlistsData)) {
      // Filter out system-generated playlists (typically those with isDefault = true)
      // Only include playlists actually created by the user (not the default ones)
      const userCreatedPlaylists = playlistsData.filter(playlist => playlist.isDefault !== true);
      
      // Add the filtered playlists to the store
      userCreatedPlaylists.forEach(playlist => {
        addPlaylist(playlist);
      });
    }
  }, [playlistsData, addPlaylist]);

  useEffect(() => {
    if (likedTracksData && Array.isArray(likedTracksData)) {
      likedTracksData.forEach(track => {
        addLikedTrack(track);
      });
    }
  }, [likedTracksData, addLikedTrack]);

  useEffect(() => {
    if (likedAlbumsData && Array.isArray(likedAlbumsData)) {
      likedAlbumsData.forEach(album => {
        addLikedAlbum(album);
      });
    }
  }, [likedAlbumsData, addLikedAlbum]);

  useEffect(() => {
    if (downloadedTracksData && Array.isArray(downloadedTracksData)) {
      downloadedTracksData.forEach(track => {
        addDownloadedTrack(track);
      });
    }
  }, [downloadedTracksData, addDownloadedTrack]);

  useEffect(() => {
    if (purchasedTracksData && Array.isArray(purchasedTracksData)) {
      purchasedTracksData.forEach(track => {
        addPurchasedTrack(track);
      });
    }
  }, [purchasedTracksData, addPurchasedTrack]);

  useEffect(() => {
    if (purchasedAlbumsData && Array.isArray(purchasedAlbumsData)) {
      purchasedAlbumsData.forEach(album => {
        addPurchasedAlbum(album);
      });
    }
  }, [purchasedAlbumsData, addPurchasedAlbum]);
  
  // Parse the current location to determine active tab
  useEffect(() => {
    if (location === '/library') {
      setActiveTab('playlists');
    } else if (location === '/library/liked') {
      setActiveTab('liked');
    } else if (location === '/library/downloaded') {
      setActiveTab('downloaded');
    } else if (location === '/library/purchased') {
      setActiveTab('purchased');
    }
  }, [location]);
  
  // Update location when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'playlists') {
      setLocation('/library');
    } else {
      setLocation(`/library/${value}`);
    }
  };
  
  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">{t('common.library')}</h1>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start mb-6 bg-transparent border-b border-gray-800">
          <TabsTrigger value="playlists" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            {t('common.playlists')}
          </TabsTrigger>
          <TabsTrigger value="liked" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            {t('common.liked')}
          </TabsTrigger>
          <TabsTrigger value="downloaded" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            {t('common.downloaded')}
          </TabsTrigger>
          <TabsTrigger value="purchased" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            {t('common.purchased')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="playlists">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">{t('common.playlists')}</h2>
            <Link href="/create-playlist">
              <Button variant="outline" size="sm" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                {t('common.createPlaylist')}
              </Button>
            </Link>
          </div>
          
          {playlists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {playlists.map((playlist) => (
                <PlaylistCard 
                  key={playlist.id} 
                  playlist={playlist} 
                  overlayTitle={playlist.name}
                  gradientColors="from-primary to-secondary"
                  tracks={playlist.tracks?.map(pt => pt.track).filter((track): track is Track => !!track)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-background-elevated rounded-lg">
              <p className="text-muted-foreground mb-4">{t('common.library')}</p>
              <Link href="/create-playlist">
                <Button variant="default" className="bg-primary hover:bg-primary/90">
                  {t('common.createPlaylist')}
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="liked">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t('common.liked')}</h2>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Tracks</h3>
            {likedTracks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {likedTracks.map((track) => (
                  <TrackCard key={track.id} track={track} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-background-elevated rounded-lg">
                <p className="text-muted-foreground">{t('common.library')}</p>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Albums</h3>
            {likedAlbums.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {likedAlbums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-background-elevated rounded-lg">
                <p className="text-muted-foreground">{t('common.library')}</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="downloaded">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t('common.downloaded')}</h2>
          </div>
          
          {downloadedTracks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {downloadedTracks.map((track) => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-background-elevated rounded-lg">
              <p className="text-muted-foreground">{t('common.library')}</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="purchased">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t('common.purchased')}</h2>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Tracks</h3>
            {purchasedTracks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {purchasedTracks.map((track) => (
                  <TrackCard key={track.id} track={track} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-background-elevated rounded-lg">
                <p className="text-muted-foreground">{t('common.library')}</p>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Albums</h3>
            {purchasedAlbums.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {purchasedAlbums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-background-elevated rounded-lg">
                <p className="text-muted-foreground">{t('common.library')}</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
};

export default LibraryPage;
