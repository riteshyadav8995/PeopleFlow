import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  organizationId?: string;
  roles: string[];
  permissions: string[];
  hasEmployeeProfile?: boolean;
  employeeId?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  activeContext: 'platform' | 'organization' | 'employee';
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setContext: (context: 'platform' | 'organization' | 'employee') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      activeContext: 'employee',
      setAuth: (user, accessToken, refreshToken) => 
        set({ 
          user, 
          accessToken, 
          refreshToken, 
          isAuthenticated: true,
          activeContext: user.roles?.includes('super_admin') ? 'platform' : 
                         (user.roles?.includes('tenant_admin') || !user.hasEmployeeProfile) ? 'organization' : 'employee'
        }),
      setTokens: (accessToken, refreshToken) => 
        set({ accessToken, refreshToken }),
      setContext: (context) => set({ activeContext: context }),
      logout: () => 
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, activeContext: 'employee' }),
    }),
    {
      name: 'peopleflow-auth',
    }
  )
);
