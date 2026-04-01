import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  entityType: string;
  entityId: string;
  className?: string;
}

export default function SaveButton({ entityType, entityId, className }: Props) {
  const tenant = useTenantStore((s) => s.tenant);
  const profile = useAuthStore((s) => s.profile);
  const [saved, setSaved] = useState(false);
  const [collections, setCollections] = useState<string[]>(['Saved']);

  useEffect(() => {
    if (!profile || !tenant) return;
    supabase
      .from('saves')
      .select('id, collection_name')
      .eq('tenant_id', tenant.id)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('user_id', profile.id)
      .then(({ data }) => {
        setSaved((data ?? []).length > 0);
        const uniqueColls = [...new Set((data ?? []).map((d: any) => d.collection_name ?? 'Saved'))];
        if (uniqueColls.length > 0) setCollections(uniqueColls);
      });
  }, [profile, tenant, entityType, entityId]);

  const saveToCollection = async (name: string) => {
    if (!profile || !tenant) {
      toast({ title: 'Please sign in', variant: 'destructive' });
      return;
    }
    if (saved) {
      await supabase.from('saves').delete()
        .eq('tenant_id', tenant.id)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('user_id', profile.id);
      setSaved(false);
      toast({ title: 'Removed from saved' });
    } else {
      await supabase.from('saves').insert({
        tenant_id: tenant.id,
        entity_type: entityType,
        entity_id: entityId,
        user_id: profile.id,
        collection_name: name,
      });
      setSaved(true);
      toast({ title: `Saved to ${name}` });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn('text-muted-foreground hover:text-foreground transition-colors', saved && 'text-primary', className)}>
          <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {collections.map((c) => (
          <DropdownMenuItem key={c} onClick={() => saveToCollection(c)}>
            {saved ? 'Remove from' : 'Save to'} {c}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={() => {
          const name = prompt('Collection name:');
          if (name) saveToCollection(name);
        }}>
          + New Collection
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
