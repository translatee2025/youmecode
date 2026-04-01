import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus, Trash2, ChevronRight, ChevronDown, FolderTree,
  Package, Check, GripVertical, Upload,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  applies_to: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  color: string | null;
  image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  applies_to: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

interface CatPackage {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  suggested_categories: any;
  suggested_subcategories: any;
  suggested_filter_fields: any;
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function CategoryManager() {
  const tenant = useTenantStore((s) => s.tenant);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [showImport, setShowImport] = useState(false);
  const [packages, setPackages] = useState<CatPackage[]>([]);
  const [importChecked, setImportChecked] = useState<Record<string, Set<number>>>({});
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);
  const [showAddSub, setShowAddSub] = useState(false);
  const [subForm, setSubForm] = useState({ name: '', slug: '', applies_to: 'both', icon: '', description: '' });
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const loadData = useCallback(async () => {
    if (!tenant) return;
    const [catRes, subRes] = await Promise.all([
      supabase.from('categories').select('*').eq('tenant_id', tenant.id).order('sort_order'),
      supabase.from('subcategories').select('*').eq('tenant_id', tenant.id).order('sort_order'),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (subRes.data) setSubcategories(subRes.data);
  }, [tenant]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadPackages = async () => {
    const { data } = await supabase.from('category_packages').select('*').order('name');
    if (data) {
      setPackages(data);
      const checked: Record<string, Set<number>> = {};
      data.forEach((p) => {
        const cats = Array.isArray(p.suggested_categories) ? p.suggested_categories : [];
        checked[p.id] = new Set(cats.map((_: any, i: number) => i));
      });
      setImportChecked(checked);
    }
  };

  const createCategory = async () => {
    if (!tenant) return;
    const name = 'New Category';
    const { data, error } = await supabase.from('categories').insert({
      tenant_id: tenant.id,
      name,
      slug: slugify(name) + '-' + Date.now(),
      sort_order: categories.length,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    if (data) {
      setCategories((prev) => [...prev, data]);
      setSelectedCat(data);
      toast.success('Category created');
    }
  };

  const saveCategory = async () => {
    if (!selectedCat || !tenant) return;
    setSaving(true);
    const { error } = await supabase.from('categories')
      .update({
        name: selectedCat.name,
        slug: selectedCat.slug,
        icon: selectedCat.icon,
        description: selectedCat.description,
        applies_to: selectedCat.applies_to,
        color: selectedCat.color,
        image_url: selectedCat.image_url,
        is_active: selectedCat.is_active,
        seo_title: selectedCat.seo_title,
        seo_description: selectedCat.seo_description,
      })
      .eq('id', selectedCat.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setCategories((prev) => prev.map((c) => c.id === selectedCat.id ? selectedCat : c));
    toast.success('Category saved');
  };

  const deleteCategory = async () => {
    if (!selectedCat) return;
    const subCount = subcategories.filter((s) => s.category_id === selectedCat.id).length;
    if (!confirm(`Delete "${selectedCat.name}"? This will also remove ${subCount} subcategories and all linked filter fields.`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', selectedCat.id);
    if (error) { toast.error(error.message); return; }
    setCategories((prev) => prev.filter((c) => c.id !== selectedCat.id));
    setSubcategories((prev) => prev.filter((s) => s.category_id !== selectedCat.id));
    setSelectedCat(null);
    toast.success('Category deleted');
  };

  const toggleExpand = (id: string) => {
    setExpandedCats((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const addSubcategory = async () => {
    if (!selectedCat || !tenant) return;
    const slug = slugify(subForm.name) || 'sub-' + Date.now();
    const { data, error } = await supabase.from('subcategories').insert({
      tenant_id: tenant.id,
      category_id: selectedCat.id,
      name: subForm.name,
      slug,
      icon: subForm.icon || null,
      description: subForm.description || null,
      applies_to: subForm.applies_to,
      sort_order: subcategories.filter((s) => s.category_id === selectedCat.id).length,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    if (data) {
      setSubcategories((prev) => [...prev, data]);
      setSubForm({ name: '', slug: '', applies_to: 'both', icon: '', description: '' });
      setShowAddSub(false);
      toast.success('Subcategory added');
    }
  };

  const deleteSubcategory = async (id: string) => {
    const { error } = await supabase.from('subcategories').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setSubcategories((prev) => prev.filter((s) => s.id !== id));
    toast.success('Subcategory deleted');
  };

  const toggleSubActive = async (sub: Subcategory) => {
    const { error } = await supabase.from('subcategories').update({ is_active: !sub.is_active }).eq('id', sub.id);
    if (error) { toast.error(error.message); return; }
    setSubcategories((prev) => prev.map((s) => s.id === sub.id ? { ...s, is_active: !s.is_active } : s));
  };

  const importPackage = async (pkg: CatPackage) => {
    if (!tenant) return;
    setImporting(true);
    const checked = importChecked[pkg.id] || new Set();
    const sugCats = Array.isArray(pkg.suggested_categories) ? pkg.suggested_categories : [];
    const selectedCats = sugCats.filter((_: any, i: number) => checked.has(i));

    let catCount = 0;
    let filterCount = 0;

    for (const sc of selectedCats) {
      const name = typeof sc === 'string' ? sc : sc.name;
      const icon = typeof sc === 'string' ? null : sc.icon || null;
      const appliesTo = typeof sc === 'string' ? 'both' : sc.applies_to || 'both';
      const slug = slugify(name);

      const { data: catData, error: catErr } = await supabase.from('categories').insert({
        tenant_id: tenant.id,
        name,
        slug: slug + '-' + Date.now(),
        icon,
        applies_to: appliesTo,
        sort_order: categories.length + catCount,
      }).select().single();

      if (catErr || !catData) continue;
      catCount++;

      // Import filter fields for this category
      const sugFilters = Array.isArray(pkg.suggested_filter_fields) ? pkg.suggested_filter_fields : [];
      for (const ff of sugFilters) {
        const { error: ffErr } = await supabase.from('filter_fields').insert({
          tenant_id: tenant.id,
          category_id: catData.id,
          label: ff.label,
          field_key: ff.key || slugify(ff.label),
          field_type: ff.field_type || ff.type || 'text',
          options: ff.options ? JSON.stringify(ff.options) !== '[]' ? ff.options : [] : [],
          applies_to: ff.applies_to || 'both',
          show_in_quick_filters: ff.show_in_quick_filters || false,
        });
        if (!ffErr) filterCount++;
      }
    }

    // Import subcategories
    const sugSubs = Array.isArray(pkg.suggested_subcategories) ? pkg.suggested_subcategories : [];
    // subcategories reference parent_category_name — we'd need to match, skip for now

    setImporting(false);
    setShowImport(false);
    await loadData();
    toast.success(`Imported ${catCount} categories and ${filterCount} filter fields`);
  };

  const appliesToBadge = (a: string | null) => {
    const colors: Record<string, string> = {
      venue: 'bg-blue-500/20 text-blue-300',
      product: 'bg-green-500/20 text-green-300',
      both: 'bg-purple-500/20 text-purple-300',
      user: 'bg-amber-500/20 text-amber-300',
    };
    return <Badge variant="outline" className={`text-[10px] ${colors[a || 'both'] || ''}`}>{a || 'both'}</Badge>;
  };

  const catSubs = selectedCat ? subcategories.filter((s) => s.category_id === selectedCat.id) : [];

  return (
    <div className="flex gap-6 h-[calc(100vh-5rem)]">
      {/* Left: Category Tree */}
      <div
        className="w-80 shrink-0 rounded-2xl flex flex-col"
        style={{
          background: 'var(--color-card-bg, rgba(255,255,255,0.06))',
          border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
        }}
      >
        <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Categories</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { loadPackages(); setShowImport(true); }}
              className="text-xs gap-1" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
              <Package className="h-3 w-3" /> Import
            </Button>
            <Button size="sm" onClick={createCategory} className="text-xs gap-1"
              style={{ background: 'var(--color-button)', color: 'var(--color-bg)' }}>
              <Plus className="h-3 w-3" /> Add
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {categories.map((cat) => {
              const subs = subcategories.filter((s) => s.category_id === cat.id);
              const expanded = expandedCats.has(cat.id);
              return (
                <div key={cat.id}>
                  <button
                    onClick={() => setSelectedCat(cat)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-sm"
                    style={{
                      background: selectedCat?.id === cat.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: 'var(--color-text)',
                    }}
                  >
                    {subs.length > 0 && (
                      <button onClick={(e) => { e.stopPropagation(); toggleExpand(cat.id); }} className="shrink-0">
                        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </button>
                    )}
                    {!subs.length && <span className="w-3" />}
                    <span className="text-base">{cat.icon || '📁'}</span>
                    <span className="flex-1 truncate">{cat.name}</span>
                    {appliesToBadge(cat.applies_to)}
                    {!cat.is_active && (
                      <Badge variant="outline" className="text-[10px] bg-red-500/20 text-red-300">off</Badge>
                    )}
                  </button>
                  {expanded && subs.map((sub) => (
                    <button
                      key={sub.id}
                      className="w-full flex items-center gap-2 pl-10 pr-3 py-1.5 text-left text-xs rounded-lg transition-colors"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <span>{sub.icon || '📄'}</span>
                      <span className="truncate">{sub.name}</span>
                    </button>
                  ))}
                </div>
              );
            })}
            {categories.length === 0 && (
              <p className="text-center text-xs py-8" style={{ color: 'var(--color-text-muted)' }}>
                No categories yet. Create one or import from a package.
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Category Editor */}
      <div className="flex-1 min-w-0">
        {selectedCat ? (
          <div
            className="rounded-2xl p-6 space-y-6"
            style={{
              background: 'var(--color-card-bg, rgba(255,255,255,0.06))',
              border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Edit Category
              </h2>
              <Button variant="destructive" size="sm" onClick={deleteCategory} className="gap-1">
                <Trash2 className="h-3 w-3" /> Delete
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: 'var(--color-text-muted)' }}>Name</Label>
                <Input
                  value={selectedCat.name}
                  onChange={(e) => setSelectedCat({ ...selectedCat, name: e.target.value, slug: slugify(e.target.value) })}
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: 'var(--color-text-muted)' }}>Slug</Label>
                <Input
                  value={selectedCat.slug}
                  onChange={(e) => setSelectedCat({ ...selectedCat, slug: e.target.value })}
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: 'var(--color-text-muted)' }}>Icon (emoji)</Label>
                <Input
                  value={selectedCat.icon || ''}
                  onChange={(e) => setSelectedCat({ ...selectedCat, icon: e.target.value })}
                  placeholder="📁"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: 'var(--color-text-muted)' }}>Applies To</Label>
                <Select value={selectedCat.applies_to || 'both'} onValueChange={(v) => setSelectedCat({ ...selectedCat, applies_to: v })}>
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
              <div className="space-y-2">
                <Label style={{ color: 'var(--color-text-muted)' }}>Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={selectedCat.color || '#888888'}
                    onChange={(e) => setSelectedCat({ ...selectedCat, color: e.target.value })}
                    className="h-10 w-10 rounded cursor-pointer border-0"
                  />
                  <Input
                    value={selectedCat.color || ''}
                    onChange={(e) => setSelectedCat({ ...selectedCat, color: e.target.value })}
                    placeholder="#888888"
                    className="flex-1"
                    style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>
              <div className="space-y-2 flex items-end gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedCat.is_active ?? true}
                    onCheckedChange={(v) => setSelectedCat({ ...selectedCat, is_active: v })}
                  />
                  <Label style={{ color: 'var(--color-text-muted)' }}>Active</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label style={{ color: 'var(--color-text-muted)' }}>Description</Label>
              <Textarea
                value={selectedCat.description || ''}
                onChange={(e) => setSelectedCat({ ...selectedCat, description: e.target.value })}
                rows={3}
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: 'var(--color-text-muted)' }}>SEO Title</Label>
                <Input
                  value={selectedCat.seo_title || ''}
                  onChange={(e) => setSelectedCat({ ...selectedCat, seo_title: e.target.value })}
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: 'var(--color-text-muted)' }}>SEO Description</Label>
                <Input
                  value={selectedCat.seo_description || ''}
                  onChange={(e) => setSelectedCat({ ...selectedCat, seo_description: e.target.value })}
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
            </div>

            <Button onClick={saveCategory} disabled={saving}
              style={{ background: 'var(--color-button)', color: 'var(--color-bg)' }}>
              {saving ? 'Saving…' : 'Save Category'}
            </Button>

            <Separator style={{ background: 'var(--color-border)' }} />

            {/* Subcategories */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Subcategories</h3>
                <Button size="sm" onClick={() => { setShowAddSub(true); setSubForm({ name: '', slug: '', applies_to: selectedCat.applies_to || 'both', icon: '', description: '' }); }}
                  className="text-xs gap-1" style={{ background: 'var(--color-button)', color: 'var(--color-bg)' }}>
                  <Plus className="h-3 w-3" /> Add Subcategory
                </Button>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Subcategories allow more specific filtering and will appear in the directory as a secondary filter.
              </p>

              {catSubs.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)' }}
                >
                  <span>{sub.icon || '📄'}</span>
                  <span className="flex-1 text-sm" style={{ color: 'var(--color-text)' }}>{sub.name}</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{sub.slug}</span>
                  {appliesToBadge(sub.applies_to)}
                  <Switch checked={sub.is_active ?? true} onCheckedChange={() => toggleSubActive(sub)} />
                  <Button size="sm" variant="ghost" onClick={() => deleteSubcategory(sub.id)}>
                    <Trash2 className="h-3 w-3 text-red-400" />
                  </Button>
                </div>
              ))}

              {showAddSub && (
                <div className="p-4 rounded-lg space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)' }}>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Subcategory name" value={subForm.name}
                      onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    />
                    <Input placeholder="Icon (emoji)" value={subForm.icon}
                      onChange={(e) => setSubForm({ ...subForm, icon: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <Textarea placeholder="Description" value={subForm.description}
                    onChange={(e) => setSubForm({ ...subForm, description: e.target.value })}
                    rows={2}
                    style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addSubcategory} disabled={!subForm.name}
                      style={{ background: 'var(--color-button)', color: 'var(--color-bg)' }}>Add</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddSub(false)}
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className="flex items-center justify-center h-full rounded-2xl"
            style={{
              background: 'var(--color-card-bg, rgba(255,255,255,0.06))',
              border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
            }}
          >
            <div className="text-center space-y-3">
              <FolderTree className="h-12 w-12 mx-auto" style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Select a category to edit, or create a new one.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Import Modal */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto"
          style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
          <DialogHeader>
            <DialogTitle>Import from Category Package</DialogTitle>
            <DialogDescription style={{ color: 'var(--color-text-muted)' }}>
              Select a package to import pre-built categories and filter fields.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {packages.map((pkg) => {
              const sugCats = Array.isArray(pkg.suggested_categories) ? pkg.suggested_categories : [];
              const sugFilters = Array.isArray(pkg.suggested_filter_fields) ? pkg.suggested_filter_fields : [];
              const checked = importChecked[pkg.id] || new Set();
              const isExpanded = expandedPkg === pkg.id;

              return (
                <div
                  key={pkg.id}
                  className="rounded-xl p-4 space-y-2 cursor-pointer transition-all"
                  style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}
                  onClick={() => setExpandedPkg(isExpanded ? null : pkg.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{pkg.icon || '📦'}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{pkg.name}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {sugCats.length} categories · {sugFilters.length} filters
                      </p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="space-y-2 pt-2" onClick={(e) => e.stopPropagation()}>
                      <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Categories:</p>
                      {sugCats.map((sc: any, i: number) => {
                        const name = typeof sc === 'string' ? sc : sc.name;
                        return (
                          <label key={i} className="flex items-center gap-2 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked.has(i)}
                              onChange={() => {
                                const n = new Set(checked);
                                n.has(i) ? n.delete(i) : n.add(i);
                                setImportChecked({ ...importChecked, [pkg.id]: n });
                              }}
                              className="rounded"
                            />
                            <span>{name}</span>
                          </label>
                        );
                      })}
                      {sugFilters.length > 0 && (
                        <>
                          <p className="text-xs font-medium pt-1" style={{ color: 'var(--color-text-muted)' }}>Filter fields:</p>
                          <div className="flex flex-wrap gap-1">
                            {sugFilters.map((ff: any, i: number) => (
                              <Badge key={i} variant="outline" className="text-[10px]">{ff.label}</Badge>
                            ))}
                          </div>
                        </>
                      )}
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        disabled={checked.size === 0 || importing}
                        onClick={() => importPackage(pkg)}
                        style={{ background: 'var(--color-button)', color: 'var(--color-bg)' }}
                      >
                        {importing ? 'Importing…' : `Import ${checked.size} Selected`}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
