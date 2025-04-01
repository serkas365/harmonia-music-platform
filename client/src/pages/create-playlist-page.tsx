import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Redirect, useLocation } from 'wouter';
import { Music, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Playlist } from '@shared/schema';

// Create form schema
const formSchema = z.object({
  name: z.string().min(1, 'Playlist name is required'),
  isPublic: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

const CreatePlaylistPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Redirect if not authenticated
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // Initialize form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      isPublic: false,
    },
  });
  
  // Create playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest('POST', '/api/playlists', data);
      return await res.json() as Playlist;
    },
    onSuccess: (playlist: Playlist) => {
      queryClient.invalidateQueries({ queryKey: ['/api/me/playlists'] });
      
      toast({
        title: t('playlist.createSuccess'),
        description: t('playlist.playlistCreated'),
      });
      
      // Redirect to the newly created playlist
      navigate(`/playlists/${playlist.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: t('playlist.createError'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const onSubmit = (values: FormValues) => {
    createPlaylistMutation.mutate(values);
  };
  
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
        <h1 className="text-3xl font-bold">{t('playlist.createNew')}</h1>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Default Playlist Cover */}
        <div className="md:w-64">
          <div className="aspect-square bg-background-highlight rounded-md mb-4 flex items-center justify-center">
            <Music className="h-16 w-16 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t('playlist.coverAddLater')}
          </p>
        </div>
        
        {/* Create Playlist Form */}
        <div className="flex-1 max-w-xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('playlist.name')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('playlist.namePlaceholder')} 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      {t('playlist.nameDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t('playlist.makePublic')}
                      </FormLabel>
                      <FormDescription>
                        {t('playlist.publicDescription')}
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
              
              <Button 
                type="submit" 
                className="w-full md:w-auto"
                disabled={createPlaylistMutation.isPending}
              >
                {createPlaylistMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('common.creating')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('playlist.create')}
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default CreatePlaylistPage;