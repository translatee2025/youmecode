import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface Props {
  entityType: string;
  entityId: string;
  initialCount?: number;
  className?: string;
}

export default function LikeButton({ entityType, entityId, initialCount = 0, className }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('likes')
      .select('id')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [profile, entityType, entityId]);

  const toggle = async () => {
    if (!profile) {
      toast({ title: 'Please sign in to like', variant: 'destructive' });
      return;
    }
    // Optimistic
    setLiked(!liked);
    setCount((c) => (liked ? c - 1 : c + 1));

    if (liked) {
      await supabase
        .from('likes')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('user_id', profile.id);
    } else {
      await supabase.from('likes').insert({
        entity_type: entityType,
        entity_id: entityId,
        user_id: profile.id,
      });
    }
  };

  return (
    <button
      onClick={toggle}
      className={cn('flex items-center gap-1.5 text-sm transition-colors', liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400', className)}
    >
      <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
      <span>{count}</span>
    </button>
  );
}
