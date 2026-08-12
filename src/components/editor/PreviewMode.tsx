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
  canvasWidth?: number;
  canvasHeight?: number;
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
  canvasWidth = 960,
  canvasHeight = 540,
}: PreviewModeProps) => {
  const { language } = useLanguage();
  const [showNotes, setShowNotes] = useState(false);
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000); // 1 second per element
  const containerRef = useRef<HTMLDivElement>(null);
  // Initialise with a window-based scale so the first render is already correct
  // Header ~40px + progress 4px + footer ~50px = ~94px reserved
  const [slideScale, setSlideScale] = useState(() => {
    const vw = window.innerWidth * 0.97; // 95vw dialog
    const vh = window.innerHeight - 94;  // minus header/footer
    return Math.min(vw / canvasWidth, vh / canvasHeight) * 0.97;
  });
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Slide transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward');

  const currentSlide = slides[currentSlideIndex];
  const currentNotes = notes[currentSlide?.id]?.content || '';
  const progress = ((currentSlideIndex + 1) / slides.length) * 100;

  // Calculate scale using ResizeObserver on the container div
  useEffect(() => {
    if (!isOpen) return;

    const computeScale = (width: number, height: number) => {
      if (width <= 0 || height <= 0) return;
      const scaleX = width / canvasWidth;
      const scaleY = height / canvasHeight;
      setSlideScale(Math.min(scaleX, scaleY) * 0.97);
    };

    let ro: ResizeObserver | null = null;

    const attach = () => {
      const el = containerRef.current;
      if (!el) return false;

      const rect = el.getBoundingClientRect();
      computeScale(rect.width, rect.height);

      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          computeScale(width, height);
        }
      });
      ro.observe(el);
      return true;
    };

    // Try immediately, then after dialog animation completes
    if (!attach()) {
      const t = setTimeout(() => attach(), 100);
      return () => {
        clearTimeout(t);
        ro?.disconnect();
      };
    }

    return () => ro?.disconnect();
  }, [isOpen, canvasWidth, canvasHeight]);

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
            if (element.border) {
              shapeStyles.background = 'transparent';
              shapeStyles.border = `${element.border.width}px ${element.border.style} ${element.border.color}`;
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

        {element.type === 'chart' && element.chartConfig && (() => {
          const { type, data } = element.chartConfig;
          const max = Math.max(...data.map(d => d.value), 1);
          const colors = ['#06b6d4','#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#84cc16'];

          if (type === 'bar') return (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 8, boxSizing: 'border-box' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                {data.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ width: '100%', height: `${(d.value / max) * 100}%`, background: d.color || colors[i % colors.length], borderRadius: '3px 3px 0 0', minHeight: 2 }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {data.map((d, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: Math.max(8, element.height / data.length / 3), color: 'inherit', opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                ))}
              </div>
            </div>
          );

          if (type === 'line') {
            const pts = data.map((d, i) => `${(i / Math.max(data.length - 1, 1)) * 100},${100 - (d.value / max) * 100}`).join(' ');
            return (
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <polyline points={pts} fill="none" stroke={data[0]?.color || colors[0]} strokeWidth={2} vectorEffect="non-scaling-stroke" />
                {data.map((d, i) => {
                  const cx = (i / Math.max(data.length - 1, 1)) * 100;
                  const cy = 100 - (d.value / max) * 100;
                  return <circle key={i} cx={cx} cy={cy} r={2} fill={d.color || colors[i % colors.length]} vectorEffect="non-scaling-stroke" />;
                })}
              </svg>
            );
          }

          if (type === 'pie') {
            const total = data.reduce((s, d) => s + d.value, 0) || 1;
            let acc = 0;
            return (
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                {data.map((d, i) => {
                  const start = (acc / total) * 360;
                  acc += d.value;
                  const end = (acc / total) * 360;
                  const x1 = 50 + 40 * Math.cos(((start - 90) * Math.PI) / 180);
                  const y1 = 50 + 40 * Math.sin(((start - 90) * Math.PI) / 180);
                  const x2 = 50 + 40 * Math.cos(((end - 90) * Math.PI) / 180);
                  const y2 = 50 + 40 * Math.sin(((end - 90) * Math.PI) / 180);
                  const large = end - start > 180 ? 1 : 0;
                  return <path key={i} d={`M50 50 L${x1} ${y1} A40 40 0 ${large} 1 ${x2} ${y2} Z`} fill={d.color || colors[i % colors.length]} />;
                })}
              </svg>
            );
          }
          return null;
        })()}
      </div>
    );
  };

  const renderSlidePreview = (slide: SlideTemplate) => {
    const previewCanvasWidth = canvasWidth;
    const previewCanvasHeight = canvasHeight;
    
    // Use the scale computed via ResizeObserver
    const scale = slideScale;
    
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
        className="w-full h-full flex items-center justify-center"
        style={{ background: '#1a1a1a', overflow: 'hidden' }}
      >
        {/* The actual slide content scaled to fit */}
        <div
          className="rounded-lg shadow-2xl"
          style={{
            width: previewCanvasWidth,
            height: previewCanvasHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            background: slide.backgroundColor || '#ffffff',
            overflow: 'hidden',
            flexShrink: 0,
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
      <DialogContent 
        className="max-w-[100vw] sm:max-w-[95vw] w-full h-[100dvh] sm:h-[95dvh] p-0 !gap-0 overflow-hidden [&>button]:hidden"
        style={{ display: 'flex', flexDirection: 'column' }}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">
          {language === 'ar' ? 'معاينة العرض التقديمي' : 'Presentation Preview'}
        </DialogTitle>
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2 px-2 sm:px-4 py-1 sm:py-1.5 sm:py-2 border-b bg-card">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <h2 className="font-semibold flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
              <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{language === 'ar' ? 'معاينة' : 'Preview'}</span>
            </h2>
            <div className="flex flex-col items-start gap-0.5">
              <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                {currentSlideIndex + 1} / {slides.length}
              </Badge>
              {allElements.length > 0 && (
                <Badge variant="secondary" className="text-[8px] sm:text-[10px] px-1.5 sm:px-2">
                  {language === 'ar' ? 'العناصر: ' : 'Elements: '}
                  {currentAnimationIndex} / {allElements.length}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            {/* Play/Pause Button */}
            <Button
              variant={isPlaying ? 'default' : 'outline'}
              size="sm"
              onClick={togglePlay}
              className="gap-1 px-1.5 sm:px-2 sm:px-4 h-7 sm:h-8"
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </Button>

            {/* Speed Control */}
            <select
              value={playSpeed}
              onChange={(e) => setPlaySpeed(Number(e.target.value))}
              className="h-7 sm:h-8 px-1.5 sm:px-2 text-[10px] sm:text rounded-md border bg-background"
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
              className="px-1.5 sm:px-2 sm:px-4 h-7 sm:h-8"
            >
              <StickyNote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>

            {/* Start Presentation */}
            <Button size="sm" onClick={onStartPresentation} className="px-1.5 sm:px-2 sm:px-4 h-7 sm:h-8">
              <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>

            {/* Close */}
            <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 sm:h-8 sm:w-8">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="h-1 rounded-none" />

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Main Panel - Current Slide */}
          <div 
            ref={containerRef}
            className="flex-1 flex items-center justify-center bg-neutral-900 min-h-0"
          >
            {currentSlide && renderSlidePreview(currentSlide)}
          </div>

          {/* Right Panel - Notes */}
          {showNotes && (
            <div className="w-full md:w-80 md:border-l border-t md:border-t-0 bg-muted/30 flex flex-col max-h-[40%] md:max-h-none">
              <div className="p-3 border-b">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4" />
                  <h3 className="font-semibold text-sm">
                    {language === 'ar' ? 'ملاحظات المتحدث' : 'Speaker Notes'}
                  </h3>
                </div>
              </div>
              <ScrollArea className="flex-1 p-3 min-h-0">
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
        <div className="flex items-center justify-between flex-wrap gap-1.5 sm:gap-2 px-2 sm:px-4 py-1 sm:py-1.5 sm:py-2 border-t bg-card">
          {/* Slide Thumbnails */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto max-w-[45%] sm:max-w-[60%] flex-1">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => onSlideChange(index)}
                className={`flex-shrink-0 w-10 sm:w-14 sm:w-16 h-8 sm:h-10 rounded border-2 overflow-hidden transition-all ${
                  index === currentSlideIndex
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
                style={{ background: slide.backgroundColor }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <span
                    className="text-[7px] sm:text-[8px] font-bold truncate px-0.5 sm:px-1"
                    style={{ color: slide.textColor }}
                  >
                    {index + 1}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevSlide}
              disabled={currentSlideIndex === 0 && currentAnimationIndex === 0}
              className="h-7 sm:h-8 px-1.5 sm:px-2"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{language === 'ar' ? 'السابق' : 'Previous'}</span>
            </Button>
            <Button
              size="sm"
              onClick={handleNextSlide}
              disabled={currentSlideIndex === slides.length - 1 && currentAnimationIndex >= allElements.length}
              className="h-7 sm:h-8 px-1.5 sm:px-2"
            >
              <span className="hidden sm:inline">{currentAnimationIndex < allElements.length 
                ? (language === 'ar' ? 'التالي' : 'Next')
                : (language === 'ar' ? 'الشريحة التالية' : 'Next Slide')
              }</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewMode;
