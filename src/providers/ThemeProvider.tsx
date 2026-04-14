import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { config } from '@/config';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    // Apply config defaults
    root.style.setProperty('--color-primary', config.primaryColor);
    root.style.setProperty('--color-accent', config.accentColor);
    root.style.setProperty('--color-bg', config.backgroundColor);
    root.style.setProperty('--color-card-bg', config.cardBackground);
    root.style.setProperty('--color-text', config.textColor);
    root.style.setProperty('--color-text-muted', '#888888');
    root.style.setProperty('--color-nav', config.navColor);
    root.style.setProperty('--color-button', config.buttonColor);
    root.style.setProperty('--color-border', config.borderColor);
    root.style.setProperty('--font-family', 'Inter, system-ui, sans-serif');

    // Override with DB theme_settings if any
    supabase
      .from('theme_settings')
      .select('key, value')
      .then(({ data }) => {
        if (data) {
          data.forEach((row) => {
            root.style.setProperty(`--${row.key}`, row.value);
          });
        }
        setReady(true);
      });
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
