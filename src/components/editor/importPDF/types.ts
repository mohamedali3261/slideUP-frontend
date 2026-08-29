import { SlideElement } from '@/data/templates';

// ─── Constants ───────────────────────────────────────────────────────────────
export const CANVAS_W = 960;
export const RENDER_QUALITY = 2;
export const JPEG_QUALITY = 0.85;
export const MAX_PAGES = 100;
export const MAX_SHAPES_PER_PAGE = 400;
export const MAX_IMAGES_PER_PAGE = 80;

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface ImportPDFProps {
  onImport: (slides: import('@/data/templates').SlideTemplate[], title: string, size: { width: number; height: number }) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  initialFile?: File | null;
}

export interface ImportStatus {
  stage: 'idle' | 'reading' | 'rendering' | 'done' | 'error';
  progress: number;
  message: string;
}

export interface RawTextItem {
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
  fontRef?: string;
  /** true = came from getTextContent (logical/visual LTR order in stream) */
  fromGetTextContent?: boolean;
}

export interface TextLine {
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

export interface FontRegistry {
  families: Map<string, string>;
  names: Map<string, string>;
  registered: Set<string>;
  colors: Map<string, string>;
}
