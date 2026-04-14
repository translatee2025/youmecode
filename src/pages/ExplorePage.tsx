import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import FollowButton from '@/components/common/FollowButton';
import { Search, TrendingUp, MapPin, Users, Building2 } from 'lucide-react';

export default function ExplorePage() {
  const profile = useAuthStore((s) => s.profile);
  const [search, setSearch] = useState('');
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [trendingVenues, setTrendingVenues] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<{ venues: any[]; users: any[]; hashtags: any[] }>({ venues: [], users: [], hashtags: [] });

  useEffect(() => {
    // Trending hashtags
    supabase.from('hashtags').select('*').order('posts_count', { ascending: false }).limit(20)
      .then(({ data }) => setHashtags(data ?? []));
    // Trending venues
    (supabase.from('venues' as any).select('*').order('likes_count', { ascending: false }).limit(6) as any)
      .then(({ data }: any) => setTrendingVenues(data ?? []));
    // Suggested users
    (supabase.from('users' as any).select('*').order('follower_count', { ascending: false }).limit(6) as any)
      .then(({ data }: any) => setSuggestedUsers(data ?? []));
  }, []);

  useEffect(() => {
    if (!search.trim()) { setSearchResults({ venues: [], users: [], hashtags: [] }); return; }
    const q = search.trim();
    Promise.all([
      (supabase.from('venues' as any).select('id, name, slug, city').ilike('name', `%${q}%`).limit(5) as any),
      (supabase.from('users' as any).select('id, username, display_name, avatar_url').ilike('username', `%${q}%`).limit(5) as any),
      supabase.from('hashtags').select('*').ilike('tag', `%${q}%`).limit(5),
    ]).then(([v, u, h]: any) => {
      setSearchResults({ venues: v.data ?? [], users: u.data ?? [], hashtags: h.data ?? [] });
    });
  }, [search]);

  const maxPosts = Math.max(...hashtags.map((h) => h.posts_count ?? 1), 1);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Explore</h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search venues, users, hashtags..." className="pl-10" />
        </div>

        {search.trim() && (searchResults.venues.length > 0 || searchResults.users.length > 0 || searchResults.hashtags.length > 0) && (
          <Card className="glass">
            <CardContent className="pt-4 space-y-3">
              {searchResults.venues.map((v) => (
                <Link key={v.id} to={`/venues/${v.slug}`} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div><p className="text-sm font-medium text-foreground">{v.name}</p>{v.city && <p className="text-xs text-muted-foreground">{v.city}</p>}</div>
                </Link>
              ))}
              {searchResults.users.map((u) => (
                <Link key={u.id} to={`/users/${u.username}`} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg">
                  <Avatar className="h-6 w-6"><AvatarImage src={u.avatar_url ?? ''} /><AvatarFallback>{(u.username ?? '?')[0]}</AvatarFallback></Avatar>
                  <p className="text-sm font-medium text-foreground">@{u.username}</p>
                </Link>
              ))}
              {searchResults.hashtags.map((h) => (
                <Link key={h.id} to={`/hashtag/${h.tag}`} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg">
                  <span className="text-primary">#</span><span className="text-sm text-foreground">{h.tag}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{h.posts_count} posts</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Trending hashtags */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Trending</h2>
          <div className="flex flex-wrap gap-2">
            {hashtags.map((h) => {
              const size = 0.7 + (h.posts_count / maxPosts) * 0.6;
              return (
                <Link key={h.id} to={`/hashtag/${h.tag}`}>
                  <Badge variant="secondary" className="hover:bg-primary/20 transition-colors" style={{ fontSize: `${size}rem` }}>
                    #{h.tag} <span className="ml-1 opacity-60">{h.posts_count}</span>
                  </Badge>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Trending venues */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Popular Venues</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {trendingVenues.map((v) => (
              <Link key={v.id} to={`/venues/${v.slug}`}>
                <Card className="glass hover:border-primary/50 transition-colors">
                  <CardContent className="pt-4">
                    {v.cover_image_url ? <img src={v.cover_image_url} alt="" className="w-full aspect-video object-cover rounded-md mb-2" /> : <div className="w-full aspect-video rounded-md mb-2 bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">{v.name?.[0]}</div>}
                    <p className="text-sm font-semibold text-foreground truncate">{v.name}</p>
                    {v.city && <p className="text-xs text-muted-foreground">{v.city}</p>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Suggested users */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> People to Follow</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {suggestedUsers.map((u) => (
              <Card key={u.id} className="glass hover:border-primary/50 transition-colors">
                <CardContent className="pt-4 text-center space-y-2">
                  <Avatar className="h-12 w-12 mx-auto">
                    <AvatarImage src={u.avatar_url ?? ''} />
                    <AvatarFallback>{(u.display_name ?? u.username ?? '?')[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <Link to={`/users/${u.username}`} className="text-sm font-semibold text-foreground hover:underline block truncate">{u.display_name ?? u.username}</Link>
                  <FollowButton followeeType="user" followeeId={u.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
