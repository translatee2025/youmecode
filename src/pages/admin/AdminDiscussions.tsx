import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_TENANT_ID } from '@/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Edit2, MessageSquare, Pin, Lock } from 'lucide-react';

interface Board {
  id: string; name: string; description: string | null; icon: string | null;
  sort_order: number; is_active: boolean;
}

interface Thread {
  id: string; title: string; user_id: string | null; replies_count: number;
  is_pinned: boolean; is_locked: boolean;
}

export default function AdminDiscussions() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteThreadId, setDeleteThreadId] = useState<string | null>(null);

  // Form
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [formSort, setFormSort] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const fetchBoards = async () => {
    const { data } = await supabase.from('discussion_boards').select('*').eq('tenant_id', DEFAULT_TENANT_ID).order('sort_order');
    setBoards((data as Board[]) ?? []);
    setLoading(false);
  };

  const fetchThreads = async (boardId: string) => {
    const { data } = await supabase.from('discussions').select('*').eq('board_id', boardId).order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    setThreads((data as Thread[]) ?? []);
  };

  useEffect(() => { fetchBoards(); }, []);
  useEffect(() => { if (selectedBoardId) fetchThreads(selectedBoardId); }, [selectedBoardId]);

  const openAdd = () => {
    setEditId(null); setFormName(''); setFormDesc(''); setFormIcon(''); setFormSort(boards.length);
    setShowForm(true);
  };

  const openEdit = (b: Board) => {
    setEditId(b.id); setFormName(b.name); setFormDesc(b.description || ''); setFormIcon(b.icon || ''); setFormSort(b.sort_order);
    setShowForm(true);
  };

  const handleSave = async () => {
    const payload = { tenant_id: DEFAULT_TENANT_ID, name: formName, description: formDesc || null, icon: formIcon || null, sort_order: formSort };
    if (editId) {
      await supabase.from('discussion_boards').update(payload).eq('id', editId);
    } else {
      await supabase.from('discussion_boards').insert(payload);
    }
    setShowForm(false); await fetchBoards();
    toast({ title: editId ? 'Board updated' : 'Board created' });
  };

  const handleToggleActive = async (id: string, val: boolean) => {
    await supabase.from('discussion_boards').update({ is_active: val }).eq('id', id);
    await fetchBoards();
  };

  const handleDeleteBoard = async () => {
    if (!deleteId) return;
    await supabase.from('discussion_boards').delete().eq('id', deleteId);
    if (selectedBoardId === deleteId) { setSelectedBoardId(null); setThreads([]); }
    setDeleteId(null); await fetchBoards();
    toast({ title: 'Board deleted' });
  };

  const handleTogglePin = async (id: string, val: boolean) => {
    await supabase.from('discussions').update({ is_pinned: val }).eq('id', id);
    if (selectedBoardId) await fetchThreads(selectedBoardId);
  };

  const handleToggleLock = async (id: string, val: boolean) => {
    await supabase.from('discussions').update({ is_locked: val }).eq('id', id);
    if (selectedBoardId) await fetchThreads(selectedBoardId);
  };

  const handleDeleteThread = async () => {
    if (!deleteThreadId) return;
    await supabase.from('discussions').delete().eq('id', deleteThreadId);
    setDeleteThreadId(null);
    if (selectedBoardId) await fetchThreads(selectedBoardId);
    toast({ title: 'Thread deleted' });
  };

  if (loading) return <div className="animate-pulse h-64 rounded-xl" style={{ background: 'var(--color-card-bg)' }} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Discussion Boards</h1>
        <Button size="sm" onClick={openAdd} style={{ background: 'var(--color-button)', color: 'var(--color-bg)' }}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Board
        </Button>
      </div>

      {/* Inline form */}
      {showForm && (
        <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Name</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Icon (emoji or name)</Label>
                <Input value={formIcon} onChange={e => setFormIcon(e.target.value)} placeholder="💬" className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Description</Label>
              <Input value={formDesc} onChange={e => setFormDesc(e.target.value)} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
            </div>
            <div className="space-y-1 max-w-[120px]">
              <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Sort Order</Label>
              <Input type="number" value={formSort} onChange={e => setFormSort(+e.target.value)} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={!formName.trim()} style={{ background: 'var(--color-button)', color: 'var(--color-bg)' }}>
                {editId ? 'Update' : 'Create'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Boards list */}
      <div className="space-y-2">
        {boards.map(b => (
          <div key={b.id} onClick={() => setSelectedBoardId(b.id)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors"
            style={{ background: selectedBoardId === b.id ? 'rgba(255,255,255,0.08)' : 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
            <span className="text-lg">{b.icon || '💬'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{b.name}</p>
              {b.description && <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{b.description}</p>}
            </div>
            <Switch checked={b.is_active} onCheckedChange={v => { handleToggleActive(b.id, v); }} onClick={e => e.stopPropagation()} />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={e => { e.stopPropagation(); openEdit(b); }}><Edit2 className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={e => { e.stopPropagation(); setDeleteId(b.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
          </div>
        ))}
        {boards.length === 0 && <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No boards yet. Create your first one.</p>}
      </div>

      {/* Threads for selected board */}
      {selectedBoardId && (
        <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <MessageSquare className="h-4 w-4" /> Threads in {boards.find(b => b.id === selectedBoardId)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {threads.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>No threads in this board</p>
            ) : (
              <div className="space-y-1">
                {threads.map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{t.title}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.replies_count ?? 0} replies</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Pin className="h-3 w-3" style={{ color: t.is_pinned ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                        <Switch checked={t.is_pinned} onCheckedChange={v => handleTogglePin(t.id, v)} />
                      </div>
                      <div className="flex items-center gap-1">
                        <Lock className="h-3 w-3" style={{ color: t.is_locked ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                        <Switch checked={t.is_locked} onCheckedChange={v => handleToggleLock(t.id, v)} />
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDeleteThreadId(t.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete board dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Board?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this discussion board and all its threads.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBoard}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete thread dialog */}
      <AlertDialog open={!!deleteThreadId} onOpenChange={() => setDeleteThreadId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thread?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this discussion thread.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteThread}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
