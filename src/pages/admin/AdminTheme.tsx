import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_TENANT_ID, config } from '@/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const THEME_KEYS = [
  { key: 'color-bg', label: 'Background', default: config.backgroundColor },
  { key: 'color-card-bg', label: 'Card Background', default: config.cardBackground },
  { key: 'color-text', label: 'Text', default: config.textColor },
  { key: 'color-text-muted', label: 'Muted Text', default: '#888888' },
  { key: 'color-primary', label: 'Primary', default: config.primaryColor },
  { key: 'color-nav', label: 'Navigation', default: config.navColor },
  { key: 'color-button', label: 'Button', default: config.buttonColor },
  { key: 'color-border', label: 'Border', default: config.borderColor },
];

const PRESETS = [
  { name: 'Dark Minimal', values: { 'color-bg': '#0a0a0a', 'color-card-bg': 'rgba(255,255,255,0.06)', 'color-text': '#f0f0f0', 'color-text-muted': '#888888', 'color-primary': '#ffffff', 'color-nav': 'rgba(10,10,10,0.85)', 'color-button': '#ffffff', 'color-border': 'rgba(255,255,255,0.1)' } },
  { name: 'Pure White', values: { 'color-bg': '#ffffff', 'color-card-bg': '#f5f5f5', 'color-text': '#111111', 'color-text-muted': '#666666', 'color-primary': '#111111', 'color-nav': '#ffffff', 'color-button': '#111111', 'color-border': '#e5e5e5' } },
  { name: 'Midnight Blue', values: { 'color-bg': '#0d1b2a', 'color-card-bg': 'rgba(255,255,255,0.06)', 'color-text': '#e8f4f8', 'color-text-muted': '#7a9ab5', 'color-primary': '#4fc3f7', 'color-nav': 'rgba(13,27,42,0.9)', 'color-button': '#4fc3f7', 'color-border': 'rgba(79,195,247,0.2)' } },
  { name: 'Deep Forest', values: { 'color-bg': '#0d1f0d', 'color-card-bg': 'rgba(255,255,255,0.06)', 'color-text': '#e8f5e9', 'color-text-muted': '#7aab7a', 'color-primary': '#81c784', 'color-nav': 'rgba(13,31,13,0.9)', 'color-button': '#81c784', 'color-border': 'rgba(129,199,132,0.2)' } },
  { name: 'Warm Sand', values: { 'color-bg': '#faf3e0', 'color-card-bg': 'rgba(0,0,0,0.04)', 'color-text': '#3e2723', 'color-text-muted': '#8d6e63', 'color-primary': '#bf360c', 'color-nav': 'rgba(250,243,224,0.95)', 'color-button': '#bf360c', 'color-border': 'rgba(0,0,0,0.1)' } },
  { name: 'Neon Night', values: { 'color-bg': '#0a0a0a', 'color-card-bg': 'rgba(255,255,255,0.06)', 'color-text': '#f0f0f0', 'color-text-muted': '#888888', 'color-primary': '#ff00aa', 'color-nav': 'rgba(10,10,10,0.85)', 'color-button': '#ff00aa', 'color-border': 'rgba(255,0,170,0.3)' } },
];

export default function AdminTheme() {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const def: Record<string, string> = {};
    THEME_KEYS.forEach(t => def[t.key] = t.default);
    return def;
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('theme_settings').select('key, value').then(({ data }) => {
      if (data && data.length > 0) {
        const map: Record<string, string> = {};
        THEME_KEYS.forEach(t => map[t.key] = t.default);
        data.forEach(r => { map[r.key] = r.value; });
        setValues(map);
      }
      setLoading(false);
    });
  }, []);

  const applyPreset = (preset: typeof PRESETS[0]) => setValues({ ...preset.values });

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
    toast({ title: 'Theme saved!' });
  };

  if (loading) return <div className="animate-pulse h-64 rounded-xl" style={{ background: 'var(--color-card-bg)' }} />;

  const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/i.test(v);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Theme</h1>

      <div>
        <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-muted)' }}>Presets</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => applyPreset(p)} className="rounded-xl p-3 text-center text-xs font-medium transition-transform hover:scale-105"
              style={{ background: p.values['color-bg'], color: p.values['color-text'], border: `2px solid ${p.values['color-border']}` }}>
              <div className="w-6 h-6 rounded-full mx-auto mb-1.5" style={{ background: p.values['color-primary'] }} />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
          <CardHeader><CardTitle className="text-base" style={{ color: 'var(--color-text)' }}>Colors</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {THEME_KEYS.map(t => (
              <div key={t.key} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg border shrink-0" style={{ background: values[t.key], borderColor: 'var(--color-border)' }} />
                <div className="flex-1">
                  <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.label}</Label>
                  <div className="flex gap-2">
                    <Input value={values[t.key]} onChange={(e) => setValues(prev => ({ ...prev, [t.key]: e.target.value }))}
                      className="h-8 text-xs bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                    {isHex(values[t.key]) && (
                      <input type="color" value={values[t.key]} onChange={(e) => setValues(prev => ({ ...prev, [t.key]: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
          <CardHeader><CardTitle className="text-base" style={{ color: 'var(--color-text)' }}>Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-xl overflow-hidden" style={{ background: values['color-bg'] }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ background: values['color-nav'] }}>
                <span className="text-sm font-semibold" style={{ color: values['color-text'] }}>My Platform</span>
                <div className="flex gap-3">
                  <span className="text-xs" style={{ color: values['color-text-muted'] }}>Home</span>
                  <span className="text-xs" style={{ color: values['color-primary'] }}>Directory</span>
                </div>
              </div>
              <div className="p-4">
                <div className="rounded-xl p-4" style={{ background: values['color-card-bg'], border: `1px solid ${values['color-border']}` }}>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: values['color-text'] }}>Sample Venue</h3>
                  <p className="text-xs mb-3" style={{ color: values['color-text-muted'] }}>A great place to visit</p>
                  <button className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: values['color-button'], color: values['color-bg'] }}>View Details</button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} disabled={saving} style={{ background: 'var(--color-button)', color: 'var(--color-bg)' }}>
        {saving ? 'Saving...' : 'Save Theme'}
      </Button>
    </div>
  );
}
