
-- ===================== 6. MESSAGING & COMMUNITY =====================

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  participants uuid[] NOT NULL,
  last_message text,
  last_message_at timestamptz,
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX conversations_participants ON conversations USING GIN (participants);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON conversations USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON conversations USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE SET NULL,
  content text,
  original_content text,
  translated_content jsonb DEFAULT '{}',
  media_url text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX messages_conversation ON messages(conversation_id, created_at);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON messages USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON messages USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  description text,
  avatar_url text,
  cover_url text,
  creator_id uuid REFERENCES users(id) ON DELETE SET NULL,
  member_count int DEFAULT 0,
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON groups USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON groups USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('member','moderator','admin')),
  joined_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX group_members_unique ON group_members(group_id, user_id);
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON group_members USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON group_members USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  type text DEFAULT 'public' CHECK (type IN ('public','venue','group')),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON chat_rooms USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON chat_rooms USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE SET NULL,
  content text,
  media_url text,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX chat_messages_room ON chat_messages(room_id, created_at);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON chat_messages USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON chat_messages USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE discussion_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  description text,
  icon text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE discussion_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON discussion_boards USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON discussion_boards USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  board_id uuid REFERENCES discussion_boards(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text,
  replies_count int DEFAULT 0,
  views_count int DEFAULT 0,
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON discussions USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON discussions USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE discussion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  discussion_id uuid REFERENCES discussions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  parent_id uuid REFERENCES discussion_replies(id),
  content text NOT NULL,
  likes_count int DEFAULT 0,
  is_hidden boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON discussion_replies USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON discussion_replies USING (auth.jwt() ->> 'role' = 'platform_admin');

-- ===================== 7. COMMERCE =====================

CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  description text,
  price_monthly numeric,
  price_quarterly numeric,
  price_annual numeric,
  currency text DEFAULT 'USD',
  features jsonb DEFAULT '[]',
  stripe_monthly_price_id text,
  stripe_quarterly_price_id text,
  stripe_annual_price_id text,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON subscription_plans USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON subscription_plans USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  subscriber_type text NOT NULL CHECK (subscriber_type IN ('creator','vendor')),
  subscriber_id uuid NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id),
  status text DEFAULT 'active' CHECK (status IN ('active','expired','cancelled','paused')),
  provider text CHECK (provider IN ('stripe','paypal','razorpay','manual')),
  provider_subscription_id text,
  provider_customer_id text,
  amount numeric,
  currency text,
  billing_cycle text CHECK (billing_cycle IN ('monthly','quarterly','annual')),
  starts_at timestamptz,
  expires_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON subscriptions USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON subscriptions USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE ad_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  slot_type text NOT NULL CHECK (slot_type IN ('reel_between','wall_between','directory_top','venue_page')),
  price_weekly numeric,
  price_monthly numeric,
  currency text DEFAULT 'USD',
  max_active int DEFAULT 1,
  is_enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX ad_slots_type_tenant ON ad_slots(tenant_id, slot_type);
ALTER TABLE ad_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ad_slots USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON ad_slots USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
  slot_type text NOT NULL,
  media_url text,
  link_url text,
  headline text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','active','paused','expired','rejected')),
  starts_at timestamptz,
  expires_at timestamptz,
  impressions int DEFAULT 0,
  clicks int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ads USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON ads USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  valid_from timestamptz,
  valid_to timestamptz,
  terms_url text,
  badge_label text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON deals USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON deals USING (auth.jwt() ->> 'role' = 'platform_admin');

-- ===================== 8. CONTENT =====================

CREATE TABLE pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  slug text NOT NULL,
  title text NOT NULL,
  content_blocks jsonb DEFAULT '[]',
  is_published boolean DEFAULT false,
  show_in_nav boolean DEFAULT false,
  nav_label text,
  sort_order int DEFAULT 0,
  seo_title text,
  seo_description text,
  og_image_url text,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX pages_slug_tenant ON pages(tenant_id, slug);
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON pages USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON pages USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL,
  content text,
  excerpt text,
  cover_image_url text,
  tags text[] DEFAULT '{}',
  is_published boolean DEFAULT false,
  published_at timestamptz,
  scheduled_at timestamptz,
  views_count int DEFAULT 0,
  seo_title text,
  seo_description text,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX blog_slug_tenant ON blog_posts(tenant_id, slug);
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON blog_posts USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON blog_posts USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON faqs USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON faqs USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  venue_id uuid REFERENCES venues(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  cover_image_url text,
  start_at timestamptz,
  end_at timestamptz,
  location_lat numeric,
  location_lng numeric,
  address text,
  capacity int,
  attendees_count int DEFAULT 0,
  ticket_link text,
  is_free boolean DEFAULT true,
  price numeric,
  currency text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming','live','past','cancelled')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX events_tenant_start ON events(tenant_id, start_at);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON events USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON events USING (auth.jwt() ->> 'role' = 'platform_admin');

-- ===================== 9. SYSTEM TABLES =====================

CREATE TABLE translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  language_code text NOT NULL,
  string_key text NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX translations_unique ON translations(tenant_id,language_code,string_key);
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON translations USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON translations USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  description text,
  icon text,
  trigger_type text,
  trigger_threshold int,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON badges USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON badges USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX user_badges_unique ON user_badges(user_id, badge_id);
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON user_badges USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON user_badges USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  entity_type text,
  entity_id uuid,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX notifications_user ON notifications(user_id, created_at DESC);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON notifications USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON notifications USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX audit_log_tenant ON audit_log(tenant_id, created_at DESC);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON audit_log USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON audit_log USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  url text NOT NULL,
  secret text,
  events jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON webhooks USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON webhooks USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  webhook_id uuid REFERENCES webhooks(id) ON DELETE CASCADE,
  event text,
  payload jsonb,
  status_code int,
  response_body text,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON webhook_logs USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON webhook_logs USING (auth.jwt() ->> 'role' = 'platform_admin');

-- ===================== DEFAULT BADGES TRIGGER =====================

CREATE OR REPLACE FUNCTION insert_default_badges()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO badges (tenant_id, name, description, icon, trigger_type, trigger_threshold)
  VALUES
    (NEW.id, 'First Post', 'Posted for the first time', 'edit', 'first_post', 1),
    (NEW.id, 'First Review', 'Wrote your first review', 'star', 'first_review', 1),
    (NEW.id, 'Explorer', 'First check-in', 'map-pin', 'first_checkin', 1),
    (NEW.id, 'Rising Star', '10 followers', 'trending-up', 'followers', 10),
    (NEW.id, 'Influencer', '100 followers', 'users', 'followers', 100),
    (NEW.id, 'Community Hero', '1000 followers', 'award', 'followers', 1000),
    (NEW.id, 'Venue Owner', 'Claimed a venue', 'building', 'venue_claimed', 1),
    (NEW.id, 'Verified Business', 'Activated commerce', 'badge-check', 'venue_verified', 1),
    (NEW.id, 'Reviewer x10', '10 reviews written', 'star', 'reviews', 10),
    (NEW.id, 'Reviewer x50', '50 reviews written', 'star', 'reviews', 50),
    (NEW.id, 'Prolific Poster', '50 posts', 'feather', 'posts', 50);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_tenant_created
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION insert_default_badges();
