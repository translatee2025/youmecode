import { DEFAULT_TENANT_ID } from '@/config';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const SLOT_TYPES = [
  { key: 'reel_between', label: 'Between Reels', desc: 'Shown between reels in the Reels module' },
  { key: 'wall_between', label: 'Between Posts', desc: 'Shown between posts in the Wall module' },
  { key: 'directory_top', label: 'Directory Top', desc: 'Featured at top of directory listing' },
  { key: 'venue_page', label: 'Venue Page', desc: 'Banner on venue detail page' },
];

export default function AdSlotsManager() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('pricing');
  const [slotPricing, setSlotPricing] = useState<Record<string, any>>({});

  const { data: adSlots = [] } = useQuery({
    queryKey: ['', 'ad-slots'],
    enabled: !!'',
    queryFn: async () => {
      const { data } = await supabase.from('ad_slots').select('*');
      // Init local state
      const map: Record<string, any> = {};
      (data || []).forEach((s: any) => { map[s.slot_type] = s; });
      setSlotPricing(map);
      return data || [];
    },
  });

  const { data: ads = [] } = useQuery({
    queryKey: ['', 'admin-ads', tab],
    enabled: !!'',
    queryFn: async () => {
      const { data } = await supabase.from('ads').select('*, venues(name)').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const savePricing = useMutation({
    mutationFn: async () => {
      for (const st of SLOT_TYPES) {
        const existing = slotPricing[st.key];
        if (existing?.id) {
          await supabase.from('ad_slots').update({
            is_enabled: existing.is_enabled ?? true,
            price_weekly: existing.price_weekly,
            price_monthly: existing.price_monthly,
            currency: existing.currency || 'USD',
          }).eq('id', existing.id);
        } else {
          await supabase.from('ad_slots').insert({ tenant_id: DEFAULT_TENANT_ID,
            slot_type: st.key,
            is_enabled: existing?.is_enabled ?? true,
            price_weekly: existing?.price_weekly || 0,
            price_monthly: existing?.price_monthly || 0,
            currency: existing?.currency || 'USD',
          });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['', 'ad-slots'] });
      toast.success('Pricing saved');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateAd = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from('ads').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['', 'admin-ads'] });
      toast.success('Ad updated');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateSlot = (key: string, field: string, value: any) => {
    setSlotPricing((p) => ({ ...p, [key]: { ...p[key], slot_type: key, [field]: value } }));
  };

  const pendingAds = ads.filter((a: any) => a.status === 'pending');
  const activeAds = ads.filter((a: any) => a.status === 'active');
  const expiredAds = ads.filter((a: any) => a.status === 'expired' || (a.expires_at && new Date(a.expires_at) < new Date()));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Ad Slots</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="pending">Pending{pendingAds.length > 0 && ` (${pendingAds.length})`}</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="mt-4 space-y-4">
          <div className="glass overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slot</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Weekly</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead>Currency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SLOT_TYPES.map((st) => {
                  const s = slotPricing[st.key] || {};
                  return (
                    <TableRow key={st.key}>
                      <TableCell className="font-medium" style={{ color: 'var(--color-text)' }}>{st.label}</TableCell>
                      <TableCell className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{st.desc}</TableCell>
                      <TableCell><Switch checked={s.is_enabled ?? true} onCheckedChange={(c) => updateSlot(st.key, 'is_enabled', c)} /></TableCell>
                      <TableCell><Input type="number" className="w-24" value={s.price_weekly || ''} onChange={(e) => updateSlot(st.key, 'price_weekly', Number(e.target.value))} /></TableCell>
                      <TableCell><Input type="number" className="w-24" value={s.price_monthly || ''} onChange={(e) => updateSlot(st.key, 'price_monthly', Number(e.target.value))} /></TableCell>
                      <TableCell><Input className="w-20" value={s.currency || 'USD'} onChange={(e) => updateSlot(st.key, 'currency', e.target.value)} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <Button onClick={() => savePricing.mutate()} disabled={savePricing.isPending}>
            <Save className="h-4 w-4 mr-1" />{savePricing.isPending ? 'Saving…' : 'Save Pricing'}
          </Button>
        </TabsContent>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {pendingAds.length === 0 ? (
            <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No pending ads</p>
          ) : pendingAds.map((ad: any) => (
            <div key={ad.id} className="glass p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{ad.venues?.name || 'Unknown venue'}</p>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{ad.slot_type} · {ad.headline || 'No headline'}</p>
                </div>
                <Badge className="bg-amber-500/20 text-amber-400 border-0">Pending</Badge>
              </div>
              {ad.media_url && <img src={ad.media_url} alt="" className="rounded-lg max-h-40 object-cover" />}
              {ad.link_url && <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{ad.link_url}</p>}
              <div className="flex gap-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateAd.mutate({ id: ad.id, updates: { status: 'active' } })}>
                  <CheckCircle className="h-3 w-3 mr-1" />Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => updateAd.mutate({ id: ad.id, updates: { status: 'rejected' } })}>
                  <XCircle className="h-3 w-3 mr-1" />Reject
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          <div className="glass overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venue</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Impressions</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>CTR</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAds.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No active ads</TableCell></TableRow>
                ) : activeAds.map((ad: any) => (
                  <TableRow key={ad.id}>
                    <TableCell style={{ color: 'var(--color-text)' }}>{ad.venues?.name || '—'}</TableCell>
                    <TableCell><Badge variant="outline">{ad.slot_type}</Badge></TableCell>
                    <TableCell className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {ad.starts_at ? format(new Date(ad.starts_at), 'PP') : '—'} → {ad.expires_at ? format(new Date(ad.expires_at), 'PP') : '—'}
                    </TableCell>
                    <TableCell style={{ color: 'var(--color-text-muted)' }}>{ad.impressions || 0}</TableCell>
                    <TableCell style={{ color: 'var(--color-text-muted)' }}>{ad.clicks || 0}</TableCell>
                    <TableCell style={{ color: 'var(--color-text-muted)' }}>{ad.impressions ? ((ad.clicks || 0) / ad.impressions * 100).toFixed(1) + '%' : '—'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => updateAd.mutate({ id: ad.id, updates: { status: 'paused' } })}>Pause</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="expired" className="mt-4">
          <div className="glass overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venue</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Expired</TableHead>
                  <TableHead>Impressions</TableHead>
                  <TableHead>Clicks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiredAds.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No expired ads</TableCell></TableRow>
                ) : expiredAds.map((ad: any) => (
                  <TableRow key={ad.id}>
                    <TableCell style={{ color: 'var(--color-text)' }}>{ad.venues?.name || '—'}</TableCell>
                    <TableCell><Badge variant="outline">{ad.slot_type}</Badge></TableCell>
                    <TableCell style={{ color: 'var(--color-text-muted)' }}>{ad.expires_at ? format(new Date(ad.expires_at), 'PP') : '—'}</TableCell>
                    <TableCell style={{ color: 'var(--color-text-muted)' }}>{ad.impressions || 0}</TableCell>
                    <TableCell style={{ color: 'var(--color-text-muted)' }}>{ad.clicks || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
