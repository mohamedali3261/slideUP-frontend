import { useRef, useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SlideTemplate, SlideElement } from '@/data/templates';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Type, Image, Palette, Layout, Square, Circle, Minus, ArrowRight, Trash2, Upload, Smile, Table, Code, Sparkles, LucideIcon, ImagePlus, Shapes, Paintbrush, FileImage, Sticker, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { IconLibrary, IconConfig } from './IconLibrary';
import { DecorativeLibrary } from './DecorativeLibrary';
import { TableCreator } from './TableEditor';
import { CodeBlockCreator, CodeConfig } from './CodeBlock';
import { GradientBackground } from './GradientBackground';
import { AdvancedColorTools } from './AdvancedColorTools';
import { LayoutTools } from './LayoutTools';
import { AnimationTab } from './AnimationTab';
import { SlideTransition } from './AnimationControls';
import { PexelsImageSearch } from './PexelsImageSearch';
import type { BorderConfig, ShadowConfig, FiltersConfig } from '@/data/templates';

// Custom icon storage key (same as IconLibrary)
const CUSTOM_ICONS_KEY = 'slideforge_custom_icons';

// Custom icon interface (same as IconLibrary)
interface CustomIcon {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: number;
}

// Load custom icons from localStorage
const loadCustomIcons = (): CustomIcon[] => {
  try {
    const data = localStorage.getItem(CUSTOM_ICONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

interface PropertiesPanelProps {
  slide: SlideTemplate;
  selectedElement: SlideElement | null;
  onBackgroundColorChange: (color: string) => void;
  onTextColorChange: (color: string) => void;
  onAddElement: (element: Omit<SlideElement, 'id'>) => void;
  onAddElements?: (elements: Omit<SlideElement, 'id'>[]) => void;
  onUpdateElement: (updates: Partial<SlideElement>) => void;
  onDeleteElement: () => void;
  onSlideTypeChange: (type: SlideTemplate['type']) => void;
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
  // Animation props
  elements?: SlideElement[];
  onUpdateElementById?: (id: string, updates: Partial<SlideElement>) => void;
  slideTransition?: SlideTransition;
  onSlideTransitionChange?: (transition: SlideTransition) => void;
}

export const PropertiesPanel = ({
  slide,
  selectedElement,
  onBackgroundColorChange,
  onTextColorChange,
  onAddElement,
  onAddElements,
  onUpdateElement,
  onDeleteElement,
  onSlideTypeChange,
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
  elements = [],
  onUpdateElementById,
  slideTransition,
  onSlideTransitionChange,
}: PropertiesPanelProps) => {
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [elementOpacity, setElementOpacity] = useState(100);
  const [elementBorder, setElementBorder] = useState<BorderConfig>({ width: 0, color: '#000000', style: 'solid' });
  const [elementShadow, setElementShadow] = useState<ShadowConfig>({ enabled: false, x: 2, y: 2, blur: 4, spread: 0, color: '#00000040', inset: false });
  const [elementFilters, setElementFilters] = useState<FiltersConfig>({ blur: 0, brightness: 100, contrast: 100, saturation: 100, hueRotate: 0, grayscale: 0, sepia: 0, invert: 0 });
  
  // Custom icons state
  const [customIcons, setCustomIcons] = useState<CustomIcon[]>([]);

  // Load custom icons on mount and listen for changes
  useEffect(() => {
    const loadIcons = () => {
      setCustomIcons(loadCustomIcons());
    };
    
    loadIcons();
    
    // Listen for storage changes (when icons are added from context menu)
    const handleStorageChange = () => {
      loadIcons();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for updates
    const interval = setInterval(loadIcons, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleOpacityChange = (opacity: number) => {
    setElementOpacity(opacity);
    onUpdateElement({ opacity: opacity / 100 });
  };

  const handleBorderChange = (border: BorderConfig) => {
    setElementBorder(border);
    onUpdateElement({ border });
  };

  const handleShadowChange = (shadow: ShadowConfig) => {
    setElementShadow(shadow);
    onUpdateElement({ shadow });
  };

  const handleFiltersChange = (filters: FiltersConfig) => {
    setElementFilters(filters);
    onUpdateElement({ filters });
  };

  const handleAddText = () => {
    onAddElement({
      type: 'text',
      x: 100,
      y: 100,
      width: 300,
      height: 80,
      content: 'New Text',
      fontSize: 20,
      fontWeight: 'normal',
      textAlign: 'left',
      color: slide.textColor,
    });
    toast.success('Text added!');
  };

  const handleAddShape = (shapeType: 'rectangle' | 'circle' | 'line' | 'arrow') => {
    onAddElement({
      type: 'shape',
      x: 150,
      y: 150,
      width: shapeType === 'line' ? 200 : 100,
      height: shapeType === 'line' ? 4 : 100,
      shapeType,
      backgroundColor: '#3b82f6',
      borderRadius: 8,
    });
    toast.success('Shape added!');
  };

  const handleAddIcon = (config: IconConfig) => {
    onAddElement({
      type: 'icon' as SlideElement['type'],
      x: 150,
      y: 150,
      width: config.size + (config.backgroundColor ? 24 : 0),
      height: config.size + (config.backgroundColor ? 24 : 0),
      iconConfig: config,
    });
  };

  // Handle adding custom icon directly - as resizable image
  const handleAddCustomIcon = (customIcon: CustomIcon) => {
    // Add as image element instead of icon for better resizing
    onAddElement({
      type: 'image',
      x: 150,
      y: 150,
      width: 200,
      height: 200,
      imageUrl: customIcon.dataUrl,
      objectFit: 'contain',
    });
    
    toast.success(language === 'ar' ? 'تمت إضافة الأيقونة!' : 'Icon added!');
  };

  // Delete custom icon
  const handleDeleteCustomIcon = (iconId: string) => {
    const updatedIcons = customIcons.filter(icon => icon.id !== iconId);
    try {
      localStorage.setItem(CUSTOM_ICONS_KEY, JSON.stringify(updatedIcons));
      setCustomIcons(updatedIcons);
      toast.success(language === 'ar' ? 'تم حذف الأيقونة' : 'Icon deleted');
    } catch (e) {
      toast.error(language === 'ar' ? 'فشل في الحذف' : 'Failed to delete');
    }
  };

  const handleAddTable = (tableConfig: any) => {
    onAddElement({
      type: 'table',
      x: 100,
      y: 100,
      width: 400,
      height: 200,
      tableConfig,
    });
    toast.success(language === 'ar' ? 'تم إضافة الجدول!' : 'Table added!');
  };

  const handleAddCodeBlock = (codeConfig: CodeConfig) => {
    onAddElement({
      type: 'code',
      x: 100,
      y: 100,
      width: 450,
      height: 250,
      codeConfig,
    });
    toast.success(language === 'ar' ? 'تم إضافة الكود!' : 'Code block added!');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        onAddElement({
          type: 'image',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          imageUrl,
        });
        toast.success('Image added!');
      };
      reader.readAsDataURL(file);
    }
  };

  // تحديد الـ tabs المناسبة حسب نوع العنصر المحدد
  const getTabsForElement = () => {
    if (!selectedElement) {
      // لا يوجد عنصر محدد - إظهار خصائص الشريحة
      return [
        { value: 'colors', icon: Paintbrush, label: language === 'ar' ? 'الألوان' : 'Colors', color: 'text-pink-500' },
        { value: 'text', icon: Type, label: language === 'ar' ? 'نص' : 'Text', color: 'text-blue-500' },
        { value: 'content', icon: Code, label: language === 'ar' ? 'محتوى' : 'Content', color: 'text-green-500' },
        { value: 'images', icon: FileImage, label: language === 'ar' ? 'صور' : 'Images', color: 'text-purple-500' },
        { value: 'icons', icon: Sticker, label: language === 'ar' ? 'أيقونات' : 'Icons', color: 'text-orange-500' },
        { value: 'animations', icon: Wand2, label: language === 'ar' ? 'حركات' : 'Animations', color: 'text-yellow-500' },
        { value: 'layout', icon: Layout, label: language === 'ar' ? 'تخطيط' : 'Layout', color: 'text-cyan-500' },
      ];
    }

    switch (selectedElement.type) {
      case 'text':
        return [
          { value: 'text', icon: Type, label: language === 'ar' ? 'نص' : 'Text', color: 'text-blue-500' },
          { value: 'colors', icon: Paintbrush, label: language === 'ar' ? 'ألوان' : 'Colors', color: 'text-pink-500' },
          { value: 'animations', icon: Wand2, label: language === 'ar' ? 'حركات' : 'Animations', color: 'text-yellow-500' },
        ];
      case 'image':
        return [
          { value: 'images', icon: FileImage, label: language === 'ar' ? 'صورة' : 'Image', color: 'text-purple-500' },
          { value: 'colors', icon: Paintbrush, label: language === 'ar' ? 'تأثيرات' : 'Effects', color: 'text-pink-500' },
          { value: 'animations', icon: Wand2, label: language === 'ar' ? 'حركات' : 'Animations', color: 'text-yellow-500' },
        ];
      case 'shape':
        return [
          { value: 'images', icon: Shapes, label: language === 'ar' ? 'شكل' : 'Shape', color: 'text-indigo-500' },
          { value: 'colors', icon: Paintbrush, label: language === 'ar' ? 'ألوان' : 'Colors', color: 'text-pink-500' },
          { value: 'animations', icon: Wand2, label: language === 'ar' ? 'حركات' : 'Animations', color: 'text-yellow-500' },
        ];
      case 'icon':
        return [
          { value: 'icons', icon: Sticker, label: language === 'ar' ? 'أيقونة' : 'Icon', color: 'text-orange-500' },
          { value: 'animations', icon: Wand2, label: language === 'ar' ? 'حركات' : 'Animations', color: 'text-yellow-500' },
        ];
      case 'table':
        return [
          { value: 'content', icon: Table, label: language === 'ar' ? 'جدول' : 'Table', color: 'text-teal-500' },
          { value: 'animations', icon: Wand2, label: language === 'ar' ? 'حركات' : 'Animations', color: 'text-yellow-500' },
        ];
      case 'code':
        return [
          { value: 'content', icon: Code, label: language === 'ar' ? 'كود' : 'Code', color: 'text-green-500' },
          { value: 'animations', icon: Wand2, label: language === 'ar' ? 'حركات' : 'Animations', color: 'text-yellow-500' },
        ];
      default:
        return [
          { value: 'colors', icon: Paintbrush, label: language === 'ar' ? 'ألوان' : 'Colors', color: 'text-pink-500' },
          { value: 'animations', icon: Wand2, label: language === 'ar' ? 'حركات' : 'Animations', color: 'text-yellow-500' },
        ];
    }
  };

  const currentTabs = getTabsForElement();
  const defaultTab = currentTabs[0]?.value || 'colors';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Update active tab when element changes
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [selectedElement?.id, defaultTab]);

  // الحصول على اسم نوع العنصر بالعربية والإنجليزية
  const getElementTypeName = () => {
    if (!selectedElement) return language === 'ar' ? 'خصائص الشريحة' : 'Slide Properties';
    
    const typeNames: Record<string, { ar: string; en: string }> = {
      text: { ar: 'نص', en: 'Text' },
      image: { ar: 'صورة', en: 'Image' },
      shape: { ar: 'شكل', en: 'Shape' },
      icon: { ar: 'أيقونة', en: 'Icon' },
      table: { ar: 'جدول', en: 'Table' },
      code: { ar: 'كود', en: 'Code' },
      chart: { ar: 'رسم بياني', en: 'Chart' },
      video: { ar: 'فيديو', en: 'Video' },
      audio: { ar: 'صوت', en: 'Audio' },
    };
    
    const typeName = typeNames[selectedElement.type] || { ar: 'عنصر', en: 'Element' };
    return language === 'ar' ? `خصائص ${typeName.ar}` : `${typeName.en} Properties`;
  };

  return (
    <div className="w-full bg-gradient-to-b from-card to-card/95 border-l border-border/50 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border/50 shrink-0 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <Paintbrush className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              {getElementTypeName()}
            </h3>
            {selectedElement && (
              <p className="text-[10px] text-muted-foreground">
                {language === 'ar' ? 'اضغط خارج العنصر لرؤية خصائص الشريحة' : 'Click outside for slide properties'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} key={selectedElement?.id || 'slide'} className="flex-1 flex flex-col min-h-0">
        <TabsList className={`mx-3 mt-3 grid shrink-0 h-9 bg-muted/30 rounded-xl p-1`} style={{ gridTemplateColumns: `repeat(${currentTabs.length}, 1fr)` }}>
          {currentTabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <Tooltip key={tab.value} delayDuration={300}>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value={tab.value} 
                    className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                      isActive 
                        ? 'bg-background shadow-[0_2px_8px_rgba(0,0,0,0.15)] ring-2 ring-primary/20' 
                        : ''
                    }`}
                  >
                    <tab.icon 
                      className={`w-3.5 h-3.5 ${tab.color} transition-all duration-200 ${
                        isActive 
                          ? 'scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]' 
                          : ''
                      }`} 
                    />
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent 
                  side="bottom" 
                  className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg"
                >
                  <div className="flex items-center gap-1.5">
                    <tab.icon className="w-3 h-3" />
                    {tab.label}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TabsList>

        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20">
          {/* Colors Tab */}
          <TabsContent value="colors" className="p-4 space-y-5 mt-0">
            {selectedElement ? (
              /* Element Color Properties */
              <div className="space-y-4">
                {selectedElement.type === 'text' && (
                  <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                    <Label className="text-xs font-semibold flex items-center gap-2">
                      <Type className="w-3.5 h-3.5 text-primary" />
                      {language === 'ar' ? 'لون النص' : 'Text Color'}
                    </Label>
                    <AdvancedColorTools
                      currentColor={selectedElement.color || '#000000'}
                      onColorChange={(color) => onUpdateElement({ color })}
                      showOpacity
                      showShadow
                      onOpacityChange={handleOpacityChange}
                      onShadowChange={handleShadowChange}
                      currentOpacity={elementOpacity}
                      currentShadow={elementShadow}
                    />
                  </div>
                )}
                
                {selectedElement.type === 'shape' && (
                  <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                    <Label className="text-xs font-semibold flex items-center gap-2">
                      <Square className="w-3.5 h-3.5 text-primary" />
                      {language === 'ar' ? 'لون الشكل' : 'Shape Color'}
                    </Label>
                    <AdvancedColorTools
                      currentColor={selectedElement.backgroundColor || '#3b82f6'}
                      onColorChange={(color) => onUpdateElement({ backgroundColor: color })}
                      showOpacity
                      showBorder
                      showShadow
                      showFilters
                      onOpacityChange={handleOpacityChange}
                      onBorderChange={handleBorderChange}
                      onShadowChange={handleShadowChange}
                      onFiltersChange={handleFiltersChange}
                      currentOpacity={elementOpacity}
                      currentBorder={elementBorder}
                      currentShadow={elementShadow}
                      currentFilters={elementFilters}
                    />
                  </div>
                )}

                {selectedElement.type === 'image' && (
                  <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                    <Label className="text-xs font-semibold flex items-center gap-2">
                      <Image className="w-3.5 h-3.5 text-primary" />
                      {language === 'ar' ? 'تأثيرات الصورة' : 'Image Effects'}
                    </Label>
                    <AdvancedColorTools
                      currentColor="#ffffff"
                      onColorChange={() => {}}
                      showOpacity
                      showBorder
                      showShadow
                      showFilters
                      onOpacityChange={handleOpacityChange}
                      onBorderChange={handleBorderChange}
                      onShadowChange={handleShadowChange}
                      onFiltersChange={handleFiltersChange}
                      currentOpacity={elementOpacity}
                      currentBorder={elementBorder}
                      currentShadow={elementShadow}
                      currentFilters={elementFilters}
                    />
                  </div>
                )}

                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full rounded-xl h-9"
                  onClick={onDeleteElement}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'حذف العنصر' : 'Delete Element'}
                </Button>
              </div>
            ) : (
              /* Slide Color Properties */
              <>
                <div className="space-y-3 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/20">
                  <Label className="text-xs font-semibold flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5 text-primary" />
                    {t('editor.backgroundColor')}
                  </Label>
                  <AdvancedColorTools
                    currentColor={slide.backgroundColor}
                    onColorChange={onBackgroundColorChange}
                  />
                </div>

                <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <Label className="text-xs font-semibold flex items-center gap-2">
                    <Type className="w-3.5 h-3.5 text-primary" />
                    {t('editor.textColor')}
                  </Label>
                  <AdvancedColorTools
                    currentColor={slide.textColor}
                    onColorChange={onTextColorChange}
                  />
                </div>

                {/* Gradient Background */}
                <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <Label className="text-xs font-semibold flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    {language === 'ar' ? 'خلفية متدرجة' : 'Gradient Background'}
                  </Label>
                  <GradientBackground
                    onApply={(background) => onBackgroundColorChange(background)}
                  />
                </div>

                {/* Slide Size - PowerPoint Sizes */}
                <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <Label className="text-xs font-semibold flex items-center gap-2">
                    <Layout className="w-3.5 h-3.5 text-primary" />
                    {language === 'ar' ? 'حجم الشريحة' : 'Slide Size'}
                  </Label>
                  <p className="text-[10px] text-muted-foreground bg-background/50 px-2 py-1 rounded-lg inline-block">
                    {language === 'ar' ? `الحجم الحالي: ${canvasWidth}×${canvasHeight}` : `Current: ${canvasWidth}×${canvasHeight}`}
                  </p>
                  
                  {/* PowerPoint Standard */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { name: '16:9 HD', w: 1920, h: 1080 },
                      { name: '4:3', w: 1024, h: 768 },
                      { name: '16:9', w: 1280, h: 720 },
                      { name: '16:10', w: 1920, h: 1200 },
                    ].map((size) => (
                      <Button
                        key={size.name}
                        variant={canvasWidth === size.w && canvasHeight === size.h ? 'default' : 'outline'}
                        size="sm"
                        className={`text-xs rounded-lg h-8 ${canvasWidth === size.w && canvasHeight === size.h ? 'bg-primary shadow-md' : ''}`}
                        onClick={() => onCanvasSizeChange?.(size.w, size.h)}
                      >
                        {size.name}
                      </Button>
                    ))}
                  </div>

                  {/* Print & Social */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { name: 'A4', w: 1122, h: 793 },
                      { name: 'Instagram', w: 1080, h: 1080 },
                      { name: 'Story', w: 1080, h: 1920 },
                      { name: 'Facebook', w: 1200, h: 630 },
                    ].map((size) => (
                      <Button
                        key={size.name}
                        variant={canvasWidth === size.w && canvasHeight === size.h ? 'default' : 'outline'}
                        size="sm"
                        className={`text-xs rounded-lg h-8 ${canvasWidth === size.w && canvasHeight === size.h ? 'bg-primary shadow-md' : ''}`}
                        onClick={() => onCanvasSizeChange?.(size.w, size.h)}
                      >
                        {size.name}
                      </Button>
                    ))}
                  </div>

                  <p className="text-[9px] text-muted-foreground text-center">
                    {language === 'ar' ? 'المزيد من الأحجام في تاب التخطيط' : 'More sizes in Layout tab'}
                  </p>
                </div>
              </>
            )}
          </TabsContent>

          {/* Text Tab */}
          <TabsContent value="text" className="p-4 space-y-5 mt-0">
            <div className="space-y-3 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/20">
              <Label className="text-xs font-semibold flex items-center gap-2">
                <Type className="w-3.5 h-3.5 text-primary" />
                {language === 'ar' ? 'إضافة نص' : 'Add Text Element'}
              </Label>
              <Button variant="outline" className="w-full rounded-xl h-10 hover:bg-primary/10 hover:text-primary hover:border-primary/30" onClick={handleAddText}>
                <Type className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'إضافة مربع نص' : 'Add Text Box'}
              </Button>
            </div>

            {selectedElement?.type === 'text' && (
              <>
                {/* Font Family */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <Label className="text-xs font-semibold">{language === 'ar' ? 'نوع الخط' : 'Font Family'}</Label>
                  <select
                    value={selectedElement.fontFamily || 'inherit'}
                    onChange={(e) => onUpdateElement({ fontFamily: e.target.value })}
                    className="w-full text-sm bg-background border border-border/50 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/30 outline-none"
                  >
                    <option value="inherit">{language === 'ar' ? 'افتراضي' : 'Default'}</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="'Courier New', monospace">Courier New</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                    <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                    <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                    <option value="Impact, sans-serif">Impact</option>
                    <option value="'Lucida Console', monospace">Lucida Console</option>
                    <option value="Tahoma, sans-serif">Tahoma</option>
                    <option value="'Cairo', sans-serif">Cairo (Arabic)</option>
                    <option value="'Tajawal', sans-serif">Tajawal (Arabic)</option>
                  </select>
                </div>

                {/* Font Size with Slider */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold">{language === 'ar' ? 'حجم الخط' : 'Font Size'}</Label>
                    <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">{selectedElement.fontSize || 16}px</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="120"
                    value={selectedElement.fontSize || 16}
                    onChange={(e) => onUpdateElement({ fontSize: Number(e.target.value) })}
                    className="w-full accent-primary"
                  />
                  <div className="flex gap-1">
                    {[12, 16, 24, 36, 48, 72].map((size) => (
                      <Button
                        key={size}
                        variant={selectedElement.fontSize === size ? 'default' : 'outline'}
                        size="sm"
                        className={`flex-1 text-xs px-1 rounded-lg h-7 ${selectedElement.fontSize === size ? 'shadow-md' : ''}`}
                        onClick={() => onUpdateElement({ fontSize: size })}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Font Weight */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <Label className="text-xs font-semibold">{language === 'ar' ? 'سمك الخط' : 'Font Weight'}</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { value: 'light', label: language === 'ar' ? 'خفيف' : 'Light', style: 'font-light' },
                      { value: 'normal', label: language === 'ar' ? 'عادي' : 'Normal', style: '' },
                      { value: 'medium', label: language === 'ar' ? 'متوسط' : 'Medium', style: 'font-medium' },
                      { value: 'semibold', label: language === 'ar' ? 'شبه سميك' : 'Semi', style: 'font-semibold' },
                      { value: 'bold', label: language === 'ar' ? 'سميك' : 'Bold', style: 'font-bold' },
                      { value: 'extrabold', label: language === 'ar' ? 'أسمك' : 'Extra', style: 'font-extrabold' },
                    ].map((weight) => (
                      <Button
                        key={weight.value}
                        variant={selectedElement.fontWeight === weight.value ? 'default' : 'outline'}
                        size="sm"
                        className={`text-xs rounded-lg h-7 ${weight.style} ${selectedElement.fontWeight === weight.value ? 'shadow-md' : ''}`}
                        onClick={() => onUpdateElement({ fontWeight: weight.value as any })}
                      >
                        {weight.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Font Style (Italic) & Text Decoration */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <Label className="text-xs font-semibold">{language === 'ar' ? 'نمط النص' : 'Text Style'}</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedElement.fontStyle === 'italic' ? 'default' : 'outline'}
                      size="sm"
                      className={`flex-1 italic rounded-lg h-8 ${selectedElement.fontStyle === 'italic' ? 'shadow-md' : ''}`}
                      onClick={() => onUpdateElement({ fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}
                    >
                      <span className="italic">I</span>
                    </Button>
                    <Button
                      variant={selectedElement.textDecoration === 'underline' ? 'default' : 'outline'}
                      size="sm"
                      className={`flex-1 underline rounded-lg h-8 ${selectedElement.textDecoration === 'underline' ? 'shadow-md' : ''}`}
                      onClick={() => onUpdateElement({ textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline' })}
                    >
                      <span className="underline">U</span>
                    </Button>
                    <Button
                      variant={selectedElement.textDecoration === 'line-through' ? 'default' : 'outline'}
                      size="sm"
                      className={`flex-1 line-through rounded-lg h-8 ${selectedElement.textDecoration === 'line-through' ? 'shadow-md' : ''}`}
                      onClick={() => onUpdateElement({ textDecoration: selectedElement.textDecoration === 'line-through' ? 'none' : 'line-through' })}
                    >
                      <span className="line-through">S</span>
                    </Button>
                  </div>
                </div>

                {/* Text Transform */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <Label className="text-xs font-semibold">{language === 'ar' ? 'تحويل النص' : 'Text Transform'}</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { value: 'none', label: 'Aa' },
                      { value: 'uppercase', label: 'AA' },
                      { value: 'lowercase', label: 'aa' },
                      { value: 'capitalize', label: 'Aa' },
                    ].map((transform) => (
                      <Button
                        key={transform.value}
                        variant={selectedElement.textTransform === transform.value ? 'default' : 'outline'}
                        size="sm"
                        className={`text-xs rounded-lg h-7 ${selectedElement.textTransform === transform.value ? 'shadow-md' : ''}`}
                        onClick={() => onUpdateElement({ textTransform: transform.value as any })}
                      >
                        {transform.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Text Alignment */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <Label className="text-xs font-semibold">{language === 'ar' ? 'المحاذاة الأفقية' : 'Horizontal Align'}</Label>
                  <div className="flex gap-1.5">
                    {[
                      { value: 'left', icon: '⫷' },
                      { value: 'center', icon: '⫶' },
                      { value: 'right', icon: '⫸' },
                      { value: 'justify', icon: '☰' },
                    ].map((align) => (
                      <Button
                        key={align.value}
                        variant={selectedElement.textAlign === align.value ? 'default' : 'outline'}
                        size="sm"
                        className={`flex-1 rounded-lg h-8 ${selectedElement.textAlign === align.value ? 'shadow-md' : ''}`}
                        onClick={() => onUpdateElement({ textAlign: align.value as any })}
                      >
                        {align.icon}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Vertical Alignment */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <Label className="text-xs font-semibold">{language === 'ar' ? 'المحاذاة الرأسية' : 'Vertical Align'}</Label>
                  <div className="flex gap-1.5">
                    {[
                      { value: 'top', label: language === 'ar' ? 'أعلى' : 'Top' },
                      { value: 'middle', label: language === 'ar' ? 'وسط' : 'Middle' },
                      { value: 'bottom', label: language === 'ar' ? 'أسفل' : 'Bottom' },
                    ].map((align) => (
                      <Button
                        key={align.value}
                        variant={selectedElement.verticalAlign === align.value ? 'default' : 'outline'}
                        size="sm"
                        className={`flex-1 text-xs rounded-lg h-8 ${selectedElement.verticalAlign === align.value ? 'shadow-md' : ''}`}
                        onClick={() => onUpdateElement({ verticalAlign: align.value as any })}
                      >
                        {align.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Line Height */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold">{language === 'ar' ? 'ارتفاع السطر' : 'Line Height'}</Label>
                    <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">{selectedElement.lineHeight || 1.5}</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="3"
                    step="0.1"
                    value={selectedElement.lineHeight || 1.5}
                    onChange={(e) => onUpdateElement({ lineHeight: Number(e.target.value) })}
                    className="w-full accent-primary"
                  />
                </div>

                {/* Letter Spacing */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold">{language === 'ar' ? 'تباعد الحروف' : 'Letter Spacing'}</Label>
                    <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">{selectedElement.letterSpacing || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="-5"
                    max="20"
                    step="0.5"
                    value={selectedElement.letterSpacing || 0}
                    onChange={(e) => onUpdateElement({ letterSpacing: Number(e.target.value) })}
                    className="w-full accent-primary"
                  />
                </div>

                {/* Text Background Color */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <Label className="text-xs font-semibold">{language === 'ar' ? 'خلفية النص' : 'Text Background'}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedElement.backgroundColor || '#ffffff'}
                      onChange={(e) => onUpdateElement({ backgroundColor: e.target.value })}
                      className="w-10 h-10 rounded-lg border cursor-pointer"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => onUpdateElement({ backgroundColor: undefined })}
                    >
                      {language === 'ar' ? 'بدون خلفية' : 'No Background'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Content Tab - Tables & Code */}
          <TabsContent value="content" className="p-4 space-y-5 mt-0">
            {/* Tables Section */}
            <div className="space-y-3 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/20">
              <Label className="text-xs font-semibold flex items-center gap-2">
                <Table className="w-3.5 h-3.5 text-primary" />
                {language === 'ar' ? 'الجداول' : 'Tables'}
              </Label>
              <p className="text-[10px] text-muted-foreground">
                {language === 'ar' 
                  ? 'أضف جداول قابلة للتعديل مع تنسيق كامل'
                  : 'Add editable tables with full formatting'}
              </p>
              <TableCreator onCreateTable={handleAddTable} />
            </div>

            {/* Code Blocks Section */}
            <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border/50">
              <Label className="text-xs font-semibold flex items-center gap-2">
                <Code className="w-3.5 h-3.5 text-primary" />
                {language === 'ar' ? 'كتل الكود' : 'Code Blocks'}
              </Label>
              <p className="text-[10px] text-muted-foreground">
                {language === 'ar' 
                  ? 'أضف كود مع تلوين وأرقام أسطر'
                  : 'Add code with syntax highlighting'}
              </p>
              <CodeBlockCreator onCreateCodeBlock={handleAddCodeBlock} />
            </div>

            {/* Selected Table Properties */}
            {selectedElement?.type === 'table' && (
              <div className="space-y-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                <Label className="text-xs font-semibold">{language === 'ar' ? 'خصائص الجدول' : 'Table Properties'}</Label>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full rounded-xl h-9"
                  onClick={onDeleteElement}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'حذف الجدول' : 'Delete Table'}
                </Button>
              </div>
            )}

            {/* Selected Code Properties */}
            {selectedElement?.type === 'code' && (
              <div className="space-y-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                <Label className="text-xs font-semibold">{language === 'ar' ? 'خصائص الكود' : 'Code Properties'}</Label>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full rounded-xl h-9"
                  onClick={onDeleteElement}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'حذف الكود' : 'Delete Code Block'}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="p-4 space-y-5 mt-0">
            {/* Upload Section */}
            <div className="space-y-3 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/20">
              <Label className="text-xs font-semibold flex items-center gap-2">
                <Upload className="w-3.5 h-3.5 text-primary" />
                {t('editor.uploadImage')}
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <div 
                className="border-2 border-dashed border-primary/30 rounded-xl p-6 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {language === 'ar' ? 'اضغط أو اسحب لرفع صورة' : 'Click or drag to upload'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF
                </p>
              </div>
            </div>

            {/* Image Search */}
            <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border/50">
              <Label className="text-xs font-semibold flex items-center gap-2">
                <Image className="w-3.5 h-3.5 text-primary" />
                {language === 'ar' ? 'صور مجانية' : 'Free Images'}
              </Label>
              <p className="text-[10px] text-muted-foreground">
                {language === 'ar' 
                  ? 'ابحث في ملايين الصور المجانية عالية الجودة'
                  : 'Search millions of free high-quality images'}
              </p>
              <PexelsImageSearch
                onSelectImage={(imageUrl) => {
                  onAddElement({
                    type: 'image',
                    x: 100,
                    y: 100,
                    width: 400,
                    height: 300,
                    imageUrl,
                  });
                }}
              />
            </div>

            {/* Image Properties when selected */}
            {selectedElement?.type === 'image' && (
              <>
                {/* Object Fit */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <Label className="text-xs font-semibold">{language === 'ar' ? 'طريقة العرض' : 'Object Fit'}</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { value: 'cover', label: language === 'ar' ? 'تغطية' : 'Cover' },
                      { value: 'contain', label: language === 'ar' ? 'احتواء' : 'Contain' },
                      { value: 'fill', label: language === 'ar' ? 'ملء' : 'Fill' },
                    ].map((fit) => (
                      <Button
                        key={fit.value}
                        variant={selectedElement.objectFit === fit.value ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs"
                        onClick={() => onUpdateElement({ objectFit: fit.value as any })}
                      >
                        {fit.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Object Position */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <Label className="text-xs font-semibold">{language === 'ar' ? 'موضع الصورة' : 'Position'}</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { value: 'top left', label: '↖' },
                      { value: 'top center', label: '↑' },
                      { value: 'top right', label: '↗' },
                      { value: 'center left', label: '←' },
                      { value: 'center center', label: '•' },
                      { value: 'center right', label: '→' },
                      { value: 'bottom left', label: '↙' },
                      { value: 'bottom center', label: '↓' },
                      { value: 'bottom right', label: '↘' },
                    ].map((pos) => (
                      <Button
                        key={pos.value}
                        variant={selectedElement.objectPosition === pos.value ? 'default' : 'outline'}
                        size="sm"
                        className={`text-xs rounded-lg h-7 ${selectedElement.objectPosition === pos.value ? 'shadow-md' : ''}`}
                        onClick={() => onUpdateElement({ objectPosition: pos.value })}
                      >
                        {pos.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Border Radius */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold">{language === 'ar' ? 'استدارة الحواف' : 'Border Radius'}</Label>
                    <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">{selectedElement.borderRadius || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedElement.borderRadius || 0}
                    onChange={(e) => onUpdateElement({ borderRadius: Number(e.target.value) })}
                    className="w-full accent-primary"
                  />
                  <div className="flex gap-1">
                    {[0, 8, 16, 24, 50, 100].map((radius) => (
                      <Button
                        key={radius}
                        variant={selectedElement.borderRadius === radius ? 'default' : 'outline'}
                        size="sm"
                        className={`flex-1 text-xs rounded-lg h-7 ${selectedElement.borderRadius === radius ? 'shadow-md' : ''}`}
                        onClick={() => onUpdateElement({ borderRadius: radius })}
                      >
                        {radius === 100 ? '●' : radius}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Rotation */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold">{language === 'ar' ? 'التدوير' : 'Rotation'}</Label>
                    <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">{selectedElement.imageRotation || 0}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={selectedElement.imageRotation || 0}
                    onChange={(e) => onUpdateElement({ imageRotation: Number(e.target.value) })}
                    className="w-full accent-primary"
                  />
                  <div className="flex gap-1">
                    {[0, 90, 180, 270].map((deg) => (
                      <Button
                        key={deg}
                        variant={selectedElement.imageRotation === deg ? 'default' : 'outline'}
                        size="sm"
                        className={`flex-1 text-xs rounded-lg h-7 ${selectedElement.imageRotation === deg ? 'shadow-md' : ''}`}
                        onClick={() => onUpdateElement({ imageRotation: deg })}
                      >
                        {deg}°
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Flip */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <Label className="text-xs font-semibold">{language === 'ar' ? 'القلب' : 'Flip'}</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedElement.flipHorizontal ? 'default' : 'outline'}
                      size="sm"
                      className={`flex-1 rounded-lg h-8 ${selectedElement.flipHorizontal ? 'shadow-md' : ''}`}
                      onClick={() => onUpdateElement({ flipHorizontal: !selectedElement.flipHorizontal })}
                    >
                      ↔ {language === 'ar' ? 'أفقي' : 'H'}
                    </Button>
                    <Button
                      variant={selectedElement.flipVertical ? 'default' : 'outline'}
                      size="sm"
                      className={`flex-1 rounded-lg h-8 ${selectedElement.flipVertical ? 'shadow-md' : ''}`}
                      onClick={() => onUpdateElement({ flipVertical: !selectedElement.flipVertical })}
                    >
                      ↕ {language === 'ar' ? 'رأسي' : 'V'}
                    </Button>
                  </div>
                </div>

                {/* Image Shape */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <Label className="text-xs font-semibold">{language === 'ar' ? 'شكل الصورة' : 'Image Shape'}</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { value: 'none', label: '▭', title: language === 'ar' ? 'مستطيل' : 'Rectangle' },
                      { value: 'circle(50%)', label: '●', title: language === 'ar' ? 'دائرة' : 'Circle' },
                      { value: 'ellipse(50% 35%)', label: '⬬', title: language === 'ar' ? 'بيضاوي' : 'Oval' },
                      { value: 'inset(0 round 16px)', label: '▢', title: language === 'ar' ? 'مستدير' : 'Rounded' },
                      { value: 'polygon(50% 0%, 100% 100%, 0% 100%)', label: '▲', title: language === 'ar' ? 'مثلث' : 'Triangle' },
                      { value: 'polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)', label: '⬠', title: language === 'ar' ? 'خماسي' : 'Pentagon' },
                      { value: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', label: '⬡', title: language === 'ar' ? 'سداسي' : 'Hexagon' },
                      { value: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', label: '★', title: language === 'ar' ? 'نجمة' : 'Star' },
                      { value: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', label: '◆', title: language === 'ar' ? 'معين' : 'Diamond' },
                      { value: 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%)', label: '▶', title: language === 'ar' ? 'سهم' : 'Arrow' },
                      { value: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)', label: '⯃', title: language === 'ar' ? 'ثماني' : 'Octagon' },
                      { value: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)', label: '⬢', title: language === 'ar' ? 'عشاري' : 'Decagon' },
                    ].map((clip) => (
                      <Button
                        key={clip.value}
                        variant={(selectedElement.clipPath || 'none') === clip.value || (!selectedElement.clipPath && clip.value === 'none') ? 'default' : 'outline'}
                        size="sm"
                        className={`text-base p-1 rounded-lg ${(selectedElement.clipPath || 'none') === clip.value || (!selectedElement.clipPath && clip.value === 'none') ? 'shadow-md' : ''}`}
                        onClick={() => onUpdateElement({ clipPath: clip.value === 'none' ? undefined : clip.value })}
                        title={clip.title}
                      >
                        {clip.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Replace Image */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <Label className="text-xs font-semibold">{language === 'ar' ? 'استبدال الصورة' : 'Replace Image'}</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-lg h-9 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'اختر صورة جديدة' : 'Choose New Image'}
                  </Button>
                </div>

                {/* Delete */}
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full rounded-xl h-9"
                  onClick={onDeleteElement}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'حذف الصورة' : 'Delete Image'}
                </Button>
              </>
            )}

            {/* Shapes Section */}
            <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border/50">
              <Label className="text-xs font-semibold flex items-center gap-2">
                <Square className="w-3.5 h-3.5 text-primary" />
                {language === 'ar' ? 'إضافة أشكال' : 'Add Shapes'}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="rounded-lg h-9 hover:bg-primary/10 hover:text-primary hover:border-primary/30" onClick={() => handleAddShape('rectangle')}>
                  <Square className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'مستطيل' : 'Rectangle'}
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg h-9 hover:bg-primary/10 hover:text-primary hover:border-primary/30" onClick={() => handleAddShape('circle')}>
                  <Circle className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'دائرة' : 'Circle'}
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg h-9 hover:bg-primary/10 hover:text-primary hover:border-primary/30" onClick={() => handleAddShape('line')}>
                  <Minus className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'خط' : 'Line'}
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg h-9 hover:bg-primary/10 hover:text-primary hover:border-primary/30" onClick={() => handleAddShape('arrow')}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'سهم' : 'Arrow'}
                </Button>
              </div>
            </div>

            {/* Decorative Elements Section */}
            <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border/50">
              <Label className="text-xs font-semibold flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                {language === 'ar' ? 'عناصر زخرفية' : 'Decorative Elements'}
              </Label>
              <p className="text-[10px] text-muted-foreground">
                {language === 'ar' 
                  ? 'أضف زخارف جاهزة لتجميل الشريحة'
                  : 'Add ready-made decorations to beautify your slide'}
              </p>
              <DecorativeLibrary
                onAddDecoration={(elements) => {
                  console.log('Received elements in PropertiesPanel:', elements.length, elements);
                  // Add all elements at once if onAddElements is available
                  if (onAddElements) {
                    onAddElements(elements.map((el) => ({
                      type: el.type,
                      x: el.x,
                      y: el.y,
                      width: el.width,
                      height: el.height,
                      shapeType: el.shapeType,
                      backgroundColor: el.backgroundColor,
                      borderRadius: el.borderRadius,
                      rotation: el.rotation || 0,
                      zIndex: el.zIndex || 0,
                      shadow: el.shadow,
                    } as Omit<SlideElement, 'id'>)));
                  } else {
                    // Fallback: Add elements one by one with delay to avoid ID collision
                    elements.forEach((el, index) => {
                      setTimeout(() => {
                        console.log('Adding element:', el);
                        onAddElement({
                          type: el.type,
                          x: el.x,
                          y: el.y,
                          width: el.width,
                          height: el.height,
                          shapeType: el.shapeType,
                          backgroundColor: el.backgroundColor,
                          borderRadius: el.borderRadius,
                          rotation: el.rotation,
                          zIndex: el.zIndex,
                          shadow: el.shadow,
                        });
                      }, index * 50);
                    });
                  }
                }}
                trigger={
                  <Button variant="outline" className="w-full">
                    <Sparkles className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'مكتبة الزخارف' : 'Decorations Library'}
                  </Button>
                }
              />
            </div>
          </TabsContent>

          {/* Icons Tab */}
          <TabsContent value="icons" className="p-4 space-y-5 mt-0">
            <div className="space-y-3 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/20">
              <Label className="text-xs font-semibold flex items-center gap-2">
                <Smile className="w-3.5 h-3.5 text-primary" />
                {t('editor.icons') || 'Icons'}
              </Label>
              <p className="text-[10px] text-muted-foreground">
                {language === 'ar' 
                  ? 'اختر من مكتبة الأيقونات وخصصها حسب رغبتك'
                  : 'Choose from the icon library and customize'}
              </p>
              <IconLibrary
                onSelectIcon={handleAddIcon}
                trigger={
                  <Button variant="outline" className="w-full rounded-xl h-10 hover:bg-primary/10 hover:text-primary hover:border-primary/30">
                    <Smile className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'فتح مكتبة الأيقونات' : 'Open Icon Library'}
                  </Button>
                }
              />
            </div>

            {/* Custom Icons Section - الإضافات */}
            <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border/50">
              <Label className="text-xs font-semibold flex items-center gap-2">
                <ImagePlus className="w-3.5 h-3.5 text-primary" />
                {language === 'ar' ? 'الإضافات' : 'Custom Icons'}
                {customIcons.length > 0 && (
                  <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    {customIcons.length}
                  </span>
                )}
              </Label>
              <p className="text-[10px] text-muted-foreground">
                {language === 'ar' 
                  ? 'الأيقونات المخصصة التي أضفتها. اضغط كليك يمين على أي صورة في الشريحة واختر "إضافة للإضافات".'
                  : 'Your custom icons. Right-click any image on the slide and select "Add to Custom".'}
              </p>
              
              {customIcons.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20">
                  {customIcons.map((icon) => (
                    <div key={icon.id} className="relative group">
                      <button
                        onClick={() => handleAddCustomIcon(icon)}
                        className="w-full aspect-square p-2 rounded-lg border-2 border-transparent hover:border-primary hover:bg-primary/10 transition-all"
                        title={icon.name}
                      >
                        <img
                          src={icon.dataUrl}
                          alt={icon.name}
                          className="w-full h-full object-contain rounded"
                        />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomIcon(icon.id)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                        title={language === 'ar' ? 'حذف' : 'Delete'}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <ImagePlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">
                    {language === 'ar' 
                      ? 'لا توجد إضافات بعد'
                      : 'No custom icons yet'}
                  </p>
                  <p className="text-[10px] mt-1">
                    {language === 'ar' 
                      ? 'اضغط كليك يمين على صورة → إضافة للإضافات'
                      : 'Right-click image → Add to Custom'}
                  </p>
                </div>
              )}
            </div>

            {selectedElement?.type === 'icon' && selectedElement.iconConfig && (
              <div className="space-y-4 p-3 rounded-xl bg-muted/30 border border-border/50">
                <Label className="text-xs font-semibold">{language === 'ar' ? 'تعديل الأيقونة' : 'Edit Icon'}</Label>
                
                {/* Icon Color */}
                <div className="space-y-2">
                  <Label className="text-xs">{language === 'ar' ? 'لون الأيقونة' : 'Icon Color'}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedElement.iconConfig.color || '#000000'}
                      onChange={(e) => onUpdateElement({ 
                        iconConfig: { ...selectedElement.iconConfig!, color: e.target.value } 
                      })}
                      className="w-10 h-10 rounded-lg border cursor-pointer"
                    />
                    <div className="flex-1 grid grid-cols-6 gap-1">
                      {['#000000', '#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6'].map((color) => (
                        <button
                          key={color}
                          className="w-6 h-6 rounded-lg border border-border hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => onUpdateElement({ 
                            iconConfig: { ...selectedElement.iconConfig!, color } 
                          })}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Icon Size */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">{language === 'ar' ? 'الحجم' : 'Size'}</Label>
                    <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">{selectedElement.iconConfig.size || 24}px</span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="200"
                    value={selectedElement.iconConfig.size || 24}
                    onChange={(e) => onUpdateElement({ 
                      iconConfig: { ...selectedElement.iconConfig!, size: Number(e.target.value) },
                      width: Number(e.target.value) + (selectedElement.iconConfig?.backgroundColor ? 24 : 0),
                      height: Number(e.target.value) + (selectedElement.iconConfig?.backgroundColor ? 24 : 0),
                    })}
                    className="w-full"
                  />
                  <div className="flex gap-1">
                    {[24, 32, 48, 64, 96, 128].map((size) => (
                      <Button
                        key={size}
                        variant={selectedElement.iconConfig?.size === size ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => onUpdateElement({ 
                          iconConfig: { ...selectedElement.iconConfig!, size },
                          width: size + (selectedElement.iconConfig?.backgroundColor ? 24 : 0),
                          height: size + (selectedElement.iconConfig?.backgroundColor ? 24 : 0),
                        })}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Stroke Width */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">{language === 'ar' ? 'سمك الخط' : 'Stroke Width'}</Label>
                    <span className="text-xs text-muted-foreground">{selectedElement.iconConfig.strokeWidth || 2}px</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="4"
                    step="0.5"
                    value={selectedElement.iconConfig.strokeWidth || 2}
                    onChange={(e) => onUpdateElement({ 
                      iconConfig: { ...selectedElement.iconConfig!, strokeWidth: Number(e.target.value) } 
                    })}
                    className="w-full"
                  />
                  <div className="flex gap-1">
                    {[1, 1.5, 2, 2.5, 3].map((width) => (
                      <Button
                        key={width}
                        variant={selectedElement.iconConfig?.strokeWidth === width ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => onUpdateElement({ 
                          iconConfig: { ...selectedElement.iconConfig!, strokeWidth: width } 
                        })}
                      >
                        {width}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Rotation */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">{language === 'ar' ? 'التدوير' : 'Rotation'}</Label>
                    <span className="text-xs text-muted-foreground">{selectedElement.iconConfig.rotation || 0}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={selectedElement.iconConfig.rotation || 0}
                    onChange={(e) => onUpdateElement({ 
                      iconConfig: { ...selectedElement.iconConfig!, rotation: Number(e.target.value) } 
                    })}
                    className="w-full"
                  />
                  <div className="flex gap-1">
                    {[0, 45, 90, 180, 270].map((deg) => (
                      <Button
                        key={deg}
                        variant={selectedElement.iconConfig?.rotation === deg ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => onUpdateElement({ 
                          iconConfig: { ...selectedElement.iconConfig!, rotation: deg } 
                        })}
                      >
                        {deg}°
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Background */}
                <div className="space-y-2">
                  <Label className="text-xs">{language === 'ar' ? 'الخلفية' : 'Background'}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedElement.iconConfig.backgroundColor || '#f3f4f6'}
                      onChange={(e) => onUpdateElement({ 
                        iconConfig: { ...selectedElement.iconConfig!, backgroundColor: e.target.value },
                        width: selectedElement.iconConfig!.size + 24,
                        height: selectedElement.iconConfig!.size + 24,
                      })}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const newConfig = { ...selectedElement.iconConfig! };
                        delete newConfig.backgroundColor;
                        delete newConfig.backgroundRadius;
                        onUpdateElement({ 
                          iconConfig: newConfig,
                          width: selectedElement.iconConfig!.size,
                          height: selectedElement.iconConfig!.size,
                        });
                      }}
                    >
                      {language === 'ar' ? 'بدون خلفية' : 'No Background'}
                    </Button>
                  </div>
                </div>

                {/* Background Radius */}
                {selectedElement.iconConfig.backgroundColor && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">{language === 'ar' ? 'استدارة الخلفية' : 'Background Radius'}</Label>
                      <span className="text-xs text-muted-foreground">{selectedElement.iconConfig.backgroundRadius || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={selectedElement.iconConfig.backgroundRadius || 0}
                      onChange={(e) => onUpdateElement({ 
                        iconConfig: { ...selectedElement.iconConfig!, backgroundRadius: Number(e.target.value) } 
                      })}
                      className="w-full"
                    />
                    <div className="flex gap-1">
                      {[0, 4, 8, 12, 50].map((radius) => (
                        <Button
                          key={radius}
                          variant={selectedElement.iconConfig?.backgroundRadius === radius ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => onUpdateElement({ 
                            iconConfig: { ...selectedElement.iconConfig!, backgroundRadius: radius } 
                          })}
                        >
                          {radius === 50 ? '●' : radius}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Change Icon */}
                <div className="space-y-2 pt-3 border-t">
                  <Label className="text-xs">{language === 'ar' ? 'تغيير الأيقونة' : 'Change Icon'}</Label>
                  <IconLibrary
                    onSelectIcon={(config) => onUpdateElement({ 
                      iconConfig: { 
                        ...selectedElement.iconConfig!,
                        name: config.name,
                      } 
                    })}
                    trigger={
                      <Button variant="outline" size="sm" className="w-full">
                        <Smile className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'اختر أيقونة أخرى' : 'Choose Another Icon'}
                      </Button>
                    }
                  />
                </div>

                {/* Delete */}
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full"
                  onClick={onDeleteElement}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'حذف الأيقونة' : 'Delete Icon'}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Animations Tab */}
          <TabsContent value="animations" className="p-4 mt-0">
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/20">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">{language === 'ar' ? 'الحركات' : 'Animations'}</Label>
                  <p className="text-[10px] text-muted-foreground">{language === 'ar' ? 'أضف حركات وانتقالات' : 'Add animations & transitions'}</p>
                </div>
              </div>
              <AnimationTab
                slide={slide}
                selectedElement={selectedElement}
                elements={elements.length > 0 ? elements : (slide.elements || [])}
                onUpdateElement={onUpdateElement}
                onUpdateElementById={onUpdateElementById || ((id, updates) => {
                  if (selectedElement?.id === id) {
                    onUpdateElement(updates);
                  }
                })}
                slideTransition={slideTransition}
                onSlideTransitionChange={onSlideTransitionChange}
              />
            </div>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="p-4 mt-0">
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/20">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Layout className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">{language === 'ar' ? 'التخطيط' : 'Layout'}</Label>
                  <p className="text-[10px] text-muted-foreground">{language === 'ar' ? 'إعدادات الشريحة والتخطيط' : 'Slide settings & layout'}</p>
                </div>
              </div>
              <LayoutTools
                slide={slide}
                selectedElement={selectedElement}
                onUpdateElement={onUpdateElement}
                onSlideTypeChange={onSlideTypeChange}
                onBackgroundColorChange={onBackgroundColorChange}
                onTextColorChange={onTextColorChange}
                onDuplicateSlide={onDuplicateSlide}
                onDeleteSlide={onDeleteSlide}
                onMoveSlide={onMoveSlide}
                slideIndex={slideIndex}
                totalSlides={totalSlides}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                zoom={zoom}
                onZoomChange={onZoomChange}
                onCanvasSizeChange={onCanvasSizeChange}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
