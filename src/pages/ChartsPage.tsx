import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FullscreenLoader from '@/components/FullscreenLoader';
import { Helmet } from 'react-helmet-async';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid,
} from 'recharts';
import { subDays, subMonths, format, startOfWeek, startOfMonth } from 'date-fns';

const PRIMARY_COLOR = 'hsl(var(--primary))';
const MUTED_COLOR = 'hsl(var(--muted-foreground))';

export default function ChartsPage() {
  const tenant = useTenantStore((s) => s.tenant);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [commerceEnabled, setCommerceEnabled] = useState(false);
  const [period, setPeriod] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [siteName, setSiteName] = useState('');

  useEffect(() => {
    if (!tenant) return;
    Promise.all([
      supabase.from('module_settings').select('is_enabled').eq('tenant_id', tenant.id).eq('module_key', 'charts').maybeSingle(),
      supabase.from('site_settings').select('site_name, commerce_enabled').eq('tenant_id', tenant.id).maybeSingle(),
      supabase.from('categories').select('id, name').eq('tenant_id', tenant.id).eq('is_active', true),
      supabase.from('venues').select('id, name, slug, rating_avg, likes_count, views_count, category_id, location_city, created_at').eq('tenant_id', tenant.id).neq('status', 'opted_out'),
      supabase.from('users').select('id, username, display_name, followers_count, created_at').eq('tenant_id', tenant.id),
      supabase.from('products').select('id, name, likes_count, rating_avg').eq('tenant_id', tenant.id).eq('status', 'active'),
      supabase.from('posts').select('id, user_id').eq('tenant_id', tenant.id),
    ]).then(([modRes, ssRes, catRes, vRes, uRes, pRes, postRes]) => {
      setEnabled((modRes.data as any)?.is_enabled !== false);
      const ss = ssRes.data as any;
      setSiteName(ss?.site_name ?? tenant.name);
      setCommerceEnabled(ss?.commerce_enabled === true);
      setCategories(catRes.data ?? []);
      const allVenues = vRes.data ?? [];
      setVenues(allVenues);
      const cityList = [...new Set(allVenues.map((v: any) => v.location_city).filter(Boolean))] as string[];
      setCities(cityList.sort());

      // Attach post counts to users
      const postCounts: Record<string, number> = {};
      (postRes.data ?? []).forEach((p: any) => { postCounts[p.user_id] = (postCounts[p.user_id] ?? 0) + 1; });
      setUsers((uRes.data ?? []).map((u: any) => ({ ...u, posts_count: postCounts[u.id] ?? 0 })));

      setProducts(pRes.data ?? []);
      setLoading(false);
    });
  }, [tenant]);

  if (loading) return <FullscreenLoader />;
  if (!enabled) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Charts module is not enabled.</p>
    </div>
  );

  // Apply filters
  const cutoff = period === 'week' ? startOfWeek(new Date()) : period === 'month' ? startOfMonth(new Date()) : null;
  let fVenues = venues;
  if (categoryFilter !== 'all') fVenues = fVenues.filter((v) => v.category_id === categoryFilter);
  if (cityFilter !== 'all') fVenues = fVenues.filter((v) => v.location_city === cityFilter);

  const topByField = (arr: any[], field: string, nameField = 'name', limit = 10) =>
    [...arr].sort((a, b) => (b[field] ?? 0) - (a[field] ?? 0)).slice(0, limit).map((i) => ({ name: i[nameField]?.slice(0, 15) ?? '?', value: i[field] ?? 0, slug: i.slug, username: i.username }));

  const topVenuesByRating = topByField(fVenues, 'rating_avg');
  const topVenuesByLikes = topByField(fVenues, 'likes_count');
  const topVenuesByViews = topByField(fVenues, 'views_count');
  const topUsersByFollowers = topByField(users, 'followers_count', 'display_name');
  const topUsersByPosts = topByField(users, 'posts_count', 'display_name');
  const topProductsByLikes = topByField(products, 'likes_count');
  const topProductsByRating = topByField(products, 'rating_avg');

  // Growth: last 30 days
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(new Date(), 29 - i);
    const ds = format(d, 'yyyy-MM-dd');
    return {
      date: format(d, 'MMM d'),
      users: users.filter((u) => u.created_at?.startsWith(ds)).length,
      venues: venues.filter((v) => v.created_at?.startsWith(ds)).length,
    };
  });

  const ChartSection = ({ title, data, onClick }: { title: string; data: any[]; onClick?: (d: any) => void }) => (
    <div className="glass rounded-lg p-4 space-y-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} onClick={(e) => onClick && e?.activePayload && onClick(e.activePayload[0]?.payload)}>
          <XAxis dataKey="name" tick={{ fill: MUTED_COLOR, fontSize: 10 }} />
          <YAxis tick={{ fill: MUTED_COLOR, fontSize: 10 }} />
          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
          <Bar dataKey="value" fill={PRIMARY_COLOR} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Charts — {siteName}</title>
        <meta name="description" content={`Platform analytics and charts for ${siteName}`} />
      </Helmet>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Charts</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="City" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Top Venues */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Top Venues</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartSection title="By Rating" data={topVenuesByRating} />
            <ChartSection title="By Likes" data={topVenuesByLikes} />
            <ChartSection title="By Views" data={topVenuesByViews} />
          </div>
        </section>

        {/* Top Users */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Top Users</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartSection title="By Followers" data={topUsersByFollowers} />
            <ChartSection title="By Posts" data={topUsersByPosts} />
          </div>
        </section>

        {/* Top Products */}
        {commerceEnabled && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Top Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChartSection title="By Likes" data={topProductsByLikes} />
              <ChartSection title="By Rating" data={topProductsByRating} />
            </div>
          </section>
        )}

        {/* Platform Growth */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Platform Growth (Last 30 Days)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">New Users / Day</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={last30}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: MUTED_COLOR, fontSize: 10 }} />
                  <YAxis tick={{ fill: MUTED_COLOR, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                  <Line type="monotone" dataKey="users" stroke={PRIMARY_COLOR} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="glass rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">New Venues / Day</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={last30}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: MUTED_COLOR, fontSize: 10 }} />
                  <YAxis tick={{ fill: MUTED_COLOR, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                  <Line type="monotone" dataKey="venues" stroke={PRIMARY_COLOR} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
