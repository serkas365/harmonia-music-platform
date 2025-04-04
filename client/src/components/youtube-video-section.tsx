import { useTranslation } from "react-i18next";
import { Youtube, Maximize2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
}

interface YoutubeVideoSectionProps {
  artistId?: number;
  videos?: Video[];
  channelId?: string;
}

const YoutubeVideoSection = ({ artistId, videos: initialVideos, channelId }: YoutubeVideoSectionProps) => {
  const { t } = useTranslation();
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  
  // Fetch videos from API if artistId is provided and videos are not provided as props
  const { data: fetchedVideos, isLoading, isError } = useQuery({
    queryKey: ['/api/artists', artistId, 'youtube-videos'],
    queryFn: async () => {
      if (!artistId) {
        throw new Error('Artist ID is required');
      }
      const response = await fetch(`/api/artists/${artistId}/youtube-videos`);
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      return response.json() as Promise<Video[]>;
    },
    // Skip query if no artistId or if videos are provided through props
    enabled: !!artistId && (!initialVideos || initialVideos.length === 0)
  });
  
  // Helper function to build the embedded video URL
  const getEmbedUrl = (videoId: string) => {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  };

  // Determine which videos to use - either from props or from API
  const videos = initialVideos || fetchedVideos || [];
  
  // Show loading state
  if (isLoading) {
    return (
      <section className="bg-background-elevated rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">{t('common.latestVideos')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i}>
              <Skeleton className="aspect-video w-full rounded-md mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Show error state
  if (isError) {
    return (
      <section className="bg-background-elevated rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">{t('common.latestVideos')}</h2>
        </div>
        <div className="text-center p-8">
          <p className="mb-4 text-muted-foreground">{t('common.failedToLoadVideos')}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.tryAgain')}
          </Button>
        </div>
      </section>
    );
  }

  if (!videos || videos.length === 0) {
    return null;
  }
  
  // Take only the first 4 videos
  const displayVideos = videos.slice(0, 4);

  return (
    <>
      <section className="bg-background-elevated rounded-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">{t('common.latestVideos')}</h2>
          </div>
          
          {channelId && (
            <a 
              href={`https://www.youtube.com/channel/${channelId}`} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('common.viewChannel')}
            </a>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayVideos.map(video => (
            <div key={video.id} className="group">
              <div className="relative aspect-video overflow-hidden rounded-md bg-background-highlight mb-2">
                <div 
                  className="cursor-pointer"
                  onClick={() => setSelectedVideoId(video.id)}
                  title={t('common.watchVideo')}
                >
                  <img 
                    src={video.thumbnailUrl} 
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center">
                      <Youtube className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
                
                <div className="absolute bottom-2 right-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVideoId(video.id);
                    }}
                    className="bg-background/80 hover:bg-background"
                    title={t('common.fullscreen')}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <h3 
                className="font-medium text-sm line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                onClick={() => setSelectedVideoId(video.id)}
              >
                {video.title}
              </h3>
            </div>
          ))}
        </div>
      </section>
      
      {/* Modal for fullscreen video */}
      <Dialog 
        open={!!selectedVideoId} 
        onOpenChange={(open) => !open && setSelectedVideoId(null)}
      >
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-0 bg-black border-0">
          <DialogHeader className="p-4">
            <DialogTitle className="text-white">
              {selectedVideoId && videos.find(v => v.id === selectedVideoId)?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedVideoId && (
            <div className="w-full aspect-video">
              <iframe
                src={getEmbedUrl(selectedVideoId)}
                title={videos.find(v => v.id === selectedVideoId)?.title || "YouTube Video"}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default YoutubeVideoSection;