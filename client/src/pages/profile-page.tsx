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
        title: t('profile.updateSuccess'),
        description: t('profile.profileUpdated'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('profile.updateError'),
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
        title: t('profile.preferencesSuccess'),
        description: t('profile.preferencesUpdated'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('profile.preferencesError'),
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
              <CardTitle>{t('profile.personalInfo', 'Personal Info')}</CardTitle>
              <CardDescription>
                {t('profile.personalInfoDesc', 'Update your personal information')}
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
                            <FormLabel>{t('profile.profileImage', 'Profile Image URL')}</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/image.jpg" {...field} />
                            </FormControl>
                            <FormDescription>
                              {t('profile.imageDesc', 'Enter a URL for your profile picture')}
                            </FormDescription>
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
                        <FormLabel>{t('profile.displayName', 'Display Name')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          {t('profile.displayNameDesc', 'This is your public display name')}
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
                        <FormLabel>{t('profile.city', 'City')}</FormLabel>
                        <FormControl>
                          <Input placeholder="New York, London, etc." {...field} />
                        </FormControl>
                        <FormDescription>
                          {t('profile.cityDesc', 'Your city or location')}
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
                        <FormLabel>{t('profile.favoriteArtists', 'Favorite Artists')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Artist names, separated by commas" {...field} />
                        </FormControl>
                        <FormDescription>
                          {t('profile.favoriteArtistsDesc', 'Add your favorite artists, separated by commas')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('profile.socialMedia', 'Social Media')}</h3>
                    
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
                        {t('profile.saving', 'Saving...')}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> 
                        {t('profile.saveChanges', 'Save Changes')}
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
              <CardTitle>{t('profile.preferences', 'Preferences')}</CardTitle>
              <CardDescription>
                {t('profile.preferencesDesc', 'Customize your experience')}
              </CardDescription>
            </CardHeader>
            <Form {...preferencesForm}>
              <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)}>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('profile.appSettings', 'App Settings')}</h3>
                    
                    <FormField
                      control={preferencesForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('profile.language', 'Language')}</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('profile.selectLanguage', 'Select language')} />
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
                          <FormLabel>{t('profile.theme', 'Theme')}</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('profile.selectTheme', 'Select theme')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="dark">{t('profile.dark', 'Dark')}</SelectItem>
                              <SelectItem value="light">{t('profile.light', 'Light')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('profile.playbackSettings', 'Playback Settings')}</h3>
                    
                    <FormField
                      control={preferencesForm.control}
                      name="audioQuality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('profile.audioQuality', 'Audio Quality')}</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={user.subscriptionTier === 'free' && field.value !== 'standard'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('profile.selectQuality', 'Select quality')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="standard">{t('profile.standard', 'Standard')}</SelectItem>
                              <SelectItem value="high" disabled={user.subscriptionTier === 'free'}>
                                {t('profile.high', 'High')} {user.subscriptionTier === 'free' && '(Premium)'}
                              </SelectItem>
                              <SelectItem value="lossless" disabled={user.subscriptionTier !== 'ultimate'}>
                                {t('profile.lossless', 'Lossless')} {user.subscriptionTier !== 'ultimate' && '(Ultimate)'}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {user.subscriptionTier === 'free' && (
                            <FormDescription>
                              {t('profile.upgradeForBetterAudio', 'Upgrade to Premium or Ultimate for better audio quality')}
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
                            <FormLabel>{t('profile.autoplay', 'Autoplay')}</FormLabel>
                            <FormDescription>
                              {t('profile.autoplayDesc', 'Automatically play songs when opening the app')}
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
                    <h3 className="text-lg font-medium">{t('profile.notifications', 'Notifications')}</h3>
                    
                    <FormField
                      control={preferencesForm.control}
                      name="notifications.email"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>{t('profile.emailNotifications', 'Email Notifications')}</FormLabel>
                            <FormDescription>
                              {t('profile.emailNotificationsDesc', 'Receive notifications via email')}
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
                            <FormLabel>{t('profile.pushNotifications', 'Push Notifications')}</FormLabel>
                            <FormDescription>
                              {t('profile.pushNotificationsDesc', 'Receive push notifications in the app')}
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
                            <FormLabel>{t('profile.newReleaseNotifs', 'New Releases')}</FormLabel>
                            <FormDescription>
                              {t('profile.newReleaseNotifsDesc', 'Get notified about new releases from your favorite artists')}
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
                            <FormLabel>{t('profile.playlistNotifs', 'Playlist Updates')}</FormLabel>
                            <FormDescription>
                              {t('profile.playlistNotifsDesc', 'Get notified when followed playlists are updated')}
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
                        {t('profile.saving', 'Saving...')}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> 
                        {t('profile.saveChanges', 'Save Changes')}
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
              <CardTitle>{t('profile.accountSettings', 'Account Settings')}</CardTitle>
              <CardDescription>
                {t('profile.accountSettingsDesc', 'Manage your account')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{t('profile.email', 'Email')}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Button variant="outline" size="sm">{t('profile.change', 'Change')}</Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{t('profile.username', 'Username')}</h3>
                    <p className="text-sm text-muted-foreground">{user.username}</p>
                  </div>
                  <Button variant="outline" size="sm">{t('profile.change', 'Change')}</Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{t('profile.password', 'Password')}</h3>
                    <p className="text-sm text-muted-foreground">••••••••</p>
                  </div>
                  <Button variant="outline" size="sm">{t('profile.change', 'Change')}</Button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="font-medium">{t('profile.subscription', 'Subscription')}</h3>
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)}
                        </p>
                        {user.subscriptionEndDate && (
                          <p className="text-sm text-muted-foreground">
                            {t('profile.renewsOn', 'Renews on')} {new Date(user.subscriptionEndDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">{t('profile.manageSub', 'Manage')}</Button>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="font-medium">{t('profile.dangerZone', 'Danger Zone')}</h3>
                  <Button variant="destructive">{t('profile.deleteAccount', 'Delete Account')}</Button>
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