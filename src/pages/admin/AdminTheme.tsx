import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_TENANT_ID, config } from '@/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const THEME_KEYS = [
  { key: 'color-bg', label: 'Background', default: config.backgroundColor },
  { key: 'color-card-bg', label: 'Card Background', default: config.cardBackground },
  { key: 'color-text', label: 'Text', default: config.textColor },
  { key: 'color-text-muted', label: 'Muted Text', default: '#a0a0a0' },
  { key: 'color-primary', label: 'Primary / Accent', default: config.primaryColor },
  { key: 'color-nav', label: 'Navigation', default: config.navColor },
  { key: 'color-button', label: 'Button', default: config.buttonColor },
  { key: 'color-border', label: 'Border', default: config.borderColor },
];

const PALETTES = [
  {
    name: 'Charcoal',
    description: 'Deep dark with bright white accents. Maximum contrast.',
    values: {
      'color-bg': '#111111',
      'color-card-bg': '#1a1a1a',
      'color-text': '#f5f5f5',
      'color-text-muted': '#999999',
      'color-primary': '#ffffff',
      'color-nav': '#111111',
      'color-button': '#ffffff',
      'color-border': '#2a2a2a',
    },
    preview: ['#111111', '#1a1a1a', '#ffffff', '#999999'],
  },
  {
    name: 'Silver Fog',
    description: 'Light grey canvas with dark typography. Clean and airy.',
    values: {
      'color-bg': '#f2f2f2',
      'color-card-bg': '#ffffff',
      'color-text': '#1a1a1a',
      'color-text-muted': '#707070',
      'color-primary': '#1a1a1a',
      'color-nav': '#f2f2f2',
      'color-button': '#1a1a1a',
      'color-border': '#e0e0e0',
    },
    preview: ['#f2f2f2', '#ffffff', '#1a1a1a', '#707070'],
  },
  {
    name: 'Graphite',
    description: 'Mid-tone grey with warm highlights. Balanced and modern.',
    values: {
      'color-bg': '#1e1e1e',
      'color-card-bg': '#282828',
      'color-text': '#e8e8e8',
      'color-text-muted': '#8a8a8a',
      'color-primary': '#d4d4d4',
      'color-nav': '#1e1e1e',
      'color-button': '#d4d4d4',
      'color-border': '#363636',
    },
    preview: ['#1e1e1e', '#282828', '#d4d4d4', '#8a8a8a'],
  },
  {
    name: 'Concrete',
    description: 'Warm off-white with charcoal text. Soft and inviting.',
    values: {
      'color-bg': '#e8e4e0',
      'color-card-bg': '#f5f2ef',
      'color-text': '#2d2926',
      'color-text-muted': '#7a7572',
      'color-primary': '#2d2926',
      'color-nav': '#e8e4e0',
      'color-button': '#2d2926',
      'color-border': '#d4d0cc',
    },
    preview: ['#e8e4e0', '#f5f2ef', '#2d2926', '#7a7572'],
  },
  {
    name: 'Obsidian',
    description: 'Near-black with cool grey tones. Sleek and premium.',
    values: {
      'color-bg': '#0a0a0c',
      'color-card-bg': '#141418',
      'color-text': '#eaeaef',
      'color-text-muted': '#7c7c88',
      'color-primary': '#c8c8d4',
      'color-nav': 'rgba(10,10,12,0.92)',
      'color-button': '#c8c8d4',
      'color-border': '#26262e',
    },
    preview: ['#0a0a0c', '#141418', '#c8c8d4', '#7c7c88'],
  },
];

export default function AdminTheme() {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const def: Record<string, string> = {};
    THEME_KEYS.forEach(t => def[t.key] = t.default);
    return def;
  });
  const [activePalette, setActivePalette] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('theme_settings').select('key, value').then(({ data }) => {
      if (data && data.length > 0) {
        const map: Record<string, string> = {};
        THEME_KEYS.forEach(t => map[t.key] = t.default);
        data.forEach(r => { map[r.key] = r.value; });
        setValues(map);
        // Detect active palette
        const match = PALETTES.find(p =>
          Object.entries(p.values).every(([k, v]) => map[k] === v)
        );
        if (match) setActivePalette(match.name);
      }
      setLoading(false);
    });
  }, []);

  const applyPalette = (palette: typeof PALETTES[0]) => {
    setValues({ ...palette.values });
    setActivePalette(palette.name);
    // Live preview
    Object.entries(palette.values).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    for (const [key, value] of Object.entries(values)) {
      const { data: existing } = await supabase.from('theme_settings').select('id').eq('key', key).maybeSingle();
      if (existing) {
        await supabase.from('theme_settings').update({ value }).eq('id', existing.id);
      } else {
        await supabase.from('theme_settings').insert({ tenant_id: DEFAULT_TENANT_ID, key, value });
      }
    }
    Object.entries(values).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
    setSaving(false);
    toast({ title: 'Theme saved!', description: activePalette ? `Applied "${activePalette}" palette.` : 'Custom theme applied.' });
  };

  if (loading) return <div className="animate-pulse h-64 rounded-xl bg-secondary" />;

  const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/i.test(v);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Theme</h1>
        <p className="text-muted-foreground mt-1">Choose a palette or customize individual colors</p>
      </div>

      {/* Palette Selector */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Palettes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PALETTES.map(p => (
            <button
              key={p.name}
              onClick={() => applyPalette(p)}
              className={cn(
                'relative rounded-2xl border-2 p-5 text-left transition-all duration-200 hover:shadow-lg',
                activePalette === p.name
                  ? 'border-foreground shadow-lg'
                  : 'border-border hover:border-foreground/30',
              )}
              style={{ background: p.values['color-bg'] }}
            >
              {activePalette === p.name && (
                <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-foreground flex items-center justify-center">
                  <Check className="h-4 w-4 text-background" />
                </div>
              )}
              {/* Color swatches */}
              <div className="flex gap-1.5 mb-4">
                {p.preview.map((color, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-lg border border-white/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <h3 className="font-semibold text-sm" style={{ color: p.values['color-text'] }}>{p.name}</h3>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: p.values['color-text-muted'] }}>{p.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Color Customizer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Custom Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {THEME_KEYS.map(t => (
              <div key={t.key} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl border border-border shrink-0 shadow-inner"
                  style={{ background: values[t.key] }}
                />
                <div className="flex-1 min-w-0">
                  <Label className="text-xs text-muted-foreground">{t.label}</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={values[t.key]}
                      onChange={(e) => {
                        setValues(prev => ({ ...prev, [t.key]: e.target.value }));
                        setActivePalette(null);
                        document.documentElement.style.setProperty(`--${t.key}`, e.target.value);
                      }}
                      className="h-9 text-xs font-mono"
                    />
                    {isHex(values[t.key]) && (
                      <input
                        type="color"
                        value={values[t.key]}
                        onChange={(e) => {
                          setValues(prev => ({ ...prev, [t.key]: e.target.value }));
                          setActivePalette(null);
                          document.documentElement.style.setProperty(`--${t.key}`, e.target.value);
                        }}
                        className="w-9 h-9 rounded-lg cursor-pointer border border-border p-0.5"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl overflow-hidden border" style={{ background: values['color-bg'], borderColor: values['color-border'] }}>
              {/* Nav preview */}
              <div className="px-5 py-3.5 flex items-center justify-between" style={{ background: values['color-nav'], borderBottom: `1px solid ${values['color-border']}` }}>
                <span className="text-sm font-bold" style={{ color: values['color-text'] }}>My Platform</span>
                <div className="flex gap-4">
                  <span className="text-sm" style={{ color: values['color-text-muted'] }}>Home</span>
                  <span className="text-sm font-medium" style={{ color: values['color-primary'] }}>Directory</span>
                </div>
              </div>
              {/* Card preview */}
              <div className="p-5">
                <div className="rounded-xl p-5" style={{ background: values['color-card-bg'], border: `1px solid ${values['color-border']}` }}>
                  <h3 className="text-base font-semibold mb-1" style={{ color: values['color-text'] }}>Sample Venue</h3>
                  <p className="text-sm mb-4" style={{ color: values['color-text-muted'] }}>A great place to visit in the city centre</p>
                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: values['color-button'], color: values['color-bg'] }}>
                      View Details
                    </button>
                    <span className="text-sm" style={{ color: values['color-text-muted'] }}>★ 4.5 (28)</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <div className="flex-1 rounded-xl p-4 text-center" style={{ background: values['color-card-bg'], border: `1px solid ${values['color-border']}` }}>
                    <div className="text-lg font-bold" style={{ color: values['color-text'] }}>124</div>
                    <div className="text-xs" style={{ color: values['color-text-muted'] }}>Venues</div>
                  </div>
                  <div className="flex-1 rounded-xl p-4 text-center" style={{ background: values['color-card-bg'], border: `1px solid ${values['color-border']}` }}>
                    <div className="text-lg font-bold" style={{ color: values['color-text'] }}>56</div>
                    <div className="text-xs" style={{ color: values['color-text-muted'] }}>Events</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} disabled={saving} className="h-11 px-8 rounded-full">
        {saving ? 'Saving...' : 'Save Theme'}
      </Button>
    </div>
  );
}
