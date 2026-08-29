import { useCallback } from 'react';
import { SlideElement } from '@/data/templates';
import { CANVAS_W } from './types';
import { RawTextItem, TextLine } from './types';
import { isRtlText } from './pdfHelpers';

/**
 * Groups raw text items (from the PDF content stream) into positioned
 * SlideElement text blocks, handling RTL/LTR layout correctly.
 */
export const usePdfTextExtractor = () => {
  const buildTextElements = useCallback(
    (
      items: RawTextItem[],
      pageHpt: number,
      scale: number,
      pageIdx: number,
    ): SlideElement[] => {
      if (items.length === 0) return [];

      const sorted = [...items].sort(
        (a, b) => b.yBaseline - a.yBaseline || a.x - b.x,
      );

      // ── Group into visual lines by baseline proximity ──────────────────────
      const baseGroups: RawTextItem[][] = [];
      let current: RawTextItem[] = [];
      for (const item of sorted) {
        if (current.length === 0) { current = [item]; continue; }
        const ref = current[current.length - 1];
        const tol = Math.max(ref.fs, item.fs) * 0.45;
        if (Math.abs(item.yBaseline - ref.yBaseline) <= tol) {
          current.push(item);
        } else {
          baseGroups.push(current);
          current = [item];
        }
      }
      if (current.length > 0) baseGroups.push(current);

      // ── Split baseline groups at large horizontal gaps (separate columns) ──
      const rawLines: RawTextItem[][] = [];
      for (const group of baseGroups) {
        // Sort LTR first to detect gaps, then we'll re-sort per RTL/LTR below
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

      // ── Assemble each raw line into a TextLine ─────────────────────────────
      const lines: TextLine[] = [];
      rawLines.forEach(lineItems => {
        // Determine RTL by checking actual unicode content
        const rtl =
          lineItems.filter(i => i.rtl || isRtlText(i.str)).length >=
          lineItems.length / 2;

        // getTextContent items: str is already correct Unicode (logical order).
        //   RTL items arrive with X positions left→right in the stream
        //   (smallest X = leftmost word visually = LAST word in reading order).
        //   So for RTL we sort ascending X and then REVERSE the array to get
        //   reading order (rightmost word first).
        //
        // getOperatorList items: str has been reversed per-run in pushTextRun.
        //   Runs arrive with X positions right→left (highest X = first word).
        //   Sort descending to join in reading order.
        const fromGTC = lineItems.some(i => i.fromGetTextContent);

        if (fromGTC) {
          // Sort by X ascending (left to right as they appear on page)
          lineItems.sort((a, b) => a.x - b.x);
          if (rtl) {
            // Reverse so rightmost (last in sorted array) comes first
            lineItems.reverse();
          }
        } else {
          lineItems.sort((a, b) => (rtl ? b.x - a.x : a.x - b.x));
        }

        let text = '';
        let prevRunEdge: number | null = null;
        let prevFs = 12;

        for (const it of lineItems) {
          if (prevRunEdge !== null) {
            const gap = rtl
              ? prevRunEdge - (it.x + it.w)
              : it.x - prevRunEdge;
            if (gap > prevFs * 0.3 && !/\s$/.test(text) && !/^\s/.test(it.str)) {
              text += ' ';
            }
          }
          text += it.str;
          prevRunEdge = rtl ? it.x : it.x + it.w;
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

      // ── Merge consecutive lines into paragraph blocks ──────────────────────
      lines.sort((a, b) => a.topY - b.topY);

      interface Block {
        text: string;
        x: number;
        y: number;
        w: number;
        h: number;
        fs: number;
        rtl: boolean;
        bottomY: number;
        fontFamily?: string;
        fontWeight?: SlideElement['fontWeight'];
        fontStyle?: SlideElement['fontStyle'];
        color?: string;
        lastTopY: number;
        topGaps: number[];
        fss: number[];
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

          if (
            gap <= Math.max(last.fs, line.fs) * 0.8 &&
            overlapW >= minW * 0.2
          ) {
            last.topGaps.push(line.topY - last.lastTopY);
            last.fss.push(line.fs);
            last.text += '\n' + line.text;
            last.x = Math.min(last.x, line.x);
            last.w =
              Math.max(last.x + last.w, line.x + line.w) - last.x;
            last.bottomY = Math.max(last.bottomY, line.bottomY);
            last.fs = Math.max(last.fs, line.fs);
            last.lastTopY = line.topY;
            if (line.rtl || isRtlText(line.text)) last.rtl = true;
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
          text: line.text,
          x: line.x,
          y: line.topY,
          w: line.w,
          h: line.bottomY - line.topY,
          fs: line.fs,
          rtl: line.rtl,
          bottomY: line.bottomY,
          fontFamily: line.fontFamily,
          fontWeight: line.fontWeight,
          fontStyle: line.fontStyle,
          color: line.color,
          lastTopY: line.topY,
          topGaps: [],
          fss: [line.fs],
        });
      }

      // ── Convert blocks → SlideElements ────────────────────────────────────
      return blocks.map((b, bi) => {
        const avgFs =
          b.fss.reduce((s, v) => s + v, 0) / b.fss.length;
        const lineHeight =
          b.topGaps.length > 0
            ? Math.max(
                1.0,
                Math.min(
                  2.6,
                  (b.topGaps.reduce((s, v) => s + v, 0) /
                    b.topGaps.length) /
                    avgFs,
                ),
              )
            : 1.15;

        // Widen boxes; RTL blocks grow leftward (right edge stays anchored)
        const padW = Math.max(24, Math.round(b.w * scale * 0.3));
        let ex = Math.round(b.x * scale - 3);
        let ew = Math.ceil(b.w * scale + 10);
        if (b.rtl) {
          const extra = Math.min(padW, Math.max(0, ex - 6));
          ex -= extra;
          ew += extra;
        } else {
          ew += Math.min(
            padW,
            Math.max(0, CANVAS_W - 6 - (ex + ew)),
          );
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
    },
    [],
  );

  return { buildTextElements };
};
