import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, TrendingUp } from 'lucide-react';

export default function LeaderboardsPage() {
  const [tab, setTab] = useState('venues');
  const [timeFilter, setTimeFilter] = useState('all');
  const [venues, setVenues] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    (supabase.from('venues' as any).select('*').order('likes_count', { ascending: false }).limit(20) as any)
      .then(({ data }: any) => setVenues(data ?? []));
    (supabase.from('users' as any).select('*').order('follower_count', { ascending: false }).limit(20) as any)
      .then(({ data }: any) => setUsers(data ?? []));
    supabase.from('products').select('*').order('likes_count', { ascending: false }).limit(20)
      .then(({ data }) => setProducts(data ?? []));
  }, [tenant, timeFilter]);

  const rankColors = ['text-amber-400', 'text-muted-foreground', 'text-amber-700'];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Trophy className="h-6 w-6 text-primary" /> Leaderboards</h1>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="venues" className="flex-1">Top Venues</TabsTrigger>
            <TabsTrigger value="users" className="flex-1">Top Users</TabsTrigger>
            <TabsTrigger value="products" className="flex-1">Top Products</TabsTrigger>
          </TabsList>

          <TabsContent value="venues" className="space-y-2 mt-4">
            {venues.map((v, i) => (
              <Link key={v.id} to={`/venues/${v.slug}`}>
                <Card className="glass hover:border-primary/50 transition-colors">
                  <CardContent className="pt-3 flex items-center gap-3">
                    <span className={`text-lg font-bold w-8 ${rankColors[i] ?? 'text-muted-foreground'}`}>#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{v.name}</p>
                      <p className="text-xs text-muted-foreground">{v.city ?? ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{v.likes_count ?? 0}</p>
                      <p className="text-xs text-muted-foreground">likes</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </TabsContent>

          <TabsContent value="users" className="space-y-2 mt-4">
            {users.map((u, i) => (
              <Link key={u.id} to={`/users/${u.username}`}>
                <Card className="glass hover:border-primary/50 transition-colors">
                  <CardContent className="pt-3 flex items-center gap-3">
                    <span className={`text-lg font-bold w-8 ${rankColors[i] ?? 'text-muted-foreground'}`}>#{i + 1}</span>
                    <Avatar className="h-8 w-8"><AvatarImage src={u.avatar_url ?? ''} /><AvatarFallback>{(u.username ?? '?')[0]}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{u.display_name ?? u.username}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{u.follower_count ?? 0}</p>
                      <p className="text-xs text-muted-foreground">followers</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </TabsContent>

          <TabsContent value="products" className="space-y-2 mt-4">
            {products.map((p, i) => (
              <Link key={p.id} to={`/products/${p.id}`}>
                <Card className="glass hover:border-primary/50 transition-colors">
                  <CardContent className="pt-3 flex items-center gap-3">
                    <span className={`text-lg font-bold w-8 ${rankColors[i] ?? 'text-muted-foreground'}`}>#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{p.likes_count ?? 0}</p>
                      <p className="text-xs text-muted-foreground">likes</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
