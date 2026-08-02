import { useEffect } from 'react';
import loadingGif from '@/assets/ggg.gif';

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
}

export const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onLoadingComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
      {/* GIF Only */}
      <div className="relative z-10">
        <img 
          src={loadingGif} 
          alt="Loading..." 
          className="w-96 h-96 object-contain"
        />
      </div>
    </div>
  );
};
