import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { config } from '@/config';

function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function syncShadcnTokens(root: HTMLElement, vars: Record<string, string>) {
  const bg = vars['color-bg'];
  const text = vars['color-text'];
  const card = vars['color-card-bg'];
  const primary = vars['color-primary'];
  const muted = vars['color-text-muted'];
  const border = vars['color-border'];

  const bgHsl = bg ? hexToHsl(bg) : null;
  const textHsl = text ? hexToHsl(text) : null;
  const primaryHsl = primary ? hexToHsl(primary) : null;
  const mutedTextHsl = muted ? hexToHsl(muted) : null;
  const borderHsl = border ? hexToHsl(border) : null;
  const cardHsl = card ? hexToHsl(card) : null;

  if (bgHsl) {
    root.style.setProperty('--background', bgHsl);
    root.style.setProperty('--primary-foreground', bgHsl);
  }
  if (textHsl) {
    root.style.setProperty('--foreground', textHsl);
    root.style.setProperty('--card-foreground', textHsl);
    root.style.setProperty('--popover-foreground', textHsl);
    root.style.setProperty('--secondary-foreground', textHsl);
    root.style.setProperty('--accent-foreground', textHsl);
  }
  if (primaryHsl) {
    root.style.setProperty('--primary', primaryHsl);
    root.style.setProperty('--ring', primaryHsl);
  }
  if (mutedTextHsl) {
    root.style.setProperty('--muted-foreground', mutedTextHsl);
  }
  if (borderHsl) {
    root.style.setProperty('--border', borderHsl);
    root.style.setProperty('--input', borderHsl);
  }
  if (cardHsl) {
    root.style.setProperty('--card', cardHsl);
    root.style.setProperty('--popover', cardHsl);
  }

  // Derive secondary/muted/accent from bg lightness
  if (bgHsl) {
    const parts = bgHsl.split(' ');
    const hue = parts[0];
    const lightness = parseInt(parts[2]);
    const isDark = lightness < 50;
    const secondaryL = isDark ? lightness + 10 : lightness - 8;
    const accentL = isDark ? lightness + 12 : lightness - 10;
    root.style.setProperty('--secondary', `${hue} 0% ${Math.max(0, Math.min(100, secondaryL))}%`);
    root.style.setProperty('--muted', `${hue} 0% ${Math.max(0, Math.min(100, secondaryL))}%`);
    root.style.setProperty('--accent', `${hue} 0% ${Math.max(0, Math.min(100, accentL))}%`);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const defaults: Record<string, string> = {
      'color-primary': config.primaryColor,
      'color-accent': config.accentColor,
      'color-bg': config.backgroundColor,
      'color-card-bg': config.cardBackground,
      'color-text': config.textColor,
      'color-text-muted': '#a0a0a0',
      'color-nav': config.navColor,
      'color-button': config.buttonColor,
      'color-border': config.borderColor,
      'font-family': 'Inter, system-ui, sans-serif',
    };

    // Apply config defaults
    Object.entries(defaults).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    // Override with DB theme_settings if any
    supabase
      .from('theme_settings')
      .select('key, value')
      .then(({ data }) => {
        const merged = { ...defaults };
        if (data) {
          data.forEach((row) => {
            root.style.setProperty(`--${row.key}`, row.value);
            merged[row.key] = row.value;
          });
        }
        syncShadcnTokens(root, merged);
        setReady(true);
      });
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
