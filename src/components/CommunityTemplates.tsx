import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SkeletonGrid } from '@/components/ui/skeleton-card';
import { toast } from 'sonner';
import { 
  Upload, Search, Heart, Download, Star, Clock, TrendingUp, 
  User, Loader2, Filter, Grid, List, Eye, Trash2, CheckCircle, XCircle
} from 'lucide-react';

interface CommunityTemplate {
  id: number;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  category: string;
  thumbnail: string | null;
  slide_count: number;
  downloads: number;
  likes: number;
  is_featured: number;
  status: string;
  created_at: string;
  user_id: number;
  author_username: string;
}

const categories = [
  { value: 'general', label: 'عام', labelEn: 'General' },
  { value: 'business', label: 'أعمال', labelEn: 'Business' },
  { value: 'education', label: 'تعليم', labelEn: 'Education' },
  { value: 'marketing', label: 'تسويق', labelEn: 'Marketing' },
  { value: 'startup', label: 'شركات ناشئة', labelEn: 'Startup' },
  { value: 'creative', label: 'إبداعي', labelEn: 'Creative' },
  { value: 'technology', label: 'تكنولوجيا', labelEn: 'Technology' },
  { value: 'medical', label: 'طبي', labelEn: 'Medical' },
];

export const CommunityTemplates = () => {
  const { token, user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [templates, setTemplates] = useState<CommunityTemplate[]>([]);
  const [myTemplates, setMyTemplates] = useState<CommunityTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [likedTemplates, setLikedTemplates] = useState<Set<number>>(new Set());
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    name: '',
    name_en: '',
    description: '',
    description_en: '',
    category: 'general',
    presentationId: '',
  });

  const t = {
    ar: {
      communityTemplates: 'قوالب المجتمع',
      uploadTemplate: 'رفع قالب',
      myTemplates: 'قوالبي',
      browse: 'تصفح',
      search: 'بحث...',
      category: 'التصنيف',
      all: 'الكل',
      sortBy: 'ترتيب حسب',
      newest: 'الأحدث',
      popular: 'الأكثر تحميلاً',
      mostLiked: 'الأكثر إعجاباً',
      oldest: 'الأقدم',
      downloads: 'تحميل',
      likes: 'إعجاب',
      slides: 'شريحة',
      by: 'بواسطة',
      useTemplate: 'استخدم القالب',
      featured: 'مميز',
      pending: 'قيد المراجعة',
      approved: 'موافق عليه',
      rejected: 'مرفوض',
      uploadNewTemplate: 'رفع قالب جديد',
      templateName: 'اسم القالب',
      templateNameEn: 'اسم القالب (إنجليزي)',
      description: 'الوصف',
      descriptionEn: 'الوصف (إنجليزي)',
      selectPresentation: 'اختر العرض',
      upload: 'رفع',
      cancel: 'إلغاء',
      noTemplates: 'لا توجد قوالب',
      loginToUpload: 'سجل دخول لرفع قالب',
      loginToLike: 'سجل دخول للإعجاب',
      templateUploaded: 'تم رفع القالب بنجاح',
      templateDeleted: 'تم حذف القالب',
      delete: 'حذف',
      view: 'عرض',
    },
    en: {
      communityTemplates: 'Community Templates',
      uploadTemplate: 'Upload Template',
      myTemplates: 'My Templates',
      browse: 'Browse',
      search: 'Search...',
      category: 'Category',
      all: 'All',
      sortBy: 'Sort by',
      newest: 'Newest',
      popular: 'Most Downloaded',
      mostLiked: 'Most Liked',
      oldest: 'Oldest',
      downloads: 'downloads',
      likes: 'likes',
      slides: 'slides',
      by: 'by',
      useTemplate: 'Use Template',
      featured: 'Featured',
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
      uploadNewTemplate: 'Upload New Template',
      templateName: 'Template Name',
      templateNameEn: 'Template Name (English)',
      description: 'Description',
      descriptionEn: 'Description (English)',
      selectPresentation: 'Select Presentation',
      upload: 'Upload',
      cancel: 'Cancel',
      noTemplates: 'No templates found',
      loginToUpload: 'Login to upload',
      loginToLike: 'Login to like',
      templateUploaded: 'Template uploaded successfully',
      templateDeleted: 'Template deleted',
      delete: 'Delete',
      view: 'View',
    }
  }[language];

  const fetchTemplates = async () => {
    setTemplates([]);
    setIsLoading(false);
  };

  const fetchMyTemplates = async () => {
    setMyTemplates([]);
  };

  useEffect(() => {
    fetchTemplates();
    fetchMyTemplates();
  }, [selectedCategory, searchQuery, sortBy, token]);

  const handleLike = async (templateId: number) => {
    if (!token) {
      toast.error(t.loginToLike);
      return;
    }
    setLikedTemplates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) newSet.delete(templateId);
      else newSet.add(templateId);
      return newSet;
    });
    setTemplates(prev => prev.map(t => 
      t.id === templateId 
        ? { ...t, likes: t.likes + (likedTemplates.has(templateId) ? -1 : 1) }
        : t
    ));
  };

  const handleUseTemplate = async (templateId: number) => {
    if (!token) {
      navigate('/login', { state: { from: `/editor?community_template=${templateId}` } });
      return;
    }
    toast.error('Template not available offline');
  };

  const handleUpload = async () => {
    if (!uploadForm.name || !uploadForm.presentationId) {
      toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    
    toast.success(t.templateUploaded);
    setShowUploadDialog(false);
    setUploadForm({ name: '', name_en: '', description: '', description_en: '', category: 'general', presentationId: '' });
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا القالب؟' : 'Are you sure you want to delete this template?')) {
      return;
    }
    
    toast.success(t.templateDeleted);
    setMyTemplates(prev => prev.filter(t => t.id !== templateId));
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const [presentations, setPresentations] = useState<any[]>([]);
  
  useEffect(() => {
    if (token && showUploadDialog) {
      setPresentations([]);
    }
  }, [token, showUploadDialog]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400"><CheckCircle className="w-3 h-3 mr-1" />{t.approved}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400"><XCircle className="w-3 h-3 mr-1" />{t.rejected}</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400"><Clock className="w-3 h-3 mr-1" />{t.pending}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t.communityTemplates}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {language === 'ar' ? 'قوالب من المجتمع يمكنك استخدامها وتعديلها' : 'Templates from the community you can use and customize'}
          </p>
        </div>
        
        {token ? (
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Upload className="w-4 h-4" />
                {t.uploadTemplate}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t.uploadNewTemplate}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>{t.templateName} *</Label>
                  <Input 
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({...uploadForm, name: e.target.value})}
                    placeholder={language === 'ar' ? 'اسم القالب بالعربي' : 'Template name'}
                  />
                </div>
                <div>
                  <Label>{t.templateNameEn}</Label>
                  <Input 
                    value={uploadForm.name_en}
                    onChange={(e) => setUploadForm({...uploadForm, name_en: e.target.value})}
                    placeholder="Template name in English"
                  />
                </div>
                <div>
                  <Label>{t.description}</Label>
                  <Textarea 
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                    placeholder={language === 'ar' ? 'وصف القالب' : 'Template description'}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>{t.category}</Label>
                  <Select value={uploadForm.category} onValueChange={(v) => setUploadForm({...uploadForm, category: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {language === 'ar' ? cat.label : cat.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t.selectPresentation} *</Label>
                  <Select value={uploadForm.presentationId} onValueChange={(v) => setUploadForm({...uploadForm, presentationId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر عرض' : 'Select presentation'} />
                    </SelectTrigger>
                    <SelectContent>
                      {presentations.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title} ({p.slide_count} {t.slides})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowUploadDialog(false)}>{t.cancel}</Button>
                  <Button onClick={handleUpload} disabled={isUploading}>
                    {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t.upload}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Button variant="outline" onClick={() => navigate('/login')}>
            {t.loginToUpload}
          </Button>
        )}
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList>
          <TabsTrigger value="browse">{t.browse}</TabsTrigger>
          {token && <TabsTrigger value="my">{t.myTemplates}</TabsTrigger>}
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t.category} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all}</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {language === 'ar' ? cat.label : cat.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t.sortBy} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t.newest}</SelectItem>
                <SelectItem value="popular">{t.popular}</SelectItem>
                <SelectItem value="likes">{t.mostLiked}</SelectItem>
                <SelectItem value="oldest">{t.oldest}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grid */}
          {isLoading ? (
            <SkeletonGrid count={8} variant="template" />
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t.noTemplates}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {templates.map(template => (
                <Card key={template.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative">
                    {template.thumbnail ? (
                      <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-primary/30">
                        {template.name.charAt(0)}
                      </div>
                    )}
                    {template.is_featured === 1 && (
                      <Badge className="absolute top-2 left-2 bg-yellow-500/90">
                        <Star className="w-3 h-3 mr-1" />
                        {t.featured}
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" onClick={() => handleUseTemplate(template.id)}>
                        {t.useTemplate}
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">
                      {language === 'ar' ? template.name : (template.name_en || template.name)}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {language === 'ar' ? template.description : (template.description_en || template.description)}
                    </p>
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {template.author_username}
                      </span>
                      <span>{template.slide_count} {t.slides}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {template.downloads}
                        </span>
                        <button 
                          onClick={() => handleLike(template.id)}
                          className={`flex items-center gap-1 hover:text-red-500 transition-colors ${likedTemplates.has(template.id) ? 'text-red-500' : ''}`}
                        >
                          <Heart className={`w-3 h-3 ${likedTemplates.has(template.id) ? 'fill-current' : ''}`} />
                          {template.likes}
                        </button>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {categories.find(c => c.value === template.category)?.[language === 'ar' ? 'label' : 'labelEn'] || template.category}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {token && (
          <TabsContent value="my" className="space-y-4">
            {myTemplates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {language === 'ar' ? 'لم ترفع أي قوالب بعد' : "You haven't uploaded any templates yet"}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {myTemplates.map(template => (
                  <Card key={template.id} className="overflow-hidden">
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative">
                      {template.thumbnail ? (
                        <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-primary/30">
                          {template.name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(template.status)}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate">{template.name}</h3>
                      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                        <span>{template.slide_count} {t.slides}</span>
                        <span className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {template.downloads}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {template.likes}
                          </span>
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          {t.delete}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
