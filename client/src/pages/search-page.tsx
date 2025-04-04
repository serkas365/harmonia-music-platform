import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import TrackCard from '@/components/cards/TrackCard';
import AlbumCard from '@/components/cards/AlbumCard';
import ArtistCard from '@/components/cards/ArtistCard';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Track, Album, Artist } from '@shared/schema';

const SearchPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Set up debounce for search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Fetch search results with debounced query
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return { tracks: [], albums: [], artists: [] };
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  // Filter results based on the active tab
  const filteredResults = {
    tracks: searchResults?.tracks || [],
    albums: searchResults?.albums || [],
    artists: searchResults?.artists || [],
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Force refetch
    queryClient.invalidateQueries({ queryKey: ['/api/search', debouncedQuery] });
  };

  const handleClear = () => {
    setSearchQuery('');
    setDebouncedQuery('');
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">{t('search.title')}</h1>
        
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder={t('search.placeholder')}
              className="pl-10 pr-12 py-6 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={handleClear}
              >
                {t('search.clear')}
              </Button>
            )}
          </div>
        </form>
      </div>

      {debouncedQuery.length < 2 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <SearchIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('search.startSearching')}</h2>
          <p className="text-muted-foreground">{t('search.minimumChars')}</p>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">{t('common.searching')}</p>
        </div>
      ) : (
        <>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mb-6">
            <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-flex">
              <TabsTrigger value="all">{t('search.allResults')}</TabsTrigger>
              <TabsTrigger value="tracks">{t('common.songs')}</TabsTrigger>
              <TabsTrigger value="albums">{t('common.albums')}</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {/* Show combined results */}
              {filteredResults.artists.length === 0 && 
               filteredResults.albums.length === 0 && 
               filteredResults.tracks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">{t('search.noResults')}</p>
                </div>
              ) : (
                <>
                  {/* Artists */}
                  {filteredResults.artists.length > 0 && (
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">{t('common.artists')}</h2>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {filteredResults.artists.slice(0, 6).map((artist: Artist) => (
                          <ArtistCard key={artist.id} artist={artist} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Albums */}
                  {filteredResults.albums.length > 0 && (
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">{t('common.albums')}</h2>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {filteredResults.albums.slice(0, 6).map((album: Album) => (
                          <AlbumCard key={album.id} album={album} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tracks */}
                  {filteredResults.tracks.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">{t('common.songs')}</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredResults.tracks.slice(0, 9).map((track: Track) => (
                          <TrackCard key={track.id} track={track} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="tracks">
              {filteredResults.tracks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResults.tracks.map((track: Track) => (
                    <TrackCard key={track.id} track={track} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">{t('search.noTracksFound')}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="albums">
              {filteredResults.albums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredResults.albums.map((album: Album) => (
                    <AlbumCard key={album.id} album={album} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">{t('search.noAlbumsFound')}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default SearchPage;