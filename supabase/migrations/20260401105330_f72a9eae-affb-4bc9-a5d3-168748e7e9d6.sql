
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  content text,
  media_urls jsonb DEFAULT '[]',
  post_type text DEFAULT 'wall' CHECK (post_type IN ('wall','reel')),
  video_url text,
  thumbnail_url text,
  location_lat numeric,
  location_lng numeric,
  location_city text,
  venue_id uuid REFERENCES venues(id) ON DELETE SET NULL,
  hashtags text[] DEFAULT '{}',
  likes_count int DEFAULT 0,
  comments_count int DEFAULT 0,
  views_count int DEFAULT 0,
  is_pinned boolean DEFAULT false,
  scheduled_at timestamptz,
  poll_id uuid,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX posts_tenant_type ON posts(tenant_id, post_type, created_at DESC);
CREATE INDEX posts_scheduled ON posts(scheduled_at) WHERE scheduled_at IS NOT NULL;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON posts USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON posts USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_type text NOT NULL CHECK (followee_type IN ('user','venue','hashtag')),
  followee_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX follows_unique ON follows(tenant_id,follower_id,followee_type,followee_id);
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON follows USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON follows USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('post','venue','product','comment')),
  entity_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX likes_unique ON likes(tenant_id,user_id,entity_type,entity_id);
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON likes USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON likes USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('post','venue','product','user','event','blog_post')),
  entity_id uuid NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  likes_count int DEFAULT 0,
  is_hidden boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX comments_entity ON comments(entity_type, entity_id);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON comments USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON comments USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('venue','product','user')),
  entity_id uuid NOT NULL,
  score int NOT NULL CHECK (score BETWEEN 1 AND 5),
  review_text text,
  status text DEFAULT 'active' CHECK (status IN ('active','flagged','hidden')),
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX ratings_unique ON ratings(tenant_id,user_id,entity_type,entity_id);
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ratings USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON ratings USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collection_name text DEFAULT 'Saved',
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON saves USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON saves USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  blocker_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX blocks_unique ON blocks(tenant_id,blocker_id,blocked_id);
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON blocks USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON blocks USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE mutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  muter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  muted_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE mutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON mutes USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON mutes USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  reporter_id uuid REFERENCES users(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  reason text NOT NULL,
  detail text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','reviewed','actioned','dismissed')),
  reviewed_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON reports USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON reports USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  tag text NOT NULL,
  posts_count int DEFAULT 0,
  followers_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX hashtags_tag_tenant ON hashtags(tenant_id, tag);
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON hashtags USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON hashtags USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON checkins USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON checkins USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  ends_at timestamptz,
  total_votes int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON polls USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON polls USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  option_index int NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX poll_votes_unique ON poll_votes(poll_id, user_id);
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON poll_votes USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON poll_votes USING (auth.jwt() ->> 'role' = 'platform_admin');
