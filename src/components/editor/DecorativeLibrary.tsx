import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { Sparkles, Plus, Star, RotateCw } from 'lucide-react';

// Import patterns and types from separate file
import {
  PATTERNS,
  CATEGORIES,
  COLOR_PRESETS,
  colorWithOpacity,
  type DecorationConfig,
  type DecorativePattern,
} from './decorativePatterns';

// Re-export types for external use
export type { DecorationConfig };

interface DecorativeLibraryProps {
  onAddDecoration: (elements: any[]) => void;
  trigger?: React.ReactNode;
  slideBackgroundColor?: string;
}

// Canvas dimensions (same for preview and actual)
const CANVAS_W = 960;
const CANVAS_H = 540;

// Generate preview SVG
const generatePreviewSVG = (pattern: DecorativePattern, config: DecorationConfig): string => {
  const elements = pattern.generate(config, CANVAS_W, CANVAS_H);
  const shapes = elements.map((el) => {
    if (el.shapeType === 'circle') {
      return `<ellipse cx="${el.x + el.width / 2}" cy="${el.y + el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${el.backgroundColor}" ${el.rotation ? `transform="rotate(${el.rotation} ${el.x + el.width / 2} ${el.y + el.height / 2})"` : ''}/>`;
    }
    return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="${el.borderRadius || 0}" fill="${el.backgroundColor}" ${el.rotation ? `transform="rotate(${el.rotation} ${el.x + el.width / 2} ${el.y + el.height / 2})"` : ''}/>`;
  }).join('');
  return `<svg viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${shapes}</svg>`;
};


export const DecorativeLibrary = ({ onAddDecoration, trigger, slideBackgroundColor }: DecorativeLibraryProps) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPattern, setSelectedPattern] = useState<DecorativePattern | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const [config, setConfig] = useState<DecorationConfig>({
    color1: '#8b5cf6',
    color2: '#ec4899',
    useGradient: false,
    opacity: 1,
    scale: 100,
    rotation: 0,
    position: 'full',
    blur: 0,
    shadow: false,
    glow: false,
  });

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const filteredPatterns = useMemo(() => {
    if (activeCategory === 'favorites') {
      return PATTERNS.filter(p => favorites.includes(p.id));
    }
    if (activeCategory === 'all') return PATTERNS;
    return PATTERNS.filter(p => p.category === activeCategory);
  }, [activeCategory, favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const suggestColors = () => {
    if (!slideBackgroundColor) return;
    const hex = slideBackgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const compR = (255 - r).toString(16).padStart(2, '0');
    const compG = (255 - g).toString(16).padStart(2, '0');
    const compB = (255 - b).toString(16).padStart(2, '0');
    setConfig(prev => ({ ...prev, color1: `#${compR}${compG}${compB}` }));
    toast.success(t('تم اقتراح لون متناسق!', 'Suggested a matching color!'));
  };

  const handleAddDecoration = () => {
    if (!selectedPattern) {
      toast.error(t('اختر نمط أولاً', 'Select a pattern first'));
      return;
    }

    const elements = selectedPattern.generate(config, CANVAS_W, CANVAS_H);
    
    const finalElements = elements.map((el, i) => ({
      id: `deco-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'shape' as const,
      x: Math.round(el.x),
      y: Math.round(el.y),
      width: Math.round(el.width),
      height: Math.round(el.height),
      shapeType: el.shapeType,
      backgroundColor: el.backgroundColor,
      borderRadius: el.shapeType === 'circle' ? undefined : (el.borderRadius || 0),
      rotation: (el.rotation || 0) + config.rotation,
      zIndex: 0,
      shadow: config.shadow ? { enabled: true, x: 4, y: 4, blur: 10, spread: 0, color: '#00000030', inset: false } : undefined,
    }));

    onAddDecoration(finalElements);
    setIsOpen(false);
    toast.success(t(`تمت إضافة ${finalElements.length} عناصر!`, `Added ${finalElements.length} elements!`));
  };

  const updateConfig = (updates: Partial<DecorationConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Sparkles className="w-4 h-4 mr-2" />
            {t('العناصر الزخرفية', 'Decorations')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b border-border bg-gradient-to-r from-violet-500/10 to-purple-500/10">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            {t('مكتبة العناصر الزخرفية', 'Decorative Elements Library')}
            <span className="text-xs text-muted-foreground ml-2">({PATTERNS.length} {t('عنصر', 'patterns')})</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[70vh]">
          {/* Left Panel - Pattern Selection */}
          <div className="flex-1 border-r border-border flex flex-col min-w-0">
            {/* Categories */}
            <ScrollArea className="shrink-0 border-b border-border">
              <div className="flex gap-1 p-2 flex-wrap">
                {favorites.length > 0 && (
                  <Button
                    variant={activeCategory === 'favorites' ? 'default' : 'ghost'}
                    size="sm"
                    className="text-xs whitespace-nowrap gap-1"
                    onClick={() => setActiveCategory('favorites')}
                  >
                    <Star className="w-3 h-3" />
                    {t('المفضلة', 'Favorites')}
                  </Button>
                )}
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={activeCategory === cat.id ? 'default' : 'ghost'}
                    size="sm"
                    className="text-xs whitespace-nowrap"
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {language === 'ar' ? cat.labelAr : cat.label}
                  </Button>
                ))}
              </div>
            </ScrollArea>

            {/* Patterns Grid */}
            <ScrollArea className="flex-1 p-3">
              <div className="grid grid-cols-3 gap-3">
                {filteredPatterns.map((pattern) => {
                  const isSelected = selectedPattern?.id === pattern.id;
                  const isFavorite = favorites.includes(pattern.id);
                  const previewSVG = generatePreviewSVG(pattern, config);
                  
                  return (
                    <div
                      key={pattern.id}
                      className={`relative group rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                        isSelected
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-md'
                          : 'border-border hover:border-violet-300'
                      }`}
                      onClick={() => setSelectedPattern(pattern)}
                    >
                      <button
                        className={`absolute top-2 right-2 z-10 p-1 rounded-full transition-all ${
                          isFavorite ? 'bg-yellow-400 text-white' : 'bg-white/80 text-gray-400 opacity-0 group-hover:opacity-100'
                        }`}
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(pattern.id); }}
                      >
                        <Star className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      
                      <div 
                        className="w-full h-24 bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: previewSVG }}
                      />
                      
                      <p className="text-xs font-medium text-center py-2 truncate px-2">
                        {language === 'ar' ? pattern.nameAr : pattern.name}
                      </p>
                    </div>
                  );
                })}
              </div>
              
              {filteredPatterns.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  {t('لا توجد أنماط', 'No patterns found')}
                </div>
              )}
            </ScrollArea>
          </div>


          {/* Right Panel - Customization */}
          <div className="w-80 flex flex-col bg-muted/30">
            {/* Live Preview */}
            <div className="p-4 border-b border-border">
              <Label className="text-sm font-medium mb-2 block">{t('معاينة حية', 'Live Preview')}</Label>
              <div className="w-full h-36 bg-white dark:bg-gray-900 rounded-lg border overflow-hidden shadow-inner">
                {selectedPattern ? (
                  <div 
                    className="w-full h-full"
                    style={{ transform: `rotate(${config.rotation}deg)` }}
                    dangerouslySetInnerHTML={{ __html: generatePreviewSVG(selectedPattern, config) }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    {t('اختر نمط للمعاينة', 'Select a pattern')}
                  </div>
                )}
              </div>
            </div>

            {/* Customization Options */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-5">
                {/* Primary Color */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t('اللون الأساسي', 'Primary Color')}</Label>
                    {slideBackgroundColor && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={suggestColors}>
                        {t('اقتراح', 'Suggest')}
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => updateConfig({ color1: preset.color })}
                        className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${
                          config.color1 === preset.color ? 'border-gray-900 dark:border-white ring-2 ring-violet-500' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.name}
                      />
                    ))}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-7 h-7 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-violet-500">
                          <Plus className="w-4 h-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <input
                          type="color"
                          value={config.color1}
                          onChange={(e) => updateConfig({ color1: e.target.value })}
                          className="w-32 h-32 cursor-pointer"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Gradient Toggle & Secondary Color */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t('تدرج لوني', 'Use Gradient')}</Label>
                    <Switch
                      checked={config.useGradient}
                      onCheckedChange={(checked) => updateConfig({ useGradient: checked })}
                    />
                  </div>
                  
                  {config.useGradient && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t('اللون الثاني', 'Secondary Color')}</Label>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_PRESETS.slice(0, 6).map((preset) => (
                          <button
                            key={`sec-${preset.name}`}
                            onClick={() => updateConfig({ color2: preset.color })}
                            className={`w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 ${
                              config.color2 === preset.color ? 'border-gray-900 dark:border-white' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: preset.color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>


                {/* Opacity */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">{t('الشفافية', 'Opacity')}</Label>
                    <span className="text-xs text-muted-foreground">{Math.round(config.opacity * 100)}%</span>
                  </div>
                  <Slider
                    value={[config.opacity * 100]}
                    onValueChange={([v]) => updateConfig({ opacity: v / 100 })}
                    min={10}
                    max={100}
                    step={5}
                  />
                </div>

                {/* Scale */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">{t('الحجم', 'Scale')}</Label>
                    <span className="text-xs text-muted-foreground">{config.scale}%</span>
                  </div>
                  <Slider
                    value={[config.scale]}
                    onValueChange={([v]) => updateConfig({ scale: v })}
                    min={50}
                    max={150}
                    step={10}
                  />
                </div>

                {/* Rotation */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">{t('الدوران', 'Rotation')}</Label>
                    <span className="text-xs text-muted-foreground">{config.rotation}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[config.rotation]}
                      onValueChange={([v]) => updateConfig({ rotation: v })}
                      min={0}
                      max={360}
                      step={15}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => updateConfig({ rotation: 0 })}
                    >
                      <RotateCw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Effects */}
                <div className="space-y-3 pt-3 border-t">
                  <Label className="text-sm font-medium">{t('تأثيرات', 'Effects')}</Label>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t('ظل', 'Shadow')}</Label>
                    <Switch
                      checked={config.shadow}
                      onCheckedChange={(checked) => updateConfig({ shadow: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t('توهج', 'Glow')}</Label>
                    <Switch
                      checked={config.glow}
                      onCheckedChange={(checked) => updateConfig({ glow: checked })}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Add Button */}
            <div className="p-4 border-t border-border bg-background">
              <Button
                onClick={handleAddDecoration}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                disabled={!selectedPattern}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {t('إضافة للشريحة', 'Add to Slide')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DecorativeLibrary;
