import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FullscreenLoader from '@/components/FullscreenLoader';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { subDays, subMonths, format, startOfMonth, differenceInDays } from 'date-fns';
import { Download, TrendingUp, Users, Building2, FileText, DollarSign, AlertTriangle } from 'lucide-react';

const PRIMARY = 'hsl(var(--primary))';
const MUTED = 'hsl(var(--muted-foreground))';
const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [commerceEnabled, setCommerceEnabled] = useState(false);

  // Data
  const [users, setUsers] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);

  // Export filters
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');

  useEffect(() => {
    Promise.all([
      supabase.from('site_settings').select('commerce_enabled').maybeSingle(),
      supabase.from('users').select('*'),
      supabase.from('venues').select('*'),
      supabase.from('posts').select('id, created_at'),
      supabase.from('subscriptions').select('*'),
      supabase.from('ads').select('*'),
      supabase.from('categories').select('id, name'),
      supabase.from('ratings').select('*'),
    ]).then(([ssRes, uRes, vRes, pRes, sRes, aRes, cRes, rRes]) => {
      setCommerceEnabled((ssRes.data as any)?.commerce_enabled === true);
      setUsers(uRes.data ?? []);
      setVenues(vRes.data ?? []);
      setPosts(pRes.data ?? []);
      setSubs(sRes.data ?? []);
      setAds(aRes.data ?? []);
      setCategories(cRes.data ?? []);
      setRatings(rRes.data ?? []);
      setLoading(false);
    });
  }, []);

  // Computed stats
  const now = new Date();
  const monthStart = startOfMonth(now);
  const totalUsers = users.length;
  const newUsersMonth = users.filter((u) => new Date(u.created_at) >= monthStart).length;
  const prevMonthUsers = users.filter((u) => { const d = new Date(u.created_at); return d >= subMonths(monthStart, 1) && d < monthStart; }).length;
  const userChangePercent = prevMonthUsers > 0 ? Math.round(((newUsersMonth - prevMonthUsers) / prevMonthUsers) * 100) : 0;
  const totalVenues = venues.length;
  const claimedVenues = venues.filter((v) => v.status !== 'unclaimed' && v.status !== 'opted_out').length;
  const unclaimedVenues = venues.filter((v) => v.status === 'unclaimed').length;
  const totalPosts = posts.length;
  const postsMonth = posts.filter((p) => new Date(p.created_at) >= monthStart).length;
  const activeSubs = subs.filter((s) => s.status === 'active');
  const mrr = activeSubs.reduce((sum, s) => {
    const amt = Number(s.amount) || 0;
    if (s.billing_cycle === 'annual') return sum + amt / 12;
    if (s.billing_cycle === 'quarterly') return sum + amt / 3;
    return sum + amt;
  }, 0);

  // Charts data
  const dailyData = (items: any[], days: number) => Array.from({ length: days }, (_, i) => {
    const d = format(subDays(now, days - 1 - i), 'yyyy-MM-dd');
    return { date: format(subDays(now, days - 1 - i), 'MMM d'), count: items.filter((x) => x.created_at?.startsWith(d)).length };
  });

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    venues.forEach((v) => { if (v.category_id) counts[v.category_id] = (counts[v.category_id] ?? 0) + 1; });
    return categories.map((c) => ({ name: c.name, value: counts[c.id] ?? 0 })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [venues, categories]);

  const statusDist = useMemo(() => {
    const counts: Record<string, number> = {};
    venues.forEach((v) => { counts[v.status ?? 'unknown'] = (counts[v.status ?? 'unknown'] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [venues]);

  const cityCounts = useMemo(() => {
    const vc: Record<string, number> = {};
    const uc: Record<string, number> = {};
    venues.forEach((v) => { if (v.location_city) vc[v.location_city] = (vc[v.location_city] ?? 0) + 1; });
    users.forEach((u) => { if (u.location_city) uc[u.location_city] = (uc[u.location_city] ?? 0) + 1; });
    const allCities = [...new Set([...Object.keys(vc), ...Object.keys(uc)])];
    return allCities.map((c) => ({ city: c, venues: vc[c] ?? 0, users: uc[c] ?? 0 })).sort((a, b) => b.venues - a.venues);
  }, [venues, users]);

  // Revenue
  const arr = mrr * 12;
  const activeVendors = new Set(activeSubs.map((s) => s.subscriber_id)).size;
  const avgRevenuePerVendor = activeVendors > 0 ? mrr / activeVendors : 0;
  const cancelledThisMonth = subs.filter((s) => s.cancelled_at && new Date(s.cancelled_at) >= monthStart).length;
  const churnRate = activeSubs.length > 0 ? Math.round((cancelledThisMonth / activeSubs.length) * 100) : 0;
  const newSubsMonth = subs.filter((s) => new Date(s.created_at) >= monthStart).length;
  const upcomingRenewals = activeSubs.filter((s) => s.expires_at && differenceInDays(new Date(s.expires_at), now) <= 14 && differenceInDays(new Date(s.expires_at), now) >= 0);

  if (loading) return <FullscreenLoader />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Analytics</h2>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {commerceEnabled && <TabsTrigger value="revenue">Revenue</TabsTrigger>}
          <TabsTrigger value="exports">Exports</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Users', value: totalUsers, sub: `+${newUsersMonth} this month (${userChangePercent > 0 ? '+' : ''}${userChangePercent}%)`, icon: Users },
              { label: 'Venues', value: totalVenues, sub: `${claimedVenues} claimed · ${unclaimedVenues} unclaimed`, icon: Building2 },
              { label: 'Posts', value: totalPosts, sub: `+${postsMonth} this month`, icon: FileText },
              { label: 'Active Subs', value: activeSubs.length, sub: `MRR: $${mrr.toFixed(0)}`, icon: DollarSign },
            ].map((s) => (
              <Card key={s.label} className="glass">
                <CardContent className="pt-4">
                  <s.icon className="h-5 w-5 text-primary mb-1" />
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Daily Signups (90d)', data: dailyData(users, 90), key: 'count' },
              { title: 'Daily Posts (90d)', data: dailyData(posts, 90), key: 'count' },
            ].map((c) => (
              <div key={c.title} className="glass rounded-lg p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">{c.title}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={c.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: MUTED, fontSize: 9 }} interval={14} />
                    <YAxis tick={{ fill: MUTED, fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                    <Line type="monotone" dataKey={c.key} stroke={PRIMARY} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Top Categories</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={catCounts}>
                  <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 10 }} />
                  <YAxis tick={{ fill: MUTED, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                  <Bar dataKey="value" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="glass rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Venue Status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusDist} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ad performance */}
          {ads.length > 0 && (
            <div className="glass rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Ad Performance</h3>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Slot</TableHead><TableHead>Impressions</TableHead><TableHead>Clicks</TableHead><TableHead>CTR</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {ads.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.slot_type}</TableCell>
                      <TableCell>{a.impressions ?? 0}</TableCell>
                      <TableCell>{a.clicks ?? 0}</TableCell>
                      <TableCell>{a.impressions > 0 ? ((a.clicks / a.impressions) * 100).toFixed(1) + '%' : '0%'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Geographic */}
          {cityCounts.length > 0 && (
            <div className="glass rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Geographic Distribution</h3>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>City</TableHead><TableHead>Venues</TableHead><TableHead>Users</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {cityCounts.slice(0, 20).map((c) => (
                    <TableRow key={c.city}>
                      <TableCell>{c.city}</TableCell>
                      <TableCell>{c.venues}</TableCell>
                      <TableCell>{c.users}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* REVENUE */}
        {commerceEnabled && (
          <TabsContent value="revenue" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'MRR', value: `$${mrr.toFixed(0)}` },
                { label: 'ARR', value: `$${arr.toFixed(0)}` },
                { label: 'Active Vendors', value: activeVendors },
                { label: 'Avg/Vendor', value: `$${avgRevenuePerVendor.toFixed(0)}` },
                { label: 'Churn Rate', value: `${churnRate}%` },
                { label: 'New This Month', value: newSubsMonth },
              ].map((s) => (
                <Card key={s.label} className="glass">
                  <CardContent className="pt-4 text-center">
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Subscriptions table */}
            <div className="glass rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Subscriptions</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Subscriber</TableHead><TableHead>Cycle</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Expires</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {subs.slice(0, 50).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm">{s.subscriber_id?.slice(0, 8)}</TableCell>
                        <TableCell>{s.billing_cycle ?? '—'}</TableCell>
                        <TableCell>{s.currency ?? '$'}{s.amount ?? 0}</TableCell>
                        <TableCell><Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{s.status}</Badge></TableCell>
                        <TableCell>{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Upcoming renewals */}
            {upcomingRenewals.length > 0 && (
              <div className="glass rounded-lg p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" /> Renewals in Next 14 Days
                </h3>
                {upcomingRenewals.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-foreground">{s.subscriber_id?.slice(0, 8)}</span>
                    <span className="text-sm text-muted-foreground">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* EXPORTS */}
        <TabsContent value="exports" className="space-y-6 mt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">From</label>
              <Input type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">To</label>
              <Input type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)} className="w-40" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => {
              const filtered = users.filter((u) => {
                if (exportFrom && u.created_at < exportFrom) return false;
                if (exportTo && u.created_at > exportTo + 'T23:59:59') return false;
                return true;
              });
              downloadCsv('users.csv', ['username', 'email', 'role', 'joined', 'city', 'followers'], filtered.map((u) => [u.username, u.email, u.role, u.created_at?.split('T')[0], u.location_city, u.followers_count]));
            }}>
              <Download className="h-4 w-4 mr-2" /> Export Users CSV
            </Button>
            <Button variant="outline" onClick={() => {
              const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
              const filtered = venues.filter((v) => {
                if (exportFrom && v.created_at < exportFrom) return false;
                if (exportTo && v.created_at > exportTo + 'T23:59:59') return false;
                return true;
              });
              downloadCsv('venues.csv', ['name', 'category', 'city', 'status', 'rating', 'views'], filtered.map((v) => [v.name, catMap[v.category_id] ?? '', v.location_city, v.status, v.rating_avg, v.views_count]));
            }}>
              <Download className="h-4 w-4 mr-2" /> Export Venues CSV
            </Button>
            <Button variant="outline" onClick={() => {
              const filtered = subs.filter((s) => {
                if (exportFrom && s.created_at < exportFrom) return false;
                if (exportTo && s.created_at > exportTo + 'T23:59:59') return false;
                return true;
              });
              downloadCsv('subscriptions.csv', ['subscriber', 'plan', 'cycle', 'amount', 'currency', 'status', 'expires'], filtered.map((s) => [s.subscriber_id, s.plan_id, s.billing_cycle, s.amount, s.currency, s.status, s.expires_at?.split('T')[0]]));
            }}>
              <Download className="h-4 w-4 mr-2" /> Export Subscriptions CSV
            </Button>
            <Button variant="outline" onClick={() => {
              const filtered = ratings.filter((r) => {
                if (exportFrom && r.created_at < exportFrom) return false;
                if (exportTo && r.created_at > exportTo + 'T23:59:59') return false;
                return true;
              });
              downloadCsv('reviews.csv', ['entity_id', 'entity_type', 'reviewer', 'score', 'review_text', 'date'], filtered.map((r) => [r.entity_id, r.entity_type, r.user_id, r.score, r.review_text, r.created_at?.split('T')[0]]));
            }}>
              <Download className="h-4 w-4 mr-2" /> Export Reviews CSV
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
