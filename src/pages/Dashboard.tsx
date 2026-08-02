import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkeletonGrid } from '@/components/ui/skeleton-card';
import { getPresentationsByUser, savePresentation, deletePresentation, duplicatePresentation } from '@/lib/storage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Grid3X3,
  List,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Star,
  StarOff,
  FolderOpen,
  Clock,
  Presentation,
  SortAsc,
  SortDesc,
  Filter,
  Download,
  Share2,
  Eye,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS, type Locale } from 'date-fns/locale';

export interface SavedPresentation {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  slideCount: number;
  createdAt: string;
  updatedAt: string;
  templateId?: string;
  tags?: string[];
  userId?: string; // Add userId to track ownership
}

// Get storage key for specific user
const getUserStorageKey = (userId: string) => `slideforge_presentations_${userId}`;
const getUserFavoritesKey = (userId: string) => `slideforge_favorites_${userId}`;

// Get presentations from localStorage for specific user
const getPresentations = (userId: string): SavedPresentation[] => {
  try {
    const data = localStorage.getItem(getUserStorageKey(userId));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Save presentations to localStorage for specific user
const savePresentations = (presentations: SavedPresentation[], userId: string) => {
  localStorage.setItem(getUserStorageKey(userId), JSON.stringify(presentations));
};

// Get favorites for specific user
const getFavorites = (userId: string): string[] => {
  try {
    const data = localStorage.getItem(getUserFavoritesKey(userId));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Save favorites for specific user
const saveFavorites = (favorites: string[], userId: string) => {
  localStorage.setItem(getUserFavoritesKey(userId), JSON.stringify(favorites));
};

type ViewMode = 'grid' | 'list';
type SortBy = 'updatedAt' | 'createdAt' | 'title' | 'slideCount';
type SortOrder = 'asc' | 'desc';
type FilterBy = 'all' | 'favorites' | 'recent';

export const Dashboard = () => {
  const { language } = useLanguage();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const locale = language === 'ar' ? ar : enUS;

  const [presentations, setPresentations] = useState<SavedPresentation[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [presentationToDelete, setPresentationToDelete] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [presentationToRename, setPresentationToRename] = useState<SavedPresentation | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { state: { from: '/dashboard' } });
    }
  }, [user, isLoading, navigate]);

  // Load data on mount for authenticated user
  useEffect(() => {
    if (user) {
      const dbPresentations = getPresentationsByUser(user.id);

      const formattedPresentations: SavedPresentation[] = dbPresentations.map((p) => {
        let parsedData = null;
        try {
          parsedData = JSON.parse(p.data);
        } catch (e) {
          console.error('Error parsing presentation data:', e);
        }

        return {
          id: p.id,
          title: p.title,
          slideCount: p.slideCount,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          userId: p.userId.toString(),
          description: parsedData?.description,
          thumbnail: parsedData?.thumbnail,
          templateId: parsedData?.templateId,
          tags: parsedData?.tags,
        };
      });

      setPresentations(formattedPresentations);
      setFavorites(getFavorites(user.id.toString()));
    }
  }, [user]);

  // Filter and sort presentations - MUST be before early returns
  const filteredPresentations = useMemo(() => {
    let result = [...presentations];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Filter by type
    if (filterBy === 'favorites') {
      result = result.filter((p) => favorites.includes(p.id));
    } else if (filterBy === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      result = result.filter((p) => new Date(p.updatedAt) > oneWeekAgo);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'slideCount':
          comparison = a.slideCount - b.slideCount;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
        default:
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [presentations, searchQuery, filterBy, sortBy, sortOrder, favorites]);

  // Stats - MUST be before early returns
  const stats = useMemo(() => ({
    total: presentations.length,
    favorites: favorites.length,
    thisWeek: presentations.filter((p) => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return new Date(p.updatedAt) > oneWeekAgo;
    }).length,
  }), [presentations, favorites]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24">
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
          <SkeletonGrid count={6} variant="presentation" />
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!user) {
    return null;
  }

  // Create new presentation
  const handleCreateNew = () => {
    if (!user) return;
    
    const newPresentation: SavedPresentation = {
      id: `pres-${Date.now()}`,
      title: language === 'ar' ? 'عرض تقديمي جديد' : 'New Presentation',
      slideCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user.id.toString(),
    };

    const updated = [newPresentation, ...presentations];
    setPresentations(updated);
    savePresentations(updated, user.id.toString());

    // Navigate to editor with the new presentation ID
    navigate(`/editor?id=${newPresentation.id}`);
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    if (!user) return;
    
    const updated = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    setFavorites(updated);
    saveFavorites(updated, user.id.toString());
    toast.success(
      favorites.includes(id)
        ? (language === 'ar' ? 'تمت الإزالة من المفضلة' : 'Removed from favorites')
        : (language === 'ar' ? 'تمت الإضافة للمفضلة' : 'Added to favorites')
    );
  };

  // Delete presentation
  const handleDelete = async () => {
    if (!presentationToDelete || !user) return;

    try {
      deletePresentation(presentationToDelete, user.id);

      // Update local state
      const updated = presentations.filter((p) => p.id !== presentationToDelete);
      setPresentations(updated);

      // Also remove from favorites
      const updatedFavorites = favorites.filter((f) => f !== presentationToDelete);
      setFavorites(updatedFavorites);
      saveFavorites(updatedFavorites, user.id.toString());

      // Remove autosave data
      localStorage.removeItem(`slideforge_autosave_${presentationToDelete}`);

      toast.success(language === 'ar' ? 'تم حذف العرض التقديمي' : 'Presentation deleted');
    } catch (error) {
      console.error('Error deleting presentation:', error);
      toast.error(language === 'ar' ? 'فشل حذف العرض التقديمي' : 'Failed to delete presentation');
    }

    setDeleteDialogOpen(false);
    setPresentationToDelete(null);
  };

  // Duplicate presentation
  const handleDuplicate = async (presentation: SavedPresentation) => {
    if (!user) return;
    
    try {
      const result = duplicatePresentation(presentation.id, user.id);

      if (result.success && result.newId) {
        const duplicated: SavedPresentation = {
          ...presentation,
          id: result.newId,
          title: `${presentation.title} (${language === 'ar' ? 'نسخة' : 'Copy'})`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: user.id.toString(),
        };

        const updated = [duplicated, ...presentations];
        setPresentations(updated);
        toast.success(language === 'ar' ? 'تم نسخ العرض التقديمي' : 'Presentation duplicated');
      } else {
        toast.error(language === 'ar' ? 'فشل نسخ العرض التقديمي' : 'Failed to duplicate presentation');
      }
    } catch (error) {
      console.error('Error duplicating presentation:', error);
      toast.error(language === 'ar' ? 'فشل نسخ العرض التقديمي' : 'Failed to duplicate presentation');
    }
  };

  // Rename presentation
  const handleRename = async () => {
    if (!presentationToRename || !newTitle.trim() || !user) return;

    try {
      savePresentation({
        id: presentationToRename.id,
        userId: user.id,
        title: newTitle.trim(),
        slideCount: presentationToRename.slideCount,
        data: JSON.stringify({}),
      });

      const updated = presentations.map((p) =>
        p.id === presentationToRename.id
          ? { ...p, title: newTitle.trim(), updatedAt: new Date().toISOString() }
          : p
      );
      setPresentations(updated);

      toast.success(language === 'ar' ? 'تم تغيير الاسم' : 'Renamed successfully');
    } catch (error) {
      console.error('Error renaming presentation:', error);
      toast.error(language === 'ar' ? 'فشل تغيير الاسم' : 'Failed to rename');
    }

    setRenameDialogOpen(false);
    setPresentationToRename(null);
    setNewTitle('');
  };

  // Open rename dialog
  const openRenameDialog = (presentation: SavedPresentation) => {
    setPresentationToRename(presentation);
    setNewTitle(presentation.title);
    setRenameDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16 sm:pt-20 pb-12 sm:pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                {language === 'ar'
                  ? 'إدارة عروضك التقديمية'
                  : 'Manage your presentations'}
              </p>
            </div>
            <Button onClick={handleCreateNew} size="lg" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {language === 'ar' ? 'عرض جديد' : 'New Presentation'}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div
              className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-colors ${
                filterBy === 'all' ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-accent'
              }`}
              onClick={() => setFilterBy('all')}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                  <Presentation className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {language === 'ar' ? 'إجمالي العروض' : 'Total Presentations'}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-colors ${
                filterBy === 'favorites' ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-accent'
              }`}
              onClick={() => setFilterBy('favorites')}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-yellow-500/10">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{stats.favorites}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {language === 'ar' ? 'المفضلة' : 'Favorites'}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-colors ${
                filterBy === 'recent' ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-accent'
              }`}
              onClick={() => setFilterBy('recent')}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{stats.thisWeek}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {language === 'ar' ? 'هذا الأسبوع' : 'This Week'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              <Input
                placeholder={language === 'ar' ? 'بحث...' : 'Search presentations...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 sm:pl-10 h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger className="w-[140px] sm:w-[160px] h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">
                    {language === 'ar' ? 'آخر تعديل' : 'Last Modified'}
                  </SelectItem>
                  <SelectItem value="createdAt">
                    {language === 'ar' ? 'تاريخ الإنشاء' : 'Date Created'}
                  </SelectItem>
                  <SelectItem value="title">
                    {language === 'ar' ? 'الاسم' : 'Name'}
                  </SelectItem>
                  <SelectItem value="slideCount">
                    {language === 'ar' ? 'عدد الشرائح' : 'Slide Count'}
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="h-9 w-9 sm:h-10 sm:w-10"
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <SortDesc className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </Button>

              {/* View Mode */}
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-r-none h-9 w-9 sm:h-10 sm:w-10"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-l-none h-9 w-9 sm:h-10 sm:w-10"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Presentations */}
          {filteredPresentations.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <FolderOpen className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                {searchQuery
                  ? (language === 'ar' ? 'لا توجد نتائج' : 'No results found')
                  : (language === 'ar' ? 'لا توجد عروض تقديمية' : 'No presentations yet')}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                {searchQuery
                  ? (language === 'ar' ? 'جرب كلمات بحث مختلفة' : 'Try different search terms')
                  : (language === 'ar' ? 'ابدأ بإنشاء عرض تقديمي جديد' : 'Start by creating a new presentation')}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateNew} size="sm" className="sm:size-default">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                  {language === 'ar' ? 'إنشاء عرض جديد' : 'Create New'}
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredPresentations.map((presentation) => (
                <PresentationCard
                  key={presentation.id}
                  presentation={presentation}
                  isFavorite={favorites.includes(presentation.id)}
                  onToggleFavorite={() => handleToggleFavorite(presentation.id)}
                  onDelete={() => {
                    setPresentationToDelete(presentation.id);
                    setDeleteDialogOpen(true);
                  }}
                  onDuplicate={() => handleDuplicate(presentation)}
                  onRename={() => openRenameDialog(presentation)}
                  language={language}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPresentations.map((presentation) => (
                <PresentationListItem
                  key={presentation.id}
                  presentation={presentation}
                  isFavorite={favorites.includes(presentation.id)}
                  onToggleFavorite={() => handleToggleFavorite(presentation.id)}
                  onDelete={() => {
                    setPresentationToDelete(presentation.id);
                    setDeleteDialogOpen(true);
                  }}
                  onDuplicate={() => handleDuplicate(presentation)}
                  onRename={() => openRenameDialog(presentation)}
                  language={language}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'حذف العرض التقديمي؟' : 'Delete Presentation?'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar'
                ? 'سيتم حذف هذا العرض التقديمي نهائياً. لا يمكن التراجع عن هذا الإجراء.'
                : 'This presentation will be permanently deleted. This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {language === 'ar' ? 'حذف' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'إعادة تسمية' : 'Rename Presentation'}
            </DialogTitle>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={language === 'ar' ? 'اسم العرض التقديمي' : 'Presentation name'}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleRename} disabled={!newTitle.trim()}>
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


// Presentation Card Component (Grid View)
interface PresentationCardProps {
  presentation: SavedPresentation;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  language: string;
  locale: Locale;
}

const PresentationCard = ({
  presentation,
  isFavorite,
  onToggleFavorite,
  onDelete,
  onDuplicate,
  onRename,
  language,
  locale,
}: PresentationCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="group relative bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all">
      {/* Thumbnail */}
      <Link to={`/editor?id=${presentation.id}`}>
        <div
          className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
        >
          <Presentation className="w-12 h-12 text-primary/40" />
        </div>
      </Link>

      {/* Favorite Button */}
      <button
        onClick={onToggleFavorite}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {isFavorite ? (
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        ) : (
          <StarOff className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{presentation.title}</h3>
            <p className="text-sm text-muted-foreground">
              {presentation.slideCount} {language === 'ar' ? 'شريحة' : 'slides'}
            </p>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/editor?id=${presentation.id}`)}>
                <Edit className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'تعديل' : 'Edit'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRename}>
                <Edit className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'إعادة تسمية' : 'Rename'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'نسخ' : 'Duplicate'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleFavorite}>
                {isFavorite ? (
                  <>
                    <StarOff className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'إزالة من المفضلة' : 'Remove from favorites'}
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'إضافة للمفضلة' : 'Add to favorites'}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'حذف' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>
            {formatDistanceToNow(new Date(presentation.updatedAt), {
              addSuffix: true,
              locale,
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

// Presentation List Item Component (List View)
const PresentationListItem = ({
  presentation,
  isFavorite,
  onToggleFavorite,
  onDelete,
  onDuplicate,
  onRename,
  language,
  locale,
}: PresentationCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4 p-4 bg-card border rounded-lg hover:shadow-md transition-all">
      {/* Thumbnail */}
      <Link
        to={`/editor?id=${presentation.id}`}
        className="flex-shrink-0 w-24 h-14 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
      >
        <Presentation className="w-6 h-6 text-primary/40" />
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold truncate">{presentation.title}</h3>
          {isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
          <span>{presentation.slideCount} {language === 'ar' ? 'شريحة' : 'slides'}</span>
          <span>•</span>
          <span>
            {formatDistanceToNow(new Date(presentation.updatedAt), {
              addSuffix: true,
              locale,
            })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleFavorite}
        >
          {isFavorite ? (
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          ) : (
            <StarOff className="w-4 h-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/editor?id=${presentation.id}`)}
        >
          <Edit className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'تعديل' : 'Edit'}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRename}>
              <Edit className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'إعادة تسمية' : 'Rename'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'نسخ' : 'Duplicate'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'حذف' : 'Delete'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Dashboard;
