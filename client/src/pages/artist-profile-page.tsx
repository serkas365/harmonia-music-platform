import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Artist } from '@shared/schema';
import { Redirect } from 'wouter';
import { Loader2, Save, Globe, Instagram, Twitter, Youtube, Facebook, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';

const ArtistProfilePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  
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
  
  // Redirect if not an artist
  if (!user || user.role !== 'artist') {
    return <Redirect to="/" />;
  }
  
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
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/me/artist-profile'] });
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
  
  if (isLoadingProfile) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (profileError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('artistProfile.title')}</h1>
        <p className="text-destructive">
          {t('artistProfile.error')}
        </p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('artistProfile.title')}</h1>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general">{t('artistProfile.generalInfo')}</TabsTrigger>
          <TabsTrigger value="social">{t('artistProfile.socialMedia')}</TabsTrigger>
          <TabsTrigger value="preview">{t('artistProfile.previewProfile')}</TabsTrigger>
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
        
        {/* Profile Preview Tab */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>{t('artistProfile.previewProfile')}</CardTitle>
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
            </CardContent>
            <CardFooter>
              <Button variant="outline">{t('artistProfile.shareProfile')}</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ArtistProfilePage;