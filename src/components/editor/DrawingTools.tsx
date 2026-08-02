import { useState, useRef, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type DrawingTool = 'pen' | 'highlighter' | 'laser' | 'eraser' | 'arrow' | 'line' | 'rectangle' | 'circle' | 'text' | 'spotlight';

// SVG Icons
const PenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
  </svg>
);

const HighlighterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>
  </svg>
);

const LaserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 2v4"/><path d="M12 18v4"/>
    <path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/>
  </svg>
);

const EraserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/>
  </svg>
);

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);

const LineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 20L20 4"/>
  </svg>
);

const RectangleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
  </svg>
);

const CircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
  </svg>
);

const TextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
  </svg>
);

const SpotlightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"/><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/>
    <path d="M18.36 18.36l1.42 1.42"/><path d="M1 12h2"/><path d="M21 12h2"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const UndoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
  </svg>
);

const RedoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

interface DrawingStroke {
  id: string;
  tool: DrawingTool;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  opacity: number;
  text?: string;
}

const TOOLS: { type: DrawingTool; icon: React.ReactNode; name: { en: string; ar: string }; shortcut?: string }[] = [
  { type: 'pen', icon: <PenIcon />, name: { en: 'Pen', ar: 'قلم' }, shortcut: 'P' },
  { type: 'highlighter', icon: <HighlighterIcon />, name: { en: 'Highlighter', ar: 'هايلايتر' }, shortcut: 'H' },
  { type: 'laser', icon: <LaserIcon />, name: { en: 'Laser', ar: 'ليزر' }, shortcut: 'L' },
  { type: 'eraser', icon: <EraserIcon />, name: { en: 'Eraser', ar: 'ممحاة' }, shortcut: 'E' },
  { type: 'arrow', icon: <ArrowIcon />, name: { en: 'Arrow', ar: 'سهم' }, shortcut: 'A' },
  { type: 'line', icon: <LineIcon />, name: { en: 'Line', ar: 'خط' } },
  { type: 'rectangle', icon: <RectangleIcon />, name: { en: 'Rectangle', ar: 'مستطيل' }, shortcut: 'R' },
  { type: 'circle', icon: <CircleIcon />, name: { en: 'Circle', ar: 'دائرة' }, shortcut: 'C' },
  { type: 'text', icon: <TextIcon />, name: { en: 'Text', ar: 'نص' }, shortcut: 'T' },
  { type: 'spotlight', icon: <SpotlightIcon />, name: { en: 'Spotlight', ar: 'تركيز' }, shortcut: 'S' },
];

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#000000'];

interface DrawingToolsProps {
  isActive: boolean;
  onToggle: () => void;
  canvasWidth: number;
  canvasHeight: number;
}

export const DrawingTools = ({ isActive, onToggle, canvasWidth, canvasHeight }: DrawingToolsProps) => {
  const { language } = useLanguage();
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('pen');
  const [color, setColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [undoneStrokes, setUndoneStrokes] = useState<DrawingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [laserPosition, setLaserPosition] = useState<{ x: number; y: number } | null>(null);
  const [spotlightPosition, setSpotlightPosition] = useState<{ x: number; y: number } | null>(null);
  const [spotlightRadius, setSpotlightRadius] = useState(100);
  const [smoothing, setSmoothing] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const shapeStart = useRef<{ x: number; y: number } | null>(null);

  const getToolOpacity = (tool: DrawingTool) => tool === 'highlighter' ? 0.4 : 1;

  // Smooth points using Catmull-Rom spline
  const smoothPoints = useCallback((points: { x: number; y: number }[]) => {
    if (!smoothing || points.length < 4) return points;
    const smoothed: { x: number; y: number }[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[Math.min(points.length - 1, i + 1)];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      for (let t = 0; t < 1; t += 0.1) {
        const t2 = t * t, t3 = t2 * t;
        smoothed.push({
          x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
          y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
        });
      }
    }
    return smoothed;
  }, [smoothing]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (selectedTool === 'laser') { setLaserPosition({ x, y }); return; }
    if (selectedTool === 'spotlight') { setSpotlightPosition({ x, y }); return; }
    if (selectedTool === 'eraser') {
      const threshold = strokeWidth * 3;
      setStrokes(prev => prev.filter(stroke => 
        !stroke.points.some(point => Math.abs(point.x - x) < threshold && Math.abs(point.y - y) < threshold)
      ));
      return;
    }

    isDrawing.current = true;
    if (['arrow', 'line', 'rectangle', 'circle'].includes(selectedTool)) shapeStart.current = { x, y };
    setCurrentStroke({
      id: `stroke-${Date.now()}`,
      tool: selectedTool,
      points: [{ x, y }],
      color,
      width: strokeWidth,
      opacity: getToolOpacity(selectedTool),
    });
  }, [isActive, selectedTool, color, strokeWidth]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (selectedTool === 'laser') { setLaserPosition({ x, y }); return; }
    if (selectedTool === 'spotlight') { setSpotlightPosition({ x, y }); return; }
    if (!isDrawing.current || !currentStroke) return;

    if (['pen', 'highlighter'].includes(selectedTool)) {
      setCurrentStroke(prev => prev ? { ...prev, points: [...prev.points, { x, y }] } : null);
    } else if (shapeStart.current) {
      setCurrentStroke(prev => prev ? { ...prev, points: [shapeStart.current!, { x, y }] } : null);
    }
  }, [selectedTool, currentStroke]);

  const handleMouseUp = useCallback(() => {
    if (selectedTool === 'laser') { setLaserPosition(null); return; }
    if (selectedTool === 'spotlight') { setSpotlightPosition(null); return; }
    if (currentStroke && currentStroke.points.length > 0) {
      const finalStroke = ['pen', 'highlighter'].includes(currentStroke.tool)
        ? { ...currentStroke, points: smoothPoints(currentStroke.points) }
        : currentStroke;
      setStrokes(prev => [...prev, finalStroke]);
    }
    isDrawing.current = false;
    shapeStart.current = null;
    setCurrentStroke(null);
  }, [selectedTool, currentStroke, smoothPoints]);

  const handleUndo = useCallback(() => {
    if (strokes.length === 0) return;
    const lastStroke = strokes[strokes.length - 1];
    setStrokes(prev => prev.slice(0, -1));
    setUndoneStrokes(prev => [...prev, lastStroke]);
  }, [strokes]);

  const handleRedo = useCallback(() => {
    if (undoneStrokes.length === 0) return;
    const lastUndone = undoneStrokes[undoneStrokes.length - 1];
    setUndoneStrokes(prev => prev.slice(0, -1));
    setStrokes(prev => [...prev, lastUndone]);
  }, [undoneStrokes]);

  const handleClear = useCallback(() => {
    setStrokes([]);
    setUndoneStrokes([]);
    setCurrentStroke(null);
  }, []);

  const handleExportDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `drawing-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tool = TOOLS.find(t => t.shortcut?.toLowerCase() === e.key.toLowerCase());
      if (tool) { e.preventDefault(); setSelectedTool(tool.type); }
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); handleRedo(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleUndo]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    [...strokes, currentStroke].filter(Boolean).forEach(stroke => {
      if (!stroke || stroke.points.length === 0) return;
      ctx.globalAlpha = stroke.opacity;
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (['pen', 'highlighter'].includes(stroke.tool)) {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        stroke.points.forEach(point => ctx.lineTo(point.x, point.y));
        ctx.stroke();
      } else if (stroke.tool === 'line' && stroke.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        ctx.lineTo(stroke.points[1].x, stroke.points[1].y);
        ctx.stroke();
      } else if (stroke.tool === 'arrow' && stroke.points.length >= 2) {
        const [start, end] = stroke.points;
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - 15 * Math.cos(angle - Math.PI / 6), end.y - 15 * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - 15 * Math.cos(angle + Math.PI / 6), end.y - 15 * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if (stroke.tool === 'rectangle' && stroke.points.length >= 2) {
        const [start, end] = stroke.points;
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (stroke.tool === 'circle' && stroke.points.length >= 2) {
        const [start, end] = stroke.points;
        const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }, [strokes, currentStroke]);

  return (
    <>
      {/* Toolbar */}
      <div className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 bg-card border rounded-xl shadow-lg p-2 flex items-center gap-1 transition-all z-50',
        isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      )}>
        <TooltipProvider>
          {TOOLS.map(tool => (
            <Tooltip key={tool.type}>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedTool === tool.type ? 'default' : 'ghost'}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setSelectedTool(tool.type)}
                >
                  {tool.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
                <p>{language === 'ar' ? tool.name.ar : tool.name.en} {tool.shortcut && `(${tool.shortcut})`}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          <div className="w-px h-8 bg-border mx-1" />

          {/* Color Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <div className="w-5 h-5 rounded-full border-2 border-white shadow" style={{ backgroundColor: color }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <div className="grid grid-cols-5 gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    className={cn('w-7 h-7 rounded-full border-2 transition-transform hover:scale-110', color === c ? 'border-primary scale-110' : 'border-transparent')}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Label className="text-xs">{language === 'ar' ? 'مخصص' : 'Custom'}</Label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
              </div>
            </PopoverContent>
          </Popover>

          {/* Stroke Width */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-5 h-0.5 bg-current rounded" />
                  <div className="w-5 h-1 bg-current rounded" />
                  <div className="w-5 h-1.5 bg-current rounded" />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>{language === 'ar' ? 'السُمك' : 'Width'}</Label>
                  <span className="text-sm text-muted-foreground">{strokeWidth}px</span>
                </div>
                <Slider value={[strokeWidth]} onValueChange={([v]) => setStrokeWidth(v)} min={1} max={20} step={1} />
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{language === 'ar' ? 'تنعيم الخط' : 'Smoothing'}</Label>
                  <Switch checked={smoothing} onCheckedChange={setSmoothing} />
                </div>
                {selectedTool === 'spotlight' && (
                  <>
                    <div className="flex justify-between">
                      <Label>{language === 'ar' ? 'نصف القطر' : 'Radius'}</Label>
                      <span className="text-sm text-muted-foreground">{spotlightRadius}px</span>
                    </div>
                    <Slider value={[spotlightRadius]} onValueChange={([v]) => setSpotlightRadius(v)} min={50} max={200} step={10} />
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-px h-8 bg-border mx-1" />

          {/* Undo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleUndo} disabled={strokes.length === 0}>
                <UndoIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
              <div className="flex items-center gap-1.5">
                <UndoIcon />
                {language === 'ar' ? 'تراجع (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleRedo} disabled={undoneStrokes.length === 0}>
                <RedoIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
              <div className="flex items-center gap-1.5">
                <RedoIcon />
                {language === 'ar' ? 'إعادة (Ctrl+Y)' : 'Redo (Ctrl+Y)'}
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Clear */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={handleClear}>
                <TrashIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
              <div className="flex items-center gap-1.5">
                <TrashIcon />
                {language === 'ar' ? 'مسح الكل' : 'Clear All'}
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Export Drawing */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleExportDrawing} disabled={strokes.length === 0}>
                <DownloadIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
              <div className="flex items-center gap-1.5">
                <DownloadIcon />
                {language === 'ar' ? 'تصدير الرسم' : 'Export Drawing'}
              </div>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-8 bg-border mx-1" />

          <Button variant="ghost" size="sm" onClick={onToggle}>
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
        </TooltipProvider>
      </div>

      {/* Drawing Canvas */}
      {isActive && (
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="absolute inset-0 z-40 cursor-crosshair"
          style={{ touchAction: 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      )}

      {/* Laser Pointer */}
      {isActive && selectedTool === 'laser' && laserPosition && (
        <div className="absolute z-50 pointer-events-none" style={{ left: laserPosition.x, top: laserPosition.y, transform: 'translate(-50%, -50%)' }}>
          <div className="w-6 h-6 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
          <div className="absolute inset-0 w-6 h-6 rounded-full bg-red-500/30 animate-ping" />
        </div>
      )}

      {/* Spotlight */}
      {isActive && selectedTool === 'spotlight' && spotlightPosition && (
        <div className="absolute inset-0 z-40 pointer-events-none" style={{
          background: `radial-gradient(circle ${spotlightRadius}px at ${spotlightPosition.x}px ${spotlightPosition.y}px, transparent 0%, rgba(0,0,0,0.8) 100%)`
        }} />
      )}
    </>
  );
};

export const DrawingToolsToggle = ({ isActive, onToggle }: { isActive: boolean; onToggle: () => void }) => {
  const { language } = useLanguage();
  return (
    <Button variant={isActive ? 'default' : 'outline'} size="sm" className="gap-2" onClick={onToggle}>
      <PenIcon />
      {language === 'ar' ? 'أدوات الرسم' : 'Drawing Tools'}
    </Button>
  );
};

export default DrawingTools;
