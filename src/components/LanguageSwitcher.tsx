import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LanguageSwitcherProps {
  variant?: 'navbar' | 'editor' | 'admin';
  className?: string;
}

export const LanguageSwitcher = ({ variant = 'navbar', className = '' }: LanguageSwitcherProps) => {
  const { language, setLanguage, direction } = useLanguage();

  // For editor variant, use direct toggle button
  if (variant === 'editor') {
    return (
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
        className={`h-6 px-2 text-[10px] font-semibold rounded hover:bg-muted/50 transition-all ${className}`}
        title={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
      >
        {language === 'ar' ? 'EN' : 'عربي'}
      </Button>
    );
  }

  // For navbar and admin, keep the dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={`rounded-xl hover:bg-muted/50 relative group ${
            variant === 'admin' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : ''
          } ${className}`}
        >
          <div className="relative">
            <Globe className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={direction === 'rtl' ? 'start' : 'end'} className="rounded-xl min-w-[160px]">
        <DropdownMenuItem 
          onClick={() => setLanguage('en')} 
          className={`rounded-lg cursor-pointer transition-all ${language === 'en' ? 'bg-primary/10 text-primary' : ''}`}
        >
          <span className="text-lg mr-2">🇬🇧</span>
          <span className={language === 'en' ? 'font-semibold' : ''}>English</span>
          {language === 'en' && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('ar')} 
          className={`rounded-lg cursor-pointer transition-all ${language === 'ar' ? 'bg-primary/10 text-primary' : ''}`}
        >
          <span className="text-lg mr-2">🇸🇦</span>
          <span className={language === 'ar' ? 'font-semibold' : ''}>العربية</span>
          {language === 'ar' && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
