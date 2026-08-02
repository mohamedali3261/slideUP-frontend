import { useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SlideElement } from '@/data/templates';
import { 
  Copy, 
  Clipboard, 
  Scissors, 
  Trash2, 
  CopyPlus,
  ArrowUpToLine,
  ArrowDownToLine,
  MousePointer2,
  ImagePlus
} from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  selectedElement: SlideElement | null;
  onCopy: () => void;
  onPaste: () => void;
  onCut: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onSelectAll: () => void;
  canPaste: boolean;
  onAddToCustomIcons?: () => void;
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

const MenuItem = ({ icon, label, shortcut, onClick, disabled, danger }: MenuItemProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors
      ${disabled 
        ? 'text-gray-400 cursor-not-allowed' 
        : danger 
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30' 
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
      }
    `}
  >
    <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
    <span className="flex-1 text-left">{label}</span>
    {shortcut && (
      <span className="text-xs text-gray-400 dark:text-gray-500">{shortcut}</span>
    )}
  </button>
);

const Divider = () => (
  <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
);

export const CanvasContextMenu = ({
  x,
  y,
  isOpen,
  onClose,
  selectedElement,
  onCopy,
  onPaste,
  onCut,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
  onSelectAll,
  canPaste,
  onAddToCustomIcons,
}: ContextMenuProps) => {
  const { language } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);

  const t = useCallback((ar: string, en: string) => language === 'ar' ? ar : en, [language]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (rect.right > viewportWidth) {
        menu.style.left = `${x - rect.width}px`;
      }
      if (rect.bottom > viewportHeight) {
        menu.style.top = `${y - rect.height}px`;
      }
    }
  }, [isOpen, x, y]);

  if (!isOpen) return null;

  const hasSelection = !!selectedElement;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[200px] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 px-1.5 animate-in fade-in zoom-in-95 duration-100"
      style={{ left: x, top: y }}
    >
      <MenuItem
        icon={<Copy size={14} />}
        label={t('نسخ', 'Copy')}
        shortcut="Ctrl+C"
        onClick={() => handleAction(onCopy)}
        disabled={!hasSelection}
      />
      <MenuItem
        icon={<Scissors size={14} />}
        label={t('قص', 'Cut')}
        shortcut="Ctrl+X"
        onClick={() => handleAction(onCut)}
        disabled={!hasSelection}
      />
      <MenuItem
        icon={<Clipboard size={14} />}
        label={t('لصق', 'Paste')}
        shortcut="Ctrl+V"
        onClick={() => handleAction(onPaste)}
        disabled={!canPaste}
      />
      <MenuItem
        icon={<CopyPlus size={14} />}
        label={t('تكرار', 'Duplicate')}
        shortcut="Ctrl+D"
        onClick={() => handleAction(onDuplicate)}
        disabled={!hasSelection}
      />
      
      <Divider />
      
      <MenuItem
        icon={<ArrowUpToLine size={14} />}
        label={t('للأمام', 'Bring to Front')}
        onClick={() => handleAction(onBringToFront)}
        disabled={!hasSelection}
      />
      <MenuItem
        icon={<ArrowDownToLine size={14} />}
        label={t('للخلف', 'Send to Back')}
        onClick={() => handleAction(onSendToBack)}
        disabled={!hasSelection}
      />
      
      <Divider />
      
      <MenuItem
        icon={<MousePointer2 size={14} />}
        label={t('تحديد الكل', 'Select All')}
        shortcut="Ctrl+A"
        onClick={() => handleAction(onSelectAll)}
      />
      
      {/* Add to Custom Icons - only for images and icons */}
      {hasSelection && (selectedElement?.type === 'image' || selectedElement?.type === 'icon') && onAddToCustomIcons && (
        <>
          <Divider />
          <MenuItem
            icon={<ImagePlus size={14} />}
            label={t('إضافة للإضافات', 'Add to Custom')}
            onClick={() => handleAction(onAddToCustomIcons)}
          />
        </>
      )}
      
      <Divider />
      
      <MenuItem
        icon={<Trash2 size={14} />}
        label={t('حذف', 'Delete')}
        shortcut="Del"
        onClick={() => handleAction(onDelete)}
        disabled={!hasSelection}
        danger
      />
    </div>
  );
};

export default CanvasContextMenu;
