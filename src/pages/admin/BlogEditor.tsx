import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Save, Eye, X } from 'lucide-react';
import { format } from 'date-fns';

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function BlogEditor() {
  const profile = useAuthStore((s) => s.profile);
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState<any>(null);
  const [tagInput, setTagInput] = useState('');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts', statusFilter],
    queryFn: async () => {
      let q = supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
      if (statusFilter === 'published') q = q.eq('is_published', true);
      if (statusFilter === 'draft') q = q.eq('is_published', false).is('scheduled_at', null);
      if (statusFilter === 'scheduled') q = q.not('scheduled_at', 'is', null).eq('is_published', false);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const savePost = useMutation({
    mutationFn: async ({ publish, schedule }: { publish?: boolean; schedule?: string } = {}) => {
      const payload: any = {
        title: editing.title,
        slug: editing.slug || slugify(editing.title),
        content: editing.content,
        excerpt: editing.excerpt,
        cover_image_url: editing.cover_image_url,
        tags: editing.tags || [],
        seo_title: editing.seo_title,
        seo_description: editing.seo_description,
        author_id: editing.author_id || profile?.id,
      };
      if (publish) {
        payload.is_published = true;
        payload.published_at = new Date().toISOString();
      }
      if (schedule) {
        payload.scheduled_at = schedule;
      }

      if (editing.id) {
        const { error } = await supabase.from('blog_posts').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('blog_posts').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-posts'] });
      setEditing(null);
      toast.success('Post saved');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Post deleted');
    },
  });

  const newPost = () => setEditing({
    title: '', slug: '', content: '', excerpt: '', cover_image_url: '',
    tags: [], seo_title: '', seo_description: '', author_id: profile?.id,
  });

  const statusBadge = (post: any) => {
    if (post.is_published) return <Badge className="bg-green-500/20 text-green-400 border-0">Published</Badge>;
    if (post.scheduled_at) return <Badge className="bg-blue-500/20 text-blue-400 border-0">Scheduled</Badge>;
    return <Badge className="bg-gray-500/20 text-gray-400 border-0">Draft</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Blog</h1>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={newPost}><Plus className="h-4 w-4 mr-1" />New Post</Button>
        </div>
      </div>

      <div className="glass overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Views</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Loading…</TableCell></TableRow>
            ) : posts.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No posts yet</TableCell></TableRow>
            ) : posts.map((p: any) => (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => setEditing(p)}>
                <TableCell style={{ color: 'var(--color-text)' }}>{p.title}</TableCell>
                <TableCell>{statusBadge(p)}</TableCell>
                <TableCell style={{ color: 'var(--color-text-muted)' }}>{p.created_at ? format(new Date(p.created_at), 'PP') : '—'}</TableCell>
                <TableCell style={{ color: 'var(--color-text-muted)' }}>{p.views_count || 0}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="text-red-400" onClick={() => { if (confirm('Delete?')) deletePost.mutate(p.id); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!editing} onOpenChange={() => setEditing(null)}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
          <SheetHeader><SheetTitle style={{ color: 'var(--color-text)' }}>{editing?.id ? 'Edit Post' : 'New Post'}</SheetTitle></SheetHeader>
          {editing && (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Input className="text-xl font-bold border-0 px-0 focus-visible:ring-0" placeholder="Post title..."
                  value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Slug</Label>
                <Input value={editing.slug || ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Content</Label>
                <Textarea className="min-h-[200px] font-mono text-sm" placeholder="Write your post content..."
                  value={editing.content || ''} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Excerpt</Label>
                <Textarea rows={2} value={editing.excerpt || ''} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Cover Image URL</Label>
                <Input value={editing.cover_image_url || ''} onChange={(e) => setEditing({ ...editing, cover_image_url: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Tags</Label>
                <div className="flex flex-wrap gap-1 mb-1">
                  {(editing.tags || []).map((t: string, i: number) => (
                    <Badge key={i} variant="secondary" className="gap-1">{t}<button onClick={() => setEditing({ ...editing, tags: editing.tags.filter((_: any, j: number) => j !== i) })}><X className="h-3 w-3" /></button></Badge>
                  ))}
                </div>
                <Input placeholder="Add tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && tagInput.trim()) { setEditing({ ...editing, tags: [...(editing.tags || []), tagInput.trim()] }); setTagInput(''); } }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>SEO Title</Label>
                  <Input value={editing.seo_title || ''} onChange={(e) => setEditing({ ...editing, seo_title: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>SEO Description</Label>
                  <Input value={editing.seo_description || ''} onChange={(e) => setEditing({ ...editing, seo_description: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => savePost.mutate({ publish: true })} disabled={!editing.title || savePost.isPending}>
                  <Eye className="h-4 w-4 mr-1" />Publish Now
                </Button>
                <Button variant="outline" onClick={() => savePost.mutate({})} disabled={!editing.title || savePost.isPending}>
                  <Save className="h-4 w-4 mr-1" />Save Draft
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
