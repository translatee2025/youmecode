import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { Plus, Save, Trash2, ExternalLink, GripVertical } from 'lucide-react';

export default function FaqManager() {
  const tenant = useTenantStore((s) => s.tenant);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: [tenant?.id, 'admin-faqs'],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from('faqs').select('*').eq('tenant_id', tenant!.id).order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });

  const saveFaq = useMutation({
    mutationFn: async (faq: any) => {
      const payload = {
        tenant_id: tenant!.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category || null,
        sort_order: faq.sort_order ?? faqs.length,
        is_active: faq.is_active ?? true,
      };
      if (faq.id) {
        const { error } = await supabase.from('faqs').update(payload).eq('id', faq.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('faqs').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [tenant?.id, 'admin-faqs'] });
      setEditing(null);
      toast.success('FAQ saved');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteFaq = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [tenant?.id, 'admin-faqs'] });
      toast.success('FAQ deleted');
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('faqs').update({ is_active: active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [tenant?.id, 'admin-faqs'] }),
  });

  const newFaq = () => setEditing({ question: '', answer: '', category: '', is_active: true, sort_order: faqs.length });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>FAQ</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open('/faq', '_blank')}>
            <ExternalLink className="h-3 w-3 mr-1" />Preview
          </Button>
          <Button onClick={newFaq}><Plus className="h-4 w-4 mr-1" />Add FAQ</Button>
        </div>
      </div>

      <div className="glass overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Question</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Loading…</TableCell></TableRow>
            ) : faqs.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No FAQs yet</TableCell></TableRow>
            ) : faqs.map((f: any) => (
              <TableRow key={f.id} className="cursor-pointer" onClick={() => setEditing(f)}>
                <TableCell><GripVertical className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} /></TableCell>
                <TableCell style={{ color: 'var(--color-text)' }} className="max-w-[300px] truncate">{f.question}</TableCell>
                <TableCell style={{ color: 'var(--color-text-muted)' }}>{f.category || '—'}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Switch checked={f.is_active} onCheckedChange={(c) => toggleActive.mutate({ id: f.id, active: c })} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="text-red-400" onClick={() => { if (confirm('Delete this FAQ?')) deleteFaq.mutate(f.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!editing} onOpenChange={() => setEditing(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
          <SheetHeader><SheetTitle style={{ color: 'var(--color-text)' }}>{editing?.id ? 'Edit FAQ' : 'New FAQ'}</SheetTitle></SheetHeader>
          {editing && (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label style={{ color: 'var(--color-text-muted)' }}>Question</Label>
                <Input value={editing.question} onChange={(e) => setEditing({ ...editing, question: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: 'var(--color-text-muted)' }}>Answer</Label>
                <Textarea className="min-h-[150px]" value={editing.answer || ''} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: 'var(--color-text-muted)' }}>Category (for grouping)</Label>
                <Input value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: 'var(--color-text-muted)' }}>Sort Order</Label>
                  <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={editing.is_active ?? true} onCheckedChange={(c) => setEditing({ ...editing, is_active: c })} />
                  <Label style={{ color: 'var(--color-text-muted)' }}>Active</Label>
                </div>
              </div>
              <Button className="w-full" onClick={() => saveFaq.mutate(editing)} disabled={!editing.question || !editing.answer || saveFaq.isPending}>
                <Save className="h-4 w-4 mr-1" />{saveFaq.isPending ? 'Saving…' : 'Save FAQ'}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
