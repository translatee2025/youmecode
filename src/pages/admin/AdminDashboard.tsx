import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, FileText, ShieldCheck, CheckCircle2, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Stats {
  users: number;
  venues: number;
  posts: number;
  claimedVenues: number;
}

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string | null;
  created_at: string | null;
}

interface ChecklistItem {
  label: string;
  done: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ users: 0, venues: 0, posts: 0, claimedVenues: 0 });
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const load = async () => {
      const [usersRes, venuesRes, postsRes, claimedRes, auditRes, settingsRes, catsRes, modsRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('venues').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('venues').select('id', { count: 'exact', head: true }).neq('status', 'unclaimed'),
        supabase.from('audit_log').select('id, action, entity_type, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('site_settings').select('site_name').maybeSingle(),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('module_settings').select('id', { count: 'exact', head: true }).eq('is_enabled', true),
      ]);

      setStats({
        users: usersRes.count ?? 0,
        venues: venuesRes.count ?? 0,
        posts: postsRes.count ?? 0,
        claimedVenues: claimedRes.count ?? 0,
      });

      setAudit((auditRes.data as AuditEntry[]) || []);

      setChecklist([
        { label: 'Site name configured', done: !!settingsRes.data?.site_name },
        { label: 'Categories created', done: (catsRes.count ?? 0) > 0 },
        { label: 'Venues added', done: (venuesRes.count ?? 0) > 0 },
        { label: 'Modules enabled', done: (modsRes.count ?? 0) > 0 },
      ]);

      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-24 rounded-xl" style={{ background: 'var(--color-card-bg)' }} /><div className="h-24 rounded-xl" style={{ background: 'var(--color-card-bg)' }} /></div>;
  }

  const statCards = [
    { label: 'Users', value: stats.users, icon: Users },
    { label: 'Venues', value: stats.venues, icon: Building2 },
    { label: 'Posts', value: stats.posts, icon: FileText },
    { label: 'Claimed Venues', value: stats.claimedVenues, icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text, #f0f0f0)' }}>Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="border-0" style={{ background: 'var(--color-card-bg, rgba(255,255,255,0.06))', border: '1px solid var(--color-border, rgba(255,255,255,0.1))' }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <s.icon className="h-5 w-5" style={{ color: 'var(--color-primary, #fff)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text, #f0f0f0)' }}>{s.value}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted, #888)' }}>{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
          <CardHeader><CardTitle className="text-base" style={{ color: 'var(--color-text)' }}>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {audit.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No activity yet</p>
            ) : (
              <ul className="space-y-2">
                {audit.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--color-text)' }}>
                      <span className="font-medium">{a.action}</span>
                      {a.entity_type && <span style={{ color: 'var(--color-text-muted)' }}> · {a.entity_type}</span>}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {a.created_at ? formatDistanceToNow(new Date(a.created_at), { addSuffix: true }) : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Launch Checklist */}
        <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
          <CardHeader><CardTitle className="text-base" style={{ color: 'var(--color-text)' }}>Launch Checklist</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-sm">
                  {item.done
                    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                    : <Circle className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                  }
                  <span style={{ color: item.done ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{item.label}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
