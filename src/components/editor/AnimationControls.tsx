import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sparkles,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Shuffle,
  Play,
  Pause,
  Eye,
  Layers,
  Wand2,
  FlipHorizontal,
  FlipVertical,
  Move3d,
  Maximize2,
  Minimize2,
  RefreshCw,
  Zap,
  Heart,
  Star,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Enhanced Animation Types
export type AnimationType = 
  | 'none'
  // Entrance animations
  | 'fade' | 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right'
  | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down'
  | 'zoom-in' | 'zoom-out' | 'zoom-in-up' | 'zoom-in-down'
  | 'flip-x' | 'flip-y' | 'flip-3d'
  | 'rotate' | 'rotate-in' | 'rotate-out'
  | 'bounce' | 'bounce-in' | 'bounce-left' | 'bounce-right'
  | 'elastic' | 'elastic-in' | 'elastic-out'
  // Attention animations
  | 'pulse' | 'shake' | 'wobble' | 'swing' | 'tada' | 'jello' | 'heartbeat' | 'flash' | 'rubber-band'
  // Special animations
  | 'typewriter' | 'blur-in' | 'glitch' | 'morph' | 'wave' | 'float' | 'glow';

export type EasingType = 
  | 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
  | 'cubic-bezier-bounce' | 'cubic-bezier-elastic' | 'cubic-bezier-smooth'
  | 'spring' | 'steps';

export type TransitionType = 
  | 'none' | 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down'
  | 'zoom' | 'zoom-rotate' | 'flip-x' | 'flip-y' | 'flip-3d'
  | 'cube' | 'cube-left' | 'cube-right'
  | 'carousel' | 'cards' | 'fold' | 'unfold'
  | 'glitch' | 'morph' | 'dissolve' | 'wipe-left' | 'wipe-right' | 'wipe-up' | 'wipe-down'
  | 'circle' | 'diamond' | 'curtain' | 'blinds' | 'pixelate';

export interface Animation {
  type: AnimationType;
  duration: number;
  delay: number;
  easing: EasingType;
  repeat?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  playState?: 'running' | 'paused';
  stagger?: number; // For staggered animations on multiple elements
  intensity?: number; // 0-100 for animation intensity
}

export interface SlideTransition {
  type: TransitionType;
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  easing?: EasingType;
  sound?: boolean;
}

// Animation Categories
const ANIMATION_CATEGORIES = {
  entrance: {
    label: { en: 'Entrance', ar: 'دخول' },
    icon: ArrowRight,
    animations: [
      { value: 'fade', label: { en: 'Fade In', ar: 'تلاشي' }, icon: Sparkles },
      { value: 'fade-up', label: { en: 'Fade Up', ar: 'تلاشي للأعلى' }, icon: ArrowUp },
      { value: 'fade-down', label: { en: 'Fade Down', ar: 'تلاشي للأسفل' }, icon: ArrowDown },
      { value: 'fade-left', label: { en: 'Fade Left', ar: 'تلاشي لليسار' }, icon: ArrowLeft },
      { value: 'fade-right', label: { en: 'Fade Right', ar: 'تلاشي لليمين' }, icon: ArrowRight },
      { value: 'slide-left', label: { en: 'Slide Left', ar: 'انزلاق يسار' }, icon: ArrowLeft },
      { value: 'slide-right', label: { en: 'Slide Right', ar: 'انزلاق يمين' }, icon: ArrowRight },
      { value: 'slide-up', label: { en: 'Slide Up', ar: 'انزلاق أعلى' }, icon: ArrowUp },
      { value: 'slide-down', label: { en: 'Slide Down', ar: 'انزلاق أسفل' }, icon: ArrowDown },
      { value: 'zoom-in', label: { en: 'Zoom In', ar: 'تكبير' }, icon: ZoomIn },
      { value: 'zoom-out', label: { en: 'Zoom Out', ar: 'تصغير' }, icon: ZoomOut },
      { value: 'zoom-in-up', label: { en: 'Zoom In Up', ar: 'تكبير للأعلى' }, icon: Maximize2 },
      { value: 'zoom-in-down', label: { en: 'Zoom In Down', ar: 'تكبير للأسفل' }, icon: Minimize2 },
      { value: 'flip-x', label: { en: 'Flip X', ar: 'قلب أفقي' }, icon: FlipHorizontal },
      { value: 'flip-y', label: { en: 'Flip Y', ar: 'قلب رأسي' }, icon: FlipVertical },
      { value: 'flip-3d', label: { en: 'Flip 3D', ar: 'قلب ثلاثي' }, icon: Move3d },
      { value: 'rotate-in', label: { en: 'Rotate In', ar: 'دوران للداخل' }, icon: RotateCcw },
      { value: 'bounce-in', label: { en: 'Bounce In', ar: 'ارتداد' }, icon: Shuffle },
      { value: 'elastic-in', label: { en: 'Elastic In', ar: 'مرن' }, icon: Zap },
    ],
  },
  attention: {
    label: { en: 'Attention', ar: 'تنبيه' },
    icon: Eye,
    animations: [
      { value: 'pulse', label: { en: 'Pulse', ar: 'نبض' }, icon: Heart },
      { value: 'shake', label: { en: 'Shake', ar: 'اهتزاز' }, icon: RefreshCw },
      { value: 'wobble', label: { en: 'Wobble', ar: 'تمايل' }, icon: Shuffle },
      { value: 'swing', label: { en: 'Swing', ar: 'تأرجح' }, icon: RefreshCw },
      { value: 'tada', label: { en: 'Tada', ar: 'تادا' }, icon: Star },
      { value: 'jello', label: { en: 'Jello', ar: 'جيلي' }, icon: Circle },
      { value: 'heartbeat', label: { en: 'Heartbeat', ar: 'نبض القلب' }, icon: Heart },
      { value: 'flash', label: { en: 'Flash', ar: 'وميض' }, icon: Zap },
      { value: 'rubber-band', label: { en: 'Rubber Band', ar: 'مطاط' }, icon: Maximize2 },
    ],
  },
  special: {
    label: { en: 'Special', ar: 'خاص' },
    icon: Wand2,
    animations: [
      { value: 'typewriter', label: { en: 'Typewriter', ar: 'آلة كاتبة' }, icon: Square },
      { value: 'blur-in', label: { en: 'Blur In', ar: 'ضبابي' }, icon: Circle },
      { value: 'glitch', label: { en: 'Glitch', ar: 'خلل' }, icon: Zap },
      { value: 'morph', label: { en: 'Morph', ar: 'تحول' }, icon: Hexagon },
      { value: 'wave', label: { en: 'Wave', ar: 'موجة' }, icon: RefreshCw },
      { value: 'float', label: { en: 'Float', ar: 'طفو' }, icon: ArrowUp },
      { value: 'glow', label: { en: 'Glow', ar: 'توهج' }, icon: Star },
    ],
  },
};

// Slide Transition Categories
const TRANSITION_CATEGORIES = {
  basic: {
    label: { en: 'Basic', ar: 'أساسي' },
    transitions: [
      { value: 'none', label: { en: 'None', ar: 'بدون' } },
      { value: 'fade', label: { en: 'Fade', ar: 'تلاشي' } },
      { value: 'dissolve', label: { en: 'Dissolve', ar: 'ذوبان' } },
    ],
  },
  slide: {
    label: { en: 'Slide', ar: 'انزلاق' },
    transitions: [
      { value: 'slide-left', label: { en: 'Slide Left', ar: 'انزلاق يسار' } },
      { value: 'slide-right', label: { en: 'Slide Right', ar: 'انزلاق يمين' } },
      { value: 'slide-up', label: { en: 'Slide Up', ar: 'انزلاق أعلى' } },
      { value: 'slide-down', label: { en: 'Slide Down', ar: 'انزلاق أسفل' } },
    ],
  },
  zoom: {
    label: { en: 'Zoom', ar: 'تكبير' },
    transitions: [
      { value: 'zoom', label: { en: 'Zoom', ar: 'تكبير' } },
      { value: 'zoom-rotate', label: { en: 'Zoom Rotate', ar: 'تكبير مع دوران' } },
    ],
  },
  flip: {
    label: { en: 'Flip', ar: 'قلب' },
    transitions: [
      { value: 'flip-x', label: { en: 'Flip Horizontal', ar: 'قلب أفقي' } },
      { value: 'flip-y', label: { en: 'Flip Vertical', ar: 'قلب رأسي' } },
      { value: 'flip-3d', label: { en: 'Flip 3D', ar: 'قلب ثلاثي' } },
    ],
  },
  cube: {
    label: { en: '3D Cube', ar: 'مكعب ثلاثي' },
    transitions: [
      { value: 'cube', label: { en: 'Cube', ar: 'مكعب' } },
      { value: 'cube-left', label: { en: 'Cube Left', ar: 'مكعب يسار' } },
      { value: 'cube-right', label: { en: 'Cube Right', ar: 'مكعب يمين' } },
    ],
  },
  creative: {
    label: { en: 'Creative', ar: 'إبداعي' },
    transitions: [
      { value: 'carousel', label: { en: 'Carousel', ar: 'دوار' } },
      { value: 'cards', label: { en: 'Cards', ar: 'بطاقات' } },
      { value: 'fold', label: { en: 'Fold', ar: 'طي' } },
      { value: 'unfold', label: { en: 'Unfold', ar: 'فتح' } },
      { value: 'curtain', label: { en: 'Curtain', ar: 'ستارة' } },
      { value: 'blinds', label: { en: 'Blinds', ar: 'ستائر' } },
    ],
  },
  wipe: {
    label: { en: 'Wipe', ar: 'مسح' },
    transitions: [
      { value: 'wipe-left', label: { en: 'Wipe Left', ar: 'مسح يسار' } },
      { value: 'wipe-right', label: { en: 'Wipe Right', ar: 'مسح يمين' } },
      { value: 'wipe-up', label: { en: 'Wipe Up', ar: 'مسح أعلى' } },
      { value: 'wipe-down', label: { en: 'Wipe Down', ar: 'مسح أسفل' } },
      { value: 'circle', label: { en: 'Circle', ar: 'دائرة' } },
      { value: 'diamond', label: { en: 'Diamond', ar: 'ماسة' } },
    ],
  },
  special: {
    label: { en: 'Special', ar: 'خاص' },
    transitions: [
      { value: 'glitch', label: { en: 'Glitch', ar: 'خلل' } },
      { value: 'morph', label: { en: 'Morph', ar: 'تحول' } },
      { value: 'pixelate', label: { en: 'Pixelate', ar: 'بكسلة' } },
    ],
  },
};

const EASINGS: { value: EasingType; label: { en: string; ar: string } }[] = [
  { value: 'linear', label: { en: 'Linear', ar: 'خطي' } },
  { value: 'ease', label: { en: 'Ease', ar: 'سلس' } },
  { value: 'ease-in', label: { en: 'Ease In', ar: 'سلس للداخل' } },
  { value: 'ease-out', label: { en: 'Ease Out', ar: 'سلس للخارج' } },
  { value: 'ease-in-out', label: { en: 'Ease In Out', ar: 'سلس للداخل والخارج' } },
  { value: 'cubic-bezier-bounce', label: { en: 'Bounce', ar: 'ارتداد' } },
  { value: 'cubic-bezier-elastic', label: { en: 'Elastic', ar: 'مرن' } },
  { value: 'cubic-bezier-smooth', label: { en: 'Smooth', ar: 'ناعم' } },
  { value: 'spring', label: { en: 'Spring', ar: 'زنبرك' } },
  { value: 'steps', label: { en: 'Steps', ar: 'خطوات' } },
];

const DEFAULT_ANIMATION: Animation = {
  type: 'none',
  duration: 0.5,
  delay: 0,
  easing: 'ease-out',
  repeat: 1,
  direction: 'normal',
  fillMode: 'both',
  playState: 'running',
  intensity: 100,
};

const DEFAULT_TRANSITION: SlideTransition = {
  type: 'fade',
  duration: 0.5,
  easing: 'ease-in-out',
};

interface AnimationControlsProps {
  elementAnimation?: Animation;
  slideTransition?: SlideTransition;
  onElementAnimationChange?: (animation: Animation) => void;
  onSlideTransitionChange?: (transition: SlideTransition) => void;
  mode: 'element' | 'slide';
}

// Animation Preview Component
const AnimationPreview = ({ animation, isPlaying, onTogglePlay }: { 
  animation: Animation; 
  isPlaying: boolean; 
  onTogglePlay: () => void;
}) => {
  const { language } = useLanguage();
  const previewRef = useRef<HTMLDivElement>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (isPlaying) {
      setKey(prev => prev + 1);
    }
  }, [isPlaying, animation]);

  const getPreviewStyle = (): React.CSSProperties => {
    if (!isPlaying || animation.type === 'none') return {};
    return getAnimationStyle(animation);
  };

  return (
    <div className="relative bg-muted/50 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-xs text-muted-foreground">
          {language === 'ar' ? 'معاينة' : 'Preview'}
        </Label>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={onTogglePlay}
        >
          {isPlaying ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
          {isPlaying 
            ? (language === 'ar' ? 'إيقاف' : 'Stop')
            : (language === 'ar' ? 'تشغيل' : 'Play')
          }
        </Button>
      </div>
      <div className="h-24 flex items-center justify-center bg-background rounded border">
        <div
          key={key}
          ref={previewRef}
          className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold"
          style={getPreviewStyle()}
        >
          Aa
        </div>
      </div>
    </div>
  );
};

export const AnimationControls = ({
  elementAnimation = DEFAULT_ANIMATION,
  slideTransition = DEFAULT_TRANSITION,
  onElementAnimationChange,
  onSlideTransitionChange,
  mode,
}: AnimationControlsProps) => {
  const { language } = useLanguage();
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('entrance');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleAnimationChange = (updates: Partial<Animation>) => {
    if (onElementAnimationChange) {
      onElementAnimationChange({ ...elementAnimation, ...updates });
    }
  };

  const handleTransitionChange = (updates: Partial<SlideTransition>) => {
    if (onSlideTransitionChange) {
      onSlideTransitionChange({ ...slideTransition, ...updates });
    }
  };

  const togglePreview = () => {
    setIsPreviewPlaying(!isPreviewPlaying);
    if (!isPreviewPlaying) {
      setTimeout(() => setIsPreviewPlaying(false), (elementAnimation.duration + elementAnimation.delay) * 1000 + 500);
    }
  };

  if (mode === 'element' && onElementAnimationChange) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {language === 'ar' ? 'تأثيرات العنصر' : 'Element Animation'}
          </Label>
          {elementAnimation.type !== 'none' && (
            <Badge variant="secondary" className="text-xs">
              {elementAnimation.type}
            </Badge>
          )}
        </div>

        {/* Animation Preview */}
        <AnimationPreview 
          animation={elementAnimation}
          isPlaying={isPreviewPlaying}
          onTogglePlay={togglePreview}
        />

        {/* Animation Categories */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid grid-cols-3 h-auto">
            {Object.entries(ANIMATION_CATEGORIES).map(([key, category]) => (
              <TabsTrigger key={key} value={key} className="text-xs py-1.5">
                <category.icon className="w-3 h-3 mr-1" />
                {language === 'ar' ? category.label.ar : category.label.en}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(ANIMATION_CATEGORIES).map(([key, category]) => (
            <TabsContent key={key} value={key} className="mt-3">
              <ScrollArea className="h-[180px]">
                <div className="grid grid-cols-3 gap-1.5 pr-3">
                  <Button
                    variant={elementAnimation.type === 'none' ? 'default' : 'outline'}
                    size="sm"
                    className="h-auto py-2 px-2 flex flex-col gap-1"
                    onClick={() => handleAnimationChange({ type: 'none' })}
                  >
                    <span className="text-[10px]">{language === 'ar' ? 'بدون' : 'None'}</span>
                  </Button>
                  {category.animations.map((anim) => (
                    <Button
                      key={anim.value}
                      variant={elementAnimation.type === anim.value ? 'default' : 'outline'}
                      size="sm"
                      className="h-auto py-2 px-1 flex flex-col gap-1"
                      onClick={() => handleAnimationChange({ type: anim.value as AnimationType })}
                    >
                      <anim.icon className="w-3.5 h-3.5" />
                      <span className="text-[8px] leading-tight text-center break-words">
                        {language === 'ar' ? anim.label.ar : anim.label.en}
                      </span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        {elementAnimation.type !== 'none' && (
          <>
            {/* Duration */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">{language === 'ar' ? 'المدة' : 'Duration'}</Label>
                <span className="text-xs text-muted-foreground">{elementAnimation.duration}s</span>
              </div>
              <Slider
                value={[elementAnimation.duration]}
                onValueChange={([value]) => handleAnimationChange({ duration: value })}
                min={0.1}
                max={3}
                step={0.1}
              />
            </div>

            {/* Delay */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">{language === 'ar' ? 'التأخير' : 'Delay'}</Label>
                <span className="text-xs text-muted-foreground">{elementAnimation.delay}s</span>
              </div>
              <Slider
                value={[elementAnimation.delay]}
                onValueChange={([value]) => handleAnimationChange({ delay: value })}
                min={0}
                max={5}
                step={0.1}
              />
            </div>

            {/* Easing */}
            <div className="space-y-2">
              <Label className="text-xs">{language === 'ar' ? 'نوع الحركة' : 'Easing'}</Label>
              <Select 
                value={elementAnimation.easing}
                onValueChange={(value) => handleAnimationChange({ easing: value as EasingType })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EASINGS.map((easing) => (
                    <SelectItem key={easing.value} value={easing.value} className="text-xs">
                      {language === 'ar' ? easing.label.ar : easing.label.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Options Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span className="flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                {language === 'ar' ? 'خيارات متقدمة' : 'Advanced Options'}
              </span>
              <ArrowDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
            </Button>

            {showAdvanced && (
              <div className="space-y-3 pt-2 border-t">
                {/* Repeat */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">{language === 'ar' ? 'التكرار' : 'Repeat'}</Label>
                    <span className="text-xs text-muted-foreground">
                      {elementAnimation.repeat === -1 ? '∞' : elementAnimation.repeat}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Slider
                      value={[elementAnimation.repeat === -1 ? 10 : (elementAnimation.repeat || 1)]}
                      onValueChange={([value]) => handleAnimationChange({ repeat: value })}
                      min={1}
                      max={10}
                      step={1}
                      className="flex-1"
                    />
                    <Button
                      variant={elementAnimation.repeat === -1 ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleAnimationChange({ repeat: elementAnimation.repeat === -1 ? 1 : -1 })}
                    >
                      ∞
                    </Button>
                  </div>
                </div>

                {/* Direction */}
                <div className="space-y-2">
                  <Label className="text-xs">{language === 'ar' ? 'الاتجاه' : 'Direction'}</Label>
                  <Select 
                    value={elementAnimation.direction}
                    onValueChange={(value) => handleAnimationChange({ direction: value as Animation['direction'] })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal" className="text-xs">
                        {language === 'ar' ? 'عادي' : 'Normal'}
                      </SelectItem>
                      <SelectItem value="reverse" className="text-xs">
                        {language === 'ar' ? 'عكسي' : 'Reverse'}
                      </SelectItem>
                      <SelectItem value="alternate" className="text-xs">
                        {language === 'ar' ? 'متناوب' : 'Alternate'}
                      </SelectItem>
                      <SelectItem value="alternate-reverse" className="text-xs">
                        {language === 'ar' ? 'متناوب عكسي' : 'Alternate Reverse'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Intensity */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">{language === 'ar' ? 'الشدة' : 'Intensity'}</Label>
                    <span className="text-xs text-muted-foreground">{elementAnimation.intensity}%</span>
                  </div>
                  <Slider
                    value={[elementAnimation.intensity || 100]}
                    onValueChange={([value]) => handleAnimationChange({ intensity: value })}
                    min={10}
                    max={200}
                    step={10}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Slide Transition Mode
  if (mode === 'slide' && onSlideTransitionChange) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Layers className="w-4 h-4" />
            {language === 'ar' ? 'انتقال الشريحة' : 'Slide Transition'}
          </Label>
          {slideTransition.type !== 'none' && (
            <Badge variant="secondary" className="text-xs">
              {slideTransition.type}
            </Badge>
          )}
        </div>

        {/* Transition Categories */}
        <ScrollArea className="h-[280px]">
          <div className="space-y-4 pr-3">
            {Object.entries(TRANSITION_CATEGORIES).map(([key, category]) => (
              <div key={key} className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {language === 'ar' ? category.label.ar : category.label.en}
                </Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {category.transitions.map((trans) => (
                    <Button
                      key={trans.value}
                      variant={slideTransition.type === trans.value ? 'default' : 'outline'}
                      size="sm"
                      className="h-auto py-2 px-1 text-[8px] leading-tight break-words"
                      onClick={() => handleTransitionChange({ type: trans.value as TransitionType })}
                    >
                      {language === 'ar' ? trans.label.ar : trans.label.en}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {slideTransition.type !== 'none' && (
          <>
            {/* Duration */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">{language === 'ar' ? 'المدة' : 'Duration'}</Label>
                <span className="text-xs text-muted-foreground">{slideTransition.duration}s</span>
              </div>
              <Slider
                value={[slideTransition.duration]}
                onValueChange={([value]) => handleTransitionChange({ duration: value })}
                min={0.2}
                max={3}
                step={0.1}
              />
            </div>

            {/* Easing */}
            <div className="space-y-2">
              <Label className="text-xs">{language === 'ar' ? 'نوع الحركة' : 'Easing'}</Label>
              <Select 
                value={slideTransition.easing || 'ease-in-out'}
                onValueChange={(value) => handleTransitionChange({ easing: value as EasingType })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EASINGS.slice(0, 5).map((easing) => (
                    <SelectItem key={easing.value} value={easing.value} className="text-xs">
                      {language === 'ar' ? easing.label.ar : easing.label.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Apply to All Slides */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Label className="text-xs">
                {language === 'ar' ? 'تطبيق على كل الشرائح' : 'Apply to all slides'}
              </Label>
              <Switch />
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
};

// Helper function to get easing CSS value
const getEasingValue = (easing: EasingType): string => {
  const easingMap: Record<EasingType, string> = {
    'linear': 'linear',
    'ease': 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
    'cubic-bezier-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    'cubic-bezier-elastic': 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
    'cubic-bezier-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    'steps': 'steps(10)',
  };
  return easingMap[easing] || 'ease';
};

// Get animation keyframe name
const getKeyframeName = (type: AnimationType): string => {
  const keyframeMap: Record<AnimationType, string> = {
    'none': '',
    'fade': 'kiro-fade-in',
    'fade-up': 'kiro-fade-in-up',
    'fade-down': 'kiro-fade-in-down',
    'fade-left': 'kiro-fade-in-left',
    'fade-right': 'kiro-fade-in-right',
    'slide-left': 'kiro-slide-in-left',
    'slide-right': 'kiro-slide-in-right',
    'slide-up': 'kiro-slide-in-up',
    'slide-down': 'kiro-slide-in-down',
    'zoom-in': 'kiro-zoom-in',
    'zoom-out': 'kiro-zoom-out',
    'zoom-in-up': 'kiro-zoom-in-up',
    'zoom-in-down': 'kiro-zoom-in-down',
    'flip-x': 'kiro-flip-x',
    'flip-y': 'kiro-flip-y',
    'flip-3d': 'kiro-flip-3d',
    'rotate': 'kiro-rotate',
    'rotate-in': 'kiro-rotate-in',
    'rotate-out': 'kiro-rotate-out',
    'bounce': 'kiro-bounce',
    'bounce-in': 'kiro-bounce-in',
    'bounce-left': 'kiro-bounce-in-left',
    'bounce-right': 'kiro-bounce-in-right',
    'elastic': 'kiro-elastic',
    'elastic-in': 'kiro-elastic-in',
    'elastic-out': 'kiro-elastic-out',
    'pulse': 'kiro-pulse',
    'shake': 'kiro-shake',
    'wobble': 'kiro-wobble',
    'swing': 'kiro-swing',
    'tada': 'kiro-tada',
    'jello': 'kiro-jello',
    'heartbeat': 'kiro-heartbeat',
    'flash': 'kiro-flash',
    'rubber-band': 'kiro-rubber-band',
    'typewriter': 'kiro-typewriter',
    'blur-in': 'kiro-blur-in',
    'glitch': 'kiro-glitch',
    'morph': 'kiro-morph',
    'wave': 'kiro-wave',
    'float': 'kiro-float',
    'glow': 'kiro-glow',
  };
  return keyframeMap[type] || '';
};

// Export animation style generator
export const getAnimationStyle = (animation: Animation): React.CSSProperties => {
  if (animation.type === 'none') return {};

  const keyframeName = getKeyframeName(animation.type);
  const easingValue = getEasingValue(animation.easing);
  const repeatValue = animation.repeat === -1 ? 'infinite' : animation.repeat || 1;

  return {
    animation: `${keyframeName} ${animation.duration}s ${easingValue} ${animation.delay}s ${repeatValue} ${animation.direction || 'normal'} ${animation.fillMode || 'both'}`,
    animationPlayState: animation.playState || 'running',
  };
};

// Get transition out style for slide
export const getTransitionOutStyle = (transition: SlideTransition): React.CSSProperties => {
  if (transition.type === 'none') return {};
  
  const styles: Record<TransitionType, React.CSSProperties> = {
    'none': {},
    'fade': { opacity: 0 },
    'dissolve': { opacity: 0, filter: 'blur(10px)' },
    'slide-left': { transform: 'translateX(-100%)' },
    'slide-right': { transform: 'translateX(100%)' },
    'slide-up': { transform: 'translateY(-100%)' },
    'slide-down': { transform: 'translateY(100%)' },
    'zoom': { transform: 'scale(0.5)', opacity: 0 },
    'zoom-rotate': { transform: 'scale(0.5) rotate(-180deg)', opacity: 0 },
    'flip-x': { transform: 'rotateY(90deg)', opacity: 0 },
    'flip-y': { transform: 'rotateX(90deg)', opacity: 0 },
    'flip-3d': { transform: 'rotateY(90deg) rotateX(45deg)', opacity: 0 },
    'cube': { transform: 'translateZ(-200px) rotateY(-90deg)' },
    'cube-left': { transform: 'translateZ(-200px) rotateY(90deg)' },
    'cube-right': { transform: 'translateZ(-200px) rotateY(-90deg)' },
    'carousel': { transform: 'translateX(-50%) scale(0.8)', opacity: 0 },
    'cards': { transform: 'translateX(-100%) rotate(-10deg)', opacity: 0 },
    'fold': { transform: 'rotateX(-90deg)', transformOrigin: 'top center' },
    'unfold': { transform: 'rotateX(90deg)', transformOrigin: 'bottom center' },
    'glitch': { filter: 'hue-rotate(90deg) saturate(200%)', transform: 'skewX(10deg)' },
    'morph': { borderRadius: '50%', transform: 'scale(0.5)', opacity: 0 },
    'wipe-left': { clipPath: 'inset(0 100% 0 0)' },
    'wipe-right': { clipPath: 'inset(0 0 0 100%)' },
    'wipe-up': { clipPath: 'inset(100% 0 0 0)' },
    'wipe-down': { clipPath: 'inset(0 0 100% 0)' },
    'circle': { clipPath: 'circle(0% at 50% 50%)' },
    'diamond': { clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)' },
    'curtain': { transform: 'scaleX(0)' },
    'blinds': { transform: 'scaleY(0)' },
    'pixelate': { filter: 'blur(20px)', opacity: 0 },
  };

  return styles[transition.type] || {};
};

// Get transition in style for slide
export const getTransitionInStyle = (transition: SlideTransition): React.CSSProperties => {
  if (transition.type === 'none') return {};
  
  return {
    opacity: 1,
    transform: 'none',
    filter: 'none',
    clipPath: 'none',
  };
};

export default AnimationControls;
