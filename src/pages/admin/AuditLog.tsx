import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Search } from 'lucide-react';
import { format } from 'date-fns';

const ACTIONS = [
  'claim_approve', 'claim_reject', 'moderation_dismissed', 'moderation_hide_content',
  'moderation_delete_content', 'moderation_escalated', 'user_banned', 'user_role_changed',
  'venue_created', 'venue_deleted', 'venue_updated',
];

export default function AuditLog() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-log', actionFilter],
    queryFn: async () => {
      let q = supabase
        .from('audit_log')
        .select('*, users:actor_id(username, display_name)')
        .order('created_at', { ascending: false })
        .limit(500);

      if (actionFilter !== 'all') q = q.eq('action', actionFilter);

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = search
    ? logs.filter((l: any) => {
        const actor = l.users?.username || l.users?.display_name || '';
        return actor.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase());
      })
    : logs;

  const exportCSV = () => {
    const headers = 'timestamp,actor,action,entity_type,entity_id\n';
    const csv = headers + filtered.map((l: any) =>
      `${l.created_at},${l.users?.username || ''},${l.action},${l.entity_type || ''},${l.entity_id || ''}`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'audit-log.csv';
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Audit Log</h1>
        <Button size="sm" variant="outline" onClick={exportCSV}><Download className="h-3 w-3 mr-1" />Export CSV</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
          <Input placeholder="Search actor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="glass overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity Type</TableHead>
              <TableHead>Entity ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No audit entries</TableCell></TableRow>
            ) : filtered.map((l: any) => (
              <TableRow key={l.id}>
                <TableCell className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{l.created_at ? format(new Date(l.created_at), 'PPp') : '—'}</TableCell>
                <TableCell style={{ color: 'var(--color-text)' }}>{l.users?.username || l.users?.display_name || '—'}</TableCell>
                <TableCell><span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-text)' }}>{l.action}</span></TableCell>
                <TableCell style={{ color: 'var(--color-text-muted)' }}>{l.entity_type || '—'}</TableCell>
                <TableCell className="font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>{l.entity_id?.slice(0, 8) || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
