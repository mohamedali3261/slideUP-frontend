import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  variant?: 'template' | 'presentation' | 'slide' | 'image';
}

export const SkeletonCard = ({ className, variant = 'template' }: SkeletonCardProps) => {
  if (variant === 'template') {
    return (
      <div className={cn("rounded-xl border bg-card overflow-hidden", className)}>
        {/* Image skeleton */}
        <div className="w-full h-48 bg-muted animate-pulse" />
        
        {/* Content skeleton */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
          
          {/* Description */}
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded animate-pulse w-full" />
            <div className="h-3 bg-muted rounded animate-pulse w-5/6" />
          </div>
          
          {/* Button */}
          <div className="h-9 bg-muted rounded animate-pulse w-full mt-4" />
        </div>
      </div>
    );
  }

  if (variant === 'presentation') {
    return (
      <div className={cn("rounded-xl border bg-card overflow-hidden", className)}>
        <div className="flex gap-4 p-4">
          {/* Thumbnail skeleton */}
          <div className="w-32 h-20 bg-muted rounded animate-pulse flex-shrink-0" />
          
          {/* Content */}
          <div className="flex-1 space-y-2">
            {/* Title */}
            <div className="h-5 bg-muted rounded animate-pulse w-2/3" />
            
            {/* Meta info */}
            <div className="flex gap-2">
              <div className="h-3 bg-muted rounded animate-pulse w-20" />
              <div className="h-3 bg-muted rounded animate-pulse w-24" />
            </div>
            
            {/* Date */}
            <div className="h-3 bg-muted rounded animate-pulse w-32" />
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-muted rounded animate-pulse" />
            <div className="w-8 h-8 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'slide') {
    return (
      <div className={cn("rounded-lg border bg-card overflow-hidden", className)}>
        {/* Slide preview skeleton */}
        <div className="w-full aspect-video bg-muted animate-pulse" />
        
        {/* Slide number */}
        <div className="p-2">
          <div className="h-3 bg-muted rounded animate-pulse w-12 mx-auto" />
        </div>
      </div>
    );
  }

  if (variant === 'image') {
    return (
      <div className={cn("rounded-lg overflow-hidden", className)}>
        {/* Image skeleton */}
        <div className="w-full aspect-square bg-muted animate-pulse" />
      </div>
    );
  }

  return null;
};

// Grid of skeleton cards
interface SkeletonGridProps {
  count?: number;
  variant?: 'template' | 'presentation' | 'slide' | 'image';
  className?: string;
}

export const SkeletonGrid = ({ count = 6, variant = 'template', className }: SkeletonGridProps) => {
  const gridClass = variant === 'template' || variant === 'image' 
    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    : variant === 'slide'
    ? "space-y-2"
    : "space-y-4";

  return (
    <div className={cn(gridClass, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
};
