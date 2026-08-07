import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import './ModernTemplateCard.css';

const LOADING_GIF = 'https://media.giphy.com/media/3o7abAHdYvZdBNnGZq/giphy.gif';

interface ModernTemplateCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  isNew?: boolean;
}

export const ModernTemplateCard = ({ 
  id, 
  title, 
  description, 
  category,
  image,
  isNew
}: ModernTemplateCardProps) => {
  const { language } = useLanguage();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);

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
            {!imgLoaded && (
              <div className="modern-imgBox-loading">
                <img src={LOADING_GIF} alt="Loading" />
              </div>
            )}
            <img
              src={image}
              alt={title}
              onLoad={() => setImgLoaded(true)}
              style={imgLoaded ? {} : { opacity: 0 }}
            />
            {isNew && <span className="modern-new-badge">NEW</span>}
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
        <span className="modern-category">{category}</span>
      </div>
    </div>
  );
};
