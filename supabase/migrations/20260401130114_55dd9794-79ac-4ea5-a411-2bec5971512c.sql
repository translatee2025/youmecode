
-- Drop all tenant_isolation policies
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users','theme_settings','module_settings','categories','subcategories',
    'filter_fields','product_types','venues','posts','follows','likes',
    'comments','ratings','saves','blocks','mutes','conversations','messages',
    'polls','poll_votes','events','subscriptions','subscription_plans','ads',
    'ad_slots','audit_log','webhooks','translations','badges','hashtags',
    'deals','blog_posts','pages','faqs','groups','group_members','chat_rooms',
    'chat_messages','discussions','discussion_boards','discussion_replies',
    'reports','claim_requests','checkins','notifications'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON public.%I', tbl);
  END LOOP;
END $$;

-- Also check for site_settings
DROP POLICY IF EXISTS tenant_isolation ON public.site_settings;

-- Now create permissive policies for all tables

-- PUBLIC READ (anon + authenticated can SELECT)
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users','theme_settings','module_settings','categories','subcategories',
    'filter_fields','product_types','venues','posts','follows','likes',
    'comments','ratings','saves','blocks','mutes','conversations','messages',
    'polls','poll_votes','events','subscriptions','subscription_plans','ads',
    'ad_slots','audit_log','webhooks','translations','badges','hashtags',
    'deals','blog_posts','pages','faqs','groups','group_members','chat_rooms',
    'chat_messages','discussions','discussion_boards','discussion_replies',
    'reports','claim_requests','checkins','notifications','site_settings'
  ])
  LOOP
    EXECUTE format('CREATE POLICY "public_read" ON public.%I AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true)', tbl);
  END LOOP;
END $$;

-- AUTHENTICATED INSERT
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users','theme_settings','module_settings','categories','subcategories',
    'filter_fields','product_types','venues','posts','follows','likes',
    'comments','ratings','saves','blocks','mutes','conversations','messages',
    'polls','poll_votes','events','subscriptions','subscription_plans','ads',
    'ad_slots','audit_log','webhooks','translations','badges','hashtags',
    'deals','blog_posts','pages','faqs','groups','group_members','chat_rooms',
    'chat_messages','discussions','discussion_boards','discussion_replies',
    'reports','claim_requests','checkins','notifications','site_settings'
  ])
  LOOP
    EXECUTE format('CREATE POLICY "authenticated_insert" ON public.%I AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true)', tbl);
  END LOOP;
END $$;

-- AUTHENTICATED UPDATE
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users','theme_settings','module_settings','categories','subcategories',
    'filter_fields','product_types','venues','posts','follows','likes',
    'comments','ratings','saves','blocks','mutes','conversations','messages',
    'polls','poll_votes','events','subscriptions','subscription_plans','ads',
    'ad_slots','audit_log','webhooks','translations','badges','hashtags',
    'deals','blog_posts','pages','faqs','groups','group_members','chat_rooms',
    'chat_messages','discussions','discussion_boards','discussion_replies',
    'reports','claim_requests','checkins','notifications','site_settings'
  ])
  LOOP
    EXECUTE format('CREATE POLICY "authenticated_update" ON public.%I AS PERMISSIVE FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END $$;

-- AUTHENTICATED DELETE
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users','theme_settings','module_settings','categories','subcategories',
    'filter_fields','product_types','venues','posts','follows','likes',
    'comments','ratings','saves','blocks','mutes','conversations','messages',
    'polls','poll_votes','events','subscriptions','subscription_plans','ads',
    'ad_slots','audit_log','webhooks','translations','badges','hashtags',
    'deals','blog_posts','pages','faqs','groups','group_members','chat_rooms',
    'chat_messages','discussions','discussion_boards','discussion_replies',
    'reports','claim_requests','checkins','notifications','site_settings'
  ])
  LOOP
    EXECUTE format('CREATE POLICY "authenticated_delete" ON public.%I AS PERMISSIVE FOR DELETE TO authenticated USING (true)', tbl);
  END LOOP;
END $$;

-- Also allow anon INSERT on users and site_settings for setup flow
CREATE POLICY "anon_insert_users" ON public.users AS PERMISSIVE FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_site_settings" ON public.site_settings AS PERMISSIVE FOR INSERT TO anon WITH CHECK (true);

-- Drop duplicate public_read_subscriptions since we added public_read
DROP POLICY IF EXISTS "public_read_subscriptions" ON public.subscriptions;
