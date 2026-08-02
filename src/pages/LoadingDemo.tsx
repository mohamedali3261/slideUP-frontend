import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SkeletonCard,
  SkeletonGrid,
} from '@/components/ui/skeleton-card';
import {
  TemplatesLoading,
  DashboardLoading,
  SlidesPanelLoading,
  ImageSearchLoading,
  CommunityTemplatesLoading,
  InlineLoader,
  FullPageLoading,
  CardLoadingOverlay,
  ShimmerCard,
} from '@/components/LoadingStates';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LoadingDemo() {
  const { language } = useLanguage();
  const [showFullPage, setShowFullPage] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);

  const handleButtonClick = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 2000);
  };

  const handleCardClick = () => {
    setCardLoading(true);
    setTimeout(() => setCardLoading(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          {language === 'ar' ? 'عرض حالات التحميل' : 'Loading States Demo'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' 
            ? 'جميع أنواع كروت التحميل المتاحة في التطبيق'
            : 'All available loading states in the application'}
        </p>
      </div>

      <Tabs defaultValue="skeleton" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="skeleton">
            {language === 'ar' ? 'Skeleton' : 'Skeleton'}
          </TabsTrigger>
          <TabsTrigger value="pages">
            {language === 'ar' ? 'الصفحات' : 'Pages'}
          </TabsTrigger>
          <TabsTrigger value="components">
            {language === 'ar' ? 'المكونات' : 'Components'}
          </TabsTrigger>
          <TabsTrigger value="effects">
            {language === 'ar' ? 'التأثيرات' : 'Effects'}
          </TabsTrigger>
        </TabsList>

        {/* Skeleton Cards Tab */}
        <TabsContent value="skeleton" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'كارت قالب واحد' : 'Single Template Card'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'كارت تحميل لقالب واحد' : 'Loading card for a single template'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SkeletonCard variant="template" className="max-w-sm" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'شبكة قوالب' : 'Template Grid'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'شبكة من كروت التحميل' : 'Grid of loading cards'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SkeletonGrid count={6} variant="template" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'كارت عرض تقديمي' : 'Presentation Card'}</CardTitle>
            </CardHeader>
            <CardContent>
              <SkeletonCard variant="presentation" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'كروت الشرائح' : 'Slide Cards'}</CardTitle>
            </CardHeader>
            <CardContent>
              <SkeletonGrid count={4} variant="slide" className="max-w-xs" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'شبكة صور' : 'Image Grid'}</CardTitle>
            </CardHeader>
            <CardContent>
              <SkeletonGrid count={9} variant="image" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Full Pages Tab */}
        <TabsContent value="pages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'صفحة القوالب' : 'Templates Page'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <TemplatesLoading />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <DashboardLoading />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'قائمة الشرائح' : 'Slides Panel'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden max-w-xs">
                <SlidesPanelLoading />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'البحث عن الصور' : 'Image Search'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <ImageSearchLoading />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'القوالب المجتمعية' : 'Community Templates'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <CommunityTemplatesLoading />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'زر مع تحميل' : 'Button with Loading'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={handleButtonClick} disabled={buttonLoading}>
                  {buttonLoading ? (
                    <>
                      <InlineLoader size="sm" />
                      <span className={language === 'ar' ? 'mr-2' : 'ml-2'}>
                        {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                      </span>
                    </>
                  ) : (
                    language === 'ar' ? 'حفظ' : 'Save'
                  )}
                </Button>

                <Button variant="outline">
                  <InlineLoader size="sm" />
                  <span className={language === 'ar' ? 'mr-2' : 'ml-2'}>
                    {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                  </span>
                </Button>
              </div>

              <div className="flex gap-4 items-center">
                <InlineLoader size="sm" />
                <InlineLoader size="md" />
                <InlineLoader size="lg" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'تحميل الصفحة كاملة' : 'Full Page Loading'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => {
                setShowFullPage(true);
                setTimeout(() => setShowFullPage(false), 3000);
              }}>
                {language === 'ar' ? 'عرض تحميل الصفحة' : 'Show Full Page Loading'}
              </Button>
              {showFullPage && (
                <FullPageLoading 
                  message={language === 'ar' ? 'جاري معالجة العرض التقديمي...' : 'Processing presentation...'}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'تحميل الكارت' : 'Card Loading Overlay'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCardClick} className="mb-4">
                {language === 'ar' ? 'تفعيل التحميل' : 'Activate Loading'}
              </Button>
              
              <div className="relative border rounded-lg p-6 min-h-[200px]">
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'ar' ? 'محتوى الكارت' : 'Card Content'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'ar' 
                    ? 'هذا محتوى الكارت الذي سيتم تغطيته بطبقة التحميل'
                    : 'This is the card content that will be covered by the loading overlay'}
                </p>
                {cardLoading && <CardLoadingOverlay />}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Effects Tab */}
        <TabsContent value="effects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'تأثير Shimmer' : 'Shimmer Effect'}</CardTitle>
              <CardDescription>
                {language === 'ar' 
                  ? 'تأثير لامع متحرك بدلاً من النبض العادي'
                  : 'Animated shimmer effect instead of regular pulse'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ShimmerCard className="w-full h-48" />
              <ShimmerCard className="w-3/4 h-32" />
              <ShimmerCard className="w-1/2 h-24" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'تأثير Pulse' : 'Pulse Effect'}</CardTitle>
              <CardDescription>
                {language === 'ar' 
                  ? 'التأثير الافتراضي للتحميل'
                  : 'Default loading effect'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full h-48 bg-muted rounded-lg animate-pulse" />
              <div className="w-3/4 h-32 bg-muted rounded-lg animate-pulse" />
              <div className="w-1/2 h-24 bg-muted rounded-lg animate-pulse" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'Spinner دوار' : 'Spinning Loader'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-8 items-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
