import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Volume2, VolumeX, Settings } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export interface MediaConfig {
  type: 'video' | 'audio' | 'gif' | 'youtube' | 'icon';
  src: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  iconName?: string;
  iconColor?: string;
  iconSize?: number;
}

interface MediaElementProps {
  config: MediaConfig;
  onConfigChange: (config: MediaConfig) => void;
  isEditing?: boolean;
}

export const MediaElement = ({ config, onConfigChange, isEditing = false }: MediaElementProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(config.muted ?? false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localUrl, setLocalUrl] = useState(config.src);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    const media = videoRef.current || audioRef.current;
    if (media) {
      if (isPlaying) {
        media.pause();
      } else {
        media.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const media = videoRef.current || audioRef.current;
    if (media) {
      media.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSave = () => {
    onConfigChange({ ...config, src: localUrl });
    setSettingsOpen(false);
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/)?.[1];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=${config.autoplay ? 1 : 0}&loop=${config.loop ? 1 : 0}&mute=${config.muted ? 1 : 0}`;
    }
    return url;
  };

  const renderMedia = () => {
    switch (config.type) {
      case 'video':
        return (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={config.src}
              className="w-full h-full object-cover rounded"
              autoPlay={config.autoplay}
              loop={config.loop}
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {!config.controls && (
              <div className="absolute bottom-2 left-2 flex gap-1">
                <Button size="icon" variant="secondary" className="h-8 w-8 opacity-80" onClick={togglePlay}>
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button size="icon" variant="secondary" className="h-8 w-8 opacity-80" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40 rounded p-4">
            <audio
              ref={audioRef}
              src={config.src}
              autoPlay={config.autoplay}
              loop={config.loop}
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-12 w-12 text-primary-foreground hover:bg-transparent"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="secondary" className="h-8 w-8" onClick={toggleMute}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <span className="text-sm text-foreground/70">Audio Player</span>
            </div>
          </div>
        );

      case 'gif':
        return (
          <img
            src={config.src}
            alt="GIF"
            className="w-full h-full object-cover rounded"
          />
        );

      case 'youtube':
        return (
          <iframe
            src={getYouTubeEmbedUrl(config.src)}
            className="w-full h-full rounded"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );

      case 'icon':
        return (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ color: config.iconColor || '#000000' }}
          >
            <span 
              className="material-icons"
              style={{ fontSize: config.iconSize || 48 }}
            >
              {config.iconName || 'star'}
            </span>
          </div>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-muted rounded">
            <span className="text-muted-foreground">Media not loaded</span>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full relative">
      {renderMedia()}
      
      {isEditing && (
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button 
              size="icon" 
              variant="secondary" 
              className="absolute top-2 right-2 h-8 w-8 opacity-70 hover:opacity-100"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Media Settings</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Media URL</Label>
                <Input
                  value={localUrl}
                  onChange={(e) => setLocalUrl(e.target.value)}
                  placeholder="Enter URL..."
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.autoplay}
                    onChange={(e) => onConfigChange({ ...config, autoplay: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Autoplay</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.loop}
                    onChange={(e) => onConfigChange({ ...config, loop: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Loop</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.muted}
                    onChange={(e) => onConfigChange({ ...config, muted: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Muted</span>
                </label>
              </div>

              <Button onClick={handleSave} className="w-full">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default MediaElement;
