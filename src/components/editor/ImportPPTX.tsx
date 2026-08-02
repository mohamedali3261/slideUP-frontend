import { useState, useCallback, useRef } from 'react';
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
import { SlideTemplate, SlideElement } from '@/data/templates';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import JSZip from 'jszip';

const UploadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const FileIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

interface ImportPPTXProps {
  onImport: (slides: SlideTemplate[], title: string) => void;
}

interface ImportStatus {
  stage: 'idle' | 'reading' | 'parsing' | 'converting' | 'done' | 'error';
  progress: number;
  message: string;
  slideCount?: number;
}

// Canvas dimensions - same as editor
const CANVAS_W = 960;
const CANVAS_H = 540;

export const ImportPPTX = ({ onImport }: ImportPPTXProps) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ImportStatus>({ stage: 'idle', progress: 0, message: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewSlides, setPreviewSlides] = useState<SlideTemplate[]>([]);
  const [importImages, setImportImages] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsePPTX = useCallback(async (file: File): Promise<SlideTemplate[]> => {
    setStatus({ stage: 'reading', progress: 10, message: language === 'ar' ? 'قراءة الملف...' : 'Reading file...' });
    
    const arrayBuffer = await file.arrayBuffer();
    
    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(arrayBuffer);
    } catch {
      throw new Error(language === 'ar' ? 'الملف ليس PPTX صالح' : 'Invalid PPTX file');
    }
    
    setStatus({ stage: 'parsing', progress: 30, message: language === 'ar' ? 'تحليل...' : 'Parsing...' });
    
    // Get slide dimensions from presentation.xml
    let slideWidthEMU = 12192000; // Default 16:9 widescreen
    let slideHeightEMU = 6858000;
    
    const presXml = await zip.file('ppt/presentation.xml')?.async('text');
    if (presXml) {
      const sldSzMatch = presXml.match(/<p:sldSz[^>]+cx="(\d+)"[^>]+cy="(\d+)"/);
      if (sldSzMatch) {
        slideWidthEMU = parseInt(sldSzMatch[1]);
        slideHeightEMU = parseInt(sldSzMatch[2]);
      } else {
        // Try reverse order
        const sldSzMatch2 = presXml.match(/<p:sldSz[^>]+cy="(\d+)"[^>]+cx="(\d+)"/);
        if (sldSzMatch2) {
          slideHeightEMU = parseInt(sldSzMatch2[1]);
          slideWidthEMU = parseInt(sldSzMatch2[2]);
        }
      }
    }
    
    console.log(`PPTX dimensions: ${slideWidthEMU} x ${slideHeightEMU} EMU`);
    console.log(`Canvas: ${CANVAS_W} x ${CANVAS_H} px`);
    
    // Conversion functions - convert EMU to canvas pixels (960x540 base)
    const emuToPixelX = (emu: number) => Math.round((emu / slideWidthEMU) * CANVAS_W);
    const emuToPixelY = (emu: number) => Math.round((emu / slideHeightEMU) * CANVAS_H);
    
    // Find all slides
    const slideFiles = Object.keys(zip.files)
      .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => {
        const na = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
        const nb = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
        return na - nb;
      });
    
    if (slideFiles.length === 0) {
      throw new Error(language === 'ar' ? 'لا توجد شرائح' : 'No slides found');
    }
    
    const slides: SlideTemplate[] = [];
    
    for (let idx = 0; idx < slideFiles.length; idx++) {
      setStatus({ 
        stage: 'converting', 
        progress: 30 + Math.floor((idx / slideFiles.length) * 65),
        message: language === 'ar' ? `شريحة ${idx + 1}/${slideFiles.length}` : `Slide ${idx + 1}/${slideFiles.length}`
      });
      
      const slideXml = await zip.file(slideFiles[idx])?.async('text');
      if (!slideXml) continue;
      
      const elements: SlideElement[] = [];
      let slideTitle = '';
      
      // Get relationships for images
      const relsPath = slideFiles[idx].replace('slides/', 'slides/_rels/').replace('.xml', '.xml.rels');
      const relsXml = await zip.file(relsPath)?.async('text') || '';
      
      // Helper to get image data
      const getImageData = async (rId: string): Promise<string | null> => {
        const match = relsXml.match(new RegExp(`Id="${rId}"[^>]*Target="([^"]+)"`));
        if (!match) return null;
        
        let imgPath = match[1];
        if (imgPath.startsWith('../')) imgPath = 'ppt/' + imgPath.slice(3);
        else if (!imgPath.startsWith('ppt/')) imgPath = 'ppt/slides/' + imgPath;
        
        const imgFile = zip.file(imgPath);
        if (!imgFile) return null;
        
        try {
          const data = await imgFile.async('base64');
          const ext = imgPath.split('.').pop()?.toLowerCase();
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
          return `data:${mime};base64,${data}`;
        } catch { return null; }
      };
      
      // Extract transform from xfrm element string
      const extractTransform = (xfrmStr: string): { x: number; y: number; w: number; h: number } | null => {
        const xMatch = xfrmStr.match(/<a:off[^>]+x="(\d+)"/);
        const yMatch = xfrmStr.match(/<a:off[^>]+y="(\d+)"/);
        const wMatch = xfrmStr.match(/<a:ext[^>]+cx="(\d+)"/);
        const hMatch = xfrmStr.match(/<a:ext[^>]+cy="(\d+)"/);
        
        if (!xMatch || !yMatch || !wMatch || !hMatch) return null;
        
        const emuX = parseInt(xMatch[1]);
        const emuY = parseInt(yMatch[1]);
        const emuW = parseInt(wMatch[1]);
        const emuH = parseInt(hMatch[1]);
        
        return {
          x: emuToPixelX(emuX),
          y: emuToPixelY(emuY),
          w: emuToPixelX(emuW),
          h: emuToPixelY(emuH)
        };
      };
      
      // Parse all pictures FIRST (so they appear behind text)
      if (importImages) {
        const picRegex = /<p:pic>([\s\S]*?)<\/p:pic>/g;
        let picMatch;
        let picIndex = 0;
        
        while ((picMatch = picRegex.exec(slideXml)) !== null) {
          const picContent = picMatch[1];
          
          // Get spPr for picture
          const spPrMatch = picContent.match(/<p:spPr>([\s\S]*?)<\/p:spPr>/);
          if (!spPrMatch) continue;
          
          // Get xfrm
          const xfrmMatch = spPrMatch[1].match(/<a:xfrm[^>]*>([\s\S]*?)<\/a:xfrm>/);
          if (!xfrmMatch) continue;
          
          const transform = extractTransform(xfrmMatch[0] + xfrmMatch[1]);
          if (!transform || transform.w < 10 || transform.h < 10) continue;
          
          // Get image reference
          const embedMatch = picContent.match(/r:embed="([^"]+)"/);
          if (!embedMatch) continue;
          
          const imageUrl = await getImageData(embedMatch[1]);
          if (!imageUrl) continue;
          
          console.log(`Image at (${transform.x}, ${transform.y}) size ${transform.w}x${transform.h}`);
          
          elements.push({
            id: `img-${Date.now()}-${idx}-${picIndex++}`,
            type: 'image',
            x: transform.x,
            y: transform.y,
            width: transform.w,
            height: transform.h,
            imageUrl,
            objectFit: 'fill',
            zIndex: 1, // Images behind text
          });
        }
      }
      
      // Parse all shapes/text AFTER images (so they appear on top)
      const shapeRegex = /<p:sp>([\s\S]*?)<\/p:sp>/g;
      let shapeMatch;
      let textIndex = 0;
      
      while ((shapeMatch = shapeRegex.exec(slideXml)) !== null) {
        const shapeContent = shapeMatch[1];
        
        // Get spPr (shape properties) which contains xfrm
        const spPrMatch = shapeContent.match(/<p:spPr>([\s\S]*?)<\/p:spPr>/);
        if (!spPrMatch) continue;
        
        // Get xfrm from spPr
        const xfrmMatch = spPrMatch[1].match(/<a:xfrm[^>]*>([\s\S]*?)<\/a:xfrm>/);
        if (!xfrmMatch) continue;
        
        const transform = extractTransform(xfrmMatch[0] + xfrmMatch[1]);
        if (!transform || transform.w < 5 || transform.h < 5) continue;
        
        // Get text content from txBody
        const txBodyMatch = shapeContent.match(/<p:txBody>([\s\S]*?)<\/p:txBody>/);
        if (!txBodyMatch) continue;
        
        const txBody = txBodyMatch[1];
        
        // Extract all text
        const textParts: string[] = [];
        const tRegex = /<a:t>([^<]*)<\/a:t>/g;
        let tMatch;
        while ((tMatch = tRegex.exec(txBody)) !== null) {
          if (tMatch[1]) textParts.push(tMatch[1]);
        }
        
        const text = textParts.join('').trim();
        if (!text) continue;
        
        // Get font size
        let fontSize = 18;
        const szMatch = txBody.match(/sz="(\d+)"/);
        if (szMatch) fontSize = Math.round(parseInt(szMatch[1]) / 100);
        fontSize = Math.max(8, Math.min(fontSize, 72));
        
        // Get alignment
        let textAlign: 'left' | 'center' | 'right' = 'left';
        if (txBody.includes('algn="ctr"')) textAlign = 'center';
        else if (txBody.includes('algn="r"')) textAlign = 'right';
        
        // Get bold
        const fontWeight = txBody.includes('b="1"') ? 'bold' : 'normal';
        
        // Get color
        let color = '#000000';
        const colorMatch = txBody.match(/<a:srgbClr val="([A-Fa-f0-9]{6})"/);
        if (colorMatch) color = '#' + colorMatch[1];
        
        if (!slideTitle && text.length < 100) {
          slideTitle = text.split('\n')[0];
        }
        
        console.log(`Text "${text.substring(0, 30)}..." at (${transform.x}, ${transform.y}) size ${transform.w}x${transform.h}`);
        
        elements.push({
          id: `txt-${Date.now()}-${idx}-${textIndex++}`,
          type: 'text',
          x: transform.x,
          y: transform.y,
          width: transform.w,
          height: transform.h,
          content: text,
          fontSize,
          fontWeight: fontWeight as 'normal' | 'bold',
          textAlign,
          color,
          zIndex: 10, // Text on top of images
        });
      }
      
      slides.push({
        id: `slide-${Date.now()}-${idx}`,
        type: idx === 0 ? 'cover' : 'content',
        title: slideTitle || `Slide ${idx + 1}`,
        backgroundColor: '#ffffff',
        textColor: '#000000',
        elements: elements.length > 0 ? elements : undefined,
      });
      
      console.log(`Slide ${idx + 1} elements:`, elements.map(e => ({
        type: e.type,
        x: e.x,
        y: e.y,
        w: e.width,
        h: e.height,
        content: e.type === 'text' ? (e.content?.substring(0, 20) + '...') : 'image'
      })));
    }
    
    setStatus({ 
      stage: 'done', 
      progress: 100, 
      message: language === 'ar' ? 'تم!' : 'Done!',
      slideCount: slides.length,
    });
    
    return slides;
  }, [language, importImages]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.match(/\.pptx?$/i)) {
      toast.error(language === 'ar' ? 'يرجى اختيار ملف PowerPoint' : 'Please select a PowerPoint file');
      return;
    }

    setSelectedFile(file);
    setStatus({ stage: 'idle', progress: 0, message: '' });
    setPreviewSlides([]);

    try {
      const slides = await parsePPTX(file);
      setPreviewSlides(slides);
    } catch (error) {
      setStatus({ 
        stage: 'error', 
        progress: 0, 
        message: error instanceof Error ? error.message : 'Import failed',
      });
    }
  }, [parsePPTX, language]);

  const handleImport = useCallback(() => {
    if (previewSlides.length === 0) return;
    const title = selectedFile?.name.replace(/\.pptx?$/i, '') || 'Imported';
    onImport(previewSlides, title);
    toast.success(language === 'ar' ? `تم استيراد ${previewSlides.length} شرائح!` : `Imported ${previewSlides.length} slides!`);
    setIsOpen(false);
    resetState();
  }, [previewSlides, selectedFile, onImport, language]);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setStatus({ stage: 'idle', progress: 0, message: '' });
    setPreviewSlides([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && fileInputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
      handleFileSelect({ target: { files: dt.files } } as React.ChangeEvent<HTMLInputElement>);
    }
  }, [handleFileSelect]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UploadIcon />
          {language === 'ar' ? 'استيراد PPTX' : 'Import PPTX'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl w-[95vw] max-h-[85vh] bg-white dark:bg-gray-900 shadow-2xl border-0 rounded-2xl p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100 pr-8">
            {language === 'ar' ? 'استيراد عرض PowerPoint' : 'Import PowerPoint'}
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20">
          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
              status.stage === 'error' 
                ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30' 
                : 'border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/20'
            )}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pptx,.ppt"
              className="hidden"
              onChange={handleFileSelect}
            />

            {!selectedFile ? (
              <div className="space-y-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <FileIcon />
                </div>
                <div>
                  <p className="text-base font-medium text-gray-700 dark:text-gray-200">
                    {language === 'ar' ? 'اسحب ملف PPTX هنا' : 'Drop PPTX file here'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'ar' ? 'أو انقر للاختيار' : 'or click to browse'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400 flex-shrink-0">
                    <FileIcon />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-gray-100 truncate text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>

                {status.stage !== 'idle' && status.stage !== 'done' && status.stage !== 'error' && (
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
                    <AlertIcon /><span>{status.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {previewSlides.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {language === 'ar' ? `معاينة (${previewSlides.length} شرائح)` : `Preview (${previewSlides.length} slides)`}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {previewSlides.slice(0, 5).map((slide, index) => (
                  <div 
                    key={slide.id} 
                    className="flex-shrink-0 w-24 aspect-video rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm"
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center p-1.5 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                      <span className="text-[9px] text-gray-400 dark:text-gray-500">{index + 1}</span>
                      <p className="text-[10px] font-medium text-center text-gray-700 dark:text-gray-300 line-clamp-2 leading-tight">{slide.title}</p>
                    </div>
                  </div>
                ))}
                {previewSlides.length > 5 && (
                  <div className="flex-shrink-0 w-24 aspect-video rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">+{previewSlides.length - 5}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <input 
              type="checkbox" 
              checked={importImages} 
              onChange={(e) => setImportImages(e.target.checked)} 
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-800"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {language === 'ar' ? 'استيراد الصور' : 'Import Images'}
            </span>
          </label>
        </div>

        <DialogFooter className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 gap-2">
          <Button 
            variant="outline" 
            onClick={() => { setIsOpen(false); resetState(); }}
            className="px-4 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={previewSlides.length === 0 || status.stage === 'error'}
            className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {language === 'ar' ? 'استيراد' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportPPTX;
