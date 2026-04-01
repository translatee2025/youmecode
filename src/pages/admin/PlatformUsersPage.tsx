import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Search, Ban, CheckCircle2 } from 'lucide-react';

export default function PlatformUsersPage() {
  const tenant = useTenantStore((s) => s.tenant);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!tenant) return;
    const { data } = await supabase.from('users').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(200);
    setUsers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [tenant]);

  const toggleBan = async (user: any) => {
    await supabase.from('users').update({ is_banned: !user.is_banned }).eq('id', user.id);
    toast({ title: user.is_banned ? 'User unbanned' : 'User banned' });
    load();
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.display_name?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Platform Users</h2>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="glass rounded-lg overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>User</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead className="w-24">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-foreground">{u.display_name || u.username || '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                <TableCell>
                  {u.is_banned ? <Badge variant="destructive">Banned</Badge> : <Badge variant="default">Active</Badge>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => toggleBan(u)} title={u.is_banned ? 'Unban' : 'Ban'}>
                    {u.is_banned ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Ban className="h-4 w-4 text-destructive" />}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
