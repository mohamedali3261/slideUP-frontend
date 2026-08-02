import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Info, Globe } from 'lucide-react';
import logo from '@/assets/logoo.png';
import './LoginAnimated.css';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const t = {
    ar: {
      title: 'تسجيل الدخول',
      info: 'اختر أي اسم مستخدم وكلمة مرور. إذا كان الاسم جديد سيتم إنشاء حساب لك تلقائياً.',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      signin: 'دخول',
      forgot: 'نسيت كلمة المرور؟',
      back: 'العودة للصفحة الرئيسية',
      welcome: 'مرحباً بك!',
      success: 'تم تسجيل الدخول بنجاح',
      error: 'خطأ',
      securityQuestion: 'يرجى تعيين سؤال أمان لحماية حسابك'
    },
    en: {
      title: 'Sign In',
      info: 'Choose any username and password. If the username is new, an account will be created automatically.',
      username: 'Username',
      password: 'Password',
      signin: 'Sign In',
      forgot: 'Forgot Password?',
      back: 'Back to Home',
      welcome: 'Welcome!',
      success: 'Logged in successfully',
      error: 'Error',
      securityQuestion: 'Please set a security question to protect your account'
    }
  };

  const text = t[language];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password);

      toast({ title: text.welcome, description: text.success });

      const from = (location.state as any)?.from;

      if (username === 'admin') {
        navigate('/admin');
      } else if (from) {
        navigate(from);
      } else {
        navigate('/editor');
      }
    } catch (error: any) {
      toast({ title: text.error, description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-animated-container">
      <div className="top"></div>
      <div className="bottom"></div>

      <button
        onClick={toggleLanguage}
        className="language-toggle"
        aria-label="Toggle Language"
      >
        <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-sm sm:text-base">{language === 'ar' ? 'EN' : 'ع'}</span>
      </button>

      <div className="center">
        <img
          src={logo}
          alt="SlideUP Logo"
          className="h-16 sm:h-20 md:h-24 w-auto mb-4 sm:mb-6 mx-auto"
        />
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{text.title}</h2>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3 mb-4 sm:mb-6 w-full">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] sm:text-xs leading-relaxed">
              {text.info}
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="w-full space-y-3 sm:space-y-4">
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={text.username}
            required
            className="w-full"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />

          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={text.password}
            required
            className="w-full"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />

          <Button
            type="submit"
            className="w-full h-10 sm:h-11 text-sm sm:text-base"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              text.signin
            )}
          </Button>
        </form>

        <div className="mt-4 sm:mt-6 flex flex-col gap-2 w-full">
          <Link
            to="/forgot-password"
            className="login-link text-xs sm:text-sm"
          >
            {text.forgot}
          </Link>
          <Link
            to="/"
            className="login-link text-xs sm:text-sm"
          >
            {language === 'ar' ? '← ' : '→ '}{text.back}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
