import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const now = new Date().toISOString();

    // Publish scheduled wall posts
    await supabase.from('posts')
      .update({ scheduled_at: null })
      .lte('scheduled_at', now)
      .not('scheduled_at', 'is', null);

    // Publish scheduled blog posts
    await supabase.from('blog_posts')
      .update({ is_published: true, published_at: now, scheduled_at: null })
      .lte('scheduled_at', now)
      .not('scheduled_at', 'is', null)
      .eq('is_published', false);

    // Expire ads
    await supabase.from('ads')
      .update({ status: 'expired' })
      .lte('expires_at', now)
      .eq('status', 'active');

    // Expire subscriptions + downgrade venues
    const { data: expiredSubs } = await supabase
      .from('subscriptions')
      .select('id, subscriber_id')
      .lte('expires_at', now)
      .eq('status', 'active');

    for (const sub of expiredSubs ?? []) {
      await supabase.from('subscriptions').update({ status: 'expired' }).eq('id', sub.id);
      await supabase.from('venues')
        .update({ subscription_status: 'expired', status: 'claimed_directory' })
        .eq('id', sub.subscriber_id);
      await supabase.from('products')
        .update({ status: 'hidden' })
        .eq('venue_id', sub.subscriber_id);
    }

    return new Response(JSON.stringify({ ok: true, processed: expiredSubs?.length ?? 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
