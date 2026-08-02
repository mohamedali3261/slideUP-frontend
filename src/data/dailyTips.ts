export interface DailyTip {
  id: number;
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  icon: string;
  type: 'tip' | 'feature';
}

export const dailyTips: DailyTip[] = [
  // Tips (نصائح)
  {
    id: 1,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'استخدم اختصارات لوحة المفاتيح لتسريع عملك! اضغط Ctrl+S للحفظ السريع',
    content_en: 'Use keyboard shortcuts to speed up your work! Press Ctrl+S for quick save',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 2,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'يمكنك نسخ تنسيق العناصر ولصقه على عناصر أخرى لتوحيد التصميم',
    content_en: 'You can copy element formatting and paste it on other elements to unify the design',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 3,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'استخدم ميزة المحاذاة التلقائية لترتيب العناصر بشكل احترافي',
    content_en: 'Use auto-alignment feature to arrange elements professionally',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 4,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'جرب ميزة الحفظ التلقائي - لن تفقد عملك أبداً!',
    content_en: 'Try auto-save feature - you will never lose your work!',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 5,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'استخدم الطبقات لتنظيم عناصر الشريحة والتحكم في ترتيبها',
    content_en: 'Use layers to organize slide elements and control their order',
    icon: 'lightbulb',
    type: 'tip'
  },

  {
    id: 6,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'يمكنك تجميع العناصر معاً لتحريكها وتعديلها كوحدة واحدة',
    content_en: 'You can group elements together to move and edit them as one unit',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 7,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'استخدم ميزة البحث عن الصور من Pexels للحصول على صور احترافية مجانية',
    content_en: 'Use Pexels image search to get professional free images',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 8,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'جرب التدرجات اللونية لإضفاء عمق وجمال على خلفيات الشرائح',
    content_en: 'Try color gradients to add depth and beauty to slide backgrounds',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 9,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'استخدم ميزة التعليقات للتعاون مع فريقك على العروض التقديمية',
    content_en: 'Use comments feature to collaborate with your team on presentations',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 10,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'احفظ نسخ احتياطية من عملك باستخدام ميزة سجل الإصدارات',
    content_en: 'Save backup copies of your work using version history feature',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 11,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'استخدم الشبكة الذكية لمحاذاة العناصر بدقة متناهية',
    content_en: 'Use smart grid to align elements with precision',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 12,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'اضغط مطولاً على Shift أثناء تغيير حجم الصور للحفاظ على النسب',
    content_en: 'Hold Shift while resizing images to maintain aspect ratio',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 13,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'استخدم ألوان متناسقة من لوحة الألوان المقترحة لتصميم احترافي',
    content_en: 'Use harmonious colors from the suggested color palette for professional design',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 14,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'جرب التخطيطات الذكية للحصول على تصاميم متوازنة تلقائياً',
    content_en: 'Try smart layouts to get automatically balanced designs',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 15,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'استخدم ميزة النسخ المتعدد لإنشاء أنماط متكررة بسرعة',
    content_en: 'Use multiple copy feature to create repeated patterns quickly',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 16,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'استخدم Ctrl+D لتكرار العنصر المحدد بسرعة',
    content_en: 'Use Ctrl+D to quickly duplicate selected element',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 17,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'اضغط Delete لحذف العناصر المحددة بسرعة',
    content_en: 'Press Delete to quickly remove selected elements',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 18,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'استخدم Ctrl+Z للتراجع و Ctrl+Y للإعادة',
    content_en: 'Use Ctrl+Z to undo and Ctrl+Y to redo',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 19,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'اضغط مسافة أثناء العرض التقديمي للانتقال للشريحة التالية',
    content_en: 'Press space during presentation to move to next slide',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 20,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'استخدم أسهم لوحة المفاتيح للتنقل بين الشرائح',
    content_en: 'Use keyboard arrows to navigate between slides',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 21,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'احفظ عملك بانتظام حتى مع وجود الحفظ التلقائي',
    content_en: 'Save your work regularly even with auto-save enabled',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 22,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'استخدم الخطوط الواضحة والكبيرة لسهولة القراءة',
    content_en: 'Use clear and large fonts for easy reading',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 23,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'لا تزدحم الشريحة بالمعلومات - البساطة هي الأفضل',
    content_en: 'Don\'t overcrowd slides with information - simplicity is best',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 24,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'استخدم الصور عالية الجودة لمظهر احترافي',
    content_en: 'Use high-quality images for professional appearance',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 25,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'حافظ على تناسق الألوان والخطوط في جميع الشرائح',
    content_en: 'Maintain color and font consistency across all slides',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 26,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'استخدم قاعدة 6×6: لا تزيد عن 6 نقاط في الشريحة و6 كلمات في كل نقطة',
    content_en: 'Use 6×6 rule: No more than 6 points per slide and 6 words per point',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 27,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'اختبر عرضك التقديمي على شاشة كبيرة قبل العرض الفعلي',
    content_en: 'Test your presentation on a large screen before the actual presentation',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 28,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'استخدم التباين العالي بين النص والخلفية لسهولة القراءة',
    content_en: 'Use high contrast between text and background for easy reading',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 29,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'أضف أرقام الشرائح لتسهيل التنقل والإشارة إليها',
    content_en: 'Add slide numbers to facilitate navigation and reference',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 30,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'استخدم الرسوم البيانية بدلاً من الجداول المعقدة عندما يكون ذلك ممكناً',
    content_en: 'Use charts instead of complex tables when possible',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 31,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'اجعل شريحة العنوان جذابة - إنها الانطباع الأول!',
    content_en: 'Make the title slide attractive - it\'s the first impression!',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 32,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'استخدم الأيقونات بدلاً من النصوص الطويلة عندما يكون ذلك ممكناً',
    content_en: 'Use icons instead of long texts when possible',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 33,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'راجع الإملاء والنحو قبل العرض - الأخطاء تقلل من المصداقية',
    content_en: 'Review spelling and grammar before presenting - errors reduce credibility',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 34,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'استخدم المساحات البيضاء - لا تملأ كل مساحة في الشريحة',
    content_en: 'Use white space - don\'t fill every space on the slide',
    icon: 'lightbulb',
    type: 'tip'
  },
  {
    id: 35,
    title_ar: '💡 نصيحة اليوم',
    title_en: '💡 Tip of the Day',
    content_ar: 'اجعل الانتقالات بين الشرائح سلسة وغير مشتتة للانتباه',
    content_en: 'Make slide transitions smooth and not distracting',
    icon: 'lightbulb',
    type: 'tip'
  },
  // Features (ميزات)
  {
    id: 36,
    title_ar: '✨ ميزة: مكتبة الأيقونات',
    title_en: '✨ Feature: Icon Library',
    content_ar: 'اكتشف مكتبتنا الضخمة من الأيقونات الاحترافية - أكثر من 1000 أيقونة جاهزة للاستخدام!',
    content_en: 'Discover our huge library of professional icons - over 1000 icons ready to use!',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 37,
    title_ar: '✨ ميزة: الرسوم البيانية',
    title_en: '✨ Feature: Charts',
    content_ar: 'أنشئ رسوم بيانية تفاعلية مذهلة لعرض بياناتك بشكل احترافي',
    content_en: 'Create stunning interactive charts to display your data professionally',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 38,
    title_ar: '✨ ميزة: الأنيميشن',
    title_en: '✨ Feature: Animations',
    content_ar: 'أضف حركات وانتقالات سلسة لعناصر الشرائح لجذب انتباه الجمهور',
    content_en: 'Add smooth movements and transitions to slide elements to attract audience attention',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 39,
    title_ar: '✨ ميزة: وضع العرض التقديمي',
    title_en: '✨ Feature: Presentation Mode',
    content_ar: 'اعرض شرائحك بملء الشاشة مع أدوات تحكم احترافية',
    content_en: 'Display your slides in full screen with professional controls',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 40,
    title_ar: '✨ ميزة: ملاحظات المتحدث',
    title_en: '✨ Feature: Speaker Notes',
    content_ar: 'أضف ملاحظات خاصة لكل شريحة لمساعدتك أثناء العرض',
    content_en: 'Add private notes to each slide to help you during presentation',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 41,
    title_ar: '✨ ميزة: التصدير المتعدد',
    title_en: '✨ Feature: Multiple Export',
    content_ar: 'صدّر عروضك بصيغ متعددة: PDF, PPTX, PNG, JPG',
    content_en: 'Export your presentations in multiple formats: PDF, PPTX, PNG, JPG',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 42,
    title_ar: '✨ ميزة: القوالب الجاهزة',
    title_en: '✨ Feature: Ready Templates',
    content_ar: 'اختر من بين عشرات القوالب الاحترافية المصممة خصيصاً لك',
    content_en: 'Choose from dozens of professional templates designed especially for you',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 43,
    title_ar: '✨ ميزة: مساعد الذكاء الاصطناعي',
    title_en: '✨ Feature: AI Assistant',
    content_ar: 'استخدم مساعد AI للحصول على اقتراحات وأفكار لتحسين عروضك',
    content_en: 'Use AI assistant to get suggestions and ideas to improve your presentations',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 44,
    title_ar: '✨ ميزة: استيراد PPTX',
    title_en: '✨ Feature: Import PPTX',
    content_ar: 'استورد عروض PowerPoint الموجودة وحررها مباشرة في SlideUP',
    content_en: 'Import existing PowerPoint presentations and edit them directly in SlideUP',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 45,
    title_ar: '✨ ميزة: الوضع الداكن',
    title_en: '✨ Feature: Dark Mode',
    content_ar: 'احمِ عينيك واعمل بشكل مريح مع الوضع الداكن الأنيق',
    content_en: 'Protect your eyes and work comfortably with elegant dark mode',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 46,
    title_ar: '✨ ميزة: محرر الجداول',
    title_en: '✨ Feature: Table Editor',
    content_ar: 'أنشئ وحرر جداول احترافية مباشرة في الشرائح',
    content_en: 'Create and edit professional tables directly in slides',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 47,
    title_ar: '✨ ميزة: كتل الأكواد',
    title_en: '✨ Feature: Code Blocks',
    content_ar: 'أضف أكواد برمجية بتنسيق احترافي مع تلوين تلقائي للسينتاكس',
    content_en: 'Add code with professional formatting and automatic syntax highlighting',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 48,
    title_ar: '✨ ميزة: أدوات الرسم',
    title_en: '✨ Feature: Drawing Tools',
    content_ar: 'ارسم أشكال حرة وخطوط وأسهم مباشرة على الشرائح',
    content_en: 'Draw freehand shapes, lines and arrows directly on slides',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 49,
    title_ar: '✨ ميزة: المكتبة الزخرفية',
    title_en: '✨ Feature: Decorative Library',
    content_ar: 'أضف عناصر زخرفية وأشكال هندسية لتجميل شرائحك',
    content_en: 'Add decorative elements and geometric shapes to beautify your slides',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 50,
    title_ar: '✨ ميزة: إدارة الثيمات',
    title_en: '✨ Feature: Theme Management',
    content_ar: 'احفظ ثيماتك المخصصة وطبقها على أي عرض تقديمي',
    content_en: 'Save your custom themes and apply them to any presentation',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 51,
    title_ar: '✨ ميزة: التكبير والتصغير',
    title_en: '✨ Feature: Zoom Controls',
    content_ar: 'تحكم في مستوى التكبير لرؤية التفاصيل الدقيقة أو الصورة الكاملة',
    content_en: 'Control zoom level to see fine details or the full picture',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 52,
    title_ar: '✨ ميزة: لوحة الخصائص',
    title_en: '✨ Feature: Properties Panel',
    content_ar: 'تحكم في كل تفاصيل العناصر من لوحة الخصائص الشاملة',
    content_en: 'Control all element details from comprehensive properties panel',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 53,
    title_ar: '✨ ميزة: لوحة الطبقات',
    title_en: '✨ Feature: Layers Panel',
    content_ar: 'شاهد وأعد ترتيب جميع عناصر الشريحة من لوحة الطبقات',
    content_en: 'View and reorder all slide elements from layers panel',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 54,
    title_ar: '✨ ميزة: لوحة النشاط',
    title_en: '✨ Feature: Activity Panel',
    content_ar: 'تتبع جميع التغييرات والتعديلات على عروضك التقديمية',
    content_en: 'Track all changes and modifications to your presentations',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 55,
    title_ar: '✨ ميزة: القائمة السياقية',
    title_en: '✨ Feature: Context Menu',
    content_ar: 'انقر بزر الماوس الأيمن للوصول السريع لجميع الأدوات',
    content_en: 'Right-click for quick access to all tools',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 56,
    title_ar: '✨ ميزة: دعم اللغة العربية',
    title_en: '✨ Feature: Arabic Language Support',
    content_ar: 'واجهة كاملة باللغة العربية مع دعم الكتابة من اليمين لليسار',
    content_en: 'Full Arabic interface with right-to-left writing support',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 57,
    title_ar: '✨ ميزة: التخزين السحابي',
    title_en: '✨ Feature: Cloud Storage',
    content_ar: 'احفظ عروضك في السحابة وادخل إليها من أي جهاز',
    content_en: 'Save your presentations in the cloud and access them from any device',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 58,
    title_ar: '✨ ميزة: المشاركة السريعة',
    title_en: '✨ Feature: Quick Share',
    content_ar: 'شارك عروضك مع الآخرين بضغطة زر واحدة',
    content_en: 'Share your presentations with others with one click',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 59,
    title_ar: '✨ ميزة: وضع المعاينة',
    title_en: '✨ Feature: Preview Mode',
    content_ar: 'عاين شرائحك قبل العرض للتأكد من كل التفاصيل',
    content_en: 'Preview your slides before presenting to ensure all details',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 60,
    title_ar: '✨ ميزة: الدعم الفني',
    title_en: '✨ Feature: Technical Support',
    content_ar: 'فريق الدعم جاهز لمساعدتك في أي وقت عبر نظام التذاكر',
    content_en: 'Support team ready to help you anytime via ticket system',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 61,
    title_ar: '✨ ميزة: بحث الصور من Pexels',
    title_en: '✨ Feature: Pexels Image Search',
    content_ar: 'ابحث عن ملايين الصور المجانية عالية الجودة مباشرة من المحرر',
    content_en: 'Search millions of free high-quality images directly from editor',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 62,
    title_ar: '✨ ميزة: الحفظ التلقائي',
    title_en: '✨ Feature: Auto-Save',
    content_ar: 'لا تقلق بشأن فقدان عملك - يتم الحفظ تلقائياً كل بضع ثوانٍ',
    content_en: 'Don\'t worry about losing your work - auto-saves every few seconds',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 63,
    title_ar: '✨ ميزة: سجل الإصدارات',
    title_en: '✨ Feature: Version History',
    content_ar: 'ارجع إلى أي نسخة سابقة من عرضك التقديمي في أي وقت',
    content_en: 'Return to any previous version of your presentation anytime',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 64,
    title_ar: '✨ ميزة: النسخ الاحتياطي التلقائي',
    title_en: '✨ Feature: Auto Backup',
    content_ar: 'نسخ احتياطية تلقائية لحماية عملك من أي طارئ',
    content_en: 'Automatic backups to protect your work from any emergency',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 65,
    title_ar: '✨ ميزة: التعاون الجماعي',
    title_en: '✨ Feature: Team Collaboration',
    content_ar: 'اعمل مع فريقك على نفس العرض التقديمي في الوقت الفعلي',
    content_en: 'Work with your team on the same presentation in real-time',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 66,
    title_ar: '✨ ميزة: التخطيطات الذكية',
    title_en: '✨ Feature: Smart Layouts',
    content_ar: 'اختر من تخطيطات ذكية جاهزة لترتيب محتواك بشكل احترافي',
    content_en: 'Choose from ready smart layouts to arrange your content professionally',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 67,
    title_ar: '✨ ميزة: أدوات المحاذاة',
    title_en: '✨ Feature: Alignment Tools',
    content_ar: 'محاذاة وتوزيع العناصر بدقة باستخدام أدوات المحاذاة المتقدمة',
    content_en: 'Align and distribute elements precisely using advanced alignment tools',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 68,
    title_ar: '✨ ميزة: نسخ التنسيق',
    title_en: '✨ Feature: Format Painter',
    content_ar: 'انسخ تنسيق أي عنصر وطبقه على عناصر أخرى بسهولة',
    content_en: 'Copy any element\'s format and apply it to other elements easily',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 69,
    title_ar: '✨ ميزة: التجميع والفك',
    title_en: '✨ Feature: Group & Ungroup',
    content_ar: 'جمّع العناصر معاً أو فكها للتحكم الكامل في تصميمك',
    content_en: 'Group elements together or ungroup for full control of your design',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 70,
    title_ar: '✨ ميزة: الخلفيات المتدرجة',
    title_en: '✨ Feature: Gradient Backgrounds',
    content_ar: 'أنشئ خلفيات متدرجة مذهلة بألوان وزوايا مخصصة',
    content_en: 'Create stunning gradient backgrounds with custom colors and angles',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 71,
    title_ar: '✨ ميزة: أدوات الألوان المتقدمة',
    title_en: '✨ Feature: Advanced Color Tools',
    content_ar: 'اختر من لوحات ألوان احترافية أو أنشئ لوحتك الخاصة',
    content_en: 'Choose from professional color palettes or create your own',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 72,
    title_ar: '✨ ميزة: عناصر الوسائط',
    title_en: '✨ Feature: Media Elements',
    content_ar: 'أضف صور وفيديوهات وملفات صوتية لعروض تقديمية تفاعلية',
    content_en: 'Add images, videos and audio files for interactive presentations',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 73,
    title_ar: '✨ ميزة: اختصارات لوحة المفاتيح',
    title_en: '✨ Feature: Keyboard Shortcuts',
    content_ar: 'اعمل بسرعة أكبر مع مجموعة شاملة من اختصارات لوحة المفاتيح',
    content_en: 'Work faster with comprehensive set of keyboard shortcuts',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 74,
    title_ar: '✨ ميزة: التراجع والإعادة غير المحدودة',
    title_en: '✨ Feature: Unlimited Undo/Redo',
    content_ar: 'تراجع وأعد أي عدد من المرات - لا حدود للتجربة والإبداع',
    content_en: 'Undo and redo unlimited times - no limits to experimentation and creativity',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 75,
    title_ar: '✨ ميزة: التصميم المتجاوب',
    title_en: '✨ Feature: Responsive Design',
    content_ar: 'اعمل على عروضك من أي جهاز - كمبيوتر، تابلت، أو موبايل',
    content_en: 'Work on your presentations from any device - PC, tablet, or mobile',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 76,
    title_ar: '✨ ميزة: قوالب المجتمع',
    title_en: '✨ Feature: Community Templates',
    content_ar: 'استفد من قوالب مشاركة من مستخدمين آخرين أو شارك قوالبك',
    content_en: 'Benefit from templates shared by other users or share your own',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 77,
    title_ar: '✨ ميزة: الإشعارات الذكية',
    title_en: '✨ Feature: Smart Notifications',
    content_ar: 'احصل على إشعارات بالتحديثات والنصائح والميزات الجديدة',
    content_en: 'Get notifications about updates, tips and new features',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 78,
    title_ar: '✨ ميزة: إحصائيات الاستخدام',
    title_en: '✨ Feature: Usage Statistics',
    content_ar: 'تتبع إحصائيات عروضك التقديمية ونشاطك على المنصة',
    content_en: 'Track your presentation statistics and platform activity',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 79,
    title_ar: '✨ ميزة: البحث السريع',
    title_en: '✨ Feature: Quick Search',
    content_ar: 'ابحث عن عروضك وعناصرك بسرعة باستخدام البحث الذكي',
    content_en: 'Search your presentations and elements quickly using smart search',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 80,
    title_ar: '✨ ميزة: التنظيم بالمجلدات',
    title_en: '✨ Feature: Folder Organization',
    content_ar: 'نظم عروضك التقديمية في مجلدات لسهولة الوصول والإدارة',
    content_en: 'Organize your presentations in folders for easy access and management',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 81,
    title_ar: '✨ ميزة: النسخ والتكرار',
    title_en: '✨ Feature: Duplicate & Copy',
    content_ar: 'انسخ الشرائح والعناصر والعروض الكاملة بضغطة واحدة',
    content_en: 'Copy slides, elements and entire presentations with one click',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 82,
    title_ar: '✨ ميزة: الأمان والخصوصية',
    title_en: '✨ Feature: Security & Privacy',
    content_ar: 'عروضك محمية بأعلى معايير الأمان والتشفير',
    content_en: 'Your presentations are protected with highest security and encryption standards',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 83,
    title_ar: '✨ ميزة: التحديثات المستمرة',
    title_en: '✨ Feature: Continuous Updates',
    content_ar: 'نضيف ميزات جديدة وتحسينات باستمرار لتحسين تجربتك',
    content_en: 'We continuously add new features and improvements to enhance your experience',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 84,
    title_ar: '✨ ميزة: الأداء السريع',
    title_en: '✨ Feature: Fast Performance',
    content_ar: 'محرر سريع وسلس حتى مع العروض الكبيرة والمعقدة',
    content_en: 'Fast and smooth editor even with large and complex presentations',
    icon: 'lightbulb',
    type: 'feature'
  },
  {
    id: 85,
    title_ar: '✨ ميزة: التوافق الكامل',
    title_en: '✨ Feature: Full Compatibility',
    content_ar: 'توافق كامل مع PowerPoint وجميع برامج العروض التقديمية',
    content_en: 'Full compatibility with PowerPoint and all presentation software',
    icon: 'lightbulb',
    type: 'feature'
  }
];
