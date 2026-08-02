import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Pipette, History, Square, Sun, Droplets, Sparkles, RotateCw, Contrast, SunDim, Blend } from 'lucide-react';

// Color Palettes
const colorPalettes = {
  professional: {
    name: { en: 'Professional', ar: 'احترافي' },
    colors: ['#1e3a5f', '#2c5282', '#2b6cb0', '#3182ce', '#4299e1', '#63b3ed', '#90cdf4', '#bee3f8']
  },
  vibrant: {
    name: { en: 'Vibrant', ar: 'نابض بالحياة' },
    colors: ['#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#319795', '#3182ce', '#805ad5', '#d53f8c']
  },
  pastel: {
    name: { en: 'Pastel', ar: 'باستيل' },
    colors: ['#fed7d7', '#feebc8', '#fefcbf', '#c6f6d5', '#b2f5ea', '#bee3f8', '#e9d8fd', '#fed7e2']
  },
  dark: {
    name: { en: 'Dark', ar: 'داكن' },
    colors: ['#1a202c', '#2d3748', '#4a5568', '#718096', '#a0aec0', '#cbd5e0', '#e2e8f0', '#edf2f7']
  },
  nature: {
    name: { en: 'Nature', ar: 'طبيعي' },
    colors: ['#22543d', '#276749', '#2f855a', '#38a169', '#48bb78', '#68d391', '#9ae6b4', '#c6f6d5']
  },
  sunset: {
    name: { en: 'Sunset', ar: 'غروب' },
    colors: ['#742a2a', '#9b2c2c', '#c53030', '#e53e3e', '#f56565', '#fc8181', '#feb2b2', '#fed7d7']
  }
};

export interface BorderConfig {
  width: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface ShadowConfig {
  enabled: boolean;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  inset: boolean;
}

export interface FiltersConfig {
  blur: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotate: number;
  grayscale: number;
  sepia: number;
  invert: number;
}

interface AdvancedColorToolsProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  showOpacity?: boolean;
  showBorder?: boolean;
  showShadow?: boolean;
  showFilters?: boolean;
  onOpacityChange?: (opacity: number) => void;
  onBorderChange?: (border: BorderConfig) => void;
  onShadowChange?: (shadow: ShadowConfig) => void;
  onFiltersChange?: (filters: FiltersConfig) => void;
  currentOpacity?: number;
  currentBorder?: BorderConfig;
  currentShadow?: ShadowConfig;
  currentFilters?: FiltersConfig;
}

// Helper functions
const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 50 };
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('');
};

const defaultFilters: FiltersConfig = {
  blur: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hueRotate: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0
};

export const AdvancedColorTools = ({
  currentColor,
  onColorChange,
  showOpacity = false,
  showBorder = false,
  showShadow = false,
  showFilters = false,
  onOpacityChange,
  onBorderChange,
  onShadowChange,
  onFiltersChange,
  currentOpacity = 100,
  currentBorder = { width: 0, color: '#000000', style: 'solid' },
  currentShadow = { enabled: false, x: 2, y: 2, blur: 4, spread: 0, color: '#00000040', inset: false },
  currentFilters = defaultFilters
}: AdvancedColorToolsProps) => {
  const { language } = useLanguage();
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [hsl, setHsl] = useState(() => hexToHsl(currentColor));
  const [rgb, setRgb] = useState(() => hexToRgb(currentColor));

  const addToRecent = useCallback((color: string) => {
    setRecentColors(prev => {
      const filtered = prev.filter(c => c !== color);
      return [color, ...filtered].slice(0, 8);
    });
  }, []);

  const handleColorSelect = (color: string) => {
    onColorChange(color);
    addToRecent(color);
    setHsl(hexToHsl(color));
    setRgb(hexToRgb(color));
  };

  const handleHslChange = (key: 'h' | 's' | 'l', value: number) => {
    const newHsl = { ...hsl, [key]: value };
    setHsl(newHsl);
    const hex = hslToHex(newHsl.h, newHsl.s, newHsl.l);
    onColorChange(hex);
    addToRecent(hex);
    setRgb(hexToRgb(hex));
  };

  const handleRgbChange = (key: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgb, [key]: value };
    setRgb(newRgb);
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    onColorChange(hex);
    addToRecent(hex);
    setHsl(hexToHsl(hex));
  };

  const handleEyedropper = async () => {
    try {
      // @ts-ignore - EyeDropper API
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      handleColorSelect(result.sRGBHex);
    } catch {
      // User cancelled or API not supported
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="picker" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="picker" className="text-xs">
            {language === 'ar' ? 'اختيار' : 'Picker'}
          </TabsTrigger>
          <TabsTrigger value="palettes" className="text-xs">
            {language === 'ar' ? 'مجموعات' : 'Palettes'}
          </TabsTrigger>
          <TabsTrigger value="effects" className="text-xs">
            {language === 'ar' ? 'تأثيرات' : 'Effects'}
          </TabsTrigger>
        </TabsList>

        {/* Color Picker Tab */}
        <TabsContent value="picker" className="space-y-4 mt-4">
          {/* Native Color Picker - Unlimited Colors */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="color"
                value={currentColor}
                onChange={(e) => handleColorSelect(e.target.value)}
                className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer"
                style={{ backgroundColor: currentColor }}
              />
            </div>
            <div className="flex-1">
              <Input
                type="text"
                value={currentColor}
                onChange={(e) => handleColorSelect(e.target.value)}
                className="font-mono text-sm"
                placeholder="#000000"
              />
            </div>
            {'EyeDropper' in window && (
              <Button variant="outline" size="icon" onClick={handleEyedropper} title={language === 'ar' ? 'التقاط لون' : 'Pick color'}>
                <Pipette className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* HSL Sliders */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">HSL</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs w-6">H</span>
                <div className="flex-1 relative">
                  <Slider
                    value={[hsl.h]}
                    max={360}
                    step={1}
                    onValueChange={([v]) => handleHslChange('h', v)}
                    className="flex-1"
                  />
                  <div 
                    className="absolute inset-0 -z-10 rounded-full opacity-30"
                    style={{ background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }}
                  />
                </div>
                <Input
                  type="number"
                  value={hsl.h}
                  onChange={(e) => handleHslChange('h', Number(e.target.value))}
                  className="w-14 text-xs"
                  min={0}
                  max={360}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-6">S</span>
                <Slider
                  value={[hsl.s]}
                  max={100}
                  step={1}
                  onValueChange={([v]) => handleHslChange('s', v)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={hsl.s}
                  onChange={(e) => handleHslChange('s', Number(e.target.value))}
                  className="w-14 text-xs"
                  min={0}
                  max={100}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-6">L</span>
                <Slider
                  value={[hsl.l]}
                  max={100}
                  step={1}
                  onValueChange={([v]) => handleHslChange('l', v)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={hsl.l}
                  onChange={(e) => handleHslChange('l', Number(e.target.value))}
                  className="w-14 text-xs"
                  min={0}
                  max={100}
                />
              </div>
            </div>
          </div>

          {/* RGB Sliders */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">RGB</Label>
            <div className="space-y-2">
              {(['r', 'g', 'b'] as const).map((channel) => (
                <div key={channel} className="flex items-center gap-2">
                  <span className="text-xs w-6 uppercase" style={{ color: channel === 'r' ? '#ef4444' : channel === 'g' ? '#22c55e' : '#3b82f6' }}>{channel}</span>
                  <Slider
                    value={[rgb[channel]]}
                    max={255}
                    step={1}
                    onValueChange={([v]) => handleRgbChange(channel, v)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={rgb[channel]}
                    onChange={(e) => handleRgbChange(channel, Number(e.target.value))}
                    className="w-14 text-xs"
                    min={0}
                    max={255}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <History className="w-3 h-3" />
                {language === 'ar' ? 'الألوان الأخيرة' : 'Recent Colors'}
              </Label>
              <div className="flex gap-1 flex-wrap">
                {recentColors.map((color, i) => (
                  <button
                    key={i}
                    className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Palettes Tab */}
        <TabsContent value="palettes" className="space-y-4 mt-4">
          {Object.entries(colorPalettes).map(([key, palette]) => (
            <div key={key} className="space-y-2">
              <Label className="text-xs">
                {language === 'ar' ? palette.name.ar : palette.name.en}
              </Label>
              <div className="flex gap-1">
                {palette.colors.map((color, i) => (
                  <button
                    key={i}
                    className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform flex-1"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Effects Tab */}
        <TabsContent value="effects" className="space-y-4 mt-4">
          {/* Show message if no effects available */}
          {!showOpacity && !showBorder && !showShadow && !showFilters && (
            <div className="text-center py-6 text-muted-foreground">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {language === 'ar' 
                  ? 'اختر عنصر لتطبيق التأثيرات عليه' 
                  : 'Select an element to apply effects'}
              </p>
            </div>
          )}

          {/* Opacity */}
          {showOpacity && onOpacityChange && (
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Droplets className="w-3 h-3" />
                {language === 'ar' ? 'الشفافية' : 'Opacity'}
              </Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[currentOpacity]}
                  max={100}
                  step={1}
                  onValueChange={([v]) => onOpacityChange(v)}
                  className="flex-1"
                />
                <span className="text-xs w-10 text-right">{currentOpacity}%</span>
              </div>
            </div>
          )}

          {/* Border */}
          {showBorder && onBorderChange && (
            <div className="space-y-3 pt-3 border-t">
              <Label className="text-xs flex items-center gap-1">
                <Square className="w-3 h-3" />
                {language === 'ar' ? 'الحدود' : 'Border'}
              </Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs w-12">{language === 'ar' ? 'السمك' : 'Width'}</span>
                  <Slider
                    value={[currentBorder.width]}
                    max={20}
                    step={1}
                    onValueChange={([v]) => onBorderChange({ ...currentBorder, width: v })}
                    className="flex-1"
                  />
                  <span className="text-xs w-8">{currentBorder.width}px</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-12">{language === 'ar' ? 'اللون' : 'Color'}</span>
                  <input
                    type="color"
                    value={currentBorder.color}
                    onChange={(e) => onBorderChange({ ...currentBorder, color: e.target.value })}
                    className="w-8 h-8 rounded border border-border cursor-pointer"
                  />
                  <select
                    value={currentBorder.style}
                    onChange={(e) => onBorderChange({ ...currentBorder, style: e.target.value as BorderConfig['style'] })}
                    className="flex-1 text-xs bg-background border rounded px-2 py-1"
                  >
                    <option value="solid">{language === 'ar' ? 'متصل' : 'Solid'}</option>
                    <option value="dashed">{language === 'ar' ? 'متقطع' : 'Dashed'}</option>
                    <option value="dotted">{language === 'ar' ? 'منقط' : 'Dotted'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Shadow */}
          {showShadow && onShadowChange && (
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1">
                  <Sun className="w-3 h-3" />
                  {language === 'ar' ? 'الظل' : 'Shadow'}
                </Label>
                <Switch
                  checked={currentShadow.enabled}
                  onCheckedChange={(checked) => onShadowChange({ ...currentShadow, enabled: checked })}
                />
              </div>
              {currentShadow.enabled && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-10">X</span>
                    <Slider value={[currentShadow.x]} min={-30} max={30} step={1} onValueChange={([v]) => onShadowChange({ ...currentShadow, x: v })} className="flex-1" />
                    <span className="text-xs w-8">{currentShadow.x}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-10">Y</span>
                    <Slider value={[currentShadow.y]} min={-30} max={30} step={1} onValueChange={([v]) => onShadowChange({ ...currentShadow, y: v })} className="flex-1" />
                    <span className="text-xs w-8">{currentShadow.y}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-10">{language === 'ar' ? 'ضباب' : 'Blur'}</span>
                    <Slider value={[currentShadow.blur]} max={50} step={1} onValueChange={([v]) => onShadowChange({ ...currentShadow, blur: v })} className="flex-1" />
                    <span className="text-xs w-8">{currentShadow.blur}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-10">{language === 'ar' ? 'انتشار' : 'Spread'}</span>
                    <Slider value={[currentShadow.spread]} min={-20} max={20} step={1} onValueChange={([v]) => onShadowChange({ ...currentShadow, spread: v })} className="flex-1" />
                    <span className="text-xs w-8">{currentShadow.spread}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-10">{language === 'ar' ? 'لون' : 'Color'}</span>
                    <input
                      type="color"
                      value={currentShadow.color.slice(0, 7)}
                      onChange={(e) => onShadowChange({ ...currentShadow, color: e.target.value + '80' })}
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                    />
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-xs">{language === 'ar' ? 'داخلي' : 'Inset'}</span>
                      <Switch
                        checked={currentShadow.inset}
                        onCheckedChange={(checked) => onShadowChange({ ...currentShadow, inset: checked })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filters */}
          {showFilters && onFiltersChange && (
            <div className="space-y-3 pt-3 border-t">
              <Label className="text-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {language === 'ar' ? 'الفلاتر' : 'Filters'}
              </Label>
              <div className="space-y-2">
                {/* Blur */}
                <div className="flex items-center gap-2">
                  <span className="text-xs w-16 flex items-center gap-1">
                    <Blend className="w-3 h-3" />
                    {language === 'ar' ? 'ضبابية' : 'Blur'}
                  </span>
                  <Slider value={[currentFilters.blur]} max={20} step={0.5} onValueChange={([v]) => onFiltersChange({ ...currentFilters, blur: v })} className="flex-1" />
                  <span className="text-xs w-10">{currentFilters.blur}px</span>
                </div>
                {/* Brightness */}
                <div className="flex items-center gap-2">
                  <span className="text-xs w-16 flex items-center gap-1">
                    <SunDim className="w-3 h-3" />
                    {language === 'ar' ? 'سطوع' : 'Bright'}
                  </span>
                  <Slider value={[currentFilters.brightness]} min={0} max={200} step={1} onValueChange={([v]) => onFiltersChange({ ...currentFilters, brightness: v })} className="flex-1" />
                  <span className="text-xs w-10">{currentFilters.brightness}%</span>
                </div>
                {/* Contrast */}
                <div className="flex items-center gap-2">
                  <span className="text-xs w-16 flex items-center gap-1">
                    <Contrast className="w-3 h-3" />
                    {language === 'ar' ? 'تباين' : 'Contrast'}
                  </span>
                  <Slider value={[currentFilters.contrast]} min={0} max={200} step={1} onValueChange={([v]) => onFiltersChange({ ...currentFilters, contrast: v })} className="flex-1" />
                  <span className="text-xs w-10">{currentFilters.contrast}%</span>
                </div>
                {/* Saturation */}
                <div className="flex items-center gap-2">
                  <span className="text-xs w-16 flex items-center gap-1">
                    <Droplets className="w-3 h-3" />
                    {language === 'ar' ? 'تشبع' : 'Saturate'}
                  </span>
                  <Slider value={[currentFilters.saturation]} min={0} max={200} step={1} onValueChange={([v]) => onFiltersChange({ ...currentFilters, saturation: v })} className="flex-1" />
                  <span className="text-xs w-10">{currentFilters.saturation}%</span>
                </div>
                {/* Hue Rotate */}
                <div className="flex items-center gap-2">
                  <span className="text-xs w-16 flex items-center gap-1">
                    <RotateCw className="w-3 h-3" />
                    {language === 'ar' ? 'تدوير' : 'Hue'}
                  </span>
                  <Slider value={[currentFilters.hueRotate]} min={0} max={360} step={1} onValueChange={([v]) => onFiltersChange({ ...currentFilters, hueRotate: v })} className="flex-1" />
                  <span className="text-xs w-10">{currentFilters.hueRotate}°</span>
                </div>
                {/* Grayscale */}
                <div className="flex items-center gap-2">
                  <span className="text-xs w-16">{language === 'ar' ? 'رمادي' : 'Gray'}</span>
                  <Slider value={[currentFilters.grayscale]} min={0} max={100} step={1} onValueChange={([v]) => onFiltersChange({ ...currentFilters, grayscale: v })} className="flex-1" />
                  <span className="text-xs w-10">{currentFilters.grayscale}%</span>
                </div>
                {/* Sepia */}
                <div className="flex items-center gap-2">
                  <span className="text-xs w-16">{language === 'ar' ? 'بني' : 'Sepia'}</span>
                  <Slider value={[currentFilters.sepia]} min={0} max={100} step={1} onValueChange={([v]) => onFiltersChange({ ...currentFilters, sepia: v })} className="flex-1" />
                  <span className="text-xs w-10">{currentFilters.sepia}%</span>
                </div>
                {/* Invert */}
                <div className="flex items-center gap-2">
                  <span className="text-xs w-16">{language === 'ar' ? 'عكس' : 'Invert'}</span>
                  <Slider value={[currentFilters.invert]} min={0} max={100} step={1} onValueChange={([v]) => onFiltersChange({ ...currentFilters, invert: v })} className="flex-1" />
                  <span className="text-xs w-10">{currentFilters.invert}%</span>
                </div>
                {/* Reset Filters */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => onFiltersChange(defaultFilters)}
                >
                  {language === 'ar' ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper to generate CSS filter string
export const filtersToCSS = (filters: FiltersConfig): string => {
  const parts: string[] = [];
  if (filters.blur > 0) parts.push(`blur(${filters.blur}px)`);
  if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`);
  if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`);
  if (filters.saturation !== 100) parts.push(`saturate(${filters.saturation}%)`);
  if (filters.hueRotate > 0) parts.push(`hue-rotate(${filters.hueRotate}deg)`);
  if (filters.grayscale > 0) parts.push(`grayscale(${filters.grayscale}%)`);
  if (filters.sepia > 0) parts.push(`sepia(${filters.sepia}%)`);
  if (filters.invert > 0) parts.push(`invert(${filters.invert}%)`);
  return parts.length > 0 ? parts.join(' ') : 'none';
};

// Helper to generate CSS box-shadow string
export const shadowToCSS = (shadow: ShadowConfig): string => {
  if (!shadow.enabled) return 'none';
  const inset = shadow.inset ? 'inset ' : '';
  return `${inset}${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}`;
};

export default AdvancedColorTools;
