import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const tenant = useTenantStore((s) => s.tenant);
  const profile = useAuthStore((s) => s.profile);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [page, setPage] = useState(0);

  const load = async () => {
    if (!tenant || !profile) return;
    const { data } = await supabase.from('notifications').select('*')
      .eq('tenant_id', tenant.id).eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .range(0, (page + 1) * 20 - 1);
    setNotifications(data ?? []);
  };

  useEffect(() => { load(); }, [tenant, profile, page]);

  const markAllRead = async () => {
    if (!tenant || !profile) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() })
      .eq('tenant_id', tenant.id).eq('user_id', profile.id).is('read_at', null);
    load();
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    load();
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Bell className="h-6 w-6" /> Notifications</h1>
          <Button size="sm" variant="outline" onClick={markAllRead}><CheckCheck className="h-4 w-4 mr-1" /> Mark all read</Button>
        </div>

        <div className="space-y-1">
          {notifications.map((n) => (
            <button key={n.id} onClick={() => markRead(n.id)}
              className={cn('w-full text-left p-4 rounded-lg transition-colors', !n.read_at ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50')}>
              <p className="text-sm text-foreground">{n.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
            </button>
          ))}
          {notifications.length === 0 && <p className="text-center text-muted-foreground py-8">No notifications</p>}
        </div>

        <Button variant="outline" className="w-full" onClick={() => setPage(page + 1)}>Load more</Button>
      </div>
    </div>
  );
}
