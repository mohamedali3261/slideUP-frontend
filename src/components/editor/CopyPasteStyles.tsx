import { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SlideElement } from '@/data/templates';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Style properties that can be copied
export interface CopiedStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'light' | 'medium' | 'semibold' | 'extrabold';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  iconConfig?: {
    color: string;
    size: number;
    strokeWidth: number;
    backgroundColor?: string;
    backgroundRadius?: number;
  };
  width?: number;
  height?: number;
  sourceType?: string;
}

// SVG Icons
const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const PasteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
);

const PaintbrushIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"/>
    <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/>
  </svg>
);

const HistoryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M12 7v5l4 2"/>
  </svg>
);

const PresetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

// Style presets with categories
const STYLE_PRESETS = [
  // Text Styles
  { name: 'Bold Title', category: 'text', style: { fontSize: 48, fontWeight: 'bold' as const, color: '#1f2937' } },
  { name: 'Subtitle', category: 'text', style: { fontSize: 24, fontWeight: 'normal' as const, color: '#6b7280' } },
  { name: 'Body Text', category: 'text', style: { fontSize: 16, fontWeight: 'normal' as const, color: '#374151' } },
  { name: 'Caption', category: 'text', style: { fontSize: 12, fontWeight: 'normal' as const, color: '#9ca3af' } },
  { name: 'Quote', category: 'text', style: { fontSize: 20, fontWeight: 'normal' as const, color: '#4b5563', textAlign: 'center' as const } },
  // Color Accents
  { name: 'Accent Blue', category: 'color', style: { backgroundColor: '#3b82f6', color: '#ffffff' } },
  { name: 'Accent Green', category: 'color', style: { backgroundColor: '#10b981', color: '#ffffff' } },
  { name: 'Accent Purple', category: 'color', style: { backgroundColor: '#8b5cf6', color: '#ffffff' } },
  { name: 'Accent Orange', category: 'color', style: { backgroundColor: '#f97316', color: '#ffffff' } },
  { name: 'Accent Red', category: 'color', style: { backgroundColor: '#ef4444', color: '#ffffff' } },
  { name: 'Accent Pink', category: 'color', style: { backgroundColor: '#ec4899', color: '#ffffff' } },
  { name: 'Dark', category: 'color', style: { backgroundColor: '#1f2937', color: '#ffffff' } },
  { name: 'Light', category: 'color', style: { backgroundColor: '#f3f4f6', color: '#1f2937' } },
  // Shape Styles
  { name: 'Rounded', category: 'shape', style: { borderRadius: 16 } },
  { name: 'Sharp', category: 'shape', style: { borderRadius: 0 } },
  { name: 'Pill', category: 'shape', style: { borderRadius: 999 } },
  { name: 'Soft', category: 'shape', style: { borderRadius: 8 } },
];

const STYLE_OPTIONS = [
  { key: 'colors', label: { en: 'Colors', ar: 'الألوان' }, props: ['color', 'backgroundColor'] },
  { key: 'text', label: { en: 'Text Format', ar: 'تنسيق النص' }, props: ['fontSize', 'fontWeight', 'textAlign'] },
  { key: 'size', label: { en: 'Size', ar: 'الحجم' }, props: ['width', 'height'] },
  { key: 'border', label: { en: 'Border', ar: 'الحدود' }, props: ['borderRadius'] },
];

interface CopyPasteStylesProps {
  selectedElement: SlideElement | null;
  onPasteStyle: (style: CopiedStyle) => void;
  className?: string;
}

export const CopyPasteStyles = ({
  selectedElement,
  onPasteStyle,
  className,
}: CopyPasteStylesProps) => {
  const { language } = useLanguage();
  const [copiedStyle, setCopiedStyle] = useState<CopiedStyle | null>(null);
  const [styleHistory, setStyleHistory] = useState<CopiedStyle[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(['colors', 'text', 'border']);
  const [isOpen, setIsOpen] = useState(false);

  // Extract style from element
  const extractStyle = useCallback((element: SlideElement): CopiedStyle => {
    const style: CopiedStyle = { sourceType: element.type };

    if (element.type === 'text') {
      style.fontSize = element.fontSize;
      style.fontWeight = element.fontWeight;
      style.textAlign = element.textAlign;
      style.color = element.color;
    }

    if (element.type === 'shape') {
      style.backgroundColor = element.backgroundColor;
      style.borderRadius = element.borderRadius;
    }

    if (element.type === 'icon' && element.iconConfig) {
      style.iconConfig = { ...element.iconConfig };
    }

    style.width = element.width;
    style.height = element.height;

    return style;
  }, []);

  // Copy style
  const handleCopyStyle = useCallback(() => {
    if (!selectedElement) {
      toast.error(language === 'ar' ? 'اختر عنصر أولاً' : 'Select an element first');
      return;
    }

    const style = extractStyle(selectedElement);
    setCopiedStyle(style);
    
    // Add to history (max 5)
    setStyleHistory(prev => {
      const newHistory = [style, ...prev.filter(s => JSON.stringify(s) !== JSON.stringify(style))];
      return newHistory.slice(0, 5);
    });
    
    toast.success(language === 'ar' ? 'تم نسخ التنسيق!' : 'Style copied!');
  }, [selectedElement, extractStyle, language]);

  // Paste style
  const handlePasteStyle = useCallback((styleToApply?: CopiedStyle) => {
    const style = styleToApply || copiedStyle;
    if (!style) {
      toast.error(language === 'ar' ? 'لا يوجد تنسيق منسوخ' : 'No style copied');
      return;
    }

    if (!selectedElement) {
      toast.error(language === 'ar' ? 'اختر عنصر أولاً' : 'Select an element first');
      return;
    }

    // Filter style based on selected options
    const filteredStyle: CopiedStyle = {};
    selectedOptions.forEach(optionKey => {
      const option = STYLE_OPTIONS.find(o => o.key === optionKey);
      if (option) {
        option.props.forEach(prop => {
          if (style[prop as keyof CopiedStyle] !== undefined) {
            (filteredStyle as any)[prop] = style[prop as keyof CopiedStyle];
          }
        });
      }
    });

    onPasteStyle(filteredStyle);
    toast.success(language === 'ar' ? 'تم تطبيق التنسيق!' : 'Style applied!');
    setIsOpen(false);
  }, [copiedStyle, selectedElement, selectedOptions, onPasteStyle, language]);

  // Apply preset
  const handleApplyPreset = useCallback((preset: typeof STYLE_PRESETS[0]) => {
    if (!selectedElement) {
      toast.error(language === 'ar' ? 'اختر عنصر أولاً' : 'Select an element first');
      return;
    }
    onPasteStyle(preset.style);
    toast.success(language === 'ar' ? `تم تطبيق "${preset.name}"` : `Applied "${preset.name}"`);
  }, [selectedElement, onPasteStyle, language]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Use e.code for language-independent shortcuts
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyC') {
        e.preventDefault();
        handleCopyStyle();
      }
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyV') {
        e.preventDefault();
        if (copiedStyle && selectedElement) {
          handlePasteStyle();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleCopyStyle, handlePasteStyle, copiedStyle, selectedElement]);

  const toggleOption = (key: string) => {
    setSelectedOptions(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <TooltipProvider>
        {/* Copy Style */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopyStyle}
              disabled={!selectedElement}
            >
              <CopyIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ar' ? 'نسخ التنسيق (Ctrl+Shift+C)' : 'Copy Style (Ctrl+Shift+C)'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Paste Style */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-8 w-8', copiedStyle && 'text-primary')}
                  disabled={!copiedStyle || !selectedElement}
                >
                  <PasteIcon />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{language === 'ar' ? 'لصق التنسيق (Ctrl+Shift+V)' : 'Paste Style (Ctrl+Shift+V)'}</p>
            </TooltipContent>
          </Tooltip>

          <PopoverContent className="w-64">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <PaintbrushIcon />
                <h4 className="font-medium">
                  {language === 'ar' ? 'لصق التنسيق' : 'Paste Style'}
                </h4>
              </div>

              <div className="space-y-2">
                {STYLE_OPTIONS.map(option => (
                  <div key={option.key} className="flex items-center gap-2">
                    <Checkbox
                      id={option.key}
                      checked={selectedOptions.includes(option.key)}
                      onCheckedChange={() => toggleOption(option.key)}
                    />
                    <Label htmlFor={option.key} className="text-sm cursor-pointer">
                      {language === 'ar' ? option.label.ar : option.label.en}
                    </Label>
                  </div>
                ))}
              </div>

              {copiedStyle && (
                <div className="p-2 bg-muted rounded-lg text-xs space-y-1">
                  <p className="font-medium">{language === 'ar' ? 'التنسيق المنسوخ:' : 'Copied Style:'}</p>
                  <div className="flex flex-wrap gap-1">
                    {copiedStyle.color && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-background rounded">
                        <span className="w-2 h-2 rounded" style={{ backgroundColor: copiedStyle.color }} />
                        Text
                      </span>
                    )}
                    {copiedStyle.backgroundColor && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-background rounded">
                        <span className="w-2 h-2 rounded" style={{ backgroundColor: copiedStyle.backgroundColor }} />
                        BG
                      </span>
                    )}
                    {copiedStyle.fontSize && (
                      <span className="px-1.5 py-0.5 bg-background rounded">{copiedStyle.fontSize}px</span>
                    )}
                    {copiedStyle.fontWeight === 'bold' && (
                      <span className="px-1.5 py-0.5 bg-background rounded font-bold">B</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setIsOpen(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button size="sm" className="flex-1" onClick={() => handlePasteStyle()} disabled={selectedOptions.length === 0}>
                  {language === 'ar' ? 'تطبيق' : 'Apply'}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Style History & Presets */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <PresetIcon />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{language === 'ar' ? 'أنماط جاهزة' : 'Style Presets'}</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="end" className="w-56">
            {/* History */}
            {styleHistory.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <HistoryIcon />
                  {language === 'ar' ? 'السجل' : 'History'}
                </div>
                {styleHistory.map((style, i) => (
                  <DropdownMenuItem
                    key={i}
                    onClick={() => handlePasteStyle(style)}
                    disabled={!selectedElement}
                  >
                    <div className="flex items-center gap-2">
                      {style.color && <span className="w-3 h-3 rounded" style={{ backgroundColor: style.color }} />}
                      {style.backgroundColor && <span className="w-3 h-3 rounded" style={{ backgroundColor: style.backgroundColor }} />}
                      <span className="text-xs">{style.sourceType} style</span>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}

            {/* Presets by Category */}
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {language === 'ar' ? 'أنماط النص' : 'Text Styles'}
            </div>
            {STYLE_PRESETS.filter(p => p.category === 'text').map((preset, i) => (
              <DropdownMenuItem
                key={`text-${i}`}
                onClick={() => handleApplyPreset(preset)}
                disabled={!selectedElement}
              >
                <div className="flex items-center gap-2">
                  {preset.style.color && (
                    <span className="w-3 h-3 rounded border" style={{ backgroundColor: preset.style.color }} />
                  )}
                  <span className="text-sm">{preset.name}</span>
                </div>
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {language === 'ar' ? 'ألوان' : 'Colors'}
            </div>
            {STYLE_PRESETS.filter(p => p.category === 'color').map((preset, i) => (
              <DropdownMenuItem
                key={`color-${i}`}
                onClick={() => handleApplyPreset(preset)}
                disabled={!selectedElement}
              >
                <div className="flex items-center gap-2">
                  {preset.style.backgroundColor && (
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: preset.style.backgroundColor }} />
                  )}
                  <span className="text-sm">{preset.name}</span>
                </div>
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {language === 'ar' ? 'أشكال' : 'Shapes'}
            </div>
            {STYLE_PRESETS.filter(p => p.category === 'shape').map((preset, i) => (
              <DropdownMenuItem
                key={`shape-${i}`}
                onClick={() => handleApplyPreset(preset)}
                disabled={!selectedElement}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-muted-foreground" style={{ borderRadius: preset.style.borderRadius }} />
                  <span className="text-sm">{preset.name}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </div>
  );
};

export default CopyPasteStyles;
