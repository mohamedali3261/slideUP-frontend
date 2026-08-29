import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SlideTemplate, SlideElement } from '@/data/templates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconRenderer } from './IconRenderer';
import { TableEditor } from './TableEditor';
import { CodeBlock } from './CodeBlock';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Maximize2, 
  Minimize2, 
  StickyNote,
  Grid3X3,
  Play,
  Pause,
  Circle,
  Square,
  HelpCircle,
  Pencil,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SlideNotes } from './SpeakerNotes';
import { DrawingTools, DrawingToolsToggle } from './DrawingTools';
import { 
  SlideTransition, 
  TransitionType,
  Animation,
  getAnimationStyle,
  getTransitionOutStyle,
  getTransitionInStartStyle,
} from './AnimationControls';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface PresentationModeProps {
  slides: SlideTemplate[];
  initialSlideIndex?: number;
  onClose: () => void;
  speakerNotes?: SlideNotes;
  slideTransitions?: Record<string, SlideTransition>;
  canvasWidth?: number;
  canvasHeight?: number;
}

const DEFAULT_TRANSITION: SlideTransition = {
  type: 'fade',
  duration: 0.5,
  easing: 'ease-in-out',
};

export const PresentationMode = ({ 
  slides, 
  initialSlideIndex = 0, 
  onClose, 
  speakerNotes = {},
  slideTransitions = {},
  canvasWidth = 960,
  canvasHeight = 540,
}: PresentationModeProps) => {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(initialSlideIndex);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const [outApplied, setOutApplied] = useState(false);
  const [inApplied, setInApplied] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(5);
  const [isBlackout, setIsBlackout] = useState(false);
  const [showLaser, setShowLaser] = useState(false);
  const [laserPosition, setLaserPosition] = useState({ x: 0, y: 0 });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const [currentElementIndex, setCurrentElementIndex] = useState(0);
  const [isElementPlaying, setIsElementPlaying] = useState(false);
  const [elementPlaySpeed, setElementPlaySpeed] = useState(1000);
  const [slideScale, setSlideScale] = useState(() => {
    // Compute an initial scale immediately (before first paint)
    const scaleX = window.innerWidth / 960;
    const scaleY = (window.innerHeight - 80) / 540;
    return Math.min(scaleX, scaleY) * 0.97;
  });
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const elementPlayRef = useRef<NodeJS.Timeout | null>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const targetIndexRef = useRef(0);

  const currentSlide = slides[currentIndex];
  const currentNotes = speakerNotes[currentSlide?.id]?.content || '';
  const currentTransition = slideTransitions[currentSlide?.id] || DEFAULT_TRANSITION;

  // Calculate scale using ResizeObserver on the slide container
  useEffect(() => {
    const computeScale = (width: number, height: number) => {
      if (width <= 0 || height <= 0) return;
      const scaleX = width / canvasWidth;
      const scaleY = height / canvasHeight;
      setSlideScale(Math.min(scaleX, scaleY) * 0.97);
    };

    const el = slideContainerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      computeScale(rect.width, rect.height);

      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          computeScale(width, height);
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    } else {
      // Fallback using window
      const update = () => {
        const scaleX = window.innerWidth / canvasWidth;
        const scaleY = window.innerHeight / canvasHeight;
        setSlideScale(Math.min(scaleX, scaleY) * 0.97);
      };
      update();
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
  }, [canvasWidth, canvasHeight]);

  // Get all elements sorted by zIndex/position
  const getAllElements = useCallback((slide: SlideTemplate) => {
    if (!slide?.elements) return [];
    return [...slide.elements].sort((a, b) => {
      const zIndexA = a.zIndex ?? 0;
      const zIndexB = b.zIndex ?? 0;
      if (zIndexA !== zIndexB) return zIndexA - zIndexB;
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
  }, []);

  // Get all animated elements sorted by animation order
  const getAnimatedElements = useCallback((slide: SlideTemplate) => {
    if (!slide?.elements) return [];
    return slide.elements
      .filter(el => el.animation && el.animation.type !== 'none')
      .sort((a, b) => {
        const orderA = (a as any).animationOrder ?? a.animation?.delay ?? 0;
        const orderB = (b as any).animationOrder ?? b.animation?.delay ?? 0;
        return orderA - orderB;
      });
  }, []);

  const allElements = getAllElements(currentSlide);
  const animatedElements = getAnimatedElements(currentSlide);

  // Reset elements when slide changes - show non-animated elements immediately
  useEffect(() => {
    if (!currentSlide?.elements) {
      setVisibleElements(new Set());
      setCurrentElementIndex(0);
      setIsElementPlaying(false);
      return;
    }

    // Show all non-animated elements immediately
    const nonAnimatedElements = currentSlide.elements.filter(
      el => !el.animation || el.animation.type === 'none'
    );
    const initialVisible = new Set(nonAnimatedElements.map(el => el.id));
    
    setVisibleElements(initialVisible);
    setCurrentElementIndex(0);
    setIsElementPlaying(false);
    
    // Stop any playing animation
    if (elementPlayRef.current) {
      clearInterval(elementPlayRef.current);
      elementPlayRef.current = null;
    }
  }, [currentIndex, currentSlide]);

  // Element auto-play
  useEffect(() => {
    if (isElementPlaying && animatedElements.length > 0) {
      elementPlayRef.current = setInterval(() => {
        setCurrentElementIndex(prev => {
          if (prev < animatedElements.length) {
            const element = animatedElements[prev];
            setVisibleElements(prevVisible => new Set([...prevVisible, element.id]));
            return prev + 1;
          } else {
            // All elements shown, stop playing
            setIsElementPlaying(false);
            return prev;
          }
        });
      }, elementPlaySpeed);
    }
    return () => {
      if (elementPlayRef.current) {
        clearInterval(elementPlayRef.current);
        elementPlayRef.current = null;
      }
    };
  }, [isElementPlaying, elementPlaySpeed, animatedElements]);

  const toggleElementPlay = useCallback(() => {
    if (currentElementIndex >= animatedElements.length) {
      // Reset to beginning if we're at the end
      const nonAnimatedIds = currentSlide?.elements
        ?.filter(el => !el.animation || el.animation.type === 'none')
        .map(el => el.id) || [];
      setVisibleElements(new Set(nonAnimatedIds));
      setCurrentElementIndex(0);
      setIsElementPlaying(true);
    } else {
      setIsElementPlaying(prev => !prev);
    }
  }, [currentElementIndex, animatedElements.length, currentSlide]);

  const showNextElement = useCallback(() => {
    if (currentElementIndex < animatedElements.length) {
      const element = animatedElements[currentElementIndex];
      setVisibleElements(prev => new Set([...prev, element.id]));
      setCurrentElementIndex(prev => prev + 1);
      // Stop auto-play if we've shown all elements
      if (currentElementIndex + 1 >= animatedElements.length) {
        setIsElementPlaying(false);
      }
    }
  }, [currentElementIndex, animatedElements]);

  const hideLastElement = useCallback(() => {
    if (currentElementIndex > 0) {
      setCurrentElementIndex(prev => prev - 1);
      setIsElementPlaying(false); // Stop auto-play when going back
      // Keep non-animated elements visible, only hide animated ones
      const nonAnimatedIds = currentSlide?.elements
        ?.filter(el => !el.animation || el.animation.type === 'none')
        .map(el => el.id) || [];
      const visibleAnimatedIds = animatedElements.slice(0, currentElementIndex - 1).map(el => el.id);
      setVisibleElements(new Set([...nonAnimatedIds, ...visibleAnimatedIds]));
    }
  }, [currentElementIndex, animatedElements, currentSlide]);

  // Laser pointer mouse tracking
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (showLaser) {
      setLaserPosition({ x: e.clientX, y: e.clientY });
    }
  }, [showLaser]);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        if (currentIndex < slides.length - 1) {
          goToNext();
        } else {
          setIsAutoPlaying(false);
        }
      }, autoPlayInterval * 1000);
    }
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, currentIndex, autoPlayInterval, slides.length]);

  const getTransitionDuration = useCallback((index: number) => {
    const t = slideTransitions[slides[index]?.id] || DEFAULT_TRANSITION;
    return t.duration || 0.5;
  }, [slideTransitions, slides]);

  const getTransitionEasing = useCallback((index: number) => {
    const t = slideTransitions[slides[index]?.id] || DEFAULT_TRANSITION;
    return t.easing || 'ease-in-out';
  }, [slideTransitions, slides]);

  // Compose the slide transform (out/in state) on top of the fit-to-screen scale
  const withSlideTransform = useCallback((style: React.CSSProperties): React.CSSProperties => {
    const transform = style.transform;
    return {
      ...style,
      transform: transform ? `${transform} scale(${slideScale})` : `scale(${slideScale})`,
    };
  }, [slideScale]);

  const startTransition = useCallback((target: number) => {
    if (target === currentIndex || isTransitioning) return;
    setHasStarted(true);
    setPreviousIndex(currentIndex);
    targetIndexRef.current = target;
    setOutApplied(false);
    setInApplied(false);
    setIsTransitioning(true);
    setTransitionPhase('out');
  }, [currentIndex, isTransitioning]);

  const goToNext = useCallback(() => {
    // First show all animated elements one by one, then go to next slide
    if (currentElementIndex < animatedElements.length) {
      showNextElement();
    } else if (currentIndex < slides.length - 1) {
      startTransition(currentIndex + 1);
    }
  }, [currentIndex, slides.length, currentElementIndex, animatedElements.length, showNextElement, startTransition]);

  const goToPrevious = useCallback(() => {
    // First hide elements one by one, then go to previous slide
    if (currentElementIndex > 0) {
      hideLastElement();
    } else if (currentIndex > 0) {
      startTransition(currentIndex - 1);
    }
  }, [currentIndex, currentElementIndex, hideLastElement, startTransition]);

  const goToSlide = useCallback((index: number) => {
    setShowThumbnails(false);
    if (index !== currentIndex && !isTransitioning) {
      startTransition(index);
    }
  }, [currentIndex, isTransitioning, startTransition]);

  // Click on the slide itself: allow links to work normally, otherwise navigate by thirds
  const handleSlideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('a[href]')) return;
    if (isTransitioning) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) {
      goToPrevious();
    } else if (x > (rect.width * 2) / 3) {
      goToNext();
    }
  };

  // Phase: paint the outgoing slide, then apply its "out" style so it animates away
  useEffect(() => {
    if (transitionPhase === 'out') {
      const t = setTimeout(() => setOutApplied(true), 30);
      return () => clearTimeout(t);
    }
  }, [transitionPhase]);

  // Phase: once the "out" animation finishes, swap to the target slide and begin its entrance
  useEffect(() => {
    if (transitionPhase === 'out') {
      const t = setTimeout(() => {
        setCurrentIndex(targetIndexRef.current);
        setOutApplied(false);
        setTransitionPhase('in');
      }, getTransitionDuration(currentIndex) * 1000 + 60);
      return () => clearTimeout(t);
    }
  }, [transitionPhase, currentIndex, getTransitionDuration]);

  // Phase: mount the entering slide at its start state, then apply the normal state
  useEffect(() => {
    if (transitionPhase === 'in') {
      const t = setTimeout(() => setInApplied(true), 30);
      return () => clearTimeout(t);
    }
  }, [transitionPhase]);

  // Phase: once the "in" animation finishes, return to idle
  useEffect(() => {
    if (transitionPhase === 'in') {
      const t = setTimeout(() => {
        setTransitionPhase('idle');
        setIsTransitioning(false);
        setPreviousIndex(null);
        setInApplied(false);
      }, getTransitionDuration(currentIndex) * 1000 + 60);
      return () => clearTimeout(t);
    }
  }, [transitionPhase, currentIndex, getTransitionDuration]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      // requestFullscreen is unsupported on iOS Safari (except <video>) - degrade gracefully
      try {
        const promise = document.documentElement.requestFullscreen();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(() => {
            // Fullscreen not supported - keep presenting in-place
            setIsFullscreen(false);
          });
        } else {
          setIsFullscreen(true);
        }
      } catch {
        setIsFullscreen(false);
      }
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'Enter':
        case 'PageDown':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'Backspace':
        case 'PageUp':
          e.preventDefault();
          goToPrevious();
          break;
        case 'Escape':
          e.preventDefault();
          if (showThumbnails) {
            setShowThumbnails(false);
          } else {
            onClose();
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          setShowNotes(!showNotes);
          break;
        case 'd':
        case 'D':
          e.preventDefault();
          setIsDrawingMode(!isDrawingMode);
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          setShowThumbnails(!showThumbnails);
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          setIsAutoPlaying(!isAutoPlaying);
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          setIsBlackout(!isBlackout);
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          setShowLaser(!showLaser);
          break;
        case '?':
        case '/':
          e.preventDefault();
          setShowShortcuts(!showShortcuts);
          break;
        case 'Home':
          e.preventDefault();
          goToSlide(0);
          break;
        case 'End':
          e.preventDefault();
          goToSlide(slides.length - 1);
          break;
      }

      // Number keys for quick navigation (1-9)
      if (e.key >= '1' && e.key <= '9') {
        const slideNum = parseInt(e.key) - 1;
        if (slideNum < slides.length) {
          goToSlide(slideNum);
        }
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [goToNext, goToPrevious, goToSlide, onClose, toggleFullscreen, slides.length, showNotes, isDrawingMode, showThumbnails, isAutoPlaying, isBlackout, showLaser, showShortcuts]);

  // Render element with animation - sorted by animation order
  const renderElementWithAnimation = (element: SlideElement, index: number, totalAnimatedBefore: number) => {
    const animation = element.animation as Animation | undefined;
    const hasAnimation = animation && animation.type !== 'none';
    const isVisible = visibleElements.has(element.id);
    
    // Calculate delay based on animation order
    let animationDelay = animation?.delay || 0;
    if (hasAnimation) {
      // Add stagger delay based on order
      animationDelay += totalAnimatedBefore * 0.3; // 0.3s between each animation
    }
    
    const style: React.CSSProperties = {
      position: 'absolute',
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      zIndex: element.zIndex || 0,
      // Non-animated elements are always visible, animated elements depend on visibility state
      opacity: hasAnimation ? (isVisible ? 1 : 0) : 1,
      transform: hasAnimation ? (isVisible ? 'scale(1)' : 'scale(0.9)') : 'scale(1)',
      transition: hasAnimation ? 'opacity 0.5s ease, transform 0.5s ease' : 'none',
      pointerEvents: isVisible ? 'auto' : 'none',
      ...(isVisible && hasAnimation ? getAnimationStyle({
        ...animation,
        delay: animationDelay,
      }) : {}),
    };

    return (
      <div key={element.id} style={style}>
        {renderElementContent(element)}
      </div>
    );
  };

  // Render element content
  const renderElementContent = (element: SlideElement) => {
    const colors = ['#06b6d4','#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#84cc16'];

    switch (element.type) {
      case 'text': {
        const contentText = element.content || '';
        const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(contentText);
        const textDir = hasArabic ? 'rtl' : 'ltr';
        return (
          <div
            style={{
              fontSize: element.fontSize,
              fontWeight: element.fontWeight,
              fontStyle: element.fontStyle || 'normal',
              color: element.color,
              textAlign: element.textAlign || (textDir === 'rtl' ? 'right' : 'left'),
              textDecoration: element.textDecoration,
              textTransform: element.textTransform || 'none',
              lineHeight: element.lineHeight || 1.5,
              letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
              fontFamily: element.fontFamily,
              backgroundColor: element.backgroundColor,
              textShadow: element.textShadow,
              width: '100%',
              height: '100%',
              padding: 8,
              boxSizing: 'border-box' as const,
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: element.verticalAlign === 'middle' ? 'center' : element.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
              direction: textDir,
              unicodeBidi: 'embed',
            }}
          >
            <span style={{ display: 'block', width: '100%' }}>
              {element.link ? (
                <a
                  href={element.link}
                  target={element.linkTarget === '_self' ? '_self' : '_blank'}
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    color: element.color || '#2563eb',
                    textDecoration: element.textDecoration === 'line-through' ? 'line-through' : 'underline',
                    cursor: 'pointer',
                  }}
                >
                  {element.content}
                </a>
              ) : (
                element.content
              )}
            </span>
          </div>
        );
      }
      case 'shape':
        if (element.shapeType === 'arrow') {
          return <svg viewBox="0 0 100 50" style={{ width: '100%', height: '100%' }}><polygon points="0,20 70,20 70,0 100,25 70,50 70,30 0,30" fill={element.backgroundColor || '#3b82f6'} /></svg>;
        }
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: element.backgroundColor,
              borderRadius: element.shapeType === 'circle' ? '50%' : element.borderRadius,
              ...(element.border ? { border: `${element.border.width}px ${element.border.style} ${element.border.color}` } : {}),
            }}
          />
        );
      case 'image':
        return (
          <img
            src={element.imageUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: element.objectFit || 'cover',
              objectPosition: element.objectPosition || 'center',
              borderRadius: element.borderRadius,
              transform: `rotate(${element.imageRotation || 0}deg) scaleX(${element.flipHorizontal ? -1 : 1}) scaleY(${element.flipVertical ? -1 : 1})`,
            }}
          />
        );
      case 'chart': {
        if (!element.chartConfig) return null;
        const { type, data } = element.chartConfig;
        const max = Math.max(...data.map(d => d.value), 1);

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
      }

      case 'icon':
        if (!element.iconConfig) return null;
        return (
          <div className="w-full h-full flex items-center justify-center">
            <IconRenderer
              config={{ ...element.iconConfig, size: Math.min(element.width, element.height) * 0.8 }}
              className="w-full h-full"
            />
          </div>
        );

      case 'table':
        if (!element.tableConfig) return null;
        return (
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
        );

      case 'code':
        if (!element.codeConfig) return null;
        return (
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
        );

      case 'video':
        if (!element.mediaConfig?.src) return null;
        return (
          <video
            src={element.mediaConfig.src}
            controls
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: element.borderRadius || 0 }}
          />
        );

      case 'audio':
        if (!element.mediaConfig?.src) return null;
        return (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.08)', borderRadius: element.borderRadius || 8 }}>
            <audio src={element.mediaConfig.src} controls style={{ width: '90%' }} />
          </div>
        );

      default:
        return null;
    }
  };

  // Render slide content
  const renderSlideContent = (slide: SlideTemplate, isAnimating: boolean = true) => {
    // If slide has custom elements, render them
    if (slide.elements && slide.elements.length > 0) {
      // Sort elements: animated elements first (by their animationOrder or original order), then non-animated
      const animatedElements = slide.elements.filter(el => el.animation && el.animation.type !== 'none');
      const nonAnimatedElements = slide.elements.filter(el => !el.animation || el.animation.type === 'none');
      
      // Sort animated elements by animationOrder if exists, otherwise by delay
      animatedElements.sort((a, b) => {
        const orderA = (a as any).animationOrder ?? a.animation?.delay ?? 0;
        const orderB = (b as any).animationOrder ?? b.animation?.delay ?? 0;
        return orderA - orderB;
      });
      
      return (
        <div className="absolute inset-0">
          {/* Render non-animated elements first (no animation) */}
          {nonAnimatedElements.map((element, index) => renderElementWithAnimation(element, index, 0))}
          {/* Render animated elements with staggered delays */}
          {animatedElements.map((element, index) => renderElementWithAnimation(element, index, index))}
        </div>
      );
    }

    // Default slide type rendering
    const animationClass = isAnimating ? 'animate-fade-in' : '';

    switch (slide.type) {
      case 'cover':
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 sm:px-12">
            <h1 className={cn("text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6", animationClass)}>
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p 
                className={cn("text-lg sm:text-2xl md:text-3xl opacity-80", animationClass)} 
                style={{ animationDelay: '0.2s' }}
              >
                {slide.subtitle}
              </p>
            )}
          </div>
        );

      case 'content':
        return (
          <div className="flex-1 flex flex-col px-6 sm:px-16 py-6 sm:py-12">
            <h2 className={cn("text-2xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-12", animationClass)}>
              {slide.title}
            </h2>
            <div className="space-y-4 sm:space-y-6 flex-1 stagger-animation">
              {slide.content?.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 sm:gap-4 text-lg sm:text-2xl"
                >
                  <div 
                    className="w-2 sm:w-3 h-2 sm:h-3 rounded-full mt-2 sm:mt-3 flex-shrink-0"
                    style={{ backgroundColor: slide.textColor }}
                  />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'section':
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-4">
              <h1 className={cn("text-4xl sm:text-6xl md:text-8xl font-bold mb-3 sm:mb-4", animationClass)}>
                {slide.title}
              </h1>
              {slide.subtitle && (
                <p className={cn("text-lg sm:text-2xl md:text-3xl opacity-70", animationClass)} style={{ animationDelay: '0.3s' }}>
                  {slide.subtitle}
                </p>
              )}
            </div>
          </div>
        );

      case 'chart':
        return (
          <div className="flex-1 flex flex-col px-16 py-12">
            <h2 className={cn("text-4xl md:text-5xl font-bold mb-4", animationClass)}>
              {slide.title}
            </h2>
            {slide.subtitle && (
              <p className={cn("text-xl opacity-70 mb-8", animationClass)} style={{ animationDelay: '0.1s' }}>
                {slide.subtitle}
              </p>
            )}
            <div className={cn("flex-1 flex items-center justify-center", animationClass)} style={{ animationDelay: '0.2s' }}>
              <div className="w-full max-w-2xl h-64 flex items-end justify-around gap-8">
                {[65, 80, 45, 90, 70].map((height, i) => (
                  <div
                    key={i}
                    className="w-20 rounded-t"
                    style={{
                      height: `${height}%`,
                      backgroundColor: slide.textColor,
                      opacity: 0.3 + (i * 0.15),
                      animation: `kiro-slide-in-up 0.5s ease-out ${i * 0.1}s both`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'thankyou':
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 sm:px-12">
            <h1 className={cn("text-4xl sm:text-6xl md:text-8xl font-bold mb-6 sm:mb-8", animationClass)}>
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p className={cn("text-lg sm:text-2xl md:text-3xl opacity-80", animationClass)} style={{ animationDelay: '0.2s' }}>
                {slide.subtitle}
              </p>
            )}
          </div>
        );

      case 'comparison':
        return (
          <div className="flex-1 flex flex-col px-6 sm:px-16 py-6 sm:py-12">
            <h2 className={cn("text-2xl sm:text-4xl font-bold mb-4 sm:mb-8 text-center", animationClass)}>
              {slide.title}
            </h2>
            <div className="flex-1 flex gap-4 sm:gap-8">
              <div className={cn("flex-1 rounded-xl p-4 sm:p-6", animationClass)} style={{ backgroundColor: `${slide.textColor}15`, animationDelay: '0.2s' }}>
                <h3 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 text-center">Option A</h3>
              </div>
              <div className={cn("flex-1 rounded-xl p-4 sm:p-6", animationClass)} style={{ backgroundColor: `${slide.textColor}15`, animationDelay: '0.4s' }}>
                <h3 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 text-center">Option B</h3>
              </div>
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className="flex-1 flex flex-col px-6 sm:px-16 py-6 sm:py-12">
            <h2 className={cn("text-2xl sm:text-4xl font-bold mb-6 sm:mb-12 text-center", animationClass)}>
              {slide.title}
            </h2>
            <div className="flex-1 flex justify-around items-center stagger-animation">
              {(slide.content || ['100+', '50K', '99%', '24/7']).slice(0, 4).map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl sm:text-5xl md:text-6xl font-bold mb-1 sm:mb-2">{stat}</div>
                  <div className="text-sm sm:text-lg opacity-60">Label {index + 1}</div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 sm:px-12">
            <h1 className={cn("text-2xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6", animationClass)}>
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p className={cn("text-base sm:text-xl md:text-2xl opacity-80", animationClass)}>
                {slide.subtitle}
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ background: '#1a1a1a' }}
      onMouseMove={handleMouseMove}
    >
      {/* Slide Container */}
      <div 
        ref={slideContainerRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: '1200px' }}
      >
        {/* Outgoing Slide (rendered only during the exit phase) */}
        {isTransitioning && transitionPhase === 'out' && previousIndex !== null && (
          <div
            className="absolute rounded-lg shadow-2xl"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              transformOrigin: 'center center',
              overflow: 'hidden',
              flexShrink: 0,
              transition: `all ${getTransitionDuration(previousIndex)}s ${getTransitionEasing(previousIndex)}`,
              background: slides[previousIndex].backgroundColor,
              color: slides[previousIndex].textColor,
              ...(outApplied
                ? withSlideTransform(getTransitionOutStyle(slideTransitions[slides[previousIndex].id] || DEFAULT_TRANSITION))
                : { transform: `scale(${slideScale})` }),
            }}
          >
            {renderSlideContent(slides[previousIndex], false)}
          </div>
        )}

        {/* Current Slide (rendered in idle and entrance phases) */}
        {transitionPhase !== 'out' && (
          <div
            key={currentIndex}
            onClick={handleSlideClick}
            className="rounded-lg shadow-2xl"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              transformOrigin: 'center center',
              overflow: 'hidden',
              flexShrink: 0,
              transition: `all ${getTransitionDuration(currentIndex)}s ${getTransitionEasing(currentIndex)}`,
              background: currentSlide.backgroundColor,
              color: currentSlide.textColor,
              ...(transitionPhase === 'in' && !inApplied
                ? withSlideTransform(getTransitionInStartStyle(currentTransition))
                : { transform: `scale(${slideScale})` }),
            }}
          >
            {renderSlideContent(currentSlide, !hasStarted)}
          </div>
        )}
      </div>

      {/* Bottom Toolbar */}
      {showToolbar && (
        <div className="absolute bottom-2 sm:bottom-5 left-1/2 -translate-x-1/2 pointer-events-auto z-50 w-[calc(100vw-1rem)] sm:w-auto max-w-[calc(100vw-1rem)]">
          <div className="flex items-center justify-between sm:justify-center gap-1 bg-black/85 backdrop-blur-md rounded-2xl px-2 py-1.5 shadow-2xl">

            {/* ── Navigation group (always visible) ── */}
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon"
                className="text-white hover:bg-white/20 h-8 w-8"
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                title={language === 'ar' ? 'السابق' : 'Previous'}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="text-white text-center px-1 min-w-[44px]">
                <div className="text-xs font-semibold leading-none">{currentIndex + 1}/{slides.length}</div>
                {animatedElements.length > 0 && (
                  <div className="text-white/50 text-[9px] leading-none mt-0.5">{currentElementIndex}/{animatedElements.length}</div>
                )}
              </div>

              <Button variant="ghost" size="icon"
                className="text-white hover:bg-white/20 h-8 w-8"
                onClick={goToNext}
                disabled={currentIndex === slides.length - 1 && currentElementIndex >= animatedElements.length}
                title={language === 'ar' ? 'التالي' : 'Next'}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="w-px h-5 bg-white/20" />

            {/* ── Auto-play (always visible, small) ── */}
            <Button variant="ghost" size="icon"
              className={cn("text-white hover:bg-white/20 h-8 w-8", isAutoPlaying && "bg-green-500/40")}
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              title={language === 'ar' ? 'تشغيل تلقائي' : 'Auto-play'}
            >
              {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </Button>

            <div className="w-px h-5 bg-white/20" />

            {/* ── قائمة الأدوات ── */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  title={language === 'ar' ? 'أدوات العرض' : 'Presentation Tools'}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top" align="center"
                className="w-48 p-2 bg-black/90 border-white/10 text-white mb-2"
              >
                <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider px-1 mb-1.5">
                  {language === 'ar' ? 'أدوات العرض' : 'Presentation Tools'}
                </p>
                <div className="space-y-0.5">
                  {/* Laser Pointer */}
                  <button
                    onClick={() => setShowLaser(!showLaser)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors",
                      showLaser && "bg-red-500/30"
                    )}
                  >
                    <Circle className={cn("w-4 h-4 flex-shrink-0", showLaser ? "fill-red-400 text-red-400" : "text-white/70")} />
                    <span>{language === 'ar' ? 'مؤشر الليزر' : 'Laser Pointer'}</span>
                    {showLaser && <span className="ml-auto text-[10px] text-red-400">{language === 'ar' ? 'مفعّل' : 'ON'}</span>}
                  </button>
                  {/* Drawing */}
                  <button
                    onClick={() => setIsDrawingMode(!isDrawingMode)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors",
                      isDrawingMode && "bg-white/20"
                    )}
                  >
                    <Pencil className="w-4 h-4 flex-shrink-0 text-white/70" />
                    <span>{language === 'ar' ? 'الرسم' : 'Drawing'}</span>
                    {isDrawingMode && <span className="ml-auto text-[10px] text-green-400">{language === 'ar' ? 'مفعّل' : 'ON'}</span>}
                  </button>
                  {/* Blackout */}
                  <button
                    onClick={() => setIsBlackout(true)}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors"
                  >
                    <Square className="w-4 h-4 flex-shrink-0 fill-current text-white/70" />
                    <span>{language === 'ar' ? 'شاشة سوداء' : 'Blackout'}</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* ── قائمة الأنيميشن (لو في عناصر متحركة) ── */}
            {animatedElements.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon"
                    className={cn("text-white hover:bg-white/20 h-8 w-8", isElementPlaying && "bg-green-500/40")}
                    title={language === 'ar' ? 'التحريك' : 'Animation'}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="top" align="center"
                  className="w-52 p-2 bg-black/90 border-white/10 text-white mb-2"
                >
                  <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider px-1 mb-1.5">
                    {language === 'ar' ? 'التحريك' : 'Animation'}
                  </p>
                  <div className="space-y-0.5">
                    {/* Play/Pause elements */}
                    <button
                      onClick={toggleElementPlay}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors",
                        isElementPlaying && "bg-green-500/30"
                      )}
                    >
                      {isElementPlaying
                        ? <Pause className="w-4 h-4 flex-shrink-0 text-white/70" />
                        : <Play className="w-4 h-4 flex-shrink-0 text-white/70" />}
                      <span>{isElementPlaying
                        ? (language === 'ar' ? 'إيقاف التحريك' : 'Pause Animation')
                        : (language === 'ar' ? 'تشغيل التحريك' : 'Play Animation')}</span>
                    </button>
                    {/* Show/Hide all */}
                    <button
                      onClick={() => {
                        if (currentElementIndex >= animatedElements.length) {
                          const nonAnimatedIds = currentSlide?.elements
                            ?.filter(el => !el.animation || el.animation.type === 'none')
                            .map(el => el.id) || [];
                          setVisibleElements(new Set(nonAnimatedIds));
                          setCurrentElementIndex(0);
                        } else {
                          const allIds = currentSlide?.elements?.map(el => el.id) || [];
                          setVisibleElements(new Set(allIds));
                          setCurrentElementIndex(animatedElements.length);
                        }
                      }}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors"
                    >
                      {currentElementIndex >= animatedElements.length
                        ? <EyeOff className="w-4 h-4 flex-shrink-0 text-white/70" />
                        : <Eye className="w-4 h-4 flex-shrink-0 text-white/70" />}
                      <span>{currentElementIndex >= animatedElements.length
                        ? (language === 'ar' ? 'إخفاء الكل' : 'Hide All')
                        : (language === 'ar' ? 'إظهار الكل' : 'Show All')}</span>
                    </button>
                    {/* Speed */}
                    <div className="px-2 pt-1.5 pb-1">
                      <p className="text-[10px] text-white/40 mb-1.5">{language === 'ar' ? 'سرعة التحريك' : 'Animation Speed'}</p>
                      <div className="flex gap-1 flex-wrap">
                        {[500, 1000, 1500, 2000, 3000].map(ms => (
                          <button
                            key={ms}
                            onClick={() => setElementPlaySpeed(ms)}
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] transition-colors",
                              elementPlaySpeed === ms ? "bg-white text-black font-semibold" : "bg-white/10 hover:bg-white/20"
                            )}
                          >
                            {ms / 1000}s
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <div className="w-px h-5 bg-white/20" />

            {/* ── قائمة العرض ── */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  title={language === 'ar' ? 'عرض' : 'View'}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top" align="center"
                className="w-48 p-2 bg-black/90 border-white/10 text-white mb-2"
              >
                <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider px-1 mb-1.5">
                  {language === 'ar' ? 'العرض' : 'View'}
                </p>
                <div className="space-y-0.5">
                  {/* Thumbnails */}
                  <button
                    onClick={() => setShowThumbnails(!showThumbnails)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors",
                      showThumbnails && "bg-white/20"
                    )}
                  >
                    <Grid3X3 className="w-4 h-4 flex-shrink-0 text-white/70" />
                    <span>{language === 'ar' ? 'كل الشرائح' : 'All Slides'}</span>
                  </button>
                  {/* Notes */}
                  <button
                    onClick={() => setShowNotes(!showNotes)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors",
                      showNotes && "bg-white/20"
                    )}
                  >
                    <StickyNote className="w-4 h-4 flex-shrink-0 text-white/70" />
                    <span>{language === 'ar' ? 'الملاحظات' : 'Speaker Notes'}</span>
                  </button>
                  {/* Auto-play interval */}
                  <div className="px-2 pt-1.5 pb-1">
                    <p className="text-[10px] text-white/40 mb-1.5">{language === 'ar' ? 'فترة التشغيل التلقائي' : 'Auto-play Interval'}</p>
                    <div className="flex gap-1 flex-wrap">
                      {[3, 5, 10, 15].map(s => (
                        <button
                          key={s}
                          onClick={() => setAutoPlayInterval(s)}
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] transition-colors",
                            autoPlayInterval === s ? "bg-white text-black font-semibold" : "bg-white/10 hover:bg-white/20"
                          )}
                        >
                          {s}s
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Help */}
                  <button
                    onClick={() => setShowShortcuts(true)}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 flex-shrink-0 text-white/70" />
                    <span>{language === 'ar' ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            <div className="w-px h-5 bg-white/20" />

            {/* Fullscreen */}
            <Button variant="ghost" size="icon"
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={toggleFullscreen}
              title={language === 'ar' ? 'ملء الشاشة' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>

            {/* Close */}
            <Button variant="ghost" size="icon"
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={onClose}
              title={language === 'ar' ? 'إغلاق' : 'Exit'}
            >
              <X className="w-4 h-4" />
            </Button>

          </div>
        </div>
      )}

      {/* Toggle Toolbar Button */}
      <button
        onClick={() => setShowToolbar(!showToolbar)}
        className="absolute top-6 right-6 pointer-events-auto z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
        title={showToolbar ? (language === 'ar' ? 'إخفاء الأدوات' : 'Hide toolbar') : (language === 'ar' ? 'إظهار الأدوات' : 'Show toolbar')}
      >
        {showToolbar ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>

      {/* Speaker Notes Panel */}
      {showNotes && currentNotes && (
        <div className="absolute bottom-24 left-4 right-4 max-h-48 bg-black/80 backdrop-blur-sm rounded-lg p-4 pointer-events-auto overflow-y-auto scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20 z-40">
          <div className="flex items-center gap-2 mb-2 text-white/60 text-sm">
            <StickyNote className="w-4 h-4" />
            <span>{language === 'ar' ? 'ملاحظات المتحدث' : 'Speaker Notes'}</span>
          </div>
          <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
            {currentNotes}
          </p>
        </div>
      )}

      {/* Navigation Arrows (on sides) */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/30 text-white hover:bg-black/50 transition-all pointer-events-auto opacity-100 md:opacity-0 md:hover:opacity-100 hover:scale-110"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      )}
      {currentIndex < slides.length - 1 && (
          <button
            onClick={goToNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/30 text-white hover:bg-black/50 transition-all pointer-events-auto opacity-100 md:opacity-0 md:hover:opacity-100 hover:scale-110"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}

      {/* Progress Bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 pointer-events-none">
        <div 
          className="h-full bg-white/50 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
        />
      </div>

      {/* Thumbnails Grid Overlay */}
      {showThumbnails && (
        <div 
          className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 pointer-events-auto overflow-auto scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20 p-4 sm:p-8"
          onClick={() => setShowThumbnails(false)}
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-2xl font-bold">
                {language === 'ar' ? 'كل الشرائح' : 'All Slides'}
              </h2>
              <Button variant="ghost" size="icon" className="text-white" onClick={() => setShowThumbnails(false)}>
                <X className="w-6 h-6" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToSlide(index);
                  }}
                  className={cn(
                    "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                    index === currentIndex ? "border-white ring-2 ring-white/50" : "border-white/20 hover:border-white/50"
                  )}
                  style={{ background: slide.backgroundColor }}
                >
                  <div className="absolute inset-0 p-4 flex flex-col justify-center" style={{ color: slide.textColor }}>
                    <p className="text-sm font-semibold truncate">{slide.title}</p>
                    {slide.subtitle && (
                      <p className="text-xs opacity-70 truncate">{slide.subtitle}</p>
                    )}
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Drawing Tools */}
      <DrawingTools
        isActive={isDrawingMode}
        onToggle={() => setIsDrawingMode(false)}
        canvasWidth={window.innerWidth}
        canvasHeight={window.innerHeight}
      />

      {/* Laser Pointer */}
      {showLaser && (
        <div
          className="fixed pointer-events-none z-[100]"
          style={{
            left: laserPosition.x - 8,
            top: laserPosition.y - 8,
          }}
        >
          <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_20px_8px_rgba(239,68,68,0.6)]" />
        </div>
      )}

      {/* Blackout Screen */}
      {isBlackout && (
        <div 
          className="fixed inset-0 bg-black z-[90] flex items-center justify-center cursor-pointer"
          onClick={() => setIsBlackout(false)}
        >
          <p className="text-white/30 text-sm">
            {language === 'ar' ? 'اضغط للعودة' : 'Click to return'}
          </p>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {showShortcuts && (
        <div 
          className="fixed inset-0 bg-black/90 z-[95] flex items-center justify-center cursor-pointer backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
        >
          <div className="bg-white/10 rounded-2xl p-6 sm:p-8 max-w-lg w-full mx-4 max-h-[80dvh] overflow-y-auto scrollbar-thin" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-xl font-bold">
                {language === 'ar' ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}
              </h2>
              <button 
                onClick={() => setShowShortcuts(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { key: '→ / Space', action: language === 'ar' ? 'الشريحة التالية' : 'Next slide' },
                { key: '← / Backspace', action: language === 'ar' ? 'الشريحة السابقة' : 'Previous slide' },
                { key: 'F', action: language === 'ar' ? 'ملء الشاشة' : 'Fullscreen' },
                { key: 'B', action: language === 'ar' ? 'شاشة سوداء' : 'Blackout screen' },
                { key: 'L', action: language === 'ar' ? 'مؤشر ليزر' : 'Laser pointer' },
                { key: 'N', action: language === 'ar' ? 'الملاحظات' : 'Toggle notes' },
                { key: 'G', action: language === 'ar' ? 'عرض الشرائح' : 'Slide grid' },
                { key: 'D', action: language === 'ar' ? 'أدوات الرسم' : 'Drawing tools' },
                { key: 'P', action: language === 'ar' ? 'تشغيل تلقائي' : 'Auto-play' },
                { key: '1-9', action: language === 'ar' ? 'انتقال سريع' : 'Quick jump' },
                { key: 'Home', action: language === 'ar' ? 'أول شريحة' : 'First slide' },
                { key: 'End', action: language === 'ar' ? 'آخر شريحة' : 'Last slide' },
                { key: 'Esc', action: language === 'ar' ? 'إغلاق' : 'Exit' },
                { key: '?', action: language === 'ar' ? 'المساعدة' : 'This help' },
              ].map(({ key, action }) => (
                <div key={key} className="flex items-center gap-3">
                  <kbd className="px-2 py-1 bg-white/20 rounded text-white font-mono text-xs min-w-[60px] text-center">
                    {key}
                  </kbd>
                  <span className="text-white/80">{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationMode;
