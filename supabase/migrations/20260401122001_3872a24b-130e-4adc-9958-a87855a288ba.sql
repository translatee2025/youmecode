
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.subscription_plans(id),
  billing_cycle text DEFAULT 'monthly',
  status text DEFAULT 'active',
  stripe_subscription_id text,
  paypal_subscription_id text,
  razorpay_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  expires_at timestamptz,
  expiry_notified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='tenant_isolation') THEN
    CREATE POLICY "tenant_isolation" ON public.subscriptions FOR ALL USING (
      tenant_id = (current_setting('app.tenant_id', true))::uuid
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='platform_admin_bypass') THEN
    CREATE POLICY "platform_admin_bypass" ON public.subscriptions FOR ALL USING (
      (auth.jwt() ->> 'role') = 'platform_admin'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='public_read_subscriptions') THEN
    CREATE POLICY "public_read_subscriptions" ON public.subscriptions FOR SELECT USING (true);
  END IF;
END $$;

ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT null;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz DEFAULT null;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS commerce_terms_accepted_at timestamptz DEFAULT null;

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
