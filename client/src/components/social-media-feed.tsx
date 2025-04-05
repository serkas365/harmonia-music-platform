import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageCircle, Share2, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const [twitterPosts, setTwitterPosts] = useState<SocialMediaPost[]>([]);
  const [instagramPosts, setInstagramPosts] = useState<SocialMediaPost[]>([]);

  const fetchSocialPosts = async () => {
    setIsLoading(true);
    try {
      // Fetch Twitter posts
      if (twitterUsername) {
        const twitterResponse = await fetch(`/api/artists/${artistId}/social-posts?platform=twitter`);
        
        if (!twitterResponse.ok) {
          throw new Error('Failed to fetch Twitter posts');
        }
        
        let twitterData: SocialMediaPost[] = [];
        
        if (twitterResponse.headers.get('content-length') === '0' || !twitterResponse.headers.get('content-type')?.includes('application/json')) {
          twitterData = generatePlaceholderPosts(artistId, artistName, 'twitter');
        } else {
          twitterData = await twitterResponse.json();
        }
        
        setTwitterPosts(twitterData.slice(0, 4)); // Show only 4 posts
      }
      
      // Fetch Instagram posts
      if (instagramUsername) {
        const instagramResponse = await fetch(`/api/artists/${artistId}/social-posts?platform=instagram`);
        
        if (!instagramResponse.ok) {
          throw new Error('Failed to fetch Instagram posts');
        }
        
        let instagramData: SocialMediaPost[] = [];
        
        if (instagramResponse.headers.get('content-length') === '0' || !instagramResponse.headers.get('content-type')?.includes('application/json')) {
          instagramData = generatePlaceholderPosts(artistId, artistName, 'instagram');
        } else {
          instagramData = await instagramResponse.json();
        }
        
        setInstagramPosts(instagramData.slice(0, 4)); // Show only 4 posts
      }
    } catch (error) {
      console.error('Error fetching social posts:', error);
      // Generate placeholder data on error for development purposes
      if (twitterUsername) {
        setTwitterPosts(generatePlaceholderPosts(artistId, artistName, 'twitter').slice(0, 4));
      }
      if (instagramUsername) {
        setInstagramPosts(generatePlaceholderPosts(artistId, artistName, 'instagram').slice(0, 4));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialPosts();
  }, [artistId, twitterUsername, instagramUsername]);

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
      if (post.platform === 'twitter') {
        setTwitterPosts(prev => prev.map(p => 
          p.id === post.id 
            ? { 
                ...p, 
                likes: post.userLiked ? p.likes - 1 : p.likes + 1,
                userLiked: !post.userLiked 
              } 
            : p
        ));
      } else {
        setInstagramPosts(prev => prev.map(p => 
          p.id === post.id 
            ? { 
                ...p, 
                likes: post.userLiked ? p.likes - 1 : p.likes + 1,
                userLiked: !post.userLiked 
              } 
            : p
        ));
      }
      
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
        if (post.platform === 'twitter') {
          setTwitterPosts(prev => prev.map(p => 
            p.id === post.id 
              ? { 
                  ...p, 
                  shares: p.shares + 1,
                  userShared: true 
                } 
              : p
          ));
        } else {
          setInstagramPosts(prev => prev.map(p => 
            p.id === post.id 
              ? { 
                  ...p, 
                  shares: p.shares + 1,
                  userShared: true 
                } 
              : p
          ));
        }
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Social Media</h2>
        <Button variant="link" className="text-purple-600">
          View all
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Twitter Posts */}
        {twitterUsername && twitterPosts.length > 0 && (
          <Card className="overflow-hidden border-0 bg-[#132133]">
            <CardHeader className="pb-3">
              <div className="flex items-start">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://unavatar.io/twitter/${twitterUsername}`} alt={artistName} />
                  <AvatarFallback>{artistName[0]}</AvatarFallback>
                </Avatar>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{artistName}</p>
                      <p className="text-xs text-[#9ca3af]">@{twitterUsername}</p>
                    </div>
                    <div className="text-blue-400 text-sm">
                      {new Date(twitterPosts[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="whitespace-pre-wrap text-white">{twitterPosts[0].content}</p>
              {twitterPosts[0].imageUrl && (
                <img 
                  src={twitterPosts[0].imageUrl} 
                  alt=""
                  className="w-full h-auto rounded-md mt-3 object-cover"
                />
              )}
            </CardContent>
            <CardFooter className="border-t border-[#37415180] pt-3">
              <div className="flex justify-between w-full text-[#9ca3af]">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleLike(twitterPosts[0])}
                  className={twitterPosts[0].userLiked ? "text-red-500" : "text-[#9ca3af] hover:text-white"}
                >
                  <Heart className={`h-4 w-4 mr-1 ${twitterPosts[0].userLiked ? "fill-current" : ""}`} />
                  {twitterPosts[0].likes.toLocaleString()}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleComment(twitterPosts[0])}
                  className="text-[#9ca3af] hover:text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {twitterPosts[0].comments.toLocaleString()}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleShare(twitterPosts[0])}
                  className="text-[#9ca3af] hover:text-white"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  {twitterPosts[0].shares.toLocaleString()}
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}
        
        {/* Instagram Posts */}
        {instagramUsername && instagramPosts.length > 0 && (
          <Card className="overflow-hidden border-0 bg-[#1e1e1e]">
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
                    <p className="font-semibold text-white">{artistName}</p>
                    <div className="text-gray-400 text-sm">
                      {new Date(instagramPosts[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            {instagramPosts[0].imageUrl && (
              <div>
                <img 
                  src={instagramPosts[0].imageUrl} 
                  alt=""
                  className="w-full object-cover"
                  onClick={() => openPost(instagramPosts[0].url)}
                />
              </div>
            )}
            <CardContent className="pt-4 pb-3">
              <p className="text-sm whitespace-pre-wrap text-white">{instagramPosts[0].content}</p>
            </CardContent>
            <CardFooter className="border-t border-[#37415180] pt-3">
              <div className="flex justify-between w-full text-gray-400">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleLike(instagramPosts[0])}
                  className={instagramPosts[0].userLiked ? "text-red-500" : "text-gray-400 hover:text-white"}
                >
                  <Heart className={`h-4 w-4 mr-1 ${instagramPosts[0].userLiked ? "fill-current" : ""}`} />
                  {instagramPosts[0].likes.toLocaleString()}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleComment(instagramPosts[0])}
                  className="text-gray-400 hover:text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {instagramPosts[0].comments.toLocaleString()}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleShare(instagramPosts[0])}
                  className="text-gray-400 hover:text-white"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  {instagramPosts[0].shares.toLocaleString()}
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <>
            <Card className="border bg-[#132133]">
              <CardHeader className="pb-2">
                <div className="flex">
                  <Skeleton className="h-10 w-10 rounded-full bg-gray-700" />
                  <div className="ml-3 space-y-1 flex-1">
                    <Skeleton className="h-4 w-24 bg-gray-700" />
                    <Skeleton className="h-3 w-16 bg-gray-700" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <Skeleton className="h-4 w-full mb-2 bg-gray-700" />
                <Skeleton className="h-4 w-5/6 mb-2 bg-gray-700" />
                <Skeleton className="h-4 w-4/6 bg-gray-700" />
              </CardContent>
              <CardFooter className="pt-0">
                <div className="flex justify-between w-full">
                  <Skeleton className="h-6 w-14 bg-gray-700" />
                  <Skeleton className="h-6 w-14 bg-gray-700" />
                  <Skeleton className="h-6 w-14 bg-gray-700" />
                </div>
              </CardFooter>
            </Card>
            
            <Card className="border bg-[#1e1e1e]">
              <CardHeader className="pb-2">
                <div className="flex">
                  <Skeleton className="h-10 w-10 rounded-full bg-gray-700" />
                  <div className="ml-3 space-y-1 flex-1">
                    <Skeleton className="h-4 w-24 bg-gray-700" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3 space-y-3">
                <Skeleton className="h-64 w-full bg-gray-700" />
                <Skeleton className="h-4 w-full bg-gray-700" />
                <Skeleton className="h-4 w-5/6 bg-gray-700" />
              </CardContent>
              <CardFooter className="pt-0">
                <div className="flex justify-between w-full">
                  <Skeleton className="h-6 w-14 bg-gray-700" />
                  <Skeleton className="h-6 w-14 bg-gray-700" />
                  <Skeleton className="h-6 w-14 bg-gray-700" />
                </div>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </section>
  );
}

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
        content: `Thank you to all the fans around the world for making RENAISSANCE the biggest global album release of 2022 so far. It feels like we're experiencing an abundance of joy and surprise.`,
        imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
        url: 'https://twitter.com',
        date: new Date(now.getTime() - 15 * day).toISOString(),
        likes: 3500000,
        comments: 42000,
        shares: 18000,
        userLiked: false,
        userCommented: false,
        userShared: false
      },
      {
        id: `twitter-${artistId}-2`,
        platform: 'twitter',
        content: `Today is the first day of Black History Month. Let's celebrate the excellence of Black Americans. Each day this month we'll be sharing art and black artists that inspire us.`,
        url: 'https://twitter.com',
        date: new Date(now.getTime() - 1 * day).toISOString(),
        likes: 650000,
        comments: 14000,
        shares: 75000,
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
        likes: 312000,
        comments: 18000,
        shares: 5000,
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
        likes: 518000,
        comments: 64000,
        shares: 93000,
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
        likes: 2458000,
        comments: 143000,
        shares: 56000,
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
        likes: 3124000,
        comments: 198000,
        shares: 73000,
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
        likes: 1893000,
        comments: 87000,
        shares: 41000,
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
        likes: 2751000,
        comments: 124000,
        shares: 38000,
        userLiked: false,
        userCommented: false,
        userShared: false
      }
    ];
  }
}