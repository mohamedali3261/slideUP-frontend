import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { SlideElement } from '@/data/templates';
import { cn } from '@/lib/utils';
import { IconRenderer } from './IconRenderer';
import { TableEditor } from './TableEditor';
import { CodeBlock } from './CodeBlock';
import { RotateCw, ClipboardPaste } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | 'rotate';

// Helper to generate CSS filter string
const filtersToCSS = (filters: SlideElement['filters']): string => {
  if (!filters) return 'none';
  const parts: string[] = [];
  if (filters.blur > 0) parts.push(`blur(${filters.blur}px)`);
  if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`);
  if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`);
  if (filters.saturation !== 100) parts.push(`saturate(${filters.saturation}%)`);
  if (filters.hueRotate > 0) parts.push(`hue-rotate(${filters.hueRotate}deg)`);
  if (filters.grayscale > 0) parts.push(`grayscale(${filters.grayscale}%)`);
  if (filters.sepia > 0) parts.push(`sepia(${filters.sepia}%)`);
  if (filters.invert > 0) parts.push(`invert(${filters.invert}%)`);
  return parts.length > 0 ? parts.join(' ') : 'none';
};

const shadowToCSS = (shadow: SlideElement['shadow']): string => {
  if (!shadow || !shadow.enabled) return 'none';
  const inset = shadow.inset ? 'inset ' : '';
  return `${inset}${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread || 0}px ${shadow.color}`;
};

const borderToCSS = (border: SlideElement['border']): string => {
  if (!border || border.width === 0) return 'none';
  return `${border.width}px ${border.style} ${border.color}`;
};

interface DraggableElementProps {
  element: SlideElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<SlideElement>) => void;
  onDelete: () => void;
  canvasScale: number;
}

export const DraggableElement = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  canvasScale,
}: DraggableElementProps) => {
  const { language } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);
  const [currentDimensions, setCurrentDimensions] = useState({ width: element.width, height: element.height });
  const [liveScale, setLiveScale] = useState(1);
  const elementRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const isRotatingRef = useRef(false);
  const resizeDirectionRef = useRef<ResizeDirection | null>(null);
  const initialSizeRef = useRef({ width: element.width, height: element.height });
  
  const dragStartRef = useRef({ x: 0, y: 0, elementX: 0, elementY: 0 });
  const resizeStartRef = useRef({ width: 0, height: 0, x: 0, y: 0, elementX: 0, elementY: 0 });
  const rotateStartRef = useRef({ angle: 0, startAngle: 0, centerX: 0, centerY: 0 });
  const currentPosRef = useRef({ x: element.x, y: element.y, width: element.width, height: element.height, rotation: element.rotation || 0 });
  const currentFontSizeRef = useRef(element.fontSize || 16);
  const currentIconSizeRef = useRef(element.iconConfig?.size || 48);
  const currentIconConfigRef = useRef(element.iconConfig);
  
  // Update font size ref when element changes
  useEffect(() => {
    currentFontSizeRef.current = element.fontSize || 16;
    currentIconSizeRef.current = element.iconConfig?.size || 48;
    currentIconConfigRef.current = element.iconConfig;
  }, [element.fontSize, element.iconConfig]);

  // Sync position when not dragging
  useEffect(() => {
    if (!isDraggingRef.current && !isResizingRef.current && !isRotatingRef.current) {
      currentPosRef.current = { x: element.x, y: element.y, width: element.width, height: element.height, rotation: element.rotation || 0 };
      setCurrentDimensions({ width: element.width, height: element.height });
      // Reset any transform offset
      if (elementRef.current) {
        elementRef.current.style.transform = '';
      }
    }
  }, [element.x, element.y, element.width, element.height, element.rotation]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    
    isDraggingRef.current = true;
    setIsDragging(true);
    
    // Get current computed position
    const el = elementRef.current;
    const currentX = el ? parseFloat(el.style.left) || element.x : element.x;
    const currentY = el ? parseFloat(el.style.top) || element.y : element.y;
    
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      elementX: currentX,
      elementY: currentY,
    };
    currentPosRef.current = { ...currentPosRef.current, x: currentX, y: currentY };
    
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, [element.x, element.y, onSelect, isEditing]);

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: ResizeDirection) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (direction === 'rotate') {
      isRotatingRef.current = true;
      const el = elementRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        rotateStartRef.current = {
          angle: element.rotation || 0,
          startAngle,
          centerX,
          centerY,
        };
      }
    } else {
      isResizingRef.current = true;
      setIsResizing(true);
      setShowDimensions(true);
      // Store initial size for text scaling
      initialSizeRef.current = { width: element.width, height: element.height };
    }
    
    resizeDirectionRef.current = direction;
    resizeStartRef.current = {
      width: element.width,
      height: element.height,
      x: e.clientX,
      y: e.clientY,
      elementX: element.x,
      elementY: element.y,
    };
    currentPosRef.current = { x: element.x, y: element.y, width: element.width, height: element.height, rotation: element.rotation || 0 };
    
    document.body.style.userSelect = 'none';
  }, [element.width, element.height, element.x, element.y, element.rotation]);

  // Store refs for values needed in mouse handlers to avoid re-creating handlers
  const canvasScaleRef = useRef(canvasScale);
  const onUpdateRef = useRef(onUpdate);
  const setIsDraggingRef = useRef(setIsDragging);
  const setIsResizingRef = useRef(setIsResizing);
  const setShowDimensionsRef = useRef(setShowDimensions);
  const setCurrentDimensionsRef = useRef(setCurrentDimensions);
  const setLiveScaleRef = useRef(setLiveScale);
  const elementTypeRef = useRef(element.type);
  const lastUpdateTimeRef = useRef(0);

  // Keep refs updated
  useEffect(() => {
    canvasScaleRef.current = canvasScale;
    onUpdateRef.current = onUpdate;
    setIsDraggingRef.current = setIsDragging;
    setIsResizingRef.current = setIsResizing;
    setShowDimensionsRef.current = setShowDimensions;
    setCurrentDimensionsRef.current = setCurrentDimensions;
    setLiveScaleRef.current = setLiveScale;
    elementTypeRef.current = element.type;
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current && !isResizingRef.current && !isRotatingRef.current) return;
      
      const el = elementRef.current;
      if (!el) return;

      const scale = canvasScaleRef.current;

      if (isDraggingRef.current) {
        const deltaX = (e.clientX - dragStartRef.current.x) / scale;
        const deltaY = (e.clientY - dragStartRef.current.y) / scale;
        
        let newX = dragStartRef.current.elementX + deltaX;
        let newY = dragStartRef.current.elementY + deltaY;

        // Clamp to canvas bounds
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);

        // Update DOM directly for this element
        el.style.left = `${newX}px`;
        el.style.top = `${newY}px`;
        
        currentPosRef.current.x = newX;
        currentPosRef.current.y = newY;
        
        // Throttle live updates (every 16ms = ~60fps)
        const now = Date.now();
        if (now - lastUpdateTimeRef.current > 16) {
          lastUpdateTimeRef.current = now;
          onUpdateRef.current({
            x: Math.round(newX),
            y: Math.round(newY),
          });
        }
      }

      if (isRotatingRef.current) {
        const { startAngle, angle, centerX, centerY } = rotateStartRef.current;
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        let newRotation = angle + (currentAngle - startAngle);
        
        // Snap to 15 degree increments when holding Shift
        if (e.shiftKey) {
          newRotation = Math.round(newRotation / 15) * 15;
        }
        
        el.style.transform = `rotate(${newRotation}deg)`;
        currentPosRef.current.rotation = newRotation;
      }

      if (isResizingRef.current && resizeDirectionRef.current && resizeDirectionRef.current !== 'rotate') {
        const deltaX = (e.clientX - resizeStartRef.current.x) / scale;
        const deltaY = (e.clientY - resizeStartRef.current.y) / scale;
        const { width: startWidth, height: startHeight, elementX: startX, elementY: startY } = resizeStartRef.current;
        const direction = resizeDirectionRef.current;
        
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startX;
        let newY = startY;

        switch (direction) {
          case 'se':
            newWidth = Math.max(50, startWidth + deltaX);
            newHeight = Math.max(30, startHeight + deltaY);
            break;
          case 'sw':
            newWidth = Math.max(50, startWidth - deltaX);
            newHeight = Math.max(30, startHeight + deltaY);
            newX = startX + (startWidth - newWidth);
            break;
          case 'ne':
            newWidth = Math.max(50, startWidth + deltaX);
            newHeight = Math.max(30, startHeight - deltaY);
            newY = startY + (startHeight - newHeight);
            break;
          case 'nw':
            newWidth = Math.max(50, startWidth - deltaX);
            newHeight = Math.max(30, startHeight - deltaY);
            newX = startX + (startWidth - newWidth);
            newY = startY + (startHeight - newHeight);
            break;
          case 'n':
            newHeight = Math.max(30, startHeight - deltaY);
            newY = startY + (startHeight - newHeight);
            break;
          case 's':
            newHeight = Math.max(30, startHeight + deltaY);
            break;
          case 'e':
            newWidth = Math.max(50, startWidth + deltaX);
            break;
          case 'w':
            newWidth = Math.max(50, startWidth - deltaX);
            newX = startX + (startWidth - newWidth);
            break;
        }

        el.style.left = `${Math.max(0, newX)}px`;
        el.style.top = `${Math.max(0, newY)}px`;
        el.style.width = `${newWidth}px`;
        el.style.height = `${newHeight}px`;
        
        currentPosRef.current = { ...currentPosRef.current, x: Math.max(0, newX), y: Math.max(0, newY), width: newWidth, height: newHeight };
        setCurrentDimensionsRef.current({ width: Math.round(newWidth), height: Math.round(newHeight) });
        
        // Calculate scale for text elements
        if (elementTypeRef.current === 'text') {
          const scaleX = newWidth / initialSizeRef.current.width;
          const scaleY = newHeight / initialSizeRef.current.height;
          const avgScale = (scaleX + scaleY) / 2;
          setLiveScaleRef.current(avgScale);
        }
      }
    };

    const handleMouseUp = () => {
      if (isResizingRef.current || isRotatingRef.current) {
        const pos = currentPosRef.current;
        
        // For text elements, update fontSize based on scale
        if (elementTypeRef.current === 'text' && isResizingRef.current) {
          const scaleX = pos.width / initialSizeRef.current.width;
          const scaleY = pos.height / initialSizeRef.current.height;
          const avgScale = (scaleX + scaleY) / 2;
          const newFontSize = Math.max(8, Math.round(currentFontSizeRef.current * avgScale));
          
          onUpdateRef.current({
            x: Math.round(pos.x),
            y: Math.round(pos.y),
            width: Math.round(pos.width),
            height: Math.round(pos.height),
            rotation: Math.round(pos.rotation),
            fontSize: newFontSize,
          });
        } else if (isResizingRef.current || isRotatingRef.current) {
          // Update React state with final position for resize/rotate
          onUpdateRef.current({
            x: Math.round(pos.x),
            y: Math.round(pos.y),
            width: Math.round(pos.width),
            height: Math.round(pos.height),
            rotation: Math.round(pos.rotation),
          });
        }
      }
      
      isDraggingRef.current = false;
      isResizingRef.current = false;
      isRotatingRef.current = false;
      resizeDirectionRef.current = null;
      setIsDraggingRef.current(false);
      setIsResizingRef.current(false);
      setLiveScaleRef.current(1);
      
      // Hide dimensions after a short delay
      setTimeout(() => {
        setShowDimensionsRef.current(false);
      }, 500);
      
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSelected && !isEditing && (e.key === 'Delete' || e.key === 'Backspace')) {
        onDelete();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, isEditing, onDelete]);

  const handleDoubleClick = useCallback(() => {
    if (element.type === 'text') setIsEditing(true);
  }, [element.type]);

  const handleBlur = useCallback(() => setIsEditing(false), []);

  // Paste from clipboard function
  const handlePasteFromClipboard = useCallback(async () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Focus the textarea first
    textarea.focus();

    try {
      // Check if clipboard API is available and we have permission
      if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
        const text = await navigator.clipboard.readText();
        if (text) {
          const start = textarea.selectionStart || 0;
          const end = textarea.selectionEnd || 0;
          const currentContent = element.content || '';
          const newContent = currentContent.substring(0, start) + text + currentContent.substring(end);
          onUpdate({ content: newContent });
          setTimeout(() => {
            if (textareaRef.current) {
              const newPos = start + text.length;
              textareaRef.current.selectionStart = newPos;
              textareaRef.current.selectionEnd = newPos;
              textareaRef.current.focus();
            }
          }, 10);
          return;
        }
      }
    } catch (err) {
      // Clipboard API failed, textarea is already focused
      // User can now press Ctrl+V manually
      console.log('Use Ctrl+V to paste');
    }
  }, [element.content, onUpdate]);

  // Handle paste event on textarea
  const handlePasteEvent = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData?.getData('text');
    if (text) {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const currentContent = element.content || '';
      const newContent = currentContent.substring(0, start) + text + currentContent.substring(end);
      onUpdate({ content: newContent });
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = start + text.length;
          textareaRef.current.selectionStart = newPos;
          textareaRef.current.selectionEnd = newPos;
        }
      }, 0);
    }
  }, [element.content, onUpdate]);

  const getFontWeight = (weight?: string): number | string => {
    const weights: Record<string, number> = { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 };
    return weights[weight || 'normal'] || 400;
  };

  const getVerticalAlignStyles = (align?: string): React.CSSProperties => {
    switch (align) {
      case 'top': return { justifyContent: 'flex-start' };
      case 'middle': return { justifyContent: 'center' };
      case 'bottom': return { justifyContent: 'flex-end' };
      default: return { justifyContent: 'flex-start' };
    }
  };

  const renderContent = () => {
    const { direction } = useLanguage();
    
    switch (element.type) {
      case 'text':
        const baseFontSize = element.fontSize || 16;
        const scaledFontSize = isResizing ? baseFontSize * liveScale : baseFontSize;
        const textStyles: React.CSSProperties = {
          fontSize: scaledFontSize,
          fontWeight: getFontWeight(element.fontWeight),
          fontStyle: element.fontStyle || 'normal',
          textAlign: element.textAlign || 'left',
          textDecoration: element.textDecoration || 'none',
          textTransform: element.textTransform || 'none',
          lineHeight: element.lineHeight || 1.5,
          letterSpacing: element.letterSpacing ? `${element.letterSpacing * (isResizing ? liveScale : 1)}px` : 'normal',
          fontFamily: element.fontFamily || 'inherit',
          color: element.color || '#000000',
          backgroundColor: element.backgroundColor,
          textShadow: element.textShadow,
          direction: direction,
        };
        return isEditing ? (
          <div 
            className="relative w-full h-full" 
            style={{ userSelect: 'text' }}
          >
            <textarea
              ref={textareaRef}
              autoFocus
              value={element.content || ''}
              onChange={(e) => onUpdate({ content: e.target.value })}
              onPaste={handlePasteEvent}
              onMouseDown={(e) => e.stopPropagation()}
              onBlur={(e) => {
                // Don't blur if clicking on paste button
                const relatedTarget = e.relatedTarget as HTMLElement;
                if (relatedTarget?.closest('[data-paste-button]')) {
                  return;
                }
                handleBlur();
              }}
              className="w-full h-full bg-transparent border-none outline-none resize-none p-2"
              style={{ ...textStyles, userSelect: 'text', cursor: 'text' }}
            />
            {/* Paste Button */}
            <button
              data-paste-button
              tabIndex={0}
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await handlePasteFromClipboard();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="absolute -top-9 right-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md shadow-lg hover:bg-primary/90 transition-all duration-200 z-[1002]"
              title={language === 'ar' ? 'لصق من الحافظة' : 'Paste from clipboard'}
            >
              <ClipboardPaste size={14} />
              <span>{language === 'ar' ? 'لصق' : 'Paste'}</span>
            </button>
          </div>
        ) : (
          <div className="whitespace-pre-wrap flex flex-col" style={{ ...textStyles, ...getVerticalAlignStyles(element.verticalAlign), padding: '4px 8px' }}>
            {element.content || 'Double click to edit'}
          </div>
        );

      case 'image':
        return (
          <img
            src={element.imageUrl}
            alt="Slide element"
            style={{
              width: '100%', height: '100%',
              objectFit: element.objectFit || 'cover',
              objectPosition: element.objectPosition || 'center center',
              borderRadius: element.borderRadius || 0,
              transform: `rotate(${element.imageRotation || 0}deg) scaleX(${element.flipHorizontal ? -1 : 1}) scaleY(${element.flipVertical ? -1 : 1})`,
              clipPath: element.clipPath,
            }}
            draggable={false}
          />
        );

      case 'shape':
        const shapeStyles: React.CSSProperties = { width: '100%', height: '100%', backgroundColor: element.backgroundColor || '#3b82f6' };
        if (element.shapeType === 'circle') shapeStyles.borderRadius = '50%';
        else if (element.shapeType === 'rectangle') shapeStyles.borderRadius = element.borderRadius || 8;
        else if (element.shapeType === 'line') return <div className="absolute top-1/2 left-0 right-0 h-1" style={{ backgroundColor: element.backgroundColor || '#3b82f6' }} />;
        else if (element.shapeType === 'arrow') return <svg viewBox="0 0 100 50" className="w-full h-full"><polygon points="0,20 70,20 70,0 100,25 70,50 70,30 0,30" fill={element.backgroundColor || '#3b82f6'} /></svg>;
        return <div style={shapeStyles} />;

      case 'icon':
        if (!element.iconConfig) return null;
        // Icon fills the container - no fixed size needed
        return (
          <div className="w-full h-full flex items-center justify-center">
            <IconRenderer 
              config={{
                ...element.iconConfig,
                size: Math.min(element.width, element.height) * 0.8,
              }} 
              className="w-full h-full" 
            />
          </div>
        );

      case 'table':
        if (!element.tableConfig) return null;
        return <TableEditor config={element.tableConfig} onChange={(tableConfig) => onUpdate({ tableConfig })} width={element.width} height={element.height} />;

      case 'code':
        if (!element.codeConfig) return null;
        return <CodeBlock config={element.codeConfig} onChange={(codeConfig) => onUpdate({ codeConfig })} width={element.width} height={element.height} isEditing={isSelected} />;

      default:
        return null;
    }
  };


  return (
    <div
      ref={elementRef}
      data-element-id={element.id}
      className={cn(
        'absolute',
        isEditing ? 'select-text' : 'select-none',
        isDragging ? 'cursor-grabbing' : isEditing ? 'cursor-text' : 'cursor-move'
      )}
      style={{
        left: element.x,
        top: element.y,
        width: element.type === 'text' ? 'fit-content' : element.width,
        height: element.type === 'text' ? 'fit-content' : element.height,
        maxWidth: element.type === 'text' ? element.width : undefined,
        minWidth: element.type === 'text' ? 50 : undefined,
        zIndex: element.zIndex || 1,
        opacity: element.opacity !== undefined ? element.opacity : 1,
        filter: filtersToCSS(element.filters),
        boxShadow: shadowToCSS(element.shadow),
        border: borderToCSS(element.border),
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
        transformOrigin: 'center center',
        willChange: isDragging ? 'left, top' : 'auto',
        overflow: element.type === 'text' ? 'visible' : 'hidden',
        pointerEvents: 'auto',
      }}
      onMouseDown={isEditing ? undefined : handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {renderContent()}

      {isSelected && !isEditing && (
        <>
          {/* Animated selection border */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-sm"
            style={{
              border: '2px dashed #000000',
              animation: 'borderDash 0.5s linear infinite',
              zIndex: 1000,
            }}
          />
          
          {/* Dimensions tooltip */}
          {showDimensions && (
            <div 
              className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs font-medium rounded shadow-lg whitespace-nowrap"
              style={{ zIndex: 1001 }}
            >
              {currentDimensions.width} × {currentDimensions.height}
            </div>
          )}
          
          {/* Rotation handle */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 -top-8 w-6 h-6 bg-white border-2 border-black rounded-full cursor-grab hover:bg-black hover:text-white transition-all duration-200 flex items-center justify-center shadow-md hover:scale-110 group"
            style={{ zIndex: 1001 }}
            onMouseDown={(e) => handleResizeStart(e, 'rotate')}
            title="Rotate"
          >
            <RotateCw className="w-3 h-3 text-black group-hover:text-white" />
          </div>
          {/* Line connecting rotation handle to element */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-5 w-0.5 h-4 bg-black pointer-events-none" style={{ zIndex: 1000 }} />
          
          {/* Corner handles - circular with hover effect */}
          <div 
            className="absolute -right-2 -bottom-2 w-4 h-4 bg-white border-2 border-black rounded-full cursor-se-resize hover:bg-black hover:scale-125 transition-all duration-200 shadow-sm" 
            style={{ zIndex: 1001 }}
            onMouseDown={(e) => handleResizeStart(e, 'se')} 
          />
          <div 
            className="absolute -left-2 -bottom-2 w-4 h-4 bg-white border-2 border-black rounded-full cursor-sw-resize hover:bg-black hover:scale-125 transition-all duration-200 shadow-sm" 
            style={{ zIndex: 1001 }}
            onMouseDown={(e) => handleResizeStart(e, 'sw')} 
          />
          <div 
            className="absolute -right-2 -top-2 w-4 h-4 bg-white border-2 border-black rounded-full cursor-ne-resize hover:bg-black hover:scale-125 transition-all duration-200 shadow-sm" 
            style={{ zIndex: 1001 }}
            onMouseDown={(e) => handleResizeStart(e, 'ne')} 
          />
          <div 
            className="absolute -left-2 -top-2 w-4 h-4 bg-white border-2 border-black rounded-full cursor-nw-resize hover:bg-black hover:scale-125 transition-all duration-200 shadow-sm" 
            style={{ zIndex: 1001 }}
            onMouseDown={(e) => handleResizeStart(e, 'nw')} 
          />
          
          {/* Edge handles - pill shaped with hover effect */}
          {element.width > 60 && (
            <>
              <div 
                className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-8 h-3 bg-white border-2 border-black rounded-full cursor-n-resize hover:bg-black hover:scale-110 transition-all duration-200 shadow-sm" 
                style={{ zIndex: 1001 }}
                onMouseDown={(e) => handleResizeStart(e, 'n')} 
              />
              <div 
                className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-8 h-3 bg-white border-2 border-black rounded-full cursor-s-resize hover:bg-black hover:scale-110 transition-all duration-200 shadow-sm" 
                style={{ zIndex: 1001 }}
                onMouseDown={(e) => handleResizeStart(e, 's')} 
              />
            </>
          )}
          {element.height > 60 && (
            <>
              <div 
                className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-8 bg-white border-2 border-black rounded-full cursor-e-resize hover:bg-black hover:scale-110 transition-all duration-200 shadow-sm" 
                style={{ zIndex: 1001 }}
                onMouseDown={(e) => handleResizeStart(e, 'e')} 
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-8 bg-white border-2 border-black rounded-full cursor-w-resize hover:bg-black hover:scale-110 transition-all duration-200 shadow-sm" 
                style={{ zIndex: 1001 }}
                onMouseDown={(e) => handleResizeStart(e, 'w')} 
              />
            </>
          )}
        </>
      )}
    </div>
  );
};
