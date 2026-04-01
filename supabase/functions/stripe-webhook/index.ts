import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    
    // In production, verify with Stripe SDK:
    // const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
    // const event = stripe.webhooks.constructEvent(body, sig, Deno.env.get("STRIPE_WEBHOOK_SECRET")!);
    
    const event = JSON.parse(body);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { tenant_id, venue_id, plan_id, billing_cycle } = session.metadata || {};

      if (tenant_id && venue_id) {
        // Calculate expiry
        const now = new Date();
        let expiresAt = new Date(now);
        if (billing_cycle === "annual") expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        else if (billing_cycle === "quarterly") expiresAt.setMonth(expiresAt.getMonth() + 3);
        else expiresAt.setMonth(expiresAt.getMonth() + 1);

        // Update venue
        await supabase.from("venues").update({
          status: "claimed_commerce",
          subscription_status: "active",
          subscription_expires_at: expiresAt.toISOString(),
          commerce_terms_accepted_at: now.toISOString(),
        }).eq("id", venue_id);

        // Create subscription record
        await supabase.from("subscriptions").insert({
          tenant_id,
          venue_id,
          plan_id: plan_id || null,
          billing_cycle: billing_cycle || "monthly",
          status: "active",
          stripe_subscription_id: session.subscription || session.id,
          current_period_start: now.toISOString(),
          current_period_end: expiresAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        });

        // Get venue owner for notification
        const { data: venue } = await supabase.from("venues").select("owner_id, name").eq("id", venue_id).single();
        if (venue?.owner_id) {
          await supabase.from("notifications").insert({
            tenant_id,
            user_id: venue.owner_id,
            type: "commerce_activated",
            message: `${venue.name} is now commerce-active!`,
            entity_type: "venue",
            entity_id: venue_id,
          });
        }

        // Audit log
        await supabase.from("audit_log").insert({
          tenant_id,
          action: "commerce_activated",
          entity_type: "venue",
          entity_id: venue_id,
          metadata: { billing_cycle, plan_id, provider: "stripe" },
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      // Find subscription by stripe ID
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("stripe_subscription_id", sub.id)
        .single();

      if (subscription) {
        await supabase.from("subscriptions").update({ status: "expired" }).eq("id", subscription.id);
        await supabase.from("venues").update({
          subscription_status: "expired",
          status: "claimed_directory",
        }).eq("id", subscription.venue_id);
        await supabase.from("products").update({ status: "hidden" }).eq("venue_id", subscription.venue_id);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
