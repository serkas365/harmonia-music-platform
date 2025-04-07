import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Redirect } from 'wouter';
import { ArtistAnalytics, ArtistFollower, Artist } from '@shared/schema';

// Extended ArtistUpload type to match our implementation
interface ArtistUpload {
  id: number;
  artistId: number;
  title: string;
  uploadType: string;
  status: string;
  trackId?: number;
  albumId?: number;
  details: {
    description?: string;
    genres?: string[];
    coverImage?: string;
    audioFile?: string;
    tracklist?: { title: string; audioFile: string; trackNumber: number; }[];
    tracks?: { 
      title: string; 
      audioFile?: string; 
      audioUrl?: string;
      trackNumber: number;
      duration?: number;
      price?: number;
      explicit?: boolean;
    }[];
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}
import { 
  Loader2, TrendingUp, Users, User, Calendar, Save, Upload, DollarSign,
  Globe, Instagram, Twitter, Youtube, Facebook, Link2, Plus, Trash,
  Pencil, ExternalLink, Music, Album as AlbumIcon, MusicIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';

// Type for upload form data
interface UploadFormData {
  id?: number;
  title: string;
  uploadType: 'track' | 'album';
  details: {
    description: string;
    genres: string[];
    coverImage: string;
    audioFile?: string;
    releaseDate?: string;
    duration?: number;
    price?: number;
    explicit?: boolean;
    tracks?: { 
      title: string; 
      audioFile?: string; 
      audioUrl?: string;
      trackNumber: number;
      duration?: number;
      price?: number;
      explicit?: boolean;
    }[];
    errorMessage?: string;
    tracklist?: { title: string; audioFile: string; trackNumber: number; }[];
  };
}

const ArtistDashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Check URL parameters for tab selection
  const getInitialTab = () => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'profile') return 'profile';
    return 'overview';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('month');
  
  // States to manage pending upload operations (simulating upload process)
  const [isPendingUpload, setIsPendingUpload] = useState(false);

  // States for artist profile data
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [facebook, setFacebook] = useState('');
  const [youtube, setYoutube] = useState('');

  // States for uploads tab
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editingUpload, setEditingUpload] = useState<ArtistUpload | null>(null);
  const [newUploadType, setNewUploadType] = useState<'track' | 'album'>('track');
  const [uploadFormData, setUploadFormData] = useState<UploadFormData>({
    title: '',
    uploadType: 'track',
    details: {
      description: '',
      genres: [],
      coverImage: '',
      audioFile: '',
      tracklist: []
    }
  });
  
  // For debugging
  const [debugLog, setDebugLog] = useState<string[]>([]);

  // Redirect if not an artist
  if (!user || user.role !== 'artist') {
    return <Redirect to="/" />;
  }

  // Analytics data
  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useQuery<ArtistAnalytics[]>({
    queryKey: ['/api/artist-dashboard/analytics', period],
    queryFn: async () => {
      const res = await fetch(`/api/artist-dashboard/analytics?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
  });

  // Followers data
  const {
    data: followers,
    isLoading: followersLoading,
    error: followersError,
  } = useQuery<ArtistFollower[]>({
    queryKey: ['/api/artist-dashboard/followers'],
    queryFn: async () => {
      const res = await fetch('/api/artist-dashboard/followers');
      if (!res.ok) throw new Error('Failed to fetch followers');
      return res.json();
    },
  });

  // Fetch artist profile data
  const {
    data: artistProfile,
    isLoading: isLoadingProfile,
    error: profileError
  } = useQuery<Artist>({
    queryKey: ['/api/me/artist-profile'],
    queryFn: async () => {
      const res = await fetch('/api/me/artist-profile');
      if (!res.ok) throw new Error('Failed to fetch artist profile');
      return res.json();
    }
  });
  
  // Fetch artist uploads data
  const {
    data: uploads,
    isLoading: isLoadingUploads,
    error: uploadsError,
    refetch: refetchUploads
  } = useQuery<ArtistUpload[]>({
    queryKey: ['/api/artist-dashboard/uploads'],
    queryFn: async () => {
      const res = await fetch('/api/artist-dashboard/uploads');
      if (!res.ok) throw new Error('Failed to fetch uploads');
      return res.json();
    }
  });

  // Set form values when data changes
  useEffect(() => {
    if (artistProfile) {
      setName(artistProfile.name || '');
      setBio(artistProfile.bio || '');
      setImage(artistProfile.image || '');
      setGenres(artistProfile.genres || []);
      setWebsite(artistProfile.socialLinks?.website || '');
      setInstagram(artistProfile.socialLinks?.instagram || '');
      setTwitter(artistProfile.socialLinks?.twitter || '');
      setFacebook(artistProfile.socialLinks?.facebook || '');
      setYoutube(artistProfile.socialLinks?.youtube || '');
    }
  }, [artistProfile]);

  // Update artist profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<Artist>) => {
      const res = await apiRequest('PATCH', '/api/me/artist-profile', profileData);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all related caches to refresh data across the app
      queryClient.invalidateQueries({ queryKey: ['/api/me/artist-profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/artists'] }); // Invalidate top artists on home page
      
      // Also invalidate any specific artist endpoints that might be cached
      if (artistProfile?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/artists/${artistProfile.id}`] });
      }
      
      toast({
        title: t('artistProfile.updateSuccess'),
        description: t('artistProfile.profileUpdated'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('artistProfile.updateError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      name,
      bio,
      image,
      genres,
      socialLinks: {
        website,
        instagram,
        twitter,
        facebook,
        youtube,
      }
    });
  };
  
  // Create a new upload mutation
  const createUploadMutation = useMutation({
    mutationFn: async (uploadData: Omit<UploadFormData, 'id'>) => {
      const res = await apiRequest('POST', '/api/artist-dashboard/uploads', uploadData);
      return res.json();
    },
    onSuccess: () => {
      setShowUploadDialog(false);
      
      // Refresh uploads list
      refetchUploads();
      
      toast({
        title: t('artistDashboard.uploadCreated'),
        description: t('artistDashboard.uploadCreatedDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('artistDashboard.uploadError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Update an existing upload mutation
  const updateUploadMutation = useMutation({
    mutationFn: async (data: { id: number, updates: Partial<UploadFormData> }) => {
      const res = await apiRequest('PUT', `/api/artist-dashboard/uploads/${data.id}`, data.updates);
      return res.json();
    },
    onSuccess: () => {
      setShowUploadDialog(false);
      setEditingUpload(null);
      
      // Refresh uploads list
      refetchUploads();
      
      toast({
        title: t('artistDashboard.uploadUpdated'),
        description: t('artistDashboard.uploadUpdatedDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('artistDashboard.updateError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Process upload mutation - converts pending upload to actual track/album
  const processUploadMutation = useMutation({
    mutationFn: async (data: { id: number, trackData?: any, albumData?: any, tracks?: any[] }) => {
      const res = await apiRequest('POST', `/api/artist-dashboard/uploads/${data.id}/process`, data);
      return res.json();
    },
    onSuccess: (data) => {
      // Refresh uploads list
      refetchUploads();
      
      toast({
        title: t('artistDashboard.uploadProcessed'),
        description: t('artistDashboard.uploadProcessedDescription'),
      });
      
      // Also invalidate artist tracks/albums
      if (artistProfile?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/artists/${artistProfile.id}/tracks`] });
        queryClient.invalidateQueries({ queryKey: [`/api/artists/${artistProfile.id}/albums`] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: t('artistDashboard.processingError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Handler functions for the uploads tab
  const handleNewUpload = (type: 'track' | 'album') => {
    setNewUploadType(type);
    setEditingUpload(null);
    setUploadFormData({
      title: '',
      uploadType: type,
      details: {
        description: '',
        genres: [],
        coverImage: '',
        audioFile: type === 'track' ? '' : undefined,
        tracklist: type === 'album' ? [{
          title: '',
          audioFile: '',
          trackNumber: 1
        }] : undefined
      }
    });
    setShowUploadDialog(true);
  };
  
  const handleEditUpload = (upload: ArtistUpload) => {
    setEditingUpload(upload);
    setUploadFormData({
      id: upload.id,
      title: upload.title,
      uploadType: upload.uploadType as 'track' | 'album',
      details: {
        description: upload.details.description || '',
        genres: upload.details.genres || [],
        coverImage: upload.details.coverImage || '',
        audioFile: upload.details.audioFile || '',
        // If it's an album, also load any existing tracklist or create a default one
        tracklist: upload.uploadType === 'album' 
          ? (upload.details.tracklist || upload.details.tracks?.map((track: any, index: number) => ({
              title: track.title || '',
              audioFile: track.audioFile || track.audioUrl || '',
              trackNumber: track.trackNumber || index + 1
            })) || [{
              title: '',
              audioFile: '',
              trackNumber: 1
            }])
          : undefined
      }
    });
    setShowUploadDialog(true);
  };
  
  const handleSaveUpload = () => {
    console.log("Saving upload form data:", JSON.stringify(uploadFormData, null, 2));
    
    // If it's an album upload, make sure we handle the tracklist properly
    if (uploadFormData.uploadType === 'album') {
      // Add tracklist data to the standard tracks field for backend compatibility
      uploadFormData.details.tracks = uploadFormData.details.tracklist?.map(track => ({
        title: track.title,
        audioFile: track.audioFile,
        trackNumber: track.trackNumber
      })) || [];
    }
    
    if (editingUpload) {
      // Update existing upload
      updateUploadMutation.mutate({
        id: editingUpload.id,
        updates: uploadFormData
      });
    } else {
      // Create new upload
      createUploadMutation.mutate(uploadFormData, {
        onSuccess: async (newUpload) => {
          // After successful creation, publish the track to make it immediately available
          await publishUpload(newUpload);
        }
      });
    }
  };
  
  // Function to publish the upload (convert it to a track/album in the catalog)
  const publishUpload = async (upload: ArtistUpload) => {
    try {
      console.log("Publishing upload:", upload.id, "with data:", JSON.stringify(upload, null, 2));
      
      // Ensure upload has a valid ID
      if (!upload.id) {
        console.error("Upload ID is missing");
        throw new Error('Upload ID is missing');
      }
      
      const response = await fetch(`/api/artist-dashboard/uploads/${upload.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: upload.id,
          // Add necessary data for processing
          albumData: upload.uploadType === 'album' ? {
            title: upload.title,
            description: upload.details.description || '',
            genres: upload.details.genres || [],
            coverImage: upload.details.coverImage || ''
          } : undefined,
          trackData: upload.uploadType === 'track' ? {
            title: upload.title,
            description: upload.details.description || '',
            genres: upload.details.genres || [],
            imageUrl: upload.details.coverImage || '',
            audioUrl: upload.details.audioFile || ''
          } : undefined,
          tracks: upload.uploadType === 'album' ? 
            (upload.details.tracklist || []).map(track => ({
              title: track.title,
              audioUrl: track.audioFile,
              trackNumber: track.trackNumber
            })) : []
        })
      });
      
      console.log("Publish response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error(`Failed to publish upload: ${response.status} ${errorText}`);
      }
      
      // Refresh uploads list
      refetchUploads();
      
      toast({
        title: t('artistDashboard.uploadProcessed'),
        description: t('artistDashboard.uploadProcessedDescription'),
      });
      
      return true;
    } catch (error) {
      console.error('Error publishing upload:', error);
      toast({
        title: t('artistDashboard.processingError'),
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
      return false;
    }
  };
  
  const handleSubmitUpload = (upload: ArtistUpload) => {
    console.log("Submitting upload:", JSON.stringify(upload, null, 2));
    const processData: any = { id: upload.id };
    
    if (upload.uploadType === 'track') {
      // Prepare track data
      processData.trackData = {
        title: upload.title,
        description: upload.details.description || '',
        genres: upload.details.genres || [],
        imageUrl: upload.details.coverImage || '',
        audioUrl: upload.details.audioFile || '',
        releaseDate: new Date().toISOString(),
        duration: 180, // Default 3 minutes
        price: 99, // Default 0.99
        purchaseAvailable: true,
        downloadAvailable: true,
        explicit: false
      };
    } else {
      // Prepare album data
      processData.albumData = {
        title: upload.title,
        description: upload.details.description || '',
        genres: upload.details.genres || [],
        coverImage: upload.details.coverImage || '',
        releaseDate: new Date().toISOString(),
        price: 999, // Default 9.99
        purchaseAvailable: true
      };
      
      // Process tracklist - prefer tracklist over tracks for album uploads
      if (upload.details.tracklist && Array.isArray(upload.details.tracklist)) {
        processData.tracks = upload.details.tracklist.map(track => ({
          title: track.title,
          audioUrl: track.audioFile,
          trackNumber: track.trackNumber,
          duration: 180, // Default duration
          price: 99, // Default price
          explicit: false
        }));
      } else if (upload.details.tracks && Array.isArray(upload.details.tracks)) {
        processData.tracks = upload.details.tracks;
      } else {
        processData.tracks = []; // Default empty tracks array
      }
    }
    
    console.log("Process data:", JSON.stringify(processData, null, 2));
    
    // Process the upload
    processUploadMutation.mutate(processData);
  };

  // Aggregate analytics data
  const aggregatedAnalytics = analytics?.reduce(
    (acc, item) => {
      acc.totalStreams += item.streamCount;
      acc.totalPurchases += item.purchaseCount;
      acc.totalRevenue += item.revenue;
      return acc;
    },
    { totalStreams: 0, totalPurchases: 0, totalRevenue: 0 }
  ) || { totalStreams: 0, totalPurchases: 0, totalRevenue: 0 };

  if (!user.artistId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('common.artistDashboard')}</h1>
        <p>{t('artistDashboard.needArtistProfile')}</p>
      </div>
    );
  }

  if (analyticsLoading || followersLoading || isLoadingProfile) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (analyticsError || followersError || profileError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('common.artistDashboard')}</h1>
        <p className="text-destructive">
          {t('artistDashboard.errorLoading')}
        </p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('common.artistDashboard')}</h1>
      
      {/* Upload Dialog - Removed */}
          
          <div className="space-y-8 py-4">
            <div className="space-y-2">
              <Label htmlFor="upload-title">{t('artistDashboard.uploadTitle')}</Label>
              <Input 
                id="upload-title" 
                value={uploadFormData.title} 
                onChange={(e) => setUploadFormData({
                  ...uploadFormData,
                  title: e.target.value
                })}
                placeholder={t('artistDashboard.uploadTitlePlaceholder')}
              />
            </div>
            
            {!editingUpload && (
              <div className="space-y-2">
                <Label>{t('artistDashboard.uploadType')}</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="type-track"
                      checked={uploadFormData.uploadType === 'track'}
                      onChange={() => setUploadFormData({
                        ...uploadFormData,
                        uploadType: 'track',
                        details: {
                          ...uploadFormData.details,
                          audioFile: ''
                        }
                      })}
                      className="h-4 w-4 text-primary"
                    />
                    <Label htmlFor="type-track" className="cursor-pointer">
                      {t('artistDashboard.track')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="type-album"
                      checked={uploadFormData.uploadType === 'album'}
                      onChange={() => {
                        console.log("Switching to album type");
                        setUploadFormData({
                          ...uploadFormData,
                          uploadType: 'album',
                          details: {
                            ...uploadFormData.details,
                            audioFile: undefined,
                            tracklist: [{
                              title: '',
                              audioFile: '',
                              trackNumber: 1
                            }]
                          }
                        });
                      }}
                      className="h-4 w-4 text-primary"
                    />
                    <Label htmlFor="type-album" className="cursor-pointer">
                      {t('artistDashboard.album')}
                    </Label>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="upload-description">{t('artistDashboard.description')}</Label>
              <Textarea 
                id="upload-description" 
                value={uploadFormData.details.description} 
                onChange={(e) => setUploadFormData({
                  ...uploadFormData,
                  details: {
                    ...uploadFormData.details,
                    description: e.target.value
                  }
                })}
                placeholder={t('artistDashboard.descriptionPlaceholder')}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="upload-genres">{t('artistDashboard.genres')}</Label>
              <Input 
                id="upload-genres" 
                value={uploadFormData.details.genres.join(', ')} 
                onChange={(e) => setUploadFormData({
                  ...uploadFormData,
                  details: {
                    ...uploadFormData.details,
                    genres: e.target.value.split(',').map(g => g.trim()).filter(g => g)
                  }
                })}
                placeholder={t('artistDashboard.genresPlaceholder')}
              />
              <div className="text-xs text-muted-foreground">
                {t('artistDashboard.genresHelp')}
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="upload-cover">{t('coverImage')}</Label>
              <div className="flex gap-4 items-start">
                <div className="w-20 h-20 rounded overflow-hidden bg-accent flex-shrink-0">
                  {uploadFormData.details.coverImage ? (
                    <img 
                      src={uploadFormData.details.coverImage} 
                      alt={uploadFormData.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-center p-1">
                      {t('noCover')}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <Label className="mb-2 block">{t('uploadMethod')}</Label>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              // In a real app, we'd upload this to storage
                              // For now, create an object URL as a placeholder
                              const imageUrl = URL.createObjectURL(file);
                              setUploadFormData({
                                ...uploadFormData,
                                details: {...uploadFormData.details, coverImage: imageUrl}
                              });
                            }
                          };
                          input.click();
                        }}
                      >
                        {t('uploadFromDevice')}
                      </Button>
                      <span className="flex items-center font-medium text-sm">OR</span>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                      >
                        {t('selectFromLibrary')}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="upload-cover" className="mb-2 block">{t('orEnterUrl')}</Label>
                    <Input
                      id="upload-cover"
                      value={uploadFormData.details.coverImage}
                      onChange={(e) => setUploadFormData({
                        ...uploadFormData, 
                        details: {...uploadFormData.details, coverImage: e.target.value}
                      })}
                      placeholder="https://example.com/image.jpg"
                      className="mb-2 w-full text-sm truncate"
                    />
                    {uploadFormData.details.coverImage && (
                      <div className="text-xs mb-2 p-1 bg-muted rounded truncate" title={uploadFormData.details.coverImage}>
                        {uploadFormData.details.coverImage}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{t('artistDashboard.imageHelp')}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {uploadFormData.uploadType === 'track' && (
              <div className="grid gap-2">
                <Label htmlFor="upload-audio">{t('audioFile')}</Label>
                
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">{t('uploadMethod')}</Label>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'audio/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              // In a real app, we'd upload this to storage
                              // For now, create an object URL as a placeholder
                              const audioUrl = URL.createObjectURL(file);
                              setUploadFormData({
                                ...uploadFormData,
                                details: {...uploadFormData.details, audioFile: audioUrl}
                              });
                            }
                          };
                          input.click();
                        }}
                      >
                        {t('uploadFromDevice')}
                      </Button>
                      <span className="flex items-center font-medium text-sm">OR</span>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                      >
                        {t('recordAudio')}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="upload-audio" className="mb-2 block">{t('orEnterUrl')}</Label>
                    <Input
                      id="upload-audio"
                      value={uploadFormData.details.audioFile}
                      onChange={(e) => setUploadFormData({
                        ...uploadFormData, 
                        details: {...uploadFormData.details, audioFile: e.target.value}
                      })}
                      placeholder="https://example.com/track.mp3"
                      className="mb-2 w-full text-sm truncate"
                    />
                    {uploadFormData.details.audioFile && (
                      <div className="text-xs mb-2 p-1 bg-muted rounded truncate" title={uploadFormData.details.audioFile}>
                        {uploadFormData.details.audioFile}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{t('artistDashboard.fileHelp')}</p>
                  </div>
                  
                  {uploadFormData.details.audioFile && (
                    <div className="mt-2 p-2 border rounded bg-muted">
                      <p className="text-sm font-medium mb-1">{t('selectedAudio')}</p>
                      <audio 
                        controls 
                        className="w-full max-w-md" 
                        src={uploadFormData.details.audioFile}
                      >
                        {t('audioNotSupported')}
                      </audio>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Album Tracklist Section - Only show for album upload type */}
            {(() => { console.log("Upload form data:", JSON.stringify(uploadFormData, null, 2)); return null; })()}
            {uploadFormData.uploadType === 'album' && (
              <div className="space-y-4 mt-6 border-t pt-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">{t('common.tracks')}</h3>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const newTracklist = [...(uploadFormData.details.tracklist || [])];
                      newTracklist.push({
                        title: '',
                        audioFile: '',
                        trackNumber: newTracklist.length + 1
                      });
                      setUploadFormData({
                        ...uploadFormData,
                        details: {
                          ...uploadFormData.details,
                          tracklist: newTracklist
                        }
                      });
                    }}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    {t('common.track')}
                  </Button>
                </div>
                
                {/* Tracklist Items */}
                <div className="space-y-4">
                  {(uploadFormData.details.tracklist || []).length === 0 ? (
                    <div className="text-center py-6 border border-dashed rounded-md">
                      <p className="text-muted-foreground">{t('artistDashboard.noTrackUploads')}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setUploadFormData({
                            ...uploadFormData,
                            details: {
                              ...uploadFormData.details,
                              tracklist: [{
                                title: '',
                                audioFile: '',
                                trackNumber: 1
                              }]
                            }
                          });
                        }}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        {t('common.track')}
                      </Button>
                    </div>
                  ) : (
                    (uploadFormData.details.tracklist || []).map((track, index) => (
                      <div key={index} className="flex flex-col p-6 border rounded-md">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center p-0 text-lg font-bold">
                              {track.trackNumber}
                            </Badge>
                            <h4 className="text-lg font-medium">{track.title || t('common.untitledTrack')}</h4>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newTracklist = [...(uploadFormData.details.tracklist || [])];
                              newTracklist.splice(index, 1);
                              // Renumber remaining tracks
                              newTracklist.forEach((t, i) => {
                                t.trackNumber = i + 1;
                              });
                              setUploadFormData({
                                ...uploadFormData,
                                details: {
                                  ...uploadFormData.details,
                                  tracklist: newTracklist
                                }
                              });
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash className="h-5 w-5" />
                            <span className="sr-only">Remove track</span>
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`track-title-${index}`} className="font-medium">{t('common.title')}</Label>
                            <Input
                              id={`track-title-${index}`}
                              value={track.title}
                              onChange={(e) => {
                                const newTracklist = [...(uploadFormData.details.tracklist || [])];
                                newTracklist[index].title = e.target.value;
                                setUploadFormData({
                                  ...uploadFormData,
                                  details: {
                                    ...uploadFormData.details,
                                    tracklist: newTracklist
                                  }
                                });
                              }}
                              placeholder={t('artistDashboard.titlePlaceholder')}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`track-audio-${index}`} className="font-medium">{t('common.audioFile')}</Label>
                            <div className="flex flex-col gap-2 mt-1">
                              <div className="flex gap-2">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'audio/*';
                                    input.onchange = (e) => {
                                      const file = (e.target as HTMLInputElement).files?.[0];
                                      if (file) {
                                        // In a real app, we'd upload this to storage
                                        const audioUrl = URL.createObjectURL(file);
                                        const newTracklist = [...(uploadFormData.details.tracklist || [])];
                                        newTracklist[index].audioFile = audioUrl;
                                        setUploadFormData({
                                          ...uploadFormData,
                                          details: {
                                            ...uploadFormData.details,
                                            tracklist: newTracklist
                                          }
                                        });
                                      }
                                    };
                                    input.click();
                                  }}
                                >
                                  {t('common.uploadFromDevice')}
                                </Button>
                                <span className="flex items-center font-medium text-sm">OR</span>
                                <Input
                                  id={`track-audio-${index}`}
                                  value={track.audioFile}
                                  onChange={(e) => {
                                    const newTracklist = [...(uploadFormData.details.tracklist || [])];
                                    newTracklist[index].audioFile = e.target.value;
                                    setUploadFormData({
                                      ...uploadFormData,
                                      details: {
                                        ...uploadFormData.details,
                                        tracklist: newTracklist
                                      }
                                    });
                                  }}
                                  placeholder="https://example.com/track.mp3"
                                  className="flex-1"
                                />
                              </div>
                              
                              {track.audioFile && (
                                <div className="text-xs p-1 bg-muted rounded truncate" title={track.audioFile}>
                                  {track.audioFile}
                                </div>
                              )}
                            </div>
                            
                            {track.audioFile && (
                              <audio 
                                controls 
                                className="w-full mt-3" 
                                src={track.audioFile}
                              >
                                {t('common.audioNotSupported')}
                              </audio>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={() => handleSaveUpload()} 
              disabled={isPendingUpload || !uploadFormData.title}
            >
              {isPendingUpload ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('common.processing')}</>
              ) : editingUpload ? t('common.update') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6 grid grid-cols-5 w-full overflow-visible">
          <TabsTrigger value="overview" className="flex-shrink-0 flex items-center gap-1 px-3">
            <TrendingUp className="h-4 w-4" /> {t('artistDashboard.overview')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex-shrink-0 flex items-center gap-1 px-3">
            <Users className="h-4 w-4" /> {t('artistDashboard.analytics')}
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex-shrink-0 flex items-center gap-1 px-3">
            <User className="h-4 w-4" /> {t('artistDashboard.profile')}
          </TabsTrigger>
          <TabsTrigger value="uploads" className="flex-shrink-0 flex items-center gap-1 px-3">
            <Upload className="h-4 w-4" /> {t('artistDashboard.uploads')}
          </TabsTrigger>
          <TabsTrigger value="royalties" className="flex-shrink-0 flex items-center gap-1 px-3">
            <DollarSign className="h-4 w-4" /> {t('artistDashboard.royalties')}
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('artistDashboard.totalStreams')}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {aggregatedAnalytics.totalStreams.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('artistDashboard.totalPurchases')}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {aggregatedAnalytics.totalPurchases.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('artistDashboard.totalRevenue')}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(aggregatedAnalytics.totalRevenue / 100).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Followers Card */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('artistDashboard.followers')}</CardTitle>
                <CardDescription>
                  {t('artistDashboard.youHaveFollowers', { count: followers?.length || 0 })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {followers && followers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('artistDashboard.userId')}</TableHead>
                        <TableHead>{t('artistDashboard.followedSince')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {followers.slice(0, 5).map((follower) => (
                        <TableRow key={follower.userId}>
                          <TableCell>{follower.userId}</TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(follower.followedAt), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    {followers.length > 5 && (
                      <TableCaption>
                        {t('artistDashboard.showing', { count: followers.length })}
                      </TableCaption>
                    )}
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('artistDashboard.noFollowersYet')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profile Preview Card */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t('artistProfile.yourProfilePreview')}</CardTitle>
                <CardDescription>
                  {t('artistProfile.previewDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="flex-shrink-0">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={image} alt={name} />
                      <AvatarFallback>{name?.substring(0, 2).toUpperCase() || 'AR'}</AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-grow space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold">{name || t('artistProfile.artistNamePlaceholder')}</h2>
                      <div className="text-sm text-muted-foreground">
                        {genres.length > 0 ? genres.join(', ') : t('artistProfile.genrePlaceholder')}
                      </div>
                    </div>
                    
                    <p className="text-sm">
                      {bio || t('artistProfile.bioPlaceholder')}
                    </p>
                    
                    <Separator />
                    
                    <div className="pt-2">
                      <h3 className="text-sm font-semibold mb-2">{t('artistProfile.connect')}</h3>
                      <div className="flex gap-3">
                        {website && (
                          <a href={website} target="_blank" rel="noopener noreferrer" 
                             className="text-muted-foreground hover:text-primary">
                            <Globe className="h-5 w-5" />
                          </a>
                        )}
                        {instagram && (
                          <a href={instagram} target="_blank" rel="noopener noreferrer"
                             className="text-muted-foreground hover:text-primary">
                            <Instagram className="h-5 w-5" />
                          </a>
                        )}
                        {twitter && (
                          <a href={twitter} target="_blank" rel="noopener noreferrer"
                             className="text-muted-foreground hover:text-primary">
                            <Twitter className="h-5 w-5" />
                          </a>
                        )}
                        {facebook && (
                          <a href={facebook} target="_blank" rel="noopener noreferrer"
                             className="text-muted-foreground hover:text-primary">
                            <Facebook className="h-5 w-5" />
                          </a>
                        )}
                        {youtube && (
                          <a href={youtube} target="_blank" rel="noopener noreferrer"
                             className="text-muted-foreground hover:text-primary">
                            <Youtube className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button variant="outline" onClick={() => setActiveTab('profile')}>
                    {t('artistProfile.editProfile')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-6 grid grid-cols-2 w-full overflow-visible">
              <TabsTrigger value="general">{t('artistProfile.generalInfo')}</TabsTrigger>
              <TabsTrigger value="social">{t('artistProfile.socialMedia')}</TabsTrigger>
            </TabsList>
            
            {/* General Information Tab */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>{t('artistProfile.generalInfo')}</CardTitle>
                  <CardDescription>
                    {t('artistProfile.generalDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="artist-name">{t('artistProfile.artistName')}</Label>
                    <Input 
                      id="artist-name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder={t('artistProfile.artistNamePlaceholder')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="artist-bio">{t('artistProfile.bio')}</Label>
                    <Textarea 
                      id="artist-bio" 
                      value={bio} 
                      onChange={(e) => setBio(e.target.value)} 
                      placeholder={t('artistProfile.bioPlaceholder')}
                      rows={5}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="artist-image">{t('artistProfile.imageUrl')}</Label>
                    <div className="grid grid-cols-1 gap-2">
                      <Input 
                        id="artist-image" 
                        value={image} 
                        onChange={(e) => setImage(e.target.value)} 
                        placeholder={t('artistProfile.imageUrlPlaceholder')}
                      />
                      <div className="text-xs text-muted-foreground">{t('artistProfile.or')}</div>
                      <div className="flex items-center gap-2">
                        <Input
                          id="artist-image-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Resize and compress the image
                              const resizeImage = (file: File): Promise<string> => {
                                return new Promise((resolve) => {
                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    if (!e.target?.result) {
                                      return resolve('');
                                    }
                                    
                                    const img = new Image();
                                    img.onload = () => {
                                      // Create a canvas to resize the image
                                      const canvas = document.createElement('canvas');
                                      let width = img.width;
                                      let height = img.height;
                                      
                                      // Keep aspect ratio and resize if too large
                                      const MAX_WIDTH = 800;
                                      const MAX_HEIGHT = 800;
                                      
                                      if (width > height) {
                                        if (width > MAX_WIDTH) {
                                          height = Math.round(height * MAX_WIDTH / width);
                                          width = MAX_WIDTH;
                                        }
                                      } else {
                                        if (height > MAX_HEIGHT) {
                                          width = Math.round(width * MAX_HEIGHT / height);
                                          height = MAX_HEIGHT;
                                        }
                                      }
                                      
                                      canvas.width = width;
                                      canvas.height = height;
                                      
                                      const ctx = canvas.getContext('2d');
                                      ctx?.drawImage(img, 0, 0, width, height);
                                      
                                      // Get the data URL with reduced quality (0.7 = 70% quality)
                                      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                                      resolve(dataUrl);
                                    };
                                    
                                    img.src = e.target.result as string;
                                  };
                                  reader.readAsDataURL(file);
                                });
                              };
                              
                              // Resize and set the image
                              resizeImage(file).then((resizedImage) => {
                                if (resizedImage) {
                                  setImage(resizedImage);
                                }
                              });
                            }
                          }}
                        />
                      </div>
                      {image && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">{t('artistProfile.preview')}</p>
                          <div className="w-32 h-32 rounded-full overflow-hidden border border-border">
                            <img src={image} alt="Profile Preview" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="artist-genres">{t('artistProfile.genre')}</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-md border-input">
                      {[
                        "Pop", "Rock", "Hip Hop", "R&B", "Electronic", "Jazz", "Classical",
                        "Country", "Folk", "Reggae", "Latin", "Metal", "Blues", "Indie",
                        "Dance", "Soul", "Punk", "Ambient", "Afrobeat", "K-Pop"
                      ].map((genreOption) => (
                        <div key={genreOption} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`genre-${genreOption}`}
                            checked={genres.includes(genreOption)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setGenres([...genres, genreOption]);
                              } else {
                                setGenres(genres.filter(g => g !== genreOption));
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor={`genre-${genreOption}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {genreOption}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        {t('artistProfile.saving')}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> 
                        {t('artistProfile.saveChanges')}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Social Media Tab */}
            <TabsContent value="social">
              <Card>
                <CardHeader>
                  <CardTitle>{t('artistProfile.socialMedia')}</CardTitle>
                  <CardDescription>
                    {t('artistProfile.socialDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="website" className="flex items-center">
                      <Globe className="h-4 w-4 mr-2" /> {t('artistProfile.website')}
                    </Label>
                    <Input 
                      id="website" 
                      value={website} 
                      onChange={(e) => setWebsite(e.target.value)} 
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="flex items-center">
                      <Instagram className="h-4 w-4 mr-2" /> {t('artistProfile.instagram')}
                    </Label>
                    <Input 
                      id="instagram" 
                      value={instagram} 
                      onChange={(e) => setInstagram(e.target.value)} 
                      placeholder="https://instagram.com/username"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="twitter" className="flex items-center">
                      <Twitter className="h-4 w-4 mr-2" /> {t('artistProfile.twitter')}
                    </Label>
                    <Input 
                      id="twitter" 
                      value={twitter} 
                      onChange={(e) => setTwitter(e.target.value)} 
                      placeholder="https://twitter.com/username"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="facebook" className="flex items-center">
                      <Facebook className="h-4 w-4 mr-2" /> {t('artistProfile.facebook')}
                    </Label>
                    <Input 
                      id="facebook" 
                      value={facebook} 
                      onChange={(e) => setFacebook(e.target.value)} 
                      placeholder="https://facebook.com/page"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="youtube" className="flex items-center">
                      <Youtube className="h-4 w-4 mr-2" /> {t('artistProfile.youtube')}
                    </Label>
                    <Input 
                      id="youtube" 
                      value={youtube} 
                      onChange={(e) => setYoutube(e.target.value)} 
                      placeholder="https://youtube.com/channel"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        {t('artistProfile.saving')}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> 
                        {t('artistProfile.saveChanges')}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div className="flex items-center">
              <h2 className="text-xl font-bold mr-4">{t('artistDashboard.performanceAnalytics')}</h2>
              <Select value={period} onValueChange={(value) => setPeriod(value as typeof period)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder={t('artistDashboard.selectPeriod')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">{t('artistDashboard.day')}</SelectItem>
                  <SelectItem value="week">{t('artistDashboard.week')}</SelectItem>
                  <SelectItem value="month">{t('artistDashboard.month')}</SelectItem>
                  <SelectItem value="year">{t('artistDashboard.year')}</SelectItem>
                  <SelectItem value="all">{t('artistDashboard.allTime')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('artistDashboard.totalStreams')}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {aggregatedAnalytics.totalStreams.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('artistDashboard.totalPurchases')}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {aggregatedAnalytics.totalPurchases.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('artistDashboard.totalRevenue')}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(aggregatedAnalytics.totalRevenue / 100).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t('artistDashboard.detailedAnalytics')}</CardTitle>
                <CardDescription>
                  {t('artistDashboard.analyticsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && analytics.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('artistDashboard.date')}</TableHead>
                        <TableHead>{t('artistDashboard.period')}</TableHead>
                        <TableHead className="text-right">{t('artistDashboard.streams')}</TableHead>
                        <TableHead className="text-right">{t('artistDashboard.purchases')}</TableHead>
                        <TableHead className="text-right">{t('artistDashboard.revenue')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {new Date(item.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{item.period}</TableCell>
                          <TableCell className="text-right">{item.streamCount}</TableCell>
                          <TableCell className="text-right">{item.purchaseCount}</TableCell>
                          <TableCell className="text-right">
                            ${(item.revenue / 100).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('artistDashboard.noAnalyticsData')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Uploads Tab */}
        <TabsContent value="uploads">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{t('artistDashboard.recentUploads')}</CardTitle>
                    <CardDescription>
                      {t('artistDashboard.manageYourMusic')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="mb-4 grid grid-cols-5 w-full overflow-visible">
                    <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
                    <TabsTrigger value="tracks">{t('common.tracks')}</TabsTrigger>
                    <TabsTrigger value="albums">{t('common.albums')}</TabsTrigger>
                    <TabsTrigger value="pending">{t('common.pending')}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all">
                    {isLoadingUploads ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex items-center p-4 bg-background-elevated rounded-lg">
                            <Skeleton className="h-12 w-12 rounded mr-4" />
                            <div className="flex-1">
                              <Skeleton className="h-4 w-3/4 mb-2" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded-full" />
                          </div>
                        ))}
                      </div>
                    ) : uploads && uploads.length > 0 ? (
                      <div className="space-y-4">
                        {uploads.map(upload => (
                          <div
                            key={upload.id}
                            className={cn(
                              "flex items-center p-4 bg-background-elevated rounded-lg",
                              upload.status === 'failed' ? "border border-destructive/40" : "",
                              upload.status === 'completed' ? "border border-green-500/40" : "",
                              upload.status === 'processing' ? "border border-yellow-500/40" : "",
                              upload.status === 'pending' ? "border border-slate-500/40" : ""
                            )}
                          >
                            <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-accent">
                              {upload.details.coverImage ? (
                                <img 
                                  src={upload.details.coverImage} 
                                  alt={upload.title}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-center p-1">
                                  {upload.uploadType === 'track' ? 'Track' : 'Album'}
                                </div>
                              )}
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex items-center">
                                <h3 className="font-medium">{upload.title}</h3>
                                <Badge variant={
                                  upload.status === 'completed' ? "secondary" :
                                  upload.status === 'failed' ? "destructive" :
                                  upload.status === 'processing' ? "outline" : "secondary"
                                } className={`ml-2 ${upload.status === 'completed' ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : ""}`}>
                                  {upload.status === 'completed' ? t('common.completed') :
                                   upload.status === 'failed' ? t('common.failed') :
                                   upload.status === 'processing' ? t('common.processing') : t('common.pending')}
                                </Badge>
                              </div>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <span>{upload.uploadType === 'track' ? t('common.track') : t('common.album')}</span>
                                <span className="mx-1">•</span>
                                <span>{new Date(upload.updatedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditUpload(upload)}
                                disabled={upload.status === 'processing'}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">{t('common.edit')}</span>
                              </Button>
                              {upload.status === 'pending' && (
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleSubmitUpload(upload)}
                                >
                                  {t('common.submit')}
                                </Button>
                              )}
                              {upload.status === 'completed' && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    if (upload.trackId) {
                                      window.location.href = `/tracks/${upload.trackId}`;
                                    } else if (upload.albumId) {
                                      window.location.href = `/albums/${upload.albumId}`;
                                    }
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  <span className="sr-only">{t('common.view')}</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>{t('artistDashboard.noUploads')}</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="tracks">
                    {isLoadingUploads ? (
                      <div className="space-y-4">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="flex items-center p-4 bg-background-elevated rounded-lg">
                            <Skeleton className="h-12 w-12 rounded mr-4" />
                            <div className="flex-1">
                              <Skeleton className="h-4 w-3/4 mb-2" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded-full" />
                          </div>
                        ))}
                      </div>
                    ) : uploads ? (
                      <div className="space-y-4">
                        {uploads
                          .filter(upload => upload.uploadType === 'track')
                          .map(upload => (
                            <div
                              key={upload.id}
                              className={cn(
                                "flex items-center p-4 bg-background-elevated rounded-lg",
                                upload.status === 'failed' ? "border border-destructive/40" : "",
                                upload.status === 'completed' ? "border border-green-500/40" : "",
                                upload.status === 'processing' ? "border border-yellow-500/40" : "",
                                upload.status === 'pending' ? "border border-slate-500/40" : ""
                              )}
                            >
                              <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-accent">
                                {upload.details.coverImage ? (
                                  <img 
                                    src={upload.details.coverImage} 
                                    alt={upload.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-center p-1">
                                    Track
                                  </div>
                                )}
                              </div>
                              <div className="ml-4 flex-1">
                                <div className="flex items-center">
                                  <h3 className="font-medium">{upload.title}</h3>
                                  <Badge variant={
                                    upload.status === 'completed' ? "success" :
                                    upload.status === 'failed' ? "destructive" :
                                    upload.status === 'processing' ? "outline" : "secondary"
                                  } className="ml-2">
                                    {upload.status === 'completed' ? t('common.completed') :
                                     upload.status === 'failed' ? t('common.failed') :
                                     upload.status === 'processing' ? t('common.processing') : t('common.pending')}
                                  </Badge>
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <span>{t('common.track')}</span>
                                  <span className="mx-1">•</span>
                                  <span>{new Date(upload.updatedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleEditUpload(upload)}
                                  disabled={upload.status === 'processing'}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">{t('common.edit')}</span>
                                </Button>
                                {upload.status === 'pending' && (
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={() => handleSubmitUpload(upload)}
                                  >
                                    {t('common.submit')}
                                  </Button>
                                )}
                                {upload.status === 'completed' && upload.trackId && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      window.location.href = `/tracks/${upload.trackId}`;
                                    }}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    <span className="sr-only">{t('common.view')}</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                        ))}
                        {uploads.filter(upload => upload.uploadType === 'track').length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>{t('artistDashboard.noTrackUploads')}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>{t('artistDashboard.noUploads')}</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="albums">
                    {isLoadingUploads ? (
                      <div className="space-y-4">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="flex items-center p-4 bg-background-elevated rounded-lg">
                            <Skeleton className="h-12 w-12 rounded mr-4" />
                            <div className="flex-1">
                              <Skeleton className="h-4 w-3/4 mb-2" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded-full" />
                          </div>
                        ))}
                      </div>
                    ) : uploads ? (
                      <div className="space-y-4">
                        {uploads
                          .filter(upload => upload.uploadType === 'album')
                          .map(upload => (
                            <div
                              key={upload.id}
                              className={cn(
                                "flex items-center p-4 bg-background-elevated rounded-lg",
                                upload.status === 'failed' ? "border border-destructive/40" : "",
                                upload.status === 'completed' ? "border border-green-500/40" : "",
                                upload.status === 'processing' ? "border border-yellow-500/40" : "",
                                upload.status === 'pending' ? "border border-slate-500/40" : ""
                              )}
                            >
                              <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-accent">
                                {upload.details.coverImage ? (
                                  <img 
                                    src={upload.details.coverImage} 
                                    alt={upload.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-center p-1">
                                    Album
                                  </div>
                                )}
                              </div>
                              <div className="ml-4 flex-1">
                                <div className="flex items-center">
                                  <h3 className="font-medium">{upload.title}</h3>
                                  <Badge variant={
                                    upload.status === 'completed' ? "success" :
                                    upload.status === 'failed' ? "destructive" :
                                    upload.status === 'processing' ? "outline" : "secondary"
                                  } className="ml-2">
                                    {upload.status === 'completed' ? t('common.completed') :
                                     upload.status === 'failed' ? t('common.failed') :
                                     upload.status === 'processing' ? t('common.processing') : t('common.pending')}
                                  </Badge>
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <span>{t('common.album')}</span>
                                  <span className="mx-1">•</span>
                                  <span>{new Date(upload.updatedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleEditUpload(upload)}
                                  disabled={upload.status === 'processing'}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">{t('common.edit')}</span>
                                </Button>
                                {upload.status === 'pending' && (
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={() => handleSubmitUpload(upload)}
                                  >
                                    {t('common.submit')}
                                  </Button>
                                )}
                                {upload.status === 'completed' && upload.albumId && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      window.location.href = `/albums/${upload.albumId}`;
                                    }}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    <span className="sr-only">{t('common.view')}</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                        ))}
                        {uploads.filter(upload => upload.uploadType === 'album').length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>{t('artistDashboard.noAlbumUploads')}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>{t('artistDashboard.noUploads')}</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="pending">
                    {isLoadingUploads ? (
                      <div className="space-y-4">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="flex items-center p-4 bg-background-elevated rounded-lg">
                            <Skeleton className="h-12 w-12 rounded mr-4" />
                            <div className="flex-1">
                              <Skeleton className="h-4 w-3/4 mb-2" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded-full" />
                          </div>
                        ))}
                      </div>
                    ) : uploads ? (
                      <div className="space-y-4">
                        {uploads
                          .filter(upload => upload.status === 'pending')
                          .map(upload => (
                            <div
                              key={upload.id}
                              className="flex items-center p-4 bg-background-elevated rounded-lg border border-slate-500/40"
                            >
                              <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-accent">
                                {upload.details.coverImage ? (
                                  <img 
                                    src={upload.details.coverImage} 
                                    alt={upload.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-center p-1">
                                    {upload.uploadType === 'track' ? 'Track' : 'Album'}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4 flex-1">
                                <div className="flex items-center">
                                  <h3 className="font-medium">{upload.title}</h3>
                                  <Badge variant="secondary" className="ml-2">
                                    {t('common.pending')}
                                  </Badge>
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <span>{upload.uploadType === 'track' ? t('common.track') : t('common.album')}</span>
                                  <span className="mx-1">•</span>
                                  <span>{new Date(upload.updatedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleEditUpload(upload)}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">{t('common.edit')}</span>
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleSubmitUpload(upload)}
                                >
                                  {t('common.submit')}
                                </Button>
                              </div>
                            </div>
                        ))}
                        {uploads.filter(upload => upload.status === 'pending').length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>{t('artistDashboard.noPendingUploads')}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>{t('artistDashboard.noUploads')}</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>{t('artistDashboard.uploadMusic')}</CardTitle>
                <MusicIcon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                      {t('artistDashboard.createNewUpload')}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <Button 
                      className="w-full"
                      onClick={() => handleNewUpload('track')}
                    >
                      <Music className="mr-2 h-4 w-4" />
                      {t('artistDashboard.uploadTrack')}
                    </Button>
                    
                    <Button 
                      className="w-full"
                      onClick={() => handleNewUpload('album')}
                    >
                      <AlbumIcon className="mr-2 h-4 w-4" />
                      {t('artistDashboard.uploadAlbum')}
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">{t('artistDashboard.uploadTips')}</h3>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• {t('artistDashboard.uploadTip1')}</li>
                      <li>• {t('artistDashboard.uploadTip2')}</li>
                      <li>• {t('artistDashboard.uploadTip3')}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Upload Dialogs */}
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingUpload ? t('artistDashboard.editUpload') : (
                    newUploadType === 'track' ? t('artistDashboard.uploadNewTrack') : t('artistDashboard.uploadNewAlbum')
                  )}
                </DialogTitle>
                <DialogDescription>
                  {editingUpload ? t('artistDashboard.modifyUploadDetails') : t('artistDashboard.fillUploadDetails')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="upload-title">{t('title')}</Label>
                  <Input
                    id="upload-title"
                    value={uploadFormData.title}
                    onChange={(e) => setUploadFormData({...uploadFormData, title: e.target.value})}
                    placeholder={t('artistDashboard.titlePlaceholder')}
                  />
                </div>
                
                {!editingUpload && (
                  <div className="grid gap-2">
                    <Label>{t('uploadType')}</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="upload-type-track"
                          checked={uploadFormData.uploadType === 'track'}
                          onChange={() => setUploadFormData({...uploadFormData, uploadType: 'track'})}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="upload-type-track" className="font-normal">
                          {t('track')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="upload-type-album"
                          checked={uploadFormData.uploadType === 'album'}
                          onChange={() => setUploadFormData({...uploadFormData, uploadType: 'album'})}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="upload-type-album" className="font-normal">
                          {t('album')}
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="upload-description">{t('description')}</Label>
                  <Textarea
                    id="upload-description"
                    value={uploadFormData.details.description}
                    onChange={(e) => setUploadFormData({
                      ...uploadFormData, 
                      details: {...uploadFormData.details, description: e.target.value}
                    })}
                    placeholder={t('artistDashboard.descriptionPlaceholder')}
                    rows={3}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="upload-genres">{t('genres')}</Label>
                  <Input
                    id="upload-genres"
                    value={uploadFormData.details.genres.join(', ')}
                    onChange={(e) => setUploadFormData({
                      ...uploadFormData, 
                      details: {...uploadFormData.details, genres: e.target.value.split(',').map(g => g.trim())}
                    })}
                    placeholder={t('artistDashboard.genresPlaceholder')}
                  />
                  <p className="text-xs text-muted-foreground">{t('genresHelp')}</p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="upload-cover">{t('coverImage')}</Label>
                  <div className="flex gap-4 items-start">
                    <div className="w-20 h-20 rounded overflow-hidden bg-accent flex-shrink-0">
                      {uploadFormData.details.coverImage ? (
                        <img 
                          src={uploadFormData.details.coverImage} 
                          alt={uploadFormData.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-center p-1">
                          {t('noCover')}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <Label className="mb-2 block">{t('uploadMethod')}</Label>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) {
                                  // In a real app, we'd upload this to storage
                                  // For now, create an object URL as a placeholder
                                  const imageUrl = URL.createObjectURL(file);
                                  setUploadFormData({
                                    ...uploadFormData,
                                    details: {...uploadFormData.details, coverImage: imageUrl}
                                  });
                                }
                              };
                              input.click();
                            }}
                          >
                            {t('uploadFromDevice')}
                          </Button>
                          <span className="flex items-center font-medium text-sm">OR</span>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                          >
                            {t('selectFromLibrary')}
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="upload-cover" className="mb-2 block">{t('orEnterUrl')}</Label>
                        <Input
                          id="upload-cover"
                          value={uploadFormData.details.coverImage}
                          onChange={(e) => setUploadFormData({
                            ...uploadFormData, 
                            details: {...uploadFormData.details, coverImage: e.target.value}
                          })}
                          placeholder="https://example.com/image.jpg"
                          className="mb-2"
                        />
                        <p className="text-xs text-muted-foreground">{t('coverImageHelp')}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {uploadFormData.uploadType === 'track' ? (
                  <div className="grid gap-2">
                    <Label htmlFor="upload-audio">{t('audioFile')}</Label>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="mb-2 block">{t('uploadMethod')}</Label>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'audio/*';
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) {
                                  // In a real app, we'd upload this to storage
                                  // For now, create an object URL as a placeholder
                                  const audioUrl = URL.createObjectURL(file);
                                  setUploadFormData({
                                    ...uploadFormData,
                                    details: {...uploadFormData.details, audioFile: audioUrl}
                                  });
                                }
                              };
                              input.click();
                            }}
                          >
                            {t('uploadFromDevice')}
                          </Button>
                          <span className="flex items-center font-medium text-sm">OR</span>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                          >
                            {t('recordAudio')}
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="upload-audio" className="mb-2 block">{t('orEnterUrl')}</Label>
                        <Input
                          id="upload-audio"
                          value={uploadFormData.details.audioFile}
                          onChange={(e) => setUploadFormData({
                            ...uploadFormData, 
                            details: {...uploadFormData.details, audioFile: e.target.value}
                          })}
                          placeholder="https://example.com/track.mp3"
                        />
                        <p className="text-xs text-muted-foreground">{t('audioFileHelp')}</p>
                      </div>
                      
                      {uploadFormData.details.audioFile && (
                        <div className="mt-2 p-2 border rounded bg-muted">
                          <p className="text-sm font-medium mb-1">{t('selectedAudio')}</p>
                          <audio 
                            controls 
                            className="w-full max-w-md" 
                            src={uploadFormData.details.audioFile}
                          >
                            {t('audioNotSupported')}
                          </audio>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Album tracks section
                  <div className="space-y-4 mt-2 pb-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-base">{t('artistDashboard.tracklist')}</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Initialize tracklist if it doesn't exist yet
                          const currentTracklist = [...(uploadFormData.details.tracklist || [])];
                          currentTracklist.push({
                            title: '',
                            audioFile: '',
                            trackNumber: currentTracklist.length + 1
                          });
                          setUploadFormData({
                            ...uploadFormData,
                            details: {
                              ...uploadFormData.details,
                              tracklist: currentTracklist
                            }
                          });
                          setDebugLog([...debugLog, `Added new track to tracklist (total: ${currentTracklist.length})`]);
                        }}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        {t('artistDashboard.addTrack')}
                      </Button>
                    </div>
                    
                    {/* Tracks List */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {!uploadFormData.details.tracklist || uploadFormData.details.tracklist.length === 0 ? (
                        <div className="text-center py-4 border border-dashed rounded-md">
                          <p className="text-muted-foreground mb-2">{t('artistDashboard.noTracksAdded')}</p>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              const tracklist = [{
                                title: '',
                                audioFile: '',
                                trackNumber: 1
                              }];
                              setUploadFormData({
                                ...uploadFormData,
                                details: {
                                  ...uploadFormData.details,
                                  tracklist
                                }
                              });
                              setDebugLog([...debugLog, `Created initial tracklist with 1 track`]);
                            }}
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            {t('artistDashboard.addFirstTrack')}
                          </Button>
                        </div>
                      ) : (
                        uploadFormData.details.tracklist.map((track, index) => (
                          <div key={index} className="flex gap-3 p-3 border rounded-md">
                            <div className="flex flex-col justify-center items-center min-w-[40px]">
                              <span className="font-bold text-xl">{track.trackNumber}</span>
                            </div>
                            <div className="flex-1 space-y-3">
                              <div>
                                <Label htmlFor={`track-${index}-title`}>{t('title')}</Label>
                                <Input
                                  id={`track-${index}-title`}
                                  value={track.title}
                                  onChange={(e) => {
                                    const newTracklist = [...uploadFormData.details.tracklist!];
                                    newTracklist[index].title = e.target.value;
                                    setUploadFormData({
                                      ...uploadFormData,
                                      details: {
                                        ...uploadFormData.details,
                                        tracklist: newTracklist
                                      }
                                    });
                                  }}
                                  placeholder={t('artistDashboard.trackTitlePlaceholder')}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`track-${index}-audio`}>{t('audioFile')}</Label>
                                <div className="flex gap-2 mt-1">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1"
                                    onClick={() => {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'audio/*';
                                      input.onchange = (e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0];
                                        if (file) {
                                          // In a real app, we'd upload this to storage
                                          // For now, create an object URL as a placeholder
                                          const audioUrl = URL.createObjectURL(file);
                                          const newTracklist = [...uploadFormData.details.tracklist!];
                                          newTracklist[index].audioFile = audioUrl;
                                          setUploadFormData({
                                            ...uploadFormData,
                                            details: {
                                              ...uploadFormData.details,
                                              tracklist: newTracklist
                                            }
                                          });
                                          setDebugLog([...debugLog, `Updated audio for track ${index + 1}`]);
                                        }
                                      };
                                      input.click();
                                    }}
                                  >
                                    {t('uploadFromDevice')}
                                  </Button>
                                  <Input
                                    id={`track-${index}-audio`}
                                    value={track.audioFile}
                                    onChange={(e) => {
                                      const newTracklist = [...uploadFormData.details.tracklist!];
                                      newTracklist[index].audioFile = e.target.value;
                                      setUploadFormData({
                                        ...uploadFormData,
                                        details: {
                                          ...uploadFormData.details,
                                          tracklist: newTracklist
                                        }
                                      });
                                    }}
                                    placeholder="https://example.com/track.mp3"
                                  />
                                </div>
                                {track.audioFile && (
                                  <audio 
                                    controls 
                                    className="w-full mt-2" 
                                    src={track.audioFile}
                                  >
                                    {t('audioNotSupported')}
                                  </audio>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newTracklist = [...uploadFormData.details.tracklist!];
                                newTracklist.splice(index, 1);
                                
                                // Renumber remaining tracks
                                newTracklist.forEach((t, i) => {
                                  t.trackNumber = i + 1;
                                });
                                
                                setUploadFormData({
                                  ...uploadFormData,
                                  details: {
                                    ...uploadFormData.details,
                                    tracklist: newTracklist
                                  }
                                });
                                setDebugLog([...debugLog, `Removed track at position ${index + 1}, renumbered remaining tracks`]);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">{t('artistDashboard.remove')}</span>
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  {t('cancel')}
                </Button>
                <Button 
                  onClick={handleSaveUpload}
                  disabled={!uploadFormData.title || isPendingUpload}
                >
                  {isPendingUpload && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingUpload ? t('update') : t('create')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Royalties Tab */}
        <TabsContent value="royalties">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>{t('artistDashboard.royalties')}</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <CardDescription>
                Track your earnings and payment history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  This feature is coming soon. You'll be able to view detailed royalty reports and payment history.
                </p>
                <Button disabled>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Set up Payment Methods
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ArtistDashboardPage;