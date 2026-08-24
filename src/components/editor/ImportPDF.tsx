import { useState, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
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

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

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

interface ImportPDFProps {
  onImport: (slides: SlideTemplate[], title: string, size: { width: number; height: number }) => void;
}

interface ImportStatus {
  stage: 'idle' | 'reading' | 'rendering' | 'done' | 'error';
  progress: number;
  message: string;
}

type ImportMode = 'editable' | 'background';

// Canvas dimensions - same as editor base
const CANVAS_W = 960;
// Render pages at 2x for crispness when zooming / exporting
const RENDER_QUALITY = 2;
const JPEG_QUALITY = 0.85;
// Hard caps to avoid freezing the browser / blowing up localStorage
const MAX_PAGES = 100;
const MAX_SHAPES_PER_PAGE = 250;
const MAX_IMAGES_PER_PAGE = 80;

interface RawTextItem {
  str: string;
  x: number;
  yBaseline: number;
  w: number;
  fs: number;
  rtl: boolean;
}

interface TextLine {
  text: string;
  x: number;
  topY: number;
  bottomY: number;
  w: number;
  fs: number;
  rtl: boolean;
}

// ---------- matrix helpers ----------
const matMul = (m: number[], n: number[]): number[] => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];

const matApply = (m: number[], x: number, y: number): [number, number] => [
  m[0] * x + m[2] * y + m[4],
  m[1] * x + m[3] * y + m[5],
];

const clampByte = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const rgbToHex = (r: number, g: number, b: number) =>
  '#' + [clampByte(r), clampByte(g), clampByte(b)].map(v => v.toString(16).padStart(2, '0')).join('');

export const ImportPDF = ({ onImport }: ImportPDFProps) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>({ stage: 'idle', progress: 0, message: '' });
  const [previewSlides, setPreviewSlides] = useState<SlideTemplate[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [importedSize, setImportedSize] = useState({ width: CANVAS_W, height: Math.round(CANVAS_W * 297 / 210) });
  const [mode, setMode] = useState<ImportMode>('editable');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  // ---------- text extraction: group items -> lines -> paragraph blocks ----------
  const buildTextElements = useCallback((items: RawTextItem[], pageHpt: number, scale: number, pageIdx: number): SlideElement[] => {
    if (items.length === 0) return [];
    const sorted = [...items].sort((a, b) => b.yBaseline - a.yBaseline || a.x - b.x);

    // group into visual lines by baseline proximity
    const rawLines: RawTextItem[][] = [];
    let current: RawTextItem[] = [];
    for (const item of sorted) {
      if (current.length === 0) { current = [item]; continue; }
      const ref = current[current.length - 1];
      const tol = Math.max(ref.fs, item.fs) * 0.45;
      if (Math.abs(item.yBaseline - ref.yBaseline) <= tol) current.push(item);
      else { rawLines.push(current); current = [item]; }
    }
    if (current.length > 0) rawLines.push(current);

    const lines: TextLine[] = [];
    rawLines.forEach(lineItems => {
      lineItems.sort((a, b) => a.x - b.x);
      let text = '';
      let prevEnd: number | null = null;
      let prevFs = 12;
      for (const it of lineItems) {
        if (prevEnd !== null) {
          const gap = it.x - prevEnd;
          if (gap > prevFs * 0.22 && !/\s$/.test(text) && !/^\s/.test(it.str)) text += ' ';
        }
        text += it.str;
        prevEnd = it.x + it.w;
        prevFs = it.fs;
      }
      text = text.replace(/\s+/g, ' ').trim();
      if (!text) return;
      const minX = Math.min(...lineItems.map(i => i.x));
      const maxX = Math.max(...lineItems.map(i => i.x + i.w));
      const maxFs = Math.max(...lineItems.map(i => i.fs));
      const baselineY = lineItems[0].yBaseline;
      lines.push({
        text,
        x: minX,
        topY: pageHpt - baselineY - maxFs * 0.9,
        bottomY: pageHpt - baselineY + maxFs * 0.35,
        w: maxX - minX,
        fs: maxFs,
        rtl: lineItems.filter(i => i.rtl).length >= lineItems.length / 2,
      });
    });

    // merge consecutive lines into paragraph blocks
    lines.sort((a, b) => a.topY - b.topY);
    interface Block { text: string; x: number; y: number; w: number; h: number; fs: number; rtl: boolean; bottomY: number }
    const blocks: Block[] = [];
    for (const line of lines) {
      const last = blocks[blocks.length - 1];
      if (last) {
        const overlapStart = Math.max(last.x, line.x);
        const overlapEnd = Math.min(last.x + last.w, line.x + line.w);
        const overlapW = overlapEnd - overlapStart;
        const minW = Math.min(last.w, line.w);
        const gap = line.topY - last.bottomY;
        if (gap <= Math.max(last.fs, line.fs) * 0.8 && overlapW >= minW * 0.2) {
          last.text += '\n' + line.text;
          last.x = Math.min(last.x, line.x);
          last.w = Math.max(last.x + last.w, line.x + line.w) - last.x;
          last.bottomY = Math.max(last.bottomY, line.bottomY);
          last.fs = Math.max(last.fs, line.fs);
          if (line.rtl) last.rtl = true;
          continue;
        }
      }
      blocks.push({ text: line.text, x: line.x, y: line.topY, w: line.w, h: line.bottomY - line.topY, fs: line.fs, rtl: line.rtl, bottomY: line.bottomY });
    }

    return blocks.map((b, bi) => ({
      id: `ptxt-${Date.now()}-${pageIdx}-${bi}`,
      type: 'text',
      content: b.text,
      x: Math.round(b.x * scale - 3),
      y: Math.round(b.y * scale - 3),
      width: Math.ceil(b.w * scale + 10),
      height: Math.ceil(b.h * scale + 8),
      fontSize: Math.max(6, Math.min(Math.round(b.fs * scale), 200)),
      fontWeight: 'normal',
      textAlign: b.rtl ? 'right' : 'left',
      color: '#000000',
      lineHeight: 1.15,
      zIndex: 10,
    }));
  }, []);

  // ---------- vector/image extraction from the page content stream ----------
  const extractGraphicElements = useCallback(async (
    page: any,
    scale: number,
    pageHpt: number,
    totalAreaPx: number,
    pageIdx: number
  ): Promise<{ shapes: SlideElement[]; images: SlideElement[]; bgColor: string | null }> => {
    const out = { shapes: [] as SlideElement[], images: [] as SlideElement[], bgColor: null as string | null };
    try {
      const OPS_: Record<string, number> = pdfjsLib.OPS as any;
      const opList = await page.getOperatorList();
      let ctm = [1, 0, 0, 1, 0, 0];
      const stack: number[][] = [];
      let fillColor = '#000000';
      let strokeColor = '#000000';
      const seen = new Set<string>();
      let bgArea = 0;

      const FILL_FNS = new Set([OPS_.fill, OPS_.eoFill, OPS_.fillStroke, OPS_.eoFillStroke, OPS_.closeFillStroke, OPS_.closeEOFillStroke]);
      const STROKE_FNS = new Set([OPS_.stroke, OPS_.closeStroke]);

      const rectFromMinMax = (mm: ArrayLike<number>) => {
        const corners: [number, number][] = [
          matApply(ctm, mm[0], mm[1]),
          matApply(ctm, mm[2], mm[1]),
          matApply(ctm, mm[0], mm[3]),
          matApply(ctm, mm[2], mm[3]),
        ];
        const xs = corners.map(c => c[0]);
        const ys = corners.map(c => c[1]);
        const ux0 = Math.min(...xs), ux1 = Math.max(...xs);
        const uy0 = Math.min(...ys), uy1 = Math.max(...ys);
        return { x: ux0 * scale, y: (pageHpt - uy1) * scale, w: (ux1 - ux0) * scale, h: (uy1 - uy0) * scale };
      };

      const fetchImgObj = (objId: string) => new Promise<any>(resolve => {
        let done = false;
        const finish = (v: any) => { if (!done) { done = true; clearTimeout(timer); resolve(v || null); } };
        const timer = setTimeout(() => finish(null), 600);
        try {
          page.objs.get(objId, (o: any) => finish(o));
        } catch {
          clearTimeout(timer); finish(null);
        }
      });

      const imageToDataUrl = (img: any): string | null => {
        try {
          const w = img.width, h = img.height;
          if (!w || !h || w * h > 20e6) return null;
          const cnv = document.createElement('canvas');
          cnv.width = w; cnv.height = h;
          const ctx = cnv.getContext('2d');
          if (!ctx) return null;
          if (img.bitmap) {
            ctx.drawImage(img.bitmap, 0, 0);
          } else if (img.data) {
            const d: Uint8Array = img.data;
            let rgba: Uint8ClampedArray | null = null;
            if (img.kind === 3) {
              rgba = new Uint8ClampedArray(d);
            } else if (img.kind === 2) {
              rgba = new Uint8ClampedArray(w * h * 4);
              for (let i = 0, j = 0; i < d.length; i += 3, j += 4) {
                rgba[j] = d[i]; rgba[j + 1] = d[i + 1]; rgba[j + 2] = d[i + 2]; rgba[j + 3] = 255;
              }
            } else if (img.kind === 1) {
              rgba = new Uint8ClampedArray(w * h * 4);
              const rowBytes = (w + 7) >> 3;
              for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                  const bit = (d[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1;
                  const v = bit ? 255 : 0;
                  const o = (y * w + x) * 4;
                  rgba[o] = rgba[o + 1] = rgba[o + 2] = v; rgba[o + 3] = 255;
                }
              }
            }
            if (!rgba) return null;
            ctx.putImageData(new ImageData(rgba, w, h), 0, 0);
          } else {
            return null;
          }
          // detect alpha to choose format (JPEG has no alpha support)
          let transparent = false;
          try {
            const step = Math.max(1, Math.floor(w * h / 4096));
            const probe = ctx.getImageData(0, 0, w, h).data;
            for (let i = 3, n = 0; i < probe.length && n < 4096; i += 4 * step, n++) {
              if (probe[i] < 250) { transparent = true; break; }
            }
          } catch { /* keep opaque assumption */ }
          return transparent ? cnv.toDataURL('image/png') : cnv.toDataURL('image/jpeg', JPEG_QUALITY);
        } catch { return null; }
      };

      const addImageAtCtm = async (imgData: any) => {
        if (!imgData || out.images.length >= MAX_IMAGES_PER_PAGE) return;
        const url = imageToDataUrl(imgData);
        if (!url) return;
        const corners: [number, number][] = [
          matApply(ctm, 0, 0), matApply(ctm, 1, 0), matApply(ctm, 0, 1), matApply(ctm, 1, 1),
        ];
        const xs = corners.map(c => c[0]);
        const ys = corners.map(c => c[1]);
        const ux0 = Math.min(...xs), ux1 = Math.max(...xs);
        const uy0 = Math.min(...ys), uy1 = Math.max(...ys);
        const r = { x: ux0 * scale, y: (pageHpt - uy1) * scale, w: (ux1 - ux0) * scale, h: (uy1 - uy0) * scale };
        if (r.w < 6 || r.h < 6) return;
        out.images.push({
          id: `pimg-${Date.now()}-${pageIdx}-${out.images.length}`,
          type: 'image',
          imageUrl: url,
          objectFit: 'fill',
          x: Math.round(r.x),
          y: Math.round(r.y),
          width: Math.round(r.w),
          height: Math.round(r.h),
          zIndex: 6,
        });
      };

      for (let i = 0; i < opList.fnArray.length; i++) {
        const fn = opList.fnArray[i];
        const args = opList.argsArray[i];
        switch (fn) {
          case OPS_.save:
            stack.push(ctm.slice());
            break;
          case OPS_.restore:
            ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
            break;
          case OPS_.transform:
            if (Array.isArray(args) && args.length >= 6) ctm = matMul(ctm, args as number[]);
            break;
          case OPS_.paintFormXObjectBegin:
            if (Array.isArray(args?.[0]) && args[0].length >= 6) ctm = matMul(ctm, args[0]);
            stack.push(ctm.slice());
            break;
          case OPS_.paintFormXObjectEnd:
            ctm = stack.pop() || ctm;
            break;
          case OPS_.setFillRGBColor:
            fillColor = rgbToHex(args[0] * 255, args[1] * 255, args[2] * 255);
            break;
          case OPS_.setFillGrayColor:
            fillColor = rgbToHex(args[0] * 255, args[0] * 255, args[0] * 255);
            break;
          case OPS_.setFillCMYKColor: {
            const c = args[0], m = args[1], yy = args[2], k = args[3];
            fillColor = rgbToHex(255 * (1 - Math.min(1, c)) * (1 - k), 255 * (1 - Math.min(1, m)) * (1 - k), 255 * (1 - Math.min(1, yy)) * (1 - k));
            break;
          }
          case OPS_.setStrokeRGBColor:
            strokeColor = rgbToHex(args[0] * 255, args[1] * 255, args[2] * 255);
            break;
          case OPS_.setStrokeGrayColor:
            strokeColor = rgbToHex(args[0] * 255, args[0] * 255, args[0] * 255);
            break;
          case OPS_.constructPath: {
            // args = [finalPaintFn, [Float32Array pathBuffer], minMax]
            const pfn = args[0];
            const buf = args[1]?.[0];
            const mm = args[2];
            if (!buf || !mm || typeof pfn !== 'number') break;

            const r = rectFromMinMax(mm);
            let curved = false;
            for (let p = 0; p < buf.length;) {
              const cmd = buf[p++];
              if (cmd === 0 || cmd === 1) p += 2;       // moveTo / lineTo
              else if (cmd === 2) { curved = true; p += 6; } // curveTo
              else if (cmd === 3) { curved = true; p += 4; } // quadraticCurveTo
              // closePath: no coords
            }

            const isFill = FILL_FNS.has(pfn);
            const isStroke = STROKE_FNS.has(pfn);
            if (!isFill && !isStroke) break;
            if (r.w < 1.5 || r.h < 1.5) break;

            const color = isFill ? fillColor : strokeColor;
            const key = `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)},${color}`;
            if (seen.has(key)) break;
            seen.add(key);

            if (isFill) {
              const area = r.w * r.h;
              // near-full-page fill -> slide background color instead of an element
              if (area > 0.92 * totalAreaPx) {
                if (area > bgArea) { bgArea = area; out.bgColor = color; }
                break;
              }
              if (out.shapes.length >= MAX_SHAPES_PER_PAGE) break;
              const isCircle = curved && r.w >= 12 && r.h >= 12 &&
                Math.abs(r.w - r.h) / Math.max(r.w, r.h) < 0.25;
              out.shapes.push({
                id: `pshp-${Date.now()}-${pageIdx}-${out.shapes.length}`,
                type: 'shape',
                shapeType: isCircle ? 'circle' : 'rectangle',
                x: Math.round(r.x),
                y: Math.round(r.y),
                width: Math.round(r.w),
                height: Math.round(r.h),
                backgroundColor: color,
                zIndex: 5,
              });
            } else {
              // stroked path: capture prominent horizontal/vertical rules (table borders, dividers)
              const thin = Math.max(2.5, scale);
              if (out.shapes.length >= MAX_SHAPES_PER_PAGE) break;
              if (r.h <= thin && r.w >= 8) {
                out.shapes.push({
                  id: `plin-${Date.now()}-${pageIdx}-${out.shapes.length}`,
                  type: 'shape',
                  shapeType: 'line',
                  x: Math.round(r.x),
                  y: Math.round(r.y + r.h / 2 - 1),
                  width: Math.round(r.w),
                  height: 2,
                  backgroundColor: color,
                  zIndex: 5,
                });
              } else if (r.w <= thin && r.h >= 8) {
                out.shapes.push({
                  id: `plin-${Date.now()}-${pageIdx}-${out.shapes.length}`,
                  type: 'shape',
                  shapeType: 'line',
                  x: Math.round(r.x + r.w / 2 - 1),
                  y: Math.round(r.y),
                  width: 2,
                  height: Math.round(r.h),
                  backgroundColor: color,
                  zIndex: 5,
                });
              }
            }
            break;
          }
          case OPS_.paintImageXObject: {
            const objId = args?.[0];
            if (typeof objId === 'string') {
              const img = await fetchImgObj(objId);
              await addImageAtCtm(img);
            }
            break;
          }
          case OPS_.paintInlineImageXObject:
            await addImageAtCtm(args?.[0]);
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.warn('Vector extraction failed for page', pageIdx, error);
    }
    return out;
  }, []);

  const parsePDF = useCallback(async (file: File): Promise<{ slides: SlideTemplate[]; previews: string[]; size: { width: number; height: number } }> => {
    setStatus({ stage: 'reading', progress: 5, message: t('جاري قراءة الملف...', 'Reading file...') });

    const data = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;

    if (pdf.numPages > MAX_PAGES) {
      toast.warning(t(`الملف يحتوي على ${pdf.numPages} صفحة، سيتم استيراد أول ${MAX_PAGES} صفحة فقط`, `The file has ${pdf.numPages} pages, only the first ${MAX_PAGES} will be imported`));
    }
    const pageCount = Math.min(pdf.numPages, MAX_PAGES);

    const firstPage = await pdf.getPage(1);
    const firstViewport = firstPage.getViewport({ scale: 1 });
    const scale = CANVAS_W / firstViewport.width;
    const canvasH = Math.round(firstViewport.height * scale);

    const slides: SlideTemplate[] = [];
    const previews: string[] = [];

    for (let i = 1; i <= pageCount; i++) {
      setStatus({
        stage: 'rendering',
        progress: Math.round(((i - 1) / pageCount) * 90) + 5,
        message: `${t('معالجة الصفحة', 'Processing page')} ${i}/${pageCount}`,
      });
      await new Promise(r => setTimeout(r, 0));

      const page = i === 1 ? firstPage : await pdf.getPage(i);

      // Render preview / background image
      const viewport = page.getViewport({ scale: scale * RENDER_QUALITY });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      await page.render({ canvas, viewport }).promise;
      const url = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      previews.push(url);

      // Editable texts
      let textElements: SlideElement[] = [];
      try {
        const tc = await page.getTextContent();
        const raws: RawTextItem[] = [];
        for (const item of tc.items) {
          if (!('str' in item)) continue;
          const ti = item as { str: string; transform: number[]; width: number; dir: string };
          if (!ti.str || !ti.str.trim()) continue;
          const tr = ti.transform;
          const fs = Math.hypot(tr[2], tr[3]) || Math.abs(tr[3]) || 12;
          raws.push({
            str: ti.str,
            x: tr[4],
            yBaseline: tr[5],
            w: ti.width,
            fs,
            rtl: ti.dir === 'rtl' || /[\u0600-\u06FF]/.test(ti.str),
          });
        }
        textElements = buildTextElements(raws, firstViewport.height, scale, i);
      } catch { /* best-effort */ }

      let elements: SlideElement[];
      let backgroundColor = '#ffffff';

      if (mode === 'background') {
        // Locked page image + editable texts on top
        const bgImage: SlideElement = {
          id: `pbg-${Date.now()}-${i}`,
          type: 'image',
          imageUrl: url,
          objectFit: 'contain',
          x: 0,
          y: 0,
          width: CANVAS_W,
          height: canvasH,
          zIndex: 1,
          locked: true,
        };
        elements = [bgImage, ...textElements];
      } else {
        // Fully editable: real texts + extracted images + vector approximations, no page image
        const graphics = await extractGraphicElements(page, scale, firstViewport.height, CANVAS_W * canvasH, i);
        if (graphics.bgColor) backgroundColor = graphics.bgColor;
        elements = [...graphics.shapes, ...graphics.images, ...textElements];
      }

      const firstLine = textElements[0]?.content?.split('\n')[0];
      slides.push({
        id: `slide-${Date.now()}-${i}`,
        type: i === 1 ? 'cover' : 'content',
        title: (firstLine && firstLine.length <= 80 ? firstLine : '') || t(`صفحة ${i}`, `Page ${i}`),
        backgroundColor,
        textColor: '#000000',
        elements,
      });

      // free the rendered canvas early
      canvas.width = 0;
      canvas.height = 0;
    }

    await loadingTask.destroy();

    setStatus({ stage: 'done', progress: 100, message: t('تم!', 'Done!') });
    return { slides, previews, size: { width: CANVAS_W, height: canvasH } };
  }, [mode, buildTextElements, extractGraphicElements, language]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      const result = await parsePDF(file);
      setPreviewSlides(result.slides);
      setPreviewUrls(result.previews);
      setImportedSize(result.size);
      if (result.slides.length > 40) {
        toast.warning(t('الملف كبير، قد يستغرق الحفظ وقتًا أطول', 'Large file: saving may take longer'));
      }
      // Scanned / image-only PDFs produce empty editable slides
      if (mode === 'editable' && result.slides.every(s => !s.elements || s.elements.length === 0)) {
        toast.info(t('يبدو أن الملف عبارة عن صور ممسوحة بدون نصوص — جرّب وضع "صورة خلفية مع نصوص"', 'This looks like a scanned/image-only PDF — try the "Locked background + texts" mode'), { duration: 8000 });
      }
    } catch (error) {
      console.error('PDF import error:', error);
      setStatus({
        stage: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : t('فشل استيراد الملف', 'Import failed'),
      });
    }
  }, [parsePDF, mode]);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setStatus({ stage: 'idle', progress: 0, message: '' });
    setPreviewSlides([]);
    setPreviewUrls([]);
    setImportedSize({ width: CANVAS_W, height: Math.round(CANVAS_W * 297 / 210) });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleImport = useCallback(() => {
    if (previewSlides.length === 0) return;
    const title = selectedFile?.name.replace(/\.pdf$/i, '') || 'Imported PDF';
    onImport(previewSlides, title, importedSize);
    toast.success(t(`تم استيراد ${previewSlides.length} صفحات!`, `Imported ${previewSlides.length} pages!`));
    setIsOpen(false);
    resetState();
  }, [previewSlides, selectedFile, onImport, importedSize, language, resetState]);

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

  const busy = status.stage === 'reading' || status.stage === 'rendering';

  const ModeOption = ({ value, label, desc }: { value: ImportMode; label: string; desc: string }) => (
    <label className={cn(
      'flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
      mode === value
        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-600'
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
      busy && 'pointer-events-none opacity-60'
    )}>
      <input
        type="radio"
        name="pdf-import-mode"
        checked={mode === value}
        onChange={() => setMode(value)}
        disabled={busy}
        className="w-4 h-4 mt-0.5 text-emerald-600 focus:ring-emerald-500"
      />
      <span>
        <span className={cn('block text-sm font-medium', mode === value ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300')}>
          {label}
        </span>
        <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</span>
      </span>
    </label>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UploadIcon />
          {t('استيراد PDF', 'Import PDF')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl w-[95vw] max-h-[85vh] bg-white dark:bg-gray-900 shadow-2xl border-0 rounded-2xl p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100 pr-8">
            {t('استيراد ملف PDF', 'Import PDF')}
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20">
          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
              status.stage === 'error'
                ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-red-400 hover:bg-red-50/50 dark:hover:border-red-600 dark:hover:bg-red-950/20'
            )}
            onClick={() => !busy && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
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
                    <p className="font-semibold text-gray-800 dark:text-gray-100 truncate text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
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
                    <AlertIcon /><span>{status.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {t('طريقة الاستيراد', 'Import mode')}
            </p>
            <ModeOption
              value="editable"
              label={t('قابل للتعديل بالكامل', 'Fully editable')}
              desc={t('نصوص وصور وأشكال حقيقية من ملف الـ PDF تقدر تحركها وتعدلها بحرية (قد تفقد بعض التأثيرات المعقدة)', 'Real texts, images and shapes from the PDF that you can freely move and edit (complex effects may be lost)')}
            />
            <ModeOption
              value="background"
              label={t('خلفية مقفولة مع نصوص قابلة للتعديل', 'Locked background + editable texts')}
              desc={t('تصميم الصفحة يظهر كما هو كخلفية ثابتة، والنصوص تنزل فوقه قابلة للتحريك', 'Page design shown as-is as a fixed background, with movable texts on top')}
            />
          </div>

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
                    style={{ width: 110, height: Math.round(110 * importedSize.height / importedSize.width) }}
                  >
                    <img src={url} alt={`Page ${index + 1}`} className="w-full h-full object-contain" draggable={false} />
                  </div>
                ))}
                {previewUrls.length > 8 && (
                  <div className="flex-shrink-0 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center"
                    style={{ width: 110, height: Math.round(110 * importedSize.height / importedSize.width) }}>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">+{previewUrls.length - 8}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 gap-2">
          <Button
            variant="outline"
            onClick={() => { setIsOpen(false); resetState(); }}
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
