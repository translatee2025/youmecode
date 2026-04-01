import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { MoreVertical, ShoppingBag, Settings, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProductManager() {
  const tenant = useTenantStore((s) => s.tenant);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: siteSettings } = useQuery({
    queryKey: [tenant?.id, 'site-settings'],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('commerce_enabled').eq('tenant_id', tenant!.id).single();
      return data;
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: [tenant?.id, 'admin-products', statusFilter],
    enabled: !!tenant?.id && siteSettings?.commerce_enabled === true,
    queryFn: async () => {
      let q = supabase
        .from('products')
        .select('*, venues(name), categories(name)')
        .eq('tenant_id', tenant!.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from('products').update(updates).eq('id', id).eq('tenant_id', tenant!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [tenant?.id, 'admin-products'] });
      toast.success('Product updated');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id).eq('tenant_id', tenant!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [tenant?.id, 'admin-products'] });
      toast.success('Product deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!siteSettings?.commerce_enabled) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="glass p-8 max-w-md text-center space-y-4">
          <Lock className="h-12 w-12 mx-auto" style={{ color: 'var(--color-text-muted)' }} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Commerce is currently OFF</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Products are not visible to users. Enable Commerce in Site Settings to allow vendors to list products.
          </p>
          <Button variant="outline" onClick={() => navigate('/admin/settings')}>
            <Settings className="h-4 w-4 mr-1" />Go to Site Settings
          </Button>
        </div>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500/20 text-green-400 border-0">Active</Badge>;
      case 'hidden': return <Badge className="bg-gray-500/20 text-gray-400 border-0">Hidden</Badge>;
      case 'pending': return <Badge className="bg-amber-500/20 text-amber-400 border-0">Pending</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text, #f0f0f0)' }}>Products</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Loading…</TableCell></TableRow>
            ) : products.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No products</TableCell></TableRow>
            ) : products.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell style={{ color: 'var(--color-text)' }}>{p.name}</TableCell>
                <TableCell style={{ color: 'var(--color-text-muted)' }}>{p.venues?.name || '—'}</TableCell>
                <TableCell style={{ color: 'var(--color-text-muted)' }}>{p.categories?.name || '—'}</TableCell>
                <TableCell style={{ color: 'var(--color-text-muted)' }}>{p.price ? `${p.currency || '$'}${p.price}` : '—'}</TableCell>
                <TableCell>{statusBadge(p.status || 'active')}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => updateProduct.mutate({ id: p.id, updates: { status: 'active' } })}>Approve</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProduct.mutate({ id: p.id, updates: { status: 'hidden' } })}>Hide</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400" onClick={() => {
                        if (confirm('Delete this product?')) deleteProduct.mutate(p.id);
                      }}>Delete</DropdownMenuItem>
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
