import { create } from 'zustand';
import api from '../services/api';

export interface User {
  id: number;
  tenant_id: number | null;
  name: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'admin_tenant' | 'guru' | 'wali_santri';
  can_create_lms_local?: boolean;
  can_create_lms_global?: boolean;
  tenant?: {
    id: number;
    name: string;
    subdomain: string;
    institution_type?: 'pesantren' | 'non_pesantren';
    has_wali?: boolean;
    member_label?: string;
    theme_config?: any;
    subscription_expires_at?: string;
    days_remaining?: number;
    is_expiring_soon?: boolean;
    is_expired?: boolean;
    subscription_status?: string;
  };
  package?: {
    id: number;
    name: string;
    code: string;
    pricing_type?: string;
    price?: number;
    max_santri?: number;
    features?: Record<string, boolean>;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<any>;
  logout: () => void;
  loadFromStorage: () => void;
  refreshUser: () => Promise<User | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  refreshUser: async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.data) {
        const user = res.data.data;
        localStorage.setItem('tahfidz_user', JSON.stringify(user));
        set({ user });
        return user;
      }
    } catch (e) {
      console.error('Failed to refresh user profile:', e);
    }
    return null;
  },

  loadFromStorage: () => {
    if (typeof window !== 'undefined') {
      try {
        const storedToken = localStorage.getItem('tahfidz_token');
        const storedUser = localStorage.getItem('tahfidz_user');
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          set({ token: storedToken, user: parsedUser, isLoading: false });
          // Background sync with server for latest package & permissions
          get().refreshUser();
          return;
        }
      } catch (e) {
        console.error('Error loading auth from localStorage:', e);
      }
      set({ user: null, token: null, isLoading: false });
    }
  },

  login: async (login, password) => {
    const res = await api.post('/auth/login', { login, password });
    if (res.data?.success) {
      const { user, token } = res.data.data;
      localStorage.setItem('tahfidz_token', token);
      localStorage.setItem('tahfidz_user', JSON.stringify(user));
      if (user.tenant_id) {
        localStorage.setItem('tahfidz_tenant_id', String(user.tenant_id));
      } else {
        localStorage.removeItem('tahfidz_tenant_id');
      }
      set({ user, token, isLoading: false });
      return user;
    }
    throw new Error(res.data?.message || 'Login gagal.');
  },

  logout: () => {
    localStorage.removeItem('tahfidz_token');
    localStorage.removeItem('tahfidz_user');
    localStorage.removeItem('tahfidz_tenant_id');
    set({ user: null, token: null, isLoading: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
}));
