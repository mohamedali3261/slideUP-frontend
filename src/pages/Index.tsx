import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { ModernTemplateCard } from '@/components/ModernTemplateCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { templates } from '@/data/templates';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Users, Award, Rocket } from 'lucide-react';

const Index = () => {
  const { t, language, direction } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Templates Preview Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-1/2 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 sm:mb-16">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4">
                {t('templates.title')}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground">
                {t('templates.subtitle')}
              </p>
            </div>
            <Button variant="outline" size="lg" asChild className="mt-6 md:mt-0 group border-2 w-full sm:w-auto">
              <Link to="/templates">
                {language === 'ar' ? 'عرض الكل' : 'View All Templates'}
                <ArrowRight className={`w-4 h-4 sm:w-5 sm:h-5 ${direction === 'rtl' ? 'mr-2 rotate-180' : 'ml-2'} group-hover:translate-x-1 transition-transform`} />
              </Link>
            </Button>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {templates.slice(0, 4).map((template, index) => (
              <div 
                key={template.id} 
                className="transform transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ModernTemplateCard
                  id={template.id}
                  title={template.titleKey}
                  description={language === 'ar' ? (template.description || '') : (template.descriptionEn || template.description || '')}
                  category={t(template.categoryKey)}
                  image={template.image}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-card border-y border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { icon: Users, value: '50,000+', label: language === 'ar' ? 'مستخدم نشط' : 'Active Users' },
              { icon: Sparkles, value: '500+', label: language === 'ar' ? 'قالب جاهز' : 'Ready Templates' },
              { icon: Award, value: '4.9/5', label: language === 'ar' ? 'تقييم المستخدمين' : 'User Rating' },
              { icon: Rocket, value: '1M+', label: language === 'ar' ? 'عرض تم إنشاؤه' : 'Presentations Made' },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground px-2">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 sm:w-96 h-64 sm:h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] sm:bg-[size:60px_60px]" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 sm:mb-8">
              <Rocket className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              <span className="text-xs sm:text-sm font-medium text-white/90">
                {language === 'ar' ? 'ابدأ مجاناً اليوم' : 'Start Free Today'}
              </span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              {language === 'ar' 
                ? 'جاهز لإنشاء عروض مذهلة؟' 
                : 'Ready to Create Amazing Presentations?'}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/80 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              {language === 'ar'
                ? 'انضم لآلاف المحترفين الذين يثقون في SlideUP لاحتياجات عروضهم التقديمية.'
                : 'Join thousands of professionals who trust SlideUP for their presentation needs.'}
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg bg-white text-primary hover:bg-white/90 shadow-xl shadow-black/20 w-full sm:w-auto"
              >
                <Link to="/templates">
                  {language === 'ar' ? 'ابدأ مجاناً' : 'Get Started Free'}
                  <ArrowRight className={`w-4 h-4 sm:w-5 sm:h-5 ${direction === 'rtl' ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 w-full sm:w-auto"
              >
                <Link to="/dashboard">
                  {language === 'ar' ? 'تصفح القوالب' : 'Browse Templates'}
                </Link>
              </Button>
            </div>


          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
