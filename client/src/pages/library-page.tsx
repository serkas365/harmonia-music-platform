import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Album, Track, Playlist } from "@shared/schema";
import AlbumCard from "@/components/cards/AlbumCard";
import TrackCard from "@/components/cards/TrackCard";
import PlaylistCard from "@/components/cards/PlaylistCard";
import { 
  PlusCircle, 
  Loader2, 
  Heart, 
  Download, 
  ShoppingBag, 
  ShoppingCart,
  Music,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { queryClient } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const LibraryPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("playlists");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);
  const [sortOption, setSortOption] = useState<'newest' | 'alphabetical' | 'recently-played'>('newest');
  
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
    addPurchasedAlbum,
    removePlaylist,
    removeLikedTrack,
    removeLikedAlbum,
    removeDownloadedTrack,
    removePurchasedTrack,
    removePurchasedAlbum,
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
  
  // Add mutations for library management
  const removeLikedTrackMutation = useMutation({
    mutationFn: async (trackId: number) => {
      const response = await fetch(`/api/me/library/tracks/${trackId}/unlike`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to remove track from liked');
      }
      return trackId;
    },
    onSuccess: (trackId) => {
      removeLikedTrack(trackId);
      toast({
        title: t('library.trackRemoved'),
        description: t('library.trackRemovedFromLiked'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/me/library/tracks/liked'] });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('library.failedToRemove'),
        variant: 'destructive',
      });
    }
  });
  
  const removeLikedAlbumMutation = useMutation({
    mutationFn: async (albumId: number) => {
      const response = await fetch(`/api/me/library/albums/${albumId}/unlike`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to remove album from liked');
      }
      return albumId;
    },
    onSuccess: (albumId) => {
      removeLikedAlbum(albumId);
      toast({
        title: t('library.albumRemoved'),
        description: t('library.albumRemovedFromLiked'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/me/library/albums/liked'] });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('library.failedToRemove'),
        variant: 'destructive',
      });
    }
  });

  // Handle filter and search functionality
  const getFilteredContent = (items: any[], type: 'tracks' | 'albums' | 'playlists') => {
    if (!searchQuery) return items;
    
    return items.filter(item => {
      const title = type === 'tracks' ? item.title : type === 'albums' ? item.title : item.name;
      const artist = type === 'playlists' ? '' : item.artistName;
      return title.toLowerCase().includes(searchQuery.toLowerCase()) || 
             (artist && artist.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  };

  // Handle sort functionality
  const getSortedContent = (items: any[], type: 'tracks' | 'albums' | 'playlists') => {
    let sorted = [...items];
    
    if (sortOption === 'alphabetical') {
      sorted.sort((a, b) => {
        const titleA = type === 'playlists' ? a.name : a.title;
        const titleB = type === 'playlists' ? b.name : b.title;
        return titleA.localeCompare(titleB);
      });
    } else if (sortOption === 'newest') {
      // In a real app, this would sort by date
      // For now, we'll use ID as a proxy for "newness"
      sorted.sort((a, b) => b.id - a.id);
    }
    
    return sorted;
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleSortChange = (option: 'newest' | 'alphabetical' | 'recently-played') => {
    setSortOption(option);
  };

  // Get filtered and sorted content
  const filteredPlaylists = getSortedContent(getFilteredContent(playlists, 'playlists'), 'playlists');
  const filteredLikedTracks = getSortedContent(getFilteredContent(likedTracks, 'tracks'), 'tracks');
  const filteredLikedAlbums = getSortedContent(getFilteredContent(likedAlbums, 'albums'), 'albums');
  const filteredDownloadedTracks = getSortedContent(getFilteredContent(downloadedTracks, 'tracks'), 'tracks');
  const filteredPurchasedTracks = getSortedContent(getFilteredContent(purchasedTracks, 'tracks'), 'tracks');
  const filteredPurchasedAlbums = getSortedContent(getFilteredContent(purchasedAlbums, 'albums'), 'albums');

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-0">{t('common.library')}</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder={t('common.search')}
              className="pl-9 h-9"
              value={searchQuery}
              onChange={handleSearch}
            />
            {searchQuery && (
              <button 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={handleClearSearch}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2" 
              onClick={() => setIsFiltering(!isFiltering)}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">{t('common.filter')}</span>
            </Button>
          </div>
        </div>
      </div>
      
      {isFiltering && (
        <div className="mb-6 p-4 bg-background-elevated rounded-lg">
          <h3 className="font-medium mb-3">{t('common.sortBy')}</h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={sortOption === 'newest' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleSortChange('newest')}
            >
              {t('library.newest')}
            </Button>
            <Button 
              variant={sortOption === 'alphabetical' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleSortChange('alphabetical')}
            >
              {t('library.alphabetical')}
            </Button>
            <Button 
              variant={sortOption === 'recently-played' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleSortChange('recently-played')}
            >
              {t('library.recentlyPlayed')}
            </Button>
          </div>
        </div>
      )}
      
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
          
          {filteredPlaylists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredPlaylists.map((playlist) => (
                <PlaylistCard 
                  key={playlist.id} 
                  playlist={playlist} 
                  overlayTitle={playlist.name}
                  gradientColors="from-primary to-secondary"
                  tracks={playlist.tracks?.map((pt: any) => pt.track).filter((track: any): track is Track => !!track)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-background-elevated rounded-lg">
              {searchQuery ? (
                <>
                  <p className="text-muted-foreground mb-2">{t('common.noResults')}</p>
                  <p className="text-xs text-muted-foreground mb-4">{t('common.tryDifferentSearch')}</p>
                  <Button 
                    variant="outline" 
                    onClick={handleClearSearch}
                  >
                    {t('common.clearSearch')}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-4">{t('common.noPlaylists')}</p>
                  <Link href="/create-playlist">
                    <Button variant="default" className="bg-primary hover:bg-primary/90">
                      {t('common.createPlaylist')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="liked">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t('common.liked')}</h2>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Tracks</h3>
            {filteredLikedTracks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLikedTracks.map((track) => (
                  <TrackCard 
                    key={track.id} 
                    track={track} 
                    actionButton={
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100" 
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          removeLikedTrackMutation.mutate(track.id);
                        }}
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </Button>
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-background-elevated rounded-lg">
                {searchQuery ? (
                  <>
                    <p className="text-muted-foreground mb-2">{t('common.noResults')}</p>
                    <p className="text-xs text-muted-foreground mb-4">{t('common.tryDifferentSearch')}</p>
                    <Button 
                      variant="outline" 
                      onClick={handleClearSearch}
                    >
                      {t('common.clearSearch')}
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">{t('common.noLikedTracks')}</p>
                )}
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Albums</h3>
            {filteredLikedAlbums.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredLikedAlbums.map((album) => (
                  <AlbumCard 
                    key={album.id} 
                    album={album}
                    actionButton={
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 z-10" 
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          removeLikedAlbumMutation.mutate(album.id);
                        }}
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </Button>
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-background-elevated rounded-lg">
                {searchQuery ? (
                  <>
                    <p className="text-muted-foreground mb-2">{t('common.noResults')}</p>
                    <p className="text-xs text-muted-foreground mb-4">{t('common.tryDifferentSearch')}</p>
                    <Button 
                      variant="outline" 
                      onClick={handleClearSearch}
                    >
                      {t('common.clearSearch')}
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">{t('common.noLikedAlbums')}</p>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="downloaded">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t('common.downloaded')}</h2>
          </div>
          
          {filteredDownloadedTracks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDownloadedTracks.map((track) => (
                <TrackCard 
                  key={track.id} 
                  track={track} 
                  actionButton={
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100" 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        removeDownloadedTrack(track.id);
                        toast({
                          title: t('library.trackRemoved'),
                          description: t('library.trackRemovedFromDownloaded'),
                        });
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-background-elevated rounded-lg">
              {searchQuery ? (
                <>
                  <p className="text-muted-foreground mb-2">{t('common.noResults')}</p>
                  <p className="text-xs text-muted-foreground mb-4">{t('common.tryDifferentSearch')}</p>
                  <Button 
                    variant="outline" 
                    onClick={handleClearSearch}
                  >
                    {t('common.clearSearch')}
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">{t('common.noDownloadedTracks')}</p>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="purchased">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t('common.purchased')}</h2>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Tracks</h3>
            {filteredPurchasedTracks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPurchasedTracks.map((track) => (
                  <TrackCard 
                    key={track.id} 
                    track={track} 
                    actionButton={
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100" 
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          removePurchasedTrack(track.id);
                          toast({
                            title: t('library.trackRemoved'),
                            description: t('library.trackRemovedFromPurchased'),
                          });
                        }}
                      >
                        <ShoppingBag className="h-4 w-4" />
                      </Button>
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-background-elevated rounded-lg">
                {searchQuery ? (
                  <>
                    <p className="text-muted-foreground mb-2">{t('common.noResults')}</p>
                    <p className="text-xs text-muted-foreground mb-4">{t('common.tryDifferentSearch')}</p>
                    <Button variant="outline" onClick={handleClearSearch}>
                      {t('common.clearSearch')}
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">{t('common.noPurchasedTracks')}</p>
                )}
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Albums</h3>
            {filteredPurchasedAlbums.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredPurchasedAlbums.map((album) => (
                  <AlbumCard 
                    key={album.id} 
                    album={album}
                    actionButton={
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 z-10" 
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          removePurchasedAlbum(album.id);
                          toast({
                            title: t('library.albumRemoved'),
                            description: t('library.albumRemovedFromPurchased'),
                          });
                        }}
                      >
                        <ShoppingBag className="h-4 w-4" />
                      </Button>
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-background-elevated rounded-lg">
                {searchQuery ? (
                  <>
                    <p className="text-muted-foreground mb-2">{t('common.noResults')}</p>
                    <p className="text-xs text-muted-foreground mb-4">{t('common.tryDifferentSearch')}</p>
                    <Button variant="outline" onClick={handleClearSearch}>
                      {t('common.clearSearch')}
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">{t('common.noPurchasedAlbums')}</p>
                )}
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
