import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import FullscreenLoader from '@/components/FullscreenLoader';
import { Helmet } from 'react-helmet-async';
import { Search, Clock } from 'lucide-react';
import { format } from 'date-fns';

function readingTime(text: string | null) {
  if (!text) return '1 min read';
  const words = text.split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [siteName, setSiteName] = useState('');

  useEffect(() => {
    supabase.from('site_settings').select('site_name').maybeSingle().then(({ data }) => {
      setSiteName((data as any)?.site_name ?? 'My Community');
    });
    supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <FullscreenLoader />;

  const allTags = [...new Set(posts.flatMap((p) => p.tags ?? []))];
  const filtered = posts.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (tagFilter && !(p.tags ?? []).includes(tagFilter)) return false;
    return true;
  });
  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Blog — {siteName}</title>
        <meta name="description" content={`Latest articles from ${siteName}`} />
        <meta property="og:title" content={`Blog — ${siteName}`} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-3xl font-bold text-foreground">Blog</h1>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts..." className="pl-9" />
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Badge variant={tagFilter === null ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setTagFilter(null)}>All</Badge>
            {allTags.map((t) => (
              <Badge key={t} variant={tagFilter === t ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setTagFilter(t)}>{t}</Badge>
            ))}
          </div>
        )}

        {featured && (
          <Link to={`/blog/${featured.slug}`} className="block group">
            <div className="relative rounded-xl overflow-hidden aspect-[21/9]">
              {featured.cover_image_url && (
                <img src={featured.cover_image_url} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-white">{featured.title}</h2>
                {featured.excerpt && <p className="text-white/80 text-sm line-clamp-2 max-w-2xl">{featured.excerpt}</p>}
                <div className="flex items-center gap-3 text-xs text-white/70">
                  <span>{featured.published_at ? format(new Date(featured.published_at), 'MMM d, yyyy') : ''}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{readingTime(featured.content)}</span>
                </div>
              </div>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post) => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="group glass rounded-xl overflow-hidden hover:scale-[1.01] transition-all">
              {post.cover_image_url && (
                <img src={post.cover_image_url} alt={post.title} className="w-full aspect-video object-cover" loading="lazy" />
              )}
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
                {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{post.published_at ? format(new Date(post.published_at), 'MMM d, yyyy') : ''}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{readingTime(post.content)}</span>
                </div>
                {(post.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((t: string) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">No blog posts yet.</p>}
      </div>
    </div>
  );
}
