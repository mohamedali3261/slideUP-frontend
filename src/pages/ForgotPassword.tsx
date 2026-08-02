import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getSecurityQuestion, verifySecurityAnswer, resetPassword } from '@/lib/storage';
import { Loader2, ArrowRight, CheckCircle2, Info, Globe } from 'lucide-react';
import './LoginAnimated.css';

const ForgotPassword = () => {
  const [step, setStep] = useState<'username' | 'answer' | 'newPassword' | 'success'>('username');
  const [isLoading, setIsLoading] = useState(false);
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [username, setUsername] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number>(3);

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const t = {
    ar: {
      forgotTitle: 'نسيت كلمة المرور؟',
      forgotSubtitle: 'أدخل اسم المستخدم للمتابعة',
      securityTitle: 'سؤال الأمان',
      securitySubtitle: 'أجب على السؤال للمتابعة',
      newPasswordTitle: 'كلمة مرور جديدة',
      newPasswordSubtitle: 'أدخل كلمة المرور الجديدة',
      successTitle: 'تم بنجاح!',
      successSubtitle: 'تم تغيير كلمة المرور بنجاح',
      redirecting: 'جاري التحويل لصفحة تسجيل الدخول...',
      username: 'اسم المستخدم',
      answer: 'الإجابة',
      newPassword: 'كلمة المرور الجديدة',
      confirmPassword: 'تأكيد كلمة المرور',
      next: 'التالي',
      verify: 'التحقق',
      back: 'رجوع',
      reset: 'تغيير كلمة المرور',
      backToLogin: 'العودة لتسجيل الدخول',
      error: 'خطأ',
      success: 'نجح!',
      correct: 'صحيح!',
      correctAnswer: 'الإجابة صحيحة، يمكنك الآن تعيين كلمة مرور جديدة',
      passwordChanged: 'تم تغيير كلمة المرور بنجاح',
      enterAnswer: 'يرجى إدخال الإجابة',
      passwordMismatch: 'كلمتا المرور غير متطابقتين',
      passwordLength: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل',
      warning: '⚠️ تحذير',
      blocked: '🚫 محظور',
      attemptsRemaining: 'المحاولات المتبقية',
      blockedMessage: 'تم حظر المحاولات مؤقتاً',
      tryAgainAfter: 'يمكنك المحاولة مرة أخرى بعد'
    },
    en: {
      forgotTitle: 'Forgot Password?',
      forgotSubtitle: 'Enter your username to continue',
      securityTitle: 'Security Question',
      securitySubtitle: 'Answer the question to continue',
      newPasswordTitle: 'New Password',
      newPasswordSubtitle: 'Enter your new password',
      successTitle: 'Success!',
      successSubtitle: 'Password changed successfully',
      redirecting: 'Redirecting to login page...',
      username: 'Username',
      answer: 'Answer',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      next: 'Next',
      verify: 'Verify',
      back: 'Back',
      reset: 'Reset Password',
      backToLogin: 'Back to Login',
      error: 'Error',
      success: 'Success!',
      correct: 'Correct!',
      correctAnswer: 'Answer is correct, you can now set a new password',
      passwordChanged: 'Password changed successfully',
      enterAnswer: 'Please enter the answer',
      passwordMismatch: 'Passwords do not match',
      passwordLength: 'Password must be at least 4 characters',
      warning: '⚠️ Warning',
      blocked: '🚫 Blocked',
      attemptsRemaining: 'Attempts Remaining',
      blockedMessage: 'Attempts temporarily blocked',
      tryAgainAfter: 'You can try again after'
    }
  };

  const text = t[language];

  const handleGetQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = getSecurityQuestion(username);
      if ('error' in result) {
        throw new Error(result.error);
      }
      setSecurityQuestion(result.question);
      setStep('answer');
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAnswer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!answer.trim()) {
      toast({ title: text.error, description: text.enterAnswer, variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const result = verifySecurityAnswer(username, answer);

      if (!result.success) {
        if (result.error?.includes('حظور')) {
          setRemainingAttempts(0);
          toast({
            title: text.blocked,
            description: result.error,
            variant: 'destructive',
            duration: 10000
          });
          throw new Error(result.error);
        }

        const remainingMatch = result.error?.match(/(\d+)/);
        const remaining = remainingMatch ? parseInt(remainingMatch[1]) : 0;
        setRemainingAttempts(remaining);

        toast({
          title: remaining <= 1 ? text.warning : text.error,
          description: result.error,
          variant: 'destructive',
          duration: remaining <= 1 ? 10000 : 5000
        });
        throw new Error(result.error);
      }

      toast({ title: text.correct, description: text.correctAnswer });
      setStep('newPassword');
    } catch (error: any) {
      console.error('Verify answer error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({ title: text.error, description: text.passwordMismatch, variant: 'destructive' });
      return;
    }

    if (newPassword.length < 4) {
      toast({ title: text.error, description: text.passwordLength, variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const result = resetPassword(username, newPassword);

      if (!result.success) {
        throw new Error(result.error || text.error);
      }

      setStep('success');
      toast({ title: text.success, description: text.passwordChanged });

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Reset password error:', error);
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
        <Globe className="w-5 h-5" />
        <span>{language === 'ar' ? 'EN' : 'ع'}</span>
      </button>

      <div className="center">
        {step === 'username' && (
          <>
            <h2 className="text-3xl font-bold mb-2">{text.forgotTitle}</h2>
            <p className="mb-6 text-sm">{text.forgotSubtitle}</p>

            <form onSubmit={handleGetQuestion} className="w-full space-y-4">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={text.username}
                required
                className="w-full"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{text.next}</span>
                    <ArrowRight className={`w-5 h-5 ${language === 'ar' ? 'mr-2' : 'ml-2'}`} />
                  </>
                )}
              </Button>
            </form>
          </>
        )}

        {step === 'answer' && (
          <>
            <h2 className="text-3xl font-bold mb-2">{text.securityTitle}</h2>
            <p className="mb-6 text-sm">{text.securitySubtitle}</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 w-full">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed font-medium">{securityQuestion}</p>
              </div>
            </div>

            {remainingAttempts < 3 && (
              <div className={`w-full mb-4 p-3 rounded-lg border ${
                remainingAttempts === 2 ? 'bg-yellow-50 border-yellow-300' :
                remainingAttempts === 1 ? 'bg-orange-50 border-orange-400' :
                'bg-gradient-to-br from-purple-900/90 to-pink-900/90 border-red-500/50 shadow-lg'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {remainingAttempts === 2 ? '⚠️' : remainingAttempts === 1 ? '🚨' : '🚫'}
                  </span>
                  <p className={`text-xs font-bold ${
                    remainingAttempts === 2 ? 'text-yellow-800' :
                    remainingAttempts === 1 ? 'text-orange-800' :
                    'text-white drop-shadow-lg'
                  }`}>
                    {language === 'ar'
                      ? `${text.attemptsRemaining}: ${remainingAttempts}${remainingAttempts === 1 ? ' فقط!' : remainingAttempts === 0 ? ' - محظور!' : ''}`
                      : `${text.attemptsRemaining}: ${remainingAttempts}${remainingAttempts === 1 ? ' only!' : remainingAttempts === 0 ? ' - Blocked!' : ''}`
                    }
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyAnswer} className="w-full space-y-4">
              <Input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={text.answer}
                required
                className="w-full"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{text.verify}</span>
                    <ArrowRight className={`w-5 h-5 ${language === 'ar' ? 'mr-2' : 'ml-2'}`} />
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep('username');
                  setAnswer('');
                }}
                className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
              >
                {text.back}
              </Button>
            </form>
          </>
        )}

        {step === 'newPassword' && (
          <>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">{text.newPasswordTitle}</h2>
            <p className="mb-6 text-sm">{text.newPasswordSubtitle}</p>

            <form onSubmit={handleResetPassword} className="w-full space-y-4">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={text.newPassword}
                required
                className="w-full"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />

              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={text.confirmPassword}
                required
                className="w-full"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  text.reset
                )}
              </Button>
            </form>
          </>
        )}

        {step === 'success' && (
          <div className="text-center w-full">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-2">{text.successTitle}</h2>
            <p className="mb-4 text-sm">{text.successSubtitle}</p>
            <p className="text-sm opacity-90">{text.redirecting}</p>
          </div>
        )}

        <div className="mt-6 w-full">
          <Link
            to="/login"
            className="login-link"
          >
            {language === 'ar' ? '← ' : '→ '}{text.backToLogin}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
