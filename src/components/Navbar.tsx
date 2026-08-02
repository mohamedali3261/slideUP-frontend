import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Presentation, Menu, X, LogOut, Shield } from 'lucide-react';
import { useState } from 'react';
import logo from '@/assets/logoo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationBell } from '@/components/NotificationBell';
import { SupportDialog } from '@/components/SupportDialog';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';

export const Navbar = () => {
  const { t, language, setLanguage, direction } = useLanguage();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/', label: t('nav.home') },
    ...(user ? [{ to: '/dashboard', label: t('nav.dashboard') }] : []),
    { to: '/templates', label: t('nav.templates') },
    ...(user ? [{ to: '/editor', label: t('nav.editor') }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <img 
              src={logo} 
              alt="SlideUP Logo" 
              className="h-12 sm:h-14 md:h-16 w-auto group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(link.to)
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {/* Theme Toggle */}
            <ThemeToggle variant="navbar" />
            
            {/* Language Switcher */}
            <LanguageSwitcher variant="navbar" />

            {/* Notification Bell & Support - Only for logged in users */}
            {user && (
              <>
                <NotificationBell />
                <SupportDialog />
              </>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-xl hover:bg-muted/50">
                    {user.username}
                    {user.role === 'admin' && <Shield className="w-3 h-3 ml-1 text-primary" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={direction === 'rtl' ? 'start' : 'end'} className="rounded-xl">
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/admin')} className="rounded-lg">
                        <Shield className="w-4 h-4 mr-2" />
                        لوحة التحكم
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="rounded-lg">
                    <LogOut className="w-4 h-4 mr-2" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="rounded-xl hover:bg-muted/50">
                  <Link to="/login">{t('nav.signIn')}</Link>
                </Button>
                <Button size="sm" asChild className="rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20">
                  <Link to="/templates">{t('nav.getStarted')}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-muted/50 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
            ) : (
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 sm:py-4 border-t border-border">
            <div className="flex flex-col gap-2 sm:gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive(link.to)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center gap-2 px-3 sm:px-4 pt-2 sm:pt-3 border-t border-border">
                <ThemeToggle variant="editor" />
                <LanguageSwitcher variant="editor" />
                {user ? (
                  <>
                    <SupportDialog />
                    <Button size="sm" variant="outline" className="flex-1 text-xs sm:text-sm" onClick={handleLogout}>
                      <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      خروج
                    </Button>
                  </>
                ) : (
                  <Button size="sm" className="flex-1 text-xs sm:text-sm" asChild>
                    <Link to="/login">{t('nav.signIn')}</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
