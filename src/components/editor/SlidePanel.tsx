import { useState, memo, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Trash2, Copy, ChevronUp, ChevronDown, Sparkles, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SlideTemplate, SlideElement } from '@/data/templates';
import { SlideTransition, TransitionType } from './AnimationControls';
import { LayersPanel } from './LayersPanel';
import { cn } from '@/lib/utils';

// Debounced thumbnail - updates 500ms after last change to prevent hanging
const SlideThumbnail = memo(({ slide }: { slide: SlideTemplate }) => {
  const [debouncedSlide, setDebouncedSlide] = useState(slide);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSlide(slide);
    }, 500);
    return () => clearTimeout(timer);
  }, [slide]);
  
  const hasElements = debouncedSlide.elements && debouncedSlide.elements.length > 0;
  
  return (
    <div 
      className="absolute inset-0"
      style={{
        transform: 'scale(0.1875)',
        transformOrigin: 'top left',
        width: '960px',
        height: '540px',
      }}
    >
      {hasElements ? (
        debouncedSlide.elements!.map((element) => (
          <div
            key={element.id}
            className="absolute"
            style={{
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              opacity: element.opacity ?? 1,
            }}
          >
            {element.type === 'text' && (
              <div
                style={{
                  fontSize: element.fontSize,
                  fontWeight: element.fontWeight,
                  color: element.color,
                  textAlign: element.textAlign,
                  fontFamily: element.fontFamily,
                  width: '100%',
                  height: '100%',
                }}
              >
                {element.content}
              </div>
            )}
            {element.type === 'image' && element.imageUrl && (
              <img
                src={element.imageUrl}
                alt=""
                className="w-full h-full"
                style={{
                  objectFit: element.objectFit || 'cover',
                  borderRadius: element.borderRadius,
                }}
              />
            )}
            {element.type === 'shape' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: element.backgroundColor,
                  borderRadius: element.shapeType === 'circle' ? '50%' : element.borderRadius,
                }}
              />
            )}
            {element.type === 'icon' && element.iconConfig && (
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{ color: element.iconConfig.color }}
              >
                <span style={{ fontSize: element.iconConfig.size }}>●</span>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-16 text-center">
          <h3 
            className="font-bold"
            style={{ 
              fontSize: '48px',
              color: debouncedSlide.textColor,
            }}
          >
            {debouncedSlide.title}
          </h3>
          {debouncedSlide.subtitle && (
            <p 
              className="opacity-70 mt-4"
              style={{ 
                fontSize: '24px',
                color: debouncedSlide.textColor,
              }}
            >
              {debouncedSlide.subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

interface SlidePanelProps {
  slides: SlideTemplate[];
  activeSlideIndex: number;
  onSlideSelect: (index: number) => void;
  onAddSlide: () => void;
  onDeleteSlide: (index: number) => void;
  onDuplicateSlide?: (index: number) => void;
  onMoveSlide?: (fromIndex: number, toIndex: number) => void;
  slideTransitions?: Record<string, SlideTransition>;
  onTransitionChange?: (slideId: string, transition: SlideTransition) => void;
  // Layers props
  activeSlide?: SlideTemplate;
  selectedElementId?: string | null;
  onSelectElement?: (id: string | null) => void;
  onUpdateElement?: (id: string, updates: Partial<SlideElement>) => void;
  onDeleteElement?: (id: string) => void;
  onDuplicateElement?: (id: string) => void;
  onReorderElements?: (elements: SlideElement[]) => void;
}

const QUICK_TRANSITIONS: { value: TransitionType; label: { en: string; ar: string }; icon: string }[] = [
  { value: 'none', label: { en: 'None', ar: 'بدون' }, icon: '○' },
  { value: 'fade', label: { en: 'Fade', ar: 'تلاشي' }, icon: '◐' },
  { value: 'dissolve', label: { en: 'Dissolve', ar: 'ذوبان' }, icon: '◌' },
  { value: 'slide-left', label: { en: 'Slide Left', ar: 'انزلاق يسار' }, icon: '←' },
  { value: 'slide-right', label: { en: 'Slide Right', ar: 'انزلاق يمين' }, icon: '→' },
  { value: 'slide-up', label: { en: 'Slide Up', ar: 'انزلاق أعلى' }, icon: '↑' },
  { value: 'slide-down', label: { en: 'Slide Down', ar: 'انزلاق أسفل' }, icon: '↓' },
  { value: 'zoom', label: { en: 'Zoom', ar: 'تكبير' }, icon: '⊕' },
  { value: 'zoom-rotate', label: { en: 'Zoom Rotate', ar: 'تكبير ودوران' }, icon: '⟳' },
  { value: 'flip-x', label: { en: 'Flip X', ar: 'قلب أفقي' }, icon: '↔' },
  { value: 'flip-y', label: { en: 'Flip Y', ar: 'قلب رأسي' }, icon: '↕' },
  { value: 'cube', label: { en: 'Cube', ar: 'مكعب' }, icon: '▣' },
  { value: 'cards', label: { en: 'Cards', ar: 'بطاقات' }, icon: '▤' },
  { value: 'wipe-left', label: { en: 'Wipe Left', ar: 'مسح يسار' }, icon: '◧' },
  { value: 'wipe-right', label: { en: 'Wipe Right', ar: 'مسح يمين' }, icon: '◨' },
  { value: 'circle', label: { en: 'Circle', ar: 'دائرة' }, icon: '◉' },
  { value: 'blinds', label: { en: 'Blinds', ar: 'ستائر' }, icon: '▥' },
  { value: 'glitch', label: { en: 'Glitch', ar: 'خلل' }, icon: '⚡' },
];

export const SlidePanel = ({
  slides,
  activeSlideIndex,
  onSlideSelect,
  onAddSlide,
  onDeleteSlide,
  onDuplicateSlide,
  onMoveSlide,
  slideTransitions = {},
  onTransitionChange,
  activeSlide,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onReorderElements,
}: SlidePanelProps) => {
  const { t, language } = useLanguage();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && onMoveSlide) {
      onMoveSlide(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDuplicate = (index: number) => {
    if (onDuplicateSlide) {
      onDuplicateSlide(index);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0 && onMoveSlide) {
      onMoveSlide(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < slides.length - 1 && onMoveSlide) {
      onMoveSlide(index, index + 1);
    }
  };

  const getSlideTransition = (slideId: string): SlideTransition => {
    return slideTransitions[slideId] || { type: 'fade', duration: 0.5 };
  };

  const handleQuickTransition = (slideId: string, type: TransitionType) => {
    if (onTransitionChange) {
      onTransitionChange(slideId, { type, duration: 0.5, easing: 'ease-in-out' });
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-card to-card/95 border-r border-border/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
              <Layers className="w-3 h-3 text-primary" />
            </div>
            <h3 className="font-semibold text-xs text-foreground">{t('editor.slides')}</h3>
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 rounded-full bg-primary/10 text-primary border-0">
              {slides.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {/* Layers Button */}
            {onSelectElement && onUpdateElement && onDeleteElement && onDuplicateElement && onReorderElements && (
              <LayersPanel
                elements={activeSlide?.elements || []}
                selectedElementId={selectedElementId || null}
                onSelectElement={onSelectElement}
                onUpdateElement={onUpdateElement}
                onDeleteElement={onDeleteElement}
                onDuplicateElement={onDuplicateElement}
                onReorderElements={onReorderElements}
              />
            )}
          </div>
        </div>
      </div>

      {/* Slides List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20" dir="ltr">
        {slides.map((slide, index) => {
          const transition = getSlideTransition(slide.id);
          const hasTransition = transition.type !== 'none';

          return (
            <ContextMenu key={slide.id}>
              <ContextMenuTrigger>
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-200",
                    "border-2 shadow-sm hover:shadow-md",
                    activeSlideIndex === index
                      ? "border-primary shadow-md shadow-primary/25 scale-[1.02]"
                      : "border-border/60 hover:border-primary/50",
                    dragOverIndex === index && "border-primary border-dashed",
                    draggedIndex === index && "opacity-50 scale-95"
                  )}
                  onClick={() => onSlideSelect(index)}
                >
                  {/* Slide Thumbnail - Live Preview */}
                  <div
                    className="aspect-video relative overflow-hidden rounded-[4px]"
                    style={{
                      background: slide.backgroundColor,
                    }}
                  >
                    {/* Memoized slide content to prevent re-renders on every keystroke */}
                    <SlideThumbnail slide={slide} />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />

                    {/* Transition Indicator */}
                    {hasTransition && (
                      <div className="absolute top-1.5 right-1.5 z-10">
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                              <Sparkles className="w-2.5 h-2.5 text-primary-foreground" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3" />
                              <p className="text-xs">
                                {language === 'ar' ? 'انتقال: ' : 'Transition: '}
                                {transition.type}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>

                  {/* Slide Number & Actions */}
                  <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
                    <div className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded font-semibold transition-colors shadow-sm",
                      activeSlideIndex === index 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-background/95 text-foreground border border-border/50"
                    )}>
                      {index + 1}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      {/* Quick Transition Selector */}
                      {onTransitionChange && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className="p-1 bg-background/95 rounded hover:bg-primary/20 hover:text-primary transition-colors shadow-sm border border-border/50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-52 p-2 rounded-lg max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20" align="start" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-muted-foreground mb-2 sticky top-0 bg-popover pb-1">
                                {language === 'ar' ? 'انتقال سريع' : 'Quick Transition'}
                              </p>
                              {QUICK_TRANSITIONS.map((trans) => (
                                <button
                                  key={trans.value}
                                  className={cn(
                                    "w-full flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-primary/10 hover:text-primary transition-colors",
                                    transition.type === trans.value && "bg-primary/10 text-primary font-medium"
                                  )}
                                  onClick={() => handleQuickTransition(slide.id, trans.value)}
                                >
                                  <span className="w-4 text-center">{trans.icon}</span>
                                  <span>{language === 'ar' ? trans.label.ar : trans.label.en}</span>
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}

                      {/* Delete Button */}
                      {slides.length > 1 && (
                        <button
                          className="p-1 bg-destructive/90 text-destructive-foreground rounded hover:bg-destructive transition-colors shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSlide(index);
                          }}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </ContextMenuTrigger>

              <ContextMenuContent className="rounded-lg">
                <ContextMenuItem onClick={() => onSlideSelect(index)} className="rounded-lg">
                  {language === 'ar' ? 'تحديد' : 'Select'}
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleDuplicate(index)} className="rounded-lg">
                  <Copy className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'تكرار' : 'Duplicate'}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => handleMoveUp(index)} disabled={index === 0} className="rounded-lg">
                  <ChevronUp className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'نقل للأعلى' : 'Move Up'}
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleMoveDown(index)} disabled={index === slides.length - 1} className="rounded-lg">
                  <ChevronDown className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'نقل للأسفل' : 'Move Down'}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem 
                  onClick={() => onDeleteSlide(index)} 
                  disabled={slides.length <= 1}
                  className="text-destructive rounded-lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'حذف' : 'Delete'}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>

      {/* Add Slide Button */}
      <div className="p-3 border-t border-border/50">
        <Button onClick={onAddSlide} className="w-full h-9 text-xs rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 hover:from-primary/20 hover:to-purple-500/20 text-foreground border border-primary/20" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          {t('editor.addSlide')}
        </Button>
      </div>
    </div>
  );
};

export default SlidePanel;
