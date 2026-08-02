import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Keyboard } from 'lucide-react';
import { KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  trigger?: React.ReactNode;
}

export const KeyboardShortcutsHelp = ({ trigger }: KeyboardShortcutsHelpProps) => {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  const formatKeys = (keys: string) => {
    if (isMac) {
      return keys
        .replace(/Ctrl/g, '⌘')
        .replace(/Alt/g, '⌥')
        .replace(/Shift/g, '⇧');
    }
    return keys;
  };

  return (
    <Dialog>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            {trigger || (
              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 gap-1 rounded hover:bg-background">
                <Keyboard className="w-3 h-3" />
              </Button>
            )}
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent className="bg-gradient-to-r from-primary to-purple-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-medium rounded-lg">
          <div className="flex items-center gap-1.5">
            <Keyboard className="w-3 h-3" />
            Keyboard Shortcuts
          </div>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {KEYBOARD_SHORTCUTS.map((category) => (
              <div key={category.category}>
                <h3 className="font-semibold text-sm mb-3 text-foreground">{category.category}</h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut) => (
                    <div key={shortcut.keys} className="flex justify-between items-center py-1">
                      <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                        {formatKeys(shortcut.keys)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          {isMac ? 'Use ⌘ for Ctrl on Mac' : 'Use Ctrl for shortcuts'}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsHelp;
