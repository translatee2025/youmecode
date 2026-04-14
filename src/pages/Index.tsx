import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_TENANT_ID, config } from '@/config';
import PublicNav from '@/components/PublicNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Star, Calendar, ArrowRight, ArrowUpRight, Users, Building2, CalendarDays } from 'lucide-react';

interface Venue {
  id: string; name: string; slug: string; description: string | null;
  cover_image_url: string | null; rating_avg: number | null; rating_count: number | null;
  location_city: string | null; address: string | null;
}
interface Category {
  id: string; name: string; slug: string; icon: string | null; color: string | null; description: string | null;
}
interface BlogPost {
  id: string; title: string; slug: string; excerpt: string | null;
  cover_image_url: string | null; published_at: string | null;
}
interface Event {
  id: string; title: string; description: string | null;
  start_at: string | null; address: string | null; cover_image_url: string | null; is_free: boolean | null;
}

export default function Index() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({ venues: 0, members: 0, events: 0 });

  useEffect(() => {
    const tid = DEFAULT_TENANT_ID;
    Promise.all([
      supabase.from('venues').select('id,name,slug,description,cover_image_url,rating_avg,rating_count,location_city,address')
        .eq('tenant_id', tid).eq('is_featured', true).limit(4),
      supabase.from('categories').select('id,name,slug,icon,color,description')
        .eq('tenant_id', tid).eq('is_active', true).order('sort_order').limit(6),
      supabase.from('blog_posts').select('id,title,slug,excerpt,cover_image_url,published_at')
        .eq('tenant_id', tid).eq('is_published', true).order('published_at', { ascending: false }).limit(3),
      supabase.from('events').select('id,title,description,start_at,address,cover_image_url,is_free')
        .eq('tenant_id', tid).eq('status', 'upcoming').order('start_at').limit(3),
      supabase.from('venues').select('id', { count: 'exact', head: true }).eq('tenant_id', tid),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('tenant_id', tid),
    ]).then(([v, c, b, e, vc, ec]) => {
      setVenues((v.data as Venue[]) || []);
      setCategories((c.data as Category[]) || []);
      setPosts((b.data as BlogPost[]) || []);
      setEvents((e.data as Event[]) || []);
      setStats({ venues: vc.count || 0, members: 0, events: ec.count || 0 });
    });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center md:py-32">
          <h1 className="text-5xl font-bold tracking-tight md:text-7xl">{config.platformName}</h1>
          <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground leading-relaxed">{config.platformTagline}</p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base rounded-full" asChild>
              <Link to="/directory">Browse Directory</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base rounded-full" asChild>
              <Link to="/auth">Sign Up Free</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      {(stats.venues > 0 || stats.events > 0) && (
        <section className="border-y border-border">
          <div className="mx-auto flex max-w-4xl items-center justify-center divide-x divide-border">
            <div className="flex-1 py-10 text-center">
              <Building2 className="h-7 w-7 mx-auto mb-2 text-muted-foreground" />
              <div className="text-3xl font-bold">{stats.venues}</div>
              <p className="mt-1 text-sm text-muted-foreground">{config.venueLabel}</p>
            </div>
            <div className="flex-1 py-10 text-center">
              <CalendarDays className="h-7 w-7 mx-auto mb-2 text-muted-foreground" />
              <div className="text-3xl font-bold">{stats.events}</div>
              <p className="mt-1 text-sm text-muted-foreground">Events</p>
            </div>
            <div className="flex-1 py-10 text-center">
              <Users className="h-7 w-7 mx-auto mb-2 text-muted-foreground" />
              <div className="text-3xl font-bold">{stats.members || '–'}</div>
              <p className="mt-1 text-sm text-muted-foreground">{config.memberLabel}</p>
            </div>
          </div>
        </section>
      )}

      {/* Featured Venues */}
      {venues.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold">Featured {config.venueLabel}</h2>
              <p className="mt-2 text-muted-foreground">Discover top-rated places in the community</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/directory" className="gap-1.5 text-muted-foreground hover:text-foreground">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {venues.map((v) => (
              <Link key={v.id} to={`/venues/${v.slug}`} className="group">
                <div className="overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-foreground/20 hover:shadow-xl hover:shadow-black/20">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {v.cover_image_url ? (
                      <img src={v.cover_image_url} alt={v.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl font-bold text-muted-foreground bg-secondary">
                        {v.name?.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-semibold text-white text-base drop-shadow-md">{v.name}</h3>
                      {v.location_city && (
                        <p className="flex items-center gap-1.5 text-white/80 text-sm mt-0.5">
                          <MapPin className="h-4 w-4" />{v.location_city}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    {(v.rating_avg ?? 0) > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-sm">{v.rating_avg}</span>
                        <span className="text-muted-foreground text-sm">({v.rating_count})</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No reviews</span>
                    )}
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="border-y border-border bg-card/50">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="mb-10 text-3xl font-bold text-center">Browse by Category</h2>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((c) => (
                <Link key={c.id} to={`/directory?category=${c.slug}`} className="group">
                  <div className="rounded-2xl border border-border bg-card p-6 text-center transition-all duration-300 hover:border-foreground/20 hover:shadow-lg">
                    <div
                      className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: (c.color || '#666') + '18' }}
                    >
                      <span className="text-2xl" style={{ color: c.color || '#888' }}>●</span>
                    </div>
                    <h3 className="font-semibold text-sm">{c.name}</h3>
                    {c.description && <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">{c.description}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      {events.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold">Upcoming Events</h2>
              <p className="mt-2 text-muted-foreground">Don't miss what's happening next</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/events" className="gap-1.5 text-muted-foreground hover:text-foreground">View All <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <Link key={e.id} to={`/events/${e.id}`} className="group">
                <div className="overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-foreground/20 hover:shadow-xl hover:shadow-black/20">
                  <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                    {e.cover_image_url ? (
                      <img src={e.cover_image_url} alt={e.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-secondary"><Calendar className="h-12 w-12 text-muted-foreground" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    {e.is_free && (
                      <span className="absolute top-3 left-3 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">Free</span>
                    )}
                  </div>
                  <div className="p-5">
                    {e.start_at && (
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        {new Date(e.start_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                    )}
                    <h3 className="font-semibold text-base">{e.title}</h3>
                    {e.address && (
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                        <MapPin className="h-4 w-4 shrink-0" /><span className="truncate">{e.address}</span>
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest Blog Posts */}
      {posts.length > 0 && (
        <section className="border-t border-border bg-card/50">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold">Latest Posts</h2>
                <p className="mt-2 text-muted-foreground">News and stories from the community</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/blog" className="gap-1.5 text-muted-foreground hover:text-foreground">View All <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <Link key={p.id} to={`/blog/${p.slug}`} className="group">
                  <div className="overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-foreground/20 hover:shadow-xl hover:shadow-black/20">
                    <div className="aspect-[16/9] overflow-hidden bg-muted">
                      {p.cover_image_url ? (
                        <img src={p.cover_image_url} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl bg-secondary">📝</div>
                      )}
                    </div>
                    <div className="p-5">
                      {p.published_at && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {new Date(p.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                      <h3 className="font-semibold text-base">{p.title}</h3>
                      {p.excerpt && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground leading-relaxed">{p.excerpt}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-12 text-center">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} {config.platformName}. All rights reserved.</p>
      </footer>
    </div>
  );
}
