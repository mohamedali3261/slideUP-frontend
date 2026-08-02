import { useLanguage } from '@/contexts/LanguageContext';
import { Layout, Palette, Download, Globe, Wand2, Layers, Zap, Shield } from 'lucide-react';

const features = [
  {
    icon: Layout,
    titleKey: 'features.templates',
    descKey: 'features.templatesDesc',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Wand2,
    titleKey: 'features.editor',
    descKey: 'features.editorDesc',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Download,
    titleKey: 'features.export',
    descKey: 'features.exportDesc',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: Globe,
    titleKey: 'features.multilingual',
    descKey: 'features.multilingualDesc',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-500/10',
  },
];

const additionalFeatures = [
  { icon: Layers, label: { en: 'Layer Management', ar: 'إدارة الطبقات' } },
  { icon: Zap, label: { en: 'Fast Performance', ar: 'أداء سريع' } },
  { icon: Shield, label: { en: 'Secure & Private', ar: 'آمن وخاص' } },
  { icon: Palette, label: { en: 'Custom Themes', ar: 'ثيمات مخصصة' } },
];

export const FeaturesSection = () => {
  const { t, language } = useLanguage();

  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-background via-card to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 lg:mb-20 relative">
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full mb-6 sm:mb-8 border border-primary/20 backdrop-blur-sm">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-primary animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              {language === 'ar' ? 'مميزات قوية' : 'Powerful Features'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 sm:mb-8 leading-tight">
            {t('features.title')}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16 lg:mb-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative p-6 sm:p-8 bg-background/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.08] rounded-2xl sm:rounded-3xl transition-opacity duration-500`} />
                
                {/* Glow effect */}
                <div className={`absolute -inset-px bg-gradient-to-br ${feature.color} rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />
                
                <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ${feature.bgColor} flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: feature.color.includes('blue') ? '#3b82f6' : feature.color.includes('purple') ? '#a855f7' : feature.color.includes('green') ? '#22c55e' : '#f97316' }} />
                </div>
                
                <h3 className="relative text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4 group-hover:text-primary transition-colors duration-300">
                  {t(feature.titleKey)}
                </h3>
                <p className="relative text-muted-foreground leading-relaxed text-sm">
                  {t(feature.descKey)}
                </p>

                {/* Arrow indicator */}
                <div className="absolute bottom-6 sm:bottom-8 right-6 sm:right-8 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Features Bar */}
        <div className="relative bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border border-primary/20 backdrop-blur-sm overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(168,85,247,0.1),transparent_50%)]" />
          
          <div className="relative grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-12">
            {additionalFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group flex flex-col sm:flex-row items-center gap-2 sm:gap-4 px-3 sm:px-6 py-3 rounded-xl sm:rounded-2xl bg-background/50 border border-transparent hover:border-primary/30 hover:bg-background/80 transition-all duration-300 cursor-default">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground text-xs sm:text-sm text-center sm:text-left">{language === 'ar' ? feature.label.ar : feature.label.en}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
