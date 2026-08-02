import { useState, useEffect } from 'react';
import { MessageCircle, Send, Plus, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Reply {
  id: number;
  message: string;
  username: string;
  is_admin: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  in_progress: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
  closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-500/20 text-gray-400',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-amber-500/20 text-amber-400',
  urgent: 'bg-red-500/20 text-red-400',
};

export const SupportDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'list' | 'new' | 'detail'>('list');
  
  // New ticket form
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'medium' });
  const [replyMessage, setReplyMessage] = useState('');
  
  const { token, user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();

  // Check if user is logged in when opening dialog
  useEffect(() => {
    if (isOpen && !token) {
      toast({ 
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'الرجاء تسجيل الدخول أولاً' : 'Please login first',
        variant: 'destructive' 
      });
      setIsOpen(false);
    }
  }, [isOpen, token]);

  const t = {
    support: language === 'ar' ? 'الدعم الفني' : 'Support',
    myTickets: language === 'ar' ? 'تذاكري' : 'My Tickets',
    newTicket: language === 'ar' ? 'تذكرة جديدة' : 'New Ticket',
    title: language === 'ar' ? 'العنوان' : 'Title',
    description: language === 'ar' ? 'الوصف' : 'Description',
    priority: language === 'ar' ? 'الأولوية' : 'Priority',
    low: language === 'ar' ? 'منخفضة' : 'Low',
    medium: language === 'ar' ? 'متوسطة' : 'Medium',
    high: language === 'ar' ? 'عالية' : 'High',
    urgent: language === 'ar' ? 'عاجلة' : 'Urgent',
    submit: language === 'ar' ? 'إرسال' : 'Submit',
    back: language === 'ar' ? 'رجوع' : 'Back',
    noTickets: language === 'ar' ? 'لا يوجد تذاكر' : 'No tickets yet',
    reply: language === 'ar' ? 'رد' : 'Reply',
    send: language === 'ar' ? 'إرسال' : 'Send',
    you: language === 'ar' ? 'أنت' : 'You',
    admin: language === 'ar' ? 'الدعم' : 'Support',
    new: language === 'ar' ? 'جديدة' : 'New',
    in_progress: language === 'ar' ? 'قيد المراجعة' : 'In Progress',
    resolved: language === 'ar' ? 'تم الحل' : 'Resolved',
    closed: language === 'ar' ? 'مغلقة' : 'Closed',
    describeProblem: language === 'ar' ? 'اشرح المشكلة بالتفصيل...' : 'Describe your problem in detail...',
    ticketCreated: language === 'ar' ? 'تم إنشاء التذكرة' : 'Ticket created',
    replySent: language === 'ar' ? 'تم إرسال الرد' : 'Reply sent',
  };

  const fetchTickets = async () => {
    setTickets([]);
    setIsLoading(false);
  };

  const fetchTicketDetail = async (id: number) => {
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
      setSelectedTicket(ticket);
      setReplies([]);
      setView('detail');
    }
  };

  const createTicket = async () => {
    if (!newTicket.title || !newTicket.description) {
      toast({ title: language === 'ar' ? 'الرجاء ملء جميع الحقول' : 'Please fill all fields', variant: 'destructive' });
      return;
    }
    
    toast({ title: t.ticketCreated });
    setNewTicket({ title: '', description: '', priority: 'medium' });
    setView('list');
  };

  const sendReply = async () => {
    if (!replyMessage || !selectedTicket) return;
    toast({ title: t.replySent });
    setReplyMessage('');
  };

  useEffect(() => {
    if (isOpen) {
      console.log('Dialog opened, token:', token ? 'exists' : 'missing');
      console.log('User:', user);
      fetchTickets();
    }
  }, [isOpen]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted/50">
              <MessageCircle className="w-4 h-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-3 h-3" />
            {t.support}
          </div>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="bg-card border-border max-w-lg rounded-xl" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            {t.support}
          </DialogTitle>
        </DialogHeader>

        {!token ? (
          <div className="py-8 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">
              {language === 'ar' ? 'الرجاء تسجيل الدخول لاستخدام الدعم الفني' : 'Please login to use support'}
            </p>
          </div>
        ) : view === 'list' ? (
          <div className="space-y-4">
            <Button onClick={() => setView('new')} className="w-full bg-primary hover:bg-primary/90 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />{t.newTicket}
            </Button>
            
            {isLoading ? (
              <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
            ) : tickets.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">{t.noTickets}</div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20">
                {tickets.map(ticket => (
                  <div
                    key={ticket.id}
                    onClick={() => fetchTicketDetail(ticket.id)}
                    className="p-4 bg-muted/30 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors border border-border/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{ticket.title}</p>
                        <p className="text-muted-foreground text-sm mt-1 truncate">{ticket.description}</p>
                      </div>
                      <Badge className={statusColors[ticket.status]}>{t[ticket.status as keyof typeof t]}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground text-xs">
                      <Clock className="w-3 h-3" />
                      {formatDate(ticket.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : view === 'new' ? (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setView('list')} className="text-muted-foreground hover:text-foreground p-0 h-auto">
              ← {t.back}
            </Button>
            
            <div>
              <Label className="text-foreground">{t.title}</Label>
              <Input
                value={newTicket.title}
                onChange={e => setNewTicket({ ...newTicket, title: e.target.value })}
                className="bg-muted/30 border-border text-foreground mt-1 rounded-lg"
              />
            </div>
            
            <div>
              <Label className="text-foreground">{t.description}</Label>
              <Textarea
                value={newTicket.description}
                onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder={t.describeProblem}
                className="bg-muted/30 border-border text-foreground mt-1 min-h-32 rounded-lg"
              />
            </div>
            
            <div>
              <Label className="text-foreground">{t.priority}</Label>
              <Select value={newTicket.priority} onValueChange={v => setNewTicket({ ...newTicket, priority: v })}>
                <SelectTrigger className="bg-muted/30 border-border text-foreground mt-1 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="low">{t.low}</SelectItem>
                  <SelectItem value="medium">{t.medium}</SelectItem>
                  <SelectItem value="high">{t.high}</SelectItem>
                  <SelectItem value="urgent">{t.urgent}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={createTicket} 
              disabled={isLoading || !newTicket.title || !newTicket.description}
              className="w-full bg-primary hover:bg-primary/90 rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {t.submit}
            </Button>
          </div>
        ) : null}

        {view === 'detail' && selectedTicket && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => { setView('list'); setSelectedTicket(null); }} className="text-muted-foreground hover:text-foreground p-0 h-auto">
              ← {t.back}
            </Button>
            
            <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-foreground">{selectedTicket.title}</h3>
                <Badge className={statusColors[selectedTicket.status]}>{t[selectedTicket.status as keyof typeof t]}</Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-2">{selectedTicket.description}</p>
              <div className="flex items-center gap-4 mt-3 text-muted-foreground text-xs">
                <span className={`px-2 py-0.5 rounded ${priorityColors[selectedTicket.priority]}`}>
                  {t[selectedTicket.priority as keyof typeof t]}
                </span>
                <span>{formatDate(selectedTicket.created_at)}</span>
              </div>
            </div>
            
            <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20">
              {replies.map(reply => (
                <div key={reply.id} className={`p-3 rounded-xl border ${reply.is_admin ? 'bg-primary/10 border-primary/20 mr-4' : 'bg-muted/30 border-border/50 ml-4'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium ${reply.is_admin ? 'text-primary' : 'text-muted-foreground'}`}>
                      {reply.is_admin ? t.admin : t.you}
                    </span>
                    <span className="text-muted-foreground/60 text-xs">{formatDate(reply.created_at)}</span>
                  </div>
                  <p className="text-foreground text-sm">{reply.message}</p>
                </div>
              ))}
            </div>
            
            {selectedTicket.status !== 'closed' && (
              <div className="flex gap-2">
                <Input
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  placeholder={t.reply + '...'}
                  className="bg-muted/30 border-border text-foreground rounded-lg"
                  onKeyDown={e => e.key === 'Enter' && sendReply()}
                />
                <Button onClick={sendReply} size="icon" className="bg-primary hover:bg-primary/90 rounded-lg">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
