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
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={`https://unavatar.io/${post.platform}/${platformUsername}`} 
                alt={artistName} 
              />
              <AvatarFallback>{artistName[0]}</AvatarFallback>
            </Avatar>
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