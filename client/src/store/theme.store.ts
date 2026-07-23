// src/store/theme.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () => {
        console.log('Toggle theme called');
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          console.log('New theme:', newTheme);
          return { theme: newTheme };
        });
      },
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme-storage',
    }
  )
);