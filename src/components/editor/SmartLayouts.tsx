import { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { SlideElement } from '@/data/templates';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  Circle,
  Layers,
  ArrowRight,
  ArrowDown,
  Grid3X3,
  Sparkles,
  Settings2,
  Save,
  Trash2,
  Play,
  RotateCcw,
  Shuffle,
  AlignCenter,
  AlignStartVertical,
  AlignEndVertical,
  Wand2,
  Zap,
  Eye,
  Copy,
} from 'lucide-react';

// Layout types
type LayoutType = 'grid' | 'circle' | 'stack-h' | 'stack-v' | 'masonry' | 'diagonal' | 'pyramid' | 'scatter' | 'wave' | 'spiral' | 'honeycomb' | 'radial' | 'timeline' | 'cards-fan' | 'perspective';

type LayoutCategory = 'basic' | 'creative' | 'presentation';

interface LayoutConfig {
  type: LayoutType;
  category: LayoutCategory;
  name: { en: string; ar: string };
  icon: React.ReactNode;
  description: { en: string; ar: string };
  preview: string; // CSS gradient for preview
}

const LAYOUTS: LayoutConfig[] = [
  // Basic layouts
  { type: 'grid', category: 'basic', name: { en: 'Grid', ar: 'شبكة' }, icon: <LayoutGrid className="w-4 h-4" />, description: { en: 'Arrange in rows and columns', ar: 'ترتيب في صفوف وأعمدة' }, preview: 'from-blue-500/20 to-blue-600/20' },
  { type: 'stack-h', category: 'basic', name: { en: 'Horizontal', ar: 'أفقي' }, icon: <ArrowRight className="w-4 h-4" />, description: { en: 'Stack horizontally', ar: 'تكديس أفقي' }, preview: 'from-green-500/20 to-green-600/20' },
  { type: 'stack-v', category: 'basic', name: { en: 'Vertical', ar: 'رأسي' }, icon: <ArrowDown className="w-4 h-4" />, description: { en: 'Stack vertically', ar: 'تكديس رأسي' }, preview: 'from-purple-500/20 to-purple-600/20' },
  { type: 'masonry', category: 'basic', name: { en: 'Masonry', ar: 'بناء' }, icon: <Grid3X3 className="w-4 h-4" />, description: { en: 'Pinterest-style layout', ar: 'تخطيط بنترست' }, preview: 'from-orange-500/20 to-orange-600/20' },
  
  // Creative layouts
  { type: 'circle', category: 'creative', name: { en: 'Circle', ar: 'دائري' }, icon: <Circle className="w-4 h-4" />, description: { en: 'Arrange in a circle', ar: 'ترتيب دائري' }, preview: 'from-pink-500/20 to-pink-600/20' },
  { type: 'spiral', category: 'creative', name: { en: 'Spiral', ar: 'حلزوني' }, icon: <Sparkles className="w-4 h-4" />, description: { en: 'Spiral arrangement', ar: 'ترتيب حلزوني' }, preview: 'from-cyan-500/20 to-cyan-600/20' },
  { type: 'wave', category: 'creative', name: { en: 'Wave', ar: 'موجة' }, icon: <Zap className="w-4 h-4" />, description: { en: 'Wave pattern', ar: 'نمط موجي' }, preview: 'from-teal-500/20 to-teal-600/20' },
  { type: 'honeycomb', category: 'creative', name: { en: 'Honeycomb', ar: 'خلية نحل' }, icon: <Layers className="w-4 h-4" />, description: { en: 'Hexagonal pattern', ar: 'نمط سداسي' }, preview: 'from-amber-500/20 to-amber-600/20' },
  { type: 'scatter', category: 'creative', name: { en: 'Scatter', ar: 'متناثر' }, icon: <Shuffle className="w-4 h-4" />, description: { en: 'Artistic scatter', ar: 'توزيع فني' }, preview: 'from-rose-500/20 to-rose-600/20' },
  
  // Presentation layouts
  { type: 'diagonal', category: 'presentation', name: { en: 'Diagonal', ar: 'قطري' }, icon: <ArrowRight className="w-4 h-4 rotate-45" />, description: { en: 'Arrange diagonally', ar: 'ترتيب قطري' }, preview: 'from-indigo-500/20 to-indigo-600/20' },
  { type: 'pyramid', category: 'presentation', name: { en: 'Pyramid', ar: 'هرمي' }, icon: <AlignCenter className="w-4 h-4" />, description: { en: 'Pyramid arrangement', ar: 'ترتيب هرمي' }, preview: 'from-yellow-500/20 to-yellow-600/20' },
  { type: 'radial', category: 'presentation', name: { en: 'Radial', ar: 'شعاعي' }, icon: <Sparkles className="w-4 h-4" />, description: { en: 'Radial from center', ar: 'شعاعي من المركز' }, preview: 'from-violet-500/20 to-violet-600/20' },
  { type: 'timeline', category: 'presentation', name: { en: 'Timeline', ar: 'خط زمني' }, icon: <ArrowRight className="w-4 h-4" />, description: { en: 'Timeline layout', ar: 'تخطيط زمني' }, preview: 'from-emerald-500/20 to-emerald-600/20' },
  { type: 'cards-fan', category: 'presentation', name: { en: 'Cards Fan', ar: 'مروحة' }, icon: <Layers className="w-4 h-4" />, description: { en: 'Fanned cards', ar: 'بطاقات مروحية' }, preview: 'from-fuchsia-500/20 to-fuchsia-600/20' },
  { type: 'perspective', category: 'presentation', name: { en: '3D Perspective', ar: 'منظور' }, icon: <Eye className="w-4 h-4" />, description: { en: '3D depth effect', ar: 'تأثير عمق ثلاثي' }, preview: 'from-sky-500/20 to-sky-600/20' },
];

const LAYOUT_CATEGORIES = [
  { id: 'basic', name: { en: 'Basic', ar: 'أساسي' }, icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  { id: 'creative', name: { en: 'Creative', ar: 'إبداعي' }, icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'presentation', name: { en: 'Presentation', ar: 'عرض' }, icon: <Layers className="w-3.5 h-3.5" /> },
];

// Animation presets with more options
const ANIMATIONS = [
  { id: 'none', name: { en: 'None', ar: 'بدون' }, icon: null },
  { id: 'fade', name: { en: 'Fade In', ar: 'تلاشي' }, icon: <Sparkles className="w-3 h-3" /> },
  { id: 'slide-up', name: { en: 'Slide Up', ar: 'انزلاق للأعلى' }, icon: <ArrowDown className="w-3 h-3 rotate-180" /> },
  { id: 'slide-left', name: { en: 'Slide Left', ar: 'انزلاق يسار' }, icon: <ArrowRight className="w-3 h-3 rotate-180" /> },
  { id: 'zoom', name: { en: 'Zoom', ar: 'تكبير' }, icon: <Eye className="w-3 h-3" /> },
  { id: 'bounce', name: { en: 'Bounce', ar: 'ارتداد' }, icon: <Zap className="w-3 h-3" /> },
  { id: 'rotate', name: { en: 'Rotate', ar: 'دوران' }, icon: <RotateCcw className="w-3 h-3" /> },
];

// Alignment options
const ALIGNMENTS = [
  { id: 'start', name: { en: 'Start', ar: 'بداية' }, icon: <AlignStartVertical className="w-4 h-4" /> },
  { id: 'center', name: { en: 'Center', ar: 'وسط' }, icon: <AlignCenter className="w-4 h-4" /> },
  { id: 'end', name: { en: 'End', ar: 'نهاية' }, icon: <AlignEndVertical className="w-4 h-4" /> },
];

interface SmartLayoutsProps {
  elements: SlideElement[];
  selectedElementIds: string[];
  canvasWidth: number;
  canvasHeight: number;
  onApplyLayout: (elements: SlideElement[]) => void;
}

export const SmartLayouts = ({
  elements,
  selectedElementIds,
  canvasWidth,
  canvasHeight,
  onApplyLayout,
}: SmartLayoutsProps) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('grid');
  const [selectedCategory, setSelectedCategory] = useState<LayoutCategory>('basic');
  const [spacing, setSpacing] = useState(20);
  const [padding, setPadding] = useState(40);
  const [previewElements, setPreviewElements] = useState<SlideElement[]>([]);
  const [animation, setAnimation] = useState('none');
  const [animationDelay, setAnimationDelay] = useState(0.1);
  const [resizeToFit, setResizeToFit] = useState(false);
  const [maintainOrder, setMaintainOrder] = useState(true);
  const [alignment, setAlignment] = useState<'start' | 'center' | 'end'>('center');
  const [gridColumns, setGridColumns] = useState(0); // 0 = auto
  const [isPreviewAnimating, setIsPreviewAnimating] = useState(false);
  const [savedLayouts, setSavedLayouts] = useState<{ name: string; type: LayoutType; spacing: number; padding: number; animation: string }[]>(() => {
    try {
      const saved = localStorage.getItem('slideforge_saved_layouts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Get elements to arrange
  const getTargetElements = useCallback(() => {
    let target = selectedElementIds.length >= 2
      ? elements.filter(el => selectedElementIds.includes(el.id))
      : elements;
    
    if (maintainOrder) {
      target = [...target].sort((a, b) => {
        const aIndex = elements.findIndex(el => el.id === a.id);
        const bIndex = elements.findIndex(el => el.id === b.id);
        return aIndex - bIndex;
      });
    }
    return target;
  }, [elements, selectedElementIds, maintainOrder]);

  // Calculate layout positions
  const calculateLayout = useCallback((
    targetElements: SlideElement[],
    layout: LayoutType,
    gap: number,
    pad: number
  ): SlideElement[] => {
    if (targetElements.length === 0) return [];

    const count = targetElements.length;
    const availableWidth = canvasWidth - pad * 2;
    const availableHeight = canvasHeight - pad * 2;

    // Add animation to elements
    const addAnimation = (el: SlideElement, index: number): SlideElement => {
      if (animation === 'none') return el;
      return {
        ...el,
        animation: {
          type: animation as any,
          duration: 0.5,
          delay: index * animationDelay,
          easing: 'ease-out',
        },
      };
    };

    switch (layout) {
      case 'grid': {
        const cols = gridColumns > 0 ? gridColumns : Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        const cellWidth = (availableWidth - gap * (cols - 1)) / cols;
        const cellHeight = (availableHeight - gap * (rows - 1)) / rows;

        return targetElements.map((el, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const elWidth = resizeToFit ? cellWidth * 0.9 : Math.min(el.width, cellWidth);
          const elHeight = resizeToFit ? cellHeight * 0.9 : Math.min(el.height, cellHeight);
          return addAnimation({
            ...el,
            x: pad + col * (cellWidth + gap) + (cellWidth - elWidth) / 2,
            y: pad + row * (cellHeight + gap) + (cellHeight - elHeight) / 2,
            ...(resizeToFit ? { width: elWidth, height: elHeight } : {}),
          }, i);
        });
      }

      case 'circle': {
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const radius = Math.min(availableWidth, availableHeight) / 2 - 50;

        return targetElements.map((el, i) => {
          const angle = (2 * Math.PI * i) / count - Math.PI / 2;
          return addAnimation({
            ...el,
            x: centerX + radius * Math.cos(angle) - el.width / 2,
            y: centerY + radius * Math.sin(angle) - el.height / 2,
          }, i);
        });
      }

      case 'wave': {
        const amplitude = availableHeight / 4;
        const frequency = 2;
        return targetElements.map((el, i) => {
          const progress = i / (count - 1 || 1);
          return addAnimation({
            ...el,
            x: pad + progress * (availableWidth - el.width),
            y: canvasHeight / 2 + Math.sin(progress * Math.PI * frequency) * amplitude - el.height / 2,
          }, i);
        });
      }

      case 'spiral': {
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const maxRadius = Math.min(availableWidth, availableHeight) / 2 - 30;
        return targetElements.map((el, i) => {
          const progress = (i + 1) / count;
          const angle = progress * Math.PI * 4;
          const radius = progress * maxRadius;
          return addAnimation({
            ...el,
            x: centerX + radius * Math.cos(angle) - el.width / 2,
            y: centerY + radius * Math.sin(angle) - el.height / 2,
          }, i);
        });
      }

      case 'stack-h': {
        const totalWidth = targetElements.reduce((sum, el) => sum + el.width, 0) + gap * (count - 1);
        let startX = alignment === 'start' ? pad : alignment === 'end' ? canvasWidth - totalWidth - pad : (canvasWidth - totalWidth) / 2;
        const centerY = canvasHeight / 2;

        return targetElements.map((el, i) => {
          const result = addAnimation({
            ...el,
            x: startX,
            y: centerY - el.height / 2,
          }, i);
          startX += el.width + gap;
          return result;
        });
      }

      case 'stack-v': {
        const totalHeight = targetElements.reduce((sum, el) => sum + el.height, 0) + gap * (count - 1);
        let startY = alignment === 'start' ? pad : alignment === 'end' ? canvasHeight - totalHeight - pad : (canvasHeight - totalHeight) / 2;
        const centerX = canvasWidth / 2;

        return targetElements.map((el, i) => {
          const result = addAnimation({
            ...el,
            x: centerX - el.width / 2,
            y: startY,
          }, i);
          startY += el.height + gap;
          return result;
        });
      }

      case 'diagonal': {
        const stepX = (availableWidth - (targetElements[0]?.width || 100)) / (count - 1 || 1);
        const stepY = (availableHeight - (targetElements[0]?.height || 100)) / (count - 1 || 1);

        return targetElements.map((el, i) => addAnimation({
          ...el,
          x: pad + stepX * i,
          y: pad + stepY * i,
        }, i));
      }

      case 'masonry': {
        const cols = gridColumns > 0 ? gridColumns : 2;
        const colHeights = Array(cols).fill(pad);
        const colWidth = (availableWidth - gap * (cols - 1)) / cols;

        return targetElements.map((el, i) => {
          const shortestCol = colHeights.indexOf(Math.min(...colHeights));
          const result = addAnimation({
            ...el,
            x: pad + shortestCol * (colWidth + gap),
            y: colHeights[shortestCol],
            ...(resizeToFit ? { width: colWidth } : {}),
          }, i);
          colHeights[shortestCol] += el.height + gap;
          return result;
        });
      }

      case 'pyramid': {
        const rows: number[] = [];
        let remaining = count;
        let row = 1;
        while (remaining > 0) {
          rows.push(Math.min(row, remaining));
          remaining -= row;
          row++;
        }

        let elementIndex = 0;
        const rowHeight = (availableHeight - gap * (rows.length - 1)) / rows.length;

        return targetElements.map((el) => {
          let currentRow = 0;
          let indexInRow = elementIndex;
          let sum = 0;
          for (let r = 0; r < rows.length; r++) {
            if (elementIndex < sum + rows[r]) {
              currentRow = r;
              indexInRow = elementIndex - sum;
              break;
            }
            sum += rows[r];
          }

          const itemsInRow = rows[currentRow];
          const rowWidth = itemsInRow * el.width + (itemsInRow - 1) * gap;
          const startX = (canvasWidth - rowWidth) / 2;

          elementIndex++;
          return addAnimation({
            ...el,
            x: startX + indexInRow * (el.width + gap),
            y: pad + currentRow * (rowHeight + gap),
          }, elementIndex - 1);
        });
      }

      case 'scatter': {
        // Controlled scatter with seed for consistency
        const seed = 12345;
        const seededRandom = (i: number) => {
          const x = Math.sin(seed + i * 9999) * 10000;
          return x - Math.floor(x);
        };
        return targetElements.map((el, i) => addAnimation({
          ...el,
          x: pad + seededRandom(i) * (availableWidth - el.width),
          y: pad + seededRandom(i + 100) * (availableHeight - el.height),
        }, i));
      }

      case 'honeycomb': {
        const hexWidth = (availableWidth - gap * 3) / 4;
        const hexHeight = hexWidth * 0.866;
        const cols = Math.floor(availableWidth / (hexWidth + gap));
        
        return targetElements.map((el, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const offsetX = row % 2 === 1 ? (hexWidth + gap) / 2 : 0;
          return addAnimation({
            ...el,
            x: pad + col * (hexWidth + gap) + offsetX,
            y: pad + row * (hexHeight * 0.75 + gap),
            ...(resizeToFit ? { width: hexWidth, height: hexHeight } : {}),
          }, i);
        });
      }

      case 'radial': {
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const rings = Math.ceil(count / 6);
        let elementIndex = 0;

        return targetElements.map((el, i) => {
          if (i === 0) {
            elementIndex++;
            return addAnimation({
              ...el,
              x: centerX - el.width / 2,
              y: centerY - el.height / 2,
            }, 0);
          }
          
          const ring = Math.ceil(i / 6);
          const itemsInRing = Math.min(6, count - (ring - 1) * 6);
          const indexInRing = (i - 1) % 6;
          const radius = ring * 80;
          const angle = (2 * Math.PI * indexInRing) / itemsInRing - Math.PI / 2;
          
          return addAnimation({
            ...el,
            x: centerX + radius * Math.cos(angle) - el.width / 2,
            y: centerY + radius * Math.sin(angle) - el.height / 2,
          }, i);
        });
      }

      case 'timeline': {
        const lineY = canvasHeight / 2;
        const stepX = availableWidth / (count + 1);
        
        return targetElements.map((el, i) => {
          const isTop = i % 2 === 0;
          return addAnimation({
            ...el,
            x: pad + stepX * (i + 1) - el.width / 2,
            y: isTop ? lineY - el.height - 20 : lineY + 20,
          }, i);
        });
      }

      case 'cards-fan': {
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight * 0.7;
        const fanAngle = Math.PI / 3;
        const startAngle = -fanAngle / 2;
        
        return targetElements.map((el, i) => {
          const angle = startAngle + (fanAngle * i) / (count - 1 || 1);
          const radius = 200;
          return addAnimation({
            ...el,
            x: centerX + radius * Math.sin(angle) - el.width / 2,
            y: centerY - radius * Math.cos(angle) - el.height / 2,
            rotation: (angle * 180) / Math.PI,
          } as SlideElement, i);
        });
      }

      case 'perspective': {
        const centerX = canvasWidth / 2;
        const startY = pad;
        const depthStep = (availableHeight - 100) / count;
        
        return targetElements.map((el, i) => {
          const scale = 1 - (i * 0.1);
          const scaledWidth = el.width * scale;
          const scaledHeight = el.height * scale;
          return addAnimation({
            ...el,
            x: centerX - scaledWidth / 2,
            y: startY + i * depthStep,
            ...(resizeToFit ? { width: scaledWidth, height: scaledHeight } : {}),
          }, i);
        });
      }

      default:
        return targetElements;
    }
  }, [canvasWidth, canvasHeight, animation, animationDelay, resizeToFit, alignment, gridColumns]);

  // Update preview when settings change
  const updatePreview = useCallback(() => {
    const targetElements = getTargetElements();
    const newPositions = calculateLayout(targetElements, selectedLayout, spacing, padding);
    setPreviewElements(newPositions);
  }, [getTargetElements, calculateLayout, selectedLayout, spacing, padding, animation, resizeToFit]);

  // Auto-update preview when layout or settings change
  useEffect(() => {
    if (isOpen) {
      updatePreview();
    }
  }, [isOpen, selectedLayout, spacing, padding, animation, animationDelay, resizeToFit, maintainOrder, alignment, gridColumns]);

  // Preview animation
  const handlePreviewAnimation = () => {
    setIsPreviewAnimating(true);
    setTimeout(() => setIsPreviewAnimating(false), 2000);
  };

  // Apply layout
  const handleApply = useCallback(() => {
    const targetElements = getTargetElements();
    const newPositions = calculateLayout(targetElements, selectedLayout, spacing, padding);
    
    // Merge with original elements
    const updatedElements = elements.map(el => {
      const updated = newPositions.find(p => p.id === el.id);
      return updated || el;
    });

    onApplyLayout(updatedElements);
    toast.success(language === 'ar' ? 'تم تطبيق التخطيط!' : 'Layout applied!');
    setIsOpen(false);
  }, [elements, getTargetElements, calculateLayout, selectedLayout, spacing, padding, onApplyLayout, language]);

  // Save layout preset
  const handleSaveLayout = useCallback(() => {
    const name = prompt(language === 'ar' ? 'اسم التخطيط:' : 'Layout name:');
    if (!name) return;
    
    const newSaved = [...savedLayouts, { name, type: selectedLayout, spacing, padding, animation }];
    setSavedLayouts(newSaved);
    localStorage.setItem('slideforge_saved_layouts', JSON.stringify(newSaved));
    toast.success(language === 'ar' ? 'تم حفظ التخطيط!' : 'Layout saved!');
  }, [selectedLayout, spacing, padding, animation, savedLayouts, language]);

  // Load saved layout
  const handleLoadLayout = useCallback((saved: typeof savedLayouts[0]) => {
    setSelectedLayout(saved.type);
    setSpacing(saved.spacing);
    setPadding(saved.padding);
    setAnimation(saved.animation || 'none');
    // Find category
    const layout = LAYOUTS.find(l => l.type === saved.type);
    if (layout) setSelectedCategory(layout.category);
  }, []);

  // Duplicate layout
  const handleDuplicateLayout = useCallback(() => {
    if (previewElements.length === 0) return;
    navigator.clipboard.writeText(JSON.stringify({ type: selectedLayout, spacing, padding, animation }));
    toast.success(language === 'ar' ? 'تم نسخ إعدادات التخطيط!' : 'Layout settings copied!');
  }, [selectedLayout, spacing, padding, animation, previewElements, language]);

  // Randomize layout
  const handleRandomize = useCallback(() => {
    const randomLayout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)];
    setSelectedLayout(randomLayout.type);
    setSelectedCategory(randomLayout.category);
    setSpacing(Math.floor(Math.random() * 40) + 10);
    setPadding(Math.floor(Math.random() * 60) + 20);
  }, []);

  // Delete saved layout
  const handleDeleteSavedLayout = useCallback((index: number) => {
    const newSaved = savedLayouts.filter((_, i) => i !== index);
    setSavedLayouts(newSaved);
    localStorage.setItem('slideforge_saved_layouts', JSON.stringify(newSaved));
  }, [savedLayouts]);

  const targetCount = getTargetElements().length;
  const currentLayout = LAYOUTS.find(l => l.type === selectedLayout);
  const filteredLayouts = LAYOUTS.filter(l => l.category === selectedCategory);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) updatePreview();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-lg h-8 hover:bg-primary/10 hover:border-primary/30" disabled={targetCount < 2}>
          <LayoutGrid className="w-4 h-4" />
          {language === 'ar' ? 'تخطيط ذكي' : 'Smart Layout'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20">
                <Wand2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  {language === 'ar' ? 'التخطيط الذكي' : 'Smart Layouts'}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {language === 'ar' ? `ترتيب ${targetCount} عناصر بذكاء` : `Intelligently arrange ${targetCount} elements`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 rounded-lg" onClick={handleRandomize}>
                <Shuffle className="w-4 h-4 mr-1" />
                {language === 'ar' ? 'عشوائي' : 'Random'}
              </Button>
              <Button variant="ghost" size="sm" className="h-8 rounded-lg" onClick={handleDuplicateLayout}>
                <Copy className="w-4 h-4 mr-1" />
                {language === 'ar' ? 'نسخ' : 'Copy'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="grid grid-cols-5 gap-6 py-6">
            {/* Layout Selection - 2 columns */}
            <div className="col-span-2 space-y-4">
              {/* Category Tabs */}
              <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
                {LAYOUT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all',
                      selectedCategory === cat.id
                        ? 'bg-background shadow-sm text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => setSelectedCategory(cat.id as LayoutCategory)}
                  >
                    {cat.icon}
                    {language === 'ar' ? cat.name.ar : cat.name.en}
                  </button>
                ))}
              </div>

              {/* Layout Grid */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20">
                  {filteredLayouts.map((layout) => (
                    <button
                      key={layout.type}
                      className={cn(
                        'group relative p-3 rounded-xl border-2 text-left transition-all duration-200',
                        selectedLayout === layout.type
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border/50 hover:border-primary/30 hover:bg-muted/30'
                      )}
                      onClick={() => setSelectedLayout(layout.type)}
                    >
                      <div className={cn(
                        'absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 transition-opacity',
                        layout.preview,
                        selectedLayout === layout.type && 'opacity-100'
                      )} />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            selectedLayout === layout.type ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground group-hover:text-foreground'
                          )}>
                            {layout.icon}
                          </div>
                          <span className="font-medium text-sm">
                            {language === 'ar' ? layout.name.ar : layout.name.en}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {language === 'ar' ? layout.description.ar : layout.description.en}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Settings - 1 column */}
            <div className="col-span-1 space-y-3">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Settings2 className="w-4 h-4 text-primary" />
                  {language === 'ar' ? 'الإعدادات' : 'Settings'}
                </div>

                {/* Spacing */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{language === 'ar' ? 'المسافة' : 'Spacing'}</span>
                    <Badge variant="secondary" className="h-5 px-2 text-[10px]">{spacing}px</Badge>
                  </div>
                  <Slider
                    value={[spacing]}
                    onValueChange={([value]) => setSpacing(value)}
                    min={0}
                    max={60}
                    step={5}
                    className="accent-primary"
                  />
                </div>

                {/* Padding */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{language === 'ar' ? 'الهامش' : 'Padding'}</span>
                    <Badge variant="secondary" className="h-5 px-2 text-[10px]">{padding}px</Badge>
                  </div>
                  <Slider
                    value={[padding]}
                    onValueChange={([value]) => setPadding(value)}
                  min={0}
                  max={100}
                  step={10}
                  className="accent-primary"
                />
              </div>

                {(selectedLayout === 'grid' || selectedLayout === 'masonry') && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{language === 'ar' ? 'الأعمدة' : 'Columns'}</span>
                      <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                        {gridColumns === 0 ? (language === 'ar' ? 'تلقائي' : 'Auto') : gridColumns}
                      </Badge>
                    </div>
                    <Slider
                      value={[gridColumns]}
                      onValueChange={([value]) => setGridColumns(value)}
                      min={0}
                      max={6}
                      step={1}
                      className="accent-primary"
                    />
                  </div>
                )}

                {/* Alignment (for stacks) */}
                {(selectedLayout === 'stack-h' || selectedLayout === 'stack-v') && (
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? 'المحاذاة' : 'Alignment'}</span>
                    <div className="flex gap-1">
                      {ALIGNMENTS.map((align) => (
                        <Button
                          key={align.id}
                          variant={alignment === align.id ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 h-7 rounded-lg p-0"
                          onClick={() => setAlignment(align.id as typeof alignment)}
                        >
                          {align.icon}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Switches */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]">{language === 'ar' ? 'تغيير الحجم' : 'Resize'}</span>
                    <Switch checked={resizeToFit} onCheckedChange={setResizeToFit} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]">{language === 'ar' ? 'حفظ الترتيب' : 'Order'}</span>
                    <Switch checked={maintainOrder} onCheckedChange={setMaintainOrder} />
                  </div>
                </div>
              </div>

              {/* Animation - Compact */}
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  {language === 'ar' ? 'حركة' : 'Anim'}
                </div>
                
                <div className="grid grid-cols-2 gap-1">
                  {ANIMATIONS.slice(0, 4).map((anim) => (
                    <button
                      key={anim.id}
                      className={cn(
                        'p-1 rounded text-[9px] font-medium transition-all truncate',
                        animation === anim.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                      )}
                      onClick={() => setAnimation(anim.id)}
                      title={language === 'ar' ? anim.name.ar : anim.name.en}
                    >
                      {(language === 'ar' ? anim.name.ar : anim.name.en).substring(0, 7)}
                    </button>
                  ))}
                </div>

                {animation !== 'none' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">{language === 'ar' ? 'تأخير' : 'Delay'}</span>
                      <span className="text-primary font-bold">{animationDelay}s</span>
                    </div>
                    <Slider
                      value={[animationDelay]}
                      onValueChange={([value]) => setAnimationDelay(value)}
                      min={0}
                      max={0.5}
                      step={0.05}
                      className="accent-primary h-1"
                    />
                  </div>
                )}
              </div>

              {/* Save Layout - Compact */}
              <Button variant="outline" size="sm" className="w-full h-7 rounded-lg text-xs" onClick={handleSaveLayout}>
                <Save className="w-3 h-3 mr-1.5" />
                {language === 'ar' ? 'حفظ' : 'Save'}
              </Button>
            </div>

            {/* Preview - 2 columns */}
            <div className="col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Eye className="w-4 h-4 text-primary" />
                  {language === 'ar' ? 'معاينة' : 'Preview'}
                </div>
                <Button variant="ghost" size="sm" className="h-7 rounded-lg text-xs" onClick={handlePreviewAnimation}>
                  <Play className="w-3 h-3 mr-1" />
                  {language === 'ar' ? 'تشغيل' : 'Play'}
                </Button>
              </div>
              
              <div
                className="relative bg-gradient-to-br from-muted/50 to-muted rounded-xl overflow-hidden border border-border/50"
                style={{ aspectRatio: `${canvasWidth}/${canvasHeight}`, maxHeight: '350px' }}
              >
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }} />
                
                {previewElements.map((el, i) => (
                  <div
                    key={el.id}
                    className={cn(
                      "absolute bg-gradient-to-br from-primary/30 to-primary/20 border-2 border-primary/50 rounded-lg flex items-center justify-center text-xs font-bold text-primary shadow-sm transition-all duration-500",
                      isPreviewAnimating && animation !== 'none' && 'animate-in fade-in zoom-in-95'
                    )}
                    style={{
                      left: `${(el.x / canvasWidth) * 100}%`,
                      top: `${(el.y / canvasHeight) * 100}%`,
                      width: `${(el.width / canvasWidth) * 100}%`,
                      height: `${(el.height / canvasHeight) * 100}%`,
                      animationDelay: isPreviewAnimating ? `${i * animationDelay}s` : '0s',
                    }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Saved Layouts */}
              {savedLayouts.length > 0 && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold">{language === 'ar' ? 'التخطيطات المحفوظة' : 'Saved Layouts'}</span>
                    <Badge variant="secondary" className="h-5 px-2 text-[10px]">{savedLayouts.length}</Badge>
                  </div>
                  <div className="space-y-1 max-h-[100px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20">
                    {savedLayouts.map((saved, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-background/50 rounded-lg text-xs group">
                        <button className="flex-1 text-left font-medium truncate" onClick={() => handleLoadLayout(saved)}>
                          {saved.name}
                        </button>
                        <Badge variant="outline" className="h-5 px-1.5 text-[9px]">{saved.type}</Badge>
                        <button 
                          className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity" 
                          onClick={() => handleDeleteSavedLayout(i)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t shrink-0 gap-2">
          <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => {
            setSelectedLayout('grid');
            setSpacing(20);
            setPadding(40);
            setAnimation('none');
          }}>
            <RotateCcw className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
          </Button>
          <div className="flex-1" />
          <Button variant="outline" className="rounded-lg" onClick={() => setIsOpen(false)}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button className="rounded-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" onClick={handleApply}>
            <Wand2 className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'تطبيق التخطيط' : 'Apply Layout'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SmartLayouts;
