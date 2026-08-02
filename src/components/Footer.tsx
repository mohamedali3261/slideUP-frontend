import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Presentation } from 'lucide-react';
import logo from '@/assets/logoo.png';

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="relative bg-gradient-to-b from-card to-background border-t border-border/50 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 group">
              <img 
                src={logo} 
                alt="SlideUP Logo" 
                className="h-12 sm:h-14 w-auto group-hover:scale-105 transition-transform"
              />
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Create stunning presentations with professional templates.
            </p>
            
            {/* Social links placeholder */}
            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
              {['twitter', 'github', 'linkedin'].map((social) => (
                <a key={social} href="#" className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-muted/50 hover:bg-primary/20 flex items-center justify-center transition-colors group">
                  <span className="text-muted-foreground group-hover:text-primary transition-colors text-xs sm:text-sm">
                    {social[0].toUpperCase()}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-foreground mb-4 sm:mb-5 text-xs sm:text-sm uppercase tracking-wider">{t('footer.product')}</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link to="/templates" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 sm:gap-2 group">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                  {t('nav.templates')}
                </Link>
              </li>
              <li>
                <Link to="/editor" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 sm:gap-2 group">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                  {t('nav.editor')}
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 sm:gap-2 group">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                  {t('nav.pricing')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-foreground mb-4 sm:mb-5 text-xs sm:text-sm uppercase tracking-wider">{t('footer.company')}</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 sm:gap-2 group">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 sm:gap-2 group">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 sm:gap-2 group">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                  Careers
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-foreground mb-4 sm:mb-5 text-xs sm:text-sm uppercase tracking-wider">{t('footer.support')}</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 sm:gap-2 group">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 sm:gap-2 group">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 sm:gap-2 group">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                  Privacy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-border/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              © {new Date().getFullYear()} SlideUP. {t('footer.rights')}.
            </p>
            <div className="flex items-center gap-4 sm:gap-6">
              <a href="#" className="text-[10px] sm:text-xs text-muted-foreground hover:text-primary transition-colors">Terms</a>
              <a href="#" className="text-[10px] sm:text-xs text-muted-foreground hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="text-[10px] sm:text-xs text-muted-foreground hover:text-primary transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
