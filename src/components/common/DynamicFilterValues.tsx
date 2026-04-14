import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface Props {
  filterValues: Record<string, any> | null;
  categoryId: string | null;
}

export default function DynamicFilterValues({ filterValues, categoryId }: Props) {
  const [fields, setFields] = useState<any[]>([]);

  useEffect(() => {
    if (!tenant || !categoryId) return;
    supabase
      .from('filter_fields')
      .select('field_key, label, field_type')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setFields(data ?? []));
  }, [tenant, categoryId]);

  if (!filterValues || !fields.length) return null;

  const entries = fields
    .map((f) => ({ ...f, value: filterValues[f.field_key] }))
    .filter((f) => f.value !== undefined && f.value !== null && f.value !== '' && !(Array.isArray(f.value) && f.value.length === 0));

  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      {entries.map((f) => {
        const display = f.field_type === 'boolean'
          ? (f.value ? 'Yes' : 'No')
          : Array.isArray(f.value) ? f.value.join(', ') : String(f.value);

        return (
          <div key={f.field_key} className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{f.label}:</span>
            <Badge variant="secondary" className="text-xs">{display}</Badge>
          </div>
        );
      })}
    </div>
  );
}
