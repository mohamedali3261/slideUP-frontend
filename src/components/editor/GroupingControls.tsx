import { useLanguage } from '@/contexts/LanguageContext';
import { SlideElement } from '@/data/templates';
import { Button } from '@/components/ui/button';
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
import {
  Group,
  Ungroup,
  ChevronDown,
  Copy,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
} from 'lucide-react';

export interface ElementGroup {
  id: string;
  elementIds: string[];
  name?: string;
}

interface GroupingControlsProps {
  selectedElementIds: string[];
  elements: SlideElement[];
  groups: ElementGroup[];
  onGroup: (elementIds: string[]) => void;
  onUngroup: (groupId: string) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onAlignSelected: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onDistributeSelected: (direction: 'horizontal' | 'vertical') => void;
}

export const GroupingControls = ({
  selectedElementIds,
  elements,
  groups,
  onGroup,
  onUngroup,
  onDeleteSelected,
  onDuplicateSelected,
  onAlignSelected,
  onDistributeSelected,
}: GroupingControlsProps) => {
  const { language } = useLanguage();
  const hasMultipleSelected = selectedElementIds.length > 1;
  const hasSelection = selectedElementIds.length > 0;

  // Check if selected elements are in a group
  const selectedGroup = groups.find(g => 
    selectedElementIds.length > 0 &&
    selectedElementIds.every(id => g.elementIds.includes(id)) &&
    g.elementIds.every(id => selectedElementIds.includes(id))
  );

  // Check if any selected element is part of a group
  const partOfGroup = groups.find(g =>
    selectedElementIds.some(id => g.elementIds.includes(id))
  );

  if (!hasSelection) return null;

  return (
    <div className="flex items-center gap-1 bg-card border rounded-lg p-1">
      {/* Group/Ungroup */}
      {hasMultipleSelected && !selectedGroup && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onGroup(selectedElementIds)}
            >
              <Group className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
            <div className="flex items-center gap-1.5">
              <Group className="w-3 h-3" />
              {language === 'ar' ? 'تجميع' : 'Group'} (Ctrl+G)
            </div>
          </TooltipContent>
        </Tooltip>
      )}

      {selectedGroup && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUngroup(selectedGroup.id)}
            >
              <Ungroup className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
            <div className="flex items-center gap-1.5">
              <Ungroup className="w-3 h-3" />
              {language === 'ar' ? 'فك التجميع' : 'Ungroup'} (Ctrl+Shift+G)
            </div>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Alignment Dropdown */}
      {hasMultipleSelected && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              <AlignLeft className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onAlignSelected('left')}>
              <AlignLeft className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'محاذاة لليسار' : 'Align Left'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAlignSelected('center')}>
              <AlignCenter className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'محاذاة للوسط' : 'Align Center'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAlignSelected('right')}>
              <AlignRight className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'محاذاة لليمين' : 'Align Right'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAlignSelected('top')}>
              <AlignStartVertical className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'محاذاة للأعلى' : 'Align Top'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAlignSelected('middle')}>
              <AlignCenterVertical className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'محاذاة للمنتصف' : 'Align Middle'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAlignSelected('bottom')}>
              <AlignEndVertical className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'محاذاة للأسفل' : 'Align Bottom'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDistributeSelected('horizontal')}>
              {language === 'ar' ? 'توزيع أفقي' : 'Distribute Horizontally'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDistributeSelected('vertical')}>
              {language === 'ar' ? 'توزيع عمودي' : 'Distribute Vertically'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Duplicate */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onDuplicateSelected}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
          <div className="flex items-center gap-1.5">
            <Copy className="w-3 h-3" />
            {language === 'ar' ? 'تكرار' : 'Duplicate'} (Ctrl+D)
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Delete */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDeleteSelected}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
          <div className="flex items-center gap-1.5">
            <Trash2 className="w-3 h-3" />
            {language === 'ar' ? 'حذف' : 'Delete'} (Del)
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Selection Count */}
      <div className="px-2 text-sm text-muted-foreground border-l ml-1">
        {selectedElementIds.length} {language === 'ar' ? 'محدد' : 'selected'}
      </div>
    </div>
  );
};

// Helper functions for grouping operations
export const createGroup = (elementIds: string[]): ElementGroup => ({
  id: `group-${Date.now()}`,
  elementIds,
});

export const alignElements = (
  elements: SlideElement[],
  elementIds: string[],
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
): SlideElement[] => {
  const selectedElements = elements.filter(el => elementIds.includes(el.id));
  if (selectedElements.length < 2) return elements;

  let targetValue: number;

  switch (alignment) {
    case 'left':
      targetValue = Math.min(...selectedElements.map(el => el.x));
      return elements.map(el =>
        elementIds.includes(el.id) ? { ...el, x: targetValue } : el
      );
    case 'center':
      const minX = Math.min(...selectedElements.map(el => el.x));
      const maxX = Math.max(...selectedElements.map(el => el.x + el.width));
      const centerX = (minX + maxX) / 2;
      return elements.map(el =>
        elementIds.includes(el.id) ? { ...el, x: centerX - el.width / 2 } : el
      );
    case 'right':
      targetValue = Math.max(...selectedElements.map(el => el.x + el.width));
      return elements.map(el =>
        elementIds.includes(el.id) ? { ...el, x: targetValue - el.width } : el
      );
    case 'top':
      targetValue = Math.min(...selectedElements.map(el => el.y));
      return elements.map(el =>
        elementIds.includes(el.id) ? { ...el, y: targetValue } : el
      );
    case 'middle':
      const minY = Math.min(...selectedElements.map(el => el.y));
      const maxY = Math.max(...selectedElements.map(el => el.y + el.height));
      const centerY = (minY + maxY) / 2;
      return elements.map(el =>
        elementIds.includes(el.id) ? { ...el, y: centerY - el.height / 2 } : el
      );
    case 'bottom':
      targetValue = Math.max(...selectedElements.map(el => el.y + el.height));
      return elements.map(el =>
        elementIds.includes(el.id) ? { ...el, y: targetValue - el.height } : el
      );
    default:
      return elements;
  }
};

export const distributeElements = (
  elements: SlideElement[],
  elementIds: string[],
  direction: 'horizontal' | 'vertical'
): SlideElement[] => {
  const selectedElements = elements.filter(el => elementIds.includes(el.id));
  if (selectedElements.length < 3) return elements;

  if (direction === 'horizontal') {
    const sorted = [...selectedElements].sort((a, b) => a.x - b.x);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalWidth = sorted.reduce((sum, el) => sum + el.width, 0);
    const availableSpace = (last.x + last.width) - first.x - totalWidth;
    const gap = availableSpace / (sorted.length - 1);

    let currentX = first.x;
    const newPositions = new Map<string, number>();
    
    sorted.forEach((el) => {
      newPositions.set(el.id, currentX);
      currentX += el.width + gap;
    });

    return elements.map(el =>
      newPositions.has(el.id) ? { ...el, x: newPositions.get(el.id)! } : el
    );
  } else {
    const sorted = [...selectedElements].sort((a, b) => a.y - b.y);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalHeight = sorted.reduce((sum, el) => sum + el.height, 0);
    const availableSpace = (last.y + last.height) - first.y - totalHeight;
    const gap = availableSpace / (sorted.length - 1);

    let currentY = first.y;
    const newPositions = new Map<string, number>();
    
    sorted.forEach((el) => {
      newPositions.set(el.id, currentY);
      currentY += el.height + gap;
    });

    return elements.map(el =>
      newPositions.has(el.id) ? { ...el, y: newPositions.get(el.id)! } : el
    );
  }
};

export default GroupingControls;
