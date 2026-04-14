import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CheckCircle, XCircle, FileText, Mail } from 'lucide-react';
import { format } from 'date-fns';

export default function ClaimsManager() {
  const profile = useAuthStore((s) => s.profile);
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<any>(null);
  const [message, setMessage] = useState('');

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['', 'admin-claims', statusFilter],
    enabled: !!'',
    queryFn: async () => {
      let q = supabase
        .from('claim_requests')
        .select('*, venues(name, city, category_id, website, email, status), users(username, display_name, avatar_url, created_at)')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const processClaim = useMutation({
    mutationFn: async ({ claimId, venueId, userId, action }: { claimId: string; venueId: string; userId: string; action: 'approve' | 'reject' }) => {
      if (action === 'approve') {
        await supabase.from('venues').update({ status: 'claimed_directory', owner_id: userId }).eq('id', venueId);
        await supabase.from('claim_requests').update({ status: 'approved', reviewed_by: profile?.id, reviewed_at: new Date().toISOString() }).eq('id', claimId);
        await supabase.from('notifications').insert({
 user_id: userId, type: 'claim_approved', message: 'Your venue claim has been approved!' });
      } else {
        await supabase.from('venues').update({ status: 'unclaimed' }).eq('id', venueId);
        await supabase.from('claim_requests').update({ status: 'rejected', reviewed_by: profile?.id, reviewed_at: new Date().toISOString() }).eq('id', claimId);
        await supabase.from('notifications').insert({
 user_id: userId, type: 'claim_rejected', message: message || 'Your venue claim has been rejected.' });
      }
      await supabase.from('audit_log').insert({
 actor_id: profile?.id, action: `claim_${action}`, entity_type: 'claim_request', entity_id: claimId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['', 'admin-claims'] });
      setSelected(null);
      setMessage('');
      toast.success('Claim processed');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-amber-500/20 text-amber-400 border-0">Pending</Badge>;
      case 'approved': return <Badge className="bg-green-500/20 text-green-400 border-0">Approved</Badge>;
      case 'rejected': return <Badge className="bg-red-500/20 text-red-400 border-0">Rejected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const checkDomainMatch = (claim: any) => {
    if (claim.method !== 'email_domain' || !claim.email_used) return null;
    const emailDomain = claim.email_used.split('@')[1]?.toLowerCase();
    const venueSite = claim.venues?.website;
    const venueEmail = claim.venues?.email;
    let match = false;
    if (venueSite) {
      try { match = new URL(venueSite.startsWith('http') ? venueSite : `https://${venueSite}`).hostname.replace('www.', '') === emailDomain; } catch {}
    }
    if (!match && venueEmail) match = venueEmail.split('@')[1]?.toLowerCase() === emailDomain;
    return match;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text, #f0f0f0)' }}>Claims</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Venue</TableHead>
              <TableHead>Claimant</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Loading…</TableCell></TableRow>
            ) : claims.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No claims</TableCell></TableRow>
            ) : claims.map((c: any) => (
              <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
                <TableCell style={{ color: 'var(--color-text)' }}>{c.venues?.name || '—'}</TableCell>
                <TableCell style={{ color: 'var(--color-text-muted)' }}>{c.users?.username || '—'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1">
                    {c.method === 'email_domain' ? <><Mail className="h-3 w-3" />Email</> : <><FileText className="h-3 w-3" />Document</>}
                  </Badge>
                </TableCell>
                <TableCell style={{ color: 'var(--color-text-muted)' }}>{c.created_at ? format(new Date(c.created_at), 'PP') : '—'}</TableCell>
                <TableCell>{statusBadge(c.status || 'pending')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selected} onOpenChange={() => { setSelected(null); setMessage(''); }}>
        <SheetContent className="sm:max-w-lg" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
          <SheetHeader><SheetTitle style={{ color: 'var(--color-text)' }}>Claim Review</SheetTitle></SheetHeader>
          {selected && (
            <div className="mt-4 space-y-5">
              <div className="glass p-4 space-y-2">
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Venue</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{selected.venues?.name} — {selected.venues?.city || 'No city'}</p>
              </div>
              <div className="glass p-4 space-y-2">
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Claimant</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>@{selected.users?.username} — joined {selected.users?.created_at ? format(new Date(selected.users.created_at), 'PP') : '—'}</p>
              </div>

              {selected.method === 'email_domain' && (
                <div className="glass p-4 space-y-2">
                  <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Email Verification</h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Email: {selected.email_used}</p>
                  {(() => {
                    const match = checkDomainMatch(selected);
                    if (match === null) return null;
                    return match
                      ? <p className="text-sm text-green-400 flex items-center gap-1"><CheckCircle className="h-4 w-4" />Domain matches venue</p>
                      : <p className="text-sm text-red-400 flex items-center gap-1"><XCircle className="h-4 w-4" />Domain does not match — review carefully</p>;
                  })()}
                </div>
              )}

              {selected.method === 'document' && selected.document_url && (
                <div className="glass p-4 space-y-2">
                  <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Document</h3>
                  {/\.(jpg|jpeg|png|webp)$/i.test(selected.document_url) ? (
                    <img src={selected.document_url} alt="Claim document" className="max-w-full rounded-lg" />
                  ) : (
                    <Button variant="outline" asChild><a href={selected.document_url} target="_blank" rel="noopener noreferrer">Open Document</a></Button>
                  )}
                </div>
              )}

              {selected.status === 'pending' && (
                <>
                  <Textarea
                    placeholder="Optional message to claimant..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => processClaim.mutate({ claimId: selected.id, venueId: selected.venue_id, userId: selected.user_id, action: 'approve' })}>
                      <CheckCircle className="h-4 w-4 mr-1" />Approve
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => processClaim.mutate({ claimId: selected.id, venueId: selected.venue_id, userId: selected.user_id, action: 'reject' })}>
                      <XCircle className="h-4 w-4 mr-1" />Reject
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
