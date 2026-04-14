import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_TENANT_ID, config } from '@/config';
import PublicNav from '@/components/PublicNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Star, Calendar, ArrowRight, Users, Building2, CalendarDays } from 'lucide-react';

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
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center md:py-28">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">{config.platformName}</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{config.platformTagline}</p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" asChild><Link to="/directory">Browse Directory</Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/auth">Sign Up</Link></Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      {(stats.venues > 0 || stats.events > 0) && (
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto flex max-w-4xl items-center justify-center gap-12 px-4 py-8 text-center">
            <div><div className="flex items-center justify-center gap-2 text-3xl font-bold"><Building2 className="h-6 w-6 text-primary" />{stats.venues}</div><p className="mt-1 text-sm text-muted-foreground">{config.venueLabel}</p></div>
            <div><div className="flex items-center justify-center gap-2 text-3xl font-bold"><CalendarDays className="h-6 w-6 text-primary" />{stats.events}</div><p className="mt-1 text-sm text-muted-foreground">Events</p></div>
            <div><div className="flex items-center justify-center gap-2 text-3xl font-bold"><Users className="h-6 w-6 text-primary" />{stats.members || '–'}</div><p className="mt-1 text-sm text-muted-foreground">{config.memberLabel}</p></div>
          </div>
        </section>
      )}

      {/* Featured Venues */}
      {venues.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Featured {config.venueLabel}</h2>
            <Button variant="ghost" size="sm" asChild><Link to="/directory" className="gap-1">View All <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {venues.map((v) => (
              <Link key={v.id} to={`/venues/${v.slug}`}>
                <Card className="overflow-hidden transition-shadow hover:shadow-lg h-full">
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {v.cover_image_url ? <img src={v.cover_image_url} alt={v.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><Building2 className="h-10 w-10" /></div>}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold leading-tight">{v.name}</h3>
                    {v.location_city && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{v.location_city}</p>}
                    {(v.rating_avg ?? 0) > 0 && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{v.rating_avg} ({v.rating_count})</p>}
                    {v.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{v.description}</p>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="border-t border-border bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="mb-8 text-2xl font-bold">Browse by Category</h2>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((c) => (
                <Link key={c.id} to={`/directory?category=${c.slug}`}>
                  <Card className="p-5 text-center transition-shadow hover:shadow-md">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: (c.color || '#3b82f6') + '20' }}>
                      <span className="text-xl" style={{ color: c.color || '#3b82f6' }}>●</span>
                    </div>
                    <h3 className="font-medium text-sm">{c.name}</h3>
                    {c.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{c.description}</p>}
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      {events.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Upcoming Events</h2>
            <Button variant="ghost" size="sm" asChild><Link to="/events" className="gap-1">View All <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <Link key={e.id} to={`/events/${e.id}`}>
                <Card className="overflow-hidden transition-shadow hover:shadow-lg h-full">
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                    {e.cover_image_url ? <img src={e.cover_image_url} alt={e.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><Calendar className="h-10 w-10" /></div>}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      {e.is_free && <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Free</span>}
                      {e.start_at && <span className="text-xs text-muted-foreground">{new Date(e.start_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    </div>
                    <h3 className="mt-2 font-semibold">{e.title}</h3>
                    {e.address && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{e.address}</p>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest Blog Posts */}
      {posts.length > 0 && (
        <section className="border-t border-border bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Latest Posts</h2>
              <Button variant="ghost" size="sm" asChild><Link to="/blog" className="gap-1">View All <ArrowRight className="h-4 w-4" /></Link></Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <Link key={p.id} to={`/blog/${p.slug}`}>
                  <Card className="overflow-hidden transition-shadow hover:shadow-lg h-full">
                    <div className="aspect-[16/9] overflow-hidden bg-muted">
                      {p.cover_image_url ? <img src={p.cover_image_url} alt={p.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground">📝</div>}
                    </div>
                    <CardContent className="p-4">
                      {p.published_at && <p className="text-xs text-muted-foreground">{new Date(p.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                      <h3 className="mt-1 font-semibold">{p.title}</h3>
                      {p.excerpt && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.excerpt}</p>}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} {config.platformName}. All rights reserved.</p>
      </footer>
    </div>
  );
}
