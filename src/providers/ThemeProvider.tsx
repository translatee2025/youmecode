import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';

const THEME_DEFAULTS: Record<string, string> = {
  'color-bg': '#0a0a0a',
  'color-card-bg': 'rgba(255,255,255,0.06)',
  'color-text': '#f0f0f0',
  'color-text-muted': '#888888',
  'color-primary': '#ffffff',
  'color-nav': 'rgba(10,10,10,0.85)',
  'color-button': '#ffffff',
  'color-border': 'rgba(255,255,255,0.1)',
  'font-family': 'Inter, system-ui, sans-serif',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const tenant = useTenantStore((s) => s.tenant);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Apply defaults immediately
    const root = document.documentElement;
    Object.entries(THEME_DEFAULTS).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    if (!tenant) {
      setReady(true);
      return;
    }

    const loadTheme = async () => {
      const { data } = await supabase
        .from('theme_settings')
        .select('key, value')
        .eq('tenant_id', tenant.id);

      if (data) {
        data.forEach((row) => {
          root.style.setProperty(`--${row.key}`, row.value);
        });
      }
      setReady(true);
    };

    loadTheme();
  }, [tenant]);

  if (!ready) return null;

  return <>{children}</>;
}
