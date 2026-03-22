import { create } from "zustand";

interface ThemeStore {
  dark: boolean;
  toggle: () => void;
  init: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  dark: true,
  toggle: () => {
    set((s) => {
      const next = !s.dark;
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("light", !next);
        localStorage.setItem("theme", next ? "dark" : "light");
      }
      return { dark: next };
    });
  },
  init: () => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("theme");
    const isDark = saved ? saved === "dark" : true;
    document.documentElement.classList.toggle("light", !isDark);
    set({ dark: isDark });
  },
}));
