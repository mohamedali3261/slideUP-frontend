import { SkeletonCard, SkeletonGrid } from './ui/skeleton-card';
import { useLanguage } from '@/contexts/LanguageContext';

// Loading state for Templates page
export const TemplatesLoading = () => {
  const { language } = useLanguage();
  
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header skeleton */}
      <div className="text-center mb-12 space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse w-64 mx-auto" />
        <div className="h-5 bg-muted rounded animate-pulse w-96 mx-auto" />
      </div>
      
      {/* Category tabs skeleton */}
      <div className="flex gap-2 mb-8 justify-center flex-wrap">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-24 bg-muted rounded-full animate-pulse" />
        ))}
      </div>
      
      {/* Template cards skeleton */}
      <SkeletonGrid count={6} variant="template" />
    </div>
  );
};

// Loading state for Dashboard presentations
export const DashboardLoading = () => {
  const { language } = useLanguage();
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 bg-muted rounded animate-pulse w-48" />
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
      </div>
      
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <div className="h-4 bg-muted rounded animate-pulse w-24 mb-4" />
            <div className="h-8 bg-muted rounded animate-pulse w-16" />
          </div>
        ))}
      </div>
      
      {/* Presentations list skeleton */}
      <SkeletonGrid count={4} variant="presentation" />
    </div>
  );
};

// Loading state for Slides Panel
export const SlidesPanelLoading = () => {
  return (
    <div className="p-4 space-y-2">
      <SkeletonGrid count={5} variant="slide" />
    </div>
  );
};

// Loading state for Image Search
export const ImageSearchLoading = () => {
  return (
    <div className="p-4">
      {/* Search bar skeleton */}
      <div className="mb-4">
        <div className="h-10 bg-muted rounded animate-pulse w-full" />
      </div>
      
      {/* Images grid skeleton */}
      <SkeletonGrid count={9} variant="image" />
    </div>
  );
};

// Loading state for Community Templates
export const CommunityTemplatesLoading = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8 space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse w-64" />
        <div className="h-5 bg-muted rounded animate-pulse w-96" />
      </div>
      
      {/* Filter buttons skeleton */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-20 bg-muted rounded animate-pulse" />
        ))}
      </div>
      
      {/* Templates grid skeleton */}
      <SkeletonGrid count={8} variant="template" />
    </div>
  );
};

// Inline loading spinner (for buttons, etc.)
export const InlineLoader = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
  
  return (
    <div className={`${sizeClass} border-2 border-current border-t-transparent rounded-full animate-spin`} />
  );
};

// Full page loading
export const FullPageLoading = ({ message }: { message?: string }) => {
  const { language } = useLanguage();
  const defaultMessage = language === 'ar' ? 'جاري التحميل...' : 'Loading...';
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-lg font-medium">{message || defaultMessage}</p>
      </div>
    </div>
  );
};

// Card loading overlay (for individual cards)
export const CardLoadingOverlay = () => {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

// Shimmer effect (alternative to pulse)
export const ShimmerCard = ({ className }: { className?: string }) => {
  return (
    <div className={`relative overflow-hidden bg-muted rounded-lg ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
};
