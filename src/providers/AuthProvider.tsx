import { useEffect, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useTenantStore } from '@/stores/tenantStore';

export function AuthProvider({ children }: { children: ReactNode }) {
  const tenant = useTenantStore((s) => s.tenant);
  const { setSession, setProfile, setLoading, reset } = useAuthStore();

  useEffect(() => {
    if (!tenant) return;

    // Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          // Fetch user profile for this tenant
          const { data: profile } = await supabase
            .from('users')
            .select('id, tenant_id, email, username, display_name, avatar_url, role, is_verified, is_banned, preferred_language, location_city')
            .eq('id', session.user.id)
            .eq('tenant_id', tenant.id)
            .maybeSingle();

          setProfile(profile || null);
        } else {
          setProfile(null);
        }
      }
    );

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
      // onAuthStateChange will handle the rest
    });

    return () => subscription.unsubscribe();
  }, [tenant, setSession, setProfile, setLoading, reset]);

  return <>{children}</>;
}
