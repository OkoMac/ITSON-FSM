import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';
import api from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // Call real backend API
          const response = await api.login(email, password) as any;

          // Store JWT token
          localStorage.setItem('token', response.data?.token || '');

          // Map backend user response to frontend User type
          const userData = response.data?.user || {};
          const user: User = {
            id: userData.id || '',
            email: userData.email || email,
            name: userData.name || '',
            role: (userData.role || 'worker') as UserRole,
            avatar: undefined,
            phoneNumber: userData.phone || '',
            createdAt: userData.created_at || new Date().toISOString(),
            updatedAt: userData.updated_at || new Date().toISOString(),
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || error.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        // Clear JWT token
        localStorage.removeItem('token');

        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      switchRole: (role: UserRole) => {
        set((state) => ({
          user: state.user ? { ...state.user, role } : null,
        }));
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
