import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Search, MoreVertical, Download, Ban, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const ROLES = ['user', 'moderator', 'venue_manager', 'vendor'] as const;

const roleBadgeVariant = (role: string) => {
  switch (role) {
    case 'creator': return 'default';
    case 'moderator': return 'secondary';
    case 'venue_manager': return 'outline';
    case 'vendor': return 'outline';
    default: return 'secondary';
  }
};

export default function UserManager() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailUser, setDetailUser] = useState<any>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['', 'admin-users', search, roleFilter, statusFilter, sortBy],
    enabled: !!'',
    queryFn: async () => {
      let q = supabase
        .from('users')
        .select('*')
        .order(sortBy, { ascending: sortBy === 'username' });

      if (search) q = q.or(`username.ilike.%${search}%,email.ilike.%${search}%,display_name.ilike.%${search}%`);
      if (roleFilter !== 'all') q = q.eq('role', roleFilter);
      if (statusFilter === 'active') q = q.eq('is_banned', false);
      if (statusFilter === 'banned') q = q.eq('is_banned', true);

      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from('users').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['', 'admin-users'] });
      toast.success('User updated');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleAll = () => {
    if (selected.size === users.length) setSelected(new Set());
    else setSelected(new Set(users.map((u: any) => u.id)));
  };

  const bulkBan = async () => {
    for (const id of selected) {
      await supabase.from('users').update({ is_banned: true }).eq('id', id);
    }
    qc.invalidateQueries({ queryKey: ['', 'admin-users'] });
    setSelected(new Set());
    toast.success(`${selected.size} users banned`);
  };

  const exportCSV = () => {
    const rows = users.filter((u: any) => selected.has(u.id));
    const headers = 'username,email,role,city,joined\n';
    const csv = headers + rows.map((u: any) =>
      `${u.username || ''},${u.email || ''},${u.role || ''},${u.location_city || ''},${u.created_at || ''}`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'users-export.csv';
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text, #f0f0f0)' }}>Users</h1>
        {selected.size > 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={bulkBan}><Ban className="h-3 w-3 mr-1" />Ban Selected ({selected.size})</Button>
            <Button size="sm" variant="outline" onClick={exportCSV}><Download className="h-3 w-3 mr-1" />Export CSV</Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Joined</SelectItem>
            <SelectItem value="username">Username</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"><Checkbox checked={selected.size === users.length && users.length > 0} onCheckedChange={toggleAll} /></TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Loading…</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No users found</TableCell></TableRow>
            ) : users.map((u: any) => (
              <TableRow key={u.id} className="cursor-pointer" onClick={() => setDetailUser(u)}>
                <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={selected.has(u.id)} onCheckedChange={() => toggleSelect(u.id)} /></TableCell>
                <TableCell style={{ color: 'var(--color-text)' }}>{u.username || '—'}</TableCell>
                <TableCell style={{ color: 'var(--color-text-muted)' }}>{u.email || '—'}</TableCell>
                <TableCell><Badge variant={roleBadgeVariant(u.role)}>{u.role || 'user'}</Badge></TableCell>
                <TableCell style={{ color: 'var(--color-text-muted)' }}>{u.location_city || '—'}</TableCell>
                <TableCell style={{ color: 'var(--color-text-muted)' }}>{u.created_at ? format(new Date(u.created_at), 'PP') : '—'}</TableCell>
                <TableCell>
                  {u.is_banned
                    ? <Badge variant="destructive">Banned</Badge>
                    : <Badge variant="secondary">Active</Badge>}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {ROLES.map((r) => (
                        <DropdownMenuItem key={r} onClick={() => updateUser.mutate({ id: u.id, updates: { role: r } })}>
                          Set {r}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem onClick={() => updateUser.mutate({ id: u.id, updates: { is_banned: !u.is_banned } })}>
                        {u.is_banned ? 'Unban' : 'Ban'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateUser.mutate({ id: u.id, updates: { is_verified: true } })}>
                        Grant Verified
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!detailUser} onOpenChange={() => setDetailUser(null)}>
        <SheetContent style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
          <SheetHeader><SheetTitle style={{ color: 'var(--color-text)' }}>User Detail</SheetTitle></SheetHeader>
          {detailUser && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--color-text)' }}>
                  {detailUser.display_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{detailUser.display_name || detailUser.username}</p>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>@{detailUser.username}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                <p><strong>Email:</strong> {detailUser.email}</p>
                <p><strong>Role:</strong> {detailUser.role}</p>
                <p><strong>City:</strong> {detailUser.location_city || '—'}</p>
                <p><strong>Joined:</strong> {detailUser.created_at ? format(new Date(detailUser.created_at), 'PPP') : '—'}</p>
                <p><strong>Verified:</strong> {detailUser.is_verified ? 'Yes' : 'No'}</p>
                <p><strong>Banned:</strong> {detailUser.is_banned ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
