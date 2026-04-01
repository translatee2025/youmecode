import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 86400000);

    // 1. Notify expiring soon (within 7 days)
    const { data: expiringSoon } = await supabase
      .from("subscriptions")
      .select("*, venues!inner(name, owner_id)")
      .eq("status", "active")
      .eq("expiry_notified", false)
      .lte("expires_at", sevenDaysFromNow.toISOString())
      .gt("expires_at", now.toISOString());

    for (const sub of expiringSoon ?? []) {
      const venue = (sub as any).venues;
      if (venue?.owner_id) {
        await supabase.from("notifications").insert({
          tenant_id: sub.tenant_id,
          user_id: venue.owner_id,
          type: "subscription_expiring",
          message: `Your ${venue.name} subscription expires in less than 7 days`,
          entity_type: "venue",
          entity_id: sub.venue_id,
        });
      }
      await supabase.from("subscriptions").update({ expiry_notified: true }).eq("id", sub.id);
    }

    // 2. Expire overdue subscriptions
    const { data: expired } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("status", "active")
      .lte("expires_at", now.toISOString());

    for (const sub of expired ?? []) {
      await supabase.from("subscriptions").update({ status: "expired" }).eq("id", sub.id);
      await supabase.from("venues").update({
        subscription_status: "expired",
        status: "claimed_directory",
      }).eq("id", sub.venue_id);
      await supabase.from("products").update({ status: "hidden" }).eq("venue_id", sub.venue_id);
    }

    return new Response(
      JSON.stringify({ notified: (expiringSoon ?? []).length, expired: (expired ?? []).length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
