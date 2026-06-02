import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserPasajero } from '@/types';

interface AuthState {
  user:            UserPasajero | null;
  isAuthenticated: boolean;
  setAuth:   (user: UserPasajero, access: string, refresh: string) => void;
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
    { name: 'cooptaxi-pasajero-auth', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) },
  ),
);
