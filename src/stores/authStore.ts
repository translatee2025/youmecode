import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  tenant_id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  is_verified: boolean | null;
  is_banned: boolean | null;
  preferred_language: string | null;
  location_city: string | null;
}

interface AuthState {
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isLoading: true,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  reset: () => set({ session: null, profile: null, isLoading: false }),
}));
