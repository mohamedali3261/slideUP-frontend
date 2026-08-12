import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SlideTemplate } from '@/data/templates';
import { exportToImages } from '@/lib/exportUtils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, CheckSquare, Square, Download, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportImagesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  slides: SlideTemplate[];
  presentationTitle: string;
  canvasWidth?: number;
  canvasHeight?: number;
}

export const ExportImagesDialog = ({
  isOpen,
  onClose,
  slides,
  presentationTitle,
  canvasWidth = 960,
  canvasHeight = 540,
}: ExportImagesDialogProps) => {
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  const [selected, setSelected] = useState<Set<number>>(() => new Set(slides.map((_, i) => i)));
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const toggleSlide = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev =>
      prev.size === slides.length ? new Set() : new Set(slides.map((_, i) => i))
    );
  };

  const handleExport = useCallback(async () => {
    if (selected.size === 0) return;
    const indices = Array.from(selected).sort((a, b) => a - b);
    setProgress({ done: 0, total: indices.length });
    setIsExporting(true);
    try {
      await exportToImages(
        slides,
        presentationTitle,
        canvasWidth,
        canvasHeight,
        indices,
        (done, total) => setProgress({ done, total }),
      );
    } finally {
      setIsExporting(false);
      onClose();
    }
  }, [selected, slides, presentationTitle, canvasWidth, canvasHeight, onClose]);

  const progressPct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const allSelected = selected.size === slides.length;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && !isExporting && onClose()}>
      <DialogContent
        className="max-w-2xl w-full p-0 gap-0 overflow-hidden"
        style={{ display: 'flex', flexDirection: 'column', maxHeight: '90dvh' }}
      >
        <DialogTitle className="sr-only">
          {isRtl ? 'تصدير صور' : 'Export Images'}
        </DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-base">
              {isRtl ? 'تصدير الشرائح كصور' : 'Export Slides as Images'}
            </h2>
            <Badge variant="secondary" className="text-xs">
              {selected.size} / {slides.length}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isExporting} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Select All */}
        <div className="px-5 py-2 border-b bg-muted/30 flex items-center justify-between">
          <button
            onClick={toggleAll}
            disabled={isExporting}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors disabled:opacity-50"
          >
            {allSelected
              ? <CheckSquare className="w-4 h-4 text-primary" />
              : <Square className="w-4 h-4 text-muted-foreground" />}
            {isRtl ? (allSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل') : (allSelected ? 'Deselect All' : 'Select All')}
          </button>
          <span className="text-xs text-muted-foreground">
            {isRtl
              ? `${selected.size} شريحة محددة`
              : `${selected.size} slide${selected.size !== 1 ? 's' : ''} selected`}
          </span>
        </div>

        {/* Slide Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {slides.map((slide, i) => {
              const isChecked = selected.has(i);
              return (
                <button
                  key={slide.id}
                  onClick={() => !isExporting && toggleSlide(i)}
                  disabled={isExporting}
                  className={cn(
                    'relative rounded-lg border-2 overflow-hidden transition-all text-left group',
                    isChecked
                      ? 'border-primary ring-2 ring-primary/25'
                      : 'border-border hover:border-primary/50',
                    isExporting && 'cursor-not-allowed opacity-70',
                  )}
                >
                  {/* Thumbnail */}
                  <div
                    className="w-full aspect-video flex items-end justify-start p-1"
                    style={{ background: slide.backgroundColor || '#1e293b' }}
                  >
                    <span
                      className="text-[9px] font-bold leading-none px-1 py-0.5 rounded bg-black/30 text-white"
                    >
                      {i + 1}
                    </span>
                  </div>

                  {/* Slide title */}
                  <div className="px-2 py-1.5 bg-card">
                    <p
                      className="text-[10px] leading-tight truncate font-medium"
                      title={slide.title}
                    >
                      {slide.title || `Slide ${i + 1}`}
                    </p>
                    <p className="text-[9px] text-muted-foreground capitalize mt-0.5">{slide.type}</p>
                  </div>

                  {/* Check overlay */}
                  <div
                    className={cn(
                      'absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all',
                      isChecked
                        ? 'bg-primary border-primary'
                        : 'bg-background/80 border-border group-hover:border-primary/60',
                    )}
                  >
                    {isChecked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Progress overlay while exporting */}
                  {isExporting && isChecked && progress.done < Array.from(selected).sort((a,b)=>a-b).indexOf(i) + 1 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3 bg-card">
          {isExporting ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {isRtl ? `جاري التصدير...` : 'Exporting...'}
                </span>
                <span className="font-medium">{progress.done} / {progress.total}</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {isRtl
                  ? 'سيتم تحميل كل صورة بدقة 1920×1080'
                  : 'Each image exports at 1920 px wide'}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  size="sm"
                  onClick={handleExport}
                  disabled={selected.size === 0}
                  className="gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isRtl
                    ? `تصدير ${selected.size} صورة`
                    : `Export ${selected.size} image${selected.size !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportImagesDialog;
