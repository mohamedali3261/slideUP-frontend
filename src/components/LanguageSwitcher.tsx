import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'navbar' | 'editor' | 'admin' | 'overlay';
  className?: string;
  showLabel?: boolean;
}

const FLAGS = {
  ar: '🇸🇦',
  en: '🇬🇧',
} as const;

const LABELS = {
  ar: 'العربية',
  en: 'English',
} as const;

const BASE_CLASSES =
  'group relative flex items-center gap-1.5 rounded-full border font-medium transition-all duration-300 hover:scale-105 active:scale-95';

const VARIANT_CLASSES: Record<NonNullable<LanguageSwitcherProps['variant']>, string> = {
  navbar:
    'bg-muted/40 text-foreground border-border/60 shadow-sm hover:bg-muted/70 hover:border-primary/40 hover:shadow-md',
  editor:
    'bg-muted/30 text-foreground border-border/50 h-7 px-2 text-[11px] hover:bg-primary/10 hover:text-primary hover:border-primary/30',
  admin:
    'bg-slate-800 text-slate-200 border-slate-600/60 shadow-sm hover:bg-slate-700 hover:border-slate-400/50 hover:text-white',
  overlay:
    'bg-white/15 text-white border-white/30 shadow-lg backdrop-blur-md hover:bg-white/25 hover:border-white/50 hover:shadow-xl',
};

export const LanguageSwitcher = ({ variant = 'navbar', className = '', showLabel = true }: LanguageSwitcherProps) => {
  const { language, setLanguage, direction } = useLanguage();
  const isAr = language === 'ar';

  // Editor variant: quick one-click toggle pill
  if (variant === 'editor') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage(isAr ? 'en' : 'ar')}
        className={cn(BASE_CLASSES, VARIANT_CLASSES.editor, className)}
        title={isAr ? 'Switch to English' : 'التبديل للعربية'}
      >
        <span className="text-xs leading-none">{FLAGS[language]}</span>
        <span className="font-bold">{isAr ? 'EN' : 'عربي'}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn(BASE_CLASSES, VARIANT_CLASSES[variant], className)}>
          <span className="text-sm leading-none">{FLAGS[language]}</span>
          {showLabel && <span className="text-xs">{LABELS[language]}</span>}
          <ChevronDown className="w-3 h-3 opacity-60 transition-opacity duration-300 group-hover:opacity-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={direction === 'rtl' ? 'start' : 'end'}
        className={cn('rounded-xl min-w-[170px] p-1', variant === 'admin' && 'bg-slate-900 border-slate-700')}
      >
        <DropdownMenuItem
          onClick={() => setLanguage('ar')}
          className={cn('cursor-pointer rounded-lg transition-colors', language === 'ar' ? 'bg-primary/10 text-primary' : '')}
        >
          <span className="text-base mr-2 leading-none">{FLAGS.ar}</span>
          <span className={cn(language === 'ar' && 'font-semibold')}>{LABELS.ar}</span>
          {language === 'ar' && <Check className="w-4 h-4 ml-auto text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage('en')}
          className={cn('cursor-pointer rounded-lg transition-colors', language === 'en' ? 'bg-primary/10 text-primary' : '')}
        >
          <span className="text-base mr-2 leading-none">{FLAGS.en}</span>
          <span className={cn(language === 'en' && 'font-semibold')}>{LABELS.en}</span>
          {language === 'en' && <Check className="w-4 h-4 ml-auto text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
