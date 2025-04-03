import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, UserPreferences, NotificationSettings } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Save, User as UserIcon } from "lucide-react";
import { Redirect } from "wouter";

// Schema for profile update form
const profileFormSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  profileImage: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  socialMedia: z.object({
    instagram: z.string().optional().or(z.literal('')),
    twitter: z.string().optional().or(z.literal('')),
    facebook: z.string().optional().or(z.literal('')),
    youtube: z.string().optional().or(z.literal('')),
    soundcloud: z.string().optional().or(z.literal('')),
  }),
  favoriteArtists: z.string().optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Schema for preferences form
const preferencesFormSchema = z.object({
  language: z.enum(["en", "fr"]),
  theme: z.enum(["dark", "light"]),
  audioQuality: z.enum(["standard", "high", "lossless"]),
  autoplay: z.boolean(),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    newReleases: z.boolean(),
    playlists: z.boolean(),
  }),
});

type PreferencesFormValues = z.infer<typeof preferencesFormSchema>;

const ProfilePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Redirect if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user.displayName || "",
      profileImage: user.profileImage || "",
      city: user.city || "",
      socialMedia: {
        instagram: user.socialMedia?.instagram || "",
        twitter: user.socialMedia?.twitter || "",
        facebook: user.socialMedia?.facebook || "",
        youtube: user.socialMedia?.youtube || "",
        soundcloud: user.socialMedia?.soundcloud || "",
      },
      favoriteArtists: user.favoriteArtists || "",
    },
  });

  // Default values for preferences
  const defaultPreferences: UserPreferences = {
    language: "en",
    theme: "dark",
    audioQuality: "standard",
    autoplay: true,
    notifications: {
      email: true,
      push: true,
      newReleases: true,
      playlists: true,
    },
  };
  
  // Preferences form
  const preferencesForm = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: user.preferences || defaultPreferences,
  });
  
  // Fetch user preferences
  const {
    data: preferences,
    isLoading: isLoadingPreferences,
  } = useQuery<UserPreferences>({
    queryKey: ['/api/me/preferences'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/me/preferences');
      if (!res.ok) {
        // If preferences don't exist yet, return defaults
        if (res.status === 404) {
          return defaultPreferences;
        }
        throw new Error('Failed to fetch preferences');
      }
      return res.json();
    },
  });
  
  // Update form when preferences data is loaded
  useEffect(() => {
    if (preferences) {
      preferencesForm.reset(preferences);
    }
  }, [preferences, preferencesForm]);
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest('PATCH', '/api/me', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: t('profilePage.updateSuccess'),
        description: t('profilePage.profileUpdated'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('profilePage.updateError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: PreferencesFormValues) => {
      const res = await apiRequest('POST', '/api/me/preferences', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me/preferences'] });
      toast({
        title: t('profilePage.preferencesSuccess'),
        description: t('profilePage.preferencesUpdated'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('profilePage.preferencesError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Handle profile update
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  // Handle preferences update
  const onPreferencesSubmit = (data: PreferencesFormValues) => {
    updatePreferencesMutation.mutate(data);
  };
  
  // Loading state
  if (isLoadingPreferences) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('profilePage.title', 'My Profile')}</h1>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">{t('profilePage.personalInfo', 'Personal Info')}</TabsTrigger>
          <TabsTrigger value="preferences">{t('profilePage.preferences', 'Preferences')}</TabsTrigger>
          <TabsTrigger value="account">{t('profilePage.account', 'Account')}</TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('profilePage.personalInfo', 'Personal Info')}</CardTitle>
              <CardDescription>
                {t('profilePage.personalInfoDesc', 'Update your personal information')}
              </CardDescription>
            </CardHeader>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage 
                        src={profileForm.watch('profileImage') || undefined} 
                        alt={profileForm.watch('displayName')} 
                      />
                      <AvatarFallback>
                        {profileForm.watch('displayName')?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <FormField
                        control={profileForm.control}
                        name="profileImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('profilePage.profileImage', 'Profile Image')}</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/image.jpg" {...field} />
                            </FormControl>
                            <FormDescription>
                              {t('profilePage.imageDesc', 'Enter a URL for your profile picture')}
                            </FormDescription>
                            <div className="mt-2">
                              <Label htmlFor="profile-upload">{t('profilePage.or', 'OR upload an image:')}</Label>
                              <Input 
                                id="profile-upload" 
                                type="file" 
                                accept="image/*"
                                className="mt-1"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    // Create a helper function to resize image
                                    const resizeImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
                                      return new Promise((resolve, reject) => {
                                        const img = new Image();
                                        img.onload = () => {
                                          // Calculate new dimensions while maintaining aspect ratio
                                          let width = img.width;
                                          let height = img.height;
                                          
                                          if (width > height) {
                                            if (width > maxWidth) {
                                              height = Math.round(height * maxWidth / width);
                                              width = maxWidth;
                                            }
                                          } else {
                                            if (height > maxHeight) {
                                              width = Math.round(width * maxHeight / height);
                                              height = maxHeight;
                                            }
                                          }
                                          
                                          // Create canvas and resize
                                          const canvas = document.createElement('canvas');
                                          canvas.width = width;
                                          canvas.height = height;
                                          
                                          const ctx = canvas.getContext('2d');
                                          if (!ctx) {
                                            reject(new Error('Could not get canvas context'));
                                            return;
                                          }
                                          
                                          ctx.drawImage(img, 0, 0, width, height);
                                          
                                          // Convert to base64 data URL with reduced quality
                                          resolve(canvas.toDataURL(file.type, quality));
                                        };
                                        
                                        img.onerror = (err) => reject(err);
                                        
                                        // Create object URL for the file
                                        img.src = URL.createObjectURL(file);
                                      });
                                    };
                                    
                                    try {
                                      // Show loading toast
                                      toast({
                                        title: t('profilePage.processingImage', 'Processing image...'),
                                        description: t('profilePage.resizingImage', 'Optimizing image size...'),
                                      });
                                      
                                      // Resize image
                                      const resizedImageUrl = await resizeImage(file);
                                      field.onChange(resizedImageUrl);
                                      
                                      // Show success toast
                                      toast({
                                        title: t('profilePage.imageReady', 'Image ready'),
                                        description: t('profilePage.imageOptimized', 'Image has been optimized and is ready to save.'),
                                      });
                                    } catch (error) {
                                      console.error('Error resizing image:', error);
                                      toast({
                                        title: t('profilePage.imageError', 'Image error'),
                                        description: t('profilePage.imageProcessingError', 'There was an error processing your image.'),
                                        variant: 'destructive',
                                      });
                                      
                                      // Fallback to regular file reader if resize fails
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        field.onChange(event.target?.result);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }
                                }} 
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('profilePage.displayName', 'Display Name')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          {t('profilePage.displayNameDesc', 'This is your public display name')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('profilePage.city', 'City')}</FormLabel>
                        <FormControl>
                          <Input placeholder="New York, London, etc." {...field} />
                        </FormControl>
                        <FormDescription>
                          {t('profilePage.cityDesc', 'Your city or location')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="favoriteArtists"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('profilePage.favoriteArtists', 'Favorite Artists')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Artist names, separated by commas" {...field} />
                        </FormControl>
                        <FormDescription>
                          {t('profilePage.favoriteArtistsDesc', 'Add your favorite artists, separated by commas')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('profilePage.socialMedia', 'Social Media')}</h3>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={profileForm.control}
                        name="socialMedia.instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instagram</FormLabel>
                            <FormControl>
                              <Input placeholder="@username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="socialMedia.twitter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Twitter</FormLabel>
                            <FormControl>
                              <Input placeholder="@username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="socialMedia.facebook"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Facebook</FormLabel>
                            <FormControl>
                              <Input placeholder="username or profile URL" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="socialMedia.youtube"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>YouTube</FormLabel>
                            <FormControl>
                              <Input placeholder="channel name or URL" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="socialMedia.soundcloud"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SoundCloud</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        {t('profilePage.saving', 'Saving...')}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> 
                        {t('profilePage.saveChanges', 'Save Changes')}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
        
        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>{t('profilePage.preferences', 'Preferences')}</CardTitle>
              <CardDescription>
                {t('profilePage.preferencesDesc', 'Customize your experience')}
              </CardDescription>
            </CardHeader>
            <Form {...preferencesForm}>
              <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)}>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('profilePage.appSettings', 'App Settings')}</h3>
                    
                    <FormField
                      control={preferencesForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('profilePage.language', 'Language')}</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('profilePage.selectLanguage', 'Select language')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="fr">Français</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={preferencesForm.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('profilePage.theme', 'Theme')}</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('profilePage.selectTheme', 'Select theme')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="dark">{t('profilePage.dark', 'Dark')}</SelectItem>
                              <SelectItem value="light">{t('profilePage.light', 'Light')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('profilePage.playbackSettings', 'Playback Settings')}</h3>
                    
                    <FormField
                      control={preferencesForm.control}
                      name="audioQuality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('profilePage.audioQuality', 'Audio Quality')}</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={user.subscriptionTier === 'free' && field.value !== 'standard'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('profilePage.selectQuality', 'Select quality')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="standard">{t('profilePage.standard', 'Standard')}</SelectItem>
                              <SelectItem value="high" disabled={user.subscriptionTier === 'free'}>
                                {t('profilePage.high', 'High')} {user.subscriptionTier === 'free' && '(Premium)'}
                              </SelectItem>
                              <SelectItem value="lossless" disabled={user.subscriptionTier !== 'ultimate'}>
                                {t('profilePage.lossless', 'Lossless')} {user.subscriptionTier !== 'ultimate' && '(Ultimate)'}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {user.subscriptionTier === 'free' && (
                            <FormDescription>
                              {t('profilePage.upgradeForBetterAudio', 'Upgrade to Premium or Ultimate for better audio quality')}
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={preferencesForm.control}
                      name="autoplay"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>{t('profilePage.autoplay', 'Autoplay')}</FormLabel>
                            <FormDescription>
                              {t('profilePage.autoplayDesc', 'Automatically play songs when opening the app')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('profilePage.notifications', 'Notifications')}</h3>
                    
                    <FormField
                      control={preferencesForm.control}
                      name="notifications.email"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>{t('profilePage.emailNotifications', 'Email Notifications')}</FormLabel>
                            <FormDescription>
                              {t('profilePage.emailNotificationsDesc', 'Receive notifications via email')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={preferencesForm.control}
                      name="notifications.push"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>{t('profilePage.pushNotifications', 'Push Notifications')}</FormLabel>
                            <FormDescription>
                              {t('profilePage.pushNotificationsDesc', 'Receive push notifications in the app')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={preferencesForm.control}
                      name="notifications.newReleases"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>{t('profilePage.newReleaseNotifs', 'New Releases')}</FormLabel>
                            <FormDescription>
                              {t('profilePage.newReleaseNotifsDesc', 'Get notified about new releases from your favorite artists')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={preferencesForm.control}
                      name="notifications.playlists"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>{t('profilePage.playlistNotifs', 'Playlist Updates')}</FormLabel>
                            <FormDescription>
                              {t('profilePage.playlistNotifsDesc', 'Get notified when followed playlists are updated')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    disabled={updatePreferencesMutation.isPending}
                  >
                    {updatePreferencesMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        {t('profilePage.saving', 'Saving...')}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> 
                        {t('profilePage.saveChanges', 'Save Changes')}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
        
        {/* Account Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>{t('profilePage.accountSettings', 'Account Settings')}</CardTitle>
              <CardDescription>
                {t('profilePage.accountSettingsDesc', 'Manage your account')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{t('profilePage.email', 'Email')}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Button variant="outline" size="sm">{t('profilePage.change', 'Change')}</Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{t('profilePage.username', 'Username')}</h3>
                    <p className="text-sm text-muted-foreground">{user.username}</p>
                  </div>
                  <Button variant="outline" size="sm">{t('profilePage.change', 'Change')}</Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{t('profilePage.password', 'Password')}</h3>
                    <p className="text-sm text-muted-foreground">••••••••</p>
                  </div>
                  <Button variant="outline" size="sm">{t('profilePage.change', 'Change')}</Button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="font-medium">{t('profilePage.subscription', 'Subscription')}</h3>
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)}
                        </p>
                        {user.subscriptionEndDate && (
                          <p className="text-sm text-muted-foreground">
                            {t('profilePage.renewsOn', 'Renews on')} {new Date(user.subscriptionEndDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">{t('profilePage.manageSub', 'Manage')}</Button>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="font-medium">{t('profilePage.dangerZone', 'Danger Zone')}</h3>
                  <Button variant="destructive">{t('profilePage.deleteAccount', 'Delete Account')}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;