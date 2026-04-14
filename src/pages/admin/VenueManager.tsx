import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Search, MoreVertical, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS: Record<string, string> = {
  unclaimed: 'bg-gray-500/20 text-gray-400',
  claim_pending: 'bg-amber-500/20 text-amber-400',
  claimed_directory: 'bg-blue-500/20 text-blue-400',
  claimed_commerce: 'bg-green-500/20 text-green-400',
  opted_out: 'bg-red-500/20 text-red-400',
};

export default function VenueManager() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-list'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, name');
      return data || [];
    },
  });

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ['admin-venues', search, statusFilter, categoryFilter],
    queryFn: async () => {
      let q = supabase
        .from('venues')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });

      if (search) q = q.ilike('name', `%${search}%`);
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      if (categoryFilter !== 'all') q = q.eq('category_id', categoryFilter);

      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const updateVenue = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from('venues').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-venues'] });
      toast.success('Venue updated');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteVenue = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('venues').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-venues'] });
      toast.success('Venue deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text, #f0f0f0)' }}>Venues</h1>
        <Button size="sm" variant="outline" onClick={() => navigate('/admin/import')}>
          <Upload className="h-3 w-3 mr-1" />Import CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
          <Input placeholder="Search venues..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.keys(STATUS_COLORS).map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="glass overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Loading…</TableCell></TableRow>
            ) : venues.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No venues found</TableCell></TableRow>
            ) : venues.map((v: any) => (
              <TableRow key={v.id}>
                <TableCell style={{ color: 'var(--color-text)' }}>{v.name}</TableCell>
                <TableCell style={{ color: 'var(--color-text-muted)' }}>{v.categories?.name || '—'}</TableCell>
                <TableCell style={{ color: 'var(--color-text-muted)' }}>{v.city || '—'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[v.status] || STATUS_COLORS.unclaimed}`}>
                    {(v.status || 'unclaimed').replace('_', ' ')}
                  </span>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={!!v.is_featured}
                    onCheckedChange={(c) => updateVenue.mutate({ id: v.id, updates: { is_featured: c } })}
                  />
                </TableCell>
                <TableCell style={{ color: 'var(--color-text-muted)' }}>{v.created_at ? format(new Date(v.created_at), 'PP') : '—'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => updateVenue.mutate({ id: v.id, updates: { status: 'claimed_directory' } })}>
                        Force Approve Claim
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateVenue.mutate({ id: v.id, updates: { is_featured: !v.is_featured } })}>
                        Toggle Featured
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateVenue.mutate({ id: v.id, updates: { status: 'opted_out' } })}>
                        Mark Opted Out
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400" onClick={() => {
                        if (confirm('Delete this venue? This cannot be undone.')) deleteVenue.mutate(v.id);
                      }}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
