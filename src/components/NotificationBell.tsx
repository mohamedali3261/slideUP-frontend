import { useState, useEffect } from 'react';
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, AlertCircle, Trash2, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  is_read: number;
  created_at: string;
}

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

export const NotificationBell = () => {
  const [notifications] = useState<Notification[]>([]);
  const [unreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();

  const t = {
    notifications: language === 'ar' ? 'الإشعارات' : 'Notifications',
    noNotifications: language === 'ar' ? 'لا يوجد إشعارات' : 'No notifications',
    markAllRead: language === 'ar' ? 'تعليم الكل كمقروء' : 'Mark all as read',
    clearAll: language === 'ar' ? 'مسح الكل' : 'Clear all',
    new: language === 'ar' ? 'جديد' : 'New',
    delete: language === 'ar' ? 'حذف' : 'Delete',
  };

  const markAsRead = (_id: number) => {};

  const markAllAsRead = () => {};

  const deleteNotification = (_id: number, e: React.MouseEvent) => {
    e.stopPropagation();
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
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-lg shadow-red-500/50 animate-pulse">
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
      <PopoverContent className="w-96 p-0 bg-card/95 backdrop-blur-xl border-border/50 rounded-2xl shadow-2xl" align="end">
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
        </div>

        {/* Notifications List */}
        <div className="max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20 scrollbar-thumb-rounded-full scrollbar-track-rounded-full transition-all duration-300">
          {notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <BellOff className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium mb-1">{t.noNotifications}</p>
              <p className="text-xs text-muted-foreground/60">{language === 'ar' ? 'ستظهر الإشعارات هنا' : 'Notifications will appear here'}</p>
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
