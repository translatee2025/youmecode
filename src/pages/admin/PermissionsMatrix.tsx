import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Save, Info } from 'lucide-react';

const ROLES = ['user', 'moderator', 'venue_manager', 'vendor'] as const;

const PERMISSIONS = [
  { key: 'can_post_wall', label: 'Can post to wall' },
  { key: 'can_upload_reels', label: 'Can upload reels' },
  { key: 'can_create_venues', label: 'Can create venues' },
  { key: 'can_add_products', label: 'Can add products (commerce)' },
  { key: 'can_comment', label: 'Can comment on content' },
  { key: 'can_rate', label: 'Can rate and write reviews' },
  { key: 'can_access_chatrooms', label: 'Can access chat rooms' },
  { key: 'can_use_messenger', label: 'Can use direct messenger' },
  { key: 'can_create_groups', label: 'Can create groups' },
  { key: 'can_create_events', label: 'Can create events' },
  { key: 'can_see_profiles', label: 'Can see member profiles' },
] as const;

type Matrix = Record<string, Record<string, boolean>>;

const defaultMatrix = (): Matrix => {
  const m: Matrix = {};
  for (const p of PERMISSIONS) {
    m[p.key] = {};
    for (const r of ROLES) {
      m[p.key][r] = r !== 'user' || !['can_create_venues', 'can_add_products'].includes(p.key);
    }
  }
  return m;
};

export default function PermissionsMatrix() {
  const tenant = useTenantStore((s) => s.tenant);
  const qc = useQueryClient();
  const [matrix, setMatrix] = useState<Matrix>(defaultMatrix());

  const { data: settings } = useQuery({
    queryKey: [tenant?.id, 'site-settings-perms'],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('permissions_matrix').eq('tenant_id', tenant!.id).single();
      return data;
    },
  });

  useEffect(() => {
    if (settings?.permissions_matrix && typeof settings.permissions_matrix === 'object' && !Array.isArray(settings.permissions_matrix)) {
      setMatrix({ ...defaultMatrix(), ...(settings.permissions_matrix as Matrix) });
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('site_settings').update({ permissions_matrix: matrix as any }).eq('tenant_id', tenant!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [tenant?.id, 'site-settings-perms'] });
      toast.success('Permissions saved');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = (permKey: string, role: string) => {
    setMatrix((prev) => ({
      ...prev,
      [permKey]: { ...prev[permKey], [role]: !prev[permKey]?.[role] },
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text, #f0f0f0)' }}>Permissions</h1>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          <Save className="h-4 w-4 mr-1" />{save.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

      <div className="glass p-3 flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>Creators and platform admins always have full access. Changes take effect immediately for all users of that role.</span>
      </div>

      <div className="glass overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Permission</TableHead>
              {ROLES.map((r) => (
                <TableHead key={r} className="text-center capitalize">{r.replace('_', ' ')}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {PERMISSIONS.map((p) => (
              <TableRow key={p.key}>
                <TableCell style={{ color: 'var(--color-text)' }}>{p.label}</TableCell>
                {ROLES.map((r) => (
                  <TableCell key={r} className="text-center">
                    <Switch
                      checked={!!matrix[p.key]?.[r]}
                      onCheckedChange={() => toggle(p.key, r)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
