import { useState, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// Gradient icon SVG
const GradientIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="gradIcon" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b5cf6"/>
        <stop offset="100%" stopColor="#3b82f6"/>
      </linearGradient>
    </defs>
    <rect x="3" y="3" width="18" height="18" rx="2" fill="url(#gradIcon)"/>
  </svg>
);

// Gradient types
type GradientType = 'linear' | 'radial' | 'conic';

// Gradient stop
interface GradientStop {
  color: string;
  position: number;
}

// Gradient configuration
export interface GradientConfig {
  type: GradientType;
  angle: number;
  stops: GradientStop[];
  centerX?: number;
  centerY?: number;
}

// Preset gradients
const PRESET_GRADIENTS: { name: string; config: GradientConfig; category: string }[] = [
  // Warm
  { name: 'Sunset', category: 'warm', config: { type: 'linear', angle: 135, stops: [{ color: '#f97316', position: 0 }, { color: '#ec4899', position: 100 }] } },
  { name: 'Fire', category: 'warm', config: { type: 'linear', angle: 0, stops: [{ color: '#fbbf24', position: 0 }, { color: '#f97316', position: 50 }, { color: '#dc2626', position: 100 }] } },
  { name: 'Peach', category: 'warm', config: { type: 'linear', angle: 135, stops: [{ color: '#fecaca', position: 0 }, { color: '#fda4af', position: 100 }] } },
  // Cool
  { name: 'Ocean', category: 'cool', config: { type: 'linear', angle: 180, stops: [{ color: '#0ea5e9', position: 0 }, { color: '#3b82f6', position: 50 }, { color: '#1e3a8a', position: 100 }] } },
  { name: 'Forest', category: 'cool', config: { type: 'linear', angle: 135, stops: [{ color: '#22c55e', position: 0 }, { color: '#15803d', position: 100 }] } },
  { name: 'Mint', category: 'cool', config: { type: 'linear', angle: 135, stops: [{ color: '#a7f3d0', position: 0 }, { color: '#6ee7b7', position: 100 }] } },
  // Vibrant
  { name: 'Purple Haze', category: 'vibrant', config: { type: 'linear', angle: 135, stops: [{ color: '#8b5cf6', position: 0 }, { color: '#a855f7', position: 50 }, { color: '#d946ef', position: 100 }] } },
  { name: 'Aurora', category: 'vibrant', config: { type: 'linear', angle: 135, stops: [{ color: '#06b6d4', position: 0 }, { color: '#8b5cf6', position: 50 }, { color: '#ec4899', position: 100 }] } },
  { name: 'Neon', category: 'vibrant', config: { type: 'linear', angle: 45, stops: [{ color: '#00ff87', position: 0 }, { color: '#60efff', position: 100 }] } },
  // Dark
  { name: 'Night Sky', category: 'dark', config: { type: 'linear', angle: 180, stops: [{ color: '#0f172a', position: 0 }, { color: '#1e3a8a', position: 50 }, { color: '#312e81', position: 100 }] } },
  { name: 'Midnight', category: 'dark', config: { type: 'linear', angle: 135, stops: [{ color: '#1e1b4b', position: 0 }, { color: '#312e81', position: 100 }] } },
  { name: 'Dark Ocean', category: 'dark', config: { type: 'linear', angle: 180, stops: [{ color: '#0c4a6e', position: 0 }, { color: '#082f49', position: 100 }] } },
  // Radial
  { name: 'Radial Glow', category: 'radial', config: { type: 'radial', angle: 0, stops: [{ color: '#fef3c7', position: 0 }, { color: '#f97316', position: 100 }], centerX: 50, centerY: 50 } },
  { name: 'Spotlight', category: 'radial', config: { type: 'radial', angle: 0, stops: [{ color: '#ffffff', position: 0 }, { color: '#1f2937', position: 100 }], centerX: 50, centerY: 50 } },
  { name: 'Vignette', category: 'radial', config: { type: 'radial', angle: 0, stops: [{ color: '#f8fafc', position: 0 }, { color: '#64748b', position: 100 }], centerX: 50, centerY: 50 } },
  // Conic
  { name: 'Rainbow', category: 'conic', config: { type: 'conic', angle: 0, stops: [{ color: '#ef4444', position: 0 }, { color: '#f97316', position: 17 }, { color: '#eab308', position: 33 }, { color: '#22c55e', position: 50 }, { color: '#3b82f6', position: 67 }, { color: '#8b5cf6', position: 83 }, { color: '#ef4444', position: 100 }], centerX: 50, centerY: 50 } },
  { name: 'Color Wheel', category: 'conic', config: { type: 'conic', angle: 0, stops: [{ color: '#f43f5e', position: 0 }, { color: '#8b5cf6', position: 50 }, { color: '#f43f5e', position: 100 }], centerX: 50, centerY: 50 } },
  // Professional
  { name: 'Corporate Blue', category: 'professional', config: { type: 'linear', angle: 135, stops: [{ color: '#1e3a5f', position: 0 }, { color: '#2563eb', position: 100 }] } },
  { name: 'Elegant Gray', category: 'professional', config: { type: 'linear', angle: 180, stops: [{ color: '#f8fafc', position: 0 }, { color: '#e2e8f0', position: 100 }] } },
  { name: 'Clean White', category: 'professional', config: { type: 'linear', angle: 180, stops: [{ color: '#ffffff', position: 0 }, { color: '#f1f5f9', position: 100 }] } },
];

const CATEGORIES = [
  { id: 'all', name: { en: 'All', ar: 'الكل' } },
  { id: 'warm', name: { en: 'Warm', ar: 'دافئ' } },
  { id: 'cool', name: { en: 'Cool', ar: 'بارد' } },
  { id: 'vibrant', name: { en: 'Vibrant', ar: 'نابض' } },
  { id: 'dark', name: { en: 'Dark', ar: 'داكن' } },
  { id: 'radial', name: { en: 'Radial', ar: 'دائري' } },
  { id: 'professional', name: { en: 'Professional', ar: 'احترافي' } },
];

// Convert gradient config to CSS
export const gradientToCSS = (config: GradientConfig): string => {
  const stopsCSS = config.stops
    .sort((a, b) => a.position - b.position)
    .map(stop => `${stop.color} ${stop.position}%`)
    .join(', ');

  switch (config.type) {
    case 'linear':
      return `linear-gradient(${config.angle}deg, ${stopsCSS})`;
    case 'radial':
      return `radial-gradient(circle at ${config.centerX || 50}% ${config.centerY || 50}%, ${stopsCSS})`;
    case 'conic':
      return `conic-gradient(from ${config.angle}deg at ${config.centerX || 50}% ${config.centerY || 50}%, ${stopsCSS})`;
    default:
      return config.stops[0]?.color || '#ffffff';
  }
};

interface GradientBackgroundProps {
  onApply: (background: string, gradientConfig?: GradientConfig) => void;
}

export const GradientBackground = ({
  onApply,
}: GradientBackgroundProps) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('presets');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [savedGradients, setSavedGradients] = useState<{ name: string; config: GradientConfig }[]>(() => {
    try {
      const saved = localStorage.getItem('slideforge_saved_gradients');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [gradientConfig, setGradientConfig] = useState<GradientConfig>({
    type: 'linear',
    angle: 135,
    stops: [
      { color: '#8b5cf6', position: 0 },
      { color: '#3b82f6', position: 100 },
    ],
  });

  // Generate CSS from current config
  const previewCSS = useMemo(() => gradientToCSS(gradientConfig), [gradientConfig]);

  // Filter presets by category
  const filteredPresets = useMemo(() => {
    if (selectedCategory === 'all') return PRESET_GRADIENTS;
    return PRESET_GRADIENTS.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  // Update stop color
  const updateStopColor = useCallback((index: number, color: string) => {
    setGradientConfig(prev => ({
      ...prev,
      stops: prev.stops.map((stop, i) => i === index ? { ...stop, color } : stop),
    }));
  }, []);

  // Update stop position
  const updateStopPosition = useCallback((index: number, position: number) => {
    setGradientConfig(prev => ({
      ...prev,
      stops: prev.stops.map((stop, i) => i === index ? { ...stop, position } : stop),
    }));
  }, []);

  // Add stop
  const addStop = useCallback(() => {
    if (gradientConfig.stops.length >= 5) return;
    setGradientConfig(prev => ({
      ...prev,
      stops: [...prev.stops, { color: '#ffffff', position: 50 }],
    }));
  }, [gradientConfig.stops.length]);

  // Remove stop
  const removeStop = useCallback((index: number) => {
    if (gradientConfig.stops.length <= 2) return;
    setGradientConfig(prev => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index),
    }));
  }, [gradientConfig.stops.length]);

  // Apply preset
  const applyPreset = useCallback((preset: { name: string; config: GradientConfig; category?: string }) => {
    setGradientConfig(preset.config);
    setActiveTab('custom');
  }, []);

  // Save custom gradient
  const saveCustomGradient = useCallback(() => {
    const name = prompt(language === 'ar' ? 'اسم التدرج:' : 'Gradient name:');
    if (!name) return;
    
    const newSaved = [...savedGradients, { name, config: gradientConfig }];
    setSavedGradients(newSaved);
    localStorage.setItem('slideforge_saved_gradients', JSON.stringify(newSaved));
    toast.success(language === 'ar' ? 'تم حفظ التدرج!' : 'Gradient saved!');
  }, [gradientConfig, savedGradients, language]);

  // Delete saved gradient
  const deleteSavedGradient = useCallback((index: number) => {
    const newSaved = savedGradients.filter((_, i) => i !== index);
    setSavedGradients(newSaved);
    localStorage.setItem('slideforge_saved_gradients', JSON.stringify(newSaved));
  }, [savedGradients]);

  // Apply gradient
  const handleApply = useCallback(() => {
    onApply(previewCSS, gradientConfig);
    toast.success(language === 'ar' ? 'تم تطبيق التدرج!' : 'Gradient applied!');
    setIsOpen(false);
  }, [previewCSS, gradientConfig, onApply, language]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <GradientIcon />
          {language === 'ar' ? 'تدرج لوني' : 'Gradient'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'خلفية متدرجة' : 'Gradient Background'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="presets">
              {language === 'ar' ? 'جاهزة' : 'Presets'}
            </TabsTrigger>
            <TabsTrigger value="custom">
              {language === 'ar' ? 'مخصص' : 'Custom'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="mt-4 space-y-4">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {language === 'ar' ? cat.name.ar : cat.name.en}
                </Button>
              ))}
            </div>
            
            <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20">
              {filteredPresets.map((preset, index) => (
                <button
                  key={index}
                  className="group relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                  style={{ background: gradientToCSS(preset.config) }}
                  onClick={() => applyPreset(preset)}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-center pb-2">
                    <span className="text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
                      {preset.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Saved Gradients */}
            {savedGradients.length > 0 && (
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'التدرجات المحفوظة' : 'Saved Gradients'}</Label>
                <div className="grid grid-cols-4 gap-3">
                  {savedGradients.map((saved, index) => (
                    <div key={index} className="relative group">
                      <button
                        className="w-full aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                        style={{ background: gradientToCSS(saved.config) }}
                        onClick={() => applyPreset(saved)}
                      >
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-center pb-2">
                          <span className="text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
                            {saved.name}
                          </span>
                        </div>
                      </button>
                      <button
                        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); deleteSavedGradient(index); }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Controls */}
              <div className="space-y-4">
                {/* Gradient Type */}
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'النوع' : 'Type'}</Label>
                  <Select
                    value={gradientConfig.type}
                    onValueChange={(value: GradientType) => setGradientConfig(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">{language === 'ar' ? 'خطي' : 'Linear'}</SelectItem>
                      <SelectItem value="radial">{language === 'ar' ? 'دائري' : 'Radial'}</SelectItem>
                      <SelectItem value="conic">{language === 'ar' ? 'مخروطي' : 'Conic'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Angle (for linear and conic) */}
                {(gradientConfig.type === 'linear' || gradientConfig.type === 'conic') && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>{language === 'ar' ? 'الزاوية' : 'Angle'}</Label>
                      <span className="text-sm text-muted-foreground">{gradientConfig.angle}°</span>
                    </div>
                    <Slider
                      value={[gradientConfig.angle]}
                      onValueChange={([value]) => setGradientConfig(prev => ({ ...prev, angle: value }))}
                      min={0}
                      max={360}
                      step={15}
                    />
                  </div>
                )}

                {/* Center position (for radial and conic) */}
                {(gradientConfig.type === 'radial' || gradientConfig.type === 'conic') && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>{language === 'ar' ? 'المركز X' : 'Center X'}</Label>
                        <span className="text-sm text-muted-foreground">{gradientConfig.centerX || 50}%</span>
                      </div>
                      <Slider
                        value={[gradientConfig.centerX || 50]}
                        onValueChange={([value]) => setGradientConfig(prev => ({ ...prev, centerX: value }))}
                        min={0}
                        max={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>{language === 'ar' ? 'المركز Y' : 'Center Y'}</Label>
                        <span className="text-sm text-muted-foreground">{gradientConfig.centerY || 50}%</span>
                      </div>
                      <Slider
                        value={[gradientConfig.centerY || 50]}
                        onValueChange={([value]) => setGradientConfig(prev => ({ ...prev, centerY: value }))}
                        min={0}
                        max={100}
                      />
                    </div>
                  </>
                )}

                {/* Color Stops */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{language === 'ar' ? 'الألوان' : 'Color Stops'}</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addStop}
                      disabled={gradientConfig.stops.length >= 5}
                    >
                      {language === 'ar' ? '+ إضافة' : '+ Add'}
                    </Button>
                  </div>
                  
                  {gradientConfig.stops.map((stop, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={stop.color}
                        onChange={(e) => updateStopColor(index, e.target.value)}
                        className="w-12 h-8 p-0 border-0"
                      />
                      <Input
                        type="text"
                        value={stop.color}
                        onChange={(e) => updateStopColor(index, e.target.value)}
                        className="flex-1 font-mono text-xs"
                      />
                      <Input
                        type="number"
                        value={stop.position}
                        onChange={(e) => updateStopPosition(index, parseInt(e.target.value) || 0)}
                        className="w-16 text-xs"
                        min={0}
                        max={100}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                      {gradientConfig.stops.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeStop(index)}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'معاينة' : 'Preview'}</Label>
                <div
                  className="aspect-video rounded-lg border"
                  style={{ background: previewCSS }}
                />
                <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                  {previewCSS}
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={saveCustomGradient}>
                  {language === 'ar' ? 'حفظ التدرج' : 'Save Gradient'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleApply}>
            {language === 'ar' ? 'تطبيق' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GradientBackground;
