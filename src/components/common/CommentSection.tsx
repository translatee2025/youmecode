import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CornerDownRight, Flag, Send, Trash2 } from 'lucide-react';
import LikeButton from './LikeButton';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  likes_count: number;
  user?: { username: string; display_name: string; avatar_url: string } | null;
  replies?: Comment[];
}

interface Props {
  entityType: string;
  entityId: string;
}

export default function CommentSection({ entityType, entityId }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });

    const all = (data ?? []) as Comment[];
    const topLevel = all.filter((c) => !c.parent_id);
    const replies = all.filter((c) => c.parent_id);
    topLevel.forEach((c) => {
      c.replies = replies.filter((r) => r.parent_id === c.id);
    });
    setComments(topLevel);
  };

  useEffect(() => { load(); }, [entityType, entityId]);

  const submit = async (parentId: string | null, content: string) => {
    if (!profile) {
      toast({ title: 'Please sign in to comment', variant: 'destructive' });
      return;
    }
    if (!content.trim()) return;
    setLoading(true);
    await supabase.from('comments').insert({
      entity_type: entityType,
      entity_id: entityId,
      user_id: profile.id,
      content: content.trim(),
      parent_id: parentId,
    });
    setText('');
    setReplyText('');
    setReplyTo(null);
    await load();
    setLoading(false);
  };

  const deleteComment = async (id: string) => {
    await supabase.from('comments').update({ is_hidden: true }).eq('id', id);
    await load();
  };

  const renderComment = (c: Comment, isReply = false) => (
    <div key={c.id} className={`flex gap-3 ${isReply ? 'ml-10 mt-3' : 'mt-4'}`}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={(c as any).avatar_url} />
        <AvatarFallback className="text-xs bg-secondary">{(c as any).username?.charAt(0)?.toUpperCase() ?? '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-foreground">{(c as any).display_name ?? (c as any).username ?? 'User'}</span>
          <span className="text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
        </div>
        <p className="text-sm text-foreground/90 mt-0.5">{c.content}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <LikeButton entityType="comment" entityId={c.id} initialCount={c.likes_count} className="text-xs" />
          {!isReply && (
            <button
              onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <CornerDownRight className="h-3 w-3" /> Reply
            </button>
          )}
          {profile && (profile.id === c.user_id || profile.role === 'creator' || profile.role === 'moderator') && (
            <button onClick={() => deleteComment(c.id)} className="text-xs text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
          <button className="text-xs text-muted-foreground hover:text-foreground">
            <Flag className="h-3 w-3" />
          </button>
        </div>
        {replyTo === c.id && (
          <div className="mt-2 flex gap-2">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="text-sm min-h-[60px]"
            />
            <Button size="sm" onClick={() => submit(c.id, replyText)} disabled={loading}>
              <Send className="h-3 w-3" />
            </Button>
          </div>
        )}
        {c.replies?.map((r) => renderComment(r, true))}
      </div>
    </div>
  );

  return (
    <div>
      {/* Composer */}
      {profile && (
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs bg-secondary">{profile.username?.charAt(0)?.toUpperCase() ?? '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              className="text-sm min-h-[60px]"
            />
            <Button size="sm" onClick={() => submit(null, text)} disabled={loading || !text.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {comments.map((c) => renderComment(c))}
      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first!</p>
      )}
    </div>
  );
}
