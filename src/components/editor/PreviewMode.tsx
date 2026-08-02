import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  X,
  StickyNote,
  Monitor,
  Maximize,
  Play,
  Pause,
} from 'lucide-react';
import { SlideTemplate, SlideElement } from '@/data/templates';
import { SlideNotes } from './SpeakerNotes';
import { getAnimationStyle, Animation, SlideTransition, getTransitionOutStyle, getTransitionInStyle } from './AnimationControls';
import { IconRenderer } from './IconRenderer';
import { TableEditor } from './TableEditor';
import { CodeBlock } from './CodeBlock';

interface PreviewModeProps {
  isOpen: boolean;
  onClose: () => void;
  slides: SlideTemplate[];
  currentSlideIndex: number;
  onSlideChange: (index: number) => void;
  notes: SlideNotes;
  slideTransitions?: Record<string, SlideTransition>;
  onStartPresentation: () => void;
}

export const PreviewMode = ({
  isOpen,
  onClose,
  slides,
  currentSlideIndex,
  onSlideChange,
  notes,
  slideTransitions = {},
  onStartPresentation,
}: PreviewModeProps) => {
  const { language } = useLanguage();
  const [showNotes, setShowNotes] = useState(false);
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000); // 1 second per element
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 450 });
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Slide transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward');

  const currentSlide = slides[currentSlideIndex];
  const nextSlide = slides[currentSlideIndex + 1];
  const currentNotes = notes[currentSlide?.id]?.content || '';
  const progress = ((currentSlideIndex + 1) / slides.length) * 100;

  // Calculate container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    
    // Also update when dialog opens
    const timer = setTimeout(updateSize, 100);
    
    return () => {
      window.removeEventListener('resize', updateSize);
      clearTimeout(timer);
    };
  }, [isOpen]);

  // Get all elements sorted by zIndex or position
  const getAllElements = (slide: SlideTemplate) => {
    if (!slide?.elements) return [];
    
    // Sort elements by zIndex, then by y position, then by x position
    return [...slide.elements].sort((a, b) => {
      const zIndexA = a.zIndex ?? 0;
      const zIndexB = b.zIndex ?? 0;
      if (zIndexA !== zIndexB) return zIndexA - zIndexB;
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
  };

  const allElements = getAllElements(currentSlide);

  // Reset when slide changes - show only background, no elements
  useEffect(() => {
    setVisibleElements(new Set());
    setCurrentAnimationIndex(0);
    // Reset transition after slide change
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentSlideIndex, currentSlide]);

  // Stop playing when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }
  }, [isOpen]);

  // Auto-play logic
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentAnimationIndex(prev => {
          if (prev < allElements.length) {
            const element = allElements[prev];
            setVisibleElements(prevVisible => new Set([...prevVisible, element.id]));
            return prev + 1;
          } else if (currentSlideIndex < slides.length - 1) {
            // Move to next slide
            onSlideChange(currentSlideIndex + 1);
            return 0;
          } else {
            // End of presentation
            setIsPlaying(false);
            return prev;
          }
        });
      }, playSpeed);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [isPlaying, playSpeed, allElements, currentSlideIndex, slides.length, onSlideChange]);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handlePrevSlide = useCallback(() => {
    setIsPlaying(false); // Stop auto-play when manually navigating
    // If some elements are visible, hide the last one
    if (currentAnimationIndex > 0) {
      setCurrentAnimationIndex(prev => prev - 1);
      const newVisible = new Set(allElements.slice(0, currentAnimationIndex - 1).map(el => el.id));
      setVisibleElements(newVisible);
    } else if (currentSlideIndex > 0) {
      // Trigger transition
      setIsTransitioning(true);
      setTransitionDirection('backward');
      const duration = (slideTransitions[currentSlide?.id]?.duration || 0.5) * 1000;
      setTimeout(() => {
        onSlideChange(currentSlideIndex - 1);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, duration);
    }
  }, [currentAnimationIndex, currentSlideIndex, allElements, onSlideChange, slideTransitions, currentSlide]);

  const handleNextSlide = useCallback(() => {
    setIsPlaying(false); // Stop auto-play when manually navigating
    // If there are more elements to show, show next one
    if (currentAnimationIndex < allElements.length) {
      const element = allElements[currentAnimationIndex];
      setVisibleElements(prev => new Set([...prev, element.id]));
      setCurrentAnimationIndex(prev => prev + 1);
    } else if (currentSlideIndex < slides.length - 1) {
      // Trigger transition
      setIsTransitioning(true);
      setTransitionDirection('forward');
      const duration = (slideTransitions[currentSlide?.id]?.duration || 0.5) * 1000;
      setTimeout(() => {
        onSlideChange(currentSlideIndex + 1);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, duration);
    }
  }, [currentAnimationIndex, allElements, currentSlideIndex, slides.length, onSlideChange, slideTransitions, currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          handleNextSlide();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          handlePrevSlide();
          break;
        case ' ': // Space to toggle play/pause
          e.preventDefault();
          togglePlay();
          break;
        case 'Escape':
          onClose();
          break;
        case 'Home':
          e.preventDefault();
          onSlideChange(0);
          break;
        case 'End':
          e.preventDefault();
          onSlideChange(slides.length - 1);
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNextSlide, handlePrevSlide, onClose, onSlideChange, slides.length]);

  // Render element with animation - matching SlideCanvas exactly
  const renderElement = (element: SlideElement, isVisible: boolean) => {
    const animation = element.animation as Animation | undefined;
    const hasAnimation = animation && animation.type !== 'none';
    
    const style: React.CSSProperties = {
      position: 'absolute',
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      opacity: isVisible ? (element.opacity ?? 1) : 0,
      transition: 'opacity 0.3s ease',
      transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      zIndex: element.zIndex || 1,
      ...(isVisible && hasAnimation ? getAnimationStyle(animation) : {}),
    };

    const getFontWeight = (weight?: string): number | string => {
      const weights: Record<string, number> = { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 };
      return weights[weight || 'normal'] || 400;
    };

    return (
      <div key={element.id} style={style}>
        {element.type === 'text' && (
          <div
            className="w-full h-full p-2 whitespace-pre-wrap"
            style={{
              fontSize: element.fontSize || 16,
              fontWeight: getFontWeight(element.fontWeight),
              fontStyle: element.fontStyle || 'normal',
              textAlign: element.textAlign || 'left',
              textDecoration: element.textDecoration || 'none',
              textTransform: element.textTransform || 'none',
              lineHeight: element.lineHeight || 1.5,
              letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : 'normal',
              fontFamily: element.fontFamily || 'inherit',
              color: element.color || '#000000',
              backgroundColor: element.backgroundColor,
              textShadow: element.textShadow,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: element.verticalAlign === 'middle' ? 'center' : element.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
            }}
          >
            <span>{element.content || ''}</span>
          </div>
        )}
        
        {element.type === 'image' && element.imageUrl && (
          <img
            src={element.imageUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: element.objectFit || 'cover',
              objectPosition: element.objectPosition || 'center center',
              borderRadius: element.borderRadius || 0,
              transform: `rotate(${element.imageRotation || 0}deg) scaleX(${element.flipHorizontal ? -1 : 1}) scaleY(${element.flipVertical ? -1 : 1})`,
              clipPath: element.clipPath,
            }}
          />
        )}
        
        {element.type === 'shape' && (
          (() => {
            const shapeStyles: React.CSSProperties = { 
              width: '100%', 
              height: '100%', 
              backgroundColor: element.backgroundColor || '#3b82f6' 
            };
            if (element.shapeType === 'circle') shapeStyles.borderRadius = '50%';
            else if (element.shapeType === 'rectangle') shapeStyles.borderRadius = element.borderRadius || 8;
            else if (element.shapeType === 'line') {
              return <div className="absolute top-1/2 left-0 right-0 h-1" style={{ backgroundColor: element.backgroundColor || '#3b82f6' }} />;
            }
            else if (element.shapeType === 'arrow') {
              return <svg viewBox="0 0 100 50" className="w-full h-full"><polygon points="0,20 70,20 70,0 100,25 70,50 70,30 0,30" fill={element.backgroundColor || '#3b82f6'} /></svg>;
            }
            return <div style={shapeStyles} />;
          })()
        )}

        {element.type === 'icon' && element.iconConfig && (
          <div className="w-full h-full flex items-center justify-center">
            <IconRenderer 
              config={{
                ...element.iconConfig,
                size: Math.min(element.width, element.height) * 0.8,
              }} 
              className="w-full h-full" 
            />
          </div>
        )}

        {element.type === 'table' && element.tableConfig && (
          <TableEditor 
            config={{
              ...element.tableConfig,
              alternateRowColors: element.tableConfig.alternateRowColors ?? false,
              alternateColor: element.tableConfig.alternateColor ?? '#f9fafb',
              headerBgColor: element.tableConfig.headerBgColor ?? '#f3f4f6',
              headerTextColor: element.tableConfig.headerTextColor ?? '#111827',
            }} 
            onChange={() => {}} 
            width={element.width} 
            height={element.height} 
          />
        )}

        {element.type === 'code' && element.codeConfig && (
          <CodeBlock 
            config={{
              ...element.codeConfig,
              showHeader: element.codeConfig.showHeader ?? true,
              wrapLines: element.codeConfig.wrapLines ?? false,
              tabSize: element.codeConfig.tabSize ?? 2,
              highlightLines: element.codeConfig.highlightLines ?? [],
              headerTitle: element.codeConfig.headerTitle ?? '',
            }} 
            onChange={() => {}} 
            width={element.width} 
            height={element.height} 
            isEditing={false} 
          />
        )}
      </div>
    );
  };

  const renderSlidePreview = (slide: SlideTemplate) => {
    const canvasWidth = 960;
    const canvasHeight = 540;
    
    // Calculate scale to fit container while maintaining aspect ratio
    const scaleX = containerSize.width / canvasWidth;
    const scaleY = containerSize.height / canvasHeight;
    const scale = Math.min(scaleX, scaleY) * 0.86;
    
    // Check if slide has visible content
    const hasElements = slide.elements && slide.elements.length > 0;
    
    // Get slide transition
    const slideTransition: SlideTransition = slideTransitions[slide.id] || { type: 'fade', duration: 0.5 };
    
    // Apply transition styles
    const transitionStyle: React.CSSProperties = isTransitioning
      ? transitionDirection === 'forward'
        ? getTransitionOutStyle(slideTransition)
        : getTransitionInStyle(slideTransition)
      : {};
    
    return (
      <div
        className="relative overflow-hidden flex items-center justify-center w-full h-full"
        style={{ background: '#1a1a1a' }}
      >
        {/* The actual slide content scaled to fit */}
        <div
          className="rounded-lg overflow-hidden shadow-2xl"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            background: slide.backgroundColor || '#ffffff',
            transition: `all ${slideTransition.duration || 0.5}s ease-in-out`,
            ...transitionStyle,
          }}
        >
          {/* Static Slide Content - Only show when no elements exist */}
          {!hasElements && (
            <div className="absolute inset-0 p-8 flex flex-col">
              {slide.type === 'cover' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <h3 
                    className="font-bold w-full"
                    style={{ 
                      fontSize: '48px',
                      color: slide.textColor || '#1f2937',
                    }}
                  >
                    {slide.title || 'Untitled Slide'}
                  </h3>
                  {slide.subtitle && (
                    <p 
                      className="opacity-80 w-full mt-4"
                      style={{ 
                        fontSize: '24px',
                        color: slide.textColor || '#1f2937',
                      }}
                    >
                      {slide.subtitle}
                    </p>
                  )}
                </div>
              )}

              {slide.type === 'content' && (
                <div className="flex-1 flex flex-col">
                  <h3 
                    className="font-bold w-full mb-8"
                    style={{ 
                      fontSize: '36px',
                      color: slide.textColor || '#1f2937',
                    }}
                  >
                    {slide.title || 'Untitled Slide'}
                  </h3>
                  {slide.content && slide.content.length > 0 && (
                    <div className="space-y-4">
                      {slide.content.map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div 
                            className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                            style={{ backgroundColor: slide.textColor || '#1f2937' }}
                          />
                          <span style={{ fontSize: '18px', color: slide.textColor || '#1f2937' }}>
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(slide.type === 'thankyou' || slide.type === 'section') && (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <h3 
                    className="font-bold w-full"
                    style={{ 
                      fontSize: '56px',
                      color: slide.textColor || '#1f2937',
                    }}
                  >
                    {slide.title || 'Untitled Slide'}
                  </h3>
                  {slide.subtitle && (
                    <p 
                      className="opacity-80 w-full mt-4"
                      style={{ 
                        fontSize: '24px',
                        color: slide.textColor || '#1f2937',
                      }}
                    >
                      {slide.subtitle}
                    </p>
                  )}
                </div>
              )}

              {/* Default for other types */}
              {!['cover', 'content', 'thankyou', 'section'].includes(slide.type) && (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <h3 
                    className="font-bold w-full"
                    style={{ 
                      fontSize: '36px',
                      color: slide.textColor || '#1f2937',
                    }}
                  >
                    {slide.title || 'Untitled Slide'}
                  </h3>
                  {slide.subtitle && (
                    <p 
                      className="opacity-80 w-full mt-4"
                      style={{ 
                        fontSize: '20px',
                        color: slide.textColor || '#1f2937',
                      }}
                    >
                      {slide.subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Render elements - only show visible ones */}
          {hasElements && slide.elements!.map((element) => {
            const isVisible = visibleElements.has(element.id);
            return renderElement(element, isVisible);
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full p-0 gap-0" aria-describedby={undefined}>
        <DialogTitle className="sr-only">
          {language === 'ar' ? 'معاينة العرض التقديمي' : 'Presentation Preview'}
        </DialogTitle>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              {language === 'ar' ? 'معاينة' : 'Preview'}
            </h2>
            <Badge variant="outline">
              {currentSlideIndex + 1} / {slides.length}
            </Badge>
            {allElements.length > 0 && (
              <Badge variant="secondary">
                {language === 'ar' ? 'العناصر: ' : 'Elements: '}
                {currentAnimationIndex} / {allElements.length}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Play/Pause Button */}
            <Button
              variant={isPlaying ? 'default' : 'outline'}
              size="sm"
              onClick={togglePlay}
              className="gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  {language === 'ar' ? 'إيقاف' : 'Pause'}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {language === 'ar' ? 'تشغيل' : 'Play'}
                </>
              )}
            </Button>

            {/* Speed Control */}
            <select
              value={playSpeed}
              onChange={(e) => setPlaySpeed(Number(e.target.value))}
              className="h-8 px-2 text-xs rounded-md border bg-background"
            >
              <option value={500}>0.5s</option>
              <option value={1000}>1s</option>
              <option value={1500}>1.5s</option>
              <option value={2000}>2s</option>
              <option value={3000}>3s</option>
            </select>

            {/* Toggle Notes */}
            <Button
              variant={showNotes ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowNotes(!showNotes)}
            >
              <StickyNote className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'الملاحظات' : 'Notes'}
            </Button>

            {/* Start Presentation */}
            <Button size="sm" onClick={onStartPresentation}>
              <Maximize className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'بدء العرض' : 'Start Presentation'}
            </Button>

            {/* Close */}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="h-1 rounded-none" />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Main Panel - Current Slide */}
          <div 
            ref={containerRef}
            className="flex-1 flex items-center justify-center bg-neutral-900 p-4"
          >
            {currentSlide && renderSlidePreview(currentSlide)}
          </div>

          {/* Right Panel - Notes */}
          {showNotes && (
            <div className="w-80 border-l bg-muted/30 flex flex-col">
              <div className="p-3 border-b">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4" />
                  <h3 className="font-semibold text-sm">
                    {language === 'ar' ? 'ملاحظات المتحدث' : 'Speaker Notes'}
                  </h3>
                </div>
              </div>
              <ScrollArea className="flex-1 p-3">
                {currentNotes ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    {currentNotes}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {language === 'ar'
                      ? 'لا توجد ملاحظات لهذه الشريحة'
                      : 'No notes for this slide'}
                  </p>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Footer - Navigation */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-card">
          {/* Slide Thumbnails */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-[60%]">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => onSlideChange(index)}
                className={`flex-shrink-0 w-16 h-10 rounded border-2 overflow-hidden transition-all ${
                  index === currentSlideIndex
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
                style={{ background: slide.backgroundColor }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <span
                    className="text-[8px] font-bold truncate px-1"
                    style={{ color: slide.textColor }}
                  >
                    {index + 1}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePrevSlide}
              disabled={currentSlideIndex === 0 && currentAnimationIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {language === 'ar' ? 'السابق' : 'Previous'}
            </Button>
            <Button
              onClick={handleNextSlide}
              disabled={currentSlideIndex === slides.length - 1 && currentAnimationIndex >= allElements.length}
            >
              {currentAnimationIndex < allElements.length 
                ? (language === 'ar' ? 'التالي' : 'Next')
                : (language === 'ar' ? 'الشريحة التالية' : 'Next Slide')
              }
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewMode;
