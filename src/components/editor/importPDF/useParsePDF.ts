import { useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { SlideTemplate } from '@/data/templates';
import { toast } from 'sonner';
import {
  CANVAS_W,
  RENDER_QUALITY,
  JPEG_QUALITY,
  MAX_PAGES,
  RawTextItem,
} from './types';
import { RTL_RE, inferFontWeight, normalizePdfText } from './pdfHelpers';
import { usePdfTextExtractor } from './usePdfTextExtractor';
import { usePdfGraphicsExtractor } from './usePdfGraphicsExtractor';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface ParsePDFResult {
  slides: SlideTemplate[];
  previews: string[];
  size: { width: number; height: number };
}

export const useParsePDF = (
  language: string,
  setStatus: (s: { stage: 'idle' | 'reading' | 'rendering' | 'done' | 'error'; progress: number; message: string }) => void,
) => {
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
  const { buildTextElements }      = usePdfTextExtractor();
  const { extractGraphicElements } = usePdfGraphicsExtractor();

  const parsePDF = useCallback(
    async (file: File): Promise<ParsePDFResult> => {
      setStatus({ stage: 'reading', progress: 5, message: t('جاري قراءة الملف...', 'Reading file...') });

      const data = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data });
      const pdf = await loadingTask.promise;

      if (pdf.numPages > MAX_PAGES) {
        toast.warning(
          t(
            `الملف يحتوي على ${pdf.numPages} صفحة، سيتم استيراد أول ${MAX_PAGES} صفحة فقط`,
            `The file has ${pdf.numPages} pages, only the first ${MAX_PAGES} will be imported`,
          ),
        );
      }
      const pageCount = Math.min(pdf.numPages, MAX_PAGES);

      const firstPage     = await pdf.getPage(1);
      const firstViewport = firstPage.getViewport({ scale: 1 });
      const scale  = CANVAS_W / firstViewport.width;
      const canvasH = Math.round(firstViewport.height * scale);

      const slides: SlideTemplate[] = [];
      const previews: string[] = [];

      // Fonts embedded in the PDF get registered as FontFaces
      const fontRegistry = {
        families: new Map<string, string>(),
        names:    new Map<string, string>(),
        registered: new Set<string>(),
        colors:   new Map<string, string>(),
      };

      for (let i = 1; i <= pageCount; i++) {
        setStatus({
          stage: 'rendering',
          progress: Math.round(((i - 1) / pageCount) * 90) + 5,
          message: `${t('معالجة الصفحة', 'Processing page')} ${i}/${pageCount}`,
        });
        await new Promise(r => setTimeout(r, 0));

        const page   = i === 1 ? firstPage : await pdf.getPage(i);
        const pageVp = page.getViewport({ scale: 1 });
        const pageScale = CANVAS_W / pageVp.width;
        const pageH = Math.round(pageVp.height * pageScale);

        // ── Render preview / background thumbnail ──────────────────────────
        const viewport = page.getViewport({ scale: pageScale * RENDER_QUALITY });
        const canvas = document.createElement('canvas');
        canvas.width  = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        await page.render({ canvas, viewport }).promise;
        const url = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        previews.push(url);

        // ── Extract graphics + text runs ───────────────────────────────────
        let elements: import('@/data/templates').SlideElement[];
        let backgroundColor = '#ffffff';

        const graphics = await extractGraphicElements(
          page, pageScale, pageVp.height, CANVAS_W * pageH, i, fontRegistry,
        );
        if (graphics.bgColor) backgroundColor = graphics.bgColor;

        const movableImages  = graphics.images.filter(img => !img.locked);
        const pageBackgrounds = graphics.images.filter(img =>  img.locked);

        // ── Build text elements ────────────────────────────────────────────
        // Use getTextContent as PRIMARY source — it applies the font's ToUnicode
        // map and GSUB substitution tables, giving correct Arabic characters.
        // getOperatorList (textRuns) is only used as fallback for PDFs where
        // getTextContent returns nothing.
        let textElements: import('@/data/templates').SlideElement[] = [];
        try {
          let raws: RawTextItem[] = [];

          // ── Primary: getTextContent (correct Unicode, handles Arabic shaping) ──
          try {
            const tc = await page.getTextContent();
            const styles = (tc as { styles?: Record<string, { fontFamily?: string }> }).styles || {};
            for (const item of tc.items) {
              if (!('str' in item)) continue;
              const ti = item as {
                str: string; transform: number[]; width: number; dir: string; fontName?: string;
              };
              if (!ti.str?.trim()) continue;

              const tr       = ti.transform;
              const fs       = Math.hypot(tr[2], tr[3]) || Math.abs(tr[3]) || 12;
              const fontName = ti.fontName || '';
              const embedded = fontName ? fontRegistry.families.get(fontName) : '';
              const realName = fontName ? fontRegistry.names.get(fontName) || '' : '';
              const family   = styles[fontName]?.fontFamily || '';
              const face     = `${fontName} ${family} ${realName}`;

              // Normalize: map Arabic Presentation Forms → base chars, drop □ glyphs
              const cleanStr = normalizePdfText(ti.str);
              if (!cleanStr) continue;

              const isRtl    = ti.dir === 'rtl' || RTL_RE.test(cleanStr);

              raws.push({
                str: cleanStr,
                x: tr[4], yBaseline: tr[5], w: ti.width > 0 ? ti.width : cleanStr.length * fs * 0.52, fs,
                rtl: isRtl,
                fromGetTextContent: true,
                fontFamily:  embedded || styles[fontName]?.fontFamily,
                fontWeight:  embedded ? 'normal' : inferFontWeight(face),
                fontStyle:   embedded ? 'normal'
                  : (/italic|oblique/i.test(face) ? 'italic' : 'normal'),
                color: fontName ? fontRegistry.colors.get(fontName) : undefined,
              });
            }
          } catch { /* fall through to textRuns */ }

          // ── Fallback: operator-list text runs (if getTextContent gave nothing) ──
          if (raws.length === 0 && graphics.textRuns.length > 0) {
            raws = graphics.textRuns.map(r => {
              const fam      = fontRegistry.families.get(r.fontRef ?? '') || '';
              const realName = fontRegistry.names.get(r.fontRef ?? '')    || '';
              return {
                ...r,
                rtl: r.rtl || RTL_RE.test(r.str),
                fontFamily:  fam || undefined,
                fontWeight:  fam ? 'normal' as const : inferFontWeight(`${r.fontRef} ${realName}`),
                fontStyle:   (/italic|oblique/i.test(realName) ? 'italic' : 'normal') as 'italic' | 'normal',
              };
            });
          }

          textElements = buildTextElements(raws, pageVp.height, pageScale, i);
        } catch { /* best-effort */ }

        // ── Compose slide ──────────────────────────────────────────────────
        elements = [
          ...pageBackgrounds.slice(0, 1),
          ...graphics.shapes,
          ...movableImages,
          ...textElements,
        ];

        if (elements.length === 0) {
          elements = [{
            id: `pbg-${Date.now()}-${i}`,
            type: 'image',
            imageUrl: url,
            objectFit: 'contain',
            x: 0, y: 0,
            width: CANVAS_W, height: pageH,
            zIndex: 1, locked: true,
          }];
        }

        const firstLine = textElements[0]?.content?.split('\n')[0];
        slides.push({
          id: `slide-${Date.now()}-${i}`,
          type: i === 1 ? 'cover' : 'content',
          title:
            (firstLine && firstLine.length <= 80 ? firstLine : '') ||
            t(`صفحة ${i}`, `Page ${i}`),
          backgroundColor,
          textColor: '#000000',
          elements,
        });

        // Free the rendered canvas early
        canvas.width = 0;
        canvas.height = 0;
      }

      await loadingTask.destroy();
      setStatus({ stage: 'done', progress: 100, message: t('تم!', 'Done!') });

      return { slides, previews, size: { width: CANVAS_W, height: canvasH } };
    },
    [buildTextElements, extractGraphicElements, language, setStatus],
  );

  return { parsePDF };
};
