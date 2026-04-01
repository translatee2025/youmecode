import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Download, Upload, Languages, Sparkles } from 'lucide-react';
import { LANGUAGES } from '@/lib/languages';

const RTL_LANGS = ['ar', 'he', 'fa', 'ur'];

export default function TranslationsManager() {
  const tenant = useTenantStore((s) => s.tenant);
  const qc = useQueryClient();
  const [selectedLang, setSelectedLang] = useState('');
  const [filter, setFilter] = useState<'all' | 'missing' | 'translated'>('all');
  const [editedTranslations, setEditedTranslations] = useState<Record<string, string>>({});

  const { data: siteSettings } = useQuery({
    queryKey: [tenant?.id, 'site-settings-langs'],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('active_languages, default_language, rtl_languages').eq('tenant_id', tenant!.id).single();
      return data;
    },
  });

  const activeLanguages: string[] = (siteSettings?.active_languages as string[]) || ['en'];
  const [enabledLangs, setEnabledLangs] = useState<string[]>(activeLanguages);

  useEffect(() => {
    if (siteSettings?.active_languages) setEnabledLangs(siteSettings.active_languages as string[]);
  }, [siteSettings]);

  const { data: translations = [] } = useQuery({
    queryKey: [tenant?.id, 'translations', selectedLang],
    enabled: !!tenant?.id && !!selectedLang,
    queryFn: async () => {
      const { data } = await supabase.from('translations').select('*').eq('tenant_id', tenant!.id).eq('language_code', selectedLang);
      return data || [];
    },
  });

  const { data: defaultTranslations = [] } = useQuery({
    queryKey: [tenant?.id, 'translations-default'],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const defLang = (siteSettings?.default_language as string) || 'en';
      const { data } = await supabase.from('translations').select('*').eq('tenant_id', tenant!.id).eq('language_code', defLang);
      return data || [];
    },
  });

  const saveLangs = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('site_settings').update({ active_languages: enabledLangs as any }).eq('tenant_id', tenant!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [tenant?.id, 'site-settings-langs'] });
      toast.success('Languages saved');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveTranslations = useMutation({
    mutationFn: async () => {
      for (const [key, value] of Object.entries(editedTranslations)) {
        const existing = translations.find((t: any) => t.string_key === key);
        if (existing) {
          await supabase.from('translations').update({ value }).eq('id', existing.id);
        } else {
          await supabase.from('translations').insert({ tenant_id: tenant!.id, language: selectedLang, string_key: key, value });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [tenant?.id, 'translations'] });
      setEditedTranslations({});
      toast.success('Translations saved');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleLang = (code: string) => {
    setEnabledLangs((prev) => prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]);
  };

  const translationMap = new Map(translations.map((t: any) => [t.string_key, t.value]));
  const allKeys = [...new Set([...defaultTranslations.map((t: any) => t.string_key), ...translations.map((t: any) => t.string_key)])];
  const defaultMap = new Map(defaultTranslations.map((t: any) => [t.string_key, t.value]));

  const filteredKeys = allKeys.filter((key) => {
    const hasTranslation = translationMap.has(key) || editedTranslations[key];
    if (filter === 'missing') return !hasTranslation;
    if (filter === 'translated') return !!hasTranslation;
    return true;
  });

  const exportJSON = () => {
    const obj: Record<string, string> = {};
    translations.forEach((t: any) => { obj[t.string_key] = t.value; });
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${selectedLang}.json`;
    a.click();
  };

  const importJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const obj = JSON.parse(text);
        setEditedTranslations(obj);
        toast.success(`Loaded ${Object.keys(obj).length} strings. Click Save to apply.`);
      } catch { toast.error('Invalid JSON file'); }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Translations</h1>

      {/* Active Languages */}
      <div className="glass p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>Active Languages</h2>
          <Button size="sm" onClick={() => saveLangs.mutate()} disabled={saveLangs.isPending}>
            <Save className="h-3 w-3 mr-1" />Save Languages
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {LANGUAGES.map((lang) => (
            <div key={lang.code} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: enabledLangs.includes(lang.code) ? 'rgba(255,255,255,0.06)' : 'transparent' }}>
              <Switch checked={enabledLangs.includes(lang.code)} onCheckedChange={() => toggleLang(lang.code)} />
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{lang.flag} {lang.name}</span>
              {RTL_LANGS.includes(lang.code) && <Badge variant="outline" className="text-[10px] px-1">RTL</Badge>}
            </div>
          ))}
        </div>
      </div>

      {/* Translation Editor */}
      <div className="glass p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>Translation Editor</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportJSON} disabled={!selectedLang}><Download className="h-3 w-3 mr-1" />Export JSON</Button>
            <Button size="sm" variant="outline" onClick={importJSON} disabled={!selectedLang}><Upload className="h-3 w-3 mr-1" />Import JSON</Button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={selectedLang} onValueChange={setSelectedLang}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select language" /></SelectTrigger>
            <SelectContent>
              {enabledLangs.filter((l) => l !== ((siteSettings?.default_language as string) || 'en')).map((code) => {
                const lang = LANGUAGES.find((l) => l.code === code);
                return <SelectItem key={code} value={code}>{lang?.flag} {lang?.name || code}</SelectItem>;
              })}
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
              <SelectItem value="translated">Translated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedLang && (
          <>
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Translation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKeys.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No strings</TableCell></TableRow>
                  ) : filteredKeys.map((key) => (
                    <TableRow key={key}>
                      <TableCell className="font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>{key}</TableCell>
                      <TableCell className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{defaultMap.get(key) || key}</TableCell>
                      <TableCell>
                        <Input
                          className="text-sm"
                          value={editedTranslations[key] ?? (translationMap.get(key) as string) ?? ''}
                          onChange={(e) => setEditedTranslations((p) => ({ ...p, [key]: e.target.value }))}
                          placeholder="Enter translation..."
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => saveTranslations.mutate()} disabled={Object.keys(editedTranslations).length === 0 || saveTranslations.isPending}>
                <Save className="h-4 w-4 mr-1" />{saveTranslations.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
              <Button variant="outline" disabled>
                <Sparkles className="h-4 w-4 mr-1" />Bulk Translate (AI)
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
