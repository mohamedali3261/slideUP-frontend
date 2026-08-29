import { SlideElement } from '@/data/templates';

// ─── Font weight inference ────────────────────────────────────────────────────
export const inferFontWeight = (name: string): SlideElement['fontWeight'] => {
  if (/black|heavy|extrabold|ultra/i.test(name)) return 'extrabold';
  if (/bold|black/i.test(name)) return 'bold';
  if (/semibold|demi/i.test(name)) return 'semibold';
  if (/medium/i.test(name)) return 'medium';
  if (/light|thin|hairline/i.test(name)) return 'light';
  return 'normal';
};

// ─── Matrix helpers ───────────────────────────────────────────────────────────
export const matMul = (m: number[], n: number[]): number[] => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];

export const matApply = (m: number[], x: number, y: number): [number, number] => [
  m[0] * x + m[2] * y + m[4],
  m[1] * x + m[3] * y + m[5],
];

/** pdf.js 6 often stores matrices as Float32Array, not a normal Array. */
export const asMat = (args: any): number[] | null => {
  if (!args || args.length < 6) return null;
  const m = [
    Number(args[0]), Number(args[1]),
    Number(args[2]), Number(args[3]),
    Number(args[4]), Number(args[5]),
  ];
  return m.every(Number.isFinite) ? m : null;
};

// ─── Color helpers ────────────────────────────────────────────────────────────
export const clampByte = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

export const rgbToHex = (r: number, g: number, b: number) =>
  '#' + [clampByte(r), clampByte(g), clampByte(b)]
    .map(v => v.toString(16).padStart(2, '0'))
    .join('');

export const parseOpColor = (args: any): string | null => {
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

/** pdf.js v6 sends colors as a single "#rrggbb" string argument; keep a numeric fallback */
export const parseColorArgs = (args: any[]): string | null => {
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

// ─── RTL detection ────────────────────────────────────────────────────────────
/** Full RTL Unicode ranges: Arabic, Hebrew, Syriac, Thaana, etc. */
export const RTL_RE = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u07C0-\u07FF\u0800-\u083F\u08A0-\u08FF\uFB1D-\uFB4F\uFB50-\uFDFF\uFE70-\uFEFF]/;

export const isRtlText = (s: string) => RTL_RE.test(s);

// ─── Unicode cleanup for PDF-extracted text ───────────────────────────────────

/**
 * Arabic Presentation Forms → Arabic Basic codepoint map.
 * Covers FB50–FDFF (Presentation Forms-A) and FE70–FEFF (Presentation Forms-B).
 * These are the "shaped" forms PDF fonts often store as individual glyphs.
 */
const ARABIC_PRES_TO_BASE: Record<number, number> = {
  // Alef forms
  0xFE8D: 0x0627, 0xFE8E: 0x0627, // ALEF
  0xFE8F: 0x0628, 0xFE90: 0x0628, 0xFE91: 0x0628, 0xFE92: 0x0628, // BA
  0xFE93: 0x062A, 0xFE94: 0x062A, // TA (wrong – correct below)
  0xFE95: 0x062A, 0xFE96: 0x062A, 0xFE97: 0x062A, 0xFE98: 0x062A, // TA
  0xFE99: 0x062B, 0xFE9A: 0x062B, 0xFE9B: 0x062B, 0xFE9C: 0x062B, // THA
  0xFE9D: 0x062C, 0xFE9E: 0x062C, 0xFE9F: 0x062C, 0xFEA0: 0x062C, // JIM
  0xFEA1: 0x062D, 0xFEA2: 0x062D, 0xFEA3: 0x062D, 0xFEA4: 0x062D, // HA
  0xFEA5: 0x062E, 0xFEA6: 0x062E, 0xFEA7: 0x062E, 0xFEA8: 0x062E, // KHA
  0xFEA9: 0x062F, 0xFEAA: 0x062F, // DAL
  0xFEAB: 0x0630, 0xFEAC: 0x0630, // THAL
  0xFEAD: 0x0631, 0xFEAE: 0x0631, // RA
  0xFEAF: 0x0632, 0xFEB0: 0x0632, // ZAYN
  0xFEB1: 0x0633, 0xFEB2: 0x0633, 0xFEB3: 0x0633, 0xFEB4: 0x0633, // SIN
  0xFEB5: 0x0634, 0xFEB6: 0x0634, 0xFEB7: 0x0634, 0xFEB8: 0x0634, // SHIN
  0xFEB9: 0x0635, 0xFEBA: 0x0635, 0xFEBB: 0x0635, 0xFEBC: 0x0635, // SAD
  0xFEBD: 0x0636, 0xFEBE: 0x0636, 0xFEBF: 0x0636, 0xFEC0: 0x0636, // DAD
  0xFEC1: 0x0637, 0xFEC2: 0x0637, 0xFEC3: 0x0637, 0xFEC4: 0x0637, // TA
  0xFEC5: 0x0638, 0xFEC6: 0x0638, 0xFEC7: 0x0638, 0xFEC8: 0x0638, // ZA
  0xFEC9: 0x0639, 0xFECA: 0x0639, 0xFECB: 0x0639, 0xFECC: 0x0639, // AIN
  0xFECD: 0x063A, 0xFECE: 0x063A, 0xFECF: 0x063A, 0xFED0: 0x063A, // GHAIN
  0xFED1: 0x0641, 0xFED2: 0x0641, 0xFED3: 0x0641, 0xFED4: 0x0641, // FA
  0xFED5: 0x0642, 0xFED6: 0x0642, 0xFED7: 0x0642, 0xFED8: 0x0642, // QAF
  0xFED9: 0x0643, 0xFEDA: 0x0643, 0xFEDB: 0x0643, 0xFEDC: 0x0643, // KAF
  0xFEDD: 0x0644, 0xFEDE: 0x0644, 0xFEDF: 0x0644, 0xFEE0: 0x0644, // LAM
  0xFEE1: 0x0645, 0xFEE2: 0x0645, 0xFEE3: 0x0645, 0xFEE4: 0x0645, // MIM
  0xFEE5: 0x0646, 0xFEE6: 0x0646, 0xFEE7: 0x0646, 0xFEE8: 0x0646, // NUN
  0xFEE9: 0x0647, 0xFEEA: 0x0647, 0xFEEB: 0x0647, 0xFEEC: 0x0647, // HA
  0xFEED: 0x0648, 0xFEEE: 0x0648, // WAW
  0xFEEF: 0x0649, 0xFEF0: 0x0649, // ALEF MAKSURA
  0xFEF1: 0x064A, 0xFEF2: 0x064A, 0xFEF3: 0x064A, 0xFEF4: 0x064A, // YA
  // Lam-Alef ligatures
  0xFEF5: 0x0644, 0xFEF6: 0x0644, 0xFEF7: 0x0644, 0xFEF8: 0x0644,
  0xFEF9: 0x0644, 0xFEFA: 0x0644, 0xFEFB: 0x0644, 0xFEFC: 0x0644,
  // FB50 range (isolated/final forms)
  0xFB50: 0x0671, 0xFB51: 0x0671, // ALEF WASLA
  0xFB52: 0x067B, 0xFB53: 0x067B, 0xFB54: 0x067B, 0xFB55: 0x067B, // BEEH
  0xFB56: 0x067E, 0xFB57: 0x067E, 0xFB58: 0x067E, 0xFB59: 0x067E, // PEH
  0xFB5A: 0x0680, 0xFB5B: 0x0680, 0xFB5C: 0x0680, 0xFB5D: 0x0680,
  0xFB5E: 0x067A, 0xFB5F: 0x067A, 0xFB60: 0x067A, 0xFB61: 0x067A,
  0xFB62: 0x067F, 0xFB63: 0x067F, 0xFB64: 0x067F, 0xFB65: 0x067F,
  0xFB66: 0x0679, 0xFB67: 0x0679, 0xFB68: 0x0679, 0xFB69: 0x0679,
  0xFB6A: 0x06A4, 0xFB6B: 0x06A4, 0xFB6C: 0x06A4, 0xFB6D: 0x06A4, // VEH
  0xFB6E: 0x06A6, 0xFB6F: 0x06A6, 0xFB70: 0x06A6, 0xFB71: 0x06A6,
  0xFB72: 0x0684, 0xFB73: 0x0684, 0xFB74: 0x0684, 0xFB75: 0x0684,
  0xFB76: 0x0683, 0xFB77: 0x0683, 0xFB78: 0x0683, 0xFB79: 0x0683,
  0xFB7A: 0x0686, 0xFB7B: 0x0686, 0xFB7C: 0x0686, 0xFB7D: 0x0686, // CHEH
  0xFB7E: 0x0687, 0xFB7F: 0x0687, 0xFB80: 0x0687, 0xFB81: 0x0687,
  0xFB82: 0x068D, 0xFB83: 0x068D,
  0xFB84: 0x068C, 0xFB85: 0x068C,
  0xFB86: 0x068E, 0xFB87: 0x068E,
  0xFB88: 0x0688, 0xFB89: 0x0688, // DDAL
  0xFB8A: 0x0698, 0xFB8B: 0x0698, // JEH
  0xFB8C: 0x0691, 0xFB8D: 0x0691, // RREH
  0xFB8E: 0x06A9, 0xFB8F: 0x06A9, 0xFB90: 0x06A9, 0xFB91: 0x06A9, // KEHEH
  0xFB92: 0x06AF, 0xFB93: 0x06AF, 0xFB94: 0x06AF, 0xFB95: 0x06AF, // GAF
  0xFB96: 0x06B3, 0xFB97: 0x06B3, 0xFB98: 0x06B3, 0xFB99: 0x06B3,
  0xFB9A: 0x06B1, 0xFB9B: 0x06B1, 0xFB9C: 0x06B1, 0xFB9D: 0x06B1,
  0xFB9E: 0x06BA, 0xFB9F: 0x06BA, // NOON GHUNNA
  0xFBA0: 0x06BB, 0xFBA1: 0x06BB, 0xFBA2: 0x06BB, 0xFBA3: 0x06BB,
  0xFBA4: 0x06C0, 0xFBA5: 0x06C0,
  0xFBA6: 0x06C1, 0xFBA7: 0x06C1, 0xFBA8: 0x06C1, 0xFBA9: 0x06C1,
  0xFBAA: 0x06BE, 0xFBAB: 0x06BE, 0xFBAC: 0x06BE, 0xFBAD: 0x06BE,
  0xFBAE: 0x06D2, 0xFBAF: 0x06D2, // YEH BARREE
  0xFBB0: 0x06D3, 0xFBB1: 0x06D3,
  // Tashkeel / diacritics (FE70–FE7F)
  0xFE70: 0x064B, 0xFE71: 0x064B, // FATHATAN
  0xFE72: 0x064C, // DAMMATAN
  0xFE74: 0x064D, // KASRATAN
  0xFE76: 0x064E, 0xFE77: 0x064E, // FATHA
  0xFE78: 0x064F, 0xFE79: 0x064F, // DAMMA
  0xFE7A: 0x0650, 0xFE7B: 0x0650, // KASRA
  0xFE7C: 0x0651, 0xFE7D: 0x0651, // SHADDA
  0xFE7E: 0x0652, 0xFE7F: 0x0652, // SUKUN
};

/**
 * Normalize a PDF-extracted string:
 * 1. Replace Arabic Presentation Form codepoints with their base Unicode.
 * 2. Strip unmapped glyphs (replacement char U+FFFD and □ U+25A1, etc.)
 *    that appear when the font has no ToUnicode entry for that glyph.
 * 3. Collapse runs of whitespace.
 */
export const normalizePdfText = (str: string): string => {
  let out = '';
  for (const ch of str) {
    const cp = ch.codePointAt(0)!;

    // Replace Arabic Presentation Forms with base chars
    if (cp >= 0xFB50 && cp <= 0xFEFF) {
      const base = ARABIC_PRES_TO_BASE[cp];
      if (base) { out += String.fromCodePoint(base); continue; }
      // If not in our map but still in Arabic block, keep as-is (valid Arabic)
      if (cp >= 0xFE70 && cp <= 0xFEFF) { out += ch; continue; }
    }

    // Drop known "unmapped glyph" placeholders
    if (
      cp === 0xFFFD ||   // Unicode replacement character
      cp === 0x25A1 ||   // □ WHITE SQUARE
      cp === 0x25A0 ||   // ■ BLACK SQUARE
      cp === 0x0000 ||   // NULL
      (cp >= 0xE000 && cp <= 0xF8FF) // Private Use Area (font-specific glyphs)
    ) continue;

    out += ch;
  }
  // Collapse multiple spaces
  return out.replace(/\s+/g, ' ').trim();
};
