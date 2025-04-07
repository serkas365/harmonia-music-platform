import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Trash, Music, Album as AlbumIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';

// Interface for form data
interface UploadFormData {
  title: string;
  uploadType: 'track' | 'album';
  details: {
    description: string;
    genres: string[];
    coverImage: string;
    audioFile?: string;
    tracklist?: { 
      title: string; 
      audioFile: string; 
      trackNumber: number;
    }[];
  };
}

// This is a standalone album upload form for debugging
export default function AlbumUploadDebug() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<UploadFormData>({
    title: 'Test Album',
    uploadType: 'album',
    details: {
      description: 'This is a test album for debugging',
      genres: ['Pop', 'Electronic'],
      coverImage: 'https://placehold.co/400',
      tracklist: [
        { title: 'Test Track 1', audioFile: 'https://example.com/track1.mp3', trackNumber: 1 }
      ]
    }
  });

  const [debugMessages, setDebugMessages] = useState<string[]>([]);

  const addDebugMessage = (message: string) => {
    setDebugMessages(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const addTrack = () => {
    const newTracklist = [...(formData.details.tracklist || [])];
    newTracklist.push({
      title: '',
      audioFile: '',
      trackNumber: newTracklist.length + 1
    });
    setFormData({
      ...formData,
      details: {
        ...formData.details,
        tracklist: newTracklist
      }
    });
    addDebugMessage(`Added new track (total: ${newTracklist.length})`);
  };

  const removeTrack = (index: number) => {
    const newTracklist = [...(formData.details.tracklist || [])];
    newTracklist.splice(index, 1);
    // Renumber remaining tracks
    newTracklist.forEach((t, i) => {
      t.trackNumber = i + 1;
    });
    setFormData({
      ...formData,
      details: {
        ...formData.details,
        tracklist: newTracklist
      }
    });
    addDebugMessage(`Removed track at index ${index} (remaining: ${newTracklist.length})`);
  };

  const updateTrackTitle = (index: number, title: string) => {
    const newTracklist = [...(formData.details.tracklist || [])];
    newTracklist[index].title = title;
    setFormData({
      ...formData,
      details: {
        ...formData.details,
        tracklist: newTracklist
      }
    });
  };

  const updateTrackAudio = (index: number, audioFile: string) => {
    const newTracklist = [...(formData.details.tracklist || [])];
    newTracklist[index].audioFile = audioFile;
    setFormData({
      ...formData,
      details: {
        ...formData.details,
        tracklist: newTracklist
      }
    });
  };

  const handleSubmit = async () => {
    try {
      addDebugMessage(`Submitting form: ${JSON.stringify(formData, null, 2)}`);
      
      // Create a copy of the form data to handle track data properly
      const submitData = { 
        ...formData,
        details: {
          ...formData.details,
          // Add the tracklist to the tracks array for backend compatibility
          tracks: formData.details.tracklist?.map(track => ({
            title: track.title,
            audioFile: track.audioFile,
            trackNumber: track.trackNumber
          }))
        }
      };
      
      addDebugMessage(`Submit data prepared: ${JSON.stringify(submitData, null, 2)}`);
      
      const response = await apiRequest('POST', '/api/artist-dashboard/uploads', submitData);
      const data = await response.json();
      
      addDebugMessage(`Response: ${JSON.stringify(data, null, 2)}`);
      
      toast({
        title: "Album created successfully",
        description: `Album "${formData.title}" was created with ${formData.details.tracklist?.length || 0} tracks.`
      });
    } catch (error) {
      console.error("Error submitting album:", error);
      addDebugMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      
      toast({
        title: "Failed to create album",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Album Upload Debug</h1>
      
      <div className="grid gap-6 mb-6">
        <div>
          <Label htmlFor="album-title">Album Title</Label>
          <Input 
            id="album-title" 
            value={formData.title} 
            onChange={(e) => setFormData({
              ...formData,
              title: e.target.value
            })}
          />
        </div>
        
        <div>
          <Label htmlFor="album-description">Description</Label>
          <Textarea 
            id="album-description" 
            value={formData.details.description} 
            onChange={(e) => setFormData({
              ...formData,
              details: {
                ...formData.details,
                description: e.target.value
              }
            })}
          />
        </div>
        
        <div>
          <Label htmlFor="album-cover">Cover Image URL</Label>
          <Input 
            id="album-cover" 
            value={formData.details.coverImage} 
            onChange={(e) => setFormData({
              ...formData,
              details: {
                ...formData.details,
                coverImage: e.target.value
              }
            })}
          />
          {formData.details.coverImage && (
            <div className="mt-2 flex justify-center">
              <img 
                src={formData.details.coverImage} 
                alt="Album cover" 
                className="h-40 w-40 object-cover rounded-md border"
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-4 mt-6 border-t pt-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Tracks</h3>
          <Button
            type="button"
            size="sm"
            onClick={addTrack}
          >
            <Plus className="mr-1 h-4 w-4" />
            Track
          </Button>
        </div>
        
        {/* Tracklist Items */}
        <div className="space-y-4">
          {!formData.details.tracklist || formData.details.tracklist.length === 0 ? (
            <div className="text-center py-6 border border-dashed rounded-md">
              <p className="text-muted-foreground">No tracks added yet</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={addTrack}
              >
                <Plus className="mr-1 h-4 w-4" />
                Track
              </Button>
            </div>
          ) : (
            formData.details.tracklist.map((track, index) => (
              <div key={index} className="flex gap-4 p-4 border rounded-md">
                <div className="flex flex-col justify-center items-center min-w-[40px]">
                  <span className="font-bold text-xl">{track.trackNumber}</span>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <Label htmlFor={`track-title-${index}`}>Title</Label>
                    <Input
                      id={`track-title-${index}`}
                      value={track.title}
                      onChange={(e) => updateTrackTitle(index, e.target.value)}
                      placeholder="Enter track title"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`track-audio-${index}`}>Audio File</Label>
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
                              const audioUrl = URL.createObjectURL(file);
                              updateTrackAudio(index, audioUrl);
                            }
                          };
                          input.click();
                        }}
                      >
                        Upload from Device
                      </Button>
                      <Input
                        id={`track-audio-${index}`}
                        value={track.audioFile}
                        onChange={(e) => updateTrackAudio(index, e.target.value)}
                        placeholder="https://example.com/track.mp3"
                      />
                    </div>
                    {track.audioFile && (
                      <audio 
                        controls 
                        className="w-full mt-2" 
                        src={track.audioFile}
                      >
                        Your browser does not support the audio element
                      </audio>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTrack(index)}
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Remove track</span>
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <Button type="button" onClick={handleSubmit}>
          Submit Album
        </Button>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Debug Log</h3>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
            {debugMessages.length === 0 ? (
              <p>No debug messages yet...</p>
            ) : (
              debugMessages.map((msg, i) => (
                <div key={i} className="mb-1">{msg}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}