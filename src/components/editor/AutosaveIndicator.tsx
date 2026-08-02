import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Cloud,
  CloudOff,
  Check,
  Loader2,
  AlertCircle,
  Settings,
  Download,
  Upload,
  Trash2,
  Clock,
  HardDrive,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface AutosaveIndicatorProps {
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  isEnabled: boolean;
  error: Error | null;
  storageSize: string;
  onToggleAutosave: (enabled: boolean) => void;
  onManualSave: () => void;
  onClear: () => void;
  onExport: () => string;
  onImport: (data: string) => boolean;
}

export const AutosaveIndicator = ({
  lastSaved,
  isSaving,
  hasUnsavedChanges,
  isEnabled,
  error,
  storageSize,
  onToggleAutosave,
  onManualSave,
  onClear,
  onExport,
  onImport,
}: AutosaveIndicatorProps) => {
  const { language } = useLanguage();
  const [showClearDialog, setShowClearDialog] = useState(false);
  const locale = language === 'ar' ? ar : enUS;


  const getStatusIcon = () => {
    if (error) {
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
    if (isSaving) {
      return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    }
    if (!isEnabled) {
      return <CloudOff className="w-4 h-4 text-muted-foreground" />;
    }
    if (hasUnsavedChanges) {
      return <Cloud className="w-4 h-4 text-yellow-500" />;
    }
    return <Check className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (error) return language === 'ar' ? 'خطأ في الحفظ' : 'Save error';
    if (isSaving) return language === 'ar' ? 'جاري الحفظ...' : 'Saving...';
    if (!isEnabled) return language === 'ar' ? 'الحفظ التلقائي معطل' : 'Autosave off';
    if (hasUnsavedChanges) return language === 'ar' ? 'تغييرات غير محفوظة' : 'Unsaved changes';
    if (lastSaved) {
      return formatDistanceToNow(lastSaved, { addSuffix: true, locale });
    }
    return language === 'ar' ? 'محفوظ' : 'Saved';
  };

  const handleExport = () => {
    const data = onExport();
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presentation-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(language === 'ar' ? 'تم تصدير النسخة الاحتياطية' : 'Backup exported');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const data = event.target?.result as string;
          const success = onImport(data);
          if (success) {
            toast.success(language === 'ar' ? 'تم استيراد النسخة الاحتياطية' : 'Backup imported');
          } else {
            toast.error(language === 'ar' ? 'فشل استيراد الملف' : 'Failed to import file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleClear = () => {
    onClear();
    setShowClearDialog(false);
    toast.success(language === 'ar' ? 'تم مسح البيانات المحفوظة' : 'Saved data cleared');
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-xs font-normal"
          >
            {getStatusIcon()}
            <span className="hidden sm:inline">{getStatusText()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="font-medium">
                  {language === 'ar' ? 'الحفظ التلقائي' : 'Autosave'}
                </span>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={onToggleAutosave}
              />
            </div>

            <Separator />

            {/* Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {language === 'ar' ? 'آخر حفظ' : 'Last saved'}
                </div>
                <span>
                  {lastSaved
                    ? formatDistanceToNow(lastSaved, { addSuffix: true, locale })
                    : language === 'ar' ? 'لم يتم الحفظ' : 'Never'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HardDrive className="w-3 h-3" />
                  {language === 'ar' ? 'حجم التخزين' : 'Storage size'}
                </div>
                <Badge variant="secondary">{storageSize}</Badge>
              </div>
            </div>

            {error && (
              <div className="p-2 bg-destructive/10 rounded-md text-sm text-destructive">
                {error.message}
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={onManualSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4 mr-2" />
                )}
                {language === 'ar' ? 'حفظ الآن' : 'Save now'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleExport}
              >
                <Download className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'تصدير نسخة احتياطية' : 'Export backup'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleImport}
              >
                <Upload className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'استيراد نسخة احتياطية' : 'Import backup'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setShowClearDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'مسح البيانات المحفوظة' : 'Clear saved data'}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'مسح البيانات المحفوظة؟' : 'Clear saved data?'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar'
                ? 'سيتم حذف جميع البيانات المحفوظة تلقائياً. هذا الإجراء لا يمكن التراجع عنه.'
                : 'All autosaved data will be permanently deleted. This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="destructive" onClick={handleClear}>
              {language === 'ar' ? 'مسح' : 'Clear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AutosaveIndicator;
