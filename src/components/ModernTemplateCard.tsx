import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import './ModernTemplateCard.css';

interface ModernTemplateCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
}

export const ModernTemplateCard = ({ 
  id, 
  title, 
  description, 
  category,
  image 
}: ModernTemplateCardProps) => {
  const { language } = useLanguage();
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleUseTemplate = () => {
    if (!token) {
      navigate('/login', { state: { from: `/editor?template=${id}` } });
    } else {
      navigate(`/editor?template=${id}`);
    }
  };

  return (
    <div className="modern-card">
      <div className="modern-card-inner" style={{ '--clr': '#fff' } as React.CSSProperties}>
        <div className="modern-box">
          <div className="modern-imgBox">
            <img src={image} alt={title} />
          </div>
          <div className="modern-icon">
            <button onClick={handleUseTemplate} className="modern-iconBox">
              <span className="material-symbols-outlined">arrow_outward</span>
            </button>
          </div>
        </div>
      </div>
      <div className="modern-content">
        <h3 className="text-base sm:text-lg">{title}</h3>
        <p className="text-xs sm:text-sm">{description}</p>
      </div>
    </div>
  );
};
