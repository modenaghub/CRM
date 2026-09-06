import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export interface SessionOrg {
  id: string;
  name: string;
  segmentKey: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: SessionUser | null;
  organization: SessionOrg | null;
  enabledModules: string[];
  verticalTemplate: any | null;
  setSession: (data: {
    accessToken: string;
    refreshToken: string;
    user: SessionUser;
    organization: SessionOrg;
  }) => void;
  setMe: (data: { user: SessionUser; organization: SessionOrg; enabledModules: string[]; verticalTemplate: any }) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      organization: null,
      enabledModules: [],
      verticalTemplate: null,
      setSession: ({ accessToken, refreshToken, user, organization }) =>
        set({ accessToken, refreshToken, user, organization }),
      setMe: ({ user, organization, enabledModules, verticalTemplate }) =>
        set({ user, organization, enabledModules, verticalTemplate }),
      setAccessToken: (token) => set({ accessToken: token }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          organization: null,
          enabledModules: [],
          verticalTemplate: null,
        }),
    }),
    { name: 'crm-auth' },
  ),
);
