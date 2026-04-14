import { useEffect, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setSession, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('id, email, username, display_name, avatar_url, role, is_verified, is_banned, preferred_language, location_city')
            .eq('id', session.user.id)
            .maybeSingle();

          setProfile(profile || null);
        } else {
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, setProfile, setLoading]);

  return <>{children}</>;
}
