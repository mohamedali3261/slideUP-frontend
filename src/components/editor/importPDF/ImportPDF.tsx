import { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { SlideTemplate } from '@/data/templates';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CANVAS_W, ImportPDFProps, ImportStatus } from './types';
import { useParsePDF } from './useParsePDF';

// ─── Icons ────────────────────────────────────────────────────────────────────
const UploadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const FileIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────
export const ImportPDF = ({
  onImport,
  open,
  onOpenChange,
  hideTrigger,
  initialFile,
}: ImportPDFProps) => {
  const { language } = useLanguage();
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>({
    stage: 'idle', progress: 0, message: '',
  });
  const [previewSlides, setPreviewSlides] = useState<SlideTemplate[]>([]);
  const [previewUrls,   setPreviewUrls]   = useState<string[]>([]);
  const [importedSize,  setImportedSize]  = useState({
    width: CANVAS_W,
    height: Math.round(CANVAS_W * 297 / 210),
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { parsePDF } = useParsePDF(language, setStatus);

  // ── Auto-process selected file ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedFile) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await parsePDF(selectedFile);
        if (cancelled) return;
        setPreviewSlides(result.slides);
        setPreviewUrls(result.previews);
        setImportedSize(result.size);
        if (result.slides.length > 40) {
          toast.warning(t(
            'الملف كبير، قد يستغرق الحفظ وقتًا أطول',
            'Large file: saving may take longer',
          ));
        }
        const noEditableBits = result.slides.every(s =>
          !s.elements?.some(
            el => el.type === 'text' || (el.type === 'image' && !el.locked) || el.type === 'shape',
          ),
        );
        if (noEditableBits) {
          toast.info(
            t(
              'الملف صورة ممسوحة بدون نصوص أو عناصر قابلة للفصل — هتظهر الصفحة كخلفية',
              'This looks like a scanned image-only PDF — the page will be imported as a locked background',
            ),
            { duration: 8000 },
          );
        }
      } catch (error) {
        if (cancelled) return;
        console.error('PDF import error:', error);
        setStatus({
          stage: 'error',
          progress: 0,
          message:
            error instanceof Error
              ? error.message
              : t('فشل استيراد الملف', 'Import failed'),
        });
      }
    })();
    return () => { cancelled = true; };
  }, [selectedFile, parsePDF]);

  // ── Auto-load file passed from outside ────────────────────────────────────
  useEffect(() => {
    if (isOpen && initialFile) {
      setStatus({ stage: 'idle', progress: 0, message: '' });
      setPreviewSlides([]);
      setPreviewUrls([]);
      setSelectedFile(initialFile);
    }
  }, [isOpen, initialFile]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const resetState = useCallback(() => {
    setSelectedFile(null);
    setStatus({ stage: 'idle', progress: 0, message: '' });
    setPreviewSlides([]);
    setPreviewUrls([]);
    setImportedSize({ width: CANVAS_W, height: Math.round(CANVAS_W * 297 / 210) });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleOpenChange = useCallback((next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
    if (!next) resetState();
  }, [isControlled, onOpenChange, resetState]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.name.match(/\.pdf$/i)) {
        toast.error(t('يرجى اختيار ملف PDF', 'Please select a PDF file'));
        return;
      }
      setSelectedFile(file);
      setStatus({ stage: 'idle', progress: 0, message: '' });
      setPreviewSlides([]);
      setPreviewUrls([]);
    },
    [language],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInputRef.current.files = dt.files;
        handleFileSelect({
          target: { files: dt.files },
        } as React.ChangeEvent<HTMLInputElement>);
      }
    },
    [handleFileSelect],
  );

  const handleImport = useCallback(() => {
    if (previewSlides.length === 0) return;
    const title = selectedFile?.name.replace(/\.pdf$/i, '') || 'Imported PDF';
    onImport(previewSlides, title, importedSize);
    toast.success(
      t(`تم استيراد ${previewSlides.length} صفحات!`, `Imported ${previewSlides.length} pages!`),
    );
    handleOpenChange(false);
  }, [previewSlides, selectedFile, onImport, importedSize, language, handleOpenChange]);

  const busy = status.stage === 'reading' || status.stage === 'rendering';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <UploadIcon />
            {t('استيراد PDF', 'Import PDF')}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-xl w-[95vw] max-h-[85vh] bg-white dark:bg-gray-900 shadow-2xl border-0 rounded-2xl p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100 pr-8">
            {t('استيراد ملف PDF', 'Import PDF')}
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20">
          {/* ── Drop zone ── */}
          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
              status.stage === 'error'
                ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-red-400 hover:bg-red-50/50 dark:hover:border-red-600 dark:hover:bg-red-950/20',
            )}
            onClick={() => !busy && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />

            {!selectedFile ? (
              <div className="space-y-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400">
                  <FileIcon />
                </div>
                <div>
                  <p className="text-base font-medium text-gray-700 dark:text-gray-200">
                    {t('اسحب ملف PDF هنا', 'Drop PDF file here')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('أو انقر للاختيار', 'or click to browse')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0">
                    <FileIcon />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-gray-100 truncate text-sm">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                {busy && (
                  <div className="space-y-2 max-w-xs mx-auto">
                    <Progress value={status.progress} className="h-2 bg-gray-200 dark:bg-gray-700" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">{status.message}</p>
                  </div>
                )}

                {status.stage === 'done' && (
                  <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                      <CheckIcon />
                    </div>
                    <span>{status.message}</span>
                  </div>
                )}

                {status.stage === 'error' && (
                  <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-medium text-sm">
                    <AlertIcon />
                    <span>{status.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
            {t(
              'هيتفصل تلقائيًا النصوص والصور والأشكال عشان تقدر تعدّلها وتحرّكها',
              'Texts, images and shapes are extracted automatically so you can edit and move them',
            )}
          </p>

          {/* ── Page previews ── */}
          {previewUrls.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {t(`معاينة (${previewUrls.length} صفحات)`, `Preview (${previewUrls.length} pages)`)}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 items-start">
                {previewUrls.slice(0, 8).map((url, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm"
                    style={{
                      width: 110,
                      height: Math.round(110 * importedSize.height / importedSize.width),
                    }}
                  >
                    <img
                      src={url}
                      alt={`Page ${index + 1}`}
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  </div>
                ))}
                {previewUrls.length > 8 && (
                  <div
                    className="flex-shrink-0 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center"
                    style={{
                      width: 110,
                      height: Math.round(110 * importedSize.height / importedSize.width),
                    }}
                  >
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      +{previewUrls.length - 8}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="px-4 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {t('إلغاء', 'Cancel')}
          </Button>
          <Button
            onClick={handleImport}
            disabled={previewSlides.length === 0 || status.stage === 'error' || busy}
            className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('استيراد', 'Import')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportPDF;
