import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const profile = useAuthStore((s) => s.profile);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10);
    const items = data ?? [];
    setNotifications(items);
    setUnreadCount(items.filter((n) => !n.read_at).length);
  };

  useEffect(() => {
    load();
    if (!profile) return;
    const channel = supabase
      .channel('notifications-bell')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`,
      }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    load();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          <Link to="/notifications" className="text-xs text-primary hover:underline">See all</Link>
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
          ) : (
            notifications.map((n) => (
              <button key={n.id} onClick={() => markRead(n.id)}
                className={cn('w-full text-left p-3 hover:bg-muted/50 transition-colors flex gap-3 border-b border-border/50', !n.read_at && 'bg-primary/5')}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{n.message}</p>
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                </div>
                {!n.read_at && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
