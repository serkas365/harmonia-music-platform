import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Redirect, useLocation, useRoute } from 'wouter';
import { Music, Play, Edit, Trash2, Save, MoreHorizontal, ArrowLeft, Plus, MoreVertical, X, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogClose 
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Playlist, PlaylistTrack, Track } from '@shared/schema';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { formatDuration } from '@/lib/utils';

const PlaylistPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [match, params] = useRoute<{ id: string }>('/playlists/:id');
  const playTrack = usePlayerStore((state) => state.playTrack);
  const playTracks = usePlayerStore((state) => state.playTracks);
  
  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddTrackDialog, setShowAddTrackDialog] = useState(false);
  
  // Redirect if not authenticated
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // If no match, return to home
  if (!match || !params.id) {
    return <Redirect to="/" />;
  }
  
  const playlistId = parseInt(params.id);
  
  // Fetch playlist data
  const { 
    data: playlist, 
    isLoading: isLoadingPlaylist,
    error: playlistError
  } = useQuery<Playlist>({
    queryKey: [`/api/playlists/${playlistId}`],
    queryFn: async () => {
      const res = await fetch(`/api/playlists/${playlistId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Playlist not found');
        }
        throw new Error('Failed to fetch playlist');
      }
      return res.json();
    }
  });
  
  // Fetch available tracks for adding to playlist
  const { 
    data: availableTracks = [], 
    isLoading: isLoadingTracks 
  } = useQuery<Track[]>({
    queryKey: ['/api/tracks'],
    queryFn: async () => {
      const res = await fetch('/api/tracks');
      if (!res.ok) throw new Error('Failed to fetch tracks');
      return res.json();
    },
    enabled: showAddTrackDialog
  });
  
  // Initialize edit form when playlist data is loaded
  useEffect(() => {
    if (playlist) {
      setEditName(playlist.name);
      setEditIsPublic(playlist.isPublic);
    }
  }, [playlist]);
  
  // Update playlist mutation
  const updatePlaylistMutation = useMutation({
    mutationFn: async (data: { name: string, isPublic: boolean }) => {
      const res = await apiRequest('PUT', `/api/playlists/${playlistId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/playlists/${playlistId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/me/playlists'] });
      
      toast({
        title: t('playlist.updateSuccess'),
        description: t('playlist.playlistUpdated'),
      });
      
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('playlist.updateError'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Delete playlist mutation
  const deletePlaylistMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', `/api/playlists/${playlistId}`);
      if (!res.ok) throw new Error('Failed to delete playlist');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me/playlists'] });
      
      toast({
        title: t('playlist.deleteSuccess'),
        description: t('playlist.playlistDeleted'),
      });
      
      navigate('/library');
    },
    onError: (error: Error) => {
      toast({
        title: t('playlist.deleteError'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Add track to playlist mutation
  const addTrackMutation = useMutation({
    mutationFn: async ({ trackId, position }: { trackId: number, position: number }) => {
      const res = await apiRequest('POST', `/api/playlists/${playlistId}/tracks`, { trackId, position });
      if (!res.ok) throw new Error('Failed to add track');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/playlists/${playlistId}`] });
      
      toast({
        title: t('playlist.addTrackSuccess'),
        description: t('playlist.trackAdded'),
      });
      
      setShowAddTrackDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('playlist.addTrackError'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Remove track from playlist mutation
  const removeTrackMutation = useMutation({
    mutationFn: async (trackId: number) => {
      const res = await apiRequest('DELETE', `/api/playlists/${playlistId}/tracks/${trackId}`);
      if (!res.ok) throw new Error('Failed to remove track');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/playlists/${playlistId}`] });
      
      toast({
        title: t('playlist.removeTrackSuccess'),
        description: t('playlist.trackRemoved'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('playlist.removeTrackError'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const handleSaveChanges = () => {
    if (!editName.trim()) {
      toast({
        title: t('playlist.nameRequired'),
        description: t('playlist.enterName'),
        variant: 'destructive',
      });
      return;
    }
    
    updatePlaylistMutation.mutate({ name: editName, isPublic: editIsPublic });
  };
  
  const handleDeletePlaylist = () => {
    deletePlaylistMutation.mutate();
  };
  
  const handleAddTrack = (trackId: number) => {
    if (!playlist?.tracks) return;
    const position = playlist.tracks.length;
    addTrackMutation.mutate({ trackId, position });
  };
  
  const handleRemoveTrack = (trackId: number) => {
    removeTrackMutation.mutate(trackId);
  };
  
  const handlePlayAll = () => {
    if (!playlist?.tracks || playlist.tracks.length === 0) return;
    
    const tracksToPlay = playlist.tracks
      .map(pt => pt.track)
      .filter((track): track is Track => !!track);
    
    if (tracksToPlay.length > 0) {
      playTracks(tracksToPlay, 0);
    }
  };
  
  // Loading state
  if (isLoadingPlaylist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-2" 
            onClick={() => navigate('/library')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <Skeleton className="h-10 w-40" />
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-64">
            <Skeleton className="w-full aspect-square rounded-md" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-10 w-32 mb-6" />
            
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-full max-w-md mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (playlistError || !playlist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-2" 
            onClick={() => navigate('/library')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <h1 className="text-3xl font-bold">{t('playlist.error')}</h1>
        </div>
        
        <div className="bg-destructive/10 p-6 rounded-lg text-center">
          <p className="text-destructive mb-4">{t('playlist.notFound')}</p>
          <Button onClick={() => navigate('/library')}>
            {t('common.backToLibrary')}
          </Button>
        </div>
      </div>
    );
  }
  
  // Check if user is the owner
  const isOwner = user.id === playlist.userId;
  const tracks = playlist.tracks || [];
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2" 
          onClick={() => navigate('/library')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? t('playlist.editing') : playlist.name}
        </h1>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Playlist Cover and Details */}
        <div className="md:w-64">
          <div className="aspect-square bg-background-highlight rounded-md mb-4 overflow-hidden">
            {playlist.coverImage ? (
              <img 
                src={playlist.coverImage} 
                alt={playlist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>
          
          {/* Playlist Info */}
          {!isEditing ? (
            <div className="mb-4">
              <h2 className="text-xl font-bold">{playlist.name}</h2>
              <p className="text-sm text-muted-foreground">
                {tracks.length} {tracks.length === 1 ? t('playlist.track') : t('playlist.tracks')}
              </p>
              <p className="text-sm text-muted-foreground">
                {playlist.isPublic ? t('playlist.public') : t('playlist.private')}
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              <div>
                <Label htmlFor="edit-name">{t('playlist.name')}</Label>
                <Input 
                  id="edit-name" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-is-public">{t('playlist.isPublic')}</Label>
                <Switch 
                  id="edit-is-public" 
                  checked={editIsPublic} 
                  onCheckedChange={setEditIsPublic} 
                />
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button 
              className="w-full gap-2" 
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
            >
              <Play className="h-4 w-4" />
              {t('playlist.playAll')}
            </Button>
            
            {isOwner && (
              <>
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2" 
                      onClick={handleSaveChanges}
                      disabled={updatePlaylistMutation.isPending}
                    >
                      {updatePlaylistMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {t('common.save')}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full" 
                      onClick={() => {
                        setEditName(playlist.name);
                        setEditIsPublic(playlist.isPublic);
                        setIsEditing(false);
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                  </>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full gap-2">
                        <MoreHorizontal className="h-4 w-4" />
                        {t('common.options')}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {t('playlist.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowAddTrackDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('playlist.addTracks')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('playlist.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Playlist Tracks */}
        <div className="flex-1">
          <div className="bg-background-elevated rounded-md overflow-hidden">
            {tracks.length > 0 ? (
              <div className="divide-y divide-border">
                {tracks.map((playlistTrack, index) => {
                  const track = playlistTrack.track;
                  if (!track) return null;
                  
                  return (
                    <div 
                      key={`${playlistTrack.id}-${track.id}`}
                      className="flex items-center p-3 hover:bg-background-highlight transition-colors"
                    >
                      <div className="w-8 text-center text-muted-foreground mr-2">{index + 1}</div>
                      <div className="flex-1 flex items-center min-w-0">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={`/assets/images/album-covers/${track.albumId}.jpg`} alt={track.title} />
                          <AvatarFallback>{track.title.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{track.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                        </div>
                        <div className="text-sm text-muted-foreground mx-4">
                          {formatDuration(track.duration)}
                        </div>
                      </div>
                      <div className="flex">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => playTrack(track)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        
                        {isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleRemoveTrack(track.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('playlist.removeTrack')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">{t('playlist.empty')}</p>
                {isOwner && (
                  <Button onClick={() => setShowAddTrackDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('playlist.addTracks')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('playlist.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('playlist.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePlaylist}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deletePlaylistMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {t('playlist.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Add Track Dialog */}
      <Dialog open={showAddTrackDialog} onOpenChange={setShowAddTrackDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('playlist.addTracks')}</DialogTitle>
            <DialogDescription>
              {t('playlist.selectTracksToAdd')}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingTracks ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              {availableTracks.length > 0 ? (
                <div className="space-y-2">
                  {availableTracks.map((track) => {
                    // Check if track is already in playlist
                    const isInPlaylist = playlist.tracks?.some(pt => pt.track?.id === track.id);
                    
                    return (
                      <div 
                        key={track.id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-background-highlight transition-colors"
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={`/assets/images/album-covers/${track.albumId}.jpg`} alt={track.title} />
                            <AvatarFallback>{track.title.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{track.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          variant={isInPlaylist ? "ghost" : "outline"}
                          disabled={isInPlaylist || addTrackMutation.isPending}
                          onClick={() => handleAddTrack(track.id)}
                        >
                          {isInPlaylist ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              {t('playlist.added')}
                            </>
                          ) : addTrackMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              {t('playlist.add')}
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('playlist.noTracksAvailable')}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">
                {t('common.done')}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlaylistPage;