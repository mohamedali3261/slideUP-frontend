import { useState, useCallback, useRef, useEffect } from 'react';
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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  initialFile?: File | null;
}

interface ImportStatus {
  stage: 'idle' | 'reading' | 'rendering' | 'done' | 'error';
  progress: number;
  message: string;
}

// Canvas dimensions - same as editor base
const CANVAS_W = 960;
// Render pages at 2x for crispness when zooming / exporting
const RENDER_QUALITY = 2;
const JPEG_QUALITY = 0.85;
// Hard caps to avoid freezing the browser / blowing up localStorage
const MAX_PAGES = 100;
const MAX_SHAPES_PER_PAGE = 400;
const MAX_IMAGES_PER_PAGE = 80;

interface RawTextItem {
  str: string;
  x: number;
  yBaseline: number;
  w: number;
  fs: number;
  rtl: boolean;
  fontFamily?: string;
  fontWeight?: SlideElement['fontWeight'];
  fontStyle?: SlideElement['fontStyle'];
  color?: string;
}

interface TextLine {
  text: string;
  x: number;
  topY: number;
  bottomY: number;
  w: number;
  fs: number;
  rtl: boolean;
  fontFamily?: string;
  fontWeight?: SlideElement['fontWeight'];
  fontStyle?: SlideElement['fontStyle'];
  color?: string;
}

const inferFontWeight = (name: string): SlideElement['fontWeight'] => {
  if (/black|heavy|extrabold|ultra/i.test(name)) return 'extrabold';
  if (/bold|black/i.test(name)) return 'bold';
  if (/semibold|demi/i.test(name)) return 'semibold';
  if (/medium/i.test(name)) return 'medium';
  if (/light|thin|hairline/i.test(name)) return 'light';
  return 'normal';
};

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

/** pdf.js 6 often stores matrices as Float32Array, not a normal Array. */
const asMat = (args: any): number[] | null => {
  if (!args || args.length < 6) return null;
  const m = [Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3]), Number(args[4]), Number(args[5])];
  return m.every(Number.isFinite) ? m : null;
};

const parseOpColor = (args: any): string | null => {
  if (args == null) return null;
  if (typeof args === 'string') return args;
  if (typeof args[0] === 'string') return args[0];
  if (args.length >= 3 && typeof args[0] === 'number') {
    const unit = args[0] <= 1 && args[1] <= 1 && args[2] <= 1;
    const s = unit ? 255 : 1;
    return rgbToHex(args[0] * s, args[1] * s, args[2] * s);
  }
  if (args.length === 1 && typeof args[0] === 'number') {
    const v = args[0] <= 1 ? args[0] * 255 : args[0];
    return rgbToHex(v, v, v);
  }
  return null;
};

const clampByte = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const rgbToHex = (r: number, g: number, b: number) =>
  '#' + [clampByte(r), clampByte(g), clampByte(b)].map(v => v.toString(16).padStart(2, '0')).join('');

// pdf.js v6 sends colors as a single "#rrggbb" string argument; keep a numeric fallback
const parseColorArgs = (args: any[]): string | null => {
  const v = args?.[0];
  if (typeof v === 'string') {
    if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
    if (/^#[0-9a-fA-F]{3}$/.test(v)) return '#' + [...v.slice(1)].map(c => c + c).join('');
    if (/^#[0-9a-fA-F]{8}$/i.test(v)) return v.slice(0, 7).toLowerCase();
    return null;
  }
  if (Array.isArray(args) && args.length >= 3 && args.every((n: any) => typeof n === 'number')) {
    const mul = Math.max(...args) <= 1 ? 255 : 1;
    return rgbToHex(args[0] * mul, args[1] * mul, args[2] * mul);
  }
  return null;
};

export const ImportPDF = ({ onImport, open, onOpenChange, hideTrigger, initialFile }: ImportPDFProps) => {
  const { language } = useLanguage();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>({ stage: 'idle', progress: 0, message: '' });
  const [previewSlides, setPreviewSlides] = useState<SlideTemplate[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [importedSize, setImportedSize] = useState({ width: CANVAS_W, height: Math.round(CANVAS_W * 297 / 210) });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  // ---------- text extraction: group items -> lines -> paragraph blocks ----------
  const buildTextElements = useCallback((items: RawTextItem[], pageHpt: number, scale: number, pageIdx: number): SlideElement[] => {
    if (items.length === 0) return [];
    const sorted = [...items].sort((a, b) => b.yBaseline - a.yBaseline || a.x - b.x);

    // group into visual lines by baseline proximity
    const baseGroups: RawTextItem[][] = [];
    let current: RawTextItem[] = [];
    for (const item of sorted) {
      if (current.length === 0) { current = [item]; continue; }
      const ref = current[current.length - 1];
      const tol = Math.max(ref.fs, item.fs) * 0.45;
      if (Math.abs(item.yBaseline - ref.yBaseline) <= tol) current.push(item);
      else { baseGroups.push(current); current = [item]; }
    }
    if (current.length > 0) baseGroups.push(current);

    // split baseline groups at large horizontal gaps -> separate columns stay separate
    const rawLines: RawTextItem[][] = [];
    for (const group of baseGroups) {
      group.sort((a, b) => a.x - b.x);
      let cur: RawTextItem[] = [group[0]];
      for (let k = 1; k < group.length; k++) {
        const prev = cur[cur.length - 1];
        const gap = group[k].x - (prev.x + prev.w);
        if (gap > Math.max(prev.fs, group[k].fs) * 3) {
          rawLines.push(cur);
          cur = [group[k]];
        } else {
          cur.push(group[k]);
        }
      }
      if (cur.length > 0) rawLines.push(cur);
    }

    const lines: TextLine[] = [];
    rawLines.forEach(lineItems => {
      const rtl = lineItems.filter(i => i.rtl).length >= lineItems.length / 2;
      lineItems.sort((a, b) => (rtl ? b.x - a.x : a.x - b.x));
      let text = '';
      let prevEnd: number | null = null;
      let prevFs = 12;
      for (const it of lineItems) {
        if (prevEnd !== null) {
          const gap = rtl ? prevEnd - (it.x + it.w) : it.x - prevEnd;
          if (gap > prevFs * 0.22 && !/\s$/.test(text) && !/^\s/.test(it.str)) text += ' ';
        }
        text += it.str;
        prevEnd = rtl ? it.x : it.x + it.w;
        prevFs = it.fs;
      }
      text = text.replace(/\s+/g, ' ').trim();
      if (!text) return;
      const minX = Math.min(...lineItems.map(i => i.x));
      const maxX = Math.max(...lineItems.map(i => i.x + i.w));
      const maxFs = Math.max(...lineItems.map(i => i.fs));
      const baselineY = lineItems[0].yBaseline;
      const dominant = lineItems.reduce((a, b) => (b.fs >= a.fs ? b : a));
      lines.push({
        text,
        x: minX,
        topY: pageHpt - baselineY - maxFs * 0.9,
        bottomY: pageHpt - baselineY + maxFs * 0.35,
        w: maxX - minX,
        fs: maxFs,
        rtl,
        fontFamily: dominant.fontFamily,
        fontWeight: dominant.fontWeight,
        fontStyle: dominant.fontStyle,
        color: dominant.color,
      });
    });

    // merge consecutive lines into paragraph blocks
    lines.sort((a, b) => a.topY - b.topY);
    interface Block {
      text: string; x: number; y: number; w: number; h: number; fs: number; rtl: boolean; bottomY: number;
      fontFamily?: string; fontWeight?: SlideElement['fontWeight']; fontStyle?: SlideElement['fontStyle'];
      color?: string; lastTopY: number; topGaps: number[]; fss: number[];
    }
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
          last.topGaps.push(line.topY - last.lastTopY);
          last.fss.push(line.fs);
          last.text += '\n' + line.text;
          last.x = Math.min(last.x, line.x);
          last.w = Math.max(last.x + last.w, line.x + line.w) - last.x;
          last.bottomY = Math.max(last.bottomY, line.bottomY);
          last.fs = Math.max(last.fs, line.fs);
          last.lastTopY = line.topY;
          if (line.rtl) last.rtl = true;
          if (!last.color && line.color) last.color = line.color;
          if (line.fs >= last.fs) {
            last.fontFamily = line.fontFamily || last.fontFamily;
            last.fontWeight = line.fontWeight || last.fontWeight;
            last.fontStyle = line.fontStyle || last.fontStyle;
          }
          continue;
        }
      }
      blocks.push({
        text: line.text, x: line.x, y: line.topY, w: line.w, h: line.bottomY - line.topY,
        fs: line.fs, rtl: line.rtl, bottomY: line.bottomY,
        fontFamily: line.fontFamily, fontWeight: line.fontWeight, fontStyle: line.fontStyle,
        color: line.color, lastTopY: line.topY, topGaps: [], fss: [line.fs],
      });
    }

    return blocks.map((b, bi) => {
      // Reproduce the original line spacing instead of a fixed multiplier
      const avgFs = b.fss.reduce((s, v) => s + v, 0) / b.fss.length;
      const lineHeight = b.topGaps.length > 0
        ? Math.max(1.0, Math.min(2.6, (b.topGaps.reduce((s, v) => s + v, 0) / b.topGaps.length) / avgFs))
        : 1.15;
      // Widen boxes so small edits don't rewrap content into a tall column;
      // RTL blocks grow leftward keeping their right edge anchored
      const padW = Math.max(24, Math.round(b.w * scale * 0.3));
      let ex = Math.round(b.x * scale - 3);
      let ew = Math.ceil(b.w * scale + 10);
      if (b.rtl) {
        const extra = Math.min(padW, Math.max(0, ex - 6));
        ex -= extra;
        ew += extra;
      } else {
        ew += Math.min(padW, Math.max(0, CANVAS_W - 6 - (ex + ew)));
      }
      return {
        id: `ptxt-${Date.now()}-${pageIdx}-${bi}`,
        type: 'text' as const,
        content: b.text,
        x: ex,
        y: Math.round(b.y * scale - 3),
        width: ew,
        height: Math.ceil(b.h * scale + 8),
        fontSize: Math.max(6, Math.min(Math.round(b.fs * scale), 200)),
        fontWeight: b.fontWeight || 'normal',
        fontStyle: b.fontStyle || 'normal',
        fontFamily: b.fontFamily,
        textAlign: (b.rtl ? 'right' : 'left') as 'left' | 'right',
        verticalAlign: 'top' as const,
        color: b.color || '#000000',
        lineHeight,
        zIndex: 20,
      };
    });
  }, []);

  // ---------- vector/image extraction from the page content stream ----------
  const extractGraphicElements = useCallback(async (
    page: any,
    scale: number,
    pageHpt: number,
    totalAreaPx: number,
    pageIdx: number,
    fontRegistry?: { families: Map<string, string>; names: Map<string, string>; registered: Set<string>; colors?: Map<string, string> }
  ): Promise<{ shapes: SlideElement[]; images: SlideElement[]; bgColor: string | null }> => {
    const out = { shapes: [] as SlideElement[], images: [] as SlideElement[], bgColor: null as string | null };
    try {
      const OPS_: Record<string, number> = pdfjsLib.OPS as any;
      const opList = await page.getOperatorList();
      // Graphics state: CTM + clip (in px space, per PDF spec clips are device-space) + alphas
      interface GRect { x: number; y: number; w: number; h: number }
      let gs: { ctm: number[]; clip: GRect | null; fillAlpha: number; strokeAlpha: number } =
        { ctm: [1, 0, 0, 1, 0, 0], clip: null, fillAlpha: 1, strokeAlpha: 1 };
      const stack: Array<{ ctm: number[]; clip: GRect | null; fillAlpha: number; strokeAlpha: number }> = [];
      let awaitingClip = 0; // 1 = W (nonzero) pending, 2 = W* (evenodd) pending
      let fillColor = '#000000';
      let strokeColor = '#000000';
      const seen = new Set<string>();
      let bgArea = 0;
      let hasFullPageImage = false;
      let lineWidthPt = 1;
      const pageHpx = pageHpt * scale;

      const FILL_FNS = new Set([OPS_.fill, OPS_.eoFill, OPS_.fillStroke, OPS_.eoFillStroke, OPS_.closeFillStroke, OPS_.closeEOFillStroke]);
      const STROKE_FNS = new Set([OPS_.stroke, OPS_.closeStroke]);

      const rectFromMinMax = (mm: ArrayLike<number>) => {
        const corners: [number, number][] = [
          matApply(gs.ctm, mm[0], mm[1]),
          matApply(gs.ctm, mm[2], mm[1]),
          matApply(gs.ctm, mm[0], mm[3]),
          matApply(gs.ctm, mm[2], mm[3]),
        ];
        const xs = corners.map(c => c[0]);
        const ys = corners.map(c => c[1]);
        const ux0 = Math.min(...xs), ux1 = Math.max(...xs);
        const uy0 = Math.min(...ys), uy1 = Math.max(...ys);
        return { x: ux0 * scale, y: (pageHpt - uy1) * scale, w: (ux1 - ux0) * scale, h: (uy1 - uy0) * scale };
      };

      const intersectRect = (a: GRect | null, b: GRect): GRect | null => {
        if (!a) return b;
        const x0 = Math.max(a.x, b.x), y0 = Math.max(a.y, b.y);
        const x1 = Math.min(a.x + a.w, b.x + b.w), y1 = Math.min(a.y + a.h, b.y + b.h);
        return x1 - x0 > 0.5 && y1 - y0 > 0.5 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
      };

      const fetchImgObj = (objId: string) => new Promise<any>(resolve => {
        let done = false;
        const finish = (v: any) => { if (!done) { done = true; resolve(v || null); } };
        const timer = setTimeout(() => finish(null), 8000);
        const onGot = (o: any) => { clearTimeout(timer); finish(o); };
        try {
          const id = String(objId);
          if (page.commonObjs?.has?.(id)) {
            page.commonObjs.get(id, onGot);
            return;
          }
          page.objs.get(id, onGot);
        } catch {
          clearTimeout(timer);
          finish(null);
        }
      });

      const imageToDataUrl = (img: any): { cnv: HTMLCanvasElement; url: string; transparent: boolean } | null => {
        try {
          const bmp = img.bitmap;
          const w = (bmp && bmp.width) || img.width;
          const h = (bmp && bmp.height) || img.height;
          if (!w || !h || w * h > 20e6) return null;
          const cnv = document.createElement('canvas');
          cnv.width = w; cnv.height = h;
          const ctx = cnv.getContext('2d');
          if (!ctx) return null;
          if (bmp) {
            ctx.drawImage(bmp, 0, 0);
          } else if (img.data) {
            const d: Uint8Array = img.data;
            let rgba: Uint8ClampedArray | null = null;
            if (img.kind === 3 || d.length === w * h * 4) {
              rgba = new Uint8ClampedArray(d);
            } else if (img.kind === 2 || d.length === w * h * 3) {
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
          let transparent = false;
          try {
            const step = Math.max(1, Math.floor(w * h / 4096));
            const probe = ctx.getImageData(0, 0, w, h).data;
            for (let i = 3, n = 0; i < probe.length && n < 4096; i += 4 * step, n++) {
              if (probe[i] < 250) { transparent = true; break; }
            }
          } catch { /* keep opaque assumption */ }
          return { cnv, transparent, url: transparent ? cnv.toDataURL('image/png') : cnv.toDataURL('image/jpeg', JPEG_QUALITY) };
        } catch { return null; }
      };

      const addImageAtMatrix = async (imgData: any, matrix: number[]) => {
        if (!imgData || out.images.length >= MAX_IMAGES_PER_PAGE) return;
        const decoded = imageToDataUrl(imgData);
        if (!decoded) return;
        const { cnv, transparent } = decoded;
        let url = decoded.url;
        const corners: [number, number][] = [
          matApply(matrix, 0, 0), matApply(matrix, 1, 0), matApply(matrix, 0, 1), matApply(matrix, 1, 1),
        ];
        const xs = corners.map(c => c[0]);
        const ys = corners.map(c => c[1]);
        const ux0 = Math.min(...xs), ux1 = Math.max(...xs);
        const uy0 = Math.min(...ys), uy1 = Math.max(...ys);
        const r = { x: ux0 * scale, y: (pageHpt - uy1) * scale, w: (ux1 - ux0) * scale, h: (uy1 - uy0) * scale };
        if (r.w < 6 || r.h < 6) return;
        if (gs.fillAlpha <= 0.02) return;
        let rect = r;
        if (gs.clip) {
          const rc = intersectRect(gs.clip, r);
          if (!rc) return; // fully clipped away
          // Crop the bitmap to the visible (clipped) portion so it shows at its real size
          const frx = (rc.x - r.x) / r.w, fry = (rc.y - r.y) / r.h;
          const frw = rc.w / r.w, frh = rc.h / r.h;
          if (frw < 0.985 || frh < 0.985) {
            try {
              const sx = Math.min(cnv.width - 1, Math.max(0, Math.round(frx * cnv.width)));
              const sy = Math.min(cnv.height - 1, Math.max(0, Math.round(fry * cnv.height)));
              const sw = Math.max(1, Math.min(cnv.width - sx, Math.round(frw * cnv.width)));
              const sh = Math.max(1, Math.min(cnv.height - sy, Math.round(frh * cnv.height)));
              const crop = document.createElement('canvas');
              crop.width = sw; crop.height = sh;
              const cctx = crop.getContext('2d');
              if (cctx) {
                cctx.drawImage(cnv, sx, sy, sw, sh, 0, 0, sw, sh);
                url = transparent ? crop.toDataURL('image/png') : crop.toDataURL('image/jpeg', JPEG_QUALITY);
                rect = rc;
              }
            } catch { /* keep full image */ }
          }
        }
        const isFullPage = rect.w >= CANVAS_W * 0.82 && rect.h >= pageHpx * 0.82 && (rect.w * rect.h) >= 0.65 * totalAreaPx;
        if (isFullPage) {
          if (hasFullPageImage) return;
          hasFullPageImage = true;
        }
        out.images.push({
          id: `pimg-${Date.now()}-${pageIdx}-${out.images.length}`,
          type: 'image',
          imageUrl: url,
          objectFit: 'fill',
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.w),
          height: Math.round(rect.h),
          zIndex: isFullPage ? 1 : 6,
          locked: isFullPage,
          ...(gs.fillAlpha < 0.98 && !isFullPage ? { opacity: Math.round(gs.fillAlpha * 100) / 100 } : {}),
        });
      };

      for (let i = 0; i < opList.fnArray.length; i++) {
        const fn = opList.fnArray[i];
        const args = opList.argsArray[i];
        switch (fn) {
          case OPS_.save:
            stack.push({ ...gs, ctm: gs.ctm.slice() });
            break;
          case OPS_.restore: {
            const s = stack.pop();
            if (s) gs = s;
            break;
          }
          case OPS_.transform: {
            const m = asMat(args);
            if (m) gs.ctm = matMul(gs.ctm, m);
            break;
          }
          case OPS_.paintFormXObjectBegin: {
            stack.push({ ...gs, ctm: gs.ctm.slice() });
            const m = asMat(args?.[0]);
            if (m) gs.ctm = matMul(gs.ctm, m);
            break;
          }
          case OPS_.paintFormXObjectEnd: {
            const s = stack.pop();
            if (s) gs = s;
            break;
          }
          case OPS_.beginGroup:
            stack.push({ ...gs, ctm: gs.ctm.slice() });
            break;
          case OPS_.endGroup: {
            const s = stack.pop();
            if (s) gs = s;
            break;
          }
          case OPS_.setGState: {
            // args[0] is a list of [key, value] pairs (or a flat [k1, v1, k2, v2, ...] array)
            const raw = args?.[0];
            if (Array.isArray(raw)) {
              const entries: any[][] = Array.isArray(raw[0]) ? raw : [];
              if (entries.length === 0) {
                for (let pi = 0; pi + 1 < raw.length; pi += 2) entries.push([raw[pi], raw[pi + 1]]);
              }
              for (const pr of entries) {
                const v = Number(pr?.[1]);
                if (!Number.isFinite(v)) continue;
                if (pr[0] === 'ca') gs.fillAlpha = v;
                else if (pr[0] === 'CA') gs.strokeAlpha = v;
              }
            }
            break;
          }
          case OPS_.clip:
            awaitingClip = 1;
            break;
          case OPS_.eoClip:
            awaitingClip = 2;
            break;
          case OPS_.setLineWidth:
            lineWidthPt = Number(args?.[0]) > 0 ? Number(args[0]) : 1;
            break;
          case OPS_.setFont: {
            // Register the PDF's embedded font as a FontFace so text keeps its original look
            const ref = args?.[0];
            if (typeof ref === 'string' && fontRegistry) {
              // remember the fill color active for text drawn with this font
              fontRegistry.colors.set(ref, fillColor === 'transparent' ? '#000000' : fillColor);
              if (!fontRegistry.families.has(ref) && fontRegistry.families.size < 40) {
                fontRegistry.families.set(ref, ''); // mark seen to avoid duplicate fetches
                try {
                  const fobj = await fetchImgObj(ref);
                  const realName = String(fobj?.name || fobj?.loadedName || '');
                  fontRegistry.names.set(ref, realName);
                  if (fobj?.data && typeof FontFace !== 'undefined') {
                    const fam = `pdffont-${ref.replace(/[^a-zA-Z0-9_-]/g, '') || 'x'}`;
                    if (!fontRegistry.registered.has(fam)) {
                      const bytes = fobj.data as Uint8Array;
                      const face = new FontFace(fam, bytes.slice());
                      document.fonts.add(face);
                      face.load().catch(() => { /* browser will retry lazily */ });
                      fontRegistry.registered.add(fam);
                    }
                    fontRegistry.families.set(ref, fam);
                  }
                } catch { /* font registration is best-effort */ }
              }
            }
            break;
          }
          case OPS_.setFillRGBColor:
          case OPS_.setFillGray:
          case OPS_.setFillGrayColor: {
            const c = parseOpColor(args);
            if (c) fillColor = c;
            break;
          }
          case OPS_.setFillCMYKColor: {
            const c = parseOpColor(args);
            if (c) fillColor = c;
            break;
          }
          case OPS_.setFillTransparent:
            fillColor = 'transparent';
            break;
          case OPS_.setStrokeRGBColor:
          case OPS_.setStrokeGray:
          case OPS_.setStrokeGrayColor: {
            const c = parseOpColor(args);
            if (c) strokeColor = c;
            break;
          }
          case OPS_.constructPath: {
            const pfn = args[0];
            const buf = args[1]?.[0];
            const mm = args[2];
            if (!buf || !mm || typeof pfn !== 'number') break;

            const r = rectFromMinMax(mm);
            let curved = false;
            let moveCount = 0;
            let lineCount = 0;
            let hasClose = false;
            let firstX = 0, firstY = 0, curX = 0, curY = 0;
            for (let p = 0; p < buf.length;) {
              const cmd = buf[p++];
              if (cmd === 0) { moveCount++; curX = buf[p]; curY = buf[p + 1]; if (moveCount === 1) { firstX = curX; firstY = curY; } p += 2; }
              else if (cmd === 1) { lineCount++; curX = buf[p]; curY = buf[p + 1]; p += 2; }
              else if (cmd === 2) { curved = true; p += 6; }
              else if (cmd === 3) { curved = true; p += 4; }
              else if (cmd === 4) hasClose = true;
            }

            const isFill = FILL_FNS.has(pfn);
            const isStroke = STROKE_FNS.has(pfn);
            // A preceding W / W* op marks this path as a clip
            if (awaitingClip) {
              gs.clip = intersectRect(gs.clip, r);
              awaitingClip = 0;
            }
            if (!isFill && !isStroke) break; // clip-only path ("W n") or invisible
            // Clamp to the active clip region so oversized clipped fills don't cover the page
            const rc = gs.clip ? intersectRect(gs.clip, r) : r;
            if (!rc || rc.w < 1.5 || rc.h < 1.5) break;
            if (fillColor === 'transparent' && isFill) break;
            if (!isFill && strokeColor === 'transparent') break;
            if (isFill && gs.fillAlpha <= 0.02) break;
            if (!isFill && gs.strokeAlpha <= 0.02) break;

            const color = isFill ? fillColor : strokeColor;
            const key = `${Math.round(rc.x)},${Math.round(rc.y)},${Math.round(rc.w)},${Math.round(rc.h)},${color}`;
            if (seen.has(key)) break;
            seen.add(key);

            if (isFill) {
              const area = rc.w * rc.h;
              if (area > 0.92 * totalAreaPx) {
                if (area > bgArea && gs.fillAlpha >= 0.99) { bgArea = area; out.bgColor = color; }
                break;
              }
              if (out.shapes.length >= MAX_SHAPES_PER_PAGE) break;
              const isCircle = curved && rc.w >= 12 && rc.h >= 12 &&
                Math.abs(rc.w - rc.h) / Math.max(rc.w, rc.h) < 0.25;
              out.shapes.push({
                id: `pshp-${Date.now()}-${pageIdx}-${out.shapes.length}`,
                type: 'shape',
                shapeType: isCircle ? 'circle' : 'rectangle',
                x: Math.round(rc.x),
                y: Math.round(rc.y),
                width: Math.round(rc.w),
                height: Math.round(rc.h),
                backgroundColor: color,
                zIndex: 5,
                ...(gs.fillAlpha < 0.98 ? { opacity: Math.round(gs.fillAlpha * 100) / 100 } : {}),
              });
            } else {
              const thin = Math.max(2.5, scale);
              if (out.shapes.length >= MAX_SHAPES_PER_PAGE) break;
              if (rc.h <= thin && rc.w >= 8) {
                out.shapes.push({
                  id: `plin-${Date.now()}-${pageIdx}-${out.shapes.length}`,
                  type: 'shape',
                  shapeType: 'line',
                  x: Math.round(rc.x),
                  y: Math.round(rc.y + rc.h / 2 - 1),
                  width: Math.round(rc.w),
                  height: 2,
                  backgroundColor: color,
                  zIndex: 5,
                  ...(gs.strokeAlpha < 0.98 ? { opacity: Math.round(gs.strokeAlpha * 100) / 100 } : {}),
                });
              } else if (rc.w <= thin && rc.h >= 8) {
                out.shapes.push({
                  id: `plin-${Date.now()}-${pageIdx}-${out.shapes.length}`,
                  type: 'shape',
                  shapeType: 'line',
                  x: Math.round(rc.x + rc.w / 2 - 1),
                  y: Math.round(rc.y),
                  width: 2,
                  height: Math.round(rc.h),
                  backgroundColor: color,
                  zIndex: 5,
                  ...(gs.strokeAlpha < 0.98 ? { opacity: Math.round(gs.strokeAlpha * 100) / 100 } : {}),
                });
              } else {
                // Bigger stroked paths: straight polylines -> line across the bbox,
                // closed/curved outlines -> border-only box
                const closed = hasClose || (moveCount > 0 && lineCount > 0 && Math.abs(curX - firstX) < 0.01 && Math.abs(curY - firstY) < 0.01);
                const isStraightish = moveCount === 1 && !curved && lineCount <= 3 && !closed;
                if (isStraightish) {
                  out.shapes.push({
                    id: `pdln-${Date.now()}-${pageIdx}-${out.shapes.length}`,
                    type: 'shape',
                    shapeType: 'line',
                    x: Math.round(rc.x),
                    y: Math.round(rc.y),
                    width: Math.max(2, Math.round(rc.w)),
                    height: Math.max(2, Math.round(rc.h)),
                    backgroundColor: color,
                    zIndex: 5,
                    ...(gs.strokeAlpha < 0.98 ? { opacity: Math.round(gs.strokeAlpha * 100) / 100 } : {}),
                  });
                } else if (closed || curved || moveCount > 1) {
                  const bw = Math.max(1, Math.min(10, lineWidthPt * scale));
                  const isCircle = curved && rc.w >= 12 && rc.h >= 12 &&
                    Math.abs(rc.w - rc.h) / Math.max(rc.w, rc.h) < 0.25;
                  out.shapes.push({
                    id: `pbrd-${Date.now()}-${pageIdx}-${out.shapes.length}`,
                    type: 'shape',
                    shapeType: isCircle ? 'circle' : 'rectangle',
                    x: Math.round(rc.x),
                    y: Math.round(rc.y),
                    width: Math.round(rc.w),
                    height: Math.round(rc.h),
                    backgroundColor: 'transparent',
                    border: { width: Math.round(bw * 10) / 10, color, style: 'solid' },
                    zIndex: 5,
                    ...(gs.strokeAlpha < 0.98 ? { opacity: Math.round(gs.strokeAlpha * 100) / 100 } : {}),
                  });
                }
              }
            }
            break;
          }
          case OPS_.paintImageXObject: {
            const objId = args?.[0];
            if (objId != null) {
              const img = await fetchImgObj(String(objId));
              await addImageAtMatrix(img, gs.ctm);
            }
            break;
          }
          case OPS_.paintImageXObjectRepeat: {
            const objId = args?.[0];
            const sx = Number(args?.[1] ?? 1);
            const sy = Number(args?.[2] ?? 1);
            const positions = args?.[3] as ArrayLike<number> | undefined;
            if (objId == null) break;
            const img = await fetchImgObj(String(objId));
            if (!positions || positions.length < 2) {
              await addImageAtMatrix(img, matMul(gs.ctm, [sx, 0, 0, sy, 0, 0]));
            } else {
              for (let p = 0; p + 1 < positions.length; p += 2) {
                await addImageAtMatrix(img, matMul(gs.ctm, [sx, 0, 0, sy, Number(positions[p]), Number(positions[p + 1])]));
              }
            }
            break;
          }
          case OPS_.paintInlineImageXObject:
            await addImageAtMatrix(args?.[0], gs.ctm);
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
    // Fonts embedded in the PDF get registered as FontFaces so imported text keeps its original look
    const fontRegistry = { families: new Map<string, string>(), names: new Map<string, string>(), registered: new Set<string>(), colors: new Map<string, string>() };

    for (let i = 1; i <= pageCount; i++) {
      setStatus({
        stage: 'rendering',
        progress: Math.round(((i - 1) / pageCount) * 90) + 5,
        message: `${t('معالجة الصفحة', 'Processing page')} ${i}/${pageCount}`,
      });
      await new Promise(r => setTimeout(r, 0));

      const page = i === 1 ? firstPage : await pdf.getPage(i);
      const pageVp = page.getViewport({ scale: 1 });
      const pageScale = CANVAS_W / pageVp.width;
      const pageH = Math.round(pageVp.height * pageScale);

      // Render preview / background image
      const viewport = page.getViewport({ scale: pageScale * RENDER_QUALITY });
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

      // Graphics extraction first: it also registers embedded @font-face families
      let elements: SlideElement[];
      let backgroundColor = '#ffffff';

      const graphics = await extractGraphicElements(page, pageScale, pageVp.height, CANVAS_W * pageH, i, fontRegistry);
      if (graphics.bgColor) backgroundColor = graphics.bgColor;
      const movableImages = graphics.images.filter(img => !img.locked);
      const pageBackgrounds = graphics.images.filter(img => img.locked);

      // Editable texts
      let textElements: SlideElement[] = [];
      try {
        const tc = await page.getTextContent();
        const styles = (tc as { styles?: Record<string, { fontFamily?: string }> }).styles || {};
        const raws: RawTextItem[] = [];
        for (const item of tc.items) {
          if (!('str' in item)) continue;
          const ti = item as { str: string; transform: number[]; width: number; dir: string; fontName?: string };
          if (!ti.str || !ti.str.trim()) continue;
          const tr = ti.transform;
          const fs = Math.hypot(tr[2], tr[3]) || Math.abs(tr[3]) || 12;
          const fontName = ti.fontName || '';
          const embedded = fontName ? fontRegistry.families.get(fontName) : '';
          const realName = fontName ? fontRegistry.names.get(fontName) || '' : '';
          const family = styles[fontName]?.fontFamily || '';
          const face = `${fontName} ${family} ${realName}`;
          raws.push({
            str: ti.str,
            x: tr[4],
            yBaseline: tr[5],
            w: ti.width,
            fs,
            rtl: ti.dir === 'rtl' || /[\u0600-\u06FF]/.test(ti.str),
            fontFamily: embedded || styles[fontName]?.fontFamily,
            fontWeight: embedded ? 'normal' : inferFontWeight(face),
            fontStyle: embedded ? 'normal' : (/italic|oblique/i.test(face) ? 'italic' : 'normal'),
            color: fontName ? fontRegistry.colors.get(fontName) : undefined,
          });
        }
        textElements = buildTextElements(raws, pageVp.height, pageScale, i);
      } catch { /* best-effort */ }

      elements = [...pageBackgrounds.slice(0, 1), ...graphics.shapes, ...movableImages, ...textElements];
      if (elements.length === 0) {
        elements = [{
          id: `pbg-${Date.now()}-${i}`,
          type: 'image',
          imageUrl: url,
          objectFit: 'contain',
          x: 0,
          y: 0,
          width: CANVAS_W,
          height: pageH,
          zIndex: 1,
          locked: true,
        }];
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
  }, [buildTextElements, extractGraphicElements, language]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [language]);

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
          toast.warning(t('الملف كبير، قد يستغرق الحفظ وقتًا أطول', 'Large file: saving may take longer'));
        }
        const noEditableBits = result.slides.every(s =>
          !s.elements?.some(el => el.type === 'text' || (el.type === 'image' && !el.locked) || el.type === 'shape')
        );
        if (noEditableBits) {
          toast.info(t('الملف صورة ممسوحة بدون نصوص أو عناصر قابلة للفصل — هتظهر الصفحة كخلفية', 'This looks like a scanned image-only PDF — the page will be imported as a locked background'), { duration: 8000 });
        }
      } catch (error) {
        if (cancelled) return;
        console.error('PDF import error:', error);
        setStatus({
          stage: 'error',
          progress: 0,
          message: error instanceof Error ? error.message : t('فشل استيراد الملف', 'Import failed'),
        });
      }
    })();
    return () => { cancelled = true; };
  }, [selectedFile, parsePDF, language]);

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

  const handleImport = useCallback(() => {
    if (previewSlides.length === 0) return;
    const title = selectedFile?.name.replace(/\.pdf$/i, '') || 'Imported PDF';
    onImport(previewSlides, title, importedSize);
    toast.success(t(`تم استيراد ${previewSlides.length} صفحات!`, `Imported ${previewSlides.length} pages!`));
    handleOpenChange(false);
  }, [previewSlides, selectedFile, onImport, importedSize, language, handleOpenChange]);

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

  // Auto-load a file handed over by the unified import button
  useEffect(() => {
    if (isOpen && initialFile) {
      setStatus({ stage: 'idle', progress: 0, message: '' });
      setPreviewSlides([]);
      setPreviewUrls([]);
      setSelectedFile(initialFile);
    }
  }, [isOpen, initialFile]);

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

          <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
            {t('هيتفصل تلقائيًا النصوص والصور والأشكال عشان تقدر تعدّلها وتحرّكها', 'Texts, images and shapes are extracted automatically so you can edit and move them')}
          </p>

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
