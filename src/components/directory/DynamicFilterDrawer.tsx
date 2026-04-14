import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronDown, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface FilterField {
  id: string;
  label: string;
  field_key: string;
  field_type: string;
  options: any;
  placeholder: string | null;
  show_in_quick_filters: boolean;
  is_required: boolean;
}

export interface FilterValues {
  [key: string]: any;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categoryId: string | null;
  subcategoryId: string | null;
  filterValues: FilterValues;
  onApply: (v: FilterValues) => void;
  minRating: number;
  onMinRatingChange: (r: number) => void;
  sortBy: string;
  onSortByChange: (s: string) => void;
}

export default function DynamicFilterDrawer({
  open,
  onOpenChange,
  categoryId,
  subcategoryId,
  filterValues,
  onApply,
  minRating,
  onMinRatingChange,
  sortBy,
  onSortByChange,
}: Props) {
  const [fields, setFields] = useState<FilterField[]>([]);
  const [local, setLocal] = useState<FilterValues>({});
  const [showMore, setShowMore] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setLocal({ ...filterValues });
  }, [filterValues, open]);

  useEffect(() => {
    if (!categoryId) {
      setFields([]);
      return;
    }
    const load = async () => {
      let q = supabase
        .from('filter_fields')
        .select('id, label, field_key, field_type, options, placeholder, show_in_quick_filters, is_required')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('sort_order');

      if (subcategoryId) {
        q = q.or(`subcategory_id.is.null,subcategory_id.eq.${subcategoryId}`);
      }

      const { data } = await q;
      setFields((data as FilterField[]) ?? []);
    };
    load();
  }, [categoryId, subcategoryId]);

  const set = (key: string, val: any) => setLocal((p) => ({ ...p, [key]: val }));
  const activeCount =
    Object.values(local).filter((v) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)).length +
    (minRating > 0 ? 1 : 0);

  const quickFields = fields.filter((f) => f.show_in_quick_filters);
  const moreFields = fields.filter((f) => !f.show_in_quick_filters);

  const renderField = (f: FilterField) => {
    const val = local[f.field_key];
    const opts: string[] = Array.isArray(f.options) ? f.options : [];

    switch (f.field_type) {
      case 'text':
      case 'url':
        return (
          <Input
            placeholder={f.placeholder ?? f.label}
            value={val ?? ''}
            onChange={(e) => set(f.field_key, e.target.value)}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            placeholder={f.placeholder ?? f.label}
            value={val ?? ''}
            onChange={(e) => set(f.field_key, e.target.value)}
          />
        );
      case 'number_range':
      case 'range':
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={val?.min ?? ''}
              onChange={(e) => set(f.field_key, { ...val, min: e.target.value })}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Max"
              value={val?.max ?? ''}
              onChange={(e) => set(f.field_key, { ...val, max: e.target.value })}
              className="flex-1"
            />
          </div>
        );
      case 'select':
        return (
          <Select value={val ?? ''} onValueChange={(v) => set(f.field_key, v)}>
            <SelectTrigger>
              <SelectValue placeholder={f.placeholder ?? `Select ${f.label}`} />
            </SelectTrigger>
            <SelectContent>
              {opts.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'multiselect': {
        const selected: string[] = Array.isArray(val) ? val : [];
        return (
          <div className="flex flex-wrap gap-1.5">
            {opts.map((o) => {
              const active = selected.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary/50 text-muted-foreground border-border hover:bg-secondary',
                  )}
                  onClick={() =>
                    set(f.field_key, active ? selected.filter((x) => x !== o) : [...selected, o])
                  }
                >
                  {o}
                </button>
              );
            })}
          </div>
        );
      }
      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{f.label}</span>
            <Switch checked={!!val} onCheckedChange={(v) => set(f.field_key, v)} />
          </div>
        );
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !val && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {val ? format(new Date(val), 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={val ? new Date(val) : undefined} onSelect={(d) => set(f.field_key, d?.toISOString())} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        );
      case 'date_range':
        return (
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn('flex-1 justify-start text-left font-normal text-xs', !val?.from && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {val?.from ? format(new Date(val.from), 'PP') : 'From'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={val?.from ? new Date(val.from) : undefined} onSelect={(d) => set(f.field_key, { ...val, from: d?.toISOString() })} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn('flex-1 justify-start text-left font-normal text-xs', !val?.to && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {val?.to ? format(new Date(val.to), 'PP') : 'To'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={val?.to ? new Date(val.to) : undefined} onSelect={(d) => set(f.field_key, { ...val, to: d?.toISOString() })} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        );
      case 'color': {
        const selected: string[] = Array.isArray(val) ? val : [];
        return (
          <div className="flex flex-wrap gap-2">
            {opts.map((c) => (
              <button
                key={c}
                type="button"
                className={cn(
                  'w-8 h-8 rounded-full border-2 transition-all',
                  selected.includes(c) ? 'border-primary scale-110' : 'border-transparent',
                )}
                style={{ backgroundColor: c }}
                onClick={() =>
                  set(f.field_key, selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c])
                }
              />
            ))}
          </div>
        );
      }
      default:
        return (
          <Input
            placeholder={f.placeholder ?? f.label}
            value={val ?? ''}
            onChange={(e) => set(f.field_key, e.target.value)}
          />
        );
    }
  };

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Quick Filters */}
        {quickFields.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Filters</h4>
            {quickFields.map((f) => (
              <div key={f.id} className="space-y-1.5">
                {f.field_type !== 'boolean' && (
                  <label className="text-sm font-medium text-foreground">{f.label}</label>
                )}
                {renderField(f)}
              </div>
            ))}
          </div>
        )}

        {/* More Filters */}
        {moreFields.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform', showMore && 'rotate-180')} />
              {showMore ? 'Hide' : 'Show'} more filters ({moreFields.length})
            </button>
            {showMore && (
              <div className="mt-3 space-y-4">
                {moreFields.map((f) => (
                  <div key={f.id} className="space-y-1.5">
                    {f.field_type !== 'boolean' && (
                      <label className="text-sm font-medium text-foreground">{f.label}</label>
                    )}
                    {renderField(f)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Standard Filters */}
        <div className="space-y-4 pt-2 border-t border-border">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rating</h4>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onMinRatingChange(r)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  minRating === r
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary/50 text-muted-foreground border-border hover:bg-secondary',
                )}
              >
                {r === 0 ? 'Any' : <><Star className="h-3 w-3 fill-current" /> {r}+</>}
              </button>
            ))}
          </div>

          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sort By</h4>
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured First</SelectItem>
              <SelectItem value="nearest">Nearest</SelectItem>
              <SelectItem value="highest_rated">Highest Rated</SelectItem>
              <SelectItem value="most_recent">Most Recent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => {
            setLocal({});
            onMinRatingChange(0);
            onApply({});
          }}
        >
          Reset All
        </Button>
        <Button className="flex-1" onClick={() => { onApply(local); onOpenChange(false); }}>
          Apply Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1.5 h-5 min-w-[20px] px-1.5 text-[10px]">{activeCount}</Badge>
          )}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Filters</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[380px] sm:w-[420px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}
