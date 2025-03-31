import { useTranslation } from "react-i18next";
import { Track, Album } from "@shared/schema";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import TrackCard from "@/components/cards/TrackCard";
import AlbumCard from "@/components/cards/AlbumCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { ShoppingCart, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const StorePage = () => {
  const { t } = useTranslation();
  const [trackFilter, setTrackFilter] = useState("");
  const [albumFilter, setAlbumFilter] = useState("");
  const [priceSort, setPriceSort] = useState<"asc" | "desc" | "">("");

  // Fetch tracks and albums for the store
  const { data: tracks, isLoading: tracksLoading } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
  });

  const { data: albums, isLoading: albumsLoading } = useQuery<Album[]>({
    queryKey: ["/api/albums"],
  });

  // Filter and sort tracks based on user input
  const filteredTracks = tracks 
    ? tracks
        .filter(track => 
          track.purchaseAvailable && 
          (trackFilter 
            ? track.title.toLowerCase().includes(trackFilter.toLowerCase()) ||
              track.artistName.toLowerCase().includes(trackFilter.toLowerCase())
            : true)
        )
        .sort((a, b) => {
          if (!priceSort || !a.purchasePrice || !b.purchasePrice) return 0;
          return priceSort === "asc" 
            ? a.purchasePrice - b.purchasePrice 
            : b.purchasePrice - a.purchasePrice;
        })
    : [];

  // Filter and sort albums based on user input
  const filteredAlbums = albums
    ? albums
        .filter(album => 
          albumFilter 
            ? album.title.toLowerCase().includes(albumFilter.toLowerCase()) ||
              album.artistName.toLowerCase().includes(albumFilter.toLowerCase())
            : true
        )
    : [];

  if (tracksLoading || albumsLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="container p-4 mx-auto space-y-6">
      <PageHeader
        title={t('store.title')}
        subtitle={t('store.subtitle')}
        icon={<ShoppingCart className="h-8 w-8" />}
      />

      <Tabs defaultValue="tracks" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tracks">
            {t('store.tracks')}
          </TabsTrigger>
          <TabsTrigger value="albums">
            {t('store.albums')}
          </TabsTrigger>
        </TabsList>

        {/* Tracks Tab */}
        <TabsContent value="tracks" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:w-1/2">
              <Input
                placeholder={t('store.searchTracks')}
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value)}
                className="pl-10"
              />
              <span className="absolute left-3 top-2.5 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
            </div>
            <div className="w-full md:w-auto">
              <Select value={priceSort} onValueChange={(value: "asc" | "desc" | "") => setPriceSort(value)}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder={t('store.sortByPrice')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    {t('store.default')}
                  </SelectItem>
                  <SelectItem value="asc">
                    {t('store.priceLowHigh')}
                  </SelectItem>
                  <SelectItem value="desc">
                    {t('store.priceHighLow')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredTracks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTracks.map((track) => (
                <TrackCard 
                  key={track.id} 
                  track={track} 
                  showBuyButton 
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-10 border border-dashed rounded-md border-gray-600">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-xl font-medium mb-2">
                {t('store.noTracksFound')}
              </h3>
              <p className="text-muted-foreground">
                {t('store.tryDifferentSearch')}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Albums Tab */}
        <TabsContent value="albums" className="space-y-4">
          <div className="relative w-full md:w-1/2">
            <Input
              placeholder={t('store.searchAlbums')}
              value={albumFilter}
              onChange={(e) => setAlbumFilter(e.target.value)}
              className="pl-10"
            />
            <span className="absolute left-3 top-2.5 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
          </div>

          {filteredAlbums.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAlbums.map((album) => (
                <AlbumCard 
                  key={album.id} 
                  album={album} 
                  showBuyButton 
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-10 border border-dashed rounded-md border-gray-600">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-xl font-medium mb-2">
                {t('store.noAlbumsFound')}
              </h3>
              <p className="text-muted-foreground">
                {t('store.tryDifferentSearch')}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StorePage;