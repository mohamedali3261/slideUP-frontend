import { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, AlertCircle, Trash2, BellOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface AppNotification {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  is_read: number;
  created_at: string;
}

interface ToolTip {
  type: AppNotification['type'];
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
}

const siteTools: ToolTip[] = [
  {
    type: 'success',
    titleAr: 'القوالب الاحترافية',
    titleEn: 'Professional Templates',
    contentAr: 'لدينا 13 قالباً جاهزاً بصور وأشكال هندسية مذهلة — ابدأ عرضك بلمسة احترافية.',
    contentEn: 'We have 13 ready-made templates with amazing images and geometric shapes — start your presentation professionally.',
  },
  {
    type: 'info',
    titleAr: 'محرر الشرائح',
    titleEn: 'Slide Editor',
    contentAr: 'صمم شرائحك بحرية: نصوص، أشكال، أيقونات ورسوم بيانية بسهولة تامة.',
    contentEn: 'Design your slides freely: text, shapes, icons and charts with total ease.',
  },
  {
    type: 'success',
    titleAr: 'تصدير باوربوينت',
    titleEn: 'Export to PowerPoint',
    contentAr: 'صدّر عرضك بصيغة PPTX جاهزة للعرض والتعديل في أي وقت.',
    contentEn: 'Export your presentation as a ready-to-edit PPTX file.',
  },
  {
    type: 'info',
    titleAr: 'تصدير PDF',
    titleEn: 'Export to PDF',
    contentAr: 'حوّل عرضك إلى PDF عالي الجودة مناسب للطباعة والمشاركة.',
    contentEn: 'Turn your presentation into a high-quality, print-ready PDF.',
  },
  {
    type: 'warning',
    titleAr: 'تصدير الصور',
    titleEn: 'Export Images',
    contentAr: 'صدّر الشرائح كصور منفصلة لمشاركتها على وسائل التواصل.',
    contentEn: 'Export slides as individual images to share on social media.',
  },
  {
    type: 'success',
    titleAr: 'دعم اللغة العربية',
    titleEn: 'Arabic RTL Support',
    contentAr: 'الموقع يدعم العربية بالكامل مع اتجاه RTL — بدّل اللغة من أي وقت.',
    contentEn: 'The site fully supports Arabic with RTL layout — switch language anytime.',
  },
  {
    type: 'info',
    titleAr: 'حركات وانتقالات',
    titleEn: 'Animations & Transitions',
    contentAr: 'أضف حركات احترافية لعناصر شرائحك مع التحكم الكامل في التوقيت.',
    contentEn: 'Add professional animations to your slide elements with full timing control.',
  },
  {
    type: 'success',
    titleAr: 'بحث صور Pexels',
    titleEn: 'Pexels Image Search',
    contentAr: 'ابحث عن صور مجانية عالية الجودة داخل المحرر مباشرة وأضفها لشرائحك.',
    contentEn: 'Search high-quality free images right inside the editor and add them to your slides.',
  },
  {
    type: 'info',
    titleAr: 'جداول وأكواد',
    titleEn: 'Tables & Code Blocks',
    contentAr: 'أدرج جداول قابلة للتخصيص وكتل أكواد ملوّنة بثيمات متعددة.',
    contentEn: 'Insert customizable tables and colorful code blocks with multiple themes.',
  },
  {
    type: 'success',
    titleAr: 'القوالب الجديدة',
    titleEn: 'New Templates',
    contentAr: 'جربنا قوالبنا الجديدة: الذكاء الاصطناعي، التقرير المالي، الطاقة الرياضية، المعمارية، والسفر.',
    contentEn: 'Try our new templates: AI intelligence, finance report, sports energy, architecture, and travel.',
  },
  {
    type: 'info',
    titleAr: 'وضع العرض التقديمي',
    titleEn: 'Presentation Mode',
    contentAr: 'شغّل وضع العرض التقديمي لعرض شرائحك بملء الشاشة مع انتقالات سلسة.',
    contentEn: 'Use presentation mode to show your slides fullscreen with smooth transitions.',
  },
  {
    type: 'warning',
    titleAr: 'حفظ المشاريع',
    titleEn: 'Save Your Projects',
    contentAr: 'تذكر أن تحفظ مشروعك باستمرار حتى لا تفقد أي عمل قمت به.',
    contentEn: 'Remember to save your project regularly so you never lose your work.',
  },
  {
    type: 'success',
    titleAr: 'مشاركة عروضك',
    titleEn: 'Share Your Presentations',
    contentAr: 'شارك عروضك التقديمية مع فريقك أو عملائك برابط مباشر وواجهات مميزة.',
    contentEn: 'Share your presentations with your team or clients via a direct link.',
  },
  {
    type: 'info',
    titleAr: 'اختصارات لوحة المفاتيح',
    titleEn: 'Keyboard Shortcuts',
    contentAr: 'وفّر وقتك مع اختصارات لوحة المفاتيح: النسخ واللصق والتراجع أسرع من أي وقت.',
    contentEn: 'Save time with keyboard shortcuts: copy, paste and undo faster than ever.',
  },
  {
    type: 'warning',
    titleAr: 'تخصيص الألوان',
    titleEn: 'Customize Colors',
    contentAr: 'خصّص ألوان شرائحك لتناسب هوية علامتك التجارية مع لوحات ألوان جاهزة.',
    contentEn: 'Customize your slide colors to match your brand identity with ready palettes.',
  },
  {
    type: 'success',
    titleAr: 'ترتيب الطبقات',
    titleEn: 'Layers Panel',
    contentAr: 'رتّب عناصر شرائحك طبقة فوق طبقة وقفل العناصر لضبط التصميم بدقة.',
    contentEn: 'Arrange your slide elements layer by layer and lock elements for precise design.',
  },
  {
    type: 'info',
    titleAr: 'مجموعات العناصر',
    titleEn: 'Group Elements',
    contentAr: 'اجمع عدة عناصر في مجموعة واحدة لتحريكها وتعديلها معاً بسهولة.',
    contentEn: 'Group multiple elements together to move and edit them as one.',
  },
  {
    type: 'success',
    titleAr: 'التراجع والإعادة',
    titleEn: 'Undo & Redo',
    contentAr: 'أخطأت؟ استخدم التراجع والإعادة لتصحيح أي خطأ في ثوانٍ.',
    contentEn: 'Made a mistake? Use undo and redo to fix anything in seconds.',
  },
  {
    type: 'info',
    titleAr: 'خطوط عربية',
    titleEn: 'Arabic Fonts',
    contentAr: 'اختر من مجموعة خطوط عربية مدمجة تناسب كل أنواع العروض.',
    contentEn: 'Pick from a built-in collection of Arabic fonts for every kind of presentation.',
  },
  {
    type: 'warning',
    titleAr: 'أبعاد وقياسات',
    titleEn: 'Slide Dimensions',
    contentAr: 'خصّص أبعاد الشرائح (16:9 أو 4:3 أو مقاس مخصص) لتناسب شاشتك.',
    contentEn: 'Customize slide dimensions (16:9, 4:3, or custom size) to fit your screen.',
  },
  {
    type: 'info',
    titleAr: 'طباعة العرض',
    titleEn: 'Print Presentation',
    contentAr: 'اطبع عرضك التقديمي بشكل احترافي مباشرة من قائمة التصدير.',
    contentEn: 'Print your presentation professionally straight from the export menu.',
  },
];

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  urgent: AlertCircle,
};

const typeColors = {
  info: 'text-blue-500 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30',
  warning: 'text-amber-500 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30',
  success: 'text-green-500 bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30',
  urgent: 'text-red-500 bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30',
};

const typeBadgeColors = {
  info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  success: 'bg-green-500/10 text-green-600 border-green-500/20',
  urgent: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const TWO_HOURS = 7200000;

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();
  const languageRef = useRef(language);
  const toolIndexRef = useRef(0);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const t = {
    notifications: language === 'ar' ? 'الإشعارات' : 'Notifications',
    noNotifications: language === 'ar' ? 'لا يوجد إشعارات' : 'No notifications',
    markAllRead: language === 'ar' ? 'تعليم الكل كمقروء' : 'Mark all as read',
    clearAll: language === 'ar' ? 'مسح الكل' : 'Clear all',
    new: language === 'ar' ? 'جديد' : 'New',
    delete: language === 'ar' ? 'حذف' : 'Delete',
    hourlyToolNote: language === 'ar' ? 'تذكير بأدوات الموقع كل ساعتين' : 'Reminder about the site tools every 2 hours',
  };

  const pushToolNotification = (fireDesktop: boolean) => {
    const tool = siteTools[toolIndexRef.current % siteTools.length];
    toolIndexRef.current += 1;
    const isAr = languageRef.current === 'ar';
    const notification: AppNotification = {
      id: Date.now(),
      title: isAr ? tool.titleAr : tool.titleEn,
      content: isAr ? tool.contentAr : tool.contentEn,
      type: tool.type,
      is_read: 0,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [notification, ...prev].slice(0, 20));
    setUnreadCount(prev => prev + 1);

    if (fireDesktop && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.content,
          icon: '/favicon.ico',
        });
      } catch {
        // Desktop notification failed silently
      }
    }
  };

  useEffect(() => {
    const first = setTimeout(() => pushToolNotification(true), 8000);
    const interval = setInterval(() => pushToolNotification(true), TWO_HOURS);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    const handler = () => {
      Notification.requestPermission().catch(() => {});
      document.removeEventListener('click', handler);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const markAsRead = (id: number) => {
    setNotifications(prev => {
      const target = prev.find(n => n.id === id);
      if (target && !target.is_read) setUnreadCount(c => Math.max(0, c - 1));
      return prev.map(n => (n.id === id ? { ...n, is_read: 1 as const } : n));
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 as const })));
    setUnreadCount(0);
  };

  const deleteNotification = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => {
      const target = prev.find(n => n.id === id);
      if (target && !target.is_read) setUnreadCount(c => Math.max(0, c - 1));
      return prev.filter(n => n.id !== id);
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return language === 'ar' ? 'الآن' : 'Just now';
    if (minutes < 60) return language === 'ar' ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
    if (hours < 24) return language === 'ar' ? `منذ ${hours} ساعة` : `${hours}h ago`;
    return language === 'ar' ? `منذ ${days} يوم` : `${days}d ago`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-muted/50 transition-all duration-300 hover:scale-105">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-[8px] rounded-full flex items-center justify-center font-bold shadow shadow-red-500/40">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
          <div className="flex items-center gap-1.5">
            <Bell className="w-3 h-3" />
            {t.notifications}
            {unreadCount > 0 && ` (${unreadCount})`}
          </div>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-96 max-w-[calc(100vw-1.5rem)] p-0 bg-card/95 backdrop-blur-xl border-border/50 rounded-2xl shadow-2xl" align="end">
        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-purple-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">{t.notifications}</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-muted-foreground">{unreadCount} {language === 'ar' ? 'غير مقروء' : 'unread'}</p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-all duration-200"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                {t.markAllRead}
              </Button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground/70 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {t.hourlyToolNote}
          </p>
        </div>

        {/* Notifications List */}
        <div className="max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20 scrollbar-thumb-rounded-full scrollbar-track-rounded-full transition-all duration-300">
          {notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <BellOff className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium mb-1">{t.noNotifications}</p>
              <p className="text-xs text-muted-foreground/60">{language === 'ar' ? 'سنرسل لك تذكيراً بأدوات الموقع كل ساعتين' : 'We will send you a reminder about the site tools every 2 hours'}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Info;
                const colorClass = typeColors[notification.type] || typeColors.info;
                const badgeColor = typeBadgeColors[notification.type] || typeBadgeColors.info;
                return (
                  <div
                    key={notification.id}
                    className={`group relative p-4 hover:bg-gradient-to-r hover:from-muted/50 hover:to-transparent cursor-pointer transition-all duration-300 ${!notification.is_read ? 'bg-primary/5' : ''}`}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${colorClass} transition-transform duration-300 group-hover:scale-110`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">{notification.title}</p>
                            {!notification.is_read && (
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${badgeColor} border`}>
                                {t.new}
                              </Badge>
                            )}
                          </div>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-7 w-7 rounded-lg hover:bg-red-500/10 hover:text-red-500"
                            onClick={(e) => deleteNotification(notification.id, e)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-2">{notification.content}</p>

                        <div className="flex items-center gap-2">
                          <p className="text-muted-foreground/60 text-[11px] font-medium">{formatDate(notification.created_at)}</p>
                          {!notification.is_read && (
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{notifications.length} {language === 'ar' ? 'إشعار' : 'notification(s)'}</span>
              {unreadCount > 0 && (
                <span className="text-primary font-medium">{unreadCount} {language === 'ar' ? 'جديد' : 'new'}</span>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
