import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';

export default function CreateEventPage() {
  const tenant = useTenantStore((s) => s.tenant);
  const profile = useAuthStore((s) => s.profile);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', cover_image_url: '', start_at: '', end_at: '',
    address: '', capacity: '', ticket_link: '', is_free: true, price: '', currency: 'USD',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!tenant || !profile || !form.title.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('events').insert({
      tenant_id: tenant.id,
      created_by: profile.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      cover_image_url: form.cover_image_url.trim() || null,
      start_at: form.start_at || null,
      end_at: form.end_at || null,
      address: form.address.trim() || null,
      capacity: form.capacity ? parseInt(form.capacity) : null,
      ticket_link: form.ticket_link.trim() || null,
      is_free: form.is_free,
      price: !form.is_free && form.price ? parseFloat(form.price) : null,
      currency: form.currency,
      status: 'upcoming',
    });
    if (error) {
      toast({ title: 'Error creating event', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Event created!' });
      navigate('/events');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Create Event</title></Helmet>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="glass">
          <CardHeader><CardTitle>Create Event</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Cover Image URL</label>
              <Input value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Start</label>
                <Input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">End</label>
                <Input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Address</label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Capacity</label>
              <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_free} onCheckedChange={(c) => setForm({ ...form, is_free: c })} />
              <span className="text-sm text-foreground">Free event</span>
            </div>
            {!form.is_free && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Price</label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Currency</label>
                  <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Ticket Link (external)</label>
              <Input value={form.ticket_link} onChange={(e) => setForm({ ...form, ticket_link: e.target.value })} placeholder="https://..." />
            </div>
            <Button onClick={handleSubmit} disabled={submitting || !form.title.trim()} className="w-full">
              {submitting ? 'Creating...' : 'Create Event'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
