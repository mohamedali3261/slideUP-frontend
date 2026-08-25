import { useRef, useCallback, useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SlideTemplate, SlideElement } from '@/data/templates';
import { DraggableElement } from './DraggableElement';
import { CanvasContextMenu } from './CanvasContextMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Maximize2, ZoomIn, ZoomOut, PanelLeft, PanelRight, Magnet } from 'lucide-react';
import { toast } from 'sonner';

// Custom icon storage key (same as IconLibrary)
const CUSTOM_ICONS_KEY = 'slideforge_custom_icons';

interface SlideCanvasProps {
  slide: SlideTemplate;
  onTitleChange: (title: string) => void;
  onSubtitleChange: (subtitle: string) => void;
  onContentChange: (content: string[]) => void;
  onElementsChange?: (elements: SlideElement[]) => void;
  selectedElementId: string | null;
  selectedElementIds?: string[];
  onSelectElement: (id: string | null) => void;
  onSelectElements?: (ids: string[]) => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  canvasWidth?: number;
  canvasHeight?: number;
  showRulers?: boolean;
  showGuides?: boolean;
  onToggleRulers?: () => void;
  onToggleGuides?: () => void;
  showSlidesPanel?: boolean;
  showPropertiesPanel?: boolean;
  onToggleSlidesPanel?: () => void;
  onTogglePropertiesPanel?: () => void;
}

export const SlideCanvas = ({
  slide,
  onTitleChange,
  onSubtitleChange,
  onContentChange,
  onElementsChange,
  selectedElementId,
  selectedElementIds = [],
  onSelectElement,
  onSelectElements,
  zoom = 100,
  onZoomChange,
  canvasWidth: propCanvasWidth = 960,
  canvasHeight: propCanvasHeight = 540,
  showRulers = false,
  showGuides = true,
  onToggleRulers,
  onToggleGuides,
  showSlidesPanel,
  showPropertiesPanel,
  onToggleSlidesPanel,
  onTogglePropertiesPanel,
}: SlideCanvasProps) => {
  const { direction, language } = useLanguage();
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: propCanvasWidth, height: propCanvasHeight });
  
  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  // Touch handling: guards against synthetic mouse events fired after touch
  const touchActiveRef = useRef(false);
  const panMovedRef = useRef(false);
  const suppressClickRef = useRef(false);
  // Pinch zoom + double-tap zoom state
  const pinchStartRef = useRef({ distance: 0, zoom: zoom });
  const lastTapRef = useRef({ time: 0, x: 0, y: 0 });
  // Anchored zoom: keeps the point under the fingers/cursor fixed while zooming
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const appliedZoomRef = useRef(zoom);
  const pinchGestureRef = useRef({
    active: false,
    startZoom: 100,
    layoutPos: { x: 0, y: 0 },
    anchor: { x: 0, y: 0 },
    screenPoint: { x: 0, y: 0 },
  });
  // Long-press to open the context menu on touch devices
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  
  // Multi-select state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; isOpen: boolean }>({ x: 0, y: 0, isOpen: false });
  const [clipboard, setClipboard] = useState<SlideElement | null>(null);

  // Smart alignment guides (reported by the dragged element, drawn on the canvas)
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });
  // Cursor marker positions on the rulers (screen coords)
  const [rulerMarker, setRulerMarker] = useState<{ hx: number; vy: number; active: boolean }>({ hx: 0, vy: 0, active: false });
  const hRulerRef = useRef<HTMLDivElement>(null);
  const vRulerRef = useRef<HTMLDivElement>(null);

  // Keep zoom ref updated
  useEffect(() => {
    zoomRef.current = zoom;
    appliedZoomRef.current = zoom;
  }, [zoom]);

  // Zoom to `newZoomPercent` while keeping the content point under `screenPoint`
  // (relative to the canvas-area element) visually fixed — smooth pinch/wheel zooming
  const applyAnchoredZoom = useCallback((newZoomPercent: number, gesture: { startZoom: number; layoutPos: { x: number; y: number }; anchor: { x: number; y: number }; screenPoint: { x: number; y: number } }) => {
    const clamped = Math.min(200, Math.max(25, Math.round(newZoomPercent * 10) / 10));
    if (Math.abs(clamped - appliedZoomRef.current) < 0.05) return;
    const z0 = gesture.startZoom / 100;
    const z1 = clamped / 100;
    // The sized wrapper is flex-centered: its layout x shifts by -W/2 per unit scale change, y stays fixed
    const layoutX1 = gesture.layoutPos.x - (propCanvasWidth * (z1 - z0)) / 2;
    const pan1 = {
      x: gesture.screenPoint.x - layoutX1 - gesture.anchor.x * z1,
      y: gesture.screenPoint.y - gesture.layoutPos.y - gesture.anchor.y * z1,
    };
    setPanOffset(pan1);
    appliedZoomRef.current = clamped;
    zoomRef.current = clamped;
    onZoomChange?.(clamped);
  }, [propCanvasWidth, onZoomChange]);

  // Capture the anchor for a zoom gesture at a screen point
  const captureZoomAnchor = useCallback((clientX: number, clientY: number) => {
    const areaEl = canvasAreaRef.current;
    const wrapEl = wrapperRef.current;
    if (!areaEl || !wrapEl) return null;
    const areaRect = areaEl.getBoundingClientRect();
    const wrapRect = wrapEl.getBoundingClientRect();
    const screenPoint = { x: clientX - areaRect.left, y: clientY - areaRect.top };
    const layoutPos = { x: wrapRect.left - areaRect.left, y: wrapRect.top - areaRect.top };
    const z0 = zoomRef.current / 100;
    const anchor = {
      x: (screenPoint.x - layoutPos.x - panOffset.x) / z0,
      y: (screenPoint.y - layoutPos.y - panOffset.y) / z0,
    };
    return { startZoom: zoomRef.current, layoutPos, anchor, screenPoint };
  }, [panOffset]);

  // Auto-fit canvas to available space on mount and panel changes
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current && onZoomChange) {
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Skip if container is too small (not yet rendered)
        if (containerWidth < 100 || containerHeight < 100) return;

        // Use full available space with minimal padding
        const padding = 20; // minimal padding
        const availableWidth = containerWidth - padding;
        const availableHeight = containerHeight - padding;

        // Calculate the scale to fit the canvas in the container
        const scaleX = availableWidth / propCanvasWidth;
        const scaleY = availableHeight / propCanvasHeight;
        const scale = Math.min(scaleX, scaleY); // Allow scaling up to fill space

        // Calculate the zoom percentage
        const autoZoom = Math.max(25, Math.floor(scale * 100));

        // Update zoom
        onZoomChange(autoZoom);

        // Reset pan offset
        setPanOffset({ x: 0, y: 0 });
      }
    };

    // Delay initial calculation to ensure container is rendered
    const timer = setTimeout(updateCanvasSize, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [propCanvasWidth, propCanvasHeight, onZoomChange, showSlidesPanel, showPropertiesPanel]);

  // Handle Space key for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle pan mouse events
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (touchActiveRef.current) {
      // Synthetic mouse event fired after a touch gesture - ignore it
      touchActiveRef.current = false;
      return;
    }
    if (isSpacePressed || e.button === 1) { // Space + click or middle mouse
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, offsetX: panOffset.x, offsetY: panOffset.y };
    } else if (e.button === 0) {
      // Left click - start selection if clicking on empty area
      const target = e.target as HTMLElement;
      const isCanvas = target.id === 'slide-canvas' || target === containerRef.current || target.closest('[data-canvas-area]');
      const isElement = target.closest('[data-element-id]');
      
      if (isCanvas && !isElement && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const scale = zoom / 100;
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;
        setIsSelecting(true);
        setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
      }
    }
  }, [isSpacePressed, panOffset, zoom]);

  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPanOffset({ x: panStartRef.current.offsetX + dx, y: panStartRef.current.offsetY + dy });
    }
  }, [isPanning]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Touch panning (mobile): one-finger drag on empty canvas area pans the canvas
  const handleTouchPanStart = useCallback((e: React.TouchEvent) => {
    touchActiveRef.current = true;
    panMovedRef.current = false;

    // Two fingers down - start pinch zoom (disables one-finger pan)
    if (e.touches.length === 2) {
      setIsPanning(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const distance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      pinchStartRef.current = {
        distance,
        zoom: zoomRef.current,
      };
      // Anchor the zoom at the pinch midpoint so content stays under the fingers
      const gesture = captureZoomAnchor((t1.clientX + t2.clientX) / 2, (t1.clientY + t2.clientY) / 2);
      if (gesture) {
        pinchGestureRef.current = { active: true, ...gesture };
      } else {
        pinchGestureRef.current.active = false;
      }
      return;
    }

    const target = e.target as HTMLElement;
    const isInteractive = !!target.closest('[data-element-id], input, textarea, button, a, [contenteditable]');
    const isCanvasArea = !!target.closest('[data-canvas-area]') || target.id === 'slide-canvas';

    if (e.touches.length !== 1 || !isCanvasArea || isInteractive) {
      return;
    }

    const touch = e.touches[0];
    setIsPanning(true);
    panStartRef.current = { x: touch.clientX, y: touch.clientY, offsetX: panOffset.x, offsetY: panOffset.y };
  }, [panOffset, captureZoomAnchor]);

  const handleTouchPanMove = useCallback((e: React.TouchEvent) => {
    // Pinch zoom with two fingers — anchored at the pinch midpoint
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const distance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const startDistance = pinchStartRef.current.distance || 1;
      const ratio = distance / startDistance;
      const g = pinchGestureRef.current;
      if (g.active) {
        applyAnchoredZoom(g.startZoom * ratio, g);
      } else {
        const newZoom = Math.min(200, Math.max(25, Math.round(pinchStartRef.current.zoom * ratio)));
        if (newZoom !== zoomRef.current && onZoomChange) {
          onZoomChange(newZoom);
        }
      }
      return;
    }

    if (!isPanning || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - panStartRef.current.x;
    const dy = touch.clientY - panStartRef.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      panMovedRef.current = true;
    }
    setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    panStartRef.current.x = touch.clientX;
    panStartRef.current.y = touch.clientY;
  }, [isPanning, onZoomChange, applyAnchoredZoom]);

  const handleTouchPanEnd = useCallback((e: React.TouchEvent) => {
    setIsPanning(false);
    // Pinch just ended but one finger is still down -> resume panning seamlessly
    if (e.touches.length === 1) {
      const t = e.touches[0];
      setIsPanning(true);
      panStartRef.current = { x: t.clientX, y: t.clientY, offsetX: panOffset.x, offsetY: panOffset.y };
    }
    // Double-tap to zoom in/out (only for clean taps that didn't move) — anchored at the tap
    if (e.touches.length === 0 && e.changedTouches.length === 1 && !panMovedRef.current) {
      const t = e.changedTouches[0];
      const now = Date.now();
      const last = lastTapRef.current;
      if (now - last.time < 300 && Math.abs(t.clientX - last.x) < 40 && Math.abs(t.clientY - last.y) < 40 && onZoomChange) {
        const gesture = captureZoomAnchor(t.clientX, t.clientY);
        if (gesture) {
          const target = zoomRef.current >= 100
            ? Math.max(25, zoomRef.current - 30)
            : Math.min(200, zoomRef.current + 30);
          applyAnchoredZoom(target, gesture);
        } else {
          onZoomChange(zoomRef.current >= 100 ? Math.max(25, zoomRef.current - 30) : Math.min(200, zoomRef.current + 30));
        }
        lastTapRef.current = { time: 0, x: 0, y: 0 };
      } else {
        lastTapRef.current = { time: now, x: t.clientX, y: t.clientY };
      }
    }
    // Keep the touch guard active briefly so the synthetic mousedown gets ignored
    setTimeout(() => { touchActiveRef.current = false; }, 400);
    // Suppress the synthetic click that follows a pan so it doesn't deselect
    if (panMovedRef.current) {
      suppressClickRef.current = true;
      setTimeout(() => { suppressClickRef.current = false; }, 600);
    }
    panMovedRef.current = false;
  }, [onZoomChange, panOffset, captureZoomAnchor, applyAnchoredZoom]);

  // Long-press on canvas/elements opens the context menu (mobile has no right-click)
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchStartCapture = useCallback((e: React.TouchEvent) => {
    clearLongPressTimer();
    longPressTriggeredRef.current = false;

    const target = e.target as HTMLElement;
    const isControl = !!target.closest('button, input, textarea, select, a, [role="button"], [contenteditable]');
    if (isControl || e.touches.length !== 1) return;

    const t = e.touches[0];
    const clientX = t.clientX;
    const clientY = t.clientY;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setIsPanning(false);
      // Ignore the synthetic mouse events that follow the long-press
      touchActiveRef.current = true;
      suppressClickRef.current = true;
      setTimeout(() => { suppressClickRef.current = false; }, 600);
      setContextMenu({ x: clientX, y: clientY, isOpen: true });
    }, 550);
  }, [clearLongPressTimer]);

  const handleTouchEndLongPress = useCallback((e: React.TouchEvent) => {
    clearLongPressTimer();
    // A long-press should never be interpreted as a double-tap zoom
    if (longPressTriggeredRef.current && e.touches.length === 0) {
      lastTapRef.current = { time: 0, x: 0, y: 0 };
    }
  }, [clearLongPressTimer]);

  // Fit to screen
  const handleFitToScreen = useCallback(() => {
    setPanOffset({ x: 0, y: 0 });
    if (onZoomChange && containerRef.current) {
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // Calculate the scale to fit the canvas in the container with padding
      const padding = 40;
      const availableWidth = containerWidth - padding;
      const availableHeight = containerHeight - padding;
      
      const scaleX = availableWidth / propCanvasWidth;
      const scaleY = availableHeight / propCanvasHeight;
      const scale = Math.min(scaleX, scaleY, 1);
      
      const autoZoom = Math.floor(scale * 100);
      onZoomChange(autoZoom);
    }
  }, [onZoomChange, propCanvasWidth, propCanvasHeight]);

  // Handle wheel zoom - anchored at the cursor so content stays under it
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (!onZoomChange) return;
    const step = e.ctrlKey || e.metaKey ? -e.deltaY * 0.01 : (e.deltaY > 0 ? -2 : 2);
    const targetZoom = Math.min(200, Math.max(25, zoomRef.current + step));
    if (Math.abs(targetZoom - appliedZoomRef.current) < 0.05) return;
    const gesture = captureZoomAnchor(e.clientX, e.clientY);
    if (gesture) {
      applyAnchoredZoom(targetZoom, gesture);
    } else {
      onZoomChange(targetZoom);
    }
  }, [onZoomChange, captureZoomAnchor, applyAnchoredZoom]);

  // Add wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Multi-select box handlers (now integrated in handlePanStart)
  const handleSelectionMove = useCallback((e: React.MouseEvent) => {
    if (isSelecting && selectionBox && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scale = zoom / 100;
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      setSelectionBox(prev => prev ? { ...prev, endX: x, endY: y } : null);
    }
  }, [isSelecting, selectionBox, zoom]);

  const handleSelectionEnd = useCallback(() => {
    if (isSelecting && selectionBox && slide.elements) {
      const minX = Math.min(selectionBox.startX, selectionBox.endX);
      const maxX = Math.max(selectionBox.startX, selectionBox.endX);
      const minY = Math.min(selectionBox.startY, selectionBox.endY);
      const maxY = Math.max(selectionBox.startY, selectionBox.endY);
      
      const selectedIds = slide.elements
        .filter(el => {
          const elRight = el.x + el.width;
          const elBottom = el.y + el.height;
          return el.x < maxX && elRight > minX && el.y < maxY && elBottom > minY;
        })
        .map(el => el.id);
      
      if (onSelectElements) {
        onSelectElements(selectedIds);
      }
      if (selectedIds.length === 0) {
        onSelectElement(null);
      }
    }
    setIsSelecting(false);
    setSelectionBox(null);
  }, [isSelecting, selectionBox, slide.elements, onSelectElements, onSelectElement]);

  // Track cursor on the canvas to update the ruler markers
  const handleCanvasHover = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const hr = hRulerRef.current?.getBoundingClientRect();
    const vr = vRulerRef.current?.getBoundingClientRect();
    setRulerMarker({
      active: true,
      hx: hr ? Math.min(hr.width, Math.max(0, e.clientX - hr.left)) : 0,
      vy: vr ? Math.min(vr.height, Math.max(0, e.clientY - vr.top)) : 0,
    });
  }, []);

  const clearRulerMarker = useCallback(() => {
    setRulerMarker(prev => ({ ...prev, active: false }));
  }, []);

  useEffect(() => {
    // Set canvas to actual size
    setCanvasDimensions({ 
      width: propCanvasWidth, 
      height: propCanvasHeight 
    });
  }, [propCanvasWidth, propCanvasHeight]);

  const handleContentItemChange = (index: number, value: string) => {
    if (slide.content) {
      const newContent = [...slide.content];
      newContent[index] = value;
      onContentChange(newContent);
    }
  };

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-slide-content]')) {
      onSelectElement(null);
      if (onSelectElements) {
        onSelectElements([]);
      }
    }
  }, [onSelectElement, onSelectElements]);

  const handleElementUpdate = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    if (!slide.elements || !onElementsChange) return;
    
    // Check if we're moving an element that's part of multi-selection
    const isMultiSelected = selectedElementIds.includes(elementId) && selectedElementIds.length > 1;
    
    // If moving (x or y changed) and element is part of multi-selection, move all selected elements
    if (isMultiSelected && (updates.x !== undefined || updates.y !== undefined)) {
      const currentElement = slide.elements.find(el => el.id === elementId);
      if (!currentElement) return;
      
      // Calculate the delta (how much the element moved)
      const deltaX = updates.x !== undefined ? updates.x - currentElement.x : 0;
      const deltaY = updates.y !== undefined ? updates.y - currentElement.y : 0;
      
      // Apply delta to all selected elements
      const newElements = slide.elements.map(el => {
        if (selectedElementIds.includes(el.id)) {
          return {
            ...el,
            x: el.x + deltaX,
            y: el.y + deltaY,
          };
        }
        return el;
      });
      onElementsChange(newElements);
    } else {
      // Single element update
      const newElements = slide.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      );
      onElementsChange(newElements);
    }
  }, [slide.elements, onElementsChange, selectedElementIds]);

  const handleElementDelete = useCallback((elementId: string) => {
    if (!slide.elements || !onElementsChange) return;
    
    const newElements = slide.elements.filter(el => el.id !== elementId);
    onElementsChange(newElements);
    onSelectElement(null);
  }, [slide.elements, onElementsChange, onSelectElement]);

  // Context Menu Handlers
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, isOpen: true });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  }, []);

  const selectedElement = slide.elements?.find(el => el.id === selectedElementId) || null;

  const handleCopy = useCallback(() => {
    if (selectedElement) {
      setClipboard({ ...selectedElement });
    }
  }, [selectedElement]);

  const handleCut = useCallback(() => {
    if (selectedElement && slide.elements && onElementsChange) {
      setClipboard({ ...selectedElement });
      const newElements = slide.elements.filter(el => el.id !== selectedElement.id);
      onElementsChange(newElements);
      onSelectElement(null);
    }
  }, [selectedElement, slide.elements, onElementsChange, onSelectElement]);

  const handlePaste = useCallback(() => {
    if (clipboard && slide.elements && onElementsChange) {
      const newElement: SlideElement = {
        ...clipboard,
        id: `${clipboard.type}-${Date.now()}`,
        x: clipboard.x + 20,
        y: clipboard.y + 20,
      };
      onElementsChange([...slide.elements, newElement]);
      onSelectElement(newElement.id);
    }
  }, [clipboard, slide.elements, onElementsChange, onSelectElement]);

  const handleDuplicate = useCallback(() => {
    if (selectedElement && slide.elements && onElementsChange) {
      const newElement: SlideElement = {
        ...selectedElement,
        id: `${selectedElement.type}-${Date.now()}`,
        x: selectedElement.x + 20,
        y: selectedElement.y + 20,
      };
      onElementsChange([...slide.elements, newElement]);
      onSelectElement(newElement.id);
    }
  }, [selectedElement, slide.elements, onElementsChange, onSelectElement]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedElementId) {
      handleElementDelete(selectedElementId);
    }
  }, [selectedElementId, handleElementDelete]);

  const handleBringToFront = useCallback(() => {
    if (selectedElement && slide.elements && onElementsChange) {
      const maxZIndex = Math.max(...slide.elements.map(el => el.zIndex || 0));
      const newElements = slide.elements.map(el =>
        el.id === selectedElement.id ? { ...el, zIndex: maxZIndex + 1 } : el
      );
      onElementsChange(newElements);
    }
  }, [selectedElement, slide.elements, onElementsChange]);

  const handleSendToBack = useCallback(() => {
    if (selectedElement && slide.elements && onElementsChange) {
      const minZIndex = Math.min(...slide.elements.map(el => el.zIndex || 0));
      const newElements = slide.elements.map(el =>
        el.id === selectedElement.id ? { ...el, zIndex: minZIndex - 1 } : el
      );
      onElementsChange(newElements);
    }
  }, [selectedElement, slide.elements, onElementsChange]);

  const handleSelectAll = useCallback(() => {
    if (slide.elements && onSelectElements) {
      onSelectElements(slide.elements.map(el => el.id));
    }
  }, [slide.elements, onSelectElements]);

  // Add element to custom icons
  const handleAddToCustomIcons = useCallback(async () => {
    if (!selectedElement) return;

    const { language: lang } = direction === 'rtl' ? { language: 'ar' } : { language: 'en' };

    // Get the image URL based on element type
    let imageUrl: string | null = null;
    let iconName = '';

    if (selectedElement.type === 'image' && selectedElement.imageUrl) {
      imageUrl = selectedElement.imageUrl;
      iconName = 'Custom Image';
    } else if (selectedElement.type === 'icon' && selectedElement.iconConfig) {
      // For icons, we need to handle differently - either custom image or lucide icon
      if (selectedElement.iconConfig.customImageUrl) {
        imageUrl = selectedElement.iconConfig.customImageUrl;
        iconName = selectedElement.iconConfig.name || 'Custom Icon';
      } else {
        // For Lucide icons, convert the SVG to data URL
        try {
          // Find the icon element in the DOM
          const iconElement = document.querySelector(`[data-element-id="${selectedElement.id}"] svg`);
          if (!iconElement) {
            toast.error(lang === 'ar' ? 'لا يمكن العثور على الأيقونة' : 'Cannot find icon element');
            return;
          }

          // Clone the SVG and apply styles
          const svgClone = iconElement.cloneNode(true) as SVGElement;
          const config = selectedElement.iconConfig;
          
          // Set SVG attributes
          svgClone.setAttribute('width', String(config.size || 48));
          svgClone.setAttribute('height', String(config.size || 48));
          svgClone.setAttribute('viewBox', '0 0 24 24');
          svgClone.setAttribute('fill', 'none');
          svgClone.setAttribute('stroke', config.color || '#000000');
          svgClone.setAttribute('stroke-width', String(config.strokeWidth || 2));
          svgClone.setAttribute('stroke-linecap', 'round');
          svgClone.setAttribute('stroke-linejoin', 'round');
          
          // If there's a background, wrap in a rect
          if (config.backgroundColor) {
            const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            wrapper.setAttribute('width', String(config.size + 24));
            wrapper.setAttribute('height', String(config.size + 24));
            wrapper.setAttribute('viewBox', `0 0 ${config.size + 24} ${config.size + 24}`);
            
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('width', String(config.size + 24));
            rect.setAttribute('height', String(config.size + 24));
            rect.setAttribute('rx', String(config.backgroundRadius || 0));
            rect.setAttribute('fill', config.backgroundColor);
            
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('transform', `translate(12, 12) rotate(${config.rotation || 0} ${config.size / 2} ${config.size / 2})`);
            g.appendChild(svgClone);
            
            wrapper.appendChild(rect);
            wrapper.appendChild(g);
            
            const svgString = new XMLSerializer().serializeToString(wrapper);
            imageUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
          } else {
            // Apply rotation if needed
            if (config.rotation) {
              const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              g.setAttribute('transform', `rotate(${config.rotation} 12 12)`);
              const paths = Array.from(svgClone.children);
              paths.forEach(path => g.appendChild(path));
              svgClone.innerHTML = '';
              svgClone.appendChild(g);
            }
            
            const svgString = new XMLSerializer().serializeToString(svgClone);
            imageUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
          }
          
          iconName = config.name || 'Lucide Icon';
        } catch (error) {
          console.error('Error converting Lucide icon:', error);
          toast.error(lang === 'ar' ? 'فشل في تحويل الأيقونة' : 'Failed to convert icon');
          return;
        }
      }
    }

    if (!imageUrl) {
      toast.error(lang === 'ar' ? 'لا يمكن إضافة هذا العنصر' : 'Cannot add this element');
      return;
    }

    // Load existing custom icons
    let customIcons = [];
    try {
      const data = localStorage.getItem(CUSTOM_ICONS_KEY);
      customIcons = data ? JSON.parse(data) : [];
    } catch {
      customIcons = [];
    }

    // Add new icon
    const newIcon = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: iconName,
      dataUrl: imageUrl,
      createdAt: Date.now(),
    };

    customIcons.push(newIcon);

    // Save to localStorage
    try {
      localStorage.setItem(CUSTOM_ICONS_KEY, JSON.stringify(customIcons));
      // Trigger storage event manually for same-window updates
      window.dispatchEvent(new Event('storage'));
      toast.success(lang === 'ar' ? 'تمت الإضافة للإضافات!' : 'Added to Custom!');
    } catch (e) {
      toast.error(lang === 'ar' ? 'فشل في الحفظ' : 'Failed to save');
    }
  }, [selectedElement, direction]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            e.preventDefault();
            handleCopy();
            break;
          case 'x':
            e.preventDefault();
            handleCut();
            break;
          case 'v':
            e.preventDefault();
            handlePaste();
            break;
          case 'd':
            e.preventDefault();
            handleDuplicate();
            break;
          case 'a':
            e.preventDefault();
            handleSelectAll();
            break;
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCopy, handleCut, handlePaste, handleDuplicate, handleSelectAll, handleDeleteSelected]);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col bg-muted/30 overflow-hidden"
      style={{ cursor: isSpacePressed ? 'grab' : isPanning ? 'grabbing' : 'default' }}
      onMouseDown={handlePanStart}
      onMouseMove={(e) => { handlePanMove(e); handleSelectionMove(e); }}
      onMouseUp={() => { handlePanEnd(); handleSelectionEnd(); }}
      onMouseLeave={() => { handlePanEnd(); handleSelectionEnd(); }}
      onTouchStart={handleTouchPanStart}
      onTouchMove={handleTouchPanMove}
      onTouchEnd={handleTouchPanEnd}
      onTouchCancel={handleTouchPanEnd}
      onTouchStartCapture={handleTouchStartCapture}
      onTouchMoveCapture={clearLongPressTimer}
      onTouchEndCapture={handleTouchEndLongPress}
      onTouchCancelCapture={handleTouchEndLongPress}
      onContextMenu={handleContextMenu}
    >
      {/* Context Menu */}
      <CanvasContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isOpen={contextMenu.isOpen}
        onClose={closeContextMenu}
        selectedElement={selectedElement}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onCut={handleCut}
        onDuplicate={handleDuplicate}
        onDelete={handleDeleteSelected}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onSelectAll={handleSelectAll}
        canPaste={!!clipboard}
        onAddToCustomIcons={handleAddToCustomIcons}
      />

      {/* Toolbar - Fixed in Center */}
      <div className="relative flex items-center px-1.5 py-1 bg-background/80 backdrop-blur-sm border-b text-[10px] overflow-x-auto scrollbar-thin">
        <div className="flex items-center justify-center gap-1 flex-nowrap w-max min-w-full mx-auto">
        {/* Left Side - Guides Toggles */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {onToggleGuides && (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleGuides}
                  className={`p-1 rounded-md transition-colors ${
                    showGuides ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                  }`}
                  title={language === 'ar' ? 'خطوط المحاذاة الذكية' : 'Smart Guides'}
                >
                  <Magnet size={13} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-2 py-1 text-[10px] font-medium rounded-lg">
                <div className="flex items-center gap-1">
                  <Magnet className="w-2.5 h-2.5" />
                  {language === 'ar' ? 'إظهار/إخفاء خطوط المحاذاة الذكية' : 'Show/Hide Smart Guides'}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Center - Zoom Controls (Fixed) */}
        <div className="flex items-center gap-1 bg-muted/30 rounded-lg px-1.5 py-0.5 flex-shrink-0">
          {/* Zoom Out */}
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onZoomChange?.(Math.max(25, zoom - 10))}
                className="p-1 hover:bg-background rounded-md transition-colors"
              >
                <ZoomOut size={14} className="text-muted-foreground hover:text-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-2 py-1 text-[10px] font-medium rounded-lg">
              <div className="flex items-center gap-1">
                <ZoomOut className="w-2.5 h-2.5" />
                Zoom Out (Scroll Down)
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Zoom Level */}
          <span className="w-8 sm:w-12 text-center font-semibold text-[10px] sm:text-xs tabular-nums">{zoom}%</span>

          {/* Zoom In */}
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onZoomChange?.(Math.min(200, zoom + 10))}
                className="p-1 hover:bg-background rounded-md transition-colors"
              >
                <ZoomIn size={14} className="text-muted-foreground hover:text-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-2 py-1 text-[10px] font-medium rounded-lg">
              <div className="flex items-center gap-1">
                <ZoomIn className="w-2.5 h-2.5" />
                Zoom In (Scroll Up)
              </div>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-border mx-0.5" />

          {/* Fit to Screen */}
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                onClick={handleFitToScreen}
                className="p-1 hover:bg-background rounded-md transition-colors"
              >
                <Maximize2 size={14} className="text-muted-foreground hover:text-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-2 py-1 text-[10px] font-medium rounded-lg">
              <div className="flex items-center gap-1">
                <Maximize2 className="w-2.5 h-2.5" />
                Fit to Screen (Reset)
              </div>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-border mx-0.5" />

        </div>

        {/* Right Side - Panel Toggle Buttons - Hidden on mobile */}
        <div className="hidden sm:flex items-center gap-0.5 bg-muted/20 rounded-lg p-0.5 flex-shrink-0">
          {/* Toggle Slides Panel */}
          {onToggleSlidesPanel && (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleSlidesPanel}
                  className={`p-1 rounded hover:bg-background transition-colors ${
                    showSlidesPanel ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                  }`}
                  title={showSlidesPanel
                    ? (language === 'ar' ? 'إخفاء الشرائح' : 'Hide Slides')
                    : (language === 'ar' ? 'إظهار الشرائح' : 'Show Slides')
                  }
                >
                  <PanelLeft size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-2 py-1 text-[10px] font-medium rounded-lg">
                <div className="flex items-center gap-1">
                  <PanelLeft className="w-2.5 h-2.5" />
                  {showSlidesPanel
                    ? (language === 'ar' ? 'إخفاء الشرائح' : 'Hide Slides')
                    : (language === 'ar' ? 'إظهار الشرائح' : 'Show Slides')
                  }
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Toggle Properties Panel */}
          {onTogglePropertiesPanel && (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={onTogglePropertiesPanel}
                  className={`p-1.5 rounded hover:bg-background transition-colors ${
                    showPropertiesPanel ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                  }`}
                  title={showPropertiesPanel 
                    ? (language === 'ar' ? 'إخفاء الخصائص' : 'Hide Properties')
                    : (language === 'ar' ? 'إظهار الخصائص' : 'Show Properties')
                  }
                >
                  <PanelRight size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
                <div className="flex items-center gap-1.5">
                  <PanelRight className="w-3 h-3" />
                  {showPropertiesPanel 
                    ? (language === 'ar' ? 'إخفاء الخصائص' : 'Hide Properties')
                    : (language === 'ar' ? 'إظهار الخصائص' : 'Show Properties')
                  }
                </div>
              </TooltipContent>
            </Tooltip>
          )}
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex">
        {/* Vertical Ruler */}
        {showRulers && (
          <div ref={vRulerRef} className="relative w-6 bg-muted/50 border-r flex flex-col text-[8px] text-muted-foreground overflow-hidden">
            {Array.from({ length: Math.ceil(propCanvasHeight / 50) }).map((_, i) => (
              <div key={i} className="h-[50px] border-b border-muted-foreground/20 flex items-start justify-center pt-0.5" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
                {i * 50}
              </div>
            ))}
            {rulerMarker.active && (
              <div className="absolute left-0 right-0 pointer-events-none bg-primary/70" style={{ top: rulerMarker.vy, height: 1 }} />
            )}
          </div>
        )}

        <div className="flex-1 flex flex-col">
          {/* Horizontal Ruler */}
          {showRulers && (
            <div ref={hRulerRef} className="relative h-5 bg-muted/50 border-b flex text-[8px] text-muted-foreground overflow-hidden">
              {Array.from({ length: Math.ceil(propCanvasWidth / 50) }).map((_, i) => (
                <div key={i} className="w-[50px] border-r border-muted-foreground/20 flex items-center justify-start pl-0.5" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
                  {i * 50}
                </div>
              ))}
              {rulerMarker.active && (
                <div className="absolute top-0 bottom-0 pointer-events-none bg-primary/70" style={{ left: rulerMarker.hx, width: 1 }} />
              )}
            </div>
          )}

          {/* Main Canvas Container */}
          <div
            ref={canvasAreaRef}
            className="flex-1 flex items-start justify-center p-4 overflow-auto scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20"
            data-canvas-area
            style={{ touchAction: 'none' }}
            onMouseMove={handleCanvasHover}
            onMouseLeave={clearRulerMarker}
          >
            <div
              ref={wrapperRef}
              style={{
                width: propCanvasWidth * (zoom / 100),
                height: propCanvasHeight * (zoom / 100),
                position: 'relative',
                transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
              }}
            >
              <div
                ref={canvasRef}
                id="slide-canvas"
                className="absolute top-0 left-0 rounded-lg shadow-2xl overflow-hidden"
                style={{
                  background: slide.backgroundColor,
                  color: slide.textColor,
                  direction: direction,
                  width: propCanvasWidth,
                  height: propCanvasHeight,
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top left',
                }}
                onClick={handleCanvasClick}
              >

        {/* Static Slide Content - Only show when no elements exist */}
        {(!slide.elements || slide.elements.length === 0) && (
        <div data-slide-content className="absolute inset-0 p-8 md:p-12 flex flex-col pointer-events-none">
          {slide.type === 'cover' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center pointer-events-auto">
              <input
                type="text"
                value={slide.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-3xl md:text-5xl font-bold bg-transparent border-none outline-none text-center w-full focus:ring-2 focus:ring-primary/20 rounded px-2"
                style={{ color: 'inherit' }}
              />
              {slide.subtitle && (
                <input
                  type="text"
                  value={slide.subtitle}
                  onChange={(e) => onSubtitleChange(e.target.value)}
                  className="text-lg md:text-xl mt-4 bg-transparent border-none outline-none text-center w-full opacity-80 focus:ring-2 focus:ring-primary/20 rounded px-2"
                  style={{ color: 'inherit' }}
                />
              )}
            </div>
          )}

          {slide.type === 'content' && (
            <div className="flex-1 flex flex-col pointer-events-auto">
              <input
                type="text"
                value={slide.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-2xl md:text-4xl font-bold bg-transparent border-none outline-none w-full mb-8 focus:ring-2 focus:ring-primary/20 rounded px-2"
                style={{ color: 'inherit' }}
              />
              <div className="space-y-4 flex-1">
                {slide.content?.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: slide.textColor }}
                    />
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleContentItemChange(index, e.target.value)}
                      className="text-base md:text-lg bg-transparent border-none outline-none flex-1 focus:ring-2 focus:ring-primary/20 rounded px-2"
                      style={{ color: 'inherit' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide.type === 'chart' && (
            <div className="flex-1 flex flex-col pointer-events-auto">
              <input
                type="text"
                value={slide.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-2xl md:text-4xl font-bold bg-transparent border-none outline-none w-full mb-2 focus:ring-2 focus:ring-primary/20 rounded px-2"
                style={{ color: 'inherit' }}
              />
              {slide.subtitle && (
                <input
                  type="text"
                  value={slide.subtitle}
                  onChange={(e) => onSubtitleChange(e.target.value)}
                  className="text-base md:text-lg bg-transparent border-none outline-none w-full mb-8 opacity-70 focus:ring-2 focus:ring-primary/20 rounded px-2"
                  style={{ color: 'inherit' }}
                />
              )}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-lg h-48 flex items-end justify-around gap-4">
                  {[65, 80, 45, 90, 70].map((height, i) => (
                    <div
                      key={i}
                      className="w-12 rounded-t transition-all hover:opacity-80"
                      style={{
                        height: `${height}%`,
                        backgroundColor: slide.textColor,
                        opacity: 0.3 + (i * 0.15),
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {slide.type === 'thankyou' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center pointer-events-auto">
              <input
                type="text"
                value={slide.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-4xl md:text-6xl font-bold bg-transparent border-none outline-none text-center w-full focus:ring-2 focus:ring-primary/20 rounded px-2"
                style={{ color: 'inherit' }}
              />
              {slide.subtitle && (
                <input
                  type="text"
                  value={slide.subtitle}
                  onChange={(e) => onSubtitleChange(e.target.value)}
                  className="text-xl md:text-2xl mt-4 bg-transparent border-none outline-none text-center w-full opacity-80 focus:ring-2 focus:ring-primary/20 rounded px-2"
                  style={{ color: 'inherit' }}
                />
              )}
            </div>
          )}

          {/* Section Slide */}
          {slide.type === 'section' && (
            <div className="flex-1 flex items-center pointer-events-auto">
              <div className="w-1/3 h-full" style={{ backgroundColor: slide.textColor, opacity: 0.1 }} />
              <div className="flex-1 flex flex-col items-center justify-center px-8">
                <input
                  type="text"
                  value={slide.title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  className="text-3xl md:text-5xl font-bold bg-transparent border-none outline-none text-center w-full focus:ring-2 focus:ring-primary/20 rounded px-2"
                  style={{ color: 'inherit' }}
                />
                {slide.subtitle && (
                  <input
                    type="text"
                    value={slide.subtitle}
                    onChange={(e) => onSubtitleChange(e.target.value)}
                    className="text-lg md:text-xl mt-4 bg-transparent border-none outline-none text-center w-full opacity-70 focus:ring-2 focus:ring-primary/20 rounded px-2"
                    style={{ color: 'inherit' }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Image Slide */}
          {slide.type === 'image' && (
            <div className="flex-1 flex pointer-events-auto">
              <div className="w-1/2 flex items-center justify-center p-4" style={{ backgroundColor: slide.textColor, opacity: 0.05 }}>
                {slide.imageUrl ? (
                  <img src={slide.imageUrl} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center opacity-50" style={{ borderColor: slide.textColor }}>
                    <span className="text-sm">Image</span>
                  </div>
                )}
              </div>
              <div className="w-1/2 flex flex-col justify-center p-8">
                <input
                  type="text"
                  value={slide.title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  className="text-2xl md:text-4xl font-bold bg-transparent border-none outline-none w-full mb-4 focus:ring-2 focus:ring-primary/20 rounded px-2"
                  style={{ color: 'inherit' }}
                />
                <div className="space-y-2">
                  {slide.content?.map((item, index) => (
                    <input
                      key={index}
                      type="text"
                      value={item}
                      onChange={(e) => handleContentItemChange(index, e.target.value)}
                      className="text-base bg-transparent border-none outline-none w-full opacity-80 focus:ring-2 focus:ring-primary/20 rounded px-2"
                      style={{ color: 'inherit' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Comparison Slide */}
          {slide.type === 'comparison' && (
            <div className="flex-1 flex flex-col pointer-events-auto">
              <input
                type="text"
                value={slide.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-2xl md:text-4xl font-bold bg-transparent border-none outline-none w-full mb-6 text-center focus:ring-2 focus:ring-primary/20 rounded px-2"
                style={{ color: 'inherit' }}
              />
              <div className="flex-1 flex gap-4">
                <div className="flex-1 rounded-lg p-4" style={{ backgroundColor: slide.textColor, opacity: 0.1 }}>
                  <div className="text-lg font-semibold mb-4 text-center" style={{ color: slide.textColor }}>Option A</div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-3 rounded" style={{ backgroundColor: slide.textColor, opacity: 0.2 }} />
                    ))}
                  </div>
                </div>
                <div className="flex-1 rounded-lg p-4" style={{ backgroundColor: slide.textColor, opacity: 0.15 }}>
                  <div className="text-lg font-semibold mb-4 text-center" style={{ color: slide.textColor }}>Option B</div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-3 rounded" style={{ backgroundColor: slide.textColor, opacity: 0.2 }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Slide */}
          {slide.type === 'timeline' && (
            <div className="flex-1 flex flex-col pointer-events-auto">
              <input
                type="text"
                value={slide.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-2xl md:text-4xl font-bold bg-transparent border-none outline-none w-full mb-8 text-center focus:ring-2 focus:ring-primary/20 rounded px-2"
                style={{ color: 'inherit' }}
              />
              <div className="flex-1 flex flex-col justify-center gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`flex items-center gap-4 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                    <div className="w-4 h-4 rounded rotate-45" style={{ backgroundColor: slide.textColor }} />
                    <div className="flex-1 h-8 rounded" style={{ backgroundColor: slide.textColor, opacity: 0.2 }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quote Slide */}
          {slide.type === 'quote' && (
            <div className="flex-1 flex pointer-events-auto">
              <div className="flex-1 flex flex-col justify-center p-8">
                <div className="text-6xl opacity-30 mb-4" style={{ color: slide.textColor }}>"</div>
                <input
                  type="text"
                  value={slide.title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  className="text-xl md:text-2xl italic bg-transparent border-none outline-none w-full focus:ring-2 focus:ring-primary/20 rounded px-2"
                  style={{ color: 'inherit' }}
                />
                {slide.subtitle && (
                  <input
                    type="text"
                    value={slide.subtitle}
                    onChange={(e) => onSubtitleChange(e.target.value)}
                    className="text-base mt-4 bg-transparent border-none outline-none w-full opacity-70 focus:ring-2 focus:ring-primary/20 rounded px-2"
                    style={{ color: 'inherit' }}
                  />
                )}
              </div>
              <div className="w-1/4 flex items-center justify-center" style={{ backgroundColor: slide.textColor, opacity: 0.1 }}>
                <div className="text-4xl" style={{ color: slide.textColor }}>&lt;</div>
              </div>
            </div>
          )}

          {/* Team Slide */}
          {slide.type === 'team' && (
            <div className="flex-1 flex flex-col pointer-events-auto">
              <input
                type="text"
                value={slide.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-2xl md:text-4xl font-bold bg-transparent border-none outline-none w-full mb-8 text-center focus:ring-2 focus:ring-primary/20 rounded px-2"
                style={{ color: 'inherit' }}
              />
              <div className="flex-1 flex justify-center items-end gap-8 pb-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full mb-2" style={{ backgroundColor: slide.textColor, opacity: 0.3 }} />
                    <div className="w-20 h-3 rounded mb-1" style={{ backgroundColor: slide.textColor, opacity: 0.5 }} />
                    <div className="w-16 h-2 rounded" style={{ backgroundColor: slide.textColor, opacity: 0.3 }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agenda Slide */}
          {slide.type === 'agenda' && (
            <div className="flex-1 flex flex-col pointer-events-auto">
              <input
                type="text"
                value={slide.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-2xl md:text-4xl font-bold bg-transparent border-none outline-none w-full mb-8 focus:ring-2 focus:ring-primary/20 rounded px-2"
                style={{ color: 'inherit' }}
              />
              <div className="flex-1 flex gap-8">
                <div className="flex flex-col items-center">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: slide.textColor, color: slide.backgroundColor }}>
                        {i}
                      </div>
                      {i < 4 && <div className="w-0.5 h-8" style={{ backgroundColor: slide.textColor, opacity: 0.3 }} />}
                    </div>
                  ))}
                </div>
                <div className="flex-1 flex flex-col justify-around">
                  {slide.content?.slice(0, 4).map((item, index) => (
                    <input
                      key={index}
                      type="text"
                      value={item}
                      onChange={(e) => handleContentItemChange(index, e.target.value)}
                      className="text-lg bg-transparent border-none outline-none w-full focus:ring-2 focus:ring-primary/20 rounded px-2"
                      style={{ color: 'inherit' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Blank Slide */}
          {slide.type === 'blank' && (
            <div className="flex-1 flex items-center justify-center pointer-events-auto">
              <div className="text-center opacity-30">
                <div className="w-16 h-16 border-2 border-dashed rounded-lg mx-auto mb-2" style={{ borderColor: slide.textColor }} />
                <span className="text-sm" style={{ color: slide.textColor }}>Add elements from the panel</span>
              </div>
            </div>
          )}

          {/* Features Slide */}
          {slide.type === 'features' && (
            <div className="flex-1 flex flex-col pointer-events-auto">
              <input
                type="text"
                value={slide.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-2xl md:text-4xl font-bold bg-transparent border-none outline-none w-full mb-2 text-center focus:ring-2 focus:ring-primary/20 rounded px-2"
                style={{ color: 'inherit' }}
              />
              {slide.subtitle && (
                <input
                  type="text"
                  value={slide.subtitle}
                  onChange={(e) => onSubtitleChange(e.target.value)}
                  className="text-base mb-8 bg-transparent border-none outline-none w-full text-center opacity-70 focus:ring-2 focus:ring-primary/20 rounded px-2"
                  style={{ color: 'inherit' }}
                />
              )}
              <div className="flex-1 grid grid-cols-3 gap-6">
                {(slide.content || ['Feature 1', 'Feature 2', 'Feature 3']).slice(0, 6).map((item, index) => (
                  <div key={index} className="flex flex-col items-center text-center p-4 rounded-lg" style={{ backgroundColor: slide.textColor + '10' }}>
                    <div className="w-12 h-12 rounded-lg mb-3 flex items-center justify-center" style={{ backgroundColor: slide.textColor + '20' }}>
                      <span className="text-2xl">✦</span>
                    </div>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleContentItemChange(index, e.target.value)}
                      className="text-sm font-medium bg-transparent border-none outline-none w-full text-center focus:ring-2 focus:ring-primary/20 rounded px-2"
                      style={{ color: 'inherit' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Slide */}
          {slide.type === 'pricing' && (
            <div className="flex-1 flex flex-col pointer-events-auto">
              <input
                type="text"
                value={slide.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-2xl md:text-4xl font-bold bg-transparent border-none outline-none w-full mb-8 text-center focus:ring-2 focus:ring-primary/20 rounded px-2"
                style={{ color: 'inherit' }}
              />
              <div className="flex-1 flex justify-center gap-4">
                {['Basic', 'Pro', 'Enterprise'].map((plan, index) => (
                  <div 
                    key={index} 
                    className={`flex-1 max-w-[200px] rounded-lg p-4 flex flex-col ${index === 1 ? 'ring-2 ring-current' : ''}`}
                    style={{ 
                      backgroundColor: index === 1 ? slide.textColor : slide.textColor + '10',
                      color: index === 1 ? slide.backgroundColor : slide.textColor,
                    }}
                  >
                    <div className="text-lg font-bold mb-2">{plan}</div>
                    <div className="text-2xl font-bold mb-4">${(index + 1) * 29}</div>
                    <div className="space-y-2 flex-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="text-sm opacity-80">• Feature {i}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Slide */}
          {slide.type === 'stats' && (
            <div className="flex-1 flex flex-col pointer-events-auto">
              <input
                type="text"
                value={slide.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-2xl md:text-4xl font-bold bg-transparent border-none outline-none w-full mb-8 text-center focus:ring-2 focus:ring-primary/20 rounded px-2"
                style={{ color: 'inherit' }}
              />
              <div className="flex-1 flex justify-around items-center">
                {(slide.content || ['100+', '50K', '99%', '24/7']).slice(0, 4).map((item, index) => (
                  <div key={index} className="text-center">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleContentItemChange(index, e.target.value)}
                      className="text-4xl md:text-5xl font-bold bg-transparent border-none outline-none w-full text-center focus:ring-2 focus:ring-primary/20 rounded px-2"
                      style={{ color: 'inherit' }}
                    />
                    <div className="text-sm opacity-60 mt-2">Label {index + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Process Slide */}
          {slide.type === 'process' && (
            <div className="flex-1 flex flex-col pointer-events-auto">
              <input
                type="text"
                value={slide.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-2xl md:text-4xl font-bold bg-transparent border-none outline-none w-full mb-8 text-center focus:ring-2 focus:ring-primary/20 rounded px-2"
                style={{ color: 'inherit' }}
              />
              <div className="flex-1 flex items-center justify-between px-8">
                {(slide.content || ['Step 1', 'Step 2', 'Step 3', 'Step 4']).slice(0, 4).map((item, index, arr) => (
                  <div key={index} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-2"
                        style={{ backgroundColor: slide.textColor, color: slide.backgroundColor }}
                      >
                        {index + 1}
                      </div>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleContentItemChange(index, e.target.value)}
                        className="text-sm bg-transparent border-none outline-none w-24 text-center focus:ring-2 focus:ring-primary/20 rounded px-2"
                        style={{ color: 'inherit' }}
                      />
                    </div>
                    {index < arr.length - 1 && (
                      <div className="w-16 h-1 mx-2" style={{ backgroundColor: slide.textColor, opacity: 0.3 }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery Slide */}
          {slide.type === 'gallery' && (
            <div className="flex-1 flex flex-col pointer-events-auto">
              <input
                type="text"
                value={slide.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-2xl md:text-4xl font-bold bg-transparent border-none outline-none w-full mb-4 text-center focus:ring-2 focus:ring-primary/20 rounded px-2"
                style={{ color: 'inherit' }}
              />
              <div className="flex-1 grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div 
                    key={i} 
                    className="rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: slide.textColor + '15' }}
                  >
                    <span className="text-2xl opacity-30">🖼</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Slide */}
          {slide.type === 'contact' && (
            <div className="flex-1 flex pointer-events-auto">
              <div className="w-1/2 flex items-center justify-center" style={{ backgroundColor: slide.textColor + '10' }}>
                <div 
                  className="w-32 h-32 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: slide.textColor + '20' }}
                >
                  <span className="text-4xl">📧</span>
                </div>
              </div>
              <div className="w-1/2 flex flex-col justify-center p-8">
                <input
                  type="text"
                  value={slide.title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  className="text-2xl md:text-3xl font-bold bg-transparent border-none outline-none w-full mb-6 focus:ring-2 focus:ring-primary/20 rounded px-2"
                  style={{ color: 'inherit' }}
                />
                <div className="space-y-4">
                  {(slide.content || ['email@example.com', '+1 234 567 890', '123 Street, City']).slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-xl">{['📧', '📱', '📍'][index]}</span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleContentItemChange(index, e.target.value)}
                        className="text-base bg-transparent border-none outline-none flex-1 focus:ring-2 focus:ring-primary/20 rounded px-2"
                        style={{ color: 'inherit' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Draggable Elements Layer */}
        {slide.elements?.map((element) => (
          <DraggableElement
            key={element.id}
            element={element}
            isSelected={selectedElementId === element.id || selectedElementIds.includes(element.id)}
            isMultiSelected={selectedElementIds.includes(element.id) && selectedElementIds.length > 1}
            onSelect={() => onSelectElement(element.id)}
            onUpdate={(updates) => handleElementUpdate(element.id, updates)}
            onDelete={() => handleElementDelete(element.id)}
            canvasScale={zoom / 100}
            canvasWidth={propCanvasWidth}
            canvasHeight={propCanvasHeight}
            showGuides={showGuides}
            onGuidesChange={setGuides}
          />
        ))}
        
        {/* Smart Alignment Guides */}
        {showGuides && (guides.v.length > 0 || guides.h.length > 0) && (
          <div className="absolute inset-0 pointer-events-none z-[5000]" data-guides-layer>
            {guides.v.map((gx, i) => (
              <div
                key={`v-${i}`}
                className="absolute top-0 bottom-0"
                style={{
                  left: gx,
                  width: 1,
                  background: '#ec4899',
                  boxShadow: '0 0 2px rgba(236,72,153,0.6)',
                }}
              />
            ))}
            {guides.h.map((gy, i) => (
              <div
                key={`h-${i}`}
                className="absolute left-0 right-0"
                style={{
                  top: gy,
                  height: 1,
                  background: '#ec4899',
                  boxShadow: '0 0 2px rgba(236,72,153,0.6)',
                }}
              />
            ))}
          </div>
        )}

        {/* Selection Box */}
        {isSelecting && selectionBox && (
          <div
            className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
            style={{
              left: Math.min(selectionBox.startX, selectionBox.endX),
              top: Math.min(selectionBox.startY, selectionBox.endY),
              width: Math.abs(selectionBox.endX - selectionBox.startX),
              height: Math.abs(selectionBox.endY - selectionBox.startY),
            }}
          />
        )}
      </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
