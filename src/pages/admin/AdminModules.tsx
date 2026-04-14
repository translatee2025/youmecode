import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const DEFAULT_MODULES = [
  'landing', 'directory', 'wall', 'reels', 'explore', 'events', 'blog',
  'messenger', 'chatrooms', 'discussions', 'groups', 'charts', 'faq',
  'pages', 'profiles', 'notifications',
];

interface ModuleRow {
  id: string;
  module_key: string;
  label: string;
  is_enabled: boolean;
  show_in_nav: boolean;
  is_homepage: boolean;
  sort_order: number;
}

export default function AdminModules() {
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchModules = async () => {
    const { data, error } = await supabase
      .from('module_settings')
      .select('id, module_key, label, is_enabled, show_in_nav, is_homepage, sort_order')
      .eq('tenant_id', tenant.id)
      .order('sort_order');

    if (error) { setLoading(false); return; }

    if (!data || data.length === 0) {
      // Insert defaults
      const rows = DEFAULT_MODULES.map((key, i) => ({
        tenant_id: tenant.id,
        module_key: key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        is_enabled: true,
        show_in_nav: true,
        is_homepage: key === 'landing',
        sort_order: i,
      }));
      await supabase.from('module_settings').insert(rows);
      return fetchModules();
    }

    setModules(data.map(d => ({
      ...d,
      is_enabled: d.is_enabled ?? true,
      show_in_nav: d.show_in_nav ?? true,
      is_homepage: d.is_homepage ?? false,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchModules(); }, []);

  const updateField = (id: string, field: keyof ModuleRow, value: any) => {
    setModules(prev => prev.map(m => {
      if (field === 'is_homepage') {
        return { ...m, is_homepage: m.id === id };
      }
      return m.id === id ? { ...m, [field]: value } : m;
    }));
  };

  const moveModule = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= modules.length) return;
    const copy = [...modules];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    copy.forEach((m, i) => m.sort_order = i);
    setModules(copy);
  };

  const handleSave = async () => {
    setSaving(true);
    for (const m of modules) {
      await supabase.from('module_settings').update({
        is_enabled: m.is_enabled,
        show_in_nav: m.show_in_nav,
        is_homepage: m.is_homepage,
        sort_order: m.sort_order,
      }).eq('id', m.id);
    }
    setSaving(false);
    toast({ title: 'Modules saved!' });
  };

  if (loading) return <div className="animate-pulse h-64 rounded-xl" style={{ background: 'var(--color-card-bg)' }} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text, #f0f0f0)' }}>Modules</h1>

      <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
        <CardContent className="p-0">
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {modules.map((m, i) => (
              <div key={m.id} className="flex items-center gap-4 px-4 py-3">
                {/* Reorder */}
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveModule(i, -1)} disabled={i === 0} className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20">
                    <ArrowUp className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  </button>
                  <button onClick={() => moveModule(i, 1)} disabled={i === modules.length - 1} className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20">
                    <ArrowDown className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  </button>
                </div>

                {/* Label */}
                <span className="flex-1 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{m.label}</span>

                {/* Enabled toggle */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Enabled</span>
                  <Switch checked={m.is_enabled} onCheckedChange={(v) => updateField(m.id, 'is_enabled', v)} />
                </div>

                {/* Show in Nav toggle */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Nav</span>
                  <Switch checked={m.show_in_nav} onCheckedChange={(v) => updateField(m.id, 'show_in_nav', v)} />
                </div>

                {/* Homepage radio */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Home</span>
                  <input
                    type="radio"
                    name="homepage"
                    checked={m.is_homepage}
                    onChange={() => updateField(m.id, 'is_homepage', true)}
                    className="accent-[var(--color-primary)]"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} style={{ background: 'var(--color-button, #fff)', color: 'var(--color-bg, #0a0a0a)' }}>
        {saving ? 'Saving...' : 'Save All'}
      </Button>
    </div>
  );
}
