import { DEFAULT_TENANT_ID } from '@/config';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus, Trash2, Pencil, Filter, GripVertical, X, Languages,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface FilterField {
  id: string;
  tenant_id: string;
  category_id: string;
  subcategory_id: string | null;
  label: string;
  field_key: string;
  field_type: string;
  options: any;
  applies_to: string | null;
  is_required: boolean | null;
  show_in_quick_filters: boolean | null;
  show_in_card: boolean | null;
  placeholder: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'number_range', label: 'Number Range', icon: '↔️' },
  { value: 'select', label: 'Select', icon: '📋' },
  { value: 'multiselect', label: 'Multi-Select', icon: '☑️' },
  { value: 'boolean', label: 'Yes/No', icon: '✅' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'date_range', label: 'Date Range', icon: '📆' },
  { value: 'color', label: 'Color', icon: '🎨' },
  { value: 'url', label: 'URL', icon: '🔗' },
];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
}

export default function FilterManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [fields, setFields] = useState<FilterField[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<FilterField | null>(null);
  const [form, setForm] = useState({
    label: '', field_key: '', field_type: 'text', options: '' as string,
    applies_to: 'both', is_required: false, show_in_quick_filters: false,
    show_in_card: false, placeholder: '', subcategory_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);

  const loadCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('id, name, icon').order('sort_order');
    if (data) {
      setCategories(data);
      if (data.length > 0 && !selectedCatId) setSelectedCatId(data[0].id);
    }
  }, [selectedCatId]);

  const loadFields = useCallback(async () => {
    if (!selectedCatId) return;
    const { data } = await supabase.from('filter_fields')
      .select('*')
      .eq('category_id', selectedCatId)
      .order('sort_order');
    if (data) setFields(data);
  }, [selectedCatId]);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { loadFields(); }, [loadFields]);

  const openAdd = () => {
    setEditing(null);
    setForm({ label: '', field_key: '', field_type: 'text', options: '', applies_to: 'both',
      is_required: false, show_in_quick_filters: false, show_in_card: false, placeholder: '', subcategory_id: '' });
    setShowEditor(true);
  };

  const openEdit = (f: FilterField) => {
    setEditing(f);
    const opts = Array.isArray(f.options) ? f.options.join(', ') : '';
    setForm({
      label: f.label, field_key: f.field_key, field_type: f.field_type,
      options: opts, applies_to: f.applies_to || 'both',
      is_required: f.is_required ?? false, show_in_quick_filters: f.show_in_quick_filters ?? false,
      show_in_card: f.show_in_card ?? false, placeholder: f.placeholder || '',
      subcategory_id: f.subcategory_id || '',
    });
    setShowEditor(true);
  };

  const saveField = async () => {
    if (!selectedCatId) return;
    setSaving(true);
    const options = ['select', 'multiselect'].includes(form.field_type)
      ? form.options.split(',').map((o) => o.trim()).filter(Boolean)
      : [];
    const payload = {
      category_id: selectedCatId,
      label: form.label,
      field_key: form.field_key || slugify(form.label),
      field_type: form.field_type,
      options,
      applies_to: form.applies_to,
      is_required: form.is_required,
      show_in_quick_filters: form.show_in_quick_filters,
      show_in_card: form.show_in_card,
      placeholder: form.placeholder || null,
      subcategory_id: form.subcategory_id || null,
      sort_order: editing ? editing.sort_order : fields.length,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from('filter_fields').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('filter_fields').insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setShowEditor(false);
    await loadFields();
    toast.success(editing ? 'Filter field updated' : 'Filter field created');
  };

  const deleteField = async (id: string) => {
    if (!confirm('Delete this filter field?')) return;
    const { error } = await supabase.from('filter_fields').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setFields((prev) => prev.filter((f) => f.id !== id));
    toast.success('Filter field deleted');
  };

  const toggleField = async (f: FilterField, key: 'is_active' | 'show_in_quick_filters' | 'show_in_card' | 'is_required') => {
    const { error } = await supabase.from('filter_fields').update({ [key]: !(f[key] ?? false) }).eq('id', f.id);
    if (error) { toast.error(error.message); return; }
    setFields((prev) => prev.map((ff) => ff.id === f.id ? { ...ff, [key]: !(ff[key] ?? false) } : ff));
  };

  const typeBadge = (t: string) => {
    const ft = FIELD_TYPES.find((f) => f.value === t);
    return (
      <Badge variant="outline" className="text-[10px] gap-1">
        <span>{ft?.icon || '?'}</span> {ft?.label || t}
      </Badge>
    );
  };

  const quickFields = fields.filter((f) => f.show_in_quick_filters && f.is_active !== false);
  const moreFields = fields.filter((f) => !f.show_in_quick_filters && f.is_active !== false);

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Filter Management</h1>
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
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={translating || fields.length === 0}
            onClick={() => { setTranslating(true); setTimeout(() => { setTranslating(false); toast.info('AI translation requires an AI provider to be configured in Site Settings → AI & Translation'); }, 1000); }}
            className="gap-1" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
            <Languages className="h-3 w-3" /> {translating ? 'Translating…' : 'Translate All'}
          </Button>
          <Button size="sm" onClick={openAdd} className="gap-1"
            style={{ background: 'var(--color-button)', color: 'var(--color-bg)' }}>
            <Plus className="h-3 w-3" /> Add Filter Field
          </Button>
        </div>
      </div>

      {!selectedCatId ? (
        <div className="flex items-center justify-center h-64 rounded-2xl"
          style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Select a category to manage its filter fields.
          </p>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Filter fields table */}
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
              {fields.length === 0 ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center space-y-2">
                    <Filter className="h-8 w-8 mx-auto" style={{ color: 'var(--color-text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      No filter fields yet. Add one or import from a category package.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                  {/* Header */}
                  <div className="flex items-center gap-3 px-4 py-2 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    <span className="w-6" />
                    <span className="flex-1">Label</span>
                    <span className="w-24">Key</span>
                    <span className="w-28">Type</span>
                    <span className="w-16 text-center">Quick</span>
                    <span className="w-16 text-center">Card</span>
                    <span className="w-16 text-center">Req</span>
                    <span className="w-16 text-center">Active</span>
                    <span className="w-16" />
                  </div>
                  {fields.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/[0.02] transition-colors">
                      <GripVertical className="h-3 w-3 shrink-0 cursor-grab" style={{ color: 'var(--color-text-muted)' }} />
                      <span className="flex-1 truncate" style={{ color: 'var(--color-text)' }}>{f.label}</span>
                      <span className="w-24 truncate text-xs" style={{ color: 'var(--color-text-muted)' }}>{f.field_key}</span>
                      <span className="w-28">{typeBadge(f.field_type)}</span>
                      <span className="w-16 flex justify-center">
                        <Switch checked={f.show_in_quick_filters ?? false} onCheckedChange={() => toggleField(f, 'show_in_quick_filters')} />
                      </span>
                      <span className="w-16 flex justify-center">
                        <Switch checked={f.show_in_card ?? false} onCheckedChange={() => toggleField(f, 'show_in_card')} />
                      </span>
                      <span className="w-16 flex justify-center">
                        <Switch checked={f.is_required ?? false} onCheckedChange={() => toggleField(f, 'is_required')} />
                      </span>
                      <span className="w-16 flex justify-center">
                        <Switch checked={f.is_active ?? true} onCheckedChange={() => toggleField(f, 'is_active')} />
                      </span>
                      <span className="w-16 flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(f)}><Pencil className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteField(f.id)}><Trash2 className="h-3 w-3 text-red-400" /></Button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live Preview */}
          <div className="w-72 shrink-0">
            <div className="rounded-2xl p-4 space-y-4 sticky top-0"
              style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                Filter Preview
              </h3>
              {quickFields.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Quick Filters</p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickFields.map((f) => (
                      <button
                        key={f.id}
                        className="px-2.5 py-1 rounded-full text-xs transition-colors"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                      >
                        {f.label} ▾
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {moreFields.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>More Filters</p>
                  {moreFields.map((f) => (
                    <div key={f.id} className="flex items-center justify-between text-xs py-1">
                      <span style={{ color: 'var(--color-text)' }}>{f.label}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{FIELD_TYPES.find((t) => t.value === f.field_type)?.icon}</span>
                    </div>
                  ))}
                </div>
              )}
              {fields.length === 0 && (
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Add filter fields to see a preview.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-lg"
          style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Filter Field' : 'Add Filter Field'}</DialogTitle>
            <DialogDescription style={{ color: 'var(--color-text-muted)' }}>
              Configure how this filter appears in the directory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Label</Label>
                <Input value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value, field_key: editing ? form.field_key : slugify(e.target.value) })}
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Field Key</Label>
                <Input value={form.field_key}
                  onChange={(e) => setForm({ ...form, field_key: e.target.value })}
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Field Type</Label>
              <Select value={form.field_type} onValueChange={(v) => setForm({ ...form, field_type: v })}>
                <SelectTrigger style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {['select', 'multiselect'].includes(form.field_type) && (
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Options (comma-separated)</Label>
                <Textarea value={form.options}
                  onChange={(e) => setForm({ ...form, options: e.target.value })}
                  placeholder="House, Techno, Hip-Hop, R&B"
                  rows={2}
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Applies To</Label>
                <Select value={form.applies_to} onValueChange={(v) => setForm({ ...form, applies_to: v })}>
                  <SelectTrigger style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venue">Venues</SelectItem>
                    <SelectItem value="product">Products</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Placeholder</Label>
                <Input value={form.placeholder}
                  onChange={(e) => setForm({ ...form, placeholder: e.target.value })}
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text)' }}>
                <Switch checked={form.show_in_quick_filters} onCheckedChange={(v) => setForm({ ...form, show_in_quick_filters: v })} />
                Quick Filter
              </label>
              <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text)' }}>
                <Switch checked={form.show_in_card} onCheckedChange={(v) => setForm({ ...form, show_in_card: v })} />
                Show on Card
              </label>
              <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text)' }}>
                <Switch checked={form.is_required} onCheckedChange={(v) => setForm({ ...form, is_required: v })} />
                Required
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={saveField} disabled={saving || !form.label}
                style={{ background: 'var(--color-button)', color: 'var(--color-bg)' }}>
                {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" onClick={() => setShowEditor(false)}
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
