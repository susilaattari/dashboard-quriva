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
  isImpersonated?: boolean;
  originalSuperAdmin?: {
    id: number;
    name: string;
  };
  tenant?: {
    id: number;
    name: string;
    subdomain: string;
    institution_type?: 'pesantren' | 'non_pesantren';
    has_wali?: boolean;
    member_label?: string;
    santri_quota?: number;
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
  isImpersonating: boolean;
  login: (login: string, password: string) => Promise<any>;
  impersonateTenant: (tenantId: number) => Promise<any>;
  exitImpersonation: () => void;
  logout: () => void;
  loadFromStorage: () => void;
  refreshUser: () => Promise<User | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isImpersonating: false,

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
        const hasBackupToken = !!localStorage.getItem('tahfidz_superadmin_backup_token');
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          set({
            token: storedToken,
            user: parsedUser,
            isImpersonating: hasBackupToken,
            isLoading: false,
          });
          // Background sync with server for latest package & permissions
          get().refreshUser();
          return;
        }
      } catch (e) {
        console.error('Error loading auth from localStorage:', e);
      }
      set({ user: null, token: null, isImpersonating: false, isLoading: false });
    }
  },

  impersonateTenant: async (tenantId: number) => {
    const currentToken = localStorage.getItem('tahfidz_token');
    const currentUser = localStorage.getItem('tahfidz_user');

    if (!currentToken || !currentUser) {
      throw new Error('Sesi Super Admin tidak valid.');
    }

    const res = await api.post(`/auth/impersonate/${tenantId}`);
    if (res.data?.success && res.data?.data) {
      const { user, token } = res.data.data;

      // Save backup of original Super Admin
      localStorage.setItem('tahfidz_superadmin_backup_token', currentToken);
      localStorage.setItem('tahfidz_superadmin_backup_user', currentUser);

      // Save tenant admin session
      localStorage.setItem('tahfidz_token', token);
      localStorage.setItem('tahfidz_user', JSON.stringify(user));
      if (user.tenant_id) {
        localStorage.setItem('tahfidz_tenant_id', String(user.tenant_id));
      }

      set({ user, token, isImpersonating: true, isLoading: false });
      return user;
    }
    throw new Error(res.data?.message || 'Gagal melakukan impersonasi institusi.');
  },

  exitImpersonation: () => {
    if (typeof window !== 'undefined') {
      const backupToken = localStorage.getItem('tahfidz_superadmin_backup_token');
      const backupUser = localStorage.getItem('tahfidz_superadmin_backup_user');

      if (backupToken && backupUser) {
        localStorage.setItem('tahfidz_token', backupToken);
        localStorage.setItem('tahfidz_user', backupUser);
        localStorage.removeItem('tahfidz_tenant_id');
        localStorage.removeItem('tahfidz_superadmin_backup_token');
        localStorage.removeItem('tahfidz_superadmin_backup_user');

        set({
          token: backupToken,
          user: JSON.parse(backupUser),
          isImpersonating: false,
          isLoading: false,
        });

        window.location.href = '/superadmin/dashboard';
        return;
      }

      // Fallback
      localStorage.removeItem('tahfidz_superadmin_backup_token');
      localStorage.removeItem('tahfidz_superadmin_backup_user');
      window.location.href = '/superadmin/dashboard';
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
      set({ user, token, isImpersonating: false, isLoading: false });
      return user;
    }
    throw new Error(res.data?.message || 'Login gagal.');
  },

  logout: () => {
    localStorage.removeItem('tahfidz_token');
    localStorage.removeItem('tahfidz_user');
    localStorage.removeItem('tahfidz_tenant_id');
    localStorage.removeItem('tahfidz_superadmin_backup_token');
    localStorage.removeItem('tahfidz_superadmin_backup_user');
    set({ user: null, token: null, isImpersonating: false, isLoading: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
}));
