import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Trash } from 'lucide-react';

// This is a minimal version of the album upload form for debugging
export default function AlbumUploadDebug() {
  const [tracklist, setTracklist] = useState([
    { title: '', audioFile: '', trackNumber: 1 }
  ]);

  const addTrack = () => {
    const newTracklist = [...tracklist];
    newTracklist.push({
      title: '',
      audioFile: '',
      trackNumber: tracklist.length + 1
    });
    setTracklist(newTracklist);
  };

  const removeTrack = (index: number) => {
    const newTracklist = [...tracklist];
    newTracklist.splice(index, 1);
    // Renumber remaining tracks
    newTracklist.forEach((t, i) => {
      t.trackNumber = i + 1;
    });
    setTracklist(newTracklist);
  };

  const updateTrackTitle = (index: number, title: string) => {
    const newTracklist = [...tracklist];
    newTracklist[index].title = title;
    setTracklist(newTracklist);
  };

  const updateTrackAudio = (index: number, audioFile: string) => {
    const newTracklist = [...tracklist];
    newTracklist[index].audioFile = audioFile;
    setTracklist(newTracklist);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Album Upload Debug</h1>
      
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
          {tracklist.length === 0 ? (
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
            tracklist.map((track, index) => (
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

      <div className="mt-6">
        <Button type="button" onClick={() => console.log("Tracklist:", tracklist)}>
          Submit Album
        </Button>
      </div>
    </div>
  );
}