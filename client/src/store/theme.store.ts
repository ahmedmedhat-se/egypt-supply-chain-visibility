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
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          return { theme: newTheme };
        });
      },
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme-storage',
      // Harden against stale values (e.g. an old 'system' setting from a
      // previous version) sitting in a user's localStorage: only ever
      // rehydrate to 'light' or 'dark'.
      merge: (persisted, current) => {
        const state = (persisted ?? {}) as Partial<ThemeStore>;
        const theme = state.theme === 'dark' ? 'dark' : 'light';
        return { ...current, ...state, theme };
      },
    }
  )
);