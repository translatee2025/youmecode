import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { Eye, EyeOff, Ban, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function ModerationQueue() {
  const profile = useAuthStore((s) => s.profile);
  const qc = useQueryClient();
  const [tab, setTab] = useState('pending');
  const [selected, setSelected] = useState<any>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin-reports', tab],
    queryFn: async () => {
      let q = supabase
        .from('reports')
        .select('*, users:reporter_id(username, avatar_url)')
        .order('created_at', { ascending: false });

      if (tab === 'pending') q = q.eq('status', 'pending');
      else if (tab === 'reviewed') q = q.neq('status', 'pending');

      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const handleAction = useMutation({
    mutationFn: async ({ reportId, action }: { reportId: string; action: string }) => {
      const report = reports.find((r: any) => r.id === reportId);
      if (!report) return;

      await supabase.from('reports').update({ status: action, reviewed_by: profile?.id }).eq('id', reportId);

      if (action === 'hide_content') {
        if (report.entity_type === 'post') await supabase.from('posts').update({ is_pinned: false }).eq('id', report.entity_id);
        if (report.entity_type === 'comment') await supabase.from('comments').update({ is_hidden: true }).eq('id', report.entity_id);
      }
      if (action === 'delete_content') {
        if (report.entity_type === 'post') await supabase.from('posts').delete().eq('id', report.entity_id);
        if (report.entity_type === 'comment') await supabase.from('comments').delete().eq('id', report.entity_id);
      }

      await supabase.from('audit_log').insert({
 actor_id: profile?.id, action: `moderation_${action}`,
        entity_type: 'report', entity_id: reportId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      setSelected(null);
      toast.success('Action taken');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const entityBadge = (type: string) => {
    const colors: Record<string, string> = {
      post: 'bg-blue-500/20 text-blue-400',
      comment: 'bg-purple-500/20 text-purple-400',
      venue: 'bg-green-500/20 text-green-400',
      rating: 'bg-amber-500/20 text-amber-400',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-500/20 text-gray-400'}`}>{type}</span>;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold" style={{ color: 'var(--color-text, #f0f0f0)' }}>Moderation</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <div className="glass overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Loading…</TableCell></TableRow>
                ) : reports.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No reports</TableCell></TableRow>
                ) : reports.map((r: any) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelected(r)}>
                    <TableCell>{entityBadge(r.entity_type)}</TableCell>
                    <TableCell style={{ color: 'var(--color-text-muted)' }}>{r.users?.username || '—'}</TableCell>
                    <TableCell style={{ color: 'var(--color-text)' }}>{r.reason}</TableCell>
                    <TableCell style={{ color: 'var(--color-text-muted)' }}>{r.created_at ? format(new Date(r.created_at), 'PP') : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'pending' ? 'destructive' : 'secondary'}>{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-lg" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
          <SheetHeader><SheetTitle style={{ color: 'var(--color-text)' }}>Report Detail</SheetTitle></SheetHeader>
          {selected && (
            <div className="mt-4 space-y-4">
              <div className="glass p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {entityBadge(selected.entity_type)}
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>ID: {selected.entity_id?.slice(0, 8)}…</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <strong>Reporter:</strong> @{selected.users?.username}
                </p>
                <p style={{ color: 'var(--color-text)' }}><strong>Reason:</strong> {selected.reason}</p>
                {selected.detail && <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{selected.detail}</p>}
              </div>

              {selected.status === 'pending' && (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => handleAction.mutate({ reportId: selected.id, action: 'dismissed' })}>
                    <Eye className="h-4 w-4 mr-1" />Dismiss
                  </Button>
                  <Button variant="outline" onClick={() => handleAction.mutate({ reportId: selected.id, action: 'hide_content' })}>
                    <EyeOff className="h-4 w-4 mr-1" />Hide
                  </Button>
                  <Button variant="destructive" onClick={() => handleAction.mutate({ reportId: selected.id, action: 'delete_content' })}>
                    <Trash2 className="h-4 w-4 mr-1" />Delete
                  </Button>
                  <Button variant="outline" className="text-amber-400 border-amber-400/30" onClick={() => handleAction.mutate({ reportId: selected.id, action: 'escalated' })}>
                    <AlertTriangle className="h-4 w-4 mr-1" />Escalate
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
