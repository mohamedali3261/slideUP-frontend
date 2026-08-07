import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LiveTemplateCard } from '@/components/LiveTemplateCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { templates } from '@/data/templates';
import { Search, ChevronDown, Filter, LayoutGrid, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useEffect } from 'react';
import { SkeletonGrid } from '@/components/ui/skeleton-card';

const categories = [
  { label: 'all', value: '' },
  { label: 'business', value: 'business' },
  { label: 'technology', value: 'technology' },
  { label: 'education', value: 'education' },
  { label: 'marketing', value: 'marketing' },
  { label: 'finance', value: 'finance' },
  { label: 'sports', value: 'sports' },
  { label: 'architecture', value: 'architecture' },
  { label: 'travel', value: 'travel' },
  { label: 'medical', value: 'medical' },
  { label: 'realestate', value: 'realestate' },
  { label: 'restaurant', value: 'restaurant' },
  { label: 'event', value: 'event' },
  { label: 'ecommerce', value: 'ecommerce' },
];

export const Templates = () => {
  const { t, direction, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
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
    const matchesCategory = activeCategory === '' || template.categoryKey.toLowerCase().includes(activeCategory);
    return matchesSearch && matchesCategory;
  });

  const newTemplatesCount = templates.filter(template => template.isNew).length;
  const currentCategoryLabel = activeCategory === ''
    ? (language === 'ar' ? 'كل التصنيفات' : 'All Categories')
    : t(`templates.${activeCategory}`);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-purple-600 to-indigo-700 p-8 sm:p-12 mb-8 sm:mb-10 shadow-2xl shadow-primary/20">
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-purple-300/20 blur-3xl" />
            <div className="absolute top-8 left-1/3 w-20 h-20 rounded-2xl bg-white/10 rotate-12 hidden md:block" />
            <div className="absolute bottom-10 right-1/4 w-12 h-12 rounded-full bg-white/10 hidden md:block" />
            <div className="absolute top-1/3 right-1/3 w-3 h-3 rounded-full bg-amber-300 hidden md:block" />
            
            <div className="relative z-10 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold mb-4 backdrop-blur">
                <Sparkles className="w-3.5 h-3.5" />
                {language === 'ar' ? 'مكتبة القوالب' : 'Template Library'}
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3 sm:mb-4">
                {t('templates.title')}
              </h1>
              <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto">
                {t('templates.subtitle')}
              </p>
              <div className="flex flex-wrap justify-center gap-2.5 mt-6">
                <Badge className="bg-white/15 text-white border-white/20 px-3 py-1.5 rounded-full">
                  <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                  {templates.length} {language === 'ar' ? 'قالب' : 'templates'}
                </Badge>
                <Badge className="bg-gradient-to-r from-amber-400 to-pink-500 text-white border-none px-3 py-1.5 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  {newTemplatesCount} {language === 'ar' ? 'جديد' : 'new'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground ${direction === 'rtl' ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={language === 'ar' ? 'ابحث عن قالب...' : 'Search templates...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${direction === 'rtl' ? 'pr-9 sm:pr-10' : 'pl-9 sm:pl-10'} h-9 sm:h-10 text-sm rounded-xl`}
              />
            </div>

            {/* Category Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 sm:h-10 gap-2 rounded-xl justify-between min-w-[190px]">
                  <span className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{currentCategoryLabel}</span>
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto rounded-xl">
                <DropdownMenuLabel>
                  {language === 'ar' ? 'التصنيفات' : 'Categories'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={activeCategory} onValueChange={setActiveCategory}>
                  {categories.map((category) => (
                    <DropdownMenuRadioItem
                      key={category.value || 'all'}
                      value={category.value}
                      className="capitalize"
                    >
                      {category.value === '' ? (language === 'ar' ? 'الكل' : 'All') : t(`templates.${category.value}`)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
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
                  <LiveTemplateCard
                    key={template.id}
                    template={template}
                    description={language === 'ar' ? (template.description || '') : (template.descriptionEn || template.description || '')}
                    category={t(template.categoryKey)}
                  />
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <Search className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium mb-1">
                    {language === 'ar' ? 'لا توجد قوالب مطابقة' : 'No templates found matching your criteria.'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => { setSearchQuery(''); setActiveCategory(''); }}
                  >
                    {language === 'ar' ? 'مسح البحث والتصفية' : 'Clear search & filters'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Templates;
