import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check } from 'lucide-react';

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

const PRESET_THEMES: Theme[] = [
  {
    id: 'professional-blue',
    name: 'Professional Blue',
    colors: {
      primary: '#1e3a5f',
      secondary: '#3b82f6',
      background: '#ffffff',
      text: '#1f2937',
      accent: '#60a5fa',
    },
    fonts: { heading: 'Inter', body: 'Inter' },
  },
  {
    id: 'modern-purple',
    name: 'Modern Purple',
    colors: {
      primary: '#7c3aed',
      secondary: '#8b5cf6',
      background: '#faf5ff',
      text: '#1f2937',
      accent: '#a78bfa',
    },
    fonts: { heading: 'Poppins', body: 'Inter' },
  },
  {
    id: 'nature-green',
    name: 'Nature Green',
    colors: {
      primary: '#059669',
      secondary: '#10b981',
      background: '#ecfdf5',
      text: '#064e3b',
      accent: '#34d399',
    },
    fonts: { heading: 'Inter', body: 'Inter' },
  },
  {
    id: 'warm-orange',
    name: 'Warm Orange',
    colors: {
      primary: '#ea580c',
      secondary: '#f97316',
      background: '#fff7ed',
      text: '#9a3412',
      accent: '#fb923c',
    },
    fonts: { heading: 'Inter', body: 'Inter' },
  },
  {
    id: 'elegant-dark',
    name: 'Elegant Dark',
    colors: {
      primary: '#1f2937',
      secondary: '#374151',
      background: '#111827',
      text: '#f9fafb',
      accent: '#9ca3af',
    },
    fonts: { heading: 'Playfair Display', body: 'Inter' },
  },
  {
    id: 'rose-pink',
    name: 'Rose Pink',
    colors: {
      primary: '#be185d',
      secondary: '#ec4899',
      background: '#fdf2f8',
      text: '#831843',
      accent: '#f472b6',
    },
    fonts: { heading: 'Inter', body: 'Inter' },
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    colors: {
      primary: '#0284c7',
      secondary: '#0ea5e9',
      background: '#f0f9ff',
      text: '#0c4a6e',
      accent: '#38bdf8',
    },
    fonts: { heading: 'Inter', body: 'Inter' },
  },
  {
    id: 'sunset-gradient',
    name: 'Sunset',
    colors: {
      primary: '#dc2626',
      secondary: '#f97316',
      background: '#fffbeb',
      text: '#7c2d12',
      accent: '#fbbf24',
    },
    fonts: { heading: 'Inter', body: 'Inter' },
  },
];

const COLOR_PALETTES = [
  {
    id: 'vibrant',
    name: 'Vibrant',
    colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'],
  },
  {
    id: 'pastel',
    name: 'Pastel',
    colors: ['#fca5a5', '#fdba74', '#fde047', '#86efac', '#93c5fd', '#c4b5fd', '#f9a8d4'],
  },
  {
    id: 'earth',
    name: 'Earth Tones',
    colors: ['#78350f', '#92400e', '#a16207', '#166534', '#0f766e', '#1e40af', '#4c1d95'],
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    colors: ['#0f172a', '#1e293b', '#334155', '#64748b', '#94a3b8', '#cbd5e1', '#f1f5f9'],
  },
  {
    id: 'neon',
    name: 'Neon',
    colors: ['#ff0080', '#ff00ff', '#00ffff', '#00ff00', '#ffff00', '#ff8000', '#ff0000'],
  },
];

interface ThemeManagerProps {
  currentTheme: Theme | null;
  onThemeChange: (theme: Theme) => void;
  onColorSelect: (color: string) => void;
}

export const ThemeManager = ({ currentTheme, onThemeChange, onColorSelect }: ThemeManagerProps) => {
  return (
    <div className="space-y-6">
      {/* Theme Presets */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Theme Presets</Label>
        <ScrollArea className="h-[180px]">
          <div className="grid grid-cols-2 gap-2 pr-4">
            {PRESET_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => onThemeChange(theme)}
                className={`relative p-3 rounded-lg border-2 transition-all hover:scale-[1.02] ${
                  currentTheme?.id === theme.id 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  {Object.values(theme.colors).slice(0, 5).map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium">{theme.name}</span>
                {currentTheme?.id === theme.id && (
                  <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Color Palettes */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Color Palettes</Label>
        <div className="space-y-3">
          {COLOR_PALETTES.map((palette) => (
            <div key={palette.id} className="space-y-1">
              <span className="text-xs text-muted-foreground">{palette.name}</span>
              <div className="flex gap-1">
                {palette.colors.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => onColorSelect(color)}
                    className="w-8 h-8 rounded-lg border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Color */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Custom Color</Label>
        <div className="flex gap-2">
          <input
            type="color"
            className="w-12 h-10 rounded cursor-pointer border border-border"
            onChange={(e) => onColorSelect(e.target.value)}
          />
          <span className="text-sm text-muted-foreground self-center">Pick any color</span>
        </div>
      </div>
    </div>
  );
};

export default ThemeManager;
