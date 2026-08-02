import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar';
type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.templates': 'Templates',
    'nav.editor': 'Editor',
    'nav.pricing': 'Pricing',
    'nav.signIn': 'Sign In',
    'nav.getStarted': 'Get Started Free',
    
    // Hero
    'hero.title': 'Create Stunning Presentations',
    'hero.subtitle': 'in Minutes',
    'hero.description': 'Professional templates, intuitive editor, and powerful export options. No design skills needed.',
    'hero.cta': 'Start Creating',
    'hero.secondary': 'View Templates',
    
    // Features
    'features.title': 'Everything You Need',
    'features.subtitle': 'Powerful tools to create professional presentations',
    'features.templates': 'Professional Templates',
    'features.templatesDesc': 'Choose from hundreds of ready-made designs for any occasion',
    'features.editor': 'Visual Editor',
    'features.editorDesc': 'Drag, drop, and customize every element with ease',
    'features.export': 'Export Anywhere',
    'features.exportDesc': 'Download as PowerPoint, PDF, or images instantly',
    'features.multilingual': 'Multi-Language',
    'features.multilingualDesc': 'Full RTL support for Arabic and other languages',
    
    // Templates
    'templates.title': 'Choose Your Template',
    'templates.subtitle': 'Start with a professionally designed template',
    'templates.business': 'Business',
    'templates.startup': 'Startup Pitch',
    'templates.education': 'Education',
    'templates.marketing': 'Marketing',
    'templates.slides': 'slides',
    'templates.use': 'Use Template',
    
    // Editor
    'editor.slides': 'Slides',
    'editor.addSlide': 'Add Slide',
    'editor.text': 'Text',
    'editor.images': 'Images',
    'editor.colors': 'Colors',
    'editor.fonts': 'Fonts',
    'editor.layout': 'Layout',
    'editor.export': 'Export',
    'editor.save': 'Save',
    'editor.preview': 'Preview',
    'editor.exportPptx': 'Export as PPTX',
    'editor.exportPdf': 'Export as PDF',
    'editor.exportImages': 'Export as Images',
    'editor.editTitle': 'Edit Title',
    'editor.editSubtitle': 'Edit Subtitle',
    'editor.uploadImage': 'Upload Image',
    'editor.backgroundColor': 'Background Color',
    'editor.textColor': 'Text Color',
    'editor.fontFamily': 'Font Family',
    'editor.fontSize': 'Font Size',
    'editor.icons': 'Icons',
    'editor.iconLibrary': 'Icon Library',
    'editor.presenterView': 'Preview',
    'editor.speakerNotes': 'Speaker Notes',
    
    // Footer
    'footer.rights': 'All rights reserved',
    'footer.product': 'Product',
    'footer.company': 'Company',
    'footer.support': 'Support',
  },
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.dashboard': 'لوحة التحكم',
    'nav.templates': 'القوالب',
    'nav.editor': 'المحرر',
    'nav.pricing': 'الأسعار',
    'nav.signIn': 'تسجيل الدخول',
    'nav.getStarted': 'ابدأ مجاناً',
    
    // Hero
    'hero.title': 'أنشئ عروضاً تقديمية مذهلة',
    'hero.subtitle': 'في دقائق',
    'hero.description': 'قوالب احترافية، محرر سهل الاستخدام، وخيارات تصدير قوية. لا تحتاج مهارات تصميم.',
    'hero.cta': 'ابدأ الإنشاء',
    'hero.secondary': 'عرض القوالب',
    
    // Features
    'features.title': 'كل ما تحتاجه',
    'features.subtitle': 'أدوات قوية لإنشاء عروض تقديمية احترافية',
    'features.templates': 'قوالب احترافية',
    'features.templatesDesc': 'اختر من مئات التصاميم الجاهزة لأي مناسبة',
    'features.editor': 'محرر مرئي',
    'features.editorDesc': 'اسحب وأفلت وخصص كل عنصر بسهولة',
    'features.export': 'تصدير في أي مكان',
    'features.exportDesc': 'حمّل بصيغة باوربوينت أو PDF أو صور فوراً',
    'features.multilingual': 'متعدد اللغات',
    'features.multilingualDesc': 'دعم كامل للعربية واللغات الأخرى',
    
    // Templates
    'templates.title': 'اختر قالبك',
    'templates.subtitle': 'ابدأ بقالب مصمم باحترافية',
    'templates.business': 'الأعمال',
    'templates.startup': 'عرض الشركة الناشئة',
    'templates.education': 'التعليم',
    'templates.marketing': 'التسويق',
    'templates.slides': 'شريحة',
    'templates.use': 'استخدم القالب',
    
    // Editor
    'editor.slides': 'الشرائح',
    'editor.addSlide': 'إضافة شريحة',
    'editor.text': 'النص',
    'editor.images': 'الصور',
    'editor.colors': 'الألوان',
    'editor.fonts': 'الخطوط',
    'editor.layout': 'التخطيط',
    'editor.export': 'تصدير',
    'editor.save': 'حفظ',
    'editor.preview': 'معاينة',
    'editor.exportPptx': 'تصدير كـ PPTX',
    'editor.exportPdf': 'تصدير كـ PDF',
    'editor.exportImages': 'تصدير كصور',
    'editor.editTitle': 'تعديل العنوان',
    'editor.editSubtitle': 'تعديل العنوان الفرعي',
    'editor.uploadImage': 'رفع صورة',
    'editor.backgroundColor': 'لون الخلفية',
    'editor.textColor': 'لون النص',
    'editor.fontFamily': 'نوع الخط',
    'editor.fontSize': 'حجم الخط',
    'editor.icons': 'الأيقونات',
    'editor.iconLibrary': 'مكتبة الأيقونات',
    'editor.presenterView': 'معاينة',
    'editor.speakerNotes': 'ملاحظات المتحدث',
    
    // Footer
    'footer.rights': 'جميع الحقوق محفوظة',
    'footer.product': 'المنتج',
    'footer.company': 'الشركة',
    'footer.support': 'الدعم',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('ar');
  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [language, direction]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
