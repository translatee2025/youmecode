import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ShareButton from '@/components/common/ShareButton';
import CommentSection from '@/components/common/CommentSection';
import FullscreenLoader from '@/components/FullscreenLoader';
import NotFound from '@/pages/NotFound';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Clock } from 'lucide-react';
import { format } from 'date-fns';

function readingTime(text: string | null) {
  if (!text) return '1 min read';
  return `${Math.max(1, Math.ceil(text.split(/\s+/).length / 200))} min read`;
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const tenant = useTenantStore((s) => s.tenant);
  const [post, setPost] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteName, setSiteName] = useState('');

  useEffect(() => {
    if (!tenant || !slug) return;
    supabase.from('site_settings').select('site_name').eq('tenant_id', tenant.id).maybeSingle().then(({ data }) => {
      setSiteName((data as any)?.site_name ?? tenant.name);
    });
    supabase
      .from('blog_posts')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()
      .then(async ({ data }) => {
        setPost(data);
        if (data?.author_id) {
          const { data: u } = await supabase.from('users').select('username, display_name, avatar_url').eq('id', data.author_id).maybeSingle();
          setAuthor(u);
        }
        if (data?.tags?.length) {
          const { data: rel } = await supabase
            .from('blog_posts')
            .select('id, slug, title, cover_image_url, published_at')
            .eq('tenant_id', tenant.id)
            .eq('is_published', true)
            .neq('id', data.id)
            .overlaps('tags', data.tags)
            .limit(4);
          setRelated(rel ?? []);
        }
        setLoading(false);
      });
  }, [tenant, slug]);

  if (loading) return <FullscreenLoader />;
  if (!post) return <NotFound />;

  const title = post.seo_title || `${post.title} — ${siteName}`;
  const description = post.seo_description || post.excerpt || '';

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {post.cover_image_url && <meta property="og:image" content={post.cover_image_url} />}
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Article',
          headline: post.title,
          image: post.cover_image_url,
          datePublished: post.published_at,
          author: author ? { '@type': 'Person', name: author.display_name || author.username } : undefined,
          description,
        })}</script>
      </Helmet>

      {post.cover_image_url && (
        <div className="w-full max-h-[400px] overflow-hidden">
          <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to blog
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-foreground">{post.title}</h1>

        <div className="flex items-center gap-4 flex-wrap">
          {author && (
            <Link to={`/users/${author.username}`} className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={author.avatar_url} />
                <AvatarFallback className="bg-secondary text-xs">{(author.display_name || author.username || '?')[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">{author.display_name || author.username}</span>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">{post.published_at ? format(new Date(post.published_at), 'MMMM d, yyyy') : ''}</span>
          <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{readingTime(post.content)}</span>
          <ShareButton title={post.title} />
        </div>

        {(post.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
          </div>
        )}

        <div className="prose prose-invert max-w-none text-foreground/90" dangerouslySetInnerHTML={{ __html: (post.content ?? '').replace(/\n/g, '<br />') }} />

        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Comments</h3>
          <CommentSection entityType="blog_post" entityId={post.id} />
        </div>

        {related.length > 0 && (
          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Related Posts</h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {related.map((r) => (
                <Link key={r.id} to={`/blog/${r.slug}`} className="shrink-0 w-64 glass rounded-lg overflow-hidden hover:scale-[1.01] transition-all">
                  {r.cover_image_url && <img src={r.cover_image_url} alt={r.title} className="w-full aspect-video object-cover" loading="lazy" />}
                  <div className="p-3">
                    <h4 className="text-sm font-medium text-foreground line-clamp-2">{r.title}</h4>
                    <span className="text-xs text-muted-foreground">{r.published_at ? format(new Date(r.published_at), 'MMM d, yyyy') : ''}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
