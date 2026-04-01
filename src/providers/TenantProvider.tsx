import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import FullscreenLoader from '@/components/FullscreenLoader';
import TenantNotFound from '@/pages/TenantNotFound';

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { tenant, isLoading, error, setTenant, setError } = useTenantStore();

  useEffect(() => {
    const resolve = async () => {
      const hostname = window.location.hostname;
      let subdomain: string | null = null;
      let customDomain: string | null = null;

      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.includes('lovable.app')
      ) {
        const params = new URLSearchParams(window.location.search);
        subdomain =
          params.get('tenant') ||
          import.meta.env.VITE_DEV_TENANT ||
          null;

        if (!subdomain) {
          setError('no_tenant');
          return;
        }
      } else {
        const parts = hostname.split('.');
        if (parts.length >= 3) {
          subdomain = parts[0];
        } else {
          customDomain = hostname;
        }
      }

      const { data, error: err } = await supabase
        .from('tenants')
        .select('*')
        .or(
          `subdomain.eq.${subdomain ?? ''},custom_domain.eq.${customDomain ?? ''}`
        )
        .maybeSingle();

      if (err || !data) {
        setError('not_found');
        return;
      }

      setTenant({
        id: data.id,
        name: data.name,
        subdomain: data.subdomain,
        custom_domain: data.custom_domain,
        logo_url: data.logo_url,
        status: data.status,
        onboarding_completed: data.onboarding_completed,
        platform_type: data.platform_type,
      });
    };

    resolve();
  }, [setTenant, setError]);

  if (isLoading) return <FullscreenLoader />;
  if (error || !tenant) return <TenantNotFound />;

  return <>{children}</>;
}
