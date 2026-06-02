import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

type AuthUser = Pick<User, 'id' | 'nombre' | 'email' | 'rol' | 'rating_promedio'>;

interface AuthState {
  user:            AuthUser | null;
  isAuthenticated: boolean;
  setAuth:  (user: AuthUser, access: string, refresh: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      isAuthenticated: false,
      setAuth: (user, access, refresh) => {
        localStorage.setItem('access_token',  access);
        localStorage.setItem('refresh_token', refresh);
        set({ user, isAuthenticated: true });
      },
      clearAuth: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
      },
    }),
    { name: 'cooptaxi-auth', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) },
  ),
);
