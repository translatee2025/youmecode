import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Bookmark, Plus, Trash2 } from 'lucide-react';

export default function CollectionsPage() {
  const profile = useAuthStore((s) => s.profile);
  const [collections, setCollections] = useState<{ name: string; count: number }[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  const loadCollections = async () => {
    if (!tenant || !profile) return;
    const { data } = await supabase.from('saves').select('collection_name').eq('user_id', profile.id);
    const counts: Record<string, number> = {};
    (data ?? []).forEach((s) => { const n = s.collection_name ?? 'Saved'; counts[n] = (counts[n] ?? 0) + 1; });
    setCollections(Object.entries(counts).map(([name, count]) => ({ name, count })));
  };

  useEffect(() => { loadCollections(); }, [tenant, profile]);

  useEffect(() => {
    if (!tenant || !profile || !selectedCollection) return;
    supabase.from('saves').select('*').eq('user_id', profile.id).eq('collection_name', selectedCollection).order('created_at', { ascending: false })
      .then(({ data }) => setItems(data ?? []));
  }, [tenant, profile, selectedCollection]);

  const handleRemove = async (id: string) => {
    await supabase.from('saves').delete().eq('id', id);
    setItems(items.filter((i) => i.id !== id));
    loadCollections();
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    toast({ title: `Collection "${newName}" created` });
    setShowNew(false);
    setNewName('');
  };

  if (selectedCollection) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <button onClick={() => setSelectedCollection(null)} className="text-sm text-primary hover:underline">← Collections</button>
              <h1 className="text-2xl font-bold text-foreground">{selectedCollection}</h1>
            </div>
          </div>
          <div className="space-y-2">
            {items.map((item) => (
              <Card key={item.id} className="glass">
                <CardContent className="pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.entity_type}: {item.entity_id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => handleRemove(item.id)}><Trash2 className="h-4 w-4" /></Button>
                </CardContent>
              </Card>
            ))}
            {items.length === 0 && <p className="text-center text-muted-foreground py-8">Empty collection</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Bookmark className="h-6 w-6" /> Collections</h1>
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {collections.map((c) => (
            <button key={c.name} onClick={() => setSelectedCollection(c.name)}>
              <Card className="glass hover:border-primary/50 transition-colors">
                <CardContent className="pt-4 text-center">
                  <Bookmark className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-sm font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.count} items</p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Collection</DialogTitle></DialogHeader>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Collection name" />
            <Button onClick={handleCreate}>Create</Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
