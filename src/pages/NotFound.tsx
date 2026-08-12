import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <LanguageSwitcher variant="navbar" className="fixed top-4 right-4 z-50" />
      <div className="text-center">
        <h1 className="mb-3 sm:mb-4 text-6xl sm:text-7xl md:text-8xl font-bold">404</h1>
        <p className="mb-4 sm:mb-6 text-lg sm:text-xl md:text-2xl text-muted-foreground">
          {language === 'ar' ? 'عذراً! الصفحة غير موجودة' : 'Oops! Page not found'}
        </p>
        <a href="/" className="inline-block text-sm sm:text-base text-primary underline hover:text-primary/90 transition-colors">
          {language === 'ar' ? 'العودة للرئيسية' : 'Return to Home'}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
