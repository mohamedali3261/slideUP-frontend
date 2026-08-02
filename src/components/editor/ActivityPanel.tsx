import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  Loader2,
  FileEdit,
  Trash2,
  Copy,
  Plus,
  Move,
  Palette,
  Image,
  Type,
  Square,
  Download,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface ActivityLog {
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

interface ActivityPanelProps {
  presentationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ActivityPanel = ({
  presentationId,
  open,
  onOpenChange,
}: ActivityPanelProps) => {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const locale = language === 'ar' ? ar : enUS;

  useEffect(() => {
    if (open && token) {
      loadActivities();
    }
  }, [open, token]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('create')) return <Plus className="w-4 h-4" />;
    if (action.includes('delete')) return <Trash2 className="w-4 h-4" />;
    if (action.includes('edit') || action.includes('update')) return <FileEdit className="w-4 h-4" />;
    if (action.includes('copy') || action.includes('duplicate')) return <Copy className="w-4 h-4" />;
    if (action.includes('move') || action.includes('reorder')) return <Move className="w-4 h-4" />;
    if (action.includes('color') || action.includes('style')) return <Palette className="w-4 h-4" />;
    if (action.includes('image')) return <Image className="w-4 h-4" />;
    if (action.includes('text')) return <Type className="w-4 h-4" />;
    if (action.includes('shape')) return <Square className="w-4 h-4" />;
    if (action.includes('export')) return <Download className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) return 'text-green-500';
    if (action.includes('delete') || action.includes('remove')) return 'text-red-500';
    if (action.includes('edit') || action.includes('update')) return 'text-blue-500';
    if (action.includes('export') || action.includes('save')) return 'text-purple-500';
    return 'text-gray-500';
  };

  const translateAction = (action: string) => {
    if (language === 'en') return action.replace(/_/g, ' ');
    
    const translations: Record<string, string> = {
      'open_editor': 'فتح المحرر',
      'create_slide': 'إنشاء شريحة',
      'delete_slide': 'حذف شريحة',
      'duplicate_slide': 'تكرار شريحة',
      'add_element': 'إضافة عنصر',
      'delete_element': 'حذف عنصر',
      'edit_element': 'تعديل عنصر',
      'add_elements': 'إضافة عناصر',
      'change_background': 'تغيير الخلفية',
      'export_pptx': 'تصدير PPTX',
      'export_pdf': 'تصدير PDF',
      'export_images': 'تصدير صور',
      'manual_save': 'حفظ يدوي',
      'use_template': 'استخدام قالب',
      'update_presentation': 'تحديث العرض',
      'create_presentation': 'إنشاء عرض',
    };
    
    return translations[action] || action.replace(/_/g, ' ');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {language === 'ar' ? 'سجل النشاط' : 'Activity Log'}
          </SheetTitle>
          <SheetDescription>
            {language === 'ar'
              ? 'تتبع جميع التعديلات والإجراءات'
              : 'Track all your edits and actions'}
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p>{language === 'ar' ? 'لا يوجد نشاط' : 'No activity yet'}</p>
            </div>
          ) : (
            <div className="space-y-3 pr-4">
              {activities.map((activity, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${getActionColor(activity.action)}`}>
                      {getActionIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {translateAction(activity.action)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                            locale,
                          })}
                        </span>
                      </div>
                      {activity.details && (
                        <p className="text-sm text-muted-foreground truncate">
                          {activity.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
