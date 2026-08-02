import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight } from 'lucide-react';

interface TemplateCardProps {
  id: string;
  title: string;
  category: string;
  slideCount: number;
  image: string;
}

export const TemplateCard = ({ id, title, category, slideCount, image }: TemplateCardProps) => {
  const { t, direction } = useLanguage();
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleUseTemplate = () => {
    if (!token) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: `/editor?template=${id}` } });
    } else {
      // Navigate to editor with template
      navigate(`/editor?template=${id}`);
    }
  };

  return (
    <div className="group relative bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="aspect-video relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Hover overlay with CTA */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button onClick={handleUseTemplate}>
            {t('templates.use')}
            <ArrowRight className={`w-4 h-4 ${direction === 'rtl' ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
            {category}
          </span>
          <span className="text-xs text-muted-foreground">
            {slideCount} {t('templates.slides')}
          </span>
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
    </div>
  );
};
