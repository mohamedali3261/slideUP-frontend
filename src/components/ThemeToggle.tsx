import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ThemeToggleProps {
  variant?: 'navbar' | 'editor';
}

export const ThemeToggle = ({ variant = 'navbar' }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();

  if (variant === 'editor') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-xl hover:bg-muted/50 transition-all duration-200"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
              ) : (
                <Sun className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-xl hover:bg-muted/50 transition-all duration-200"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
      ) : (
        <Sun className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
      )}
    </Button>
  );
};
