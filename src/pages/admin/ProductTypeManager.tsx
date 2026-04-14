import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Package } from 'lucide-react';

interface Category { id: string; name: string; icon: string | null; }
interface ProductType {
  id: string; tenant_id: string; category_id: string; name: string; slug: string;
  description: string | null; icon: string | null; sort_order: number | null; is_active: boolean | null;
}

function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

export default function ProductTypeManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [types, setTypes] = useState<ProductType[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<ProductType | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', icon: '' });
  const [saving, setSaving] = useState(false);

  const loadCats = useCallback(async () => {
    const { data } = await supabase.from('categories').select('id, name, icon').order('sort_order');
    if (data) { setCategories(data); if (data.length > 0 && !selectedCatId) setSelectedCatId(data[0].id); }
  }, [selectedCatId]);

  const loadTypes = useCallback(async () => {
    if (!selectedCatId) return;
    const { data } = await supabase.from('product_types').select('*').eq('category_id', selectedCatId).order('sort_order');
    if (data) setTypes(data);
  }, [selectedCatId]);

  useEffect(() => { loadCats(); }, [loadCats]);
  useEffect(() => { loadTypes(); }, [loadTypes]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '', icon: '' });
    setShowEditor(true);
  };

  const openEdit = (t: ProductType) => {
    setEditing(t);
    setForm({ name: t.name, slug: t.slug, description: t.description || '', icon: t.icon || '' });
    setShowEditor(true);
  };

  const save = async () => {
    if (!selectedCatId) return;
    setSaving(true);
    const payload = {
 category_id: selectedCatId,
      name: form.name, slug: form.slug || slugify(form.name),
      description: form.description || null, icon: form.icon || null,
      sort_order: editing ? editing.sort_order : types.length,
    };
    let error;
    if (editing) { ({ error } = await supabase.from('product_types').update(payload).eq('id', editing.id)); }
    else { ({ error } = await supabase.from('product_types').insert(payload)); }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setShowEditor(false);
    await loadTypes();
    toast.success(editing ? 'Product type updated' : 'Product type created');
  };

  const deleteType = async (id: string) => {
    if (!confirm('Delete this product type?')) return;
    const { error } = await supabase.from('product_types').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setTypes((p) => p.filter((t) => t.id !== id));
    toast.success('Product type deleted');
  };

  const toggleActive = async (t: ProductType) => {
    const { error } = await supabase.from('product_types').update({ is_active: !t.is_active }).eq('id', t.id);
    if (error) { toast.error(error.message); return; }
    setTypes((p) => p.map((tt) => tt.id === t.id ? { ...tt, is_active: !tt.is_active } : tt));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Product Types</h1>
          <Select value={selectedCatId} onValueChange={setSelectedCatId}>
            <SelectTrigger className="w-56" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.icon || '📁'} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1"
          style={{ background: 'var(--color-button)', color: 'var(--color-bg)' }}>
          <Plus className="h-3 w-3" /> Add Product Type
        </Button>
      </div>

      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Product types define what can be listed under a venue in a given category. Filter fields from the parent category also apply to these products.
      </p>

      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
        {types.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center space-y-2">
              <Package className="h-8 w-8 mx-auto" style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No product types yet.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-3 px-4 py-2 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              <span className="flex-1">Name</span>
              <span className="w-32">Slug</span>
              <span className="w-16 text-center">Active</span>
              <span className="w-20" />
            </div>
            {types.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/[0.02]">
                <span className="flex-1 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  <span>{t.icon || '📦'}</span> {t.name}
                </span>
                <span className="w-32 text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{t.slug}</span>
                <span className="w-16 flex justify-center">
                  <Switch checked={t.is_active ?? true} onCheckedChange={() => toggleActive(t)} />
                </span>
                <span className="w-20 flex gap-1 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(t)}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteType(t.id)}><Trash2 className="h-3 w-3 text-red-400" /></Button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-md"
          style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Product Type' : 'Add Product Type'}</DialogTitle>
            <DialogDescription style={{ color: 'var(--color-text-muted)' }}>
              Category: {categories.find((c) => c.id === selectedCatId)?.name || '—'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Name</Label>
                <Input value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })}
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Slug</Label>
                <Input value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Icon (emoji)</Label>
              <Input value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="📦"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Description</Label>
              <Textarea value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={save} disabled={saving || !form.name}
                style={{ background: 'var(--color-button)', color: 'var(--color-bg)' }}>
                {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" onClick={() => setShowEditor(false)}
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
