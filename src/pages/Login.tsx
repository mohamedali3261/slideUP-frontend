import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const t = {
    ar: {
      welcome: 'مرحباً بك!',
      success: 'تم تسجيل الدخول بنجاح',
      error: 'خطأ'
    },
    en: {
      welcome: 'Welcome!',
      success: 'Logged in successfully',
      error: 'Error'
    }
  };

  const text = t[language];

  useEffect(() => {
    const autoLogin = async () => {
      try {
        await login('guest', '');
        toast({ title: text.welcome, description: text.success });
        navigate('/editor');
      } catch (error: any) {
        toast({ title: text.error, description: error.message, variant: 'destructive' });
      }
    };

    autoLogin();
  }, [login, navigate, toast, text]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 to-purple-500/10">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </p>
      </div>
    </div>
  );
};

export default Login;
