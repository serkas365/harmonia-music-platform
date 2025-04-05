import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Heart, MessageCircle, Share2, Send } from 'lucide-react';

interface CommentData {
  id: string;
  authorName: string;
  avatarUrl?: string;
  content: string;
  timestamp: string;
  likes: number;
}

interface SocialMediaCommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    platform: 'twitter' | 'instagram';
    content: string;
    imageUrl?: string;
    date: string;
    likes: number;
    comments: number;
    shares: number;
  };
  artistName: string;
  platformUsername: string;
  onAddComment: (comment: string) => Promise<void>;
}

export function SocialMediaCommentDialog({
  open,
  onOpenChange,
  post,
  artistName,
  platformUsername,
  onAddComment
}: SocialMediaCommentDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Placeholder comments - in a real app this would come from an API
  const [comments, setComments] = useState<CommentData[]>([
    {
      id: '1',
      authorName: 'Music Lover',
      avatarUrl: '',
      content: 'This is amazing! Can\'t wait to hear more from you!',
      timestamp: '2d',
      likes: 24
    },
    {
      id: '2',
      authorName: 'Concert Goer',
      avatarUrl: '',
      content: 'Will you be touring in Europe anytime soon?',
      timestamp: '1d',
      likes: 12
    },
    {
      id: '3',
      authorName: 'Biggest Fan',
      avatarUrl: '',
      content: 'Your music has been the soundtrack to my life! ❤️',
      timestamp: '6h',
      likes: 57
    }
  ]);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onAddComment(commentText);
      
      // Add the comment to the local state
      const newComment: CommentData = {
        id: Date.now().toString(),
        authorName: 'You',
        content: commentText,
        timestamp: 'Just now',
        likes: 0
      };
      
      setComments([newComment, ...comments]);
      setCommentText('');
      
      toast({
        title: t('socialMedia.commentAdded'),
        description: t('socialMedia.commentAddedDesc')
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: t('common.error'),
        description: t('socialMedia.commentError'),
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-xl ${post.platform === 'twitter' ? 'bg-[#15202b]' : 'bg-[#121212]'} text-white border-zinc-700`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {t('socialMedia.comments')} 
            <span className="text-sm text-muted-foreground">({comments.length})</span>
          </DialogTitle>
        </DialogHeader>
        
        {/* Original post */}
        <div className="border-b border-zinc-700 pb-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={`https://unavatar.io/${post.platform}/${platformUsername}`} 
                  alt={artistName} 
                />
                <AvatarFallback>{artistName[0]}</AvatarFallback>
              </Avatar>
              {/* Platform logo */}
              <div className="absolute -bottom-1 -left-1">
                {post.platform === 'twitter' ? (
                  <svg className="h-5 w-5 text-[#1DA1F2]" viewBox="0 0 24 24" fill="#1DA1F2" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <linearGradient id="instagram-comment-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FFDC80" />
                      <stop offset="8.333%" stopColor="#FCAF45" />
                      <stop offset="16.667%" stopColor="#F77737" />
                      <stop offset="25%" stopColor="#F56040" />
                      <stop offset="33.333%" stopColor="#FD1D1D" />
                      <stop offset="41.667%" stopColor="#E1306C" />
                      <stop offset="50%" stopColor="#C13584" />
                      <stop offset="58.333%" stopColor="#833AB4" />
                      <stop offset="66.667%" stopColor="#5B51D8" />
                      <stop offset="75%" stopColor="#405DE6" />
                      <stop offset="83.333%" stopColor="#6559CA" />
                      <stop offset="91.667%" stopColor="#8A3AB9" />
                      <stop offset="100%" stopColor="#C13584" />
                    </linearGradient>
                    <path fill="url(#instagram-comment-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold">{artistName}</span>
                <span className="text-zinc-400 text-sm">@{platformUsername}</span>
              </div>
              <p className="text-sm text-zinc-300">{post.content}</p>
            </div>
          </div>
          
          {post.imageUrl && (
            <div className="rounded-md overflow-hidden ml-12">
              <img 
                src={post.imageUrl} 
                alt="" 
                className="w-full h-auto object-cover max-h-60"
              />
            </div>
          )}
        </div>
        
        {/* Add comment */}
        <div className="pt-2 pb-4">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t('socialMedia.addComment')}
                className={`resize-none border-none ${post.platform === 'twitter' ? 'bg-[#1c2732]' : 'bg-[#1e1e1e]'} text-white placeholder:text-zinc-400 mb-2`}
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || isSubmitting}
                  className={post.platform === 'twitter' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gradient-to-r from-purple-500 to-pink-500'}
                >
                  <Send className="h-4 w-4 mr-1" />
                  {t('socialMedia.postComment')}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Comments list */}
        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                {comment.avatarUrl ? (
                  <AvatarImage src={comment.avatarUrl} alt={comment.authorName} />
                ) : (
                  <AvatarFallback>{comment.authorName[0]}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{comment.authorName}</span>
                  <span className="text-zinc-400 text-xs">{comment.timestamp}</span>
                </div>
                <p className="text-sm text-zinc-300">{comment.content}</p>
                <div className="flex gap-3 mt-1">
                  <button className="text-zinc-400 hover:text-red-500 text-xs flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {comment.likes}
                  </button>
                  <button className="text-zinc-400 hover:text-blue-500 text-xs flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <DialogFooter className="sm:justify-start text-zinc-400 text-xs">
          {t('socialMedia.commentDisclaimer')}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}