// src/hooks/useTheme.ts
import { useEffect } from 'react';
import { useThemeStore } from '../store/theme.store';

export const useTheme = () => {
  const { theme, toggleTheme, setTheme } = useThemeStore();

  useEffect(() => {
    console.log('Theme changed to:', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      console.log('Added dark class');
    } else {
      root.classList.remove('dark');
      console.log('Removed dark class');
    }
  }, [theme]);

  return { theme, toggleTheme, setTheme };
};