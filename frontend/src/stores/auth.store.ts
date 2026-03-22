import { create } from "zustand";

interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  profileImage?: string;
  school?: string;
  course?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  updateUser: (partial: Partial<User>) => void;
  clearAuth: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("userRole", user.role);
    localStorage.setItem("userData", JSON.stringify(user));
    set({ user, token });
  },
  // NEW: update user fields without full re-login (for avatar, profile edits)
  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    localStorage.setItem("userData", JSON.stringify(updated));
    set({ user: updated });
  },
  clearAuth: () => {
    localStorage.clear();
    set({ user: null, token: null });
  },
  loadFromStorage: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    const userData = localStorage.getItem("userData");
    if (token && userData) {
      set({ token, user: JSON.parse(userData) });
    }
  },
}));
