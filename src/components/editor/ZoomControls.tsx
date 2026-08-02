import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  Monitor,
} from 'lucide-react';

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  minZoom?: number;
  maxZoom?: number;
}

const ZOOM_PRESETS = [25, 50, 75, 100, 125, 150, 200, 300];

export const ZoomControls = ({
  zoom,
  onZoomChange,
  minZoom = 25,
  maxZoom = 300,
}: ZoomControlsProps) => {
  const { language } = useLanguage();

  const handleZoomIn = () => {
    const newZoom = Math.min(maxZoom, zoom + 25);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(minZoom, zoom - 25);
    onZoomChange(newZoom);
  };

  const handleReset = () => {
    onZoomChange(100);
  };

  const handleFitToScreen = () => {
    // This will be calculated based on canvas size
    onZoomChange(100);
  };

  return (
    <div className="flex items-center gap-1 bg-card border rounded-lg p-1">
      {/* Zoom Out */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomOut}
            disabled={zoom <= minZoom}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
          <div className="flex items-center gap-1.5">
            <ZoomOut className="w-3 h-3" />
            {language === 'ar' ? 'تصغير' : 'Zoom Out'} (Ctrl+-)
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Zoom Level Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 min-w-[60px] font-mono text-sm"
          >
            {zoom}%
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="center">
          <div className="space-y-4">
            {/* Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {language === 'ar' ? 'مستوى التكبير' : 'Zoom Level'}
                </span>
                <span className="font-mono">{zoom}%</span>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={([value]) => onZoomChange(value)}
                min={minZoom}
                max={maxZoom}
                step={5}
              />
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">
                {language === 'ar' ? 'قيم سريعة' : 'Quick Presets'}
              </span>
              <div className="grid grid-cols-4 gap-1">
                {ZOOM_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    variant={zoom === preset ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => onZoomChange(preset)}
                  >
                    {preset}%
                  </Button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleFitToScreen}
              >
                <Maximize className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'ملء الشاشة' : 'Fit'}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Zoom In */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomIn}
            disabled={zoom >= maxZoom}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
          <div className="flex items-center gap-1.5">
            <ZoomIn className="w-3 h-3" />
            {language === 'ar' ? 'تكبير' : 'Zoom In'} (Ctrl++)
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Fit to Screen */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleFitToScreen}
          >
            <Monitor className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
          <div className="flex items-center gap-1.5">
            <Monitor className="w-3 h-3" />
            {language === 'ar' ? 'ملء الشاشة' : 'Fit to Screen'}
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default ZoomControls;
