import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Play, Sparkles, CheckCircle2, Globe } from 'lucide-react';
import heroImage from '@/assets/hero-presentation.jpg';

export const HeroSection = () => {
  const { t, language, direction } = useLanguage();

  return (
    <section className="relative min-h-[calc(100vh-4rem)] sm:min-h-screen flex items-center pt-16 sm:pt-20 pb-8 sm:pb-0 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-purple-500/10" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-20 right-10 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-purple-500/20 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <div className={`space-y-6 sm:space-y-8 ${direction === 'rtl' ? 'lg:order-2' : ''}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 rounded-full backdrop-blur-md shadow-lg shadow-primary/10">
              <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-primary"></span>
              </span>
              <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                {language === 'ar' ? 'مجاني للبدء' : 'Free to start'}
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
                {t('hero.title')}{' '}
                <span className="relative inline-block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_auto] animate-gradient">
                    {t('hero.subtitle')}
                  </span>
                  <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                    <path d="M1 5.5Q50 1 100 5.5T199 5.5" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
                    <defs><linearGradient id="gradient" x1="0" y1="0" x2="200" y2="0"><stop stopColor="hsl(var(--primary))"/><stop offset="1" stopColor="#a855f7"/></linearGradient></defs>
                  </svg>
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                {t('hero.description')}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-5">
              <Button size="lg" asChild className="group h-12 sm:h-14 px-6 sm:px-10 text-base sm:text-lg font-semibold shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-300 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-500">
                <Link to="/templates">
                  {t('hero.cta')}
                  <ArrowRight className={`w-4 h-4 sm:w-5 sm:h-5 ${direction === 'rtl' ? 'mr-2 sm:mr-3 rotate-180' : 'ml-2 sm:ml-3'} group-hover:translate-x-1 transition-transform`} />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 sm:h-14 px-6 sm:px-10 text-base sm:text-lg font-semibold border-2 hover:bg-primary/10 hover:border-primary/50 hover:scale-105 transition-all duration-300">
                <Link to="/templates">
                  <Play className={`w-4 h-4 sm:w-5 sm:h-5 ${direction === 'rtl' ? 'ml-2 sm:ml-3' : 'mr-2 sm:mr-3'} fill-current`} />
                  {t('hero.secondary')}
                </Link>
              </Button>
            </div>


          </div>

          {/* Hero Image */}
          <div className={`relative mt-8 lg:mt-0 ${direction === 'rtl' ? 'lg:order-1' : ''}`}>
            {/* Main image container */}
            <div className="relative group">
              {/* Glow effect behind image */}
              <div className="absolute -inset-4 sm:-inset-6 bg-gradient-to-r from-primary/30 via-purple-500/30 to-primary/30 rounded-2xl sm:rounded-[2rem] blur-2xl sm:blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
              
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-card">
                <img
                  src={heroImage}
                  alt="SlideUP presentation preview"
                  className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
                
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
            
            {/* Floating card - RTL Support */}
            <div className="absolute -bottom-4 sm:-bottom-8 -left-4 sm:-left-8 bg-card/95 backdrop-blur-xl p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-2xl border border-primary/20 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div>
                  <span className="text-sm sm:text-base font-bold text-foreground block">{language === 'ar' ? 'دعم كامل' : 'Full RTL'}</span>
                  <span className="text-xs sm:text-sm text-muted-foreground">{language === 'ar' ? 'عربي وإنجليزي' : 'Arabic & English'}</span>
                </div>
              </div>
            </div>
            
            {/* Additional floating element */}
            <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 bg-card/95 backdrop-blur-xl px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-xl border border-green-500/20">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-green-500">{language === 'ar' ? 'مجاني' : 'Free'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>


    </section>
  );
};
