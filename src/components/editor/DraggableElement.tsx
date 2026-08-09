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
  canvasWidth?: number;
  canvasHeight?: number;
  showGuides?: boolean;
  isMultiSelected?: boolean;
  onGuidesChange?: (guides: { v: number[]; h: number[] }) => void;
}

interface AlignmentGuides {
  v: number[];
  h: number[];
}

const SNAP_THRESHOLD = 6; // editor px

// Normalize mouse/touch start points to client coordinates
const getPoint = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
  if ('touches' in e && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  if ('clientX' in e) {
    return { x: e.clientX, y: e.clientY };
  }
  return { x: 0, y: 0 };
};

// Compute alignment guides against the canvas basics (center + start edge only)
const computeGuides = (
  newX: number,
  newY: number,
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number,
  isRtl: boolean
): { x: number; y: number; guides: AlignmentGuides } => {
  // "Beginning" of the element: right side in RTL, left side in LTR
  const startOffset = isRtl ? width : 0;
  const canvasStart = isRtl ? canvasWidth : 0;

  const selfV = [startOffset, width / 2];
  const selfH = [0, height / 2];

  const targetsV = [canvasStart, canvasWidth / 2];
  const targetsH = [0, canvasHeight / 2];

  let bestV: { guide: number; offset: number; diff: number } | null = null;
  for (const g of targetsV) {
    for (const off of selfV) {
      const diff = newX + off - g;
      if (Math.abs(diff) <= SNAP_THRESHOLD && (!bestV || Math.abs(diff) < Math.abs(bestV.diff))) {
        bestV = { guide: g, offset: off, diff };
      }
    }
  }

  let bestH: { guide: number; offset: number; diff: number } | null = null;
  for (const g of targetsH) {
    for (const off of selfH) {
      const diff = newY + off - g;
      if (Math.abs(diff) <= SNAP_THRESHOLD && (!bestH || Math.abs(diff) < Math.abs(bestH.diff))) {
        bestH = { guide: g, offset: off, diff };
      }
    }
  }

  return {
    x: bestV ? newX - bestV.diff : newX,
    y: bestH ? newY - bestH.diff : newY,
    guides: {
      v: bestV ? [bestV.guide] : [],
      h: bestH ? [bestH.guide] : [],
    },
  };
};

// Snap the edges being resized to the canvas basics (center + start edge only)
const snapResize = (
  direction: ResizeDirection,
  x: number,
  y: number,
  w: number,
  h: number,
  canvasWidth: number,
  canvasHeight: number,
  isRtl: boolean
): { x: number; y: number; w: number; h: number; guides: AlignmentGuides } => {
  const canvasStart = isRtl ? canvasWidth : 0;
  const targetsV = [canvasStart, canvasWidth / 2];
  const targetsH = [0, canvasHeight / 2];

  const gv: number[] = [];
  const gh: number[] = [];
  let outX = x;
  let outY = y;
  let outW = w;
  let outH = h;

  const nearest = (value: number, targets: number[]) => {
    let best: number | null = null;
    let bestDiff = Infinity;
    for (const t of targets) {
      const d = Math.abs(value - t);
      if (d <= SNAP_THRESHOLD && d < bestDiff) {
        bestDiff = d;
        best = t;
      }
    }
    return best;
  };

  if (direction.includes('w')) {
    const t = nearest(outX, targetsV);
    if (t !== null && t >= 0) { outX = t; gv.push(t); }
  }
  if (direction.includes('e')) {
    const t = nearest(outX + outW, targetsV);
    if (t !== null) {
      const nw = t - outX;
      if (nw >= 50) { outW = nw; gv.push(t); }
    }
  }
  if (direction.includes('n')) {
    const t = nearest(outY, targetsH);
    if (t !== null && t >= 0) { outY = t; gh.push(t); }
  }
  if (direction.includes('s')) {
    const t = nearest(outY + outH, targetsH);
    if (t !== null) {
      const nh = t - outY;
      if (nh >= 30) { outH = nh; gh.push(t); }
    }
  }

  return { x: outX, y: outY, w: outW, h: outH, guides: { v: gv, h: gh } };
};

export const DraggableElement = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  canvasScale,
  canvasWidth = 960,
  canvasHeight = 540,
  showGuides = true,
  isMultiSelected = false,
  onGuidesChange,
}: DraggableElementProps) => {
  const { language, direction } = useLanguage();
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

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
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
    
    const pt = getPoint(e);
    dragStartRef.current = {
      x: pt.x,
      y: pt.y,
      elementX: currentX,
      elementY: currentY,
    };
    currentPosRef.current = { ...currentPosRef.current, x: currentX, y: currentY };
    
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, [element.x, element.y, onSelect, isEditing]);

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent, direction: ResizeDirection) => {
    e.preventDefault();
    e.stopPropagation();
    
    const pt = getPoint(e);

    if (direction === 'rotate') {
      isRotatingRef.current = true;
      const el = elementRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const startAngle = Math.atan2(pt.y - centerY, pt.x - centerX) * (180 / Math.PI);
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
    }
    
    resizeDirectionRef.current = direction;
    // For text elements use the actual rendered size so the selection box matches what's on screen
    const startWidth = element.type === 'text' && elementRef.current ? elementRef.current.offsetWidth : element.width;
    const startHeight = element.type === 'text' && elementRef.current ? elementRef.current.offsetHeight : element.height;
    initialSizeRef.current = { width: startWidth, height: startHeight };
    resizeStartRef.current = {
      width: startWidth,
      height: startHeight,
      x: pt.x,
      y: pt.y,
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
  const guidesEnabledRef = useRef(showGuides);
  const multiSelectRef = useRef(isMultiSelected);
  const canvasWidthRef = useRef(canvasWidth);
  const canvasHeightRef = useRef(canvasHeight);
  const elementIdRef = useRef(element.id);
  const elementWidthRef = useRef(element.width);
  const elementHeightRef = useRef(element.height);
  const directionRef = useRef(direction);
  const onGuidesChangeRef = useRef(onGuidesChange);

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
    guidesEnabledRef.current = showGuides;
    multiSelectRef.current = isMultiSelected;
    canvasWidthRef.current = canvasWidth;
    canvasHeightRef.current = canvasHeight;
    elementIdRef.current = element.id;
    elementWidthRef.current = element.width;
    elementHeightRef.current = element.height;
    directionRef.current = direction;
    onGuidesChangeRef.current = onGuidesChange;
  });

  useEffect(() => {
    const getClientPoint = (e: MouseEvent | TouchEvent) => {
      const te = e as TouchEvent;
      if (te.touches && te.touches.length > 0) {
        return { x: te.touches[0].clientX, y: te.touches[0].clientY, shiftKey: false };
      }
      const me = e as MouseEvent;
      return { x: me.clientX, y: me.clientY, shiftKey: me.shiftKey };
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current && !isResizingRef.current && !isRotatingRef.current) return;

      // Block native scrolling while dragging/resizing/rotating on touch devices
      e.preventDefault();
      
      const el = elementRef.current;
      if (!el) return;

      const pt = getClientPoint(e);
      const scale = canvasScaleRef.current;

      if (isDraggingRef.current) {
        const deltaX = (pt.x - dragStartRef.current.x) / scale;
        const deltaY = (pt.y - dragStartRef.current.y) / scale;
        
        let newX = dragStartRef.current.elementX + deltaX;
        let newY = dragStartRef.current.elementY + deltaY;

        // Clamp to canvas bounds
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);

        // Smart guides: snap to the canvas basics (edges, center, quarters)
        if (guidesEnabledRef.current && !multiSelectRef.current) {
          // Use the actual rendered size so both axes snap to the real visual box
          const mw = el.offsetWidth || elementWidthRef.current;
          const mh = el.offsetHeight || elementHeightRef.current;
          const snap = computeGuides(
            newX,
            newY,
            mw,
            mh,
            canvasWidthRef.current,
            canvasHeightRef.current,
            directionRef.current === 'rtl'
          );
          newX = snap.x;
          newY = snap.y;
          onGuidesChangeRef.current?.(snap.guides);
        } else {
          onGuidesChangeRef.current?.({ v: [], h: [] });
        }

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
        const currentAngle = Math.atan2(pt.y - centerY, pt.x - centerX) * (180 / Math.PI);
        let newRotation = angle + (currentAngle - startAngle);
        
        // Snap to 15 degree increments when holding Shift
        if (pt.shiftKey) {
          newRotation = Math.round(newRotation / 15) * 15;
        }
        
        el.style.transform = `rotate(${newRotation}deg)`;
        currentPosRef.current.rotation = newRotation;
      }

      if (isResizingRef.current && resizeDirectionRef.current && resizeDirectionRef.current !== 'rotate') {
        const deltaX = (pt.x - resizeStartRef.current.x) / scale;
        const deltaY = (pt.y - resizeStartRef.current.y) / scale;
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

        // Snap the resized edges to the canvas basics on both axes (very precise)
        if (guidesEnabledRef.current && !multiSelectRef.current) {
          const snap = snapResize(
            direction,
            Math.max(0, newX),
            Math.max(0, newY),
            newWidth,
            newHeight,
            canvasWidthRef.current,
            canvasHeightRef.current,
            directionRef.current === 'rtl'
          );
          newX = snap.x;
          newY = snap.y;
          newWidth = snap.w;
          newHeight = snap.h;
          onGuidesChangeRef.current?.(snap.guides);
        } else {
          onGuidesChangeRef.current?.({ v: [], h: [] });
        }

        // Text boxes are auto-height: never move them vertically while resizing;
        // the height always follows the reflowed content instead of the pointer
        if (elementTypeRef.current === 'text') {
          newY = startY;
        }

        el.style.left = `${Math.max(0, newX)}px`;
        el.style.top = `${Math.max(0, newY)}px`;
        el.style.width = `${newWidth}px`;
        if (elementTypeRef.current === 'text') {
          // Text scales its font with the width and lets the height follow the
          // reflowed content, so the selection box always hugs the text exactly
          el.style.height = 'auto';
          el.style.minHeight = '0px';
          el.style.maxWidth = 'none';
        } else {
          el.style.height = `${newHeight}px`;
        }

        // For text the rendered height is the content height, not the pointer position
        const appliedHeight = elementTypeRef.current === 'text' && el ? el.offsetHeight : newHeight;
        currentPosRef.current = { ...currentPosRef.current, x: Math.max(0, newX), y: Math.max(0, newY), width: newWidth, height: appliedHeight };
        setCurrentDimensionsRef.current({ width: Math.round(newWidth), height: Math.round(appliedHeight) });

        // Text font scales with the width ratio so the text fills the new box
        if (elementTypeRef.current === 'text') {
          const scaleX = newWidth / initialSizeRef.current.width;
          setLiveScaleRef.current(scaleX);
        }
      }
    };

    const handleMouseUp = () => {
      if (isResizingRef.current || isRotatingRef.current) {
        const pos = currentPosRef.current;
        
        // For text elements, update fontSize from the width ratio and store the
        // real rendered height so the selection box always matches the text
        if (elementTypeRef.current === 'text' && isResizingRef.current) {
          const scaleX = pos.width / initialSizeRef.current.width;
          const newFontSize = Math.max(8, Math.round(currentFontSizeRef.current * scaleX));
          
          const el = elementRef.current;
          let finalHeight = pos.height;
          if (el) {
            const textEl = el.querySelector<HTMLElement>('[data-text-content]');
            if (textEl) textEl.style.fontSize = `${newFontSize}px`;
            el.style.height = 'auto';
            el.style.minHeight = '0px';
            el.style.maxWidth = 'none';
            finalHeight = el.offsetHeight;
          }
          
          onUpdateRef.current({
            x: Math.round(pos.x),
            y: Math.round(pos.y),
            width: Math.round(pos.width),
            height: Math.round(finalHeight),
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

      // Clear any active guide lines
      onGuidesChangeRef.current?.({ v: [], h: [] });
      
      // Hide dimensions after a short delay
      setTimeout(() => {
        setShowDimensionsRef.current(false);
      }, 500);
      
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handlePointerMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);
    document.addEventListener('touchcancel', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('touchend', handleMouseUp);
      document.removeEventListener('touchcancel', handleMouseUp);
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

  // Auto-grow the textarea so the full text is always visible while editing
  const resizeTextarea = useCallback((ta: HTMLTextAreaElement) => {
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight + 2}px`;
  }, []);

  useEffect(() => {
    if (isEditing && element.type === 'text' && textareaRef.current) {
      resizeTextarea(textareaRef.current);
      textareaRef.current.focus();
    }
  }, [isEditing, element.content, element.type, resizeTextarea]);

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
            className="relative"
            style={{ userSelect: 'text', width: 'max-content', maxWidth: 'none', minWidth: 120, height: 'auto' }}
          >
            <textarea
              ref={textareaRef}
              autoFocus
              value={element.content || ''}
              onChange={(e) => {
                onUpdate({ content: e.target.value });
                resizeTextarea(e.target);
              }}
              onPaste={(e) => {
                handlePasteEvent(e);
                requestAnimationFrame(() => {
                  if (textareaRef.current) resizeTextarea(textareaRef.current);
                });
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onBlur={(e) => {
                // Don't blur if clicking on paste button
                const relatedTarget = e.relatedTarget as HTMLElement;
                if (relatedTarget?.closest('[data-paste-button]')) {
                  return;
                }
                handleBlur();
              }}
              className="bg-transparent border border-dashed border-primary/40 rounded outline-none p-2 resize-none"
              style={{ ...textStyles, userSelect: 'text', cursor: 'text', overflow: 'hidden', minHeight: 24 }}
            />
            {/* Paste Button */}
            <button
              data-paste-button
              tabIndex={0}
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await handlePasteFromClipboard();
                requestAnimationFrame(() => {
                  if (textareaRef.current) resizeTextarea(textareaRef.current);
                });
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
          <div data-text-content className="whitespace-pre-wrap flex flex-col" style={{ ...textStyles, ...getVerticalAlignStyles(element.verticalAlign), padding: '4px 8px' }}>
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
        if (element.border) {
          shapeStyles.background = 'transparent';
          shapeStyles.border = `${element.border.width}px ${element.border.style} ${element.border.color}`;
        }
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
        width: element.type === 'text' ? (isEditing ? 'max-content' : element.width) : element.width,
        height: element.type === 'text' ? (isEditing ? 'auto' : 'auto') : element.height,
        maxWidth: element.type === 'text' && isEditing ? 'none' : undefined,
        minHeight: element.type === 'text' && !isEditing ? element.height : undefined,
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
        touchAction: 'none',
      }}
      onMouseDown={isEditing ? undefined : handleMouseDown}
      onTouchStart={isEditing ? undefined : handleMouseDown}
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
            onTouchStart={(e) => handleResizeStart(e, 'rotate')}
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
            onTouchStart={(e) => handleResizeStart(e, 'se')} 
          />
          <div 
            className="absolute -left-2 -bottom-2 w-4 h-4 bg-white border-2 border-black rounded-full cursor-sw-resize hover:bg-black hover:scale-125 transition-all duration-200 shadow-sm" 
            style={{ zIndex: 1001 }}
            onMouseDown={(e) => handleResizeStart(e, 'sw')} 
            onTouchStart={(e) => handleResizeStart(e, 'sw')} 
          />
          <div 
            className="absolute -right-2 -top-2 w-4 h-4 bg-white border-2 border-black rounded-full cursor-ne-resize hover:bg-black hover:scale-125 transition-all duration-200 shadow-sm" 
            style={{ zIndex: 1001 }}
            onMouseDown={(e) => handleResizeStart(e, 'ne')} 
            onTouchStart={(e) => handleResizeStart(e, 'ne')} 
          />
          <div 
            className="absolute -left-2 -top-2 w-4 h-4 bg-white border-2 border-black rounded-full cursor-nw-resize hover:bg-black hover:scale-125 transition-all duration-200 shadow-sm" 
            style={{ zIndex: 1001 }}
            onMouseDown={(e) => handleResizeStart(e, 'nw')} 
            onTouchStart={(e) => handleResizeStart(e, 'nw')} 
          />
          
          {/* Edge handles - pill shaped with hover effect */}
          {element.type !== 'text' && element.width > 60 && (
            <>
              <div 
                className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-8 h-3 bg-white border-2 border-black rounded-full cursor-n-resize hover:bg-black hover:scale-110 transition-all duration-200 shadow-sm" 
                style={{ zIndex: 1001 }}
                onMouseDown={(e) => handleResizeStart(e, 'n')} 
                onTouchStart={(e) => handleResizeStart(e, 'n')} 
              />
              <div 
                className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-8 h-3 bg-white border-2 border-black rounded-full cursor-s-resize hover:bg-black hover:scale-110 transition-all duration-200 shadow-sm" 
                style={{ zIndex: 1001 }}
                onMouseDown={(e) => handleResizeStart(e, 's')} 
                onTouchStart={(e) => handleResizeStart(e, 's')} 
              />
            </>
          )}
          {element.height > 60 && (
            <>
              <div 
                className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-8 bg-white border-2 border-black rounded-full cursor-e-resize hover:bg-black hover:scale-110 transition-all duration-200 shadow-sm" 
                style={{ zIndex: 1001 }}
                onMouseDown={(e) => handleResizeStart(e, 'e')} 
                onTouchStart={(e) => handleResizeStart(e, 'e')} 
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-8 bg-white border-2 border-black rounded-full cursor-w-resize hover:bg-black hover:scale-110 transition-all duration-200 shadow-sm" 
                style={{ zIndex: 1001 }}
                onMouseDown={(e) => handleResizeStart(e, 'w')} 
                onTouchStart={(e) => handleResizeStart(e, 'w')} 
              />
            </>
          )}
        </>
      )}
    </div>
  );
};
