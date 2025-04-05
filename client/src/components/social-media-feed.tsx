import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageCircle, Share2, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface SocialMediaPost {
  id: string;
  platform: 'twitter' | 'instagram';
  content: string;
  imageUrl?: string;
  url: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
  userLiked: boolean;
  userCommented: boolean;
  userShared: boolean;
}

interface SocialMediaFeedProps {
  artistId: number;
  artistName: string;
  twitterUsername?: string;
  instagramUsername?: string;
}

export default function SocialMediaFeed({ 
  artistId, 
  artistName,
  twitterUsername,
  instagramUsername 
}: SocialMediaFeedProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [activeTab, setActiveTab] = useState<'twitter' | 'instagram'>(
    twitterUsername ? 'twitter' : (instagramUsername ? 'instagram' : 'twitter')
  );

  const fetchSocialPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/artists/${artistId}/social-posts?platform=${activeTab}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch social posts');
      }
      
      // If we don't have actual data yet, use placeholder data
      let data: SocialMediaPost[] = [];
      
      if (response.headers.get('content-length') === '0' || !response.headers.get('content-type')?.includes('application/json')) {
        // Generate sample social posts if API returns empty
        data = generatePlaceholderPosts(artistId, artistName, activeTab);
      } else {
        data = await response.json();
      }
      
      setPosts(data);
    } catch (error) {
      console.error('Error fetching social posts:', error);
      // Generate placeholder data on error for development purposes
      setPosts(generatePlaceholderPosts(artistId, artistName, activeTab));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialPosts();
  }, [artistId, activeTab]);

  const handleLike = async (post: SocialMediaPost) => {
    try {
      const response = await fetch(`/api/social/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          platform: post.platform
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to like post');
      }
      
      // Optimistically update the UI
      setPosts(prev => prev.map(p => 
        p.id === post.id 
          ? { 
              ...p, 
              likes: post.userLiked ? p.likes - 1 : p.likes + 1,
              userLiked: !post.userLiked 
            } 
          : p
      ));
      
      toast({
        title: post.userLiked 
          ? t('socialMedia.unliked') 
          : t('socialMedia.liked'),
        description: t('socialMedia.likeToggled'),
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: t('common.error'),
        description: t('socialMedia.actionFailed'),
        variant: 'destructive'
      });
    }
  };

  const handleComment = async (post: SocialMediaPost) => {
    // In a real app, this would open a comment dialog
    // For now we'll just simulate the interaction
    try {
      window.open(post.url, '_blank');
      
      toast({
        title: t('socialMedia.redirecting'),
        description: t('socialMedia.openingPostOnPlatform', { platform: post.platform }),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('socialMedia.actionFailed'),
        variant: 'destructive'
      });
    }
  };

  const handleShare = async (post: SocialMediaPost) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${artistName} on ${post.platform}`,
          text: post.content,
          url: post.url
        });
        
        // Update the share count optimistically
        setPosts(prev => prev.map(p => 
          p.id === post.id 
            ? { 
                ...p, 
                shares: p.shares + 1,
                userShared: true 
              } 
            : p
        ));
      } else {
        // Fallback for browsers that don't support the Web Share API
        await navigator.clipboard.writeText(post.url);
        
        toast({
          title: t('socialMedia.linkCopied'),
          description: t('socialMedia.postLinkCopied'),
        });
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      toast({
        title: t('common.error'),
        description: t('socialMedia.actionFailed'),
        variant: 'destructive'
      });
    }
  };

  const openPost = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!twitterUsername && !instagramUsername) {
    return (
      <div className="text-center py-6 bg-background-elevated rounded-lg">
        <p className="text-muted-foreground">{t('socialMedia.noSocialAccounts')}</p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">{t('socialMedia.latestNews')}</h2>
      
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as 'twitter' | 'instagram')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          {twitterUsername && (
            <TabsTrigger value="twitter" disabled={!twitterUsername}>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    fill="currentColor" 
                    d="M21.543 7.104c.015.211.015.423.015.636 0 6.507-4.954 14.01-14.01 14.01v-.003A13.94 13.94 0 0 1 0 19.539a9.88 9.88 0 0 0 7.287-2.041 4.93 4.93 0 0 1-4.6-3.42 4.916 4.916 0 0 0 2.223-.084A4.926 4.926 0 0 1 .96 9.167v-.062a4.887 4.887 0 0 0 2.235.616A4.928 4.928 0 0 1 1.67 3.148 13.98 13.98 0 0 0 11.82 8.292a4.929 4.929 0 0 1 8.39-4.49 9.868 9.868 0 0 0 3.128-1.196 4.941 4.941 0 0 1-2.165 2.724A9.828 9.828 0 0 0 24 4.555a10.019 10.019 0 0 1-2.457 2.549z" 
                  />
                </svg>
                Twitter
              </span>
            </TabsTrigger>
          )}
          
          {instagramUsername && (
            <TabsTrigger value="instagram" disabled={!instagramUsername}>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    fill="currentColor" 
                    d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" 
                  />
                </svg>
                Instagram
              </span>
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="twitter" className="mt-4">
          {isLoading ? (
            // Skeleton loaders for Twitter posts
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={`twitter-skeleton-${i}`} className="mb-4">
                <CardHeader className="pb-2">
                  <div className="flex">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="ml-3 space-y-1 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-2" />
                  <Skeleton className="h-4 w-4/6" />
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex justify-between w-full">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map(post => (
                <Card key={post.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://unavatar.io/twitter/${twitterUsername}`} alt={artistName} />
                        <AvatarFallback>{artistName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{artistName}</p>
                            <p className="text-xs text-muted-foreground">@{twitterUsername}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openPost(post.url)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="whitespace-pre-wrap">{post.content}</p>
                    {post.imageUrl && (
                      <img 
                        src={post.imageUrl} 
                        alt=""
                        className="w-full h-auto rounded-md mt-3 object-cover"
                      />
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(post.date).toLocaleString()}
                    </p>
                  </CardContent>
                  <CardFooter className="border-t pt-3">
                    <div className="flex justify-between w-full">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleLike(post)}
                        className={post.userLiked ? "text-red-500" : ""}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${post.userLiked ? "fill-current" : ""}`} />
                        {post.likes}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleComment(post)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {post.comments}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleShare(post)}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        {post.shares}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-background-elevated rounded-lg">
              <p className="text-muted-foreground">
                {twitterUsername 
                  ? t('socialMedia.noTweets', { username: twitterUsername }) 
                  : t('socialMedia.noTwitterAccount')}
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="instagram" className="mt-4">
          {isLoading ? (
            // Skeleton loaders for Instagram posts
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={`instagram-skeleton-${i}`}>
                  <CardHeader className="pb-2">
                    <div className="flex">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="ml-3 space-y-1 flex-1">
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3 space-y-3">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="flex justify-between w-full">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map(post => (
                <Card key={post.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={`https://unavatar.io/instagram/${instagramUsername}`} 
                          alt={artistName} 
                        />
                        <AvatarFallback>{artistName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{artistName}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openPost(post.url)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  {post.imageUrl && (
                    <div className="relative aspect-square">
                      <img 
                        src={post.imageUrl} 
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        onClick={() => openPost(post.url)}
                      />
                    </div>
                  )}
                  <CardContent className="pt-4 pb-3">
                    <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(post.date).toLocaleString()}
                    </p>
                  </CardContent>
                  <CardFooter className="border-t pt-3">
                    <div className="flex justify-between w-full">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleLike(post)}
                        className={post.userLiked ? "text-red-500" : ""}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${post.userLiked ? "fill-current" : ""}`} />
                        {post.likes}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleComment(post)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {post.comments}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleShare(post)}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        {post.shares}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-background-elevated rounded-lg">
              <p className="text-muted-foreground">
                {instagramUsername 
                  ? t('socialMedia.noInstagramPosts', { username: instagramUsername }) 
                  : t('socialMedia.noInstagramAccount')}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}

// Helper function to generate placeholder posts for development
function generatePlaceholderPosts(
  artistId: number, 
  artistName: string, 
  platform: 'twitter' | 'instagram'
): SocialMediaPost[] {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000; // 1 day in milliseconds
  
  if (platform === 'twitter') {
    return [
      {
        id: `twitter-${artistId}-1`,
        platform: 'twitter',
        content: `Just finished recording our new single! Can't wait for you all to hear it. 🎵 #NewMusic #ComingSoon`,
        url: 'https://twitter.com',
        date: new Date(now.getTime() - 2 * day).toISOString(),
        likes: 128,
        comments: 24,
        shares: 15,
        userLiked: false,
        userCommented: false,
        userShared: false
      },
      {
        id: `twitter-${artistId}-2`,
        platform: 'twitter',
        content: `Tickets for our summer tour are now available! Get them before they sell out. Link in bio. 🎫 #Tour #LiveMusic`,
        imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
        url: 'https://twitter.com',
        date: new Date(now.getTime() - 4 * day).toISOString(),
        likes: 245,
        comments: 42,
        shares: 78,
        userLiked: false,
        userCommented: false,
        userShared: false
      },
      {
        id: `twitter-${artistId}-3`,
        platform: 'twitter',
        content: `Thank you to everyone who came to our show last night! You were amazing! ❤️`,
        url: 'https://twitter.com',
        date: new Date(now.getTime() - 6 * day).toISOString(),
        likes: 312,
        comments: 18,
        shares: 5,
        userLiked: false,
        userCommented: false,
        userShared: false
      },
      {
        id: `twitter-${artistId}-4`,
        platform: 'twitter',
        content: `We're excited to announce we'll be performing at @MusicFestival this year! See you there! 🎉 #Festival #LiveMusic`,
        imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
        url: 'https://twitter.com',
        date: new Date(now.getTime() - 8 * day).toISOString(),
        likes: 518,
        comments: 64,
        shares: 93,
        userLiked: false,
        userCommented: false,
        userShared: false
      }
    ];
  } else {
    return [
      {
        id: `instagram-${artistId}-1`,
        platform: 'instagram',
        content: `Studio session today. Working on something special for you all. 🎧 #StudioLife`,
        imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1528&q=80',
        url: 'https://instagram.com',
        date: new Date(now.getTime() - 1 * day).toISOString(),
        likes: 2458,
        comments: 143,
        shares: 56,
        userLiked: false,
        userCommented: false,
        userShared: false
      },
      {
        id: `instagram-${artistId}-2`,
        platform: 'instagram',
        content: `Behind the scenes from our latest music video shoot. 🎬 #BTS #MusicVideo`,
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
        url: 'https://instagram.com',
        date: new Date(now.getTime() - 3 * day).toISOString(),
        likes: 3124,
        comments: 198,
        shares: 73,
        userLiked: false,
        userCommented: false,
        userShared: false
      },
      {
        id: `instagram-${artistId}-3`,
        platform: 'instagram',
        content: `New merch drop! Link in bio to shop. 👕 #MerchDrop`,
        imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
        url: 'https://instagram.com',
        date: new Date(now.getTime() - 5 * day).toISOString(),
        likes: 1893,
        comments: 87,
        shares: 41,
        userLiked: false,
        userCommented: false,
        userShared: false
      },
      {
        id: `instagram-${artistId}-4`,
        platform: 'instagram',
        content: `Soundcheck for tonight's show. See you soon! 🎤 #TourLife`,
        imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
        url: 'https://instagram.com',
        date: new Date(now.getTime() - 7 * day).toISOString(),
        likes: 2751,
        comments: 124,
        shares: 38,
        userLiked: false,
        userCommented: false,
        userShared: false
      }
    ];
  }
}