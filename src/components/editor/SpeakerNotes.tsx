import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  StickyNote,
  Clock,
  Type,
  AlignLeft,
  Copy,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Volume2,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

export interface SlideNotes {
  [slideId: string]: {
    content: string;
    lastModified: Date;
  };
}

interface SpeakerNotesProps {
  slideId: string;
  slideIndex: number;
  totalSlides: number;
  notes: SlideNotes;
  onNotesChange: (slideId: string, content: string) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

// Calculate reading time (average 150 words per minute for speaking)
const calculateReadingTime = (text: string): number => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.ceil(words / 150); // minutes
};

// Calculate word count
const calculateWordCount = (text: string): number => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};

// Calculate character count
const calculateCharCount = (text: string): number => {
  return text.length;
};

export const SpeakerNotes = ({
  slideId,
  slideIndex,
  totalSlides,
  notes,
  onNotesChange,
  onNavigate,
}: SpeakerNotesProps) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentNotes = notes[slideId]?.content || '';
  const wordCount = calculateWordCount(currentNotes);
  const charCount = calculateCharCount(currentNotes);
  const readingTime = calculateReadingTime(currentNotes);

  const handleNotesChange = (value: string) => {
    onNotesChange(slideId, value);
  };

  const handleCopy = () => {
    if (currentNotes) {
      navigator.clipboard.writeText(currentNotes);
      toast.success(language === 'ar' ? 'تم نسخ الملاحظات' : 'Notes copied!');
    }
  };

  const handleClear = () => {
    onNotesChange(slideId, '');
    toast.success(language === 'ar' ? 'تم مسح الملاحظات' : 'Notes cleared!');
  };

  const handleExportAllNotes = () => {
    const allNotes = Object.entries(notes)
      .map(([id, note], index) => {
        return `--- Slide ${index + 1} ---\n${note.content}\n`;
      })
      .join('\n');

    const blob = new Blob([allNotes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'speaker-notes.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(language === 'ar' ? 'تم تصدير الملاحظات' : 'Notes exported!');
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isExpanded) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [currentNotes, isExpanded]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          title={language === 'ar' ? 'ملاحظات المتحدث' : 'Speaker Notes'}
        >
          <StickyNote className="w-4 h-4" />
          <span className="hidden sm:inline">
            {language === 'ar' ? 'الملاحظات' : 'Notes'}
          </span>
          {currentNotes && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {wordCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className={`${isExpanded ? 'h-[80vh]' : 'h-[40vh]'} transition-all duration-300`}
      >
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <StickyNote className="w-5 h-5" />
              {language === 'ar' ? 'ملاحظات المتحدث' : 'Speaker Notes'}
              <Badge variant="outline">
                {language === 'ar' 
                  ? `شريحة ${slideIndex + 1} من ${totalSlides}`
                  : `Slide ${slideIndex + 1} of ${totalSlides}`}
              </Badge>
            </SheetTitle>

            <div className="flex items-center gap-2">
              {/* Navigation */}
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onNavigate?.('prev')}
                      disabled={slideIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
                    <div className="flex items-center gap-1.5">
                      <ChevronLeft className="w-3 h-3" />
                      {language === 'ar' ? 'الشريحة السابقة' : 'Previous slide'}
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onNavigate?.('next')}
                      disabled={slideIndex === totalSlides - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
                    <div className="flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3" />
                      {language === 'ar' ? 'الشريحة التالية' : 'Next slide'}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Actions */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleCopy}
                    disabled={!currentNotes}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <Copy className="w-3 h-3" />
                    {language === 'ar' ? 'نسخ' : 'Copy'}
                  </div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleClear}
                    disabled={!currentNotes}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <Trash2 className="w-3 h-3" />
                    {language === 'ar' ? 'مسح' : 'Clear'}
                  </div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleExportAllNotes}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <Download className="w-3 h-3" />
                    {language === 'ar' ? 'تصدير كل الملاحظات' : 'Export all notes'}
                  </div>
                </TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
                  <div className="flex items-center gap-1.5">
                    {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                    {isExpanded
                      ? (language === 'ar' ? 'تصغير' : 'Minimize')
                      : (language === 'ar' ? 'تكبير' : 'Maximize')}
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-4rem)] gap-4">
          {/* Stats Bar */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Type className="w-4 h-4" />
              <span>
                {wordCount} {language === 'ar' ? 'كلمة' : 'words'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlignLeft className="w-4 h-4" />
              <span>
                {charCount} {language === 'ar' ? 'حرف' : 'chars'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>
                ~{readingTime} {language === 'ar' ? 'دقيقة' : 'min'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" />
              <span>
                {language === 'ar' ? 'وقت الإلقاء التقريبي' : 'Est. speaking time'}
              </span>
            </div>
          </div>

          {/* Notes Editor */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={currentNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder={
                language === 'ar'
                  ? 'اكتب ملاحظاتك هنا... هذه الملاحظات ستظهر لك فقط أثناء العرض التقديمي.'
                  : 'Write your notes here... These notes will only be visible to you during the presentation.'
              }
              className="h-full min-h-[150px] resize-none text-base leading-relaxed"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Tips */}
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">
                  {language === 'ar' ? 'نصائح:' : 'Tips:'}
                </p>
                <ul className="list-disc list-inside space-y-0.5 opacity-80">
                  {language === 'ar' ? (
                    <>
                      <li>اكتب النقاط الرئيسية التي تريد ذكرها</li>
                      <li>أضف أسئلة متوقعة من الجمهور</li>
                      <li>سجل الوقت المتوقع لكل شريحة</li>
                    </>
                  ) : (
                    <>
                      <li>Write key points you want to mention</li>
                      <li>Add expected questions from the audience</li>
                      <li>Note the expected time for each slide</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SpeakerNotes;
