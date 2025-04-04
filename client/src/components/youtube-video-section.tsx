import { useTranslation } from "react-i18next";
import { Youtube } from "lucide-react";

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
}

interface YoutubeVideoSectionProps {
  videos: Video[];
  channelId?: string;
}

const YoutubeVideoSection = ({ videos, channelId }: YoutubeVideoSectionProps) => {
  const { t } = useTranslation();

  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <section className="bg-background-elevated rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">{t('artist.latestVideos')}</h2>
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
        {videos.map(video => (
          <div key={video.id} className="group cursor-pointer">
            <div className="relative aspect-video overflow-hidden rounded-md bg-background-highlight mb-2">
              <a 
                href={`https://www.youtube.com/watch?v=${video.id}`} 
                target="_blank"
                rel="noopener noreferrer"
              >
                <img 
                  src={video.thumbnailUrl} 
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-primary/90 rounded-full flex items-center justify-center">
                    <Youtube className="h-6 w-6 text-white" />
                  </div>
                </div>
              </a>
            </div>
            <h3 className="font-medium text-sm line-clamp-2">{video.title}</h3>
          </div>
        ))}
      </div>
    </section>
  );
};

export default YoutubeVideoSection;