import { useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SlideTemplate } from '@/data/templates';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ImportPPTX } from './ImportPPTX';
import { ImportPDF } from './importPDF';

const UploadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const FileIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

interface ImportFileProps {
  onImport: (slides: SlideTemplate[], title: string, size: { width: number; height: number }) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

// Single import entry point: picks the right importer from the file extension.
// The chooser dialog lives outside any dropdown menu so it survives menu closes on mobile.
export const ImportFile = ({ onImport, open, onOpenChange, hideTrigger }: ImportFileProps) => {
  const { language } = useLanguage();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const [pptxFile, setPptxFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const setOpen = (o: boolean) => {
    if (!isControlled) setInternalOpen(o);
    onOpenChange?.(o);
  };

  const routeFile = (file: File) => {
    if (/\.pdf$/i.test(file.name)) {
      setPdfFile(file);
      setOpen(false);
    } else if (/\.(pptx|ppt)$/i.test(file.name)) {
      setPptxFile(file);
      setOpen(false);
    } else {
      toast.error(t('صيغة غير مدعومة — اختر ملف PowerPoint أو PDF', 'Unsupported format — choose a PowerPoint or PDF file'));
    }
  };

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) routeFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) routeFile(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pptx,.ppt,.pdf,application/pdf"
        className="hidden"
        onChange={handlePick}
      />

      {!hideTrigger && (
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
          <UploadIcon />
          {t('استيراد', 'Import')}
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent className="max-w-md w-[92vw] bg-white dark:bg-gray-900 shadow-2xl border-0 rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3 border-b bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
            <DialogTitle className="text-base font-semibold text-gray-800 dark:text-gray-100 pr-8">
              {t('استيراد ملف', 'Import file')}
            </DialogTitle>
          </DialogHeader>
          <div className="p-5">
            <div
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/20"
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FileIcon />
              </div>
              <p className="mt-3 text-base font-medium text-gray-700 dark:text-gray-200">
                {t('اسحب ملف PowerPoint أو PDF هنا', 'Drop a PowerPoint or PDF file here')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('أو انقر للاختيار', 'or click to browse')}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                PPTX · PPT · PDF
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {pdfFile && (
        <ImportPDF
          onImport={onImport}
          open
          hideTrigger
          initialFile={pdfFile}
          onOpenChange={(o) => { if (!o) setPdfFile(null); }}
        />
      )}
      {pptxFile && (
        <ImportPPTX
          onImport={onImport}
          open
          hideTrigger
          initialFile={pptxFile}
          onOpenChange={(o) => { if (!o) setPptxFile(null); }}
        />
      )}
    </>
  );
};

export default ImportFile;
