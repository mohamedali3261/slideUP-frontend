import { useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { SlideElement } from '@/data/templates';
import {
  CANVAS_W,
  MAX_SHAPES_PER_PAGE,
  MAX_IMAGES_PER_PAGE,
  JPEG_QUALITY,
  RawTextItem,
  FontRegistry,
} from './types';
import {
  matMul,
  matApply,
  asMat,
  parseOpColor,
  RTL_RE,
  normalizePdfText,
} from './pdfHelpers';

export interface GraphicsResult {
  shapes: SlideElement[];
  images: SlideElement[];
  bgColor: string | null;
  textRuns: RawTextItem[];
}

interface GRect { x: number; y: number; w: number; h: number }

// ─── Image decoding ───────────────────────────────────────────────────────────
const imageToDataUrl = (
  img: any,
): { cnv: HTMLCanvasElement; url: string; transparent: boolean } | null => {
  try {
    const bmp = img.bitmap;
    const w = (bmp && bmp.width) || img.width;
    const h = (bmp && bmp.height) || img.height;
    if (!w || !h || w * h > 20e6) return null;

    const cnv = document.createElement('canvas');
    cnv.width = w;
    cnv.height = h;
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
          rgba[j] = d[i]; rgba[j + 1] = d[i + 1];
          rgba[j + 2] = d[i + 2]; rgba[j + 3] = 255;
        }
      } else if (img.kind === 1) {
        rgba = new Uint8ClampedArray(w * h * 4);
        const rowBytes = (w + 7) >> 3;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const bit = (d[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1;
            const v = bit ? 255 : 0;
            const o = (y * w + x) * 4;
            rgba[o] = rgba[o + 1] = rgba[o + 2] = v;
            rgba[o + 3] = 255;
          }
        }
      }
      if (!rgba) return null;
      ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer as ArrayBuffer), w, h), 0, 0);
    } else {
      return null;
    }

    let transparent = false;
    try {
      const step = Math.max(1, Math.floor((w * h) / 4096));
      const probe = ctx.getImageData(0, 0, w, h).data;
      for (let i = 3, n = 0; i < probe.length && n < 4096; i += 4 * step, n++) {
        if (probe[i] < 250) { transparent = true; break; }
      }
    } catch { /* keep opaque assumption */ }

    return {
      cnv,
      transparent,
      url: transparent
        ? cnv.toDataURL('image/png')
        : cnv.toDataURL('image/jpeg', JPEG_QUALITY),
    };
  } catch {
    return null;
  }
};

// ─── Main hook ────────────────────────────────────────────────────────────────
export const usePdfGraphicsExtractor = () => {
  const extractGraphicElements = useCallback(
    async (
      page: any,
      scale: number,
      pageHpt: number,
      totalAreaPx: number,
      pageIdx: number,
      fontRegistry?: FontRegistry,
    ): Promise<GraphicsResult> => {
      const out: GraphicsResult = {
        shapes: [],
        images: [],
        bgColor: null,
        textRuns: [],
      };

      try {
        const OPS_: Record<string, number> = pdfjsLib.OPS as any;
        const opList = await page.getOperatorList();

        // ── Graphics state ─────────────────────────────────────────────────
        let gs: { ctm: number[]; clip: GRect | null; fillAlpha: number; strokeAlpha: number } =
          { ctm: [1, 0, 0, 1, 0, 0], clip: null, fillAlpha: 1, strokeAlpha: 1 };
        const stack: typeof gs[] = [];
        let awaitingClip = 0;

        // ── Text state ─────────────────────────────────────────────────────
        let tm: number[] | null = null;
        let lm: number[] | null = null;
        let leading = 0;
        let curFont = '';
        let curFontSize = 0;
        const seenText = new Set<string>();

        // ── Color state ────────────────────────────────────────────────────
        let fillColor = '#000000';
        let strokeColor = '#000000';
        const seen = new Set<string>();
        let bgArea = 0;
        let hasFullPageImage = false;
        let lineWidthPt = 1;
        const pageHpx = pageHpt * scale;

        const FILL_FNS = new Set([
          OPS_.fill, OPS_.eoFill, OPS_.fillStroke,
          OPS_.eoFillStroke, OPS_.closeFillStroke, OPS_.closeEOFillStroke,
        ]);
        const STROKE_FNS = new Set([OPS_.stroke, OPS_.closeStroke]);

        // ── Geometry helpers ───────────────────────────────────────────────
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
          return {
            x: ux0 * scale,
            y: (pageHpt - uy1) * scale,
            w: (ux1 - ux0) * scale,
            h: (uy1 - uy0) * scale,
          };
        };

        const intersectRect = (a: GRect | null, b: GRect): GRect | null => {
          if (!a) return b;
          const x0 = Math.max(a.x, b.x), y0 = Math.max(a.y, b.y);
          const x1 = Math.min(a.x + a.w, b.x + b.w);
          const y1 = Math.min(a.y + a.h, b.y + b.h);
          return x1 - x0 > 0.5 && y1 - y0 > 0.5
            ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
            : null;
        };

        // ── Text run collection ────────────────────────────────────────────
        const pushTextRun = (glyphs: any) => {
          if (!tm || !curFont || !Array.isArray(glyphs) || out.textRuns.length >= 600) return;

          const chars: string[] = [];
          for (const g of glyphs) {
            if (typeof g === 'number') continue;
            if (typeof g === 'string') { chars.push(g); continue; }
            if (g && typeof g.unicode === 'string') chars.push(g.unicode);
          }
          if (chars.length === 0) return;

          const rawStr = chars.join('');
          const isRtlRun = RTL_RE.test(rawStr);

          let str: string;
          if (isRtlRun) {
            // PDF RTL glyphs come in visual order (glyph by glyph, right-to-left
            // across the page), so the raw string is visually reversed.
            // We need to reverse the whole run to get the correct logical/reading order.
            // Use Intl.Segmenter to reverse by grapheme clusters (handles composed
            // Arabic characters like تأ correctly).
            if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
              try {
                const seg = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' });
                str = [...seg.segment(rawStr)]
                  .map((s: any) => s.segment)
                  .reverse()
                  .join('');
              } catch {
                str = [...rawStr].reverse().join('');
              }
            } else {
              str = [...rawStr].reverse().join('');
            }
          } else {
            str = rawStr;
          }

          // Normalize: map Arabic Presentation Forms → base chars, strip □ glyphs
          str = normalizePdfText(str);
          if (!str) return;

          const pos = matApply(gs.ctm, tm[4], tm[5]);
          const fs = curFontSize * Math.hypot(tm[0], tm[1]);
          if (fs < 1) return;

          const key = `${Math.round(pos[0])},${Math.round(pos[1])},${rawStr}`;
          if (seenText.has(key)) return;
          seenText.add(key);

          out.textRuns.push({
            str,
            x: pos[0],
            yBaseline: pos[1],
            w: str.length * fs * 0.52,
            fs,
            rtl: isRtlRun,
            color: fillColor === 'transparent' ? '#000000' : fillColor,
          });
        };

        // ── Image helpers ──────────────────────────────────────────────────
        const fetchImgObj = (objId: string) =>
          new Promise<any>(resolve => {
            let done = false;
            const finish = (v: any) => {
              if (!done) { done = true; resolve(v || null); }
            };
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

        const addImageAtMatrix = async (imgData: any, matrix: number[]) => {
          if (!imgData || out.images.length >= MAX_IMAGES_PER_PAGE) return;
          const decoded = imageToDataUrl(imgData);
          if (!decoded) return;

          const { cnv, transparent } = decoded;
          let url = decoded.url;

          const corners: [number, number][] = [
            matApply(matrix, 0, 0), matApply(matrix, 1, 0),
            matApply(matrix, 0, 1), matApply(matrix, 1, 1),
          ];
          const xs = corners.map(c => c[0]);
          const ys = corners.map(c => c[1]);
          const ux0 = Math.min(...xs), ux1 = Math.max(...xs);
          const uy0 = Math.min(...ys), uy1 = Math.max(...ys);
          const r = {
            x: ux0 * scale,
            y: (pageHpt - uy1) * scale,
            w: (ux1 - ux0) * scale,
            h: (uy1 - uy0) * scale,
          };
          if (r.w < 6 || r.h < 6) return;
          if (gs.fillAlpha <= 0.02) return;

          let rect = r;
          if (gs.clip) {
            const rc = intersectRect(gs.clip, r);
            if (!rc) return;
            const frx = (rc.x - r.x) / r.w, fry = (rc.y - r.y) / r.h;
            const frw = rc.w / r.w,          frh = rc.h / r.h;
            if (frw < 0.985 || frh < 0.985) {
              try {
                const sx = Math.min(cnv.width - 1,  Math.max(0, Math.round(frx * cnv.width)));
                const sy = Math.min(cnv.height - 1, Math.max(0, Math.round(fry * cnv.height)));
                const sw = Math.max(1, Math.min(cnv.width  - sx, Math.round(frw * cnv.width)));
                const sh = Math.max(1, Math.min(cnv.height - sy, Math.round(frh * cnv.height)));
                const crop = document.createElement('canvas');
                crop.width = sw; crop.height = sh;
                const cctx = crop.getContext('2d');
                if (cctx) {
                  cctx.drawImage(cnv, sx, sy, sw, sh, 0, 0, sw, sh);
                  url = transparent
                    ? crop.toDataURL('image/png')
                    : crop.toDataURL('image/jpeg', JPEG_QUALITY);
                  rect = rc;
                }
              } catch { /* keep full image */ }
            }
          }

          const isFullPage =
            rect.w >= CANVAS_W * 0.82 &&
            rect.h >= pageHpx * 0.82 &&
            rect.w * rect.h >= 0.65 * totalAreaPx;

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
            ...(gs.fillAlpha < 0.98 && !isFullPage
              ? { opacity: Math.round(gs.fillAlpha * 100) / 100 }
              : {}),
          });
        };

        // ── Operator loop ──────────────────────────────────────────────────
        for (let i = 0; i < opList.fnArray.length; i++) {
          const fn   = opList.fnArray[i];
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
              const raw = args?.[0];
              if (Array.isArray(raw)) {
                const entries: any[][] = Array.isArray(raw[0]) ? raw : [];
                if (entries.length === 0) {
                  for (let pi = 0; pi + 1 < raw.length; pi += 2)
                    entries.push([raw[pi], raw[pi + 1]]);
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

            case OPS_.clip:    awaitingClip = 1; break;
            case OPS_.eoClip:  awaitingClip = 2; break;

            case OPS_.setLineWidth:
              lineWidthPt = Number(args?.[0]) > 0 ? Number(args[0]) : 1;
              break;

            case OPS_.beginText:
              tm = [1, 0, 0, 1, 0, 0];
              lm = [1, 0, 0, 1, 0, 0];
              break;

            case OPS_.setTextMatrix: {
              const m = asMat(args);
              if (m) { tm = m; lm = m.slice(); }
              break;
            }

            case OPS_.moveText: {
              if (lm) {
                lm = matMul([1, 0, 0, 1, Number(args?.[0]) || 0, Number(args?.[1]) || 0], lm);
                tm = lm.slice();
              }
              break;
            }

            case OPS_.setLeading:
              leading = Number(args?.[0]) || 0;
              break;

            case OPS_.setLeadingMoveText: {
              leading = -Number(args?.[1]) || 0;
              if (lm) {
                lm = matMul([1, 0, 0, 1, Number(args?.[0]) || 0, Number(args?.[1]) || 0], lm);
                tm = lm.slice();
              }
              break;
            }

            case OPS_.nextLine: {
              if (lm) {
                lm = matMul([1, 0, 0, 1, 0, -leading], lm);
                tm = lm.slice();
              }
              break;
            }

            case OPS_.showText:
              pushTextRun(args?.[0]);
              break;

            case OPS_.showSpacedText:
              pushTextRun(args?.[0]);
              break;

            case OPS_.nextLineShowText: {
              if (lm) {
                lm = matMul([1, 0, 0, 1, 0, -leading], lm);
                tm = lm.slice();
              }
              pushTextRun(args?.[0]);
              break;
            }

            case OPS_.nextLineSetSpacingShowText: {
              if (lm) {
                lm = matMul([1, 0, 0, 1, 0, -leading], lm);
                tm = lm.slice();
              }
              pushTextRun(args?.[2]);
              break;
            }

            case OPS_.setFont: {
              const ref = args?.[0];
              if (typeof ref === 'string') {
                curFont = ref;
                curFontSize = Number(args?.[1]) || curFontSize;
                if (fontRegistry) {
                  fontRegistry.colors.set(
                    ref,
                    fillColor === 'transparent' ? '#000000' : fillColor,
                  );
                  if (!fontRegistry.families.has(ref) && fontRegistry.families.size < 40) {
                    fontRegistry.families.set(ref, '');
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
                          face.load().catch(() => { /* best-effort */ });
                          fontRegistry.registered.add(fam);
                        }
                        fontRegistry.families.set(ref, fam);
                      }
                    } catch { /* font registration is best-effort */ }
                  }
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
              const mm  = args[2];
              if (!buf || !mm || typeof pfn !== 'number') break;

              const r = rectFromMinMax(mm);
              let curved = false, moveCount = 0, lineCount = 0, hasClose = false;
              let firstX = 0, firstY = 0, curX = 0, curY = 0;

              for (let p = 0; p < buf.length;) {
                const cmd = buf[p++];
                if (cmd === 0) {
                  moveCount++;
                  curX = buf[p]; curY = buf[p + 1];
                  if (moveCount === 1) { firstX = curX; firstY = curY; }
                  p += 2;
                } else if (cmd === 1) { lineCount++; curX = buf[p]; curY = buf[p + 1]; p += 2; }
                else if (cmd === 2) { curved = true; p += 6; }
                else if (cmd === 3) { curved = true; p += 4; }
                else if (cmd === 4) hasClose = true;
              }

              const isFill   = FILL_FNS.has(pfn);
              const isStroke = STROKE_FNS.has(pfn);

              if (awaitingClip) {
                gs.clip = intersectRect(gs.clip, r);
                awaitingClip = 0;
              }
              if (!isFill && !isStroke) break;

              const rc = gs.clip ? intersectRect(gs.clip, r) : r;
              if (!rc || rc.w < 1.5 || rc.h < 1.5) break;
              if (fillColor === 'transparent' && isFill) break;
              if (!isFill && strokeColor === 'transparent') break;
              if (isFill  && gs.fillAlpha   <= 0.02) break;
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
                  x: Math.round(rc.x), y: Math.round(rc.y),
                  width: Math.round(rc.w), height: Math.round(rc.h),
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
                    type: 'shape', shapeType: 'line',
                    x: Math.round(rc.x), y: Math.round(rc.y + rc.h / 2 - 1),
                    width: Math.round(rc.w), height: 2,
                    backgroundColor: color, zIndex: 5,
                    ...(gs.strokeAlpha < 0.98 ? { opacity: Math.round(gs.strokeAlpha * 100) / 100 } : {}),
                  });
                } else if (rc.w <= thin && rc.h >= 8) {
                  out.shapes.push({
                    id: `plin-${Date.now()}-${pageIdx}-${out.shapes.length}`,
                    type: 'shape', shapeType: 'line',
                    x: Math.round(rc.x + rc.w / 2 - 1), y: Math.round(rc.y),
                    width: 2, height: Math.round(rc.h),
                    backgroundColor: color, zIndex: 5,
                    ...(gs.strokeAlpha < 0.98 ? { opacity: Math.round(gs.strokeAlpha * 100) / 100 } : {}),
                  });
                } else {
                  const closed =
                    hasClose ||
                    (moveCount > 0 && lineCount > 0 &&
                      Math.abs(curX - firstX) < 0.01 &&
                      Math.abs(curY - firstY) < 0.01);
                  const isStraightish =
                    moveCount === 1 && !curved && lineCount <= 3 && !closed;

                  if (isStraightish) {
                    out.shapes.push({
                      id: `pdln-${Date.now()}-${pageIdx}-${out.shapes.length}`,
                      type: 'shape', shapeType: 'line',
                      x: Math.round(rc.x), y: Math.round(rc.y),
                      width: Math.max(2, Math.round(rc.w)),
                      height: Math.max(2, Math.round(rc.h)),
                      backgroundColor: color, zIndex: 5,
                      ...(gs.strokeAlpha < 0.98 ? { opacity: Math.round(gs.strokeAlpha * 100) / 100 } : {}),
                    });
                  } else if (closed || curved || moveCount > 1) {
                    const bw = Math.max(1, Math.min(10, lineWidthPt * scale));
                    const isCircle2 = curved && rc.w >= 12 && rc.h >= 12 &&
                      Math.abs(rc.w - rc.h) / Math.max(rc.w, rc.h) < 0.25;
                    out.shapes.push({
                      id: `pbrd-${Date.now()}-${pageIdx}-${out.shapes.length}`,
                      type: 'shape',
                      shapeType: isCircle2 ? 'circle' : 'rectangle',
                      x: Math.round(rc.x), y: Math.round(rc.y),
                      width: Math.round(rc.w), height: Math.round(rc.h),
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
              const objId    = args?.[0];
              const sx       = Number(args?.[1] ?? 1);
              const sy       = Number(args?.[2] ?? 1);
              const positions = args?.[3] as ArrayLike<number> | undefined;
              if (objId == null) break;
              const img = await fetchImgObj(String(objId));
              if (!positions || positions.length < 2) {
                await addImageAtMatrix(img, matMul(gs.ctm, [sx, 0, 0, sy, 0, 0]));
              } else {
                for (let p = 0; p + 1 < positions.length; p += 2) {
                  await addImageAtMatrix(
                    img,
                    matMul(gs.ctm, [sx, 0, 0, sy, Number(positions[p]), Number(positions[p + 1])]),
                  );
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
    },
    [],
  );

  return { extractGraphicElements };
};
