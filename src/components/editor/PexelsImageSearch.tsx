import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SkeletonGrid } from '@/components/ui/skeleton-card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, ImageIcon, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';

const PEXELS_API_KEY_ENCODED = 'amtMOFlTNHV2OXZTaGxiVkNjRGlRZDJjTDFvakhQZ0gyMFRBMG53eW1SZkdYbWEyc3JmSEh5TTQ=';
const PEXELS_API_KEY = atob(PEXELS_API_KEY_ENCODED);

// دالة ترجمة النص العربي للإنجليزي باستخدام Google Translate API
const translateToEnglish = async (text: string): Promise<string> => {
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  if (!hasArabic) return text;
  
  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(text)}`
    );
    if (!response.ok) return text;
    const data = await response.json();
    return data?.[0]?.[0]?.[0] || text;
  } catch {
    return text;
  }
};

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

interface PexelsImageSearchProps {
  onSelectImage: (imageUrl: string) => void;
  trigger?: React.ReactNode;
}

export const PexelsImageSearch = ({ onSelectImage, trigger }: PexelsImageSearchProps) => {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: 'nature', label: language === 'ar' ? 'طبيعة' : 'Nature' },
    { id: 'business', label: language === 'ar' ? 'أعمال' : 'Business' },
    { id: 'technology', label: language === 'ar' ? 'تكنولوجيا' : 'Technology' },
    { id: 'people', label: language === 'ar' ? 'أشخاص' : 'People' },
    { id: 'abstract', label: language === 'ar' ? 'تجريدي' : 'Abstract' },
    { id: 'architecture', label: language === 'ar' ? 'معمار' : 'Architecture' },
    { id: 'food', label: language === 'ar' ? 'طعام' : 'Food' },
    { id: 'travel', label: language === 'ar' ? 'سفر' : 'Travel' },
    { id: 'animals', label: language === 'ar' ? 'حيوانات' : 'Animals' },
    { id: 'sports', label: language === 'ar' ? 'رياضة' : 'Sports' },
  ];

  const searchPhotos = useCallback(async (searchQuery: string, pageNum: number = 1) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      // ترجمة النص العربي للإنجليزي
      const translatedQuery = await translateToEnglish(searchQuery);
      
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(translatedQuery)}&per_page=20&page=${pageNum}`,
        { headers: { Authorization: PEXELS_API_KEY } }
      );

      if (!response.ok) throw new Error('Failed to fetch');

      const data: PexelsResponse = await response.json();
      
      if (pageNum === 1) {
        setPhotos(data.photos);
      } else {
        setPhotos(prev => [...prev, ...data.photos]);
      }
      setTotalResults(data.total_results);
      setPage(pageNum);
    } catch (error) {
      console.error('Pexels API error:', error);
      toast.error(language === 'ar' ? 'فشل في جلب الصور' : 'Failed to fetch images');
    } finally {
      setLoading(false);
    }
  }, [language]);

  const getCuratedPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://api.pexels.com/v1/curated?per_page=20&page=1',
        { headers: { Authorization: PEXELS_API_KEY } }
      );

      if (!response.ok) throw new Error('Failed to fetch');

      const data: PexelsResponse = await response.json();
      setPhotos(data.photos);
      setTotalResults(data.total_results);
      setQuery('');
      setSelectedCategory(null);
    } catch (error) {
      console.error('Pexels API error:', error);
      toast.error(language === 'ar' ? 'فشل في جلب الصور' : 'Failed to fetch images');
    } finally {
      setLoading(false);
    }
  }, [language]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSelectedCategory(null);
      searchPhotos(query, 1);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setQuery(categoryId);
    searchPhotos(categoryId, 1);
  };

  const handleLoadMore = () => {
    const searchTerm = selectedCategory || query;
    if (searchTerm) searchPhotos(searchTerm, page + 1);
  };

  const handleSelectImage = (photo: PexelsPhoto) => {
    onSelectImage(photo.src.large);
    setOpen(false);
    toast.success(
      language === 'ar' 
        ? `تم إضافة الصورة - تصوير: ${photo.photographer}` 
        : `Image added - Photo by: ${photo.photographer}`
    );
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && photos.length === 0) getCuratedPhotos();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full">
            <ImageIcon className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'مكتبة الصور' : 'Image Library'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[70vh] flex flex-col p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-1.5 text-sm">
            <ImageIcon className="w-4 h-4" />
            {language === 'ar' ? 'مكتبة الصور' : 'Image Library'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 flex-1 flex flex-col min-h-0">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-1.5">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={language === 'ar' ? 'ابحث عن صور...' : 'Search...'}
                className="pl-7 h-8 text-xs"
              />
            </div>
            <Button type="submit" disabled={loading || !query.trim()} size="sm" className="h-8 px-2">
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            </Button>
          </form>

          {/* Categories */}
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                className="text-[10px] h-6 px-2"
                onClick={() => handleCategoryClick(cat.id)}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Results Count */}
          {totalResults > 0 && (
            <p className="text-[10px] text-muted-foreground">
              {language === 'ar' ? `${totalResults.toLocaleString()} نتيجة` : `${totalResults.toLocaleString()} results`}
            </p>
          )}

          {/* Photos Grid */}
          <ScrollArea className="flex-1 min-h-0 [&>div>div]:!block">
            <div className="h-[280px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20">
            {loading && photos.length === 0 ? (
              <SkeletonGrid count={6} variant="image" />
            ) : photos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">{language === 'ar' ? 'ابحث عن صور' : 'Search for images'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative rounded overflow-hidden border border-border hover:border-primary transition-colors cursor-pointer"
                    onClick={() => handleSelectImage(photo)}
                  >
                    <img
                      src={photo.src.small}
                      alt={photo.alt || 'Image'}
                      className="w-full aspect-square object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Download className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load More */}
            {photos.length > 0 && photos.length < totalResults && (
              <div className="flex justify-center py-2">
                <Button variant="outline" onClick={handleLoadMore} disabled={loading} size="sm" className="h-7 text-xs">
                  {loading && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                  {language === 'ar' ? 'المزيد' : 'More'}
                </Button>
              </div>
            )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PexelsImageSearch;
