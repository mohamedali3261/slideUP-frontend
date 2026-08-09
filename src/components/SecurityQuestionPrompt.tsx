import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield, X } from 'lucide-react';

const SecurityQuestionPrompt = () => {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const isDismissed = localStorage.getItem('security_question_dismissed');
    if (!user.security_question && !isDismissed) {
      setShow(true);
    }
  }, [user]);

  const handleSetup = () => {
    navigate('/set-security-question');
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('security_question_dismissed', 'true');
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 animate-in slide-in-from-bottom-5" dir="rtl">
      <button
        onClick={handleDismiss}
        className="absolute top-2 left-2 p-2 text-slate-400 hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold mb-1">أمّن حسابك</h3>
          <p className="text-slate-400 text-sm">
            اضبط سؤال أمان لحماية حسابك واسترجاعه في حالة نسيان كلمة المرور
          </p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={handleSetup}
          size="sm"
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          اضبط الآن
        </Button>
        <Button
          onClick={handleDismiss}
          size="sm"
          variant="ghost"
          className="text-slate-400 hover:text-white"
        >
          لاحقاً
        </Button>
      </div>
    </div>
  );
};

export default SecurityQuestionPrompt;
