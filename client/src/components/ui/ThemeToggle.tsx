import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'switch';
}

export const ThemeToggle = ({ className, variant = 'icon' }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTheme();
  };

  if (variant === 'switch') {
    return (
      <button
        onClick={handleToggle}
        className={cn(
          'relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 flex-shrink-0 shadow-md hover:shadow-lg',
          theme === 'dark' 
            ? 'bg-gradient-to-r from-[#2D9B6E] to-[#1F7A52]' 
            : 'bg-[#E2E8F0]',
          className
        )}
        aria-label="Toggle theme"
        type="button"
      >
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center',
            theme === 'dark' ? 'translate-x-8' : 'translate-x-1'
          )}
        >
          {theme === 'dark' ? (
            <FaMoon className="w-2.5 h-2.5 text-[#2D9B6E]" />
          ) : (
            <FaSun className="w-2.5 h-2.5 text-yellow-500" />
          )}
        </span>
        <span className="absolute inset-0 rounded-full transition-all duration-300 opacity-0 hover:opacity-100 bg-white/10" />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'p-2.5 rounded-xl transition-all duration-300',
        'hover:bg-[#E8F0F8] dark:hover:bg-[#2A2A2A]',
        'hover:scale-110 active:scale-95',
        className
      )}
      aria-label="Toggle theme"
      type="button"
    >
      {theme === 'dark' ? (
        <FaSun className="w-5 h-5 text-yellow-400 hover:text-yellow-300 transition-colors duration-200" />
      ) : (
        <FaMoon className="w-5 h-5 text-[#0A2E4A] hover:text-[#2D9B6E] transition-colors duration-200" />
      )}
    </button>
  );
};