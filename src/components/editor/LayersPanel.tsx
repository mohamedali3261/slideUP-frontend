import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SlideElement } from '@/data/templates';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  MoreVertical,
  Type,
  Image,
  Square,
  Circle,
  Minus,
  ArrowRight,
  BarChart3,
  Video,
  Music,
  Smile,
  GripVertical,
} from 'lucide-react';

interface LayersPanelProps {
  elements: SlideElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<SlideElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onReorderElements: (elements: SlideElement[]) => void;
}

// Get icon for element type
const getElementIcon = (element: SlideElement) => {
  switch (element.type) {
    case 'text':
      return <Type className="w-4 h-4" />;
    case 'image':
      return <Image className="w-4 h-4" />;
    case 'shape':
      if (element.shapeType === 'circle') return <Circle className="w-4 h-4" />;
      if (element.shapeType === 'line') return <Minus className="w-4 h-4" />;
      if (element.shapeType === 'arrow') return <ArrowRight className="w-4 h-4" />;
      return <Square className="w-4 h-4" />;
    case 'chart':
      return <BarChart3 className="w-4 h-4" />;
    case 'video':
      return <Video className="w-4 h-4" />;
    case 'audio':
      return <Music className="w-4 h-4" />;
    case 'icon':
      return <Smile className="w-4 h-4" />;
    default:
      return <Square className="w-4 h-4" />;
  }
};

// Get element name
const getElementName = (element: SlideElement, language: string) => {
  const names: Record<string, { en: string; ar: string }> = {
    text: { en: 'Text', ar: 'نص' },
    image: { en: 'Image', ar: 'صورة' },
    shape: { en: 'Shape', ar: 'شكل' },
    chart: { en: 'Chart', ar: 'رسم بياني' },
    video: { en: 'Video', ar: 'فيديو' },
    audio: { en: 'Audio', ar: 'صوت' },
    icon: { en: 'Icon', ar: 'أيقونة' },
  };
  
  const base = names[element.type] || { en: 'Element', ar: 'عنصر' };
  const name = language === 'ar' ? base.ar : base.en;
  
  if (element.type === 'text' && element.content) {
    const preview = element.content.substring(0, 20);
    return preview.length < element.content.length ? `${preview}...` : preview;
  }
  
  return name;
};

export const LayersPanel = ({
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onReorderElements,
}: LayersPanelProps) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sort elements by zIndex (higher zIndex = top of list)
  const sortedElements = [...elements].sort((a, b) => 
    (b.zIndex || 0) - (a.zIndex || 0)
  );

  // Move element in z-order
  const moveElement = (elementId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    const currentIndex = sortedElements.findIndex(el => el.id === elementId);
    if (currentIndex === -1) return;

    const newElements = [...sortedElements];
    let newIndex: number;

    switch (direction) {
      case 'up':
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case 'down':
        newIndex = Math.min(newElements.length - 1, currentIndex + 1);
        break;
      case 'top':
        newIndex = 0;
        break;
      case 'bottom':
        newIndex = newElements.length - 1;
        break;
    }

    // Swap elements
    const [removed] = newElements.splice(currentIndex, 1);
    newElements.splice(newIndex, 0, removed);

    // Update zIndex for all elements
    const updatedElements = newElements.map((el, index) => ({
      ...el,
      zIndex: newElements.length - index,
    }));

    onReorderElements(updatedElements);
  };

  // Handle drag start
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newElements = [...sortedElements];
    const [removed] = newElements.splice(draggedIndex, 1);
    newElements.splice(index, 0, removed);

    // Update zIndex
    const updatedElements = newElements.map((el, i) => ({
      ...el,
      zIndex: newElements.length - i,
    }));

    onReorderElements(updatedElements);
    setDraggedIndex(index);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-7 px-2 text-xs">
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {language === 'ar' ? 'الطبقات' : 'Layers'}
          </span>
          {elements.length > 0 && (
            <span className="ml-0.5 px-1 py-0 text-[9px] bg-muted rounded-full">
              {elements.length}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-80 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            {language === 'ar' ? 'الطبقات' : 'Layers'}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          {elements.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>{language === 'ar' ? 'لا توجد عناصر' : 'No elements'}</p>
              <p className="text-sm mt-1">
                {language === 'ar' 
                  ? 'أضف عناصر للشريحة لتظهر هنا'
                  : 'Add elements to the slide to see them here'}
              </p>
            </div>
          ) : (
            <div className="p-2">
              {sortedElements.map((element, index) => (
                <div
                  key={element.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
                    selectedElementId === element.id
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-muted/50',
                    draggedIndex === index && 'opacity-50'
                  )}
                  onClick={() => onSelectElement(element.id)}
                >
                  {/* Drag Handle */}
                  <div className="cursor-grab opacity-0 group-hover:opacity-50 hover:opacity-100">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Element Icon */}
                  <div className="flex-shrink-0 w-8 h-8 rounded bg-muted flex items-center justify-center">
                    {getElementIcon(element)}
                  </div>

                  {/* Element Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {getElementName(element, language)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(element.x)}, {Math.round(element.y)}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    {/* Move Up */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveElement(element.id, 'up');
                          }}
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
                        <div className="flex items-center gap-1.5">
                          <ChevronUp className="w-3 h-3" />
                          {language === 'ar' ? 'تحريك للأعلى' : 'Move Up'}
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    {/* Move Down */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveElement(element.id, 'down');
                          }}
                          disabled={index === sortedElements.length - 1}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
                        <div className="flex items-center gap-1.5">
                          <ChevronDown className="w-3 h-3" />
                          {language === 'ar' ? 'تحريك للأسفل' : 'Move Down'}
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    {/* More Options */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => moveElement(element.id, 'top')}
                        >
                          <ChevronsUp className="w-4 h-4 mr-2" />
                          {language === 'ar' ? 'نقل للأمام' : 'Bring to Front'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => moveElement(element.id, 'bottom')}
                        >
                          <ChevronsDown className="w-4 h-4 mr-2" />
                          {language === 'ar' ? 'نقل للخلف' : 'Send to Back'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDuplicateElement(element.id)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          {language === 'ar' ? 'تكرار' : 'Duplicate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDeleteElement(element.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {language === 'ar' ? 'حذف' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default LayersPanel;
