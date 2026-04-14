import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import FullscreenLoader from '@/components/FullscreenLoader';
import NotFound from '@/pages/NotFound';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

function ContentBlock({ block }: { block: any }) {
  switch (block.type) {
    case 'TEXT':
      return <div className="prose prose-invert max-w-none text-foreground/90" dangerouslySetInnerHTML={{ __html: block.content ?? '' }} />;
    case 'IMAGE':
      return (
        <figure className={block.width === 'half' ? 'max-w-md mx-auto' : 'w-full'}>
          <img src={block.url} alt={block.alt ?? ''} className="w-full rounded-lg" loading="lazy" />
          {block.caption && <figcaption className="text-center text-sm text-muted-foreground mt-2">{block.caption}</figcaption>}
        </figure>
      );
    case 'VIDEO':
      if (block.url?.includes('youtube') || block.url?.includes('youtu.be') || block.url?.includes('vimeo')) {
        return <div className="aspect-video"><iframe src={block.url} className="w-full h-full rounded-lg" allowFullScreen /></div>;
      }
      return <video src={block.url} controls className="w-full rounded-lg" />;
    case 'HERO':
      return (
        <section className="rounded-xl p-12 text-center space-y-4" style={{ background: block.bg ?? 'var(--color-card-bg)' }}>
          {block.headline && <h2 className="text-3xl font-bold text-foreground">{block.headline}</h2>}
          {block.subheadline && <p className="text-lg text-muted-foreground">{block.subheadline}</p>}
          {block.cta_text && <Button asChild><a href={block.cta_url ?? '#'}>{block.cta_text}</a></Button>}
        </section>
      );
    case 'TWO_COLUMN':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="prose prose-invert max-w-none text-foreground/90" dangerouslySetInnerHTML={{ __html: block.left ?? '' }} />
          <div className="prose prose-invert max-w-none text-foreground/90" dangerouslySetInnerHTML={{ __html: block.right ?? '' }} />
        </div>
      );
    case 'CTA':
      return (
        <section className="rounded-xl p-8 text-center space-y-3" style={{ background: block.bg ?? 'hsl(var(--primary) / 0.1)' }}>
          {block.headline && <h3 className="text-2xl font-bold text-foreground">{block.headline}</h3>}
          {block.body && <p className="text-muted-foreground">{block.body}</p>}
          {block.button_text && <Button asChild><a href={block.button_url ?? '#'}>{block.button_text}</a></Button>}
        </section>
      );
    case 'FAQ':
      return (
        <Accordion type="multiple" className="w-full">
          {(block.items ?? []).map((item: any, i: number) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent><div dangerouslySetInnerHTML={{ __html: item.answer }} /></AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      );
    case 'TEAM':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(block.members ?? []).map((m: any, i: number) => (
            <div key={i} className="glass rounded-lg p-4 text-center space-y-2">
              {m.image && <img src={m.image} alt={m.name} className="w-20 h-20 rounded-full mx-auto object-cover" />}
              <h4 className="font-medium text-foreground text-sm">{m.name}</h4>
              {m.role && <p className="text-xs text-muted-foreground">{m.role}</p>}
            </div>
          ))}
        </div>
      );
    case 'HTML':
      return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: block.content ?? '' }} />;
    case 'STATS':
      return <StatsBlock tenantId={block.tenant_id} />;
    default:
      return null;
  }
}

function StatsBlock({ tenantId }: { tenantId?: string }) {
  const [stats, setStats] = useState({ venues: 0, users: 0, products: 0 });
  useEffect(() => {
    const tid = tenantId || '';
    if (!tid) return;
    Promise.all([
      supabase.from('venues').select('id', { count: 'exact', head: true }).eq('tenant_id', tid),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('tenant_id', tid),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('tenant_id', tid),
    ]).then(([v, u, p]) => setStats({ venues: v.count ?? 0, users: u.count ?? 0, products: p.count ?? 0 }));
  }, [tenantId]);
  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      {[{ label: 'Venues', val: stats.venues }, { label: 'Users', val: stats.users }, { label: 'Products', val: stats.products }].map((s) => (
        <div key={s.label} className="glass rounded-lg p-6">
          <div className="text-3xl font-bold text-primary">{s.val}</div>
          <div className="text-sm text-muted-foreground">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function CmsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [siteName, setSiteName] = useState('');

  useEffect(() => {
    if (!slug) return;
    supabase.from('site_settings').select('site_name').maybeSingle().then(({ data }) => {
      setSiteName((data as any)?.site_name ?? 'My Community');
    });
    supabase.from('pages').select('*').eq('slug', slug).eq('is_published', true).maybeSingle().then(({ data }) => {
      setPage(data);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <FullscreenLoader />;
  if (!page) return <NotFound />;

  const title = page.seo_title || `${page.title} — ${siteName}`;
  const description = page.seo_description || '';

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {page.og_image_url && <meta property="og:image" content={page.og_image_url} />}
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-bold text-foreground">{page.title}</h1>
        {(page.content_blocks ?? []).map((block: any, i: number) => (
          <ContentBlock key={i} block={{ ...block,
}} />
        ))}
      </div>
    </div>
  );
}
