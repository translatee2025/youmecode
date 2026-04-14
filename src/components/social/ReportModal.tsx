import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const REASONS = ['Spam', 'Inappropriate', 'Fake', 'Harassment', 'Copyright', 'Other'];

interface Props {
  open: boolean;
  onClose: () => void;
  entityType: string;
  entityId: string;
}

export default function ReportModal({ open, onClose, entityType, entityId }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!tenant || !profile || !reason) return;
    setSubmitting(true);
    await supabase.from('reports').insert({
      reporter_id: profile.id,
      entity_type: entityType,
      entity_id: entityId,
      reason,
      detail: detail.trim() || null,
    });
    toast({ title: 'Report submitted' });
    setSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Report Content</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button key={r} onClick={() => setReason(r)}
                className={cn('px-3 py-1.5 rounded-full text-xs border transition-colors', reason === r ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50')}>
                {r}
              </button>
            ))}
          </div>
          <Textarea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Additional details (optional)" />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!reason || submitting}>{submitting ? 'Submitting...' : 'Submit Report'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
