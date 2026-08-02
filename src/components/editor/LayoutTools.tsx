import { useLanguage } from '@/contexts/LanguageContext';
import { SlideTemplate, SlideElement } from '@/data/templates';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Layers,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  Move,
} from 'lucide-react';

interface LayoutToolsProps {
  slide: SlideTemplate;
  selectedElement: SlideElement | null;
  onUpdateElement: (updates: Partial<SlideElement>) => void;
  onSlideTypeChange: (type: SlideTemplate['type']) => void;
  onBackgroundColorChange: (color: string) => void;
  onTextColorChange: (color: string) => void;
  onAddElement?: (element: Omit<SlideElement, 'id'>) => void;
  onClearElements?: () => void;
  onDuplicateSlide?: () => void;
  onDeleteSlide?: () => void;
  onMoveSlide?: (direction: 'up' | 'down') => void;
  slideIndex?: number;
  totalSlides?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  onCanvasSizeChange?: (width: number, height: number) => void;
}

// Preset themes
const themePresets = [
  { name: { en: 'Corporate Blue', ar: 'أزرق احترافي' }, bg: '#1e3a5f', text: '#ffffff' },
  { name: { en: 'Clean White', ar: 'أبيض نظيف' }, bg: '#ffffff', text: '#1f2937' },
  { name: { en: 'Dark Mode', ar: 'الوضع الداكن' }, bg: '#111827', text: '#f9fafb' },
  { name: { en: 'Sunset', ar: 'غروب' }, bg: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)', text: '#ffffff' },
  { name: { en: 'Ocean', ar: 'محيط' }, bg: 'linear-gradient(180deg, #0ea5e9 0%, #1e3a8a 100%)', text: '#ffffff' },
  { name: { en: 'Forest', ar: 'غابة' }, bg: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)', text: '#ffffff' },
  { name: { en: 'Purple Haze', ar: 'ضباب بنفسجي' }, bg: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', text: '#ffffff' },
  { name: { en: 'Minimal Gray', ar: 'رمادي بسيط' }, bg: '#f8fafc', text: '#334155' },
];

// Quick templates based on slide type
const getQuickTemplates = (slideType: string, language: string) => {
  const templates: Record<string, { name: string; bg: string; text: string }[]> = {
    cover: [
      { name: language === 'ar' ? 'احترافي داكن' : 'Dark Pro', bg: '#0f172a', text: '#f8fafc' },
      { name: language === 'ar' ? 'أنيق فاتح' : 'Light Elegant', bg: '#ffffff', text: '#1e293b' },
      { name: language === 'ar' ? 'تدرج أزرق' : 'Blue Gradient', bg: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)', text: '#ffffff' },
      { name: language === 'ar' ? 'ذهبي فاخر' : 'Gold Luxury', bg: '#1c1917', text: '#fbbf24' },
    ],
    content: [
      { name: language === 'ar' ? 'نظيف' : 'Clean', bg: '#ffffff', text: '#374151' },
      { name: language === 'ar' ? 'داكن' : 'Dark', bg: '#1f2937', text: '#f3f4f6' },
      { name: language === 'ar' ? 'أزرق ناعم' : 'Soft Blue', bg: '#eff6ff', text: '#1e40af' },
      { name: language === 'ar' ? 'أخضر طبيعي' : 'Natural Green', bg: '#f0fdf4', text: '#166534' },
    ],
    section: [
      { name: language === 'ar' ? 'جريء' : 'Bold', bg: '#7c3aed', text: '#ffffff' },
      { name: language === 'ar' ? 'أحمر قوي' : 'Strong Red', bg: '#dc2626', text: '#ffffff' },
      { name: language === 'ar' ? 'أزرق عميق' : 'Deep Blue', bg: '#1e3a8a', text: '#ffffff' },
      { name: language === 'ar' ? 'رمادي أنيق' : 'Elegant Gray', bg: '#374151', text: '#f9fafb' },
    ],
    quote: [
      { name: language === 'ar' ? 'كلاسيكي' : 'Classic', bg: '#fef3c7', text: '#92400e' },
      { name: language === 'ar' ? 'حديث' : 'Modern', bg: '#f1f5f9', text: '#0f172a' },
      { name: language === 'ar' ? 'ملهم' : 'Inspiring', bg: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)', text: '#86198f' },
      { name: language === 'ar' ? 'داكن أنيق' : 'Dark Elegant', bg: '#18181b', text: '#e4e4e7' },
    ],
    comparison: [
      { name: language === 'ar' ? 'متباين' : 'Contrast', bg: '#ffffff', text: '#111827' },
      { name: language === 'ar' ? 'ناعم' : 'Soft', bg: '#f8fafc', text: '#334155' },
      { name: language === 'ar' ? 'داكن' : 'Dark', bg: '#1e293b', text: '#e2e8f0' },
      { name: language === 'ar' ? 'ملون' : 'Colorful', bg: 'linear-gradient(90deg, #dbeafe 0%, #fce7f3 100%)', text: '#1f2937' },
    ],
    chart: [
      { name: language === 'ar' ? 'بيانات نظيفة' : 'Clean Data', bg: '#ffffff', text: '#1f2937' },
      { name: language === 'ar' ? 'تحليلي' : 'Analytical', bg: '#f0f9ff', text: '#0c4a6e' },
      { name: language === 'ar' ? 'داكن' : 'Dark', bg: '#0f172a', text: '#e2e8f0' },
      { name: language === 'ar' ? 'احترافي' : 'Professional', bg: '#fafafa', text: '#171717' },
    ],
    timeline: [
      { name: language === 'ar' ? 'خط زمني' : 'Timeline', bg: '#ffffff', text: '#374151' },
      { name: language === 'ar' ? 'تاريخي' : 'Historical', bg: '#fef3c7', text: '#78350f' },
      { name: language === 'ar' ? 'حديث' : 'Modern', bg: '#f1f5f9', text: '#1e293b' },
      { name: language === 'ar' ? 'داكن' : 'Dark', bg: '#1e293b', text: '#f1f5f9' },
    ],
    team: [
      { name: language === 'ar' ? 'ودود' : 'Friendly', bg: '#fef2f2', text: '#991b1b' },
      { name: language === 'ar' ? 'احترافي' : 'Professional', bg: '#f8fafc', text: '#1e293b' },
      { name: language === 'ar' ? 'حيوي' : 'Vibrant', bg: 'linear-gradient(135deg, #fdf4ff 0%, #f0fdfa 100%)', text: '#1f2937' },
      { name: language === 'ar' ? 'داكن' : 'Dark', bg: '#18181b', text: '#fafafa' },
    ],
    agenda: [
      { name: language === 'ar' ? 'منظم' : 'Organized', bg: '#ffffff', text: '#1f2937' },
      { name: language === 'ar' ? 'ملون' : 'Colorful', bg: '#faf5ff', text: '#6b21a8' },
      { name: language === 'ar' ? 'رسمي' : 'Formal', bg: '#1e3a5f', text: '#ffffff' },
      { name: language === 'ar' ? 'بسيط' : 'Simple', bg: '#f9fafb', text: '#111827' },
    ],
    thankyou: [
      { name: language === 'ar' ? 'شكر دافئ' : 'Warm Thanks', bg: 'linear-gradient(135deg, #fef3c7 0%, #fecaca 100%)', text: '#78350f' },
      { name: language === 'ar' ? 'أنيق' : 'Elegant', bg: '#1e293b', text: '#f8fafc' },
      { name: language === 'ar' ? 'بسيط' : 'Simple', bg: '#ffffff', text: '#374151' },
      { name: language === 'ar' ? 'احتفالي' : 'Celebratory', bg: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)', text: '#ffffff' },
    ],
    image: [
      { name: language === 'ar' ? 'معرض' : 'Gallery', bg: '#000000', text: '#ffffff' },
      { name: language === 'ar' ? 'فاتح' : 'Light', bg: '#ffffff', text: '#1f2937' },
      { name: language === 'ar' ? 'تراكب' : 'Overlay', bg: 'rgba(0,0,0,0.7)', text: '#ffffff' },
      { name: language === 'ar' ? 'إطار' : 'Framed', bg: '#f3f4f6', text: '#1f2937' },
    ],
    features: [
      { name: language === 'ar' ? 'نظيف' : 'Clean', bg: '#ffffff', text: '#1f2937' },
      { name: language === 'ar' ? 'تقني' : 'Tech', bg: '#0f172a', text: '#38bdf8' },
      { name: language === 'ar' ? 'ناعم' : 'Soft', bg: '#f0fdf4', text: '#166534' },
      { name: language === 'ar' ? 'أنيق' : 'Elegant', bg: '#faf5ff', text: '#7c3aed' },
    ],
    pricing: [
      { name: language === 'ar' ? 'احترافي' : 'Professional', bg: '#ffffff', text: '#1e293b' },
      { name: language === 'ar' ? 'داكن' : 'Dark', bg: '#0f172a', text: '#f8fafc' },
      { name: language === 'ar' ? 'ملون' : 'Colorful', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#ffffff' },
      { name: language === 'ar' ? 'بسيط' : 'Minimal', bg: '#f8fafc', text: '#334155' },
    ],
    stats: [
      { name: language === 'ar' ? 'جريء' : 'Bold', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#ffffff' },
      { name: language === 'ar' ? 'داكن' : 'Dark', bg: '#0f172a', text: '#22d3ee' },
      { name: language === 'ar' ? 'فاتح' : 'Light', bg: '#ffffff', text: '#7c3aed' },
      { name: language === 'ar' ? 'أخضر' : 'Green', bg: '#064e3b', text: '#34d399' },
    ],
    process: [
      { name: language === 'ar' ? 'خطوات' : 'Steps', bg: '#ffffff', text: '#3b82f6' },
      { name: language === 'ar' ? 'داكن' : 'Dark', bg: '#1e293b', text: '#f8fafc' },
      { name: language === 'ar' ? 'ملون' : 'Colorful', bg: '#fef3c7', text: '#92400e' },
      { name: language === 'ar' ? 'حديث' : 'Modern', bg: '#f1f5f9', text: '#0f172a' },
    ],
    gallery: [
      { name: language === 'ar' ? 'داكن' : 'Dark', bg: '#0f0f0f', text: '#ffffff' },
      { name: language === 'ar' ? 'فاتح' : 'Light', bg: '#ffffff', text: '#1f2937' },
      { name: language === 'ar' ? 'رمادي' : 'Gray', bg: '#374151', text: '#f9fafb' },
      { name: language === 'ar' ? 'دافئ' : 'Warm', bg: '#fef3c7', text: '#78350f' },
    ],
    contact: [
      { name: language === 'ar' ? 'احترافي' : 'Professional', bg: '#ffffff', text: '#1e3a8a' },
      { name: language === 'ar' ? 'داكن' : 'Dark', bg: '#0f172a', text: '#f8fafc' },
      { name: language === 'ar' ? 'ودود' : 'Friendly', bg: '#ecfdf5', text: '#065f46' },
      { name: language === 'ar' ? 'أنيق' : 'Elegant', bg: '#1e293b', text: '#fbbf24' },
    ],
  };
  return templates[slideType] || templates.content;
};

export const LayoutTools = ({
  slide,
  selectedElement,
  onUpdateElement,
  onSlideTypeChange,
  onBackgroundColorChange,
  onTextColorChange,
  onAddElement,
  onClearElements,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
  slideIndex = 0,
  totalSlides = 1,
  canvasWidth = 960,
  canvasHeight = 540,
  zoom = 100,
  onZoomChange,
  onCanvasSizeChange,
}: LayoutToolsProps) => {
  const { language } = useLanguage();

  // Align element to canvas
  const alignElement = (alignment: string) => {
    if (!selectedElement) return;
    
    let updates: Partial<SlideElement> = {};
    
    switch (alignment) {
      case 'left':
        updates.x = 0;
        break;
      case 'center':
        updates.x = (canvasWidth - selectedElement.width) / 2;
        break;
      case 'right':
        updates.x = canvasWidth - selectedElement.width;
        break;
      case 'top':
        updates.y = 0;
        break;
      case 'middle':
        updates.y = (canvasHeight - selectedElement.height) / 2;
        break;
      case 'bottom':
        updates.y = canvasHeight - selectedElement.height;
        break;
    }
    
    onUpdateElement(updates);
  };

  // Quick position presets
  const positionPresets = [
    { name: language === 'ar' ? 'أعلى يسار' : 'Top Left', x: 20, y: 20 },
    { name: language === 'ar' ? 'أعلى وسط' : 'Top Center', x: (canvasWidth - (selectedElement?.width || 100)) / 2, y: 20 },
    { name: language === 'ar' ? 'أعلى يمين' : 'Top Right', x: canvasWidth - (selectedElement?.width || 100) - 20, y: 20 },
    { name: language === 'ar' ? 'وسط يسار' : 'Middle Left', x: 20, y: (canvasHeight - (selectedElement?.height || 100)) / 2 },
    { name: language === 'ar' ? 'وسط' : 'Center', x: (canvasWidth - (selectedElement?.width || 100)) / 2, y: (canvasHeight - (selectedElement?.height || 100)) / 2 },
    { name: language === 'ar' ? 'وسط يمين' : 'Middle Right', x: canvasWidth - (selectedElement?.width || 100) - 20, y: (canvasHeight - (selectedElement?.height || 100)) / 2 },
    { name: language === 'ar' ? 'أسفل يسار' : 'Bottom Left', x: 20, y: canvasHeight - (selectedElement?.height || 100) - 20 },
    { name: language === 'ar' ? 'أسفل وسط' : 'Bottom Center', x: (canvasWidth - (selectedElement?.width || 100)) / 2, y: canvasHeight - (selectedElement?.height || 100) - 20 },
    { name: language === 'ar' ? 'أسفل يمين' : 'Bottom Right', x: canvasWidth - (selectedElement?.width || 100) - 20, y: canvasHeight - (selectedElement?.height || 100) - 20 },
  ];

  return (
    <div className="space-y-4">
      <Tabs defaultValue="slide" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="slide" className="text-xs">
            {language === 'ar' ? 'الشريحة' : 'Slide'}
          </TabsTrigger>
          <TabsTrigger value="element" className="text-xs">
            {language === 'ar' ? 'العنصر' : 'Element'}
          </TabsTrigger>
          <TabsTrigger value="grid" className="text-xs">
            {language === 'ar' ? 'الشبكة' : 'Grid'}
          </TabsTrigger>
        </TabsList>

        {/* Slide Tab */}
        <TabsContent value="slide" className="space-y-4 mt-4">
          {/* Slide Type */}
          <div className="space-y-2">
            <Label className="text-xs">{language === 'ar' ? 'نوع الشريحة' : 'Slide Type'}</Label>
            <div className="grid grid-cols-3 gap-2">
              {/* Cover - رسالة ترحيب */}
              <button
                className={`relative p-1.5 rounded-lg border-2 transition-all ${
                  slide.type === 'cover' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSlideTypeChange('cover')}
                title={language === 'ar' ? 'شريحة الغلاف' : 'Cover slide'}
              >
                <div className="aspect-video rounded overflow-hidden flex">
                  <div className="w-1/2 bg-gradient-to-b from-teal-500 to-teal-600 p-1 flex flex-col justify-end">
                    <div className="w-full h-2 bg-teal-700/50 rounded-t" />
                    <div className="flex gap-px">
                      <div className="flex-1 h-3 bg-teal-700/30" />
                      <div className="flex-1 h-4 bg-teal-700/30" />
                      <div className="flex-1 h-2 bg-teal-700/30" />
                    </div>
                  </div>
                  <div className="w-1/2 bg-rose-100 flex items-center justify-center">
                    <div className="w-4 h-5 bg-rose-300 rounded-t-full" />
                  </div>
                </div>
                <span className="text-[9px] mt-1 block text-center">{language === 'ar' ? 'غلاف' : 'Cover'}</span>
              </button>

              {/* Content - الرموز والنص */}
              <button
                className={`relative p-1.5 rounded-lg border-2 transition-all ${
                  slide.type === 'content' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSlideTypeChange('content')}
                title={language === 'ar' ? 'محتوى مع أيقونات' : 'Content with icons'}
              >
                <div className="aspect-video bg-white rounded overflow-hidden p-1">
                  <div className="w-full h-1.5 bg-slate-200 rounded mb-1" />
                  <div className="grid grid-cols-3 gap-0.5">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                      <div className="w-full h-0.5 bg-slate-200 mt-0.5" />
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      <div className="w-full h-0.5 bg-slate-200 mt-0.5" />
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-full h-0.5 bg-slate-200 mt-0.5" />
                    </div>
                  </div>
                </div>
                <span className="text-[9px] mt-1 block text-center">{language === 'ar' ? 'محتوى' : 'Content'}</span>
              </button>

              {/* Section - فاصل */}
              <button
                className={`relative p-1.5 rounded-lg border-2 transition-all ${
                  slide.type === 'section' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSlideTypeChange('section')}
                title={language === 'ar' ? 'فاصل أقسام' : 'Section divider'}
              >
                <div className="aspect-video rounded overflow-hidden flex">
                  <div className="w-1/3 bg-teal-500" />
                  <div className="w-2/3 bg-slate-100 flex items-center justify-center">
                    <div className="w-6 h-1 bg-slate-300 rounded" />
                  </div>
                </div>
                <span className="text-[9px] mt-1 block text-center">{language === 'ar' ? 'قسم' : 'Section'}</span>
              </button>

              {/* Image - صورة مع نص */}
              <button
                className={`relative p-1.5 rounded-lg border-2 transition-all ${
                  slide.type === 'image' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSlideTypeChange('image')}
                title={language === 'ar' ? 'صورة مع نص' : 'Image with text'}
              >
                <div className="aspect-video rounded overflow-hidden flex">
                  <div className="w-1/2 bg-teal-500 flex items-center justify-center p-1">
                    <div className="w-full h-full border-2 border-white/30 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-white/50 rounded-full" />
                    </div>
                  </div>
                  <div className="w-1/2 bg-rose-400 flex flex-col justify-center p-1 gap-0.5">
                    <div className="w-full h-0.5 bg-white/70 rounded" />
                    <div className="w-3/4 h-0.5 bg-white/50 rounded" />
                    <div className="w-1/2 h-0.5 bg-white/50 rounded" />
                  </div>
                </div>
                <span className="text-[9px] mt-1 block text-center">{language === 'ar' ? 'صورة' : 'Image'}</span>
              </button>

              {/* Comparison - مقارنة */}
              <button
                className={`relative p-1.5 rounded-lg border-2 transition-all ${
                  slide.type === 'comparison' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSlideTypeChange('comparison')}
                title={language === 'ar' ? 'مقارنة عمودين' : 'Two column comparison'}
              >
                <div className="aspect-video rounded overflow-hidden flex">
                  <div className="w-1/2 bg-teal-500 flex flex-col p-0.5 gap-0.5">
                    <div className="h-1.5 bg-white/30 rounded" />
                    <div className="h-1.5 bg-white/30 rounded" />
                    <div className="h-1.5 bg-white/30 rounded" />
                  </div>
                  <div className="w-1/2 bg-rose-400 flex flex-col p-0.5 gap-0.5">
                    <div className="h-1.5 bg-white/30 rounded" />
                    <div className="h-1.5 bg-white/30 rounded" />
                    <div className="h-1.5 bg-white/30 rounded" />
                  </div>
                </div>
                <span className="text-[9px] mt-1 block text-center">{language === 'ar' ? 'مقارنة' : 'Compare'}</span>
              </button>

              {/* Chart - التسلسل الهرمي */}
              <button
                className={`relative p-1.5 rounded-lg border-2 transition-all ${
                  slide.type === 'chart' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSlideTypeChange('chart')}
                title={language === 'ar' ? 'هيكل تنظيمي' : 'Organization chart'}
              >
                <div className="aspect-video bg-teal-500 rounded overflow-hidden p-1">
                  <div className="flex justify-center mb-0.5">
                    <div className="w-4 h-1.5 bg-teal-200 rounded" />
                  </div>
                  <div className="flex justify-center gap-1">
                    <div className="w-3 h-1.5 bg-teal-300 rounded" />
                    <div className="w-3 h-1.5 bg-teal-300 rounded" />
                    <div className="w-3 h-1.5 bg-teal-300 rounded" />
                  </div>
                  <div className="flex justify-center gap-0.5 mt-0.5">
                    <div className="w-2 h-1 bg-teal-400 rounded" />
                    <div className="w-2 h-1 bg-teal-400 rounded" />
                    <div className="w-2 h-1 bg-teal-400 rounded" />
                    <div className="w-2 h-1 bg-teal-400 rounded" />
                  </div>
                </div>
                <span className="text-[9px] mt-1 block text-center">{language === 'ar' ? 'هيكل' : 'Chart'}</span>
              </button>

              {/* Timeline - التسميات والرموز */}
              <button
                className={`relative p-1.5 rounded-lg border-2 transition-all ${
                  slide.type === 'timeline' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSlideTypeChange('timeline')}
                title={language === 'ar' ? 'خط زمني' : 'Timeline'}
              >
                <div className="aspect-video bg-slate-100 rounded overflow-hidden p-1 flex flex-col justify-center gap-0.5">
                  <div className="flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-sm bg-teal-500 rotate-45" />
                    <div className="flex-1 h-1 bg-rose-400 rounded-r" />
                  </div>
                  <div className="flex items-center gap-0.5 flex-row-reverse">
                    <div className="w-1.5 h-1.5 rounded-sm bg-teal-500 rotate-45" />
                    <div className="flex-1 h-1 bg-teal-400 rounded-l" />
                  </div>
                  <div className="flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-sm bg-teal-500 rotate-45" />
                    <div className="flex-1 h-1 bg-rose-400 rounded-r" />
                  </div>
                </div>
                <span className="text-[9px] mt-1 block text-center">{language === 'ar' ? 'زمني' : 'Timeline'}</span>
              </button>

              {/* Quote - المهارات */}
              <button
                className={`relative p-1.5 rounded-lg border-2 transition-all ${
                  slide.type === 'quote' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSlideTypeChange('quote')}
                title={language === 'ar' ? 'اقتباس أو مهارات' : 'Quote or skills'}
              >
                <div className="aspect-video rounded overflow-hidden flex">
                  <div className="w-2/3 bg-slate-100 p-1 flex flex-col gap-0.5">
                    <div className="flex items-center gap-0.5">
                      <div className="w-1 h-1 rounded-full bg-teal-500" />
                      <div className="flex-1 h-0.5 bg-slate-300 rounded" />
                    </div>
                    <div className="flex items-center gap-0.5">
                      <div className="w-1 h-1 rounded-full bg-rose-400" />
                      <div className="flex-1 h-0.5 bg-slate-300 rounded" />
                    </div>
                    <div className="flex items-center gap-0.5">
                      <div className="w-1 h-1 rounded-full bg-amber-400" />
                      <div className="flex-1 h-0.5 bg-slate-300 rounded" />
                    </div>
                  </div>
                  <div className="w-1/3 bg-teal-500 flex items-center justify-center">
                    <div className="text-white text-[8px] font-bold">&lt;</div>
                  </div>
                </div>
                <span className="text-[9px] mt-1 block text-center">{language === 'ar' ? 'اقتباس' : 'Quote'}</span>
              </button>

              {/* Team - فريق الإدارة */}
              <button
                className={`relative p-1.5 rounded-lg border-2 transition-all ${
                  slide.type === 'team' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSlideTypeChange('team')}
                title={language === 'ar' ? 'فريق العمل' : 'Team members'}
              >
                <div className="aspect-video rounded overflow-hidden flex">
                  <div className="w-1/2 bg-teal-500 flex items-end justify-center gap-0.5 pb-1">
                    <div className="w-2 h-4 bg-slate-700 rounded-t" />
                    <div className="w-2 h-5 bg-slate-600 rounded-t" />
                    <div className="w-2 h-4 bg-slate-700 rounded-t" />
                  </div>
                  <div className="w-1/2 bg-rose-400 flex items-end justify-center gap-0.5 pb-1">
                    <div className="w-2 h-4 bg-slate-700 rounded-t" />
                    <div className="w-2 h-5 bg-slate-600 rounded-t" />
                  </div>
                </div>
                <span className="text-[9px] mt-1 block text-center">{language === 'ar' ? 'فريق' : 'Team'}</span>
              </button>

              {/* Agenda - توليد الأفكار */}
              <button
                className={`relative p-1.5 rounded-lg border-2 transition-all ${
                  slide.type === 'agenda' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSlideTypeChange('agenda')}
                title={language === 'ar' ? 'جدول أعمال' : 'Agenda'}
              >
                <div className="aspect-video bg-slate-100 rounded overflow-hidden p-1">
                  <div className="flex items-start gap-1">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-amber-400 border-2 border-amber-500" />
                      <div className="w-0.5 h-2 bg-slate-300" />
                      <div className="w-2 h-2 rounded-full bg-teal-400" />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="h-1.5 bg-rose-400 rounded w-3/4" />
                      <div className="h-1.5 bg-teal-400 rounded w-full" />
                    </div>
                  </div>
                </div>
                <span className="text-[9px] mt-1 block text-center">{language === 'ar' ? 'أجندة' : 'Agenda'}</span>
              </button>

              {/* Thank You - قادة الصناعة */}
              <button
                className={`relative p-1.5 rounded-lg border-2 transition-all ${
                  slide.type === 'thankyou' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSlideTypeChange('thankyou')}
                title={language === 'ar' ? 'شريحة ختامية' : 'Closing slide'}
              >
                <div className="aspect-video bg-slate-100 rounded overflow-hidden">
                  <div className="h-1/3 bg-teal-500 flex items-center justify-center">
                    <div className="flex gap-0.5">
                      <div className="w-1.5 h-2 bg-slate-700 rounded-t" />
                      <div className="w-1.5 h-2.5 bg-slate-600 rounded-t" />
                      <div className="w-1.5 h-2 bg-slate-700 rounded-t" />
                    </div>
                  </div>
                  <div className="h-2/3 p-0.5 grid grid-cols-2 gap-0.5">
                    <div className="bg-teal-100 rounded" />
                    <div className="bg-rose-100 rounded" />
                    <div className="bg-amber-100 rounded" />
                    <div className="bg-teal-100 rounded" />
                  </div>
                </div>
                <span className="text-[9px] mt-1 block text-center">{language === 'ar' ? 'شكراً' : 'Thanks'}</span>
              </button>

              {/* Features - المميزات */}
              <button
                className={`relative p-1.5 rounded-lg border-2 transition-all ${
                  slide.type === 'features' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSlideTypeChange('features')}
                title={language === 'ar' ? 'المميزات' : 'Features'}
              >
                <div className="aspect-video bg-white rounded overflow-hidden p-1">
                  <div className="h-1.5 bg-slate-200 rounded mb-1 w-1/2 mx-auto" />
                  <div className="grid grid-cols-3 gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded bg-teal-400 mb-0.5" />
                        <div className="w-full h-0.5 bg-slate-200 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
                <span className="text-[9px] mt-1 block text-center">{language === 'ar' ? 'مميزات' : 'Features'}</span>
              </button>

              {/* Pricing - الأسعار */}
              <button
                className={`relative p-1.5 rounded-lg border-2 transition-all ${
                  slide.type === 'pricing' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSlideTypeChange('pricing')}
                title={language === 'ar' ? 'جدول الأسعار' : 'Pricing table'}
              >
                <div className="aspect-video bg-slate-100 rounded overflow-hidden p-0.5 flex gap-0.5">
                  <div className="flex-1 bg-white rounded p-0.5 flex flex-col">
                    <div className="h-1 bg-slate-300 rounded mb-0.5" />
                    <div className="h-2 bg-teal-200 rounded" />
                  </div>
                  <div className="flex-1 bg-teal-500 rounded p-0.5 flex flex-col">
                    <div className="h-1 bg-white/50 rounded mb-0.5" />
                    <div className="h-2 bg-white/30 rounded" />
                  </div>
                  <div className="flex-1 bg-white rounded p-0.5 flex flex-col">
                    <div className="h-1 bg-slate-300 rounded mb-0.5" />
                    <div className="h-2 bg-teal-200 rounded" />
                  </div>
                </div>
                <span className="text-[9px] mt-1 block text-center">{language === 'ar' ? 'أسعار' : 'Pricing'}</span>
              </button>

              {/* Stats - الإحصائيات */}
              <button
                className={`relative p-1.5 rounded-lg border-2 transition-all ${
                  slide.type === 'stats' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSlideTypeChange('stats')}
                title={language === 'ar' ? 'إحصائيات' : 'Statistics'}
              >
                <div className="aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 rounded overflow-hidden p-1 flex justify-around items-center">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="text-[8px] font-bold text-white">99+</div>
                      <div className="w-3 h-0.5 bg-white/50 rounded" />
                    </div>
                  ))}
                </div>
                <span className="text-[9px] mt-1 block text-center">{language === 'ar' ? 'إحصائيات' : 'Stats'}</span>
              </button>

              {/* Process - المراحل */}
              <button
                className={`relative p-1.5 rounded-lg border-2 transition-all ${
                  slide.type === 'process' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSlideTypeChange('process')}
                title={language === 'ar' ? 'خطوات العملية' : 'Process steps'}
              >
                <div className="aspect-video bg-white rounded overflow-hidden p-1">
                  <div className="flex items-center justify-between">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-teal-500 flex items-center justify-center text-[6px] text-white font-bold">{i}</div>
                        {i < 4 && <div className="w-2 h-0.5 bg-teal-300" />}
                      </div>
                    ))}
                  </div>
                </div>
                <span className="text-[9px] mt-1 block text-center">{language === 'ar' ? 'مراحل' : 'Process'}</span>
              </button>

              {/* Gallery - معرض */}
              <button
                className={`relative p-1.5 rounded-lg border-2 transition-all ${
                  slide.type === 'gallery' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSlideTypeChange('gallery')}
                title={language === 'ar' ? 'معرض صور' : 'Image gallery'}
              >
                <div className="aspect-video bg-slate-900 rounded overflow-hidden p-0.5 grid grid-cols-3 gap-0.5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-gradient-to-br from-slate-700 to-slate-800 rounded" />
                  ))}
                </div>
                <span className="text-[9px] mt-1 block text-center">{language === 'ar' ? 'معرض' : 'Gallery'}</span>
              </button>

              {/* Contact - تواصل */}
              <button
                className={`relative p-1.5 rounded-lg border-2 transition-all ${
                  slide.type === 'contact' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSlideTypeChange('contact')}
                title={language === 'ar' ? 'معلومات التواصل' : 'Contact info'}
              >
                <div className="aspect-video rounded overflow-hidden flex">
                  <div className="w-1/2 bg-teal-500 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white rounded-full" />
                  </div>
                  <div className="w-1/2 bg-slate-100 p-1 flex flex-col justify-center gap-0.5">
                    <div className="h-0.5 bg-slate-300 rounded w-full" />
                    <div className="h-0.5 bg-slate-300 rounded w-3/4" />
                    <div className="h-0.5 bg-slate-300 rounded w-1/2" />
                  </div>
                </div>
                <span className="text-[9px] mt-1 block text-center">{language === 'ar' ? 'تواصل' : 'Contact'}</span>
              </button>

              {/* Blank */}
              <button
                className={`relative p-1.5 rounded-lg border-2 transition-all ${
                  slide.type === 'blank' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSlideTypeChange('blank')}
                title={language === 'ar' ? 'شريحة فارغة' : 'Empty slide'}
              >
                <div className="aspect-video bg-white rounded border border-dashed border-slate-300 flex items-center justify-center">
                  <div className="w-3 h-3 border-2 border-dashed border-slate-300 rounded" />
                </div>
                <span className="text-[9px] mt-1 block text-center">{language === 'ar' ? 'فارغة' : 'Blank'}</span>
              </button>
            </div>
          </div>

          {/* Quick Slide Templates based on type */}
          {slide.type && slide.type !== 'blank' && (
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs">{language === 'ar' ? 'قوالب سريعة' : 'Quick Templates'}</Label>
              <div className="grid grid-cols-2 gap-2">
                {getQuickTemplates(slide.type, language).map((template, i) => (
                  <button
                    key={i}
                    className="p-2 rounded border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left"
                    onClick={() => {
                      onBackgroundColorChange(template.bg);
                      onTextColorChange(template.text);
                    }}
                  >
                    <div 
                      className="w-full h-8 rounded mb-1 flex items-center justify-center text-xs"
                      style={{ background: template.bg, color: template.text }}
                    >
                      Aa
                    </div>
                    <span className="text-[10px] text-muted-foreground">{template.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Theme Presets */}
          <div className="space-y-2">
            <Label className="text-xs">{language === 'ar' ? 'قوالب الألوان' : 'Theme Presets'}</Label>
            <div className="grid grid-cols-2 gap-2">
              {themePresets.map((theme, i) => (
                <button
                  key={i}
                  className="h-12 rounded-lg border-2 border-border hover:border-primary transition-colors overflow-hidden relative group"
                  style={{ background: theme.bg }}
                  onClick={() => {
                    onBackgroundColorChange(theme.bg);
                    onTextColorChange(theme.text);
                  }}
                >
                  <span 
                    className="absolute inset-0 flex items-center justify-center text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: theme.text, backgroundColor: 'rgba(0,0,0,0.3)' }}
                  >
                    {language === 'ar' ? theme.name.ar : theme.name.en}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Slide Actions */}
          <div className="space-y-2 pt-3 border-t">
            <Label className="text-xs">{language === 'ar' ? 'إجراءات الشريحة' : 'Slide Actions'}</Label>
            <div className="space-y-2">
              {onDuplicateSlide && (
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={onDuplicateSlide}>
                  <Copy className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'تكرار الشريحة' : 'Duplicate Slide'}
                </Button>
              )}
              <div className="flex gap-2">
                {onMoveSlide && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => onMoveSlide('up')}
                      disabled={slideIndex === 0}
                    >
                      <ArrowUp className="w-4 h-4 mr-1" />
                      {language === 'ar' ? 'لأعلى' : 'Up'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => onMoveSlide('down')}
                      disabled={slideIndex === totalSlides - 1}
                    >
                      <ArrowDown className="w-4 h-4 mr-1" />
                      {language === 'ar' ? 'لأسفل' : 'Down'}
                    </Button>
                  </>
                )}
              </div>
              {onDeleteSlide && totalSlides > 1 && (
                <Button variant="destructive" size="sm" className="w-full" onClick={onDeleteSlide}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'حذف الشريحة' : 'Delete Slide'}
                </Button>
              )}
            </div>
          </div>

          {/* Slide Info */}
          <div className="space-y-2 pt-3 border-t">
            <Label className="text-xs text-muted-foreground">{language === 'ar' ? 'معلومات الشريحة' : 'Slide Info'}</Label>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>{language === 'ar' ? 'الشريحة' : 'Slide'}: {slideIndex + 1} / {totalSlides}</p>
              <p>{language === 'ar' ? 'الأبعاد' : 'Dimensions'}: {canvasWidth} × {canvasHeight}px</p>
              <p>{language === 'ar' ? 'العناصر' : 'Elements'}: {slide.elements?.length || 0}</p>
            </div>
          </div>
        </TabsContent>

        {/* Element Tab */}
        <TabsContent value="element" className="space-y-4 mt-4">
          {selectedElement ? (
            <>
              {/* Position */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Move className="w-3 h-3" />
                  {language === 'ar' ? 'الموضع' : 'Position'}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">X</Label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.x)}
                      onChange={(e) => onUpdateElement({ x: Number(e.target.value) })}
                      className="w-full text-sm bg-background border rounded px-2 py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Y</Label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.y)}
                      onChange={(e) => onUpdateElement({ y: Number(e.target.value) })}
                      className="w-full text-sm bg-background border rounded px-2 py-1"
                    />
                  </div>
                </div>
              </div>

              {/* Size */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Maximize2 className="w-3 h-3" />
                  {language === 'ar' ? 'الحجم' : 'Size'}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{language === 'ar' ? 'العرض' : 'W'}</Label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.width)}
                      onChange={(e) => onUpdateElement({ width: Number(e.target.value) })}
                      className="w-full text-sm bg-background border rounded px-2 py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{language === 'ar' ? 'الارتفاع' : 'H'}</Label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.height)}
                      onChange={(e) => onUpdateElement({ height: Number(e.target.value) })}
                      className="w-full text-sm bg-background border rounded px-2 py-1"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Position */}
              <div className="space-y-2">
                <Label className="text-xs">{language === 'ar' ? 'موضع سريع' : 'Quick Position'}</Label>
                <div className="grid grid-cols-3 gap-1">
                  {positionPresets.map((preset, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs p-1 h-8"
                      onClick={() => onUpdateElement({ x: preset.x, y: preset.y })}
                      title={preset.name}
                    >
                      {['↖', '↑', '↗', '←', '•', '→', '↙', '↓', '↘'][i]}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Alignment */}
              <div className="space-y-2">
                <Label className="text-xs">{language === 'ar' ? 'المحاذاة' : 'Alignment'}</Label>
                <div className="space-y-1">
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="flex-1 p-1" onClick={() => alignElement('left')} title={language === 'ar' ? 'يسار' : 'Left'}>
                      <AlignLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 p-1" onClick={() => alignElement('center')} title={language === 'ar' ? 'وسط' : 'Center'}>
                      <AlignCenter className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 p-1" onClick={() => alignElement('right')} title={language === 'ar' ? 'يمين' : 'Right'}>
                      <AlignRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="flex-1 p-1" onClick={() => alignElement('top')} title={language === 'ar' ? 'أعلى' : 'Top'}>
                      <AlignStartVertical className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 p-1" onClick={() => alignElement('middle')} title={language === 'ar' ? 'وسط' : 'Middle'}>
                      <AlignCenterVertical className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 p-1" onClick={() => alignElement('bottom')} title={language === 'ar' ? 'أسفل' : 'Bottom'}>
                      <AlignEndVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Transform */}
              <div className="space-y-2">
                <Label className="text-xs">{language === 'ar' ? 'التحويل' : 'Transform'}</Label>
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 p-1"
                    onClick={() => onUpdateElement({ flipHorizontal: !selectedElement.flipHorizontal })}
                    title={language === 'ar' ? 'قلب أفقي' : 'Flip H'}
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 p-1"
                    onClick={() => onUpdateElement({ flipVertical: !selectedElement.flipVertical })}
                    title={language === 'ar' ? 'قلب رأسي' : 'Flip V'}
                  >
                    <FlipVertical className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 p-1"
                    onClick={() => onUpdateElement({ imageRotation: ((selectedElement.imageRotation || 0) + 90) % 360 })}
                    title={language === 'ar' ? 'تدوير' : 'Rotate'}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Layer Order */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {language === 'ar' ? 'ترتيب الطبقات' : 'Layer Order'}
                </Label>
                <div className="grid grid-cols-2 gap-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={() => onUpdateElement({ zIndex: (selectedElement.zIndex || 1) + 1 })}
                  >
                    ↑ {language === 'ar' ? 'للأمام' : 'Forward'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={() => onUpdateElement({ zIndex: Math.max(1, (selectedElement.zIndex || 1) - 1) })}
                  >
                    ↓ {language === 'ar' ? 'للخلف' : 'Back'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={() => onUpdateElement({ zIndex: 999 })}
                  >
                    ⤒ {language === 'ar' ? 'أمام الكل' : 'To Front'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={() => onUpdateElement({ zIndex: 1 })}
                  >
                    ⤓ {language === 'ar' ? 'خلف الكل' : 'To Back'}
                  </Button>
                </div>
              </div>

              {/* Lock & Visibility */}
              <div className="space-y-2">
                <Label className="text-xs">{language === 'ar' ? 'القفل والرؤية' : 'Lock & Visibility'}</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={selectedElement.locked ? 'default' : 'outline'} 
                    size="sm"
                    className="flex-1"
                    onClick={() => onUpdateElement({ locked: !selectedElement.locked })}
                  >
                    {selectedElement.locked ? <Lock className="w-4 h-4 mr-1" /> : <Unlock className="w-4 h-4 mr-1" />}
                    {language === 'ar' ? (selectedElement.locked ? 'مقفل' : 'قفل') : (selectedElement.locked ? 'Locked' : 'Lock')}
                  </Button>
                  <Button 
                    variant={selectedElement.visible === false ? 'default' : 'outline'} 
                    size="sm"
                    className="flex-1"
                    onClick={() => onUpdateElement({ visible: selectedElement.visible === false ? true : false })}
                  >
                    {selectedElement.visible === false ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    {language === 'ar' ? (selectedElement.visible === false ? 'مخفي' : 'إخفاء') : (selectedElement.visible === false ? 'Hidden' : 'Hide')}
                  </Button>
                </div>
              </div>

              {/* Element Info */}
              <div className="space-y-1 pt-3 border-t">
                <Label className="text-xs text-muted-foreground">{language === 'ar' ? 'معلومات العنصر' : 'Element Info'}</Label>
                <div className="text-xs text-muted-foreground">
                  <p>{language === 'ar' ? 'النوع' : 'Type'}: {selectedElement.type}</p>
                  <p>Z-Index: {selectedElement.zIndex || 1}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{language === 'ar' ? 'اختر عنصر لتعديله' : 'Select an element to edit'}</p>
            </div>
          )}
        </TabsContent>

        {/* Grid Tab */}
        <TabsContent value="grid" className="space-y-4 mt-4">
          {/* Canvas Size */}
          <div className="space-y-3">
            <Label className="text-xs">{language === 'ar' ? 'حجم الشريحة' : 'Slide Size'}</Label>
            
            {/* PowerPoint Standard Sizes */}
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground font-medium">
                {language === 'ar' ? 'أحجام PowerPoint القياسية' : 'PowerPoint Standard'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: language === 'ar' ? 'عريض (16:9)' : 'Widescreen (16:9)', w: 1920, h: 1080, desc: '1920×1080' },
                  { name: language === 'ar' ? 'قياسي (4:3)' : 'Standard (4:3)', w: 1024, h: 768, desc: '1024×768' },
                  { name: language === 'ar' ? 'عريض (16:10)' : 'Widescreen (16:10)', w: 1920, h: 1200, desc: '1920×1200' },
                  { name: language === 'ar' ? 'شاشة عريضة' : 'On-screen Show (16:9)', w: 1280, h: 720, desc: '1280×720' },
                ].map((size) => (
                  <Button
                    key={size.name}
                    variant={canvasWidth === size.w && canvasHeight === size.h ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs flex flex-col h-auto py-2"
                    onClick={() => onCanvasSizeChange?.(size.w, size.h)}
                  >
                    <span>{size.name}</span>
                    <span className="text-[9px] opacity-70">{size.desc}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Print Sizes */}
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground font-medium">
                {language === 'ar' ? 'أحجام الطباعة' : 'Print Sizes'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'A4', w: 1122, h: 793, desc: language === 'ar' ? 'أفقي' : 'Landscape' },
                  { name: 'A4', w: 793, h: 1122, desc: language === 'ar' ? 'عمودي' : 'Portrait' },
                  { name: 'Letter', w: 1056, h: 816, desc: language === 'ar' ? 'أفقي' : 'Landscape' },
                  { name: 'Letter', w: 816, h: 1056, desc: language === 'ar' ? 'عمودي' : 'Portrait' },
                ].map((size, idx) => (
                  <Button
                    key={`${size.name}-${idx}`}
                    variant={canvasWidth === size.w && canvasHeight === size.h ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs flex flex-col h-auto py-2"
                    onClick={() => onCanvasSizeChange?.(size.w, size.h)}
                  >
                    <span>{size.name}</span>
                    <span className="text-[9px] opacity-70">{size.desc}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Social Media Sizes */}
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground font-medium">
                {language === 'ar' ? 'وسائل التواصل' : 'Social Media'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Instagram', w: 1080, h: 1080, desc: language === 'ar' ? 'مربع' : 'Square' },
                  { name: 'Instagram', w: 1080, h: 1920, desc: language === 'ar' ? 'ستوري' : 'Story' },
                  { name: 'Facebook', w: 1200, h: 630, desc: language === 'ar' ? 'منشور' : 'Post' },
                  { name: 'LinkedIn', w: 1200, h: 627, desc: language === 'ar' ? 'منشور' : 'Post' },
                  { name: 'Twitter/X', w: 1600, h: 900, desc: language === 'ar' ? 'منشور' : 'Post' },
                  { name: 'YouTube', w: 1280, h: 720, desc: language === 'ar' ? 'صورة مصغرة' : 'Thumbnail' },
                ].map((size, idx) => (
                  <Button
                    key={`${size.name}-${idx}`}
                    variant={canvasWidth === size.w && canvasHeight === size.h ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs flex flex-col h-auto py-2"
                    onClick={() => onCanvasSizeChange?.(size.w, size.h)}
                  >
                    <span>{size.name}</span>
                    <span className="text-[9px] opacity-70">{size.desc}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Size */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-[10px] text-muted-foreground font-medium">
                {language === 'ar' ? 'حجم مخصص' : 'Custom Size'}
              </p>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Label className="text-[10px]">{language === 'ar' ? 'العرض' : 'Width'}</Label>
                  <input
                    type="number"
                    value={canvasWidth}
                    onChange={(e) => onCanvasSizeChange?.(Number(e.target.value), canvasHeight)}
                    className="w-full text-xs bg-background border rounded px-2 py-1"
                    min={320}
                    max={3840}
                  />
                </div>
                <span className="text-muted-foreground mt-4">×</span>
                <div className="flex-1">
                  <Label className="text-[10px]">{language === 'ar' ? 'الارتفاع' : 'Height'}</Label>
                  <input
                    type="number"
                    value={canvasHeight}
                    onChange={(e) => onCanvasSizeChange?.(canvasWidth, Number(e.target.value))}
                    className="w-full text-xs bg-background border rounded px-2 py-1"
                    min={240}
                    max={2160}
                  />
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground text-center">
                {language === 'ar' ? `الحجم الحالي: ${canvasWidth}×${canvasHeight}` : `Current: ${canvasWidth}×${canvasHeight}`}
              </p>
            </div>
          </div>

          {/* Add Table Section */}
          <div className="space-y-3 pt-3 border-t">
            <Label className="text-xs font-semibold">{language === 'ar' ? 'إضافة جدول' : 'Add Table'}</Label>
            <p className="text-[10px] text-muted-foreground">
              {language === 'ar' 
                ? 'أضف جداول قابلة للتعديل مع تنسيق كامل'
                : 'Add editable tables with full formatting'}
            </p>
            {/* Table size selector */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">{language === 'ar' ? 'الصفوف' : 'Rows'}</Label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  defaultValue="3"
                  id="table-rows"
                  className="w-full text-xs bg-background border rounded px-2 py-1"
                />
              </div>
              <div>
                <Label className="text-[10px]">{language === 'ar' ? 'الأعمدة' : 'Columns'}</Label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  defaultValue="3"
                  id="table-cols"
                  className="w-full text-xs bg-background border rounded px-2 py-1"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-lg h-9 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              onClick={() => {
                const rows = Number((document.getElementById('table-rows') as HTMLInputElement)?.value || 3);
                const cols = Number((document.getElementById('table-cols') as HTMLInputElement)?.value || 3);
                
                const tableData = Array(rows).fill(null).map((_, i) => 
                  Array(cols).fill(null).map((_, j) => 
                    i === 0 ? `${language === 'ar' ? 'عمود' : 'Column'} ${j + 1}` : ''
                  )
                );
                
                onAddElement?.({
                  type: 'table',
                  x: 100,
                  y: 100,
                  width: 400,
                  height: 200,
                  tableConfig: {
                    rows,
                    cols,
                    cells: tableData.map((row: string[], i: number) => row.map((cell: string) => ({ content: cell }))),
                    headerRow: true,
                    headerCol: false,
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    cellPadding: 8,
                  },
                });
              }}
            >
              {language === 'ar' ? 'إضافة جدول' : 'Add Table'}
            </Button>
          </div>

          {/* Zoom Presets */}
          <div className="space-y-3 pt-3 border-t">
            <div className="flex justify-between items-center">
              <Label className="text-xs">{language === 'ar' ? 'التكبير' : 'Zoom'}</Label>
              <span className="text-xs text-muted-foreground">{zoom}%</span>
            </div>
            <div className="flex gap-1">
              {[50, 75, 100, 125, 150].map((z) => (
                <Button
                  key={z}
                  variant={zoom === z ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => onZoomChange?.(z)}
                >
                  {z}%
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LayoutTools;
