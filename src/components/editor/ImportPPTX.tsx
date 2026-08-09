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
import { SlideTemplate, SlideElement, TableCell } from '@/data/templates';
import { IconRenderer } from './IconRenderer';
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
  onImport: (slides: SlideTemplate[], title: string, size: { width: number; height: number }) => void;
}

interface ImportStatus {
  stage: 'idle' | 'reading' | 'parsing' | 'converting' | 'done' | 'error';
  progress: number;
  message: string;
  slideCount?: number;
}

// Canvas dimensions - same as editor base
const CANVAS_W = 960;

// PowerPoint theme scheme colors -> hex
const SCHEME_COLORS: Record<string, string> = {
  bg1: '#ffffff', tx1: '#000000', bg2: '#f2f2f2', tx2: '#404040',
  dk1: '#000000', lt1: '#ffffff', dk2: '#404040', lt2: '#f2f2f2',
  accent1: '#4472c4', accent2: '#ed7d31', accent3: '#a5a5a5', accent4: '#ffc000',
  accent5: '#5b9bd5', accent6: '#70ad47',
};

// Parse a solidFill color (srgbClr / schemeClr / sysClr) including alpha
const parseSolidColor = (fillXml: string): string | null => {
  const srgb = fillXml.match(/<a:srgbClr val="([A-Fa-f0-9]{6})"/);
  if (srgb) {
    const alpha = fillXml.match(/<a:alpha val="(\d+)"/);
    if (alpha) {
      const a = Math.round((parseInt(alpha[1]) / 100000) * 255);
      return '#' + srgb[1].toLowerCase() + a.toString(16).padStart(2, '0');
    }
    return '#' + srgb[1].toLowerCase();
  }
  const scheme = fillXml.match(/<a:schemeClr val="([A-Za-z0-9]+)"/);
  if (scheme) return SCHEME_COLORS[scheme[1].toLowerCase()] || '#000000';
  const sys = fillXml.match(/<a:sysClr[^>]*lastClr="([A-Fa-f0-9]{6})"/);
  if (sys) return '#' + sys[1].toLowerCase();
  return null;
};

// Extract the fill section of spPr - everything before <a:ln (the outline)
const getFillSection = (spPr: string): string => {
  const lnIdx = spPr.indexOf('<a:ln');
  return lnIdx === -1 ? spPr : spPr.slice(0, lnIdx);
};

const getFillColor = (spPr: string): string | null => {
  const fill = getFillSection(spPr);
  const solid = fill.match(/<a:solidFill>([\s\S]*?)<\/a:solidFill>/);
  return solid ? parseSolidColor(solid[1]) : null;
};

const getLineColor = (spPr: string): string | null => {
  const ln = spPr.match(/<a:ln[\s\S]*?>([\s\S]*?)<\/a:ln>/);
  if (!ln) return null;
  const solid = ln[1].match(/<a:solidFill>([\s\S]*?)<\/a:solidFill>/);
  return solid ? parseSolidColor(solid[1]) : null;
};

const getLineWidth = (spPr: string): number => {
  const m = spPr.match(/<a:ln\s+w="(\d+)"/);
  if (!m) return 1;
  const px = Math.max(0.5, parseInt(m[1]) / 12700);
  return Math.min(px, 24);
};

// Map PowerPoint preset geometry to our shape types
const mapPreset = (prst: string): { shapeType: 'rectangle' | 'circle' | 'line' | 'arrow'; borderRadius?: number } => {
  const p = (prst || '').toLowerCase();
  if (!p) return { shapeType: 'rectangle', borderRadius: 0 };
  if (p === 'rect') return { shapeType: 'rectangle', borderRadius: 0 };
  if (p === 'roundrect') return { shapeType: 'rectangle', borderRadius: 14 };
  if (p === 'ellipse' || p === 'oval' || p === 'donut') return { shapeType: 'circle' };
  if (p === 'line' || p === 'straightconnector1' || p === 'bentconnector2' || p === 'bentconnector3' || p === 'curvedconnector3') {
    return { shapeType: 'line' };
  }
  if (p.includes('arrow') || p.includes('connector')) return { shapeType: 'arrow' };
  return { shapeType: 'rectangle', borderRadius: 0 };
};

// Find the start of an open tag like <p:sp> or <p:sp ...>
const findOpenTag = (xml: string, tag: string, from: number): number => {
  const open = '<' + tag;
  let i = xml.indexOf(open, from);
  while (i !== -1) {
    const after = xml[i + open.length];
    if (after === '>' || after === ' ' || after === '\t' || after === '\n' || after === '\r' || after === '/') return i;
    i = xml.indexOf(open, i + open.length);
  }
  return -1;
};

// Extract a balanced block <tag>...</tag> including nested same-tag blocks
const extractBlock = (xml: string, tag: string, from: number): { inner: string; end: number } | null => {
  const start = findOpenTag(xml, tag, from);
  if (start === -1) return null;
  const openEnd = xml.indexOf('>', start);
  if (openEnd === -1) return null;
  if (xml[openEnd - 1] === '/') return { inner: '', end: openEnd + 1 }; // self-closing
  const close = '</' + tag + '>';
  let depth = 1;
  let pos = openEnd + 1;
  while (pos < xml.length && depth > 0) {
    const nextOpen = findOpenTag(xml, tag, pos);
    const nextClose = xml.indexOf(close, pos);
    if (nextClose === -1) { depth = 0; pos = xml.length; break; }
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + tag.length + 1;
    } else {
      depth--;
      pos = nextClose + close.length;
    }
  }
  const innerEnd = pos - close.length;
  return { inner: xml.slice(openEnd + 1, innerEnd), end: pos };
};

interface Trans { a: number; d: number; tx: number; ty: number; }

const IDENTITY: Trans = { a: 1, d: 1, tx: 0, ty: 0 };

// Renders a scaled-down snapshot of an imported slide for the preview thumbnails
const PreviewThumbnail = ({ slide, index, canvasWidth, canvasHeight }: { slide: SlideTemplate; index: number; canvasWidth: number; canvasHeight: number }) => {
  const scale = 110 / canvasWidth;
  const renderElement = (el: SlideElement) => {
    const base: React.CSSProperties = {
      position: 'absolute',
      left: el.x,
      top: el.y,
      width: el.width,
      height: el.height,
      zIndex: el.zIndex || 1,
      opacity: el.opacity ?? 1,
      transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      transformOrigin: 'center center',
      overflow: 'hidden',
    };
    if (el.type === 'text') {
      return (
        <div key={el.id} style={base}>
          <div
            className="w-full h-full flex flex-col whitespace-pre-wrap"
            style={{
              fontSize: (el.fontSize || 16) * (1 / scale),
              fontWeight: el.fontWeight || 'normal',
              textAlign: el.textAlign || 'left',
              lineHeight: 1.2,
              color: el.color || '#000000',
              backgroundColor: el.backgroundColor,
              justifyContent: 'flex-start',
              padding: '2px 4px',
              boxSizing: 'border-box',
            }}
          >
            {el.content || ''}
          </div>
        </div>
      );
    }
    if (el.type === 'image' && el.imageUrl) {
      return (
        <div key={el.id} style={base}>
          <img src={el.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: el.objectFit || 'cover' }} />
        </div>
      );
    }
    if (el.type === 'shape') {
      if (el.shapeType === 'line') {
        return (
          <div key={el.id} style={base}>
            <div className="absolute top-1/2 left-0 right-0" style={{ height: 1 / scale, backgroundColor: el.backgroundColor || '#3b82f6' }} />
          </div>
        );
      }
      if (el.shapeType === 'arrow') {
        return (
          <div key={el.id} style={base}>
            <svg viewBox="0 0 100 50" style={{ width: '100%', height: '100%' }}>
              <polygon points="0,20 70,20 70,0 100,25 70,50 70,30 0,30" fill={el.backgroundColor || '#3b82f6'} />
            </svg>
          </div>
        );
      }
      const shapeStyles: React.CSSProperties = {
        width: '100%',
        height: '100%',
        backgroundColor: el.backgroundColor || (el.border ? 'transparent' : '#3b82f6'),
        borderRadius: el.shapeType === 'circle' ? '50%' : el.borderRadius || 0,
      };
      if (el.border) shapeStyles.border = `${el.border.width / scale}px ${el.border.style} ${el.border.color}`;
      return (
        <div key={el.id} style={base}>
          <div style={shapeStyles} />
        </div>
      );
    }
    if (el.type === 'icon' && el.iconConfig) {
      return (
        <div key={el.id} style={base}>
          <div className="w-full h-full flex items-center justify-center">
            <IconRenderer
              config={{
                ...el.iconConfig,
                size: Math.min(el.width, el.height) * (1 / scale),
              }}
              className="w-full h-full"
            />
          </div>
        </div>
      );
    }
    if (el.type === 'table' && el.tableConfig) {
      const cfg = el.tableConfig;
      return (
        <div key={el.id} style={{ ...base, overflow: 'hidden' }}>
          <div
            className="w-full h-full grid"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cfg.cols}, 1fr)`,
              gridTemplateRows: `repeat(${cfg.rows}, 1fr)`,
              border: `${1 / scale}px solid ${cfg.borderColor || '#d1d5db'}`,
              backgroundColor: '#ffffff',
            }}
          >
            {cfg.cells.flat().map((cell, i) => (
              <div
                key={i}
                style={{
                  border: `0.5px solid ${cfg.borderColor || '#d1d5db'}`,
                  fontSize: 8 / scale,
                  color: cell.textColor || '#111827',
                  backgroundColor: cell.backgroundColor,
                  fontWeight: cell.fontWeight || 'normal',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: cell.textAlign === 'center' ? 'center' : cell.textAlign === 'right' ? 'flex-end' : 'flex-start',
                  padding: '1px 3px',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                }}
              >
                {cell.content}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="relative"
      style={{ width: canvasWidth * scale, height: canvasHeight * scale }}
    >
      <div
        className="absolute top-0 left-0 overflow-hidden"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          backgroundColor: slide.backgroundColor || '#ffffff',
        }}
      >
        {slide.elements?.map(renderElement)}
      </div>
      <span className="absolute bottom-0.5 left-1 text-[8px] font-semibold text-gray-500 dark:text-gray-400 z-50">{index + 1}</span>
    </div>
  );
};

export const ImportPPTX = ({ onImport }: ImportPPTXProps) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ImportStatus>({ stage: 'idle', progress: 0, message: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewSlides, setPreviewSlides] = useState<SlideTemplate[]>([]);
  const [importedSize, setImportedSize] = useState({ width: CANVAS_W, height: Math.round(CANVAS_W * 6858000 / 12192000) });
  const [importImages, setImportImages] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsePPTX = useCallback(async (file: File): Promise<{ slides: SlideTemplate[]; width: number; height: number }> => {
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
    
    // Keep the file's real aspect ratio - map the width to the base canvas width
    // and derive the height so content is never stretched or squashed
    const importedWidth = CANVAS_W;
    const importedHeight = Math.max(1, Math.round((CANVAS_W * slideHeightEMU) / slideWidthEMU));
    console.log(`Canvas: ${importedWidth} x ${importedHeight} px`);
    
    // Conversion functions - convert EMU to canvas pixels using equal scale on both axes
    const emuToPixelX = (emu: number) => Math.round((emu / slideWidthEMU) * importedWidth);
    const emuToPixelY = (emu: number) => Math.round((emu / slideHeightEMU) * importedHeight);
    
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
      
      // Per-slide counters for unique element ids
      let picCounter = 0;
      let shapeCounter = 0;
      let lineCounter = 0;
      let tableCounter = 0;
      
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
      
      // Extract transform from xfrm element string (EMU -> px)
      const extractTransform = (xfrmStr: string): { x: number; y: number; w: number; h: number } | null => {
        const xMatch = xfrmStr.match(/<a:off[^>]+x="(\d+)"/);
        const yMatch = xfrmStr.match(/<a:off[^>]+y="(\d+)"/);
        const wMatch = xfrmStr.match(/<a:ext[^>]+cx="(\d+)"/);
        const hMatch = xfrmStr.match(/<a:ext[^>]+cy="(\d+)"/);
        
        if (!xMatch || !yMatch || !wMatch || !hMatch) return null;
        
        return {
          x: emuToPixelX(parseInt(xMatch[1])),
          y: emuToPixelY(parseInt(yMatch[1])),
          w: emuToPixelX(parseInt(wMatch[1])),
          h: emuToPixelY(parseInt(hMatch[1]))
        };
      };
      
      const extractRotation = (xfrmStr: string): number => {
        const m = xfrmStr.match(/rot="(\d+)"/);
        if (!m) return 0;
        return Math.round((parseInt(m[1]) / 60000) % 360);
      };
      
      // Parse a picture into an image element
      const parsePic = async (picInner: string, t: Trans): Promise<SlideElement | null> => {
        if (!importImages) return null;
        const spPr = picInner.match(/<p:spPr>([\s\S]*?)<\/p:spPr>/);
        if (!spPr) return null;
        const xfrm = spPr[1].match(/<a:xfrm[^>]*>([\s\S]*?)<\/a:xfrm>/);
        if (!xfrm) return null;
        const tr = extractTransform(xfrm[0] + xfrm[1]);
        if (!tr) return null;
        const embed = picInner.match(/r:embed="([^"]+)"/);
        if (!embed) return null;
        const imageUrl = await getImageData(embed[1]);
        if (!imageUrl) return null;
        const w = Math.round(tr.w * t.a);
        const h = Math.round(tr.h * t.d);
        if (w < 4 || h < 4) return null;
        return {
          id: `img-${Date.now()}-${idx}-${picCounter++}`,
          type: 'image',
          x: Math.round(tr.x * t.a + t.tx),
          y: Math.round(tr.y * t.d + t.ty),
          width: w,
          height: h,
          imageUrl,
          objectFit: 'fill',
          zIndex: 1,
        };
      };
      
      // Parse a shape (with or without text) into a text or shape element
      const parseSp = (spInner: string, t: Trans): SlideElement | null => {
        const spPrMatch = spInner.match(/<p:spPr>([\s\S]*?)<\/p:spPr>/);
        if (!spPrMatch) return null;
        const spPr = spPrMatch[1];
        const xfrm = spPr.match(/<a:xfrm[^>]*>([\s\S]*?)<\/a:xfrm>/);
        if (!xfrm) return null;
        const tr = extractTransform(xfrm[0] + xfrm[1]);
        if (!tr) return null;
        const w = Math.round(tr.w * t.a);
        const h = Math.round(tr.h * t.d);
        if (w < 3 || h < 3) return null;
        
        const rotation = extractRotation(xfrm[0] + xfrm[1]);
        const prstMatch = spPr.match(/<a:prstGeom[^>]*prst="([^"]+)"/);
        const preset = mapPreset(prstMatch ? prstMatch[1] : '');
        const fill = getFillColor(spPr);
        
        const base = {
          id: `sp-${Date.now()}-${idx}-${shapeCounter++}`,
          x: Math.round(tr.x * t.a + t.tx),
          y: Math.round(tr.y * t.d + t.ty),
          width: w,
          height: h,
          ...(rotation ? { rotation } : {}),
        };
        
        const txBodyMatch = spInner.match(/<p:txBody>([\s\S]*?)<\/p:txBody>/);
        const txBody = txBodyMatch ? txBodyMatch[1] : '';
        const text = [...txBody.matchAll(/<a:t>([\s\S]*?)<\/a:t>|<a:br\s*\/>|<\/a:br>/g)]
          .map(m => m[1] !== undefined ? m[1] : '\n')
          .join('')
          .trim();
        
        if (text) {
          let fontSize = 18;
          const sz = txBody.match(/sz="(\d+)"/);
          if (sz) fontSize = Math.round(parseInt(sz[1]) / 100);
          fontSize = Math.max(8, Math.min(fontSize, 72));
          
          let textAlign: 'left' | 'center' | 'right' = 'left';
          if (txBody.includes('algn="ctr"')) textAlign = 'center';
          else if (txBody.includes('algn="r"')) textAlign = 'right';
          
          let verticalAlign: 'top' | 'middle' | 'bottom' | undefined;
          const bodyPr = txBody.match(/<a:bodyPr[^>]*>/);
          if (bodyPr) {
            const anchor = bodyPr[0].match(/anchor="(t|ctr|b)"/);
            if (anchor) {
              verticalAlign = anchor[1] === 'ctr' ? 'middle' : anchor[1] === 'b' ? 'bottom' : 'top';
            }
          }
          
          const fontWeight = txBody.includes('b="1"') ? 'bold' : 'normal';
          
          let color = '#000000';
          const colorMatch = txBody.match(/<a:srgbClr val="([A-Fa-f0-9]{6})"/);
          if (colorMatch) color = '#' + colorMatch[1];
          else {
            const scheme = txBody.match(/<a:schemeClr val="([A-Za-z0-9]+)"/);
            if (scheme) color = SCHEME_COLORS[scheme[1].toLowerCase()] || '#000000';
          }
          
          if (!slideTitle && text.length < 100) slideTitle = text.split('\n')[0];
          
          return {
            ...base,
            type: 'text',
            content: text,
            fontSize,
            fontWeight: fontWeight as 'normal' | 'bold',
            textAlign,
            ...(verticalAlign ? { verticalAlign } : {}),
            color,
            ...(fill ? { backgroundColor: fill } : {}),
            zIndex: 10,
          };
        }
        
        // No text -> keep the shape (fills, cards, dividers, lines)
        if (preset.shapeType === 'line') {
          return { ...base, type: 'shape', shapeType: 'line', backgroundColor: getLineColor(spPr) || fill || '#000000', zIndex: 6 };
        }
        if (preset.shapeType === 'arrow') {
          return { ...base, type: 'shape', shapeType: 'arrow', backgroundColor: fill || getLineColor(spPr) || '#000000', zIndex: 6 };
        }
        if (fill) {
          return {
            ...base,
            type: 'shape',
            shapeType: preset.shapeType === 'circle' ? 'circle' : 'rectangle',
            ...(preset.shapeType === 'rectangle' ? { borderRadius: preset.borderRadius || 0 } : {}),
            backgroundColor: fill,
            zIndex: 5,
          };
        }
        // Outline-only shape (noFill + border) - keep as a bordered shape
        const lineColor = getLineColor(spPr);
        if (lineColor) {
          const lineWidth = getLineWidth(spPr);
          return {
            ...base,
            type: 'shape',
            shapeType: preset.shapeType === 'circle' ? 'circle' : 'rectangle',
            ...(preset.shapeType === 'rectangle' ? { borderRadius: preset.borderRadius || 0 } : {}),
            border: { width: lineWidth, color: lineColor, style: 'solid' as const },
            zIndex: 5,
          };
        }
        return null;
      };
      
      // Parse a connector (straight/elbow line) into a line element
      const parseCxnSp = (inner: string, t: Trans): SlideElement | null => {
        const spPrMatch = inner.match(/<p:spPr>([\s\S]*?)<\/p:spPr>/);
        if (!spPrMatch) return null;
        const xfrm = spPrMatch[1].match(/<a:xfrm[^>]*>([\s\S]*?)<\/a:xfrm>/);
        if (!xfrm) return null;
        const tr = extractTransform(xfrm[0] + xfrm[1]);
        if (!tr) return null;
        const w = Math.round(tr.w * t.a);
        const h = Math.round(tr.h * t.d);
        if (w < 3 || h < 3) return null;
        return {
          id: `ln-${Date.now()}-${idx}-${lineCounter++}`,
          type: 'shape',
          shapeType: 'line',
          x: Math.round(tr.x * t.a + t.tx),
          y: Math.round(tr.y * t.d + t.ty),
          width: w,
          height: h,
          backgroundColor: getLineColor(spPrMatch[1]) || '#000000',
          zIndex: 6,
        };
      };
      
      // Parse a graphic frame -> table (charts/smartart are not rendered on the canvas, skipped)
      const parseGraphicFrame = (inner: string, t: Trans): SlideElement[] => {
        const xfrm = inner.match(/<a:xfrm[^>]*>([\s\S]*?)<\/a:xfrm>/);
        if (!xfrm) return [];
        const tr = extractTransform(xfrm[0] + xfrm[1]);
        if (!tr) return [];
        const w = Math.round(tr.w * t.a);
        const h = Math.round(tr.h * t.d);
        if (w < 10 || h < 10) return [];
        
        const tbl = inner.match(/<a:tbl>([\s\S]*?)<\/a:tbl>/);
        if (!tbl) return [];
        const tblXml = tbl[1];
        
        const rows: TableCell[][] = [];
        const rowRegex = /<a:tr(?=\s|>)[^>]*>([\s\S]*?)<\/a:tr>/g;
        let rowMatch;
        while ((rowMatch = rowRegex.exec(tblXml)) !== null) {
          const cells: TableCell[] = [];
          const cellRegex = /<a:tc>([\s\S]*?)<\/a:tc>/g;
          let cellMatch;
          while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
            const cellXml = cellMatch[1];
            const text = [...cellXml.matchAll(/<a:t>([\s\S]*?)<\/a:t>|<a:br\s*\/>|<\/a:br>/g)]
              .map(m => m[1] !== undefined ? m[1] : '\n')
              .join('')
              .trim();
            const tcPr = cellXml.match(/<a:tcPr>([\s\S]*?)<\/a:tcPr>/);
            let backgroundColor: string | undefined;
            if (tcPr) {
              const solid = tcPr[1].match(/<a:solidFill>([\s\S]*?)<\/a:solidFill>/);
              if (solid) backgroundColor = parseSolidColor(solid[1]) || undefined;
            }
            const txBody = cellXml.match(/<p:txBody>([\s\S]*?)<\/p:txBody>/);
            let align: 'left' | 'center' | 'right' = 'left';
            if (txBody && txBody[1].includes('algn="ctr"')) align = 'center';
            else if (txBody && txBody[1].includes('algn="r"')) align = 'right';
            cells.push({
              content: text || ' ',
              ...(backgroundColor ? { backgroundColor } : {}),
              fontWeight: cellXml.includes('b="1"') ? 'bold' as const : undefined,
              textAlign: align,
            });
          }
          rows.push(cells);
        }
        
        if (rows.length === 0) return [];
        const cols = Math.max(...rows.map(r => r.length));
        const filledRows = rows.map(r => {
          const row = [...r];
          while (row.length < cols) row.push({ content: ' ' });
          return row;
        });
        
        return [{
          id: `tbl-${Date.now()}-${idx}-${tableCounter++}`,
          type: 'table',
          x: Math.round(tr.x * t.a + t.tx),
          y: Math.round(tr.y * t.d + t.ty),
          width: w,
          height: h,
          tableConfig: {
            rows: filledRows.length,
            cols,
            cells: filledRows,
            headerRow: true,
            headerCol: false,
            borderColor: '#d1d5db',
            borderWidth: 1,
            cellPadding: 6,
            alternateRowColors: true,
            alternateColor: '#f9fafb',
            headerBgColor: '#e5e7eb',
            headerTextColor: '#111827',
          },
          zIndex: 15,
        }];
      };
      
      // Recursively scan a slide (or group) XML for all top-level blocks
      const scan = async (xml: string, t: Trans): Promise<SlideElement[]> => {
        const out: SlideElement[] = [];
        const tags = ['p:grpSp', 'p:sp', 'p:pic', 'p:cxnSp', 'p:graphicFrame'];
        let pos = 0;
        while (pos < xml.length) {
          let bestTag: string | null = null;
          let bestIdx = -1;
          for (const tag of tags) {
            const idx = findOpenTag(xml, tag, pos);
            if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
              bestTag = tag;
              bestIdx = idx;
            }
          }
          if (!bestTag) break;
          const block = extractBlock(xml, bestTag, bestIdx);
          if (!block) break;
          pos = block.end;
          const { inner } = block;
          
          if (bestTag === 'p:grpSp') {
            const grpPr = inner.match(/<p:grpSpPr>([\s\S]*?)<\/p:grpSpPr>/);
            const src = grpPr ? grpPr[1] : inner;
            const xfrm = src.match(/<a:xfrm[^>]*>([\s\S]*?)<\/a:xfrm>/);
            let g = IDENTITY;
            if (xfrm) {
              const x = xfrm[1];
              const off = x.match(/<a:off[^>]*x="(\d+)"[^>]*y="(\d+)"/);
              const ext = x.match(/<a:ext[^>]*cx="(\d+)"[^>]*cy="(\d+)"/);
              const chOff = x.match(/<a:chOff[^>]*x="(\d+)"[^>]*y="(\d+)"/);
              const chExt = x.match(/<a:chExt[^>]*cx="(\d+)"[^>]*cy="(\d+)"/);
              if (off && ext && chOff && chExt) {
                const ow = parseInt(ext[1]);
                const oh = parseInt(ext[2]);
                const cw = parseInt(chExt[1]);
                const ch = parseInt(chExt[2]);
                if (cw > 0 && ch > 0) {
                  const sx = ow / cw;
                  const sy = oh / ch;
                  g = {
                    a: sx,
                    d: sy,
                    tx: emuToPixelX(parseInt(off[1])) - sx * emuToPixelX(parseInt(chOff[1])),
                    ty: emuToPixelY(parseInt(off[2])) - sy * emuToPixelY(parseInt(chOff[2])),
                  };
                }
              }
            }
            const combined: Trans = { a: t.a * g.a, d: t.d * g.d, tx: t.a * g.tx + t.tx, ty: t.d * g.ty + t.ty };
            out.push(...(await scan(inner, combined)));
          } else if (bestTag === 'p:pic') {
            const el = await parsePic(inner, t);
            if (el) out.push(el);
          } else if (bestTag === 'p:sp') {
            const el = parseSp(inner, t);
            if (el) out.push(el);
          } else if (bestTag === 'p:cxnSp') {
            const el = parseCxnSp(inner, t);
            if (el) out.push(el);
          } else if (bestTag === 'p:graphicFrame') {
            out.push(...parseGraphicFrame(inner, t));
          }
        }
        return out;
      };
      
      // Slide background color
      let backgroundColor = '#ffffff';
      const bgMatch = slideXml.match(/<p:bg>([\s\S]*?)<\/p:bg>/);
      if (bgMatch) {
        const solid = bgMatch[1].match(/<a:solidFill>([\s\S]*?)<\/a:solidFill>/);
        if (solid) {
          const c = parseSolidColor(solid[1]);
          if (c) backgroundColor = c;
        }
      }
      
      elements.push(...(await scan(slideXml, IDENTITY)));
      
      slides.push({
        id: `slide-${Date.now()}-${idx}`,
        type: idx === 0 ? 'cover' : 'content',
        title: slideTitle || `Slide ${idx + 1}`,
        backgroundColor,
        textColor: '#000000',
        elements: elements.length > 0 ? elements : undefined,
      });
      
      console.log(`Slide ${idx + 1} (${elements.length} elements):`, elements.map(e => ({
        type: e.type,
        x: e.x,
        y: e.y,
        w: e.width,
        h: e.height,
        content: e.type === 'text' ? (e.content?.substring(0, 20) + '...') : e.type
      })));
    }
    
    setStatus({ 
      stage: 'done', 
      progress: 100, 
      message: language === 'ar' ? 'تم!' : 'Done!',
      slideCount: slides.length,
    });
    
    return { slides, width: importedWidth, height: importedHeight };
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
      const result = await parsePPTX(file);
      setPreviewSlides(result.slides);
      setImportedSize({ width: result.width, height: result.height });
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
    onImport(previewSlides, title, importedSize);
    toast.success(language === 'ar' ? `تم استيراد ${previewSlides.length} شرائح!` : `Imported ${previewSlides.length} slides!`);
    setIsOpen(false);
    resetState();
  }, [previewSlides, selectedFile, onImport, importedSize, language]);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setStatus({ stage: 'idle', progress: 0, message: '' });
    setPreviewSlides([]);
    setImportedSize({ width: CANVAS_W, height: Math.round(CANVAS_W * 6858000 / 12192000) });
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
              <div className="flex gap-2 overflow-x-auto pb-2 items-start">
                {previewSlides.slice(0, 8).map((slide, index) => (
                  <div
                    key={slide.id}
                    className="flex-shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm"
                    style={{ width: 110, height: Math.round(110 * importedSize.height / importedSize.width) }}
                  >
                    <PreviewThumbnail slide={slide} index={index} canvasWidth={importedSize.width} canvasHeight={importedSize.height} />
                  </div>
                ))}
                {previewSlides.length > 8 && (
                  <div className="flex-shrink-0 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center"
                    style={{ width: 110, height: Math.round(110 * importedSize.height / importedSize.width) }}>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">+{previewSlides.length - 8}</span>
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
