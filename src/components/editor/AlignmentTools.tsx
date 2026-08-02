import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  AlignLeft, AlignCenter, AlignRight, 
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  Columns, Rows, Grid3X3, Maximize, Copy, Layers
} from 'lucide-react';
import { SlideElement } from '@/data/templates';
import { toast } from 'sonner';

interface AlignmentToolsProps {
  selectedElements: SlideElement[];
  canvasWidth: number;
  canvasHeight: number;
  onUpdateElements: (updates: { id: string; updates: Partial<SlideElement> }[]) => void;
  onDuplicateElement: (element: SlideElement) => void;
  onBringToFront: (elementId: string) => void;
  onSendToBack: (elementId: string) => void;
}

export const AlignmentTools = ({
  selectedElements,
  canvasWidth,
  canvasHeight,
  onUpdateElements,
  onDuplicateElement,
  onBringToFront,
  onSendToBack,
}: AlignmentToolsProps) => {
  const hasSelection = selectedElements.length > 0;
  const hasMultipleSelection = selectedElements.length > 1;

  // Horizontal Alignment
  const alignLeft = () => {
    const updates = selectedElements.map(el => ({
      id: el.id,
      updates: { x: 20 }
    }));
    onUpdateElements(updates);
    toast.success('Aligned left');
  };

  const alignCenter = () => {
    const updates = selectedElements.map(el => ({
      id: el.id,
      updates: { x: (canvasWidth - el.width) / 2 }
    }));
    onUpdateElements(updates);
    toast.success('Aligned center');
  };

  const alignRight = () => {
    const updates = selectedElements.map(el => ({
      id: el.id,
      updates: { x: canvasWidth - el.width - 20 }
    }));
    onUpdateElements(updates);
    toast.success('Aligned right');
  };

  // Vertical Alignment
  const alignTop = () => {
    const updates = selectedElements.map(el => ({
      id: el.id,
      updates: { y: 20 }
    }));
    onUpdateElements(updates);
    toast.success('Aligned top');
  };

  const alignMiddle = () => {
    const updates = selectedElements.map(el => ({
      id: el.id,
      updates: { y: (canvasHeight - el.height) / 2 }
    }));
    onUpdateElements(updates);
    toast.success('Aligned middle');
  };

  const alignBottom = () => {
    const updates = selectedElements.map(el => ({
      id: el.id,
      updates: { y: canvasHeight - el.height - 20 }
    }));
    onUpdateElements(updates);
    toast.success('Aligned bottom');
  };

  // Distribution
  const distributeHorizontally = () => {
    if (selectedElements.length < 3) {
      toast.error('Need at least 3 elements to distribute');
      return;
    }

    const sorted = [...selectedElements].sort((a, b) => a.x - b.x);
    const totalWidth = sorted.reduce((acc, el) => acc + el.width, 0);
    const availableSpace = canvasWidth - 40 - totalWidth;
    const gap = availableSpace / (sorted.length - 1);

    let currentX = 20;
    const updates = sorted.map(el => {
      const update = { id: el.id, updates: { x: currentX } };
      currentX += el.width + gap;
      return update;
    });

    onUpdateElements(updates);
    toast.success('Distributed horizontally');
  };

  const distributeVertically = () => {
    if (selectedElements.length < 3) {
      toast.error('Need at least 3 elements to distribute');
      return;
    }

    const sorted = [...selectedElements].sort((a, b) => a.y - b.y);
    const totalHeight = sorted.reduce((acc, el) => acc + el.height, 0);
    const availableSpace = canvasHeight - 40 - totalHeight;
    const gap = availableSpace / (sorted.length - 1);

    let currentY = 20;
    const updates = sorted.map(el => {
      const update = { id: el.id, updates: { y: currentY } };
      currentY += el.height + gap;
      return update;
    });

    onUpdateElements(updates);
    toast.success('Distributed vertically');
  };

  // Center on canvas
  const centerOnCanvas = () => {
    const updates = selectedElements.map(el => ({
      id: el.id,
      updates: { 
        x: (canvasWidth - el.width) / 2,
        y: (canvasHeight - el.height) / 2
      }
    }));
    onUpdateElements(updates);
    toast.success('Centered on canvas');
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Alignment & Layout</Label>

      {/* Horizontal Alignment */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Horizontal</span>
        <div className="flex gap-1">
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                disabled={!hasSelection}
                onClick={alignLeft}
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
              <div className="flex items-center gap-1.5">
                <AlignLeft className="w-3 h-3" />
                Align Left
              </div>
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                disabled={!hasSelection}
                onClick={alignCenter}
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
              <div className="flex items-center gap-1.5">
                <AlignCenter className="w-3 h-3" />
                Align Center
              </div>
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                disabled={!hasSelection}
                onClick={alignRight}
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
              <div className="flex items-center gap-1.5">
                <AlignRight className="w-3 h-3" />
                Align Right
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Vertical Alignment */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Vertical</span>
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            disabled={!hasSelection}
            onClick={alignTop}
            title="Align Top"
          >
            <AlignStartVertical className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            disabled={!hasSelection}
            onClick={alignMiddle}
            title="Align Middle"
          >
            <AlignCenterVertical className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            disabled={!hasSelection}
            onClick={alignBottom}
            title="Align Bottom"
          >
            <AlignEndVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Distribution */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Distribute</span>
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            disabled={!hasMultipleSelection}
            onClick={distributeHorizontally}
            title="Distribute Horizontally"
          >
            <Columns className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            disabled={!hasMultipleSelection}
            onClick={distributeVertically}
            title="Distribute Vertically"
          >
            <Rows className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            disabled={!hasSelection}
            onClick={centerOnCanvas}
            title="Center on Canvas"
          >
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Quick Actions */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Quick Actions</span>
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            disabled={selectedElements.length !== 1}
            onClick={() => selectedElements[0] && onDuplicateElement(selectedElements[0])}
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            disabled={selectedElements.length !== 1}
            onClick={() => selectedElements[0] && onBringToFront(selectedElements[0].id)}
            title="Bring to Front"
          >
            <Layers className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            disabled={selectedElements.length !== 1}
            onClick={() => selectedElements[0] && onSendToBack(selectedElements[0].id)}
            title="Send to Back"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AlignmentTools;
