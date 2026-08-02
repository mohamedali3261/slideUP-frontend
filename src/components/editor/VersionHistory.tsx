import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  RotateCcw,
  Trash2,
  Loader2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { getVersions, createVersion, restoreVersion } from '@/lib/storage';

interface Version {
  id: string;
  version_number: number;
  title: string;
  slide_count: number;
  change_summary: string;
  created_at: string;
}

interface VersionHistoryProps {
  presentationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: () => void;
}

export const VersionHistory = ({
  presentationId,
  open,
  onOpenChange,
  onRestore,
}: VersionHistoryProps) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const locale = language === 'ar' ? ar : enUS;

  useEffect(() => {
    if (open && user) {
      loadVersions();
    }
  }, [open, user, presentationId]);

  const loadVersions = () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = getVersions(presentationId, user.id);
      setVersions(data.map(v => ({
        id: v.id,
        version_number: v.versionNumber,
        title: v.title,
        slide_count: v.slideCount,
        change_summary: v.changeSummary,
        created_at: v.createdAt,
      })));
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (versionId: string) => {
    if (!user) return;
    setRestoring(versionId);
    try {
      const result = restoreVersion(presentationId, versionId, user.id);
      if (result.success) {
        toast.success(language === 'ar' ? 'تم استعادة الإصدار!' : 'Version restored!');
        onRestore();
        onOpenChange(false);
      }
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = (_versionId: string) => {
    loadVersions();
  };

  const handleCreateVersion = () => {
    if (!user) return;
    try {
      createVersion(
        presentationId,
        user.id,
        'Save Point',
        0,
        '{}',
        language === 'ar' ? 'نقطة حفظ يدوية' : 'Manual save point'
      );
      toast.success(language === 'ar' ? 'تم إنشاء نقطة حفظ!' : 'Save point created!');
      loadVersions();
    } catch {
      toast.error(language === 'ar' ? 'فشل إنشاء نقطة الحفظ' : 'Failed to create save point');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'سجل الإصدارات' : 'Version History'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar'
              ? 'استعرض واستعد الإصدارات السابقة من العرض التقديمي'
              : 'View and restore previous versions of your presentation'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center mb-4">
          <Button onClick={handleCreateVersion} size="sm">
            <FileText className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'إنشاء نقطة حفظ' : 'Create Save Point'}
          </Button>
          <Badge variant="outline">
            {versions.length} {language === 'ar' ? 'إصدار' : 'versions'}
          </Badge>
        </div>

        <Separator />

        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p>{language === 'ar' ? 'لا توجد إصدارات محفوظة' : 'No saved versions'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          {language === 'ar' ? 'إصدار' : 'Version'} {version.version_number}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(version.created_at), {
                            addSuffix: true,
                            locale,
                          })}
                        </span>
                      </div>
                      <h4 className="font-medium mb-1">{version.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {version.change_summary}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {version.slide_count}{' '}
                        {language === 'ar' ? 'شريحة' : 'slides'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(version.id)}
                        disabled={restoring === version.id}
                      >
                        {restoring === version.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(version.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
