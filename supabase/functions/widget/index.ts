import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    if (!slug) return new Response(JSON.stringify({ error: 'slug required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, anonKey);

    const { data: venue } = await supabase
      .from('venues')
      .select('name, slug, rating_avg, rating_count, likes_count, cover_image_url, tenant_id')
      .eq('slug', slug)
      .maybeSingle();

    if (!venue) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Check widgets_enabled
    const { data: ss } = await supabase
      .from('site_settings')
      .select('widgets_enabled, site_name')
      .eq('tenant_id', venue.tenant_id)
      .maybeSingle();

    if (ss && (ss as any).widgets_enabled === false) {
      return new Response(JSON.stringify({ error: 'Widgets disabled' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { count } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('followee_id', venue.slug)
      .eq('followee_type', 'venue');

    return new Response(JSON.stringify({
      name: venue.name,
      rating_avg: venue.rating_avg,
      rating_count: venue.rating_count,
      likes_count: venue.likes_count,
      followers_count: count ?? 0,
      cover_image_url: venue.cover_image_url,
      site_name: (ss as any)?.site_name ?? 'Platform',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
