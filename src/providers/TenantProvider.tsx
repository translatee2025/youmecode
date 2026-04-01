import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import FullscreenLoader from '@/components/FullscreenLoader';

function TenantError() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-4">
        <h1 className="text-2xl font-bold text-foreground">Configuration Required</h1>
        <p className="text-muted-foreground">
          <code className="px-1.5 py-0.5 rounded bg-muted text-sm">VITE_TENANT_ID</code> is not configured.
          Add it to your environment variables in Lovable.
        </p>
      </div>
    </div>
  );
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { tenant, isLoading, error, setTenant, setError } = useTenantStore();

  useEffect(() => {
    const tenantId = import.meta.env.VITE_TENANT_ID;

    if (!tenantId) {
      setError('not_configured');
      return;
    }

    supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('not_found');
          return;
        }
        setTenant({
          id: data.id,
          name: data.name,
          subdomain: data.subdomain,
          logo_url: data.logo_url,
          status: data.status,
          onboarding_completed: data.onboarding_completed,
          platform_type: data.platform_type,
        });
      });
  }, [setTenant, setError]);

  if (isLoading) return <FullscreenLoader />;
  if (error || !tenant) return <TenantError />;

  return <>{children}</>;
}
