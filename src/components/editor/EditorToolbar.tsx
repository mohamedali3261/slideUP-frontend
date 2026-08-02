import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { SlideElement } from '@/data/templates';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import logo from '@/assets/logoo.png';
import {
  Presentation,
  Download,
  FileDown,
  Image,
  ChevronDown,
  Undo2,
  Redo2,
  Settings2,
  LayoutGrid,
  FileUp,
  Keyboard,
  Copy,
  Play,
  PanelLeft,
  PanelRight,
  Clock,
  Save,
  Loader2,
  Plus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { AutosaveIndicator } from './AutosaveIndicator';
import { GroupingControls, ElementGroup } from './GroupingControls';
import { CopyPasteStyles, CopiedStyle } from './CopyPasteStyles';
import { SmartLayouts } from './SmartLayouts';
import { ImportPPTX } from './ImportPPTX';
import { SlideTemplate } from '@/data/templates';
import { NotificationBell } from '@/components/NotificationBell';
import { SupportDialog } from '@/components/SupportDialog';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AutosaveState {
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  error: Error | null;
}

interface EditorToolbarProps {
  presentationTitle: string;
  onTitleChange: (title: string) => void;
  onExport: (format: 'pptx' | 'pdf' | 'images') => void;
  onPreview?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onCreateNew?: () => void;
  onShowVersionHistory?: () => void;
  autosave?: AutosaveState & {
    isEnabled: boolean;
    storageSize: string;
    onToggle: (enabled: boolean) => void;
    onManualSave: () => void;
    onClear: () => void;
    onExport: () => string;
    onImport: (data: string) => boolean;
  };
  elements?: SlideElement[];
  selectedElementId?: string | null;
  onSelectElement?: (id: string | null) => void;
  onUpdateElement?: (id: string, updates: Partial<SlideElement>) => void;
  onDeleteElement?: (id: string) => void;
  onDuplicateElement?: (id: string) => void;
  onReorderElements?: (elements: SlideElement[]) => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  selectedElementIds?: string[];
  groups?: ElementGroup[];
  onGroup?: (elementIds: string[]) => void;
  onUngroup?: (groupId: string) => void;
  onDeleteSelected?: () => void;
  onDuplicateSelected?: () => void;
  onAlignSelected?: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onDistributeSelected?: (direction: 'horizontal' | 'vertical') => void;
  onPasteStyle?: (style: CopiedStyle) => void;
  canvasWidth?: number;
  canvasHeight?: number;
  onApplyLayout?: (elements: SlideElement[]) => void;
  onImportPPTX?: (slides: SlideTemplate[], title: string) => void;
}

export const EditorToolbar = ({
  presentationTitle,
  onTitleChange,
  onExport,
  onPreview,
  onUndo,
  onRedo,
  onSave,
  onCreateNew,
  onShowVersionHistory,
  autosave,
  elements = [],
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onReorderElements,
  zoom = 100,
  onZoomChange,
  selectedElementIds = [],
  groups = [],
  onGroup,
  onUngroup,
  onDeleteSelected,
  onDuplicateSelected,
  onAlignSelected,
  onDistributeSelected,
  onPasteStyle,
  canvasWidth = 960,
  canvasHeight = 540,
  onApplyLayout,
  onImportPPTX,
}: EditorToolbarProps) => {
  const { t, direction, language } = useLanguage();

  return (
    <div className="h-10 bg-gradient-to-r from-card via-card to-card/95 border-b border-border/50 flex items-center justify-between px-2 backdrop-blur-sm">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        {/* Logo & Home Button */}
        <Link to="/" className="flex items-center group" title={language === 'ar' ? 'الصفحة الرئيسية' : 'Home'}>
          <img 
            src={logo} 
            alt="SlideUP" 
            className="h-8 w-auto group-hover:scale-105 transition-transform"
          />
        </Link>

        <div className="w-px h-5 bg-border/50" />

        {/* Presentation Title */}
        <input
          type="text"
          value={presentationTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-xs font-semibold bg-transparent border-none outline-none focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 text-foreground w-32 hover:bg-muted/50 transition-colors"
        />

        {/* New Presentation Button */}
        {onCreateNew && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCreateNew}
                className="h-6 text-[10px] px-2 gap-1 rounded hover:bg-muted/50 text-green-600 hover:text-green-700"
              >
                <Plus className="w-3 h-3" />
                {language === 'ar' ? 'عرض جديد' : 'New'}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
              <div className="flex items-center gap-1.5">
                <Plus className="w-3 h-3" />
                {language === 'ar' ? 'عرض جديد' : 'New Presentation'}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Center Section - Main Tools */}
      <div className="flex items-center gap-1 bg-muted/20 rounded-lg p-0.5">
        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5">
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded hover:bg-background" 
                onClick={onUndo} 
                disabled={!onUndo}
              >
                <Undo2 className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
              <div className="flex items-center gap-1.5">
                <Undo2 className="w-3 h-3" />
                Undo (Ctrl+Z)
              </div>
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded hover:bg-background" 
                onClick={onRedo} 
                disabled={!onRedo}
              >
                <Redo2 className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
              <div className="flex items-center gap-1.5">
                <Redo2 className="w-3 h-3" />
                Redo (Ctrl+Y)
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-5 bg-border/50 mx-1" />

        {/* Edit Menu - Grouping, Styles, Layouts */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 gap-1 rounded hover:bg-background">
              <LayoutGrid className="w-3 h-3" />
              {language === 'ar' ? 'تعديل' : 'Edit'}
              <ChevronDown className="w-2.5 h-2.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-52 rounded-xl">
            {onPasteStyle && (
              <div className="px-2 py-1">
                <CopyPasteStyles
                  selectedElement={elements.find(el => el.id === selectedElementId) || null}
                  onPasteStyle={onPasteStyle}
                />
              </div>
            )}
            {onApplyLayout && (
              <div className="px-2 py-1">
                <SmartLayouts
                  elements={elements}
                  selectedElementIds={selectedElementIds}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  onApplyLayout={onApplyLayout}
                />
              </div>
            )}
            {(selectedElementIds.length > 0 || selectedElementId) && onDeleteSelected && onDuplicateSelected && onAlignSelected && onDistributeSelected && onGroup && onUngroup && (
              <div className="px-2 py-1">
                <GroupingControls
                  selectedElementIds={selectedElementIds.length > 0 ? selectedElementIds : (selectedElementId ? [selectedElementId] : [])}
                  elements={elements}
                  groups={groups}
                  onGroup={onGroup}
                  onUngroup={onUngroup}
                  onDeleteSelected={onDeleteSelected}
                  onDuplicateSelected={onDuplicateSelected}
                  onAlignSelected={onAlignSelected}
                  onDistributeSelected={onDistributeSelected}
                />
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help - Keyboard Shortcuts */}
        <KeyboardShortcutsHelp />
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-1.5">
        {/* Dashboard Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-[10px] px-2 gap-1 rounded hover:bg-muted/50"
              title={language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            >
              <LayoutGrid className="w-3 h-3" />
              {language === 'ar' ? 'لوحة' : 'Dashboard'}
              <ChevronDown className="w-2.5 h-2.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="rounded-lg w-48">
            <DropdownMenuItem 
              className="text-xs rounded cursor-pointer"
              onClick={async (e) => {
                e.preventDefault();
                if (onSave) {
                  await onSave();
                }
                window.location.href = '/dashboard';
              }}
            >
              <LayoutGrid className="w-3 h-3 mr-2" />
              {language === 'ar' ? 'عروضي التقديمية' : 'My Presentations'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-xs rounded cursor-pointer"
              onClick={async (e) => {
                e.preventDefault();
                if (onSave) {
                  await onSave();
                }
                window.location.href = '/templates';
              }}
            >
              <Copy className="w-3 h-3 mr-2" />
              {language === 'ar' ? 'القوالب' : 'Templates'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-xs rounded cursor-pointer"
              onClick={async (e) => {
                e.preventDefault();
                if (onSave) {
                  await onSave();
                }
                window.location.href = '/';
              }}
            >
              <Presentation className="w-3 h-3 mr-2" />
              {language === 'ar' ? 'الصفحة الرئيسية' : 'Home'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-5 bg-border/50" />

        {/* Notifications */}
        <NotificationBell />
        
        {/* Support */}
        <SupportDialog />

        {/* Theme Toggle */}
        <ThemeToggle variant="editor" />

        {/* Language Switcher */}
        <LanguageSwitcher variant="editor" />

        <div className="w-px h-5 bg-border/50" />

        {/* Version History */}
        {onShowVersionHistory && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-[10px] px-2 gap-1 rounded hover:bg-muted/50"
                onClick={onShowVersionHistory}
              >
                <Clock className="w-3 h-3" />
                {language === 'ar' ? 'الإصدارات' : 'Versions'}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {language === 'ar' ? 'سجل الإصدارات' : 'Version History'}
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Save Button */}
        {onSave && autosave && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-[10px] px-2 gap-1 rounded hover:bg-muted/50"
                onClick={onSave}
                disabled={autosave.isSaving}
              >
                {autosave.isSaving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                {language === 'ar' ? 'حفظ' : 'Save'}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
              <div className="flex items-center gap-1.5">
                <Save className="w-3 h-3" />
                {language === 'ar' ? 'حفظ (Ctrl+S)' : 'Save (Ctrl+S)'}
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        <div className="w-px h-5 bg-border/50" />

        {/* Import */}
        {onImportPPTX && (
          <ImportPPTX onImport={onImportPPTX} />
        )}

        {/* Preview Button */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-[10px] px-2 gap-1 rounded hover:bg-muted/50"
              onClick={onPreview}
            >
              <Play className="w-3 h-3" />
              {language === 'ar' ? 'معاينة' : 'Preview'}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
            <div className="flex items-center gap-1.5">
              <Play className="w-3 h-3" />
              {language === 'ar' ? 'معاينة (F5)' : 'Preview (F5)'}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-6 text-[10px] px-3 gap-1 rounded bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-md shadow-primary/20">
              <Download className="w-3 h-3" />
              {language === 'ar' ? 'تصدير' : 'Export'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-lg">
            <DropdownMenuItem onClick={() => onExport('pptx')} className="text-xs rounded">
              <FileDown className="w-3 h-3 mr-2" />
              PowerPoint
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('pdf')} className="text-xs rounded">
              <FileDown className="w-3 h-3 mr-2" />
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('images')} className="text-xs rounded">
              <Image className="w-3 h-3 mr-2" />
              {language === 'ar' ? 'صور' : 'Images'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-5 bg-border/50" />
      </div>
    </div>
  );
};
