import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

interface UseKeyboardShortcutsProps {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onCut?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSelectAll?: () => void;
  onDeselect?: () => void;
  onAddSlide?: () => void;
  onDeleteSlide?: () => void;
  onNextSlide?: () => void;
  onPrevSlide?: () => void;
  onPreview?: () => void;
  onExport?: () => void;
  onBold?: () => void;
  onItalic?: () => void;
  onAlignLeft?: () => void;
  onAlignCenter?: () => void;
  onAlignRight?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onSave,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onCut,
  onDelete,
  onDuplicate,
  onSelectAll,
  onDeselect,
  onAddSlide,
  onDeleteSlide,
  onNextSlide,
  onPrevSlide,
  onPreview,
  onExport,
  onBold,
  onItalic,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onBringToFront,
  onSendToBack,
  onGroup,
  onUngroup,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  enabled = true,
}: UseKeyboardShortcutsProps) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if typing in an input/textarea
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow native copy/paste/cut in text inputs
      if (event.ctrlKey || event.metaKey) {
        const code = event.code;
        // Let browser handle Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A in text inputs
        if (code === 'KeyC' || code === 'KeyV' || code === 'KeyX' || code === 'KeyA') {
          return; // Don't prevent default, let browser handle it
        }
      }
      // For non-ctrl keys, ignore
      if (!event.ctrlKey && !event.metaKey) return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? event.metaKey : event.ctrlKey;
    
    // Use event.code for letter keys (works regardless of keyboard language)
    // event.code returns physical key like "KeyS" instead of "s" or "س"
    const code = event.code;
    const key = event.key.toLowerCase();

    // Save: Ctrl+S
    if (ctrlKey && code === 'KeyS') {
      event.preventDefault();
      onSave?.();
      return;
    }

    // Undo: Ctrl+Z
    if (ctrlKey && !event.shiftKey && code === 'KeyZ') {
      event.preventDefault();
      onUndo?.();
      return;
    }

    // Redo: Ctrl+Shift+Z or Ctrl+Y
    if ((ctrlKey && event.shiftKey && code === 'KeyZ') || (ctrlKey && code === 'KeyY')) {
      event.preventDefault();
      onRedo?.();
      return;
    }

    // Copy: Ctrl+C
    if (ctrlKey && code === 'KeyC') {
      event.preventDefault();
      onCopy?.();
      return;
    }

    // Paste: Ctrl+V
    if (ctrlKey && code === 'KeyV') {
      event.preventDefault();
      onPaste?.();
      return;
    }

    // Cut: Ctrl+X
    if (ctrlKey && code === 'KeyX') {
      event.preventDefault();
      onCut?.();
      return;
    }

    // Duplicate: Ctrl+D
    if (ctrlKey && code === 'KeyD') {
      event.preventDefault();
      onDuplicate?.();
      return;
    }

    // Select All: Ctrl+A
    if (ctrlKey && code === 'KeyA') {
      event.preventDefault();
      onSelectAll?.();
      return;
    }

    // Deselect: Escape
    if (key === 'escape') {
      event.preventDefault();
      onDeselect?.();
      return;
    }

    // Delete: Delete or Backspace
    if (key === 'delete' || key === 'backspace') {
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
        event.preventDefault();
        onDelete?.();
      }
      return;
    }

    // Add Slide: Ctrl+M
    if (ctrlKey && code === 'KeyM') {
      event.preventDefault();
      onAddSlide?.();
      return;
    }

    // Delete Slide: Ctrl+Shift+Delete
    if (ctrlKey && event.shiftKey && key === 'delete') {
      event.preventDefault();
      onDeleteSlide?.();
      return;
    }

    // Next Slide: PageDown or Ctrl+ArrowDown
    if (key === 'pagedown' || (ctrlKey && key === 'arrowdown')) {
      event.preventDefault();
      onNextSlide?.();
      return;
    }

    // Previous Slide: PageUp or Ctrl+ArrowUp
    if (key === 'pageup' || (ctrlKey && key === 'arrowup')) {
      event.preventDefault();
      onPrevSlide?.();
      return;
    }

    // Preview: F5
    if (key === 'f5') {
      event.preventDefault();
      onPreview?.();
      return;
    }

    // Export: Ctrl+E
    if (ctrlKey && code === 'KeyE') {
      event.preventDefault();
      onExport?.();
      return;
    }

    // Bold: Ctrl+B
    if (ctrlKey && code === 'KeyB') {
      event.preventDefault();
      onBold?.();
      return;
    }

    // Italic: Ctrl+I
    if (ctrlKey && code === 'KeyI') {
      event.preventDefault();
      onItalic?.();
      return;
    }

    // Align Left: Ctrl+Shift+L
    if (ctrlKey && event.shiftKey && code === 'KeyL') {
      event.preventDefault();
      onAlignLeft?.();
      return;
    }

    // Align Center: Ctrl+Shift+E
    if (ctrlKey && event.shiftKey && code === 'KeyE') {
      event.preventDefault();
      onAlignCenter?.();
      return;
    }

    // Align Right: Ctrl+Shift+R
    if (ctrlKey && event.shiftKey && code === 'KeyR') {
      event.preventDefault();
      onAlignRight?.();
      return;
    }

    // Bring to Front: Ctrl+Shift+]
    if (ctrlKey && event.shiftKey && (code === 'BracketRight' || key === ']')) {
      event.preventDefault();
      onBringToFront?.();
      return;
    }

    // Send to Back: Ctrl+Shift+[
    if (ctrlKey && event.shiftKey && (code === 'BracketLeft' || key === '[')) {
      event.preventDefault();
      onSendToBack?.();
      return;
    }

    // Group: Ctrl+G
    if (ctrlKey && !event.shiftKey && code === 'KeyG') {
      event.preventDefault();
      onGroup?.();
      return;
    }

    // Ungroup: Ctrl+Shift+G
    if (ctrlKey && event.shiftKey && code === 'KeyG') {
      event.preventDefault();
      onUngroup?.();
      return;
    }

    // Zoom In: Ctrl++ or Ctrl+=
    if (ctrlKey && (code === 'Equal' || key === '+' || key === '=')) {
      event.preventDefault();
      onZoomIn?.();
      return;
    }

    // Zoom Out: Ctrl+-
    if (ctrlKey && (code === 'Minus' || key === '-')) {
      event.preventDefault();
      onZoomOut?.();
      return;
    }

    // Zoom Reset: Ctrl+0
    if (ctrlKey && (code === 'Digit0' || key === '0')) {
      event.preventDefault();
      onZoomReset?.();
      return;
    }
  }, [
    enabled, onSave, onUndo, onRedo, onCopy, onPaste, onCut, onDelete,
    onDuplicate, onSelectAll, onDeselect, onAddSlide, onDeleteSlide,
    onNextSlide, onPrevSlide, onPreview, onExport, onBold, onItalic,
    onAlignLeft, onAlignCenter, onAlignRight, onBringToFront, onSendToBack,
    onGroup, onUngroup, onZoomIn, onZoomOut, onZoomReset
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Shortcuts reference for help dialog
export const KEYBOARD_SHORTCUTS: { category: string; shortcuts: { keys: string; description: string }[] }[] = [
  {
    category: 'File',
    shortcuts: [
      { keys: 'Ctrl+S', description: 'Save presentation' },
      { keys: 'Ctrl+E', description: 'Export presentation' },
      { keys: 'F5', description: 'Preview presentation' },
    ],
  },
  {
    category: 'Edit',
    shortcuts: [
      { keys: 'Ctrl+Z', description: 'Undo' },
      { keys: 'Ctrl+Shift+Z', description: 'Redo' },
      { keys: 'Ctrl+C', description: 'Copy' },
      { keys: 'Ctrl+V', description: 'Paste' },
      { keys: 'Ctrl+X', description: 'Cut' },
      { keys: 'Ctrl+D', description: 'Duplicate' },
      { keys: 'Delete', description: 'Delete element' },
      { keys: 'Escape', description: 'Deselect' },
      { keys: 'Ctrl+A', description: 'Select all' },
    ],
  },
  {
    category: 'Slides',
    shortcuts: [
      { keys: 'Ctrl+M', description: 'Add new slide' },
      { keys: 'Page Down', description: 'Next slide' },
      { keys: 'Page Up', description: 'Previous slide' },
    ],
  },
  {
    category: 'Text',
    shortcuts: [
      { keys: 'Ctrl+B', description: 'Bold' },
      { keys: 'Ctrl+I', description: 'Italic' },
      { keys: 'Ctrl+Shift+L', description: 'Align left' },
      { keys: 'Ctrl+Shift+E', description: 'Align center' },
      { keys: 'Ctrl+Shift+R', description: 'Align right' },
    ],
  },
  {
    category: 'Arrange',
    shortcuts: [
      { keys: 'Ctrl+Shift+]', description: 'Bring to front' },
      { keys: 'Ctrl+Shift+[', description: 'Send to back' },
      { keys: 'Ctrl+G', description: 'Group elements' },
      { keys: 'Ctrl+Shift+G', description: 'Ungroup elements' },
    ],
  },
  {
    category: 'View',
    shortcuts: [
      { keys: 'Ctrl++', description: 'Zoom in' },
      { keys: 'Ctrl+-', description: 'Zoom out' },
      { keys: 'Ctrl+0', description: 'Reset zoom' },
    ],
  },
];

export default useKeyboardShortcuts;
