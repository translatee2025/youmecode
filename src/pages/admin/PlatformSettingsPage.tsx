import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

export default function PlatformSettingsPage() {
  const tenant = useTenantStore((s) => s.tenant);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenant) setName(tenant.name);
  }, [tenant]);

  const save = async () => {
    if (!tenant) return;
    setSaving(true);
    await supabase.from('tenants').update({ name }).eq('id', tenant.id);
    toast({ title: 'Platform settings saved' });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Platform Settings</h2>
      <Card className="glass max-w-lg">
        <CardHeader><CardTitle className="text-base">Platform Name</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
