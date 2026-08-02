import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { TemplateCard } from '@/components/TemplateCard';
import { ModernTemplateCard } from '@/components/ModernTemplateCard';
import { CommunityTemplates } from '@/components/CommunityTemplates';
import { useLanguage } from '@/contexts/LanguageContext';
import { templates } from '@/data/templates';
import { Search, Filter, Users, Layout } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { SkeletonGrid } from '@/components/ui/skeleton-card';

const categories = ['All', 'Business', 'Startup', 'Education', 'Marketing'];

export const Templates = () => {
  const { t, direction, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('official');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading templates
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.titleKey.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || 
      template.categoryKey.toLowerCase().includes(activeCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              {t('templates.title')}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              {t('templates.subtitle')}
            </p>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6 sm:mb-8">
              <TabsTrigger value="official" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Layout className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {language === 'ar' ? 'القوالب الرسمية' : 'Official Templates'}
              </TabsTrigger>
              <TabsTrigger value="community" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {language === 'ar' ? 'قوالب المجتمع' : 'Community'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="official">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground ${direction === 'rtl' ? 'right-3' : 'left-3'}`} />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${direction === 'rtl' ? 'pr-9 sm:pr-10' : 'pl-9 sm:pl-10'} h-9 sm:h-10 text-sm`}
                  />
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={activeCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveCategory(category)}
                      className="text-xs sm:text-sm h-8 sm:h-9"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Section Title */}
              <div className="mb-8 sm:mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight">
                  {language === 'ar' ? (
                    <>
                      قوالب احترافية<br />
                      <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        موثوقة من قبل الشركات الرائدة
                      </span>
                    </>
                  ) : (
                    <>
                      leading companies<br />
                      <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        have trusted us
                      </span>
                    </>
                  )}
                </h2>
              </div>

              {/* Templates Grid */}
              {loading ? (
                <SkeletonGrid count={6} variant="template" />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredTemplates.map((template) => (
                      <ModernTemplateCard
                        key={template.id}
                        id={template.id}
                        title={template.titleKey}
                        description={language === 'ar' ? (template.description || '') : (template.descriptionEn || template.description || '')}
                        category={t(template.categoryKey)}
                        image={template.image}
                      />
                    ))}
                  </div>

                  {filteredTemplates.length === 0 && (
                    <div className="text-center py-16">
                      <p className="text-muted-foreground">
                        {language === 'ar' ? 'لا توجد قوالب مطابقة' : 'No templates found matching your criteria.'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="community">
              <CommunityTemplates />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Templates;
