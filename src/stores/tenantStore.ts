import { create } from 'zustand';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string | null;
  custom_domain: string | null;
  logo_url: string | null;
  status: string | null;
  onboarding_completed: boolean | null;
  platform_type: string | null;
}

interface TenantState {
  tenant: Tenant | null;
  setTenant: (tenant: Tenant) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  tenant: null,
  setTenant: (tenant) => set({ tenant, isLoading: false, error: null }),
  isLoading: true,
  setLoading: (isLoading) => set({ isLoading }),
  error: null,
  setError: (error) => set({ error, isLoading: false }),
}));
