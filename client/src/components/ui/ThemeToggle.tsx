// src/components/ui/ThemeToggle.tsx
import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'switch';
}

export const ThemeToggle = ({ className, variant = 'icon' }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();

  console.log('ThemeToggle render, current theme:', theme);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Button clicked!');
    toggleTheme();
  };

  if (variant === 'switch') {
    return (
      <button
        onClick={handleToggle}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 flex-shrink-0',
          theme === 'dark' ? 'bg-[#2D9B6E]' : 'bg-[#E2E8F0]',
          className
        )}
        aria-label="Toggle theme"
        type="button"
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200',
            theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'p-2 rounded-lg transition-colors duration-200',
        'hover:bg-[#E8F0F8] dark:hover:bg-[#1A3D5A]',
        className
      )}
      aria-label="Toggle theme"
      type="button"
    >
      {theme === 'dark' ? (
        <FaSun className="w-5 h-5 text-yellow-500" />
      ) : (
        <FaMoon className="w-5 h-5 text-[#0A2E4A]" />
      )}
    </button>
  );
};