import { DEFAULT_TENANT_ID } from '@/config';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

import { ArrowLeft, Eye, Lock, MessageSquare, Pin, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export default function DiscussionsPage() {
  const { boardSlug, threadId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  if (threadId && boardSlug) return <ThreadView boardSlug={boardSlug} threadId={threadId} />;
  if (boardSlug) return <BoardView boardSlug={boardSlug} />;
  return <BoardList />;
}

function BoardList() {
  const [boards, setBoards] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('discussion_boards')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setBoards(data || []));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Discussion Boards</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          {boards.map((b) => (
            <Link key={b.id} to={`/discussions/${b.id}`}>
              <Card className="hover:bg-secondary/10 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {b.icon && <span>{b.icon}</span>}
                    {b.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{b.description || 'Join the discussion'}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
          {boards.length === 0 && <p className="text-muted-foreground col-span-2 text-center">No discussion boards yet</p>}
        </div>
      </div>
    </div>
  );
}

function BoardView({ boardSlug }: { boardSlug: string }) {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [board, setBoard] = useState<any>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'latest' | 'replies' | 'views'>('latest');
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    supabase.from('discussion_boards').select('*').eq('id', boardSlug).maybeSingle()
      .then(({ data }) => setBoard(data));

    const orderCol = sort === 'replies' ? 'replies_count' : sort === 'views' ? 'views_count' : 'created_at';
    supabase
      .from('discussions')
      .select('*, user:users!discussions_user_id_fkey(username, display_name, avatar_url)')
      .eq('board_id', boardSlug)
      .order('is_pinned', { ascending: false })
      .order(orderCol, { ascending: false })
      .then(({ data }) => setThreads(data || []));
  }, [boardSlug, sort]);

  const createThread = async () => {
    if (!title.trim() || !profile) return;
    const { data, error } = await supabase.from('discussions').insert({ tenant_id: DEFAULT_TENANT_ID,
      board_id: boardSlug,
      user_id: profile.id,
      title: title.trim(),
      content: content.trim() || null,
    }).select().single();
    if (data) {
      navigate(`/discussions/${boardSlug}/${data.id}`);
    }
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    setShowNew(false);
  };

  const filtered = threads.filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/discussions')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> All Boards
        </Button>
        {board && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">{board.name}</h1>
            {board.description && <p className="text-muted-foreground mt-1">{board.description}</p>}
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <Input placeholder="Search threads..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
          <select value={sort} onChange={(e) => setSort(e.target.value as any)}
            className="rounded-md border bg-background px-3 py-2 text-sm text-foreground">
            <option value="latest">Latest</option>
            <option value="replies">Most Replies</option>
            <option value="views">Most Views</option>
          </select>
          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> New Thread</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Thread</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Thread title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Textarea placeholder="Write your post (markdown supported)..." value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
                <Button onClick={createThread} disabled={!title.trim()} className="w-full">Create Thread</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {filtered.map((t) => (
            <Link key={t.id} to={`/discussions/${boardSlug}/${t.id}`}>
              <Card className="hover:bg-secondary/10 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-4 py-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={t.user?.avatar_url} />
                    <AvatarFallback>{(t.user?.display_name || t.user?.username || '?')[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {t.is_pinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0" />}
                      {t.is_locked && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                      <span className="text-sm font-medium text-foreground truncate">{t.title}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">{t.user?.display_name || t.user?.username}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="h-3 w-3" />{t.replies_count || 0}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" />{t.views_count || 0}</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {t.created_at && formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ThreadView({ boardSlug, threadId }: { boardSlug: string; threadId: string }) {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [thread, setThread] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    supabase
      .from('discussions')
      .select('*, user:users!discussions_user_id_fkey(username, display_name, avatar_url)')
      .eq('id', threadId)
      .maybeSingle()
      .then(({ data }) => setThread(data));

    supabase
      .from('discussion_replies')
      .select('*, user:users!discussion_replies_user_id_fkey(username, display_name, avatar_url)')
      .eq('discussion_id', threadId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setReplies(data || []));

    // Increment views (best-effort)
    (supabase.rpc as any)('increment_discussion_views', { discussion_id: threadId })?.then?.(() => {});
  }, [threadId]);

  const submitReply = async () => {
    if (!replyContent.trim() || !profile) return;
    const { data, error } = await supabase.from('discussion_replies').insert({ tenant_id: DEFAULT_TENANT_ID,
      discussion_id: threadId,
      user_id: profile.id,
      content: replyContent.trim(),
    }).select('*, user:users!discussion_replies_user_id_fkey(username, display_name, avatar_url)').single();
    if (data) {
      setReplies((prev) => [...prev, data]);
      setReplyContent('');
    }
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
  };

  if (!thread) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}><p className="text-muted-foreground">Loading...</p></div>;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/discussions/${boardSlug}`)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        {/* Original post */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={thread.user?.avatar_url} />
                <AvatarFallback>{(thread.user?.display_name || '?')[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{thread.user?.display_name || thread.user?.username}</p>
                <p className="text-xs text-muted-foreground">{thread.created_at && formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</p>
              </div>
              {thread.is_pinned && <Badge variant="secondary"><Pin className="h-3 w-3 mr-1" />Pinned</Badge>}
              {thread.is_locked && <Badge variant="outline"><Lock className="h-3 w-3 mr-1" />Locked</Badge>}
            </div>
            <h1 className="text-xl font-bold text-foreground mb-3">{thread.title}</h1>
            <div className="prose prose-sm text-foreground max-w-none whitespace-pre-wrap">{thread.content}</div>
          </CardContent>
        </Card>

        {/* Replies */}
        <h2 className="text-sm font-semibold text-foreground mb-3">{replies.length} Replies</h2>
        <div className="space-y-3 mb-6">
          {replies.map((r) => (
            <Card key={r.id}>
              <CardContent className="py-3">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={r.user?.avatar_url} />
                    <AvatarFallback>{(r.user?.display_name || '?')[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{r.user?.display_name || r.user?.username}</span>
                  <span className="text-xs text-muted-foreground">{r.created_at && formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                </div>
                <div className="text-sm text-foreground whitespace-pre-wrap pl-10">{r.content}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reply composer */}
        {thread.is_locked ? (
          <Card><CardContent className="py-4 text-center text-sm text-muted-foreground">🔒 This thread is locked</CardContent></Card>
        ) : profile ? (
          <Card>
            <CardContent className="py-4 space-y-3">
              <Textarea placeholder="Write a reply..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)} rows={3} />
              <Button onClick={submitReply} disabled={!replyContent.trim()} size="sm">Post Reply</Button>
            </CardContent>
          </Card>
        ) : (
          <Card><CardContent className="py-4 text-center text-sm text-muted-foreground">Sign in to reply</CardContent></Card>
        )}
      </div>
    </div>
  );
}
