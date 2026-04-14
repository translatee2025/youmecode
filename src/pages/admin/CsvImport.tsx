import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, FileText, ArrowRight, Download, CheckCircle, AlertTriangle } from 'lucide-react';

type Step = 'upload' | 'map' | 'preview' | 'import' | 'result';

const VENUE_FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
  { key: 'postcode', label: 'Postcode' },
  { key: 'location_lat', label: 'Latitude' },
  { key: 'location_lng', label: 'Longitude' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'website', label: 'Website' },
  { key: 'description', label: 'Description' },
  { key: 'short_description', label: 'Short Description' },
  { key: 'tags', label: 'Tags (comma-separated)' },
];

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
  return { headers, rows };
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function CsvImport() {
  const [step, setStep] = useState<Step>('upload');
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: Record<string, string>[] }>({ headers: [], rows: [] });
  const [fileName, setFileName] = useState('');
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
  const [filterFieldMap, setFilterFieldMap] = useState<Record<string, string>>({});
  const [categoryId, setCategoryId] = useState('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ imported: number; skipped: { row: Record<string, string>; reason: string }[] }>({ imported: 0, skipped: [] });

  const { data: categories = [] } = useQuery({
    queryKey: [tenant?.id, 'categories-import'],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, name');
      return data || [];
    },
  });

  const { data: filterFields = [] } = useQuery({
    queryKey: [tenant?.id, 'filter-fields-import', categoryId],
    enabled: !!tenant?.id && !!categoryId,
    queryFn: async () => {
      const { data } = await supabase.from('filter_fields').select('*').eq('category_id', categoryId);
      return data || [];
    },
  });

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) { toast.error('Please upload a CSV file'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.rows.length > 5000) { toast.error('Maximum 5000 rows allowed'); return; }
      setCsvData(parsed);
      setFileName(file.name);
      setStep('map');
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const previewRows = csvData.rows.slice(0, 10).map((row) => {
    const mapped: Record<string, string> = {};
    VENUE_FIELDS.forEach((f) => {
      if (fieldMap[f.key]) mapped[f.key] = row[fieldMap[f.key]] || '';
    });
    return { ...mapped, _missing: !mapped.name };
  });

  const runImport = async () => {
    setStep('import');
    const imported: number[] = [];
    const skipped: { row: Record<string, string>; reason: string }[] = [];
    const total = csvData.rows.length;
    const batch: any[] = [];

    for (let i = 0; i < total; i++) {
      const row = csvData.rows[i];
      const name = fieldMap.name ? row[fieldMap.name] : '';
      if (!name) { skipped.push({ row, reason: 'Missing name' }); continue; }

      const venue: Record<string, any> = {
        name,
        slug: slugify(name) + '-' + (i + 1),
        status: 'unclaimed',
        category_id: categoryId || null,
      };

      VENUE_FIELDS.forEach((f) => {
        if (f.key !== 'name' && fieldMap[f.key]) {
          const val = row[fieldMap[f.key]];
          if (f.key === 'tags') venue[f.key] = val ? val.split(',').map((t: string) => t.trim()) : [];
          else if (f.key === 'location_lat' || f.key === 'location_lng') venue[f.key] = val ? parseFloat(val) : null;
          else venue[f.key] = val || null;
        }
      });

      // Map dynamic filter values
      const filterValues: Record<string, any> = {};
      Object.entries(filterFieldMap).forEach(([fieldKey, csvCol]) => {
        if (csvCol && row[csvCol]) filterValues[fieldKey] = row[csvCol];
      });
      if (Object.keys(filterValues).length) venue.filter_values = filterValues;

      batch.push(venue);

      if (batch.length === 100 || i === total - 1) {
        const { error } = await supabase.from('venues').insert(batch);
        if (error) {
          batch.forEach((b) => skipped.push({ row: b, reason: error.message }));
        } else {
          imported.push(batch.length);
        }
        batch.length = 0;
        setProgress(Math.round(((i + 1) / total) * 100));
      }
    }

    setResult({ imported: imported.reduce((a, b) => a + b, 0), skipped });
    setStep('result');
  };

  const downloadSkipped = () => {
    if (!result.skipped.length) return;
    const headers = Object.keys(result.skipped[0].row).join(',') + ',skip_reason\n';
    const csv = headers + result.skipped.map((s) =>
      Object.values(s.row).join(',') + ',' + s.reason
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'skipped-rows.csv';
    a.click();
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-xl font-bold" style={{ color: 'var(--color-text, #f0f0f0)' }}>CSV Import</h1>

      {/* Step indicators */}
      <div className="flex gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        {(['upload', 'map', 'preview', 'import', 'result'] as Step[]).map((s, i) => (
          <span key={s} className={`px-2 py-1 rounded ${step === s ? 'font-bold' : ''}`}
            style={step === s ? { color: 'var(--color-primary)', background: 'rgba(255,255,255,0.08)' } : {}}>
            {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        ))}
      </div>

      {step === 'upload' && (
        <div
          className="glass p-12 text-center cursor-pointer border-2 border-dashed"
          style={{ borderColor: 'var(--color-border)' }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById('csv-input')?.click()}
        >
          <Upload className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>Drop CSV file here or click to browse</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Maximum 5,000 rows</p>
          <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      )}

      {step === 'map' && (
        <div className="space-y-4">
          <div className="glass p-4 flex items-center gap-3">
            <FileText className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
            <div>
              <p className="font-medium" style={{ color: 'var(--color-text)' }}>{fileName}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{csvData.rows.length} rows, {csvData.headers.length} columns</p>
            </div>
          </div>

          <div className="glass p-4 space-y-3">
            <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Category</h3>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="glass p-4 space-y-3">
            <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Map Standard Fields</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {VENUE_FIELDS.map((f) => (
                <div key={f.key} className="flex items-center gap-2">
                  <label className="text-sm min-w-[120px]" style={{ color: 'var(--color-text-muted)' }}>
                    {f.label}{f.required && <span className="text-red-400">*</span>}
                  </label>
                  <Select value={fieldMap[f.key] || ''} onValueChange={(v) => setFieldMap((p) => ({ ...p, [f.key]: v }))}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="— skip —" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">— skip —</SelectItem>
                      {csvData.headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {filterFields.length > 0 && (
            <div className="glass p-4 space-y-3">
              <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Map Custom Filter Fields</h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Map your data columns to your filter fields</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filterFields.map((f: any) => (
                  <div key={f.id} className="flex items-center gap-2">
                    <label className="text-sm min-w-[120px]" style={{ color: 'var(--color-text-muted)' }}>{f.label}</label>
                    <Select value={filterFieldMap[f.field_key] || ''} onValueChange={(v) => setFilterFieldMap((p) => ({ ...p, [f.field_key]: v }))}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="— skip —" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">— skip —</SelectItem>
                        {csvData.headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
            <Button onClick={() => setStep('preview')} disabled={!fieldMap.name}>
              Preview <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Showing first 10 rows:</p>
          <div className="glass overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {VENUE_FIELDS.filter((f) => fieldMap[f.key]).map((f) => <TableHead key={f.key}>{f.label}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, i) => (
                  <TableRow key={i} className={row._missing ? 'bg-red-500/10' : ''}>
                    {VENUE_FIELDS.filter((f) => fieldMap[f.key]).map((f) => (
                      <TableCell key={f.key} style={{ color: 'var(--color-text-muted)' }}>{(row as any)[f.key] || '—'}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('map')}>Back</Button>
            <Button onClick={runImport}>Start Import ({csvData.rows.length} rows)</Button>
          </div>
        </div>
      )}

      {step === 'import' && (
        <div className="glass p-8 text-center space-y-4">
          <p className="font-medium" style={{ color: 'var(--color-text)' }}>Importing… {progress}%</p>
          <Progress value={progress} className="max-w-sm mx-auto" />
        </div>
      )}

      {step === 'result' && (
        <div className="glass p-8 text-center space-y-4">
          <CheckCircle className="h-12 w-12 mx-auto text-green-400" />
          <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{result.imported} venues imported successfully</p>
          {result.skipped.length > 0 && (
            <>
              <p className="text-sm flex items-center justify-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                <AlertTriangle className="h-4 w-4 text-amber-400" />{result.skipped.length} rows skipped
              </p>
              <Button variant="outline" size="sm" onClick={downloadSkipped}>
                <Download className="h-4 w-4 mr-1" />Download Skipped Rows
              </Button>
            </>
          )}
          <Button onClick={() => { setStep('upload'); setCsvData({ headers: [], rows: [] }); setFieldMap({}); setFilterFieldMap({}); setProgress(0); }}>
            Import Another File
          </Button>
        </div>
      )}
    </div>
  );
}
