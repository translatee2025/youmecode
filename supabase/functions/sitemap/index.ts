import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Content-Type': 'application/xml',
  'Access-Control-Allow-Origin': '*',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '') || supabaseUrl;

  // Get first tenant
  const { data: tenant } = await supabase.from('tenants').select('id').limit(1).maybeSingle();
  if (!tenant) {
    return new Response('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', { headers: corsHeaders });
  }

  const tid = tenant.id;
  const urls: string[] = [];

  const addUrl = (loc: string, lastmod?: string) => {
    urls.push(`<url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`);
  };

  // Static pages
  addUrl(`${origin}/`);
  addUrl(`${origin}/directory`);
  addUrl(`${origin}/blog`);
  addUrl(`${origin}/faq`);
  addUrl(`${origin}/events`);
  addUrl(`${origin}/cities`);

  // Venues
  const { data: venues } = await supabase
    .from('venues')
    .select('slug, created_at')
    .eq('tenant_id', tid)
    .neq('status', 'opted_out')
    .neq('status', 'unclaimed');
  (venues ?? []).forEach((v: any) => addUrl(`${origin}/venues/${v.slug}`, v.created_at?.split('T')[0]));

  // Blog posts
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, published_at')
    .eq('tenant_id', tid)
    .eq('is_published', true);
  (posts ?? []).forEach((p: any) => addUrl(`${origin}/blog/${p.slug}`, p.published_at?.split('T')[0]));

  // Pages
  const { data: pages } = await supabase
    .from('pages')
    .select('slug, created_at')
    .eq('tenant_id', tid)
    .eq('is_published', true);
  (pages ?? []).forEach((p: any) => addUrl(`${origin}/pages/${p.slug}`, p.created_at?.split('T')[0]));

  // Events
  const { data: events } = await supabase
    .from('events')
    .select('id, created_at')
    .eq('tenant_id', tid)
    .eq('status', 'upcoming');
  (events ?? []).forEach((e: any) => addUrl(`${origin}/events/${e.id}`, e.created_at?.split('T')[0]));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, { headers: corsHeaders });
});
