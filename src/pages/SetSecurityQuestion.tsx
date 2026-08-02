import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { updateUserSecurityQuestion } from '@/lib/storage';
import { Loader2, Shield, Info, Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import '../pages/LoginAnimated.css';

const SECURITY_QUESTIONS = {
  ar: [
    'ما اسم مدينتك المفضلة؟',
    'ما اسم فريقك الرياضي المفضل؟',
    'ما اسم فيلمك المفضل؟',
    'ما اسم كتابك المفضل؟',
    'ما اسم أول مدرسة التحقت بها؟',
  ],
  en: [
    'What is your favorite city?',
    'What is your favorite sports team?',
    'What is your favorite movie?',
    'What is your favorite book?',
    'What was the name of your first school?',
  ]
};

const SetSecurityQuestion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
    setSelectedQuestion('');
  };

  const t = {
    ar: {
      title: 'تأمين حسابك',
      subtitle: 'اختر سؤال أمان لحماية حسابك',
      infoRequired: 'مرحباً بك! لحماية حسابك، يرجى اختيار سؤال أمان. ستحتاجه لاسترجاع حسابك في حالة نسيان كلمة المرور.',
      infoOptional: 'سؤال الأمان يساعدك على استرجاع حسابك في حالة نسيان كلمة المرور',
      selectQuestion: 'اختر سؤال الأمان',
      selectPlaceholder: 'اختر سؤالاً',
      answer: 'الإجابة',
      answerPlaceholder: 'أدخل إجابتك',
      answerHint: 'تأكد من تذكر الإجابة بدقة',
      save: 'حفظ والمتابعة',
      skip: 'تخطي الآن',
      required: 'مطلوب للمتابعة',
      error: 'خطأ',
      success: 'نجح!',
      selectError: 'يرجى اختيار سؤال وإدخال الإجابة',
      saveSuccess: 'تم حفظ سؤال الأمان بنجاح',
      skipWarning: 'يجب تعيين سؤال أمان للمتابعة',
      warning: 'تنبيه'
    },
    en: {
      title: 'Secure Your Account',
      subtitle: 'Choose a security question to protect your account',
      infoRequired: 'Welcome! To protect your account, please choose a security question. You will need it to recover your account if you forget your password.',
      infoOptional: 'Security question helps you recover your account if you forget your password',
      selectQuestion: 'Choose Security Question',
      selectPlaceholder: 'Select a question',
      answer: 'Answer',
      answerPlaceholder: 'Enter your answer',
      answerHint: 'Make sure to remember the answer accurately',
      save: 'Save and Continue',
      skip: 'Skip for Now',
      required: 'Required to Continue',
      error: 'Error',
      success: 'Success!',
      selectError: 'Please select a question and enter an answer',
      saveSuccess: 'Security question saved successfully',
      skipWarning: 'You must set a security question to continue',
      warning: 'Warning'
    }
  };

  const text = t[language];

  useEffect(() => {
    const required = searchParams.get('required') === 'true';
    setIsRequired(required);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedQuestion || !answer) {
      toast({ title: text.error, description: text.selectError, variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      if (user) {
        updateUserSecurityQuestion(user.id, selectedQuestion, answer);
      }
      toast({ title: text.success, description: text.saveSuccess });
      navigate('/editor');
    } catch (error: any) {
      toast({ title: text.error, description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (isRequired) {
      toast({
        title: text.warning,
        description: text.skipWarning,
        variant: 'destructive'
      });
      return;
    }
    navigate('/editor');
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
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3">
          <Shield className="w-6 h-6 text-white" />
        </div>

        <h2 className="text-xl font-bold mb-1">{text.title}</h2>
        <p className="mb-4 text-xs opacity-90">{text.subtitle}</p>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-2.5 mb-4 w-full backdrop-blur-sm">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-300" />
            <p className="text-[10px] leading-relaxed text-slate-200">
              {isRequired ? text.infoRequired : text.infoOptional}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-3">
          <div className="space-y-1.5 w-full">
            <label className="text-white text-xs font-medium block text-left" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
              {text.selectQuestion}
            </label>
            <Select value={selectedQuestion} onValueChange={setSelectedQuestion}>
              <SelectTrigger className="security-select-trigger">
                <SelectValue placeholder={text.selectPlaceholder} />
              </SelectTrigger>
              <SelectContent className="security-select-content">
                {SECURITY_QUESTIONS[language].map((question) => (
                  <SelectItem
                    key={question}
                    value={question}
                    className="security-select-item"
                  >
                    {question}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 w-full">
            <label htmlFor="answer" className="text-white text-xs font-medium block text-left" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
              {text.answer}
            </label>
            <Input
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={text.answerPlaceholder}
              required
              className="security-input"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            <p className="text-white/60 text-[10px]" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
              {text.answerHint}
            </p>
          </div>

          <Button
            type="submit"
            className="security-button-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              text.save
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            className="security-button-secondary"
            disabled={isRequired}
          >
            {isRequired ? text.required : text.skip}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SetSecurityQuestion;
