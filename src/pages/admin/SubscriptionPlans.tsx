import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Save, Lock, X, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR'];

export default function SubscriptionPlans() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<any>(null);
  const [featureInput, setFeatureInput] = useState('');

  const { data: siteSettings } = useQuery({
    queryKey: ['site-settings-commerce'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('commerce_enabled').single();
      return data;
    },
  });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    enabled: !!'' && siteSettings?.commerce_enabled === true,
    queryFn: async () => {
      const { data, error } = await supabase.from('subscription_plans').select('*').order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });

  const savePlan = useMutation({
    mutationFn: async (plan: any) => {
      const payload = { ...plan,
 };
      delete payload.id;
      if (editing?.id) {
        const { error } = await supabase.from('subscription_plans').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('subscription_plans').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription-plans'] });
      setEditing(null);
      toast.success('Plan saved');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subscription_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plan deleted');
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('subscription_plans').update({ is_active: active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription-plans'] }),
  });

  if (!siteSettings?.commerce_enabled) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="glass p-8 max-w-md text-center space-y-4">
          <Lock className="h-12 w-12 mx-auto" style={{ color: 'var(--color-text-muted)' }} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Commerce is currently OFF</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Enable Commerce in Site Settings to manage subscription plans.</p>
          <Button variant="outline" onClick={() => navigate('/admin/settings')}><Settings className="h-4 w-4 mr-1" />Go to Site Settings</Button>
        </div>
      </div>
    );
  }

  const newPlan = () => setEditing({
    name: '', description: '', price_monthly: '', price_quarterly: '', price_annual: '',
    currency: 'USD', features: [], is_active: true, sort_order: plans.length,
    stripe_monthly_price_id: '', stripe_quarterly_price_id: '', stripe_annual_price_id: '',
  });

  const discount = (monthly: number, other: number, months: number) => {
    if (!monthly || !other) return null;
    const full = monthly * months;
    const pct = Math.round((1 - other / full) * 100);
    return pct > 0 ? `${pct}% off` : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Subscription Plans</h1>
        <Button onClick={newPlan}><Plus className="h-4 w-4 mr-1" />Add Plan</Button>
      </div>

      <div className="glass overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Monthly</TableHead>
              <TableHead>Quarterly</TableHead>
              <TableHead>Annual</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Loading…</TableCell></TableRow>
            ) : plans.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No plans yet</TableCell></TableRow>
            ) : plans.map((p: any) => (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => setEditing(p)}>
                <TableCell style={{ color: 'var(--color-text)' }}>{p.name}</TableCell>
                <TableCell style={{ color: 'var(--color-text-muted)' }}>{p.price_monthly ? `${p.currency} ${p.price_monthly}` : '—'}</TableCell>
                <TableCell style={{ color: 'var(--color-text-muted)' }}>
                  {p.price_quarterly ? `${p.currency} ${p.price_quarterly}` : '—'}
                  {discount(p.price_monthly, p.price_quarterly, 3) && <Badge variant="secondary" className="ml-1 text-xs">{discount(p.price_monthly, p.price_quarterly, 3)}</Badge>}
                </TableCell>
                <TableCell style={{ color: 'var(--color-text-muted)' }}>
                  {p.price_annual ? `${p.currency} ${p.price_annual}` : '—'}
                  {discount(p.price_monthly, p.price_annual, 12) && <Badge variant="secondary" className="ml-1 text-xs">{discount(p.price_monthly, p.price_annual, 12)}</Badge>}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Switch checked={p.is_active} onCheckedChange={(c) => toggleActive.mutate({ id: p.id, active: c })} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="text-red-400" onClick={() => { if (confirm('Delete this plan?')) deletePlan.mutate(p.id); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!editing} onOpenChange={() => setEditing(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
          <SheetHeader><SheetTitle style={{ color: 'var(--color-text)' }}>{editing?.id ? 'Edit Plan' : 'New Plan'}</SheetTitle></SheetHeader>
          {editing && (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label style={{ color: 'var(--color-text-muted)' }}>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: 'var(--color-text-muted)' }}>Description</Label>
                <Textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: 'var(--color-text-muted)' }}>Currency</Label>
                <Select value={editing.currency || 'USD'} onValueChange={(v) => setEditing({ ...editing, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Monthly</Label>
                  <Input type="number" value={editing.price_monthly || ''} onChange={(e) => setEditing({ ...editing, price_monthly: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Quarterly</Label>
                  <Input type="number" value={editing.price_quarterly || ''} onChange={(e) => setEditing({ ...editing, price_quarterly: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Annual</Label>
                  <Input type="number" value={editing.price_annual || ''} onChange={(e) => setEditing({ ...editing, price_annual: e.target.value ? Number(e.target.value) : null })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label style={{ color: 'var(--color-text-muted)' }}>Features</Label>
                <div className="flex flex-wrap gap-1">
                  {(editing.features || []).map((f: string, i: number) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {f}
                      <button onClick={() => setEditing({ ...editing, features: editing.features.filter((_: any, j: number) => j !== i) })}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Add feature..." value={featureInput} onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && featureInput.trim()) { setEditing({ ...editing, features: [...(editing.features || []), featureInput.trim()] }); setFeatureInput(''); } }} />
                  <Button size="sm" variant="outline" onClick={() => { if (featureInput.trim()) { setEditing({ ...editing, features: [...(editing.features || []), featureInput.trim()] }); setFeatureInput(''); } }}>Add</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 pt-2">
                <Input placeholder="Stripe monthly price ID" value={editing.stripe_monthly_price_id || ''} onChange={(e) => setEditing({ ...editing, stripe_monthly_price_id: e.target.value || null })} />
                <Input placeholder="Stripe quarterly price ID" value={editing.stripe_quarterly_price_id || ''} onChange={(e) => setEditing({ ...editing, stripe_quarterly_price_id: e.target.value || null })} />
                <Input placeholder="Stripe annual price ID" value={editing.stripe_annual_price_id || ''} onChange={(e) => setEditing({ ...editing, stripe_annual_price_id: e.target.value || null })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_active} onCheckedChange={(c) => setEditing({ ...editing, is_active: c })} />
                <Label style={{ color: 'var(--color-text-muted)' }}>Active</Label>
              </div>
              <Button className="w-full" onClick={() => savePlan.mutate(editing)} disabled={!editing.name || savePlan.isPending}>
                <Save className="h-4 w-4 mr-1" />{savePlan.isPending ? 'Saving…' : 'Save Plan'}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
