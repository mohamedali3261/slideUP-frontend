import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SlideElement, SlideTemplate } from '@/data/templates';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Sparkles,
  Play,
  Pause,
  Layers,
  Wand2,
  Clock,
  Zap,
  RotateCcw,
  Copy,
  Trash2,
} from 'lucide-react';
import { 
  AnimationControls, 
  Animation, 
  SlideTransition,
  getAnimationStyle,
} from './AnimationControls';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AnimationTabProps {
  slide: SlideTemplate;
  selectedElement: SlideElement | null;
  elements: SlideElement[];
  onUpdateElement: (updates: Partial<SlideElement>) => void;
  onUpdateElementById: (id: string, updates: Partial<SlideElement>) => void;
  slideTransition?: SlideTransition;
  onSlideTransitionChange?: (transition: SlideTransition) => void;
}

const DEFAULT_ANIMATION: Animation = {
  type: 'none',
  duration: 0.5,
  delay: 0,
  easing: 'ease-out',
  repeat: 1,
  direction: 'normal',
  fillMode: 'both',
  intensity: 100,
};

export const AnimationTab = ({
  slide,
  selectedElement,
  elements,
  onUpdateElement,
  onUpdateElementById,
  slideTransition,
  onSlideTransitionChange,
}: AnimationTabProps) => {
  const { language } = useLanguage();
  const [previewingElementId, setPreviewingElementId] = useState<string | null>(null);

  // Get the next animation order number
  const getNextAnimationOrder = (): number => {
    const animatedElements = elements.filter(el => el.animation && el.animation.type !== 'none');
    if (animatedElements.length === 0) return 0;
    const maxOrder = Math.max(...animatedElements.map(el => (el as any).animationOrder ?? 0));
    return maxOrder + 1;
  };

  const handleAnimationChange = (animation: Animation) => {
    if (selectedElement) {
      const updates: any = { animation };
      
      // Set animationOrder when adding animation for the first time
      if (animation.type !== 'none') {
        const currentOrder = (selectedElement as any).animationOrder;
        if (currentOrder === undefined) {
          updates.animationOrder = getNextAnimationOrder();
        }
        // Auto-play preview when animation changes
        triggerLivePreview(selectedElement.id, animation);
      } else {
        // Remove animationOrder when removing animation
        updates.animationOrder = undefined;
      }
      
      onUpdateElement(updates);
    }
  };

  // Live preview - triggers animation on the actual element
  const triggerLivePreview = (elementId: string, animation?: Animation) => {
    const el = document.querySelector(`[data-element-id="${elementId}"]`) as HTMLElement;
    if (el) {
      // Remove any existing animation
      el.style.animation = 'none';
      el.offsetHeight; // Trigger reflow
      
      const anim = animation || selectedElement?.animation;
      if (anim && anim.type !== 'none') {
        const duration = anim.duration || 0.5;
        const easing = getEasingValue(anim.easing || 'ease-out');
        
        // Map animation type to keyframe name
        const keyframeName = getKeyframeName(anim.type);
        if (keyframeName) {
          el.style.animation = `${keyframeName} ${duration}s ${easing}`;
          
          // Clear animation after it completes
          setTimeout(() => {
            el.style.animation = '';
          }, duration * 1000 + 100);
        }
      }
    }
  };

  // Get keyframe name from animation type
  const getKeyframeName = (type: string): string => {
    const map: Record<string, string> = {
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
      'wipe-up': 'kiro-wipe-up',
      'wipe-down': 'kiro-wipe-down',
      'wipe-left': 'kiro-wipe-left',
      'wipe-right': 'kiro-wipe-right',
      'split-vertical': 'kiro-split-vertical',
      'split-horizontal': 'kiro-split-horizontal',
      'wheel': 'kiro-wheel',
      'random-bars': 'kiro-random-bars',
      'grow-turn': 'kiro-grow-turn',
      'swivel': 'kiro-swivel',
      'rise-up': 'kiro-rise-up',
      'spiral-in': 'kiro-spiral-in',
      'spin': 'kiro-spin',
      'teeter': 'kiro-teeter',
      'grow-shrink': 'kiro-grow-shrink',
      'color-pulse': 'kiro-color-pulse',
      'desaturate': 'kiro-desaturate',
      'darken': 'kiro-darken',
      'lighten': 'kiro-lighten',
      'transparency': 'kiro-transparency',
      'underline': 'kiro-underline',
      'bold-reveal': 'kiro-bold-reveal',
      'fade-out': 'kiro-fade-out',
      'fly-out-up': 'kiro-fly-out-up',
      'fly-out-down': 'kiro-fly-out-down',
      'fly-out-left': 'kiro-fly-out-left',
      'fly-out-right': 'kiro-fly-out-right',
      'zoom-out-exit': 'kiro-zoom-out-exit',
      'bounce-out': 'kiro-bounce-out',
      'wipe-out-left': 'kiro-wipe-out-left',
      'wipe-out-right': 'kiro-wipe-out-right',
      'shrink-out': 'kiro-shrink-out',
      'swivel-out': 'kiro-swivel-out',
      'spin-out': 'kiro-spin-out',
      'rise-out': 'kiro-rise-out',
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
    return map[type] || '';
  };

  // Get CSS easing value
  const getEasingValue = (easing: string): string => {
    const map: Record<string, string> = {
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
    return map[easing] || 'ease';
  };

  const handlePreviewAnimation = (elementId: string) => {
    setPreviewingElementId(elementId);
    triggerLivePreview(elementId);
    setTimeout(() => setPreviewingElementId(null), 2000);
  };

  const handleCopyAnimation = (animation: Animation) => {
    navigator.clipboard.writeText(JSON.stringify(animation));
    toast.success(language === 'ar' ? 'تم نسخ التأثير' : 'Animation copied');
  };

  const handlePasteAnimation = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const animation = JSON.parse(text) as Animation;
      if (animation.type && selectedElement) {
        onUpdateElement({ animation });
        toast.success(language === 'ar' ? 'تم لصق التأثير' : 'Animation pasted');
      }
    } catch {
      toast.error(language === 'ar' ? 'فشل لصق التأثير' : 'Failed to paste animation');
    }
  };

  const handleRemoveAnimation = () => {
    if (selectedElement) {
      onUpdateElement({ animation: { ...DEFAULT_ANIMATION, type: 'none' } });
      toast.success(language === 'ar' ? 'تم إزالة التأثير' : 'Animation removed');
    }
  };

  const handleApplyToAll = () => {
    if (selectedElement?.animation) {
      elements.forEach(el => {
        if (el.id !== selectedElement.id) {
          onUpdateElementById(el.id, { animation: selectedElement.animation });
        }
      });
      toast.success(language === 'ar' ? 'تم تطبيق التأثير على كل العناصر' : 'Animation applied to all elements');
    }
  };

  const animatedElementsCount = elements.filter(el => el.animation && el.animation.type !== 'none').length;

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold">
            {language === 'ar' ? 'التأثيرات الحركية' : 'Animations'}
          </span>
        </div>
        <Badge className="bg-primary/20 text-primary border-0 px-3 py-1 text-xs font-semibold">
          {animatedElementsCount} / {elements.length}
        </Badge>
      </div>

      <Accordion type="single" collapsible defaultValue="element" className="w-full space-y-2">
        {/* Element Animation Section */}
        <AccordionItem value="element" className="border rounded-xl bg-muted/30 px-3">
          <AccordionTrigger className="text-sm hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-primary" />
              <span className="font-semibold text-xs sm:text-sm">{language === 'ar' ? 'تأثير العنصر' : 'Element Animation'}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="overflow-hidden">
            {selectedElement ? (
              <div className="space-y-4 pt-2 pb-3">
                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs rounded-lg h-8 hover:bg-primary/10 hover:border-primary/30"
                    onClick={() => handlePreviewAnimation(selectedElement.id)}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    {language === 'ar' ? 'معاينة' : 'Preview'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-lg h-8 hover:bg-primary/10 hover:border-primary/30"
                    onClick={() => selectedElement.animation && handleCopyAnimation(selectedElement.animation as Animation)}
                    disabled={!selectedElement.animation || selectedElement.animation.type === 'none'}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-lg h-8 hover:bg-primary/10 hover:border-primary/30"
                    onClick={handlePasteAnimation}
                  >
                    <Zap className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-lg h-8 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"
                    onClick={handleRemoveAnimation}
                    disabled={!selectedElement.animation || selectedElement.animation.type === 'none'}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {/* Animation Controls */}
                <AnimationControls
                  mode="element"
                  elementAnimation={(selectedElement.animation || DEFAULT_ANIMATION) as Animation}
                  onElementAnimationChange={handleAnimationChange}
                />

                {/* Apply to All */}
                {selectedElement.animation && selectedElement.animation.type !== 'none' && elements.length > 1 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs rounded-lg h-8 bg-primary/10 hover:bg-primary/20 text-primary border-0"
                    onClick={handleApplyToAll}
                  >
                    <Layers className="w-3 h-3 mr-2" />
                    {language === 'ar' ? 'تطبيق على كل العناصر' : 'Apply to All Elements'}
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground pb-3">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted/50 flex items-center justify-center">
                  <Wand2 className="w-6 h-6 opacity-50" />
                </div>
                <p className="text-sm">
                  {language === 'ar' 
                    ? 'اختر عنصراً لإضافة تأثير حركي'
                    : 'Select an element to add animation'}
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Slide Transition Section */}
        <AccordionItem value="transition" className="border rounded-xl bg-muted/30 px-3">
          <AccordionTrigger className="text-sm hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span className="font-semibold text-xs sm:text-sm">{language === 'ar' ? 'انتقال الشريحة' : 'Slide Transition'}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="overflow-hidden">
            <div className="pt-2 pb-3">
              <AnimationControls
                mode="slide"
                slideTransition={slideTransition || { type: 'fade', duration: 0.5 }}
                onSlideTransitionChange={onSlideTransitionChange}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Animation Timeline */}
        <AccordionItem value="timeline" className="border rounded-xl bg-muted/30 px-3 overflow-hidden">
          <AccordionTrigger className="text-sm hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-semibold text-xs sm:text-sm">{language === 'ar' ? 'ترتيب التأثيرات' : 'Animation Order'}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="overflow-hidden">
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-3 pb-3">
                {elements.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {language === 'ar' ? 'لا توجد عناصر' : 'No elements'}
                  </p>
                ) : (
                  elements
                    .filter(el => el.animation && el.animation.type !== 'none')
                    .sort((a, b) => (a.animation?.delay || 0) - (b.animation?.delay || 0))
                    .map((element, index) => (
                      <div
                        key={element.id}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200",
                          selectedElement?.id === element.id 
                            ? "border-primary bg-primary/10 shadow-md" 
                            : "border-border/50 hover:bg-accent hover:border-primary/30"
                        )}
                      >
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {element.type === 'text' ? element.content?.slice(0, 20) : element.type}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {element.animation?.type} • {element.animation?.delay}s delay
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg hover:bg-primary/10"
                          onClick={() => handlePreviewAnimation(element.id)}
                        >
                          <Play className="w-3 h-3 text-primary" />
                        </Button>
                      </div>
                    ))
                )}

                {elements.filter(el => !el.animation || el.animation.type === 'none').length > 0 && (
                  <>
                    <Separator className="my-3" />
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      {language === 'ar' ? 'بدون تأثير' : 'No Animation'}
                    </p>
                    {elements
                      .filter(el => !el.animation || el.animation.type === 'none')
                      .map((element) => (
                        <div
                          key={element.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl border border-dashed border-border/50 opacity-60 hover:opacity-80 transition-opacity"
                        >
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            -
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs truncate">
                              {element.type === 'text' ? element.content?.slice(0, 20) : element.type}
                            </p>
                          </div>
                        </div>
                      ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Quick Presets */}
      <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
        <div className="text-xs font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-primary" />
          {language === 'ar' ? 'إعدادات سريعة' : 'Quick Presets'}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs rounded-lg h-8 hover:bg-primary/10 hover:border-primary/30"
            onClick={() => {
              elements.forEach((el, index) => {
                onUpdateElementById(el.id, {
                  animation: {
                    type: 'fade-up',
                    duration: 0.5,
                    delay: index * 0.1,
                    easing: 'ease-out',
                    repeat: 1,
                    direction: 'normal',
                    fillMode: 'both',
                    intensity: 100,
                  }
                });
              });
              toast.success(language === 'ar' ? 'تم تطبيق التأثير المتتابع' : 'Stagger effect applied');
            }}
          >
            {language === 'ar' ? 'تأثير متتابع' : 'Stagger'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs rounded-lg h-8 hover:bg-primary/10 hover:border-primary/30"
            onClick={() => {
              elements.forEach(el => {
                onUpdateElementById(el.id, {
                  animation: {
                    type: 'zoom-in',
                    duration: 0.6,
                    delay: 0,
                    easing: 'cubic-bezier-bounce',
                    repeat: 1,
                    direction: 'normal',
                    fillMode: 'both',
                    intensity: 100,
                  }
                });
              });
              toast.success(language === 'ar' ? 'تم تطبيق تأثير الارتداد' : 'Bounce effect applied');
            }}
          >
            {language === 'ar' ? 'ارتداد' : 'Bounce All'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs rounded-lg h-8 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"
            onClick={() => {
              elements.forEach(el => {
                onUpdateElementById(el.id, { animation: { ...DEFAULT_ANIMATION, type: 'none' } });
              });
              toast.success(language === 'ar' ? 'تم إزالة كل التأثيرات' : 'All animations removed');
            }}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            {language === 'ar' ? 'إزالة الكل' : 'Clear All'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs rounded-lg h-8 hover:bg-primary/10 hover:border-primary/30"
            onClick={() => {
              elements.forEach((el, index) => {
                const animations = ['fade', 'slide-left', 'zoom-in', 'flip-x', 'bounce-in'];
                onUpdateElementById(el.id, {
                  animation: {
                    type: animations[index % animations.length] as any,
                    duration: 0.5,
                    delay: index * 0.15,
                    easing: 'ease-out',
                    repeat: 1,
                    direction: 'normal',
                    fillMode: 'both',
                    intensity: 100,
                  }
                });
              });
              toast.success(language === 'ar' ? 'تم تطبيق تأثيرات متنوعة' : 'Mixed effects applied');
            }}
          >
            {language === 'ar' ? 'تأثيرات متنوعة' : 'Mix Effects'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnimationTab;
