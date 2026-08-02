import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SlideTemplate, SlideElement } from '@/data/templates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  getTransitionInStyle,
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
}: PresentationModeProps) => {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(initialSlideIndex);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(5);
  const [transitionDirection, setTransitionDirection] = useState<'next' | 'prev'>('next');
  const [isBlackout, setIsBlackout] = useState(false);
  const [showLaser, setShowLaser] = useState(false);
  const [laserPosition, setLaserPosition] = useState({ x: 0, y: 0 });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const [currentElementIndex, setCurrentElementIndex] = useState(0);
  const [isElementPlaying, setIsElementPlaying] = useState(false);
  const [elementPlaySpeed, setElementPlaySpeed] = useState(1000);
  const [slideScale, setSlideScale] = useState(1);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const elementPlayRef = useRef<NodeJS.Timeout | null>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);

  const currentSlide = slides[currentIndex];
  const currentNotes = speakerNotes[currentSlide?.id]?.content || '';
  const currentTransition = slideTransitions[currentSlide?.id] || DEFAULT_TRANSITION;

  // Calculate scale to fit screen while maintaining aspect ratio
  useEffect(() => {
    const updateScale = () => {
      if (slideContainerRef.current) {
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight - 80; // Reserve space for toolbar
        const slideWidth = 960;
        const slideHeight = 540;
        
        const scaleX = containerWidth / slideWidth;
        const scaleY = containerHeight / slideHeight;
        const scale = Math.min(scaleX, scaleY) * 0.95; // 95% to leave some margin
        
        setSlideScale(scale);
      }
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

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

  const goToNext = useCallback(() => {
    // First show all animated elements one by one, then go to next slide
    if (currentElementIndex < animatedElements.length) {
      showNextElement();
    } else if (currentIndex < slides.length - 1 && !isTransitioning) {
      setTransitionDirection('next');
      setPreviousIndex(currentIndex);
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setTimeout(() => {
          setIsTransitioning(false);
          setPreviousIndex(null);
        }, currentTransition.duration * 1000);
      }, 50);
    }
  }, [currentIndex, slides.length, isTransitioning, currentTransition.duration, currentElementIndex, animatedElements.length, showNextElement]);

  const goToPrevious = useCallback(() => {
    // First hide elements one by one, then go to previous slide
    if (currentElementIndex > 0) {
      hideLastElement();
    } else if (currentIndex > 0 && !isTransitioning) {
      setTransitionDirection('prev');
      setPreviousIndex(currentIndex);
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        setTimeout(() => {
          setIsTransitioning(false);
          setPreviousIndex(null);
        }, currentTransition.duration * 1000);
      }, 50);
    }
  }, [currentIndex, isTransitioning, currentTransition.duration, currentElementIndex, hideLastElement]);

  const goToSlide = useCallback((index: number) => {
    if (index !== currentIndex && !isTransitioning) {
      setTransitionDirection(index > currentIndex ? 'next' : 'prev');
      setPreviousIndex(currentIndex);
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentIndex(index);
        setTimeout(() => {
          setIsTransitioning(false);
          setPreviousIndex(null);
        }, currentTransition.duration * 1000);
      }, 50);
    }
    setShowThumbnails(false);
  }, [currentIndex, isTransitioning, currentTransition.duration]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
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

  // Get transition styles
  const getSlideTransitionStyle = (isExiting: boolean): React.CSSProperties => {
    const transition = currentTransition;
    const duration = transition.duration;
    const easing = transition.easing || 'ease-in-out';

    if (isExiting) {
      return {
        ...getTransitionOutStyle(transition),
        transition: `all ${duration}s ${easing}`,
      };
    }

    return {
      transition: `all ${duration}s ${easing}`,
    };
  };

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
    switch (element.type) {
      case 'text':
        return (
          <div
            style={{
              fontSize: element.fontSize,
              fontWeight: element.fontWeight,
              color: element.color,
              textAlign: element.textAlign,
              width: '100%',
              height: '100%',
            }}
          >
            {element.content}
          </div>
        );
      case 'shape':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: element.backgroundColor,
              borderRadius: element.shapeType === 'circle' ? '50%' : element.borderRadius,
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
              borderRadius: element.borderRadius,
            }}
          />
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
          <div className="flex-1 flex flex-col items-center justify-center text-center px-12">
            <h1 className={cn("text-5xl md:text-7xl font-bold mb-6", animationClass)}>
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p 
                className={cn("text-2xl md:text-3xl opacity-80", animationClass)} 
                style={{ animationDelay: '0.2s' }}
              >
                {slide.subtitle}
              </p>
            )}
          </div>
        );

      case 'content':
        return (
          <div className="flex-1 flex flex-col px-16 py-12">
            <h2 className={cn("text-4xl md:text-5xl font-bold mb-12", animationClass)}>
              {slide.title}
            </h2>
            <div className="space-y-6 flex-1 stagger-animation">
              {slide.content?.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-4 text-2xl"
                >
                  <div 
                    className="w-3 h-3 rounded-full mt-3 flex-shrink-0"
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
            <div className="text-center">
              <h1 className={cn("text-6xl md:text-8xl font-bold mb-4", animationClass)}>
                {slide.title}
              </h1>
              {slide.subtitle && (
                <p className={cn("text-2xl md:text-3xl opacity-70", animationClass)} style={{ animationDelay: '0.3s' }}>
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
          <div className="flex-1 flex flex-col items-center justify-center text-center px-12">
            <h1 className={cn("text-6xl md:text-8xl font-bold mb-8", animationClass)}>
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p className={cn("text-2xl md:text-3xl opacity-80", animationClass)} style={{ animationDelay: '0.2s' }}>
                {slide.subtitle}
              </p>
            )}
          </div>
        );

      case 'comparison':
        return (
          <div className="flex-1 flex flex-col px-16 py-12">
            <h2 className={cn("text-4xl font-bold mb-8 text-center", animationClass)}>
              {slide.title}
            </h2>
            <div className="flex-1 flex gap-8">
              <div className={cn("flex-1 rounded-xl p-6", animationClass)} style={{ backgroundColor: `${slide.textColor}15`, animationDelay: '0.2s' }}>
                <h3 className="text-2xl font-semibold mb-4 text-center">Option A</h3>
              </div>
              <div className={cn("flex-1 rounded-xl p-6", animationClass)} style={{ backgroundColor: `${slide.textColor}15`, animationDelay: '0.4s' }}>
                <h3 className="text-2xl font-semibold mb-4 text-center">Option B</h3>
              </div>
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className="flex-1 flex flex-col px-16 py-12">
            <h2 className={cn("text-4xl font-bold mb-12 text-center", animationClass)}>
              {slide.title}
            </h2>
            <div className="flex-1 flex justify-around items-center stagger-animation">
              {(slide.content || ['100+', '50K', '99%', '24/7']).slice(0, 4).map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-5xl md:text-6xl font-bold mb-2">{stat}</div>
                  <div className="text-lg opacity-60">Label {index + 1}</div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-12">
            <h1 className={cn("text-4xl md:text-6xl font-bold mb-6", animationClass)}>
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p className={cn("text-xl md:text-2xl opacity-80", animationClass)}>
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
        {/* Previous Slide (for transition) */}
        {previousIndex !== null && isTransitioning && (
          <div
            className="absolute rounded-lg overflow-hidden shadow-2xl"
            style={{
              width: 960,
              height: 540,
              transform: `scale(${slideScale})`,
              transformOrigin: 'center center',
              background: slides[previousIndex].backgroundColor,
              color: slides[previousIndex].textColor,
              ...getSlideTransitionStyle(true),
            }}
          >
            {renderSlideContent(slides[previousIndex], false)}
          </div>
        )}

        {/* Current Slide */}
        <div
          key={currentIndex}
          className={cn(
            "rounded-lg overflow-hidden shadow-2xl",
            isTransitioning && "transition-all"
          )}
          style={{
            width: 960,
            height: 540,
            transform: `scale(${slideScale})`,
            transformOrigin: 'center center',
            background: currentSlide.backgroundColor,
            color: currentSlide.textColor,
            ...getSlideTransitionStyle(false),
            transitionDuration: `${currentTransition.duration}s`,
          }}
        >
          {renderSlideContent(currentSlide, !isTransitioning)}
        </div>
      </div>

      {/* Bottom Toolbar */}
      {showToolbar && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto z-50">
          <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md rounded-2xl px-4 py-2 shadow-2xl">
            {/* Previous */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20 h-10 w-10"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            {/* Slide Counter */}
            <div className="px-3 text-white text-sm font-medium min-w-[80px] text-center">
              {currentIndex + 1} / {slides.length}
              {animatedElements.length > 0 && (
                <span className="text-white/60 text-xs ml-1">
                  ({currentElementIndex}/{animatedElements.length})
                </span>
              )}
            </div>

            {/* Next */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20 h-10 w-10"
              onClick={goToNext}
              disabled={currentIndex === slides.length - 1 && currentElementIndex >= animatedElements.length}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>

            <div className="w-px h-6 bg-white/20 mx-2" />

            {/* Element Play/Pause - Only show if there are animated elements */}
            {animatedElements.length > 0 && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("text-white hover:bg-white/20 h-10 w-10", isElementPlaying && "bg-green-500/50")}
                  onClick={toggleElementPlay}
                  title={isElementPlaying ? (language === 'ar' ? 'إيقاف العرض التلقائي' : 'Pause Auto-play') : (language === 'ar' ? 'تشغيل تلقائي' : 'Auto-play')}
                >
                  {isElementPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>

                {/* Show/Hide All Elements Toggle */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20 h-10 w-10"
                  onClick={() => {
                    if (currentElementIndex >= animatedElements.length) {
                      // Hide all animated elements
                      const nonAnimatedIds = currentSlide?.elements
                        ?.filter(el => !el.animation || el.animation.type === 'none')
                        .map(el => el.id) || [];
                      setVisibleElements(new Set(nonAnimatedIds));
                      setCurrentElementIndex(0);
                    } else {
                      // Show all elements
                      const allIds = currentSlide?.elements?.map(el => el.id) || [];
                      setVisibleElements(new Set(allIds));
                      setCurrentElementIndex(animatedElements.length);
                    }
                  }}
                  title={currentElementIndex >= animatedElements.length ? (language === 'ar' ? 'إخفاء الكل' : 'Hide All') : (language === 'ar' ? 'إظهار الكل' : 'Show All')}
                >
                  {currentElementIndex >= animatedElements.length ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>

                {/* Speed Control */}
                <select
                  value={elementPlaySpeed}
                  onChange={(e) => setElementPlaySpeed(Number(e.target.value))}
                  className="h-8 px-2 text-xs rounded-md bg-white/10 text-white border-0 cursor-pointer hover:bg-white/20"
                  title={language === 'ar' ? 'سرعة العرض' : 'Animation Speed'}
                >
                  <option value={500} className="bg-black">0.5s</option>
                  <option value={1000} className="bg-black">1s</option>
                  <option value={1500} className="bg-black">1.5s</option>
                  <option value={2000} className="bg-black">2s</option>
                  <option value={3000} className="bg-black">3s</option>
                </select>
              </>
            )}

            <div className="w-px h-6 bg-white/20 mx-2" />

            {/* Laser Pointer */}
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("text-white hover:bg-white/20 h-10 w-10", showLaser && "bg-red-500/50")}
              onClick={() => setShowLaser(!showLaser)}
              title={language === 'ar' ? 'مؤشر ليزر' : 'Laser Pointer'}
            >
              <Circle className={cn("w-4 h-4", showLaser ? "fill-red-500 text-red-500" : "")} />
            </Button>

            {/* Blackout */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20 h-10 w-10"
              onClick={() => setIsBlackout(true)}
              title={language === 'ar' ? 'شاشة سوداء' : 'Blackout'}
            >
              <Square className="w-4 h-4 fill-current" />
            </Button>

            {/* Drawing */}
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("text-white hover:bg-white/20 h-10 w-10", isDrawingMode && "bg-white/20")}
              onClick={() => setIsDrawingMode(!isDrawingMode)}
              title={language === 'ar' ? 'أدوات الرسم' : 'Drawing'}
            >
              <Pencil className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-white/20 mx-2" />

            {/* Thumbnails Grid */}
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("text-white hover:bg-white/20 h-10 w-10", showThumbnails && "bg-white/20")}
              onClick={() => setShowThumbnails(!showThumbnails)}
              title={language === 'ar' ? 'كل الشرائح' : 'All Slides'}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>

            {/* Notes */}
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("text-white hover:bg-white/20 h-10 w-10", showNotes && "bg-white/20")}
              onClick={() => setShowNotes(!showNotes)}
              title={language === 'ar' ? 'الملاحظات' : 'Notes'}
            >
              <StickyNote className="w-4 h-4" />
            </Button>

            {/* Help */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20 h-10 w-10"
              onClick={() => setShowShortcuts(true)}
              title={language === 'ar' ? 'المساعدة' : 'Help'}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-white/20 mx-2" />

            {/* Fullscreen */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20 h-10 w-10"
              onClick={toggleFullscreen}
              title={language === 'ar' ? 'ملء الشاشة' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            {/* Close */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20 h-10 w-10"
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
        className="absolute bottom-6 right-6 pointer-events-auto z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
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
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 text-white hover:bg-black/50 transition-all pointer-events-auto opacity-0 hover:opacity-100 hover:scale-110"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}
      {currentIndex < slides.length - 1 && (
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 text-white hover:bg-black/50 transition-all pointer-events-auto opacity-0 hover:opacity-100 hover:scale-110"
          >
            <ChevronRight className="w-8 h-8" />
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
          className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 pointer-events-auto overflow-auto scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20 p-8"
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

      {/* Click areas for navigation */}
      <div className="absolute inset-0 flex pointer-events-auto">
        <div className="w-1/3 h-full cursor-pointer" onClick={goToPrevious} />
        <div className="w-1/3 h-full" />
        <div className="w-1/3 h-full cursor-pointer" onClick={goToNext} />
      </div>

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
          <div className="bg-white/10 rounded-2xl p-8 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
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
