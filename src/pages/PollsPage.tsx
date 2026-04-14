import { DEFAULT_TENANT_ID } from '@/config';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export default function PollsPage() {
  const { profile } = useAuthStore();
  const [polls, setPolls] = useState<any[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase.from('polls').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setPolls(data || []));

    if (profile) {
      supabase.from('poll_votes').select('poll_id, option_index').eq('user_id', profile.id)
        .then(({ data }) => {
          const map: Record<string, number> = {};
          (data || []).forEach((v) => { map[v.poll_id] = v.option_index; });
          setVotes(map);
        });
    }
  }, [profile]);

  const vote = async (pollId: string, optionIndex: number) => {
    if (!profile || votes[pollId] !== undefined) return;
    await supabase.from('poll_votes').insert({ tenant_id: DEFAULT_TENANT_ID,
 poll_id: pollId, user_id: profile.id, option_index: optionIndex });
    setVotes((prev) => ({ ...prev, [pollId]: optionIndex }));
    toast({ title: 'Vote recorded!' });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2"><BarChart3 className="h-6 w-6" /> Polls</h1>
        <div className="space-y-4">
          {polls.map((poll) => {
            const options = (Array.isArray(poll.options) ? poll.options : []) as string[];
            const hasVoted = votes[poll.id] !== undefined;
            const total = poll.total_votes || 1;
            return (
              <Card key={poll.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{poll.question}</CardTitle>
                  <p className="text-xs text-muted-foreground">{poll.total_votes || 0} votes · {poll.created_at && formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i}>
                      {hasVoted ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm"><span className="text-foreground">{opt}</span></div>
                          <Progress value={votes[poll.id] === i ? 60 : 40} className="h-2" />
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => vote(poll.id, i)}>{opt}</Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
          {polls.length === 0 && <p className="text-center text-muted-foreground">No polls yet</p>}
        </div>
      </div>
    </div>
  );
}
