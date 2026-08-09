import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

const WHATSAPP_NUMBER = '01115582202';
const WHATSAPP_LINK = 'https://wa.me/201115582202';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

export const SupportDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();

  const t = {
    support: language === 'ar' ? 'الدعم الفني' : 'Support',
    whatsappTitle: language === 'ar' ? 'تواصل معنا واتساب' : 'Chat with us on WhatsApp',
    whatsappText: language === 'ar'
      ? 'شكراً لثقتك فينا! لو عايز تعديلات أو عندك أي استفسار، تواصل معنا على واتساب في أي وقت.'
      : 'Thank you for trusting us! If you need any customizations or have a question, reach out to us on WhatsApp anytime.',
    openWhatsapp: language === 'ar' ? 'افتح واتساب' : 'Open WhatsApp',
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

        {/* WhatsApp Contact Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white p-6 shadow-lg shadow-emerald-500/25">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/10" />
          <div className="relative flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 shadow-inner">
              <WhatsAppIcon className="w-8 h-8" />
            </div>
            <p className="font-bold text-base">{t.whatsappTitle}</p>
            <p className="text-sm text-emerald-50/90 leading-relaxed">{t.whatsappText}</p>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 transition-colors rounded-full px-6 py-2.5 text-sm font-bold shadow-md hover:shadow-lg"
            >
              <WhatsAppIcon className="w-4 h-4" />
              {t.openWhatsapp}
            </a>
            <span className="text-xs text-emerald-50/80 tracking-wide">{WHATSAPP_NUMBER}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
