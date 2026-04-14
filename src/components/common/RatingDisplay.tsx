import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  entityType: string;
  entityId: string;
  showForm?: boolean;
  compact?: boolean;
}

export default function RatingDisplay({ entityType, entityId, showForm = false, compact = false }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const [ratings, setRatings] = useState<any[]>([]);
  const [avg, setAvg] = useState(0);
  const [distribution, setDistribution] = useState<number[]>([0, 0, 0, 0, 0]);
  const [score, setScore] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('ratings')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    const all = data ?? [];
    setRatings(all);
    if (all.length > 0) {
      setAvg(all.reduce((s: number, r: any) => s + r.score, 0) / all.length);
      const dist = [0, 0, 0, 0, 0];
      all.forEach((r: any) => { if (r.score >= 1 && r.score <= 5) dist[r.score - 1]++; });
      setDistribution(dist);
    }
  };

  useEffect(() => { load(); }, [tenant, entityType, entityId]);

  const submitReview = async () => {
    if (!profile || !tenant || score === 0) {
      toast({ title: 'Please select a rating', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    await supabase.from('ratings').insert({
      entity_type: entityType,
      entity_id: entityId,
      user_id: profile.id,
      score,
      review_text: reviewText.trim() || null,
    });
    setScore(0);
    setReviewText('');
    setShowReviewForm(false);
    await load();
    setSubmitting(false);
    toast({ title: 'Review submitted!' });
  };

  const renderStars = (rating: number, size = 'h-4 w-4') => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn(size, s <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
      ))}
    </div>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {renderStars(Math.round(avg), 'h-3.5 w-3.5')}
        <span className="text-sm font-medium text-foreground">{avg.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">({ratings.length})</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-start gap-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-foreground">{avg.toFixed(1)}</div>
          {renderStars(Math.round(avg))}
          <p className="text-xs text-muted-foreground mt-1">{ratings.length} reviews</p>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((s) => (
            <div key={s} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-muted-foreground">{s}</span>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <Progress value={ratings.length > 0 ? (distribution[s - 1] / ratings.length) * 100 : 0} className="h-2 flex-1" />
              <span className="w-6 text-right text-muted-foreground">{distribution[s - 1]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review */}
      {showForm && profile && !showReviewForm && (
        <Button variant="outline" size="sm" onClick={() => setShowReviewForm(true)}>Write a Review</Button>
      )}
      {showReviewForm && (
        <div className="glass p-4 space-y-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setScore(s)}>
                <Star className={cn('h-6 w-6 transition-colors', s <= score ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30 hover:text-amber-300')} />
              </button>
            ))}
          </div>
          <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Share your experience..." className="min-h-[80px]" />
          <div className="flex gap-2">
            <Button size="sm" onClick={submitReview} disabled={submitting || score === 0}>Submit Review</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowReviewForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-4">
        {ratings.map((r) => (
          <div key={r.id} className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs bg-secondary">?</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {renderStars(r.score, 'h-3.5 w-3.5')}
                <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
              </div>
              {r.review_text && <p className="text-sm text-foreground/90 mt-1">{r.review_text}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
