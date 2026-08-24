import { useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { SlideTemplate } from '@/data/templates';
import { toast } from 'sonner';
import { ImportPPTX } from './ImportPPTX';
import { ImportPDF } from './ImportPDF';

const UploadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

interface ImportFileProps {
  onImport: (slides: SlideTemplate[], title: string, size: { width: number; height: number }) => void;
}

// Single import entry point: picks the right importer from the file extension
export const ImportFile = ({ onImport }: ImportFileProps) => {
  const { language } = useLanguage();
  const [pptxFile, setPptxFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (/\.pdf$/i.test(file.name)) setPdfFile(file);
    else if (/\.(pptx|ppt)$/i.test(file.name)) setPptxFile(file);
    else toast.error(t('صيغة غير مدعومة — اختر ملف PowerPoint أو PDF', 'Unsupported format — choose a PowerPoint or PDF file'));
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
      <Button variant="outline" size="sm" className="gap-2" onClick={() => inputRef.current?.click()}>
        <UploadIcon />
        {t('استيراد', 'Import')}
      </Button>

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
