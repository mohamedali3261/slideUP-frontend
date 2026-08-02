// Decorative Patterns Library
// Contains all pattern definitions for the DecorativeLibrary component

// Types
export interface DecorationConfig {
  color1: string;
  color2: string;
  useGradient: boolean;
  opacity: number;
  scale: number;
  rotation: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'full';
  blur: number;
  shadow: boolean;
  glow: boolean;
}

export interface DecorationElement {
  type: 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  shapeType: 'circle' | 'rectangle';
  backgroundColor: string;
  borderRadius?: number;
  rotation?: number;
  opacity?: number;
  blur?: number;
  zIndex: number;
}

export interface DecorativePattern {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  generate: (config: DecorationConfig, canvasW: number, canvasH: number) => DecorationElement[];
}

// Helper to create color with opacity
export const colorWithOpacity = (hex: string, opacity: number): string => {
  const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return hex + alpha;
};


// ============================================
// MODERN PATTERNS
// ============================================

const modernPatterns: DecorativePattern[] = [
  {
    id: 'floating-circles',
    name: 'Floating Circles',
    nameAr: 'دوائر عائمة',
    category: 'modern',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      return [
        { type: 'shape', x: -80 * s, y: -80 * s, width: 280 * s, height: 280 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.18), zIndex: 0 },
        { type: 'shape', x: cw - 180 * s, y: ch - 180 * s, width: 160 * s, height: 160 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.15), zIndex: 0 },
        { type: 'shape', x: cw - 100 * s, y: 20 * s, width: 80 * s, height: 80 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.12), zIndex: 0 },
        { type: 'shape', x: 60 * s, y: ch - 100 * s, width: 60 * s, height: 60 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.1), zIndex: 0 },
      ];
    },
  },
  {
    id: 'corner-gradient',
    name: 'Corner Accent',
    nameAr: 'زاوية مميزة',
    category: 'modern',
    generate: (config, cw, ch) => {
      const { color1, color2, useGradient, opacity, scale } = config;
      const s = scale / 100;
      const c = useGradient ? color2 : color1;
      return [
        { type: 'shape', x: -100 * s, y: -100 * s, width: 350 * s, height: 350 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.2), zIndex: 0 },
        { type: 'shape', x: -50 * s, y: -50 * s, width: 200 * s, height: 200 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c, opacity * 0.15), zIndex: 0 },
      ];
    },
  },
  {
    id: 'side-accent',
    name: 'Side Accent Bar',
    nameAr: 'شريط جانبي',
    category: 'modern',
    generate: (config, cw, ch) => {
      const { color1, opacity } = config;
      return [
        { type: 'shape', x: 0, y: 0, width: 8, height: ch, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity), borderRadius: 0, zIndex: 0 },
        { type: 'shape', x: 14, y: ch * 0.2, width: 4, height: ch * 0.6, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.4), borderRadius: 2, zIndex: 0 },
      ];
    },
  },

  {
    id: 'bottom-wave',
    name: 'Bottom Layers',
    nameAr: 'طبقات سفلية',
    category: 'modern',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      return [
        { type: 'shape', x: 0, y: ch - 80 * s, width: cw, height: 80 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.08), borderRadius: 0, zIndex: 0 },
        { type: 'shape', x: 0, y: ch - 50 * s, width: cw, height: 50 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.05), borderRadius: 0, zIndex: 0 },
      ];
    },
  },
  {
    id: 'dual-corners',
    name: 'Dual Corners',
    nameAr: 'زوايا مزدوجة',
    category: 'modern',
    generate: (config, cw, ch) => {
      const { color1, color2, useGradient, opacity, scale } = config;
      const s = scale / 100;
      const c2 = useGradient ? color2 : color1;
      return [
        { type: 'shape', x: -60 * s, y: -60 * s, width: 200 * s, height: 200 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.2), zIndex: 0 },
        { type: 'shape', x: cw - 140 * s, y: ch - 140 * s, width: 200 * s, height: 200 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c2, opacity * 0.2), zIndex: 0 },
      ];
    },
  },
  {
    id: 'floating-squares',
    name: 'Floating Squares',
    nameAr: 'مربعات عائمة',
    category: 'modern',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      return [
        { type: 'shape', x: 30 * s, y: 30 * s, width: 100 * s, height: 100 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.15), borderRadius: 12, rotation: 15, zIndex: 0 },
        { type: 'shape', x: cw - 130 * s, y: 50 * s, width: 80 * s, height: 80 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.12), borderRadius: 10, rotation: -10, zIndex: 0 },
        { type: 'shape', x: cw - 100 * s, y: ch - 120 * s, width: 70 * s, height: 70 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.1), borderRadius: 8, rotation: 20, zIndex: 0 },
        { type: 'shape', x: 50 * s, y: ch - 100 * s, width: 60 * s, height: 60 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.08), borderRadius: 8, rotation: -15, zIndex: 0 },
      ];
    },
  },
  {
    id: 'gradient-blob',
    name: 'Gradient Blob',
    nameAr: 'فقاعة متدرجة',
    category: 'modern',
    generate: (config, cw, ch) => {
      const { color1, color2, useGradient, opacity, scale } = config;
      const s = scale / 100;
      const c2 = useGradient ? color2 : '#ec4899';
      return [
        { type: 'shape', x: cw / 2 - 250 * s, y: -100 * s, width: 500 * s, height: 300 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.12), zIndex: 0 },
        { type: 'shape', x: cw / 2 - 200 * s, y: -50 * s, width: 400 * s, height: 200 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c2, opacity * 0.08), zIndex: 0 },
      ];
    },
  },
];


// ============================================
// MINIMAL PATTERNS
// ============================================

const minimalPatterns: DecorativePattern[] = [
  {
    id: 'simple-line',
    name: 'Simple Line',
    nameAr: 'خط بسيط',
    category: 'minimal',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      const lineW = 600 * s;
      return [
        { type: 'shape', x: (cw - lineW) / 2, y: ch - 60, width: lineW, height: 4, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity), borderRadius: 2, zIndex: 0 },
      ];
    },
  },
  {
    id: 'corner-dots',
    name: 'Corner Dots',
    nameAr: 'نقاط الزاوية',
    category: 'minimal',
    generate: (config, cw) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      const dots: DecorationElement[] = [];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          dots.push({
            type: 'shape', x: cw - 100 + col * 28 * s, y: 25 + row * 28 * s, width: 10 * s, height: 10 * s,
            shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.5), borderRadius: 9999, zIndex: 0,
          });
        }
      }
      return dots;
    },
  },
  {
    id: 'frame-border',
    name: 'Simple Frame',
    nameAr: 'إطار بسيط',
    category: 'minimal',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      const m = 30 * s;
      const t = 3;
      return [
        { type: 'shape', x: m, y: m, width: cw - m * 2, height: t, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.3), borderRadius: 0, zIndex: 0 },
        { type: 'shape', x: m, y: ch - m - t, width: cw - m * 2, height: t, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.3), borderRadius: 0, zIndex: 0 },
        { type: 'shape', x: m, y: m, width: t, height: ch - m * 2, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.3), borderRadius: 0, zIndex: 0 },
        { type: 'shape', x: cw - m - t, y: m, width: t, height: ch - m * 2, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.3), borderRadius: 0, zIndex: 0 },
      ];
    },
  },

  {
    id: 'dual-lines',
    name: 'Dual Lines',
    nameAr: 'خطان متوازيان',
    category: 'minimal',
    generate: (config, cw, ch) => {
      const { color1, opacity } = config;
      return [
        { type: 'shape', x: 60, y: ch - 80, width: cw - 120, height: 3, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.6), borderRadius: 2, zIndex: 0 },
        { type: 'shape', x: 100, y: ch - 65, width: cw - 200, height: 2, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.3), borderRadius: 1, zIndex: 0 },
      ];
    },
  },
  {
    id: 'corner-accent',
    name: 'Corner Accent',
    nameAr: 'زاوية بسيطة',
    category: 'minimal',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      return [
        { type: 'shape', x: 20, y: 20, width: 80 * s, height: 4, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity), borderRadius: 2, zIndex: 0 },
        { type: 'shape', x: 20, y: 20, width: 4, height: 80 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity), borderRadius: 2, zIndex: 0 },
        { type: 'shape', x: cw - 100 * s, y: ch - 24, width: 80 * s, height: 4, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity), borderRadius: 2, zIndex: 0 },
        { type: 'shape', x: cw - 24, y: ch - 100 * s, width: 4, height: 80 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity), borderRadius: 2, zIndex: 0 },
      ];
    },
  },
  {
    id: 'dot-line',
    name: 'Dot Line',
    nameAr: 'خط منقط',
    category: 'minimal',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      const dots: DecorationElement[] = [];
      const dotCount = 15;
      const spacing = (cw - 200) / dotCount;
      for (let i = 0; i < dotCount; i++) {
        dots.push({
          type: 'shape', x: 100 + i * spacing, y: ch - 50, width: 8 * s, height: 8 * s,
          shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.5), zIndex: 0,
        });
      }
      return dots;
    },
  },
  {
    id: 'single-circle',
    name: 'Single Circle',
    nameAr: 'دائرة واحدة',
    category: 'minimal',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      return [
        { type: 'shape', x: cw - 150 * s, y: ch - 150 * s, width: 200 * s, height: 200 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.1), zIndex: 0 },
      ];
    },
  },
];


// ============================================
// CREATIVE PATTERNS
// ============================================

const creativePatterns: DecorativePattern[] = [
  {
    id: 'organic-blobs',
    name: 'Organic Blobs',
    nameAr: 'أشكال عضوية',
    category: 'creative',
    generate: (config, cw, ch) => {
      const { color1, color2, useGradient, opacity, scale } = config;
      const s = scale / 100;
      const c2 = useGradient ? color2 : '#ec4899';
      const c3 = useGradient ? color1 : '#14b8a6';
      return [
        { type: 'shape', x: -80 * s, y: -50 * s, width: 280 * s, height: 220 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.15), rotation: -15, zIndex: 0 },
        { type: 'shape', x: cw - 220 * s, y: ch - 200 * s, width: 200 * s, height: 160 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c2, opacity * 0.12), rotation: 20, zIndex: 0 },
        { type: 'shape', x: cw - 150 * s, y: 20 * s, width: 120 * s, height: 100 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c3, opacity * 0.1), rotation: 10, zIndex: 0 },
      ];
    },
  },
  {
    id: 'scattered-shapes',
    name: 'Scattered Shapes',
    nameAr: 'أشكال متناثرة',
    category: 'creative',
    generate: (config, cw, ch) => {
      const { color1, color2, useGradient, opacity, scale } = config;
      const s = scale / 100;
      const c2 = useGradient ? color2 : '#ec4899';
      return [
        { type: 'shape', x: 40 * s, y: 40 * s, width: 50 * s, height: 50 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.2), borderRadius: 8, rotation: 15, zIndex: 0 },
        { type: 'shape', x: cw - 80 * s, y: 50 * s, width: 45 * s, height: 45 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c2, opacity * 0.18), zIndex: 0 },
        { type: 'shape', x: cw - 100 * s, y: ch - 100 * s, width: 60 * s, height: 60 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.15), borderRadius: 8, rotation: -10, zIndex: 0 },
        { type: 'shape', x: 60 * s, y: ch - 80 * s, width: 35 * s, height: 35 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c2, opacity * 0.12), zIndex: 0 },
      ];
    },
  },
  {
    id: 'gradient-mesh',
    name: 'Gradient Mesh',
    nameAr: 'شبكة متدرجة',
    category: 'creative',
    generate: (config, cw, ch) => {
      const { color1, color2, useGradient, opacity, scale } = config;
      const s = scale / 100;
      const c2 = useGradient ? color2 : '#ec4899';
      const c3 = '#14b8a6';
      return [
        { type: 'shape', x: -100 * s, y: ch / 2 - 150 * s, width: 350 * s, height: 350 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.12), zIndex: 0 },
        { type: 'shape', x: cw - 250 * s, y: ch / 2 - 200 * s, width: 400 * s, height: 400 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c2, opacity * 0.1), zIndex: 0 },
        { type: 'shape', x: cw / 2 - 150 * s, y: ch - 200 * s, width: 300 * s, height: 300 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c3, opacity * 0.08), zIndex: 0 },
      ];
    },
  },

  {
    id: 'confetti',
    name: 'Confetti',
    nameAr: 'قصاصات',
    category: 'creative',
    generate: (config, cw, ch) => {
      const { color1, color2, useGradient, opacity, scale } = config;
      const s = scale / 100;
      const colors = [color1, useGradient ? color2 : '#ec4899', '#14b8a6', '#f97316'];
      const elements: DecorationElement[] = [];
      const positions = [
        { x: 50, y: 30, w: 20, h: 20, r: 15 },
        { x: 150, y: 60, w: 15, h: 15, r: -20 },
        { x: cw - 80, y: 40, w: 18, h: 18, r: 30 },
        { x: cw - 150, y: 80, w: 12, h: 12, r: -10 },
        { x: 80, y: ch - 60, w: 16, h: 16, r: 25 },
        { x: cw - 100, y: ch - 80, w: 14, h: 14, r: -15 },
      ];
      positions.forEach((p, i) => {
        elements.push({
          type: 'shape', x: p.x * s, y: p.y, width: p.w * s, height: p.h * s,
          shapeType: i % 2 === 0 ? 'rectangle' : 'circle',
          backgroundColor: colorWithOpacity(colors[i % colors.length], opacity * 0.4),
          borderRadius: i % 2 === 0 ? 4 : 9999, rotation: p.r, zIndex: 0,
        });
      });
      return elements;
    },
  },
  {
    id: 'bubble-cluster',
    name: 'Bubble Cluster',
    nameAr: 'تجمع فقاعات',
    category: 'creative',
    generate: (config, cw, ch) => {
      const { color1, color2, useGradient, opacity, scale } = config;
      const s = scale / 100;
      const c2 = useGradient ? color2 : '#ec4899';
      return [
        { type: 'shape', x: cw - 200 * s, y: 30 * s, width: 120 * s, height: 120 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.15), zIndex: 0 },
        { type: 'shape', x: cw - 120 * s, y: 80 * s, width: 80 * s, height: 80 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c2, opacity * 0.12), zIndex: 0 },
        { type: 'shape', x: cw - 160 * s, y: 130 * s, width: 50 * s, height: 50 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.1), zIndex: 0 },
        { type: 'shape', x: cw - 80 * s, y: 150 * s, width: 35 * s, height: 35 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c2, opacity * 0.08), zIndex: 0 },
      ];
    },
  },
  {
    id: 'wave-pattern',
    name: 'Wave Pattern',
    nameAr: 'نمط موجي',
    category: 'creative',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      const elements: DecorationElement[] = [];
      for (let i = 0; i < 5; i++) {
        elements.push({
          type: 'shape', x: -50 + i * 250 * s, y: ch - 100 * s + Math.sin(i) * 30, width: 200 * s, height: 150 * s,
          shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * (0.08 - i * 0.01)), zIndex: 0,
        });
      }
      return elements;
    },
  },
  {
    id: 'abstract-shapes',
    name: 'Abstract Shapes',
    nameAr: 'أشكال تجريدية',
    category: 'creative',
    generate: (config, cw, ch) => {
      const { color1, color2, useGradient, opacity, scale } = config;
      const s = scale / 100;
      const c2 = useGradient ? color2 : '#f97316';
      return [
        { type: 'shape', x: 20 * s, y: 20 * s, width: 150 * s, height: 80 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.15), borderRadius: 40, rotation: -5, zIndex: 0 },
        { type: 'shape', x: cw - 180 * s, y: 40 * s, width: 100 * s, height: 100 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c2, opacity * 0.12), zIndex: 0 },
        { type: 'shape', x: cw / 2 - 60 * s, y: ch - 100 * s, width: 120 * s, height: 60 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.1), borderRadius: 30, rotation: 5, zIndex: 0 },
      ];
    },
  },
];


// ============================================
// CORPORATE PATTERNS
// ============================================

const corporatePatterns: DecorativePattern[] = [
  {
    id: 'header-bar',
    name: 'Header Bar',
    nameAr: 'شريط علوي',
    category: 'corporate',
    generate: (config, cw) => {
      const { color1, opacity } = config;
      return [
        { type: 'shape', x: 0, y: 0, width: cw, height: 70, shapeType: 'rectangle', backgroundColor: colorWithOpacity('#1f2937', opacity * 0.06), borderRadius: 0, zIndex: 0 },
        { type: 'shape', x: 0, y: 70, width: cw, height: 4, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity), borderRadius: 0, zIndex: 0 },
      ];
    },
  },
  {
    id: 'footer-section',
    name: 'Footer Section',
    nameAr: 'قسم سفلي',
    category: 'corporate',
    generate: (config, cw, ch) => {
      const { color1, opacity } = config;
      return [
        { type: 'shape', x: 0, y: ch - 50, width: cw, height: 50, shapeType: 'rectangle', backgroundColor: colorWithOpacity('#1f2937', opacity * 0.05), borderRadius: 0, zIndex: 0 },
        { type: 'shape', x: 0, y: ch - 54, width: cw, height: 4, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.5), borderRadius: 0, zIndex: 0 },
      ];
    },
  },
  {
    id: 'sidebar-panel',
    name: 'Sidebar Panel',
    nameAr: 'لوحة جانبية',
    category: 'corporate',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      const w = 280 * s;
      return [
        { type: 'shape', x: 0, y: 0, width: w, height: ch, shapeType: 'rectangle', backgroundColor: colorWithOpacity('#1f2937', opacity * 0.04), borderRadius: 0, zIndex: 0 },
        { type: 'shape', x: w, y: 0, width: 3, height: ch, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.25), borderRadius: 0, zIndex: 0 },
      ];
    },
  },
  {
    id: 'grid-lines',
    name: 'Subtle Grid',
    nameAr: 'شبكة خفيفة',
    category: 'corporate',
    generate: (config, cw, ch) => {
      const { color1, opacity } = config;
      const elements: DecorationElement[] = [];
      for (let i = 1; i < 5; i++) {
        elements.push({ type: 'shape', x: (cw / 5) * i, y: 0, width: 1, height: ch, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.08), borderRadius: 0, zIndex: 0 });
      }
      for (let i = 1; i < 4; i++) {
        elements.push({ type: 'shape', x: 0, y: (ch / 4) * i, width: cw, height: 1, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.08), borderRadius: 0, zIndex: 0 });
      }
      return elements;
    },
  },

  {
    id: 'header-footer',
    name: 'Header & Footer',
    nameAr: 'رأس وتذييل',
    category: 'corporate',
    generate: (config, cw, ch) => {
      const { color1, opacity } = config;
      return [
        { type: 'shape', x: 0, y: 0, width: cw, height: 60, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.08), borderRadius: 0, zIndex: 0 },
        { type: 'shape', x: 0, y: ch - 40, width: cw, height: 40, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.05), borderRadius: 0, zIndex: 0 },
      ];
    },
  },
  {
    id: 'left-stripe',
    name: 'Left Stripe',
    nameAr: 'شريط يساري',
    category: 'corporate',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      return [
        { type: 'shape', x: 0, y: 0, width: 12 * s, height: ch, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity), borderRadius: 0, zIndex: 0 },
      ];
    },
  },
  {
    id: 'corner-badge',
    name: 'Corner Badge',
    nameAr: 'شارة الزاوية',
    category: 'corporate',
    generate: (config, cw) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      return [
        { type: 'shape', x: -50 * s, y: -50 * s, width: 150 * s, height: 150 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.15), borderRadius: 0, rotation: 45, zIndex: 0 },
      ];
    },
  },
  {
    id: 'split-background',
    name: 'Split Background',
    nameAr: 'خلفية مقسمة',
    category: 'corporate',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      return [
        { type: 'shape', x: 0, y: 0, width: cw * 0.35 * s, height: ch, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.08), borderRadius: 0, zIndex: 0 },
      ];
    },
  },
];


// ============================================
// ELEGANT PATTERNS
// ============================================

const elegantPatterns: DecorativePattern[] = [
  {
    id: 'corner-flourish',
    name: 'Corner Flourish',
    nameAr: 'زخرفة الزوايا',
    category: 'elegant',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      const size = 120 * s;
      return [
        { type: 'shape', x: -size / 3, y: -size / 3, width: size, height: size, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.12), zIndex: 0 },
        { type: 'shape', x: cw - size * 0.7, y: -size / 3, width: size, height: size, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.12), zIndex: 0 },
        { type: 'shape', x: -size / 3, y: ch - size * 0.7, width: size, height: size, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.08), zIndex: 0 },
        { type: 'shape', x: cw - size * 0.7, y: ch - size * 0.7, width: size, height: size, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.08), zIndex: 0 },
      ];
    },
  },
  {
    id: 'center-glow',
    name: 'Center Glow',
    nameAr: 'توهج مركزي',
    category: 'elegant',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      return [
        { type: 'shape', x: cw / 2 - 200 * s, y: ch / 2 - 200 * s, width: 400 * s, height: 400 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.08), zIndex: 0 },
        { type: 'shape', x: cw / 2 - 150 * s, y: ch / 2 - 150 * s, width: 300 * s, height: 300 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.05), zIndex: 0 },
      ];
    },
  },
  {
    id: 'elegant-divider',
    name: 'Elegant Divider',
    nameAr: 'فاصل أنيق',
    category: 'elegant',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      const lineW = 250 * s;
      const y = ch / 2;
      return [
        { type: 'shape', x: cw / 2 - lineW - 20, y: y - 2, width: lineW, height: 4, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.6), borderRadius: 2, zIndex: 0 },
        { type: 'shape', x: cw / 2 - 12, y: y - 12, width: 24, height: 24, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.8), zIndex: 0 },
        { type: 'shape', x: cw / 2 + 20, y: y - 2, width: lineW, height: 4, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.6), borderRadius: 2, zIndex: 0 },
      ];
    },
  },
  {
    id: 'soft-vignette',
    name: 'Soft Vignette',
    nameAr: 'تظليل ناعم',
    category: 'elegant',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      return [
        { type: 'shape', x: -200 * s, y: -200 * s, width: 500 * s, height: 500 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.06), zIndex: 0 },
        { type: 'shape', x: cw - 300 * s, y: ch - 300 * s, width: 500 * s, height: 500 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.06), zIndex: 0 },
      ];
    },
  },

  {
    id: 'golden-ratio',
    name: 'Golden Spiral',
    nameAr: 'حلزون ذهبي',
    category: 'elegant',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      return [
        { type: 'shape', x: cw - 300 * s, y: ch - 300 * s, width: 400 * s, height: 400 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.06), zIndex: 0 },
        { type: 'shape', x: cw - 200 * s, y: ch - 200 * s, width: 250 * s, height: 250 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.08), zIndex: 0 },
        { type: 'shape', x: cw - 130 * s, y: ch - 130 * s, width: 150 * s, height: 150 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.1), zIndex: 0 },
      ];
    },
  },
  {
    id: 'luxury-frame',
    name: 'Luxury Frame',
    nameAr: 'إطار فاخر',
    category: 'elegant',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      const m = 40 * s;
      return [
        { type: 'shape', x: m, y: m, width: cw - m * 2, height: 2, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.4), borderRadius: 1, zIndex: 0 },
        { type: 'shape', x: m, y: ch - m - 2, width: cw - m * 2, height: 2, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.4), borderRadius: 1, zIndex: 0 },
        { type: 'shape', x: m, y: m, width: 2, height: ch - m * 2, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.4), borderRadius: 1, zIndex: 0 },
        { type: 'shape', x: cw - m - 2, y: m, width: 2, height: ch - m * 2, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.4), borderRadius: 1, zIndex: 0 },
        { type: 'shape', x: m - 5, y: m - 5, width: 15, height: 15, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.5), zIndex: 0 },
        { type: 'shape', x: cw - m - 10, y: m - 5, width: 15, height: 15, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.5), zIndex: 0 },
        { type: 'shape', x: m - 5, y: ch - m - 10, width: 15, height: 15, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.5), zIndex: 0 },
        { type: 'shape', x: cw - m - 10, y: ch - m - 10, width: 15, height: 15, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.5), zIndex: 0 },
      ];
    },
  },
  {
    id: 'radial-glow',
    name: 'Radial Glow',
    nameAr: 'توهج شعاعي',
    category: 'elegant',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      return [
        { type: 'shape', x: cw / 2 - 300 * s, y: ch / 2 - 300 * s, width: 600 * s, height: 600 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.04), zIndex: 0 },
        { type: 'shape', x: cw / 2 - 200 * s, y: ch / 2 - 200 * s, width: 400 * s, height: 400 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.06), zIndex: 0 },
        { type: 'shape', x: cw / 2 - 100 * s, y: ch / 2 - 100 * s, width: 200 * s, height: 200 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.08), zIndex: 0 },
      ];
    },
  },
];


// ============================================
// TECH PATTERNS
// ============================================

const techPatterns: DecorativePattern[] = [
  {
    id: 'circuit-pattern',
    name: 'Circuit Pattern',
    nameAr: 'نمط دوائر',
    category: 'tech',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      return [
        { type: 'shape', x: 40 * s, y: 40 * s, width: 150 * s, height: 3, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.25), borderRadius: 2, zIndex: 0 },
        { type: 'shape', x: 190 * s, y: 40 * s, width: 3, height: 120 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.25), borderRadius: 2, zIndex: 0 },
        { type: 'shape', x: 183 * s, y: 155 * s, width: 18 * s, height: 18 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.5), zIndex: 0 },
        { type: 'shape', x: cw - 200 * s, y: ch - 60 * s, width: 150 * s, height: 3, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.25), borderRadius: 2, zIndex: 0 },
        { type: 'shape', x: cw - 55 * s, y: ch - 120 * s, width: 3, height: 63 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.25), borderRadius: 2, zIndex: 0 },
        { type: 'shape', x: cw - 62 * s, y: ch - 127 * s, width: 18 * s, height: 18 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.5), zIndex: 0 },
      ];
    },
  },
  {
    id: 'hex-grid',
    name: 'Hex Nodes',
    nameAr: 'عقد سداسية',
    category: 'tech',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      const size = 50 * s;
      return [
        { type: 'shape', x: cw - 100 * s, y: 20 * s, width: size, height: size, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.15), zIndex: 0 },
        { type: 'shape', x: cw - 70 * s, y: 60 * s, width: size, height: size, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.12), zIndex: 0 },
        { type: 'shape', x: cw - 110 * s, y: 100 * s, width: size, height: size, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.1), zIndex: 0 },
        { type: 'shape', x: 30 * s, y: ch - 100 * s, width: size, height: size, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.15), zIndex: 0 },
        { type: 'shape', x: 70 * s, y: ch - 60 * s, width: size, height: size, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.12), zIndex: 0 },
      ];
    },
  },
  {
    id: 'data-lines',
    name: 'Data Flow Lines',
    nameAr: 'خطوط البيانات',
    category: 'tech',
    generate: (config, cw, ch) => {
      const { color1, opacity } = config;
      const elements: DecorationElement[] = [];
      const gaps = [0.2, 0.4, 0.6, 0.8];
      gaps.forEach((g, i) => {
        elements.push({ type: 'shape', x: 0, y: ch * g, width: cw, height: 1, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * (0.12 - i * 0.02)), borderRadius: 0, zIndex: 0 });
      });
      return elements;
    },
  },

  {
    id: 'binary-dots',
    name: 'Binary Dots',
    nameAr: 'نقاط ثنائية',
    category: 'tech',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      const elements: DecorationElement[] = [];
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
          if ((i + j) % 2 === 0) {
            elements.push({ type: 'shape', x: cw - 100 + i * 20 * s, y: 30 + j * 20 * s, width: 8 * s, height: 8 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.4), zIndex: 0 });
          }
        }
      }
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
          if ((i + j) % 2 === 1) {
            elements.push({ type: 'shape', x: 30 + i * 20 * s, y: ch - 100 + j * 20 * s, width: 8 * s, height: 8 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.35), zIndex: 0 });
          }
        }
      }
      return elements;
    },
  },
  {
    id: 'network-nodes',
    name: 'Network Nodes',
    nameAr: 'عقد الشبكة',
    category: 'tech',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      return [
        { type: 'shape', x: 50 * s, y: 50 * s, width: 20 * s, height: 20 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.6), zIndex: 0 },
        { type: 'shape', x: 150 * s, y: 80 * s, width: 15 * s, height: 15 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.5), zIndex: 0 },
        { type: 'shape', x: 100 * s, y: 150 * s, width: 18 * s, height: 18 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.4), zIndex: 0 },
        { type: 'shape', x: 60 * s, y: 50 * s, width: 90 * s, height: 2, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.2), borderRadius: 1, rotation: 20, zIndex: 0 },
        { type: 'shape', x: 55 * s, y: 60 * s, width: 60 * s, height: 2, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.2), borderRadius: 1, rotation: 60, zIndex: 0 },
        { type: 'shape', x: cw - 100 * s, y: ch - 100 * s, width: 25 * s, height: 25 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.5), zIndex: 0 },
      ];
    },
  },
  {
    id: 'code-brackets',
    name: 'Code Brackets',
    nameAr: 'أقواس برمجية',
    category: 'tech',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      return [
        { type: 'shape', x: 30 * s, y: ch / 2 - 80 * s, width: 8, height: 160 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.3), borderRadius: 4, zIndex: 0 },
        { type: 'shape', x: 30 * s, y: ch / 2 - 80 * s, width: 30 * s, height: 8, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.3), borderRadius: 4, zIndex: 0 },
        { type: 'shape', x: 30 * s, y: ch / 2 + 72 * s, width: 30 * s, height: 8, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.3), borderRadius: 4, zIndex: 0 },
        { type: 'shape', x: cw - 38 * s, y: ch / 2 - 80 * s, width: 8, height: 160 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.3), borderRadius: 4, zIndex: 0 },
        { type: 'shape', x: cw - 60 * s, y: ch / 2 - 80 * s, width: 30 * s, height: 8, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.3), borderRadius: 4, zIndex: 0 },
        { type: 'shape', x: cw - 60 * s, y: ch / 2 + 72 * s, width: 30 * s, height: 8, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.3), borderRadius: 4, zIndex: 0 },
      ];
    },
  },
  {
    id: 'pixel-grid',
    name: 'Pixel Grid',
    nameAr: 'شبكة بكسل',
    category: 'tech',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      const elements: DecorationElement[] = [];
      const size = 12 * s;
      const gap = 16 * s;
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
          if (Math.random() > 0.3) {
            elements.push({ type: 'shape', x: cw - 100 + i * gap, y: 20 + j * gap, width: size, height: size, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * (0.2 + Math.random() * 0.3)), borderRadius: 2, zIndex: 0 });
          }
        }
      }
      return elements;
    },
  },
];


// ============================================
// GEOMETRIC PATTERNS
// ============================================

const geometricPatterns: DecorativePattern[] = [
  {
    id: 'geometric-triangles',
    name: 'Geometric Layers',
    nameAr: 'طبقات هندسية',
    category: 'geometric',
    generate: (config, cw, ch) => {
      const { color1, color2, useGradient, opacity, scale } = config;
      const s = scale / 100;
      const c2 = useGradient ? color2 : color1;
      return [
        { type: 'shape', x: -50 * s, y: ch - 200 * s, width: 300 * s, height: 300 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.1), borderRadius: 0, rotation: 45, zIndex: 0 },
        { type: 'shape', x: cw - 200 * s, y: -100 * s, width: 250 * s, height: 250 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(c2, opacity * 0.08), borderRadius: 0, rotation: 30, zIndex: 0 },
      ];
    },
  },
  {
    id: 'overlapping-circles',
    name: 'Overlapping Circles',
    nameAr: 'دوائر متداخلة',
    category: 'geometric',
    generate: (config, cw, ch) => {
      const { color1, color2, useGradient, opacity, scale } = config;
      const s = scale / 100;
      const c2 = useGradient ? color2 : '#ec4899';
      const size = 200 * s;
      return [
        { type: 'shape', x: cw / 2 - size, y: ch / 2 - size / 2, width: size, height: size, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.15), zIndex: 0 },
        { type: 'shape', x: cw / 2 - size / 2, y: ch / 2 - size / 2, width: size, height: size, shapeType: 'circle', backgroundColor: colorWithOpacity(c2, opacity * 0.12), zIndex: 0 },
        { type: 'shape', x: cw / 2, y: ch / 2 - size / 2, width: size, height: size, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.1), zIndex: 0 },
      ];
    },
  },
  {
    id: 'diamond-pattern',
    name: 'Diamond Pattern',
    nameAr: 'نمط الماس',
    category: 'geometric',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      const size = 80 * s;
      return [
        { type: 'shape', x: 40 * s, y: 40 * s, width: size, height: size, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.15), borderRadius: 8, rotation: 45, zIndex: 0 },
        { type: 'shape', x: cw - 120 * s, y: 60 * s, width: size * 0.7, height: size * 0.7, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.12), borderRadius: 6, rotation: 45, zIndex: 0 },
        { type: 'shape', x: cw - 100 * s, y: ch - 120 * s, width: size * 0.8, height: size * 0.8, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.1), borderRadius: 6, rotation: 45, zIndex: 0 },
        { type: 'shape', x: 60 * s, y: ch - 100 * s, width: size * 0.6, height: size * 0.6, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.08), borderRadius: 4, rotation: 45, zIndex: 0 },
      ];
    },
  },
  {
    id: 'concentric-rings',
    name: 'Concentric Rings',
    nameAr: 'حلقات متحدة المركز',
    category: 'geometric',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      const cx = cw - 150 * s;
      const cy = ch - 150 * s;
      return [
        { type: 'shape', x: cx - 150 * s, y: cy - 150 * s, width: 300 * s, height: 300 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.05), zIndex: 0 },
        { type: 'shape', x: cx - 100 * s, y: cy - 100 * s, width: 200 * s, height: 200 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.08), zIndex: 0 },
        { type: 'shape', x: cx - 50 * s, y: cy - 50 * s, width: 100 * s, height: 100 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.12), zIndex: 0 },
      ];
    },
  },

  {
    id: 'hexagon-cluster',
    name: 'Hexagon Cluster',
    nameAr: 'تجمع سداسي',
    category: 'geometric',
    generate: (config, cw, ch) => {
      const { color1, color2, useGradient, opacity, scale } = config;
      const s = scale / 100;
      const c2 = useGradient ? color2 : color1;
      const size = 60 * s;
      return [
        { type: 'shape', x: cw - 150 * s, y: 30 * s, width: size, height: size, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.15), zIndex: 0 },
        { type: 'shape', x: cw - 100 * s, y: 70 * s, width: size, height: size, shapeType: 'circle', backgroundColor: colorWithOpacity(c2, opacity * 0.12), zIndex: 0 },
        { type: 'shape', x: cw - 130 * s, y: 110 * s, width: size * 0.8, height: size * 0.8, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.1), zIndex: 0 },
        { type: 'shape', x: 40 * s, y: ch - 130 * s, width: size, height: size, shapeType: 'circle', backgroundColor: colorWithOpacity(c2, opacity * 0.12), zIndex: 0 },
        { type: 'shape', x: 90 * s, y: ch - 90 * s, width: size * 0.7, height: size * 0.7, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.1), zIndex: 0 },
      ];
    },
  },
  {
    id: 'triangle-corners',
    name: 'Triangle Corners',
    nameAr: 'زوايا مثلثة',
    category: 'geometric',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      const size = 150 * s;
      return [
        { type: 'shape', x: -size / 2, y: -size / 2, width: size, height: size, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.12), borderRadius: 0, rotation: 45, zIndex: 0 },
        { type: 'shape', x: cw - size / 2, y: ch - size / 2, width: size, height: size, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.12), borderRadius: 0, rotation: 45, zIndex: 0 },
      ];
    },
  },
  {
    id: 'grid-squares',
    name: 'Grid Squares',
    nameAr: 'مربعات شبكية',
    category: 'geometric',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      const elements: DecorationElement[] = [];
      const size = 40 * s;
      const gap = 50 * s;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          elements.push({ type: 'shape', x: cw - 180 + i * gap, y: 30 + j * gap, width: size, height: size, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * (0.08 + (i + j) * 0.02)), borderRadius: 4, zIndex: 0 });
        }
      }
      return elements;
    },
  },
  {
    id: 'stacked-circles',
    name: 'Stacked Circles',
    nameAr: 'دوائر متراصة',
    category: 'geometric',
    generate: (config, cw, ch) => {
      const { color1, color2, useGradient, opacity, scale } = config;
      const s = scale / 100;
      const c2 = useGradient ? color2 : '#14b8a6';
      return [
        { type: 'shape', x: 30 * s, y: ch / 2 - 100 * s, width: 200 * s, height: 200 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.1), zIndex: 0 },
        { type: 'shape', x: 80 * s, y: ch / 2 - 80 * s, width: 160 * s, height: 160 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c2, opacity * 0.08), zIndex: 0 },
        { type: 'shape', x: 120 * s, y: ch / 2 - 60 * s, width: 120 * s, height: 120 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.06), zIndex: 0 },
      ];
    },
  },
];


// ============================================
// NATURE PATTERNS (NEW CATEGORY)
// ============================================

const naturePatterns: DecorativePattern[] = [
  {
    id: 'leaf-scatter',
    name: 'Leaf Scatter',
    nameAr: 'أوراق متناثرة',
    category: 'nature',
    generate: (config, cw, ch) => {
      const { color1, color2, useGradient, opacity, scale } = config;
      const s = scale / 100;
      const c2 = useGradient ? color2 : '#22c55e';
      return [
        { type: 'shape', x: 30 * s, y: 30 * s, width: 60 * s, height: 30 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.15), rotation: -30, zIndex: 0 },
        { type: 'shape', x: cw - 100 * s, y: 50 * s, width: 50 * s, height: 25 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c2, opacity * 0.12), rotation: 20, zIndex: 0 },
        { type: 'shape', x: cw - 80 * s, y: ch - 80 * s, width: 55 * s, height: 28 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.1), rotation: -15, zIndex: 0 },
        { type: 'shape', x: 50 * s, y: ch - 60 * s, width: 45 * s, height: 22 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c2, opacity * 0.08), rotation: 35, zIndex: 0 },
      ];
    },
  },
  {
    id: 'water-drops',
    name: 'Water Drops',
    nameAr: 'قطرات ماء',
    category: 'nature',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      return [
        { type: 'shape', x: cw - 120 * s, y: 40 * s, width: 40 * s, height: 50 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.2), zIndex: 0 },
        { type: 'shape', x: cw - 80 * s, y: 100 * s, width: 30 * s, height: 38 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.15), zIndex: 0 },
        { type: 'shape', x: cw - 140 * s, y: 120 * s, width: 25 * s, height: 32 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.12), zIndex: 0 },
        { type: 'shape', x: 50 * s, y: ch - 100 * s, width: 35 * s, height: 44 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.18), zIndex: 0 },
      ];
    },
  },
  {
    id: 'sun-rays',
    name: 'Sun Rays',
    nameAr: 'أشعة الشمس',
    category: 'nature',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      const elements: DecorationElement[] = [];
      elements.push({ type: 'shape', x: cw - 150 * s, y: -50 * s, width: 200 * s, height: 200 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.15), zIndex: 0 });
      for (let i = 0; i < 6; i++) {
        const angle = (i * 30) * Math.PI / 180;
        elements.push({
          type: 'shape', x: cw - 50 * s + Math.cos(angle) * 80 * s, y: 50 * s + Math.sin(angle) * 80 * s,
          width: 80 * s, height: 8, shapeType: 'rectangle',
          backgroundColor: colorWithOpacity(color1, opacity * 0.1), borderRadius: 4, rotation: i * 30, zIndex: 0,
        });
      }
      return elements;
    },
  },
  {
    id: 'cloud-soft',
    name: 'Soft Clouds',
    nameAr: 'سحب ناعمة',
    category: 'nature',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      return [
        { type: 'shape', x: 50 * s, y: 30 * s, width: 150 * s, height: 60 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.08), zIndex: 0 },
        { type: 'shape', x: 100 * s, y: 20 * s, width: 100 * s, height: 50 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.06), zIndex: 0 },
        { type: 'shape', x: cw - 200 * s, y: 50 * s, width: 120 * s, height: 50 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.07), zIndex: 0 },
        { type: 'shape', x: cw - 150 * s, y: 40 * s, width: 80 * s, height: 40 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.05), zIndex: 0 },
      ];
    },
  },
];


// ============================================
// GRADIENT PATTERNS (NEW CATEGORY)
// ============================================

const gradientPatterns: DecorativePattern[] = [
  {
    id: 'aurora-glow',
    name: 'Aurora Glow',
    nameAr: 'توهج الشفق',
    category: 'gradient',
    generate: (config, cw, ch) => {
      const { color1, color2, useGradient, opacity, scale } = config;
      const s = scale / 100;
      const c2 = useGradient ? color2 : '#14b8a6';
      const c3 = '#ec4899';
      return [
        { type: 'shape', x: -100 * s, y: -50 * s, width: 400 * s, height: 200 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.12), zIndex: 0 },
        { type: 'shape', x: cw / 2 - 150 * s, y: -80 * s, width: 350 * s, height: 180 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c2, opacity * 0.1), zIndex: 0 },
        { type: 'shape', x: cw - 250 * s, y: -30 * s, width: 300 * s, height: 150 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c3, opacity * 0.08), zIndex: 0 },
      ];
    },
  },
  {
    id: 'sunset-blend',
    name: 'Sunset Blend',
    nameAr: 'مزيج الغروب',
    category: 'gradient',
    generate: (config, cw, ch) => {
      const { color1, color2, useGradient, opacity, scale } = config;
      const s = scale / 100;
      const c2 = useGradient ? color2 : '#f97316';
      return [
        { type: 'shape', x: 0, y: ch - 150 * s, width: cw, height: 200 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.1), zIndex: 0 },
        { type: 'shape', x: 0, y: ch - 100 * s, width: cw, height: 150 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c2, opacity * 0.08), zIndex: 0 },
        { type: 'shape', x: 0, y: ch - 50 * s, width: cw, height: 100 * s, shapeType: 'circle', backgroundColor: colorWithOpacity('#eab308', opacity * 0.06), zIndex: 0 },
      ];
    },
  },
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    nameAr: 'توهج نيون',
    category: 'gradient',
    generate: (config, cw, ch) => {
      const { color1, color2, useGradient, opacity, scale } = config;
      const s = scale / 100;
      const c2 = useGradient ? color2 : '#ec4899';
      return [
        { type: 'shape', x: cw / 2 - 200 * s, y: ch / 2 - 150 * s, width: 400 * s, height: 300 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.15), zIndex: 0 },
        { type: 'shape', x: cw / 2 - 150 * s, y: ch / 2 - 100 * s, width: 300 * s, height: 200 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c2, opacity * 0.12), zIndex: 0 },
      ];
    },
  },
  {
    id: 'rainbow-arc',
    name: 'Rainbow Arc',
    nameAr: 'قوس قزح',
    category: 'gradient',
    generate: (config, cw, ch) => {
      const { opacity, scale } = config;
      const s = scale / 100;
      const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
      const elements: DecorationElement[] = [];
      colors.forEach((c, i) => {
        elements.push({
          type: 'shape', x: cw / 2 - (300 - i * 30) * s, y: ch - (150 - i * 20) * s,
          width: (600 - i * 60) * s, height: (300 - i * 40) * s, shapeType: 'circle',
          backgroundColor: colorWithOpacity(c, opacity * 0.08), zIndex: 0,
        });
      });
      return elements;
    },
  },
];


// ============================================
// FESTIVE PATTERNS (NEW CATEGORY)
// ============================================

const festivePatterns: DecorativePattern[] = [
  {
    id: 'party-confetti',
    name: 'Party Confetti',
    nameAr: 'قصاصات احتفالية',
    category: 'festive',
    generate: (config, cw, ch) => {
      const { color1, color2, useGradient, opacity, scale } = config;
      const s = scale / 100;
      const colors = [color1, useGradient ? color2 : '#ec4899', '#14b8a6', '#f97316', '#eab308'];
      const elements: DecorationElement[] = [];
      const positions = [
        { x: 40, y: 30 }, { x: 120, y: 60 }, { x: 200, y: 25 },
        { x: cw - 60, y: 40 }, { x: cw - 140, y: 70 }, { x: cw - 200, y: 35 },
        { x: 60, y: ch - 50 }, { x: 150, y: ch - 70 },
        { x: cw - 80, y: ch - 60 }, { x: cw - 160, y: ch - 40 },
      ];
      positions.forEach((p, i) => {
        elements.push({
          type: 'shape', x: p.x * s, y: p.y, width: (12 + Math.random() * 10) * s, height: (12 + Math.random() * 10) * s,
          shapeType: Math.random() > 0.5 ? 'rectangle' : 'circle',
          backgroundColor: colorWithOpacity(colors[i % colors.length], opacity * 0.5),
          borderRadius: Math.random() > 0.5 ? 2 : 9999, rotation: Math.random() * 45, zIndex: 0,
        });
      });
      return elements;
    },
  },
  {
    id: 'stars-sparkle',
    name: 'Stars Sparkle',
    nameAr: 'نجوم متلألئة',
    category: 'festive',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      const elements: DecorationElement[] = [];
      const positions = [
        { x: 50, y: 40, size: 20 }, { x: 150, y: 80, size: 15 }, { x: cw - 80, y: 50, size: 18 },
        { x: cw - 150, y: 100, size: 12 }, { x: 80, y: ch - 70, size: 16 }, { x: cw - 100, y: ch - 60, size: 14 },
      ];
      positions.forEach((p) => {
        elements.push({ type: 'shape', x: p.x * s, y: p.y, width: p.size * s, height: p.size * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.6), borderRadius: 2, rotation: 45, zIndex: 0 });
      });
      return elements;
    },
  },
  {
    id: 'balloons',
    name: 'Balloons',
    nameAr: 'بالونات',
    category: 'festive',
    generate: (config, cw, ch) => {
      const { color1, color2, useGradient, opacity, scale } = config;
      const s = scale / 100;
      const c2 = useGradient ? color2 : '#ec4899';
      const c3 = '#14b8a6';
      return [
        { type: 'shape', x: 40 * s, y: 30 * s, width: 60 * s, height: 75 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.25), zIndex: 0 },
        { type: 'shape', x: 90 * s, y: 50 * s, width: 50 * s, height: 62 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c2, opacity * 0.22), zIndex: 0 },
        { type: 'shape', x: cw - 100 * s, y: 40 * s, width: 55 * s, height: 68 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(c3, opacity * 0.2), zIndex: 0 },
        { type: 'shape', x: cw - 160 * s, y: 60 * s, width: 45 * s, height: 56 * s, shapeType: 'circle', backgroundColor: colorWithOpacity(color1, opacity * 0.18), zIndex: 0 },
      ];
    },
  },
  {
    id: 'ribbon-banner',
    name: 'Ribbon Banner',
    nameAr: 'شريط احتفالي',
    category: 'festive',
    generate: (config, cw, ch) => {
      const { color1, opacity, scale } = config;
      const s = scale / 100;
      return [
        { type: 'shape', x: 0, y: 20 * s, width: cw, height: 40 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.15), borderRadius: 0, zIndex: 0 },
        { type: 'shape', x: -20 * s, y: 60 * s, width: 40 * s, height: 30 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.2), borderRadius: 0, rotation: 45, zIndex: 0 },
        { type: 'shape', x: cw - 20 * s, y: 60 * s, width: 40 * s, height: 30 * s, shapeType: 'rectangle', backgroundColor: colorWithOpacity(color1, opacity * 0.2), borderRadius: 0, rotation: -45, zIndex: 0 },
      ];
    },
  },
];


// ============================================
// EXPORT ALL PATTERNS
// ============================================

export const PATTERNS: DecorativePattern[] = [
  ...modernPatterns,
  ...minimalPatterns,
  ...creativePatterns,
  ...corporatePatterns,
  ...elegantPatterns,
  ...techPatterns,
  ...geometricPatterns,
  ...naturePatterns,
  ...gradientPatterns,
  ...festivePatterns,
];

// Categories
export const CATEGORIES = [
  { id: 'all', label: 'All', labelAr: 'الكل' },
  { id: 'modern', label: 'Modern', labelAr: 'عصري' },
  { id: 'minimal', label: 'Minimal', labelAr: 'بسيط' },
  { id: 'creative', label: 'Creative', labelAr: 'إبداعي' },
  { id: 'corporate', label: 'Corporate', labelAr: 'رسمي' },
  { id: 'elegant', label: 'Elegant', labelAr: 'أنيق' },
  { id: 'tech', label: 'Tech', labelAr: 'تقني' },
  { id: 'geometric', label: 'Geometric', labelAr: 'هندسي' },
  { id: 'nature', label: 'Nature', labelAr: 'طبيعة' },
  { id: 'gradient', label: 'Gradient', labelAr: 'تدرج' },
  { id: 'festive', label: 'Festive', labelAr: 'احتفالي' },
];

// Color presets
export const COLOR_PRESETS = [
  { name: 'Purple', color: '#8b5cf6' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Teal', color: '#14b8a6' },
  { name: 'Green', color: '#22c55e' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Yellow', color: '#eab308' },
  { name: 'Gray', color: '#6b7280' },
  { name: 'Dark', color: '#1f2937' },
  { name: 'Indigo', color: '#6366f1' },
  { name: 'Cyan', color: '#06b6d4' },
];

// Position options
export const POSITIONS = [
  { id: 'full', label: 'Full', labelAr: 'كامل' },
  { id: 'top-left', label: 'Top Left', labelAr: 'أعلى يسار' },
  { id: 'top-right', label: 'Top Right', labelAr: 'أعلى يمين' },
  { id: 'bottom-left', label: 'Bottom Left', labelAr: 'أسفل يسار' },
  { id: 'bottom-right', label: 'Bottom Right', labelAr: 'أسفل يمين' },
  { id: 'center', label: 'Center', labelAr: 'وسط' },
];
