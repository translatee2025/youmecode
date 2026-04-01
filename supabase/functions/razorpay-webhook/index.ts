import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const event = body.event;

    if (event === "payment.captured" || event === "subscription.activated") {
      const payload = body.payload;
      const entity = payload?.payment?.entity || payload?.subscription?.entity || {};
      const notes = entity.notes || {};
      const { tenant_id, venue_id, plan_id, billing_cycle } = notes;

      if (tenant_id && venue_id) {
        const now = new Date();
        let expiresAt = new Date(now);
        if (billing_cycle === "annual") expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        else if (billing_cycle === "quarterly") expiresAt.setMonth(expiresAt.getMonth() + 3);
        else expiresAt.setMonth(expiresAt.getMonth() + 1);

        await supabase.from("venues").update({
          status: "claimed_commerce",
          subscription_status: "active",
          subscription_expires_at: expiresAt.toISOString(),
          commerce_terms_accepted_at: now.toISOString(),
        }).eq("id", venue_id);

        await supabase.from("subscriptions").insert({
          tenant_id, venue_id, plan_id: plan_id || null,
          billing_cycle: billing_cycle || "monthly", status: "active",
          razorpay_subscription_id: entity.id,
          current_period_start: now.toISOString(),
          current_period_end: expiresAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        });

        await supabase.from("audit_log").insert({
          tenant_id, action: "commerce_activated",
          entity_type: "venue", entity_id: venue_id,
          metadata: { billing_cycle, plan_id, provider: "razorpay" },
        });
      }
    }

    if (event === "subscription.cancelled") {
      const entity = body.payload?.subscription?.entity || {};
      const { data: subscription } = await supabase
        .from("subscriptions").select("*")
        .eq("razorpay_subscription_id", entity.id).single();

      if (subscription) {
        await supabase.from("subscriptions").update({ status: "expired" }).eq("id", subscription.id);
        await supabase.from("venues").update({ subscription_status: "expired", status: "claimed_directory" }).eq("id", subscription.venue_id);
        await supabase.from("products").update({ status: "hidden" }).eq("venue_id", subscription.venue_id);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
    });
  }
});
