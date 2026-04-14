import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_TENANT_ID } from '@/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronRight, ExternalLink, Save,
  Type, ImageIcon, Video, Layout, Columns, MousePointer, HelpCircle, Users, BarChart3, Code,
} from 'lucide-react';

type BlockType = 'text' | 'image' | 'video' | 'hero' | 'two_column' | 'cta' | 'faq' | 'team' | 'stats' | 'html';

interface ContentBlock {
  id: string;
  type: BlockType;
  data: Record<string, any>;
  expanded: boolean;
}

interface PageRow {
  id: string;
  title: string;
  slug: string;
  nav_label: string | null;
  seo_title: string | null;
  seo_description: string | null;
  show_in_nav: boolean;
  is_published: boolean;
  content_blocks: any[];
  tenant_id: string;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: any }[] = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'video', label: 'Video', icon: Video },
  { type: 'hero', label: 'Hero', icon: Layout },
  { type: 'two_column', label: 'Two Column', icon: Columns },
  { type: 'cta', label: 'CTA', icon: MousePointer },
  { type: 'faq', label: 'FAQ', icon: HelpCircle },
  { type: 'team', label: 'Team', icon: Users },
  { type: 'stats', label: 'Stats', icon: BarChart3 },
  { type: 'html', label: 'HTML', icon: Code },
];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function BlockEditor({ block, onChange, onDelete }: { block: ContentBlock; onChange: (b: ContentBlock) => void; onDelete: () => void }) {
  const toggle = () => onChange({ ...block, expanded: !block.expanded });
  const setData = (key: string, value: any) => onChange({ ...block, data: { ...block.data, [key]: value } });
  const meta = BLOCK_TYPES.find(b => b.type === block.type);
  const Icon = meta?.icon || Type;

  return (
    <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-2 px-4 py-2 cursor-pointer" onClick={toggle}>
        <GripVertical className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
        <Icon className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
        <span className="text-sm font-medium flex-1" style={{ color: 'var(--color-text)' }}>{meta?.label || block.type}</span>
        {block.expanded ? <ChevronDown className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} /> : <ChevronRight className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />}
        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="h-7 w-7">
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
      {block.expanded && (
        <CardContent className="pt-0 space-y-3">
          {block.type === 'text' && (
            <Textarea value={block.data.content || ''} onChange={e => setData('content', e.target.value)} placeholder="Enter text content..." className="min-h-[120px] bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
          )}
          {block.type === 'image' && (
            <>
              <Input value={block.data.url || ''} onChange={e => setData('url', e.target.value)} placeholder="Image URL" className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              <Input value={block.data.alt || ''} onChange={e => setData('alt', e.target.value)} placeholder="Alt text" className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              <Input value={block.data.caption || ''} onChange={e => setData('caption', e.target.value)} placeholder="Caption" className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
            </>
          )}
          {block.type === 'video' && (
            <Input value={block.data.url || ''} onChange={e => setData('url', e.target.value)} placeholder="YouTube or Vimeo URL" className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
          )}
          {block.type === 'hero' && (
            <>
              <Input value={block.data.headline || ''} onChange={e => setData('headline', e.target.value)} placeholder="Headline" className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              <Input value={block.data.subheadline || ''} onChange={e => setData('subheadline', e.target.value)} placeholder="Subheadline" className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              <div className="grid grid-cols-2 gap-2">
                <Input value={block.data.button_label || ''} onChange={e => setData('button_label', e.target.value)} placeholder="Button label" className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                <Input value={block.data.button_url || ''} onChange={e => setData('button_url', e.target.value)} placeholder="Button URL" className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Background</Label>
                <input type="color" value={block.data.bg_color || '#1a1a2e'} onChange={e => setData('bg_color', e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
              </div>
            </>
          )}
          {block.type === 'two_column' && (
            <div className="grid grid-cols-2 gap-3">
              <Textarea value={block.data.left || ''} onChange={e => setData('left', e.target.value)} placeholder="Left column" className="min-h-[100px] bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              <Textarea value={block.data.right || ''} onChange={e => setData('right', e.target.value)} placeholder="Right column" className="min-h-[100px] bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
            </div>
          )}
          {block.type === 'cta' && (
            <>
              <Input value={block.data.headline || ''} onChange={e => setData('headline', e.target.value)} placeholder="Headline" className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              <Textarea value={block.data.body || ''} onChange={e => setData('body', e.target.value)} placeholder="Body text" className="min-h-[60px] bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              <div className="grid grid-cols-2 gap-2">
                <Input value={block.data.button_label || ''} onChange={e => setData('button_label', e.target.value)} placeholder="Button label" className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                <Input value={block.data.button_url || ''} onChange={e => setData('button_url', e.target.value)} placeholder="Button URL" className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Background</Label>
                <input type="color" value={block.data.bg_color || '#1a1a2e'} onChange={e => setData('bg_color', e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
              </div>
            </>
          )}
          {block.type === 'faq' && (
            <div>
              <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>FAQ Category (filters from faqs table)</Label>
              <Input value={block.data.category || ''} onChange={e => setData('category', e.target.value)} placeholder="e.g. General" className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
            </div>
          )}
          {block.type === 'team' && (
            <div className="space-y-3">
              {(block.data.members || []).map((m: any, i: number) => (
                <div key={i} className="grid grid-cols-4 gap-2 items-start">
                  <Input value={m.name || ''} onChange={e => { const ms = [...(block.data.members || [])]; ms[i] = { ...ms[i], name: e.target.value }; setData('members', ms); }} placeholder="Name" className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                  <Input value={m.title || ''} onChange={e => { const ms = [...(block.data.members || [])]; ms[i] = { ...ms[i], title: e.target.value }; setData('members', ms); }} placeholder="Title" className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                  <Input value={m.photo || ''} onChange={e => { const ms = [...(block.data.members || [])]; ms[i] = { ...ms[i], photo: e.target.value }; setData('members', ms); }} placeholder="Photo URL" className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                  <Button size="icon" variant="ghost" onClick={() => { const ms = (block.data.members || []).filter((_: any, idx: number) => idx !== i); setData('members', ms); }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setData('members', [...(block.data.members || []), { name: '', title: '', photo: '', bio: '' }])}>
                <Plus className="h-3 w-3 mr-1" /> Add Member
              </Button>
            </div>
          )}
          {block.type === 'stats' && (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>This block auto-renders live platform statistics. No configuration needed.</p>
          )}
          {block.type === 'html' && (
            <>
              <p className="text-xs text-destructive">⚠ Raw HTML. Use with caution.</p>
              <Textarea value={block.data.html || ''} onChange={e => setData('html', e.target.value)} placeholder="<div>...</div>" className="min-h-[120px] font-mono text-xs bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function AdminPages() {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBlockPicker, setShowBlockPicker] = useState(false);

  // Editor form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [navLabel, setNavLabel] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [showInNav, setShowInNav] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  const fetchPages = useCallback(async () => {
    const { data } = await supabase.from('pages').select('*').eq('tenant_id', DEFAULT_TENANT_ID).order('sort_order');
    setPages((data as PageRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const loadPage = (page: PageRow) => {
    setSelectedId(page.id);
    setTitle(page.title);
    setSlug(page.slug);
    setNavLabel(page.nav_label || '');
    setSeoTitle(page.seo_title || '');
    setSeoDesc(page.seo_description || '');
    setShowInNav(page.show_in_nav ?? false);
    setIsPublished(page.is_published ?? false);
    const rawBlocks = Array.isArray(page.content_blocks) ? page.content_blocks : [];
    setBlocks(rawBlocks.map((b: any) => ({ ...b, expanded: false })));
  };

  const handleAddPage = async () => {
    const newSlug = `new-page-${Date.now().toString(36)}`;
    const { data, error } = await supabase.from('pages').insert({
      tenant_id: DEFAULT_TENANT_ID, title: 'Untitled Page', slug: newSlug,
      content_blocks: [], is_published: false, show_in_nav: false,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    await fetchPages();
    if (data) loadPage(data as PageRow);
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    const cleanBlocks = blocks.map(({ expanded, ...rest }) => rest);
    const { error } = await supabase.from('pages').update({
      title, slug, nav_label: navLabel || null, seo_title: seoTitle || null,
      seo_description: seoDesc || null, show_in_nav: showInNav, is_published: isPublished,
      content_blocks: cleanBlocks,
    }).eq('id', selectedId);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Page saved!' }); await fetchPages(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('pages').delete().eq('id', deleteId);
    if (selectedId === deleteId) { setSelectedId(null); }
    setDeleteId(null);
    await fetchPages();
    toast({ title: 'Page deleted' });
  };

  const addBlock = (type: BlockType) => {
    setBlocks([...blocks, { id: crypto.randomUUID(), type, data: type === 'team' ? { members: [] } : {}, expanded: true }]);
    setShowBlockPicker(false);
  };

  const updateBlock = (idx: number, b: ContentBlock) => { const n = [...blocks]; n[idx] = b; setBlocks(n); };
  const deleteBlock = (idx: number) => setBlocks(blocks.filter((_, i) => i !== idx));

  if (loading) return <div className="animate-pulse h-64 rounded-xl" style={{ background: 'var(--color-card-bg)' }} />;

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left panel — page list */}
      <div className="w-72 shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Pages</h1>
          <Button size="sm" onClick={handleAddPage} style={{ background: 'var(--color-button)', color: 'var(--color-bg)' }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {pages.map(p => (
              <button key={p.id} onClick={() => loadPage(p)}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between gap-2"
                style={{ background: selectedId === p.id ? 'rgba(255,255,255,0.08)' : 'transparent', color: 'var(--color-text)' }}>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>/{p.slug}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {p.is_published ? <Badge className="text-[10px] px-1.5 py-0">Live</Badge> : <Badge variant="outline" className="text-[10px] px-1.5 py-0">Draft</Badge>}
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </button>
            ))}
            {pages.length === 0 && <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No pages yet</p>}
          </div>
        </ScrollArea>
      </div>

      {/* Right panel — editor */}
      <div className="flex-1 min-w-0">
        {selectedId ? (
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4 pb-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Edit Page</h2>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.open(`/pages/${slug}`, '_blank')}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Preview
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving} style={{ background: 'var(--color-button)', color: 'var(--color-bg)' }}>
                    <Save className="h-3.5 w-3.5 mr-1" /> {saving ? 'Saving...' : 'Publish'}
                  </Button>
                </div>
              </div>

              {/* Page settings */}
              <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Title</Label>
                      <Input value={title} onChange={e => { setTitle(e.target.value); if (!slug || slug.startsWith('new-page-')) setSlug(slugify(e.target.value)); }} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Slug</Label>
                      <Input value={slug} onChange={e => setSlug(e.target.value)} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Nav Label</Label>
                    <Input value={navLabel} onChange={e => setNavLabel(e.target.value)} placeholder="Label shown in navigation" className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>SEO Title</Label>
                      <Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>SEO Description</Label>
                      <Input value={seoDesc} onChange={e => setSeoDesc(e.target.value)} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <Switch checked={showInNav} onCheckedChange={setShowInNav} />
                      <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Show in Nav</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                      <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Published</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Block editor */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Content Blocks</h3>
                {blocks.map((block, i) => (
                  <BlockEditor key={block.id} block={block} onChange={b => updateBlock(i, b)} onDelete={() => deleteBlock(i)} />
                ))}

                {showBlockPicker ? (
                  <Card className="border-0 p-4" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
                    <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>Choose a block type</p>
                    <div className="grid grid-cols-5 gap-2">
                      {BLOCK_TYPES.map(bt => (
                        <button key={bt.type} onClick={() => addBlock(bt.type)}
                          className="flex flex-col items-center gap-1 p-3 rounded-lg transition-colors hover:bg-white/5"
                          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                          <bt.icon className="h-5 w-5" />
                          <span className="text-xs">{bt.label}</span>
                        </button>
                      ))}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setShowBlockPicker(false)} className="mt-2">Cancel</Button>
                  </Card>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setShowBlockPicker(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Block
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--color-text-muted)' }}>
            <p className="text-sm">Select a page from the list or create a new one</p>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this page.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
