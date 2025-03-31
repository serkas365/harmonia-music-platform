import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Track } from "@shared/schema";
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { X, ListMusic, GripVertical } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface QueueManagementProps {
  open: boolean;
  onClose: () => void;
}

const QueueManagement = ({ open, onClose }: QueueManagementProps) => {
  const { t } = useTranslation();
  const {
    queue,
    currentTrack,
    history,
    removeFromQueue,
    clearQueue,
  } = usePlayerStore();
  
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex justify-between items-center">
            <div className="flex items-center">
              <ListMusic className="h-5 w-5 mr-2" />
              <span>{t('player.queue')}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('player.queueDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="mt-4 max-h-96 overflow-y-auto">
          {/* Now Playing */}
          {currentTrack && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">{t('player.nowPlaying')}</h4>
              <div className="flex items-center p-2 bg-background-highlight rounded-md">
                <div className="w-10 h-10 bg-background-elevated rounded-sm flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-xs truncate p-1">{currentTrack.albumTitle}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{currentTrack.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentTrack.artistName}</p>
                </div>
                <span className="text-xs text-muted-foreground ml-2">{formatTime(currentTrack.duration)}</span>
              </div>
            </div>
          )}
          
          {/* Queue */}
          {queue.length > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold">{t('player.upNext')}</h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-7 text-xs"
                  onClick={clearQueue}
                >
                  {t('player.clearQueue')}
                </Button>
              </div>
              <div className="space-y-2">
                {queue.map((track, index) => (
                  <div key={`${track.id}-${index}`} className="flex items-center p-2 bg-background-elevated rounded-md group">
                    <GripVertical className="h-4 w-4 text-muted-foreground mr-2 opacity-0 group-hover:opacity-100" />
                    <div className="w-8 h-8 bg-background-highlight rounded-sm flex items-center justify-center mr-2 flex-shrink-0">
                      <span className="text-xs truncate p-0.5">{track.albumTitle}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2 mr-2">{formatTime(track.duration)}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => removeFromQueue(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* History */}
          {history.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">{t('player.history')}</h4>
              <div className="space-y-2">
                {history.slice(-5).reverse().map((track, index) => (
                  <div key={`history-${track.id}-${index}`} className="flex items-center p-2 bg-background-elevated rounded-md opacity-60">
                    <div className="w-8 h-8 bg-background-highlight rounded-sm flex items-center justify-center mr-2 flex-shrink-0">
                      <span className="text-xs truncate p-0.5">{track.albumTitle}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">{formatTime(track.duration)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {queue.length === 0 && history.length === 0 && !currentTrack && (
            <div className="py-8 text-center text-muted-foreground">
              <ListMusic className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>{t('player.emptyQueue')}</p>
              <p className="text-sm">{t('player.addSongsToQueue')}</p>
            </div>
          )}
        </div>
        
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose} className="w-full">
            Close
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default QueueManagement;