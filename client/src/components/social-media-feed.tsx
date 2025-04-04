import { useTranslation } from "react-i18next";
import { Calendar, Heart, MessageCircle, Share2, Twitter, Instagram } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

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

interface SocialMediaFeedProps {
  posts: SocialPost[];
  instagramUsername?: string;
  twitterUsername?: string;
}

const SocialMediaFeed = ({ posts, instagramUsername, twitterUsername }: SocialMediaFeedProps) => {
  const { t } = useTranslation();

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section className="bg-background-elevated rounded-lg p-6 space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{t('artist.socialFeed')}</h2>
        <div className="flex space-x-2">
          {twitterUsername && (
            <a 
              href={`https://twitter.com/${twitterUsername}`} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Twitter className="h-5 w-5" />
            </a>
          )}
          {instagramUsername && (
            <a 
              href={`https://instagram.com/${instagramUsername}`} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="border border-border rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {post.platform === 'twitter' ? (
                  <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                ) : (
                  <Instagram className="h-5 w-5 text-[#E1306C]" />
                )}
                <span className="text-sm font-medium">
                  {post.platform === 'twitter' ? '@' + twitterUsername : '@' + instagramUsername}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Calendar className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(post.postedAt), { addSuffix: true })}</span>
              </div>
            </div>
            
            <p className="text-sm">{post.content}</p>
            
            {post.imageUrl && (
              <img 
                src={post.imageUrl} 
                alt="Social media post" 
                className="w-full h-auto rounded-md object-cover"
              />
            )}
            
            <div className="flex justify-between pt-2">
              <div className="flex space-x-4">
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <Heart className="h-4 w-4" />
                  <span>{post.likes}</span>
                </button>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.comments}</span>
                </button>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
              
              <a 
                href={post.url} 
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {t('common.viewPost')}
              </a>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center">
        <Button variant="outline" size="sm">
          {t('common.loadMore')}
        </Button>
      </div>
    </section>
  );
};

export default SocialMediaFeed;