import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import FullscreenLoader from '@/components/FullscreenLoader';

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { tenant, isLoading, error, setTenant, setError, setLoading } = useTenantStore();

  useEffect(() => {
    supabase
      .from('tenants')
      .select('*')
      .limit(1)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) {
          setError('db_error');
          return;
        }
        if (!data) {
          setError('no_tenant');
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

  if (error === 'db_error') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-4">
          <h1 className="text-2xl font-bold text-foreground">Connection Error</h1>
          <p className="text-muted-foreground">Cannot connect to database. Check your Supabase configuration.</p>
        </div>
      </div>
    );
  }

  // No tenant row → redirect to /setup handled by router
  // Tenant exists → render children (router handles onboarding redirect)
  return <>{children}</>;
}
