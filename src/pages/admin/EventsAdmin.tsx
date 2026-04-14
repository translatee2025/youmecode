import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';

export default function EventsAdmin() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    title: '', description: '', cover_image_url: '', start_at: '', end_at: '',
    address: '', capacity: '', ticket_link: '', is_free: true, price: '', currency: 'USD', status: 'upcoming',
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('events').select('*').order('start_at', { ascending: false });
    setEvents(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = statusFilter === 'all' ? events : events.filter((e) => e.status === statusFilter);
  const upcoming = events.filter((e) => e.status === 'upcoming');

  const openEdit = (event: any) => {
    setEditing(event);
    setForm({
      title: event.title ?? '', description: event.description ?? '', cover_image_url: event.cover_image_url ?? '',
      start_at: event.start_at ? event.start_at.slice(0, 16) : '', end_at: event.end_at ? event.end_at.slice(0, 16) : '',
      address: event.address ?? '', capacity: event.capacity?.toString() ?? '', ticket_link: event.ticket_link ?? '',
      is_free: event.is_free ?? true, price: event.price?.toString() ?? '', currency: event.currency ?? 'USD',
      status: event.status ?? 'upcoming',
    });
  };

  const openCreate = () => {
    setEditing({ id: null });
    setForm({ title: '', description: '', cover_image_url: '', start_at: '', end_at: '', address: '', capacity: '', ticket_link: '', is_free: true, price: '', currency: 'USD', status: 'upcoming' });
  };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload: any = {
 title: form.title.trim(), description: form.description.trim() || null,
      cover_image_url: form.cover_image_url.trim() || null, start_at: form.start_at || null, end_at: form.end_at || null,
      address: form.address.trim() || null, capacity: form.capacity ? parseInt(form.capacity) : null,
      ticket_link: form.ticket_link.trim() || null, is_free: form.is_free,
      price: !form.is_free && form.price ? parseFloat(form.price) : null, currency: form.currency, status: form.status,
    };
    if (editing.id) {
      await supabase.from('events').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('events').insert(payload);
    }
    toast({ title: editing.id ? 'Event updated' : 'Event created' });
    setEditing(null);
    setSaving(false);
    await load();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await supabase.from('events').delete().eq('id', id);
    toast({ title: 'Event deleted' });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Events</h2>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Create Event</Button>
      </div>

      {/* Upcoming highlight */}
      {upcoming.length > 0 && (
        <div className="glass rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Upcoming Events ({upcoming.length})</h3>
          <div className="flex flex-wrap gap-2">
            {upcoming.slice(0, 5).map((e) => (
              <Badge key={e.id} variant="secondary" className="cursor-pointer" onClick={() => openEdit(e)}>
                {e.title} · {e.start_at ? format(new Date(e.start_at), 'MMM d') : 'TBD'}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="upcoming">Upcoming</SelectItem>
          <SelectItem value="live">Live</SelectItem>
          <SelectItem value="past">Past</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      {/* Table */}
      <div className="glass rounded-lg overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Title</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Attendees</TableHead><TableHead className="w-24">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium text-foreground">{e.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.start_at ? format(new Date(e.start_at), 'MMM d, yyyy h:mm a') : 'TBD'}</TableCell>
                <TableCell><Badge variant={e.status === 'upcoming' ? 'default' : 'secondary'}>{e.status}</Badge></TableCell>
                <TableCell>{e.attendees_count ?? 0}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteEvent(e.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No events found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? 'Edit Event' : 'Create Event'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Cover Image URL</label>
              <Input value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <div className="grid grid-cols-2 gap-3">
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
              <label className="text-sm font-medium text-foreground">Ticket Link</label>
              <Input value={form.ticket_link} onChange={(e) => setForm({ ...form, ticket_link: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={save} disabled={saving || !form.title.trim()} className="w-full">
              {saving ? 'Saving...' : editing?.id ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
