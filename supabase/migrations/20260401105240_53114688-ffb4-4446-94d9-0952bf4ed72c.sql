
-- ===================== 1. TENANTS & USERS =====================

CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain text UNIQUE,
  custom_domain text UNIQUE,
  name text NOT NULL,
  logo_url text,
  status text DEFAULT 'trial' CHECK (status IN ('trial','active','suspended')),
  onboarding_completed boolean DEFAULT false,
  platform_type text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  email text,
  username text,
  display_name text,
  avatar_url text,
  cover_url text,
  bio text,
  location_city text,
  location_lat numeric,
  location_lng numeric,
  role text DEFAULT 'user' CHECK (role IN ('user','moderator','venue_manager','vendor','creator','platform_admin')),
  is_verified boolean DEFAULT false,
  is_banned boolean DEFAULT false,
  followers_count int DEFAULT 0,
  following_count int DEFAULT 0,
  preferred_language text DEFAULT 'en',
  own_api_key text,
  notification_prefs jsonb DEFAULT '{}',
  custom_field_values jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX users_username_tenant ON users(tenant_id, username);
CREATE INDEX users_tenant_role ON users(tenant_id, role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON users USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON users USING (auth.jwt() ->> 'role' = 'platform_admin');

-- ===================== 2. PLATFORM SETTINGS =====================

CREATE TABLE site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES tenants(id),
  site_name text,
  site_tagline text,
  site_logo_url text,
  favicon_url text,
  contact_email text,
  social_links jsonb DEFAULT '{}',
  commerce_enabled boolean DEFAULT false,
  media_upload_mode text DEFAULT 'gallery_cam' CHECK (media_upload_mode IN ('gallery_cam','cam_only','links_only')),
  venue_label text DEFAULT 'Venues',
  product_label text DEFAULT 'Products',
  user_label text DEFAULT 'Members',
  permissions_matrix jsonb DEFAULT '{}',
  active_languages jsonb DEFAULT '["en"]',
  default_language text DEFAULT 'en',
  rtl_languages jsonb DEFAULT '["ar","he","fa","ur"]',
  translation_provider text DEFAULT 'none' CHECK (translation_provider IN ('none','openai','claude','gemini','local')),
  translation_api_key text,
  translation_model text,
  local_llm_endpoint text,
  user_api_keys_enabled boolean DEFAULT false,
  seo_title text,
  seo_description text,
  widgets_enabled boolean DEFAULT true,
  custom_css text,
  footer_html text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON site_settings USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON site_settings USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX theme_key_tenant ON theme_settings(tenant_id, key);

ALTER TABLE theme_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON theme_settings USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON theme_settings USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE module_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  module_key text NOT NULL,
  label text NOT NULL,
  is_enabled boolean DEFAULT true,
  is_homepage boolean DEFAULT false,
  show_in_nav boolean DEFAULT true,
  sort_order int DEFAULT 0,
  icon text,
  nav_label text,
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX module_key_tenant ON module_settings(tenant_id, module_key);

ALTER TABLE module_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON module_settings USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON module_settings USING (auth.jwt() ->> 'role' = 'platform_admin');

-- ===================== 3. DYNAMIC CATEGORY & FILTER SYSTEM =====================

CREATE TABLE category_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  suggested_categories jsonb DEFAULT '[]',
  suggested_subcategories jsonb DEFAULT '[]',
  suggested_filter_fields jsonb DEFAULT '[]',
  is_system boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  slug text NOT NULL,
  icon text,
  description text,
  applies_to text DEFAULT 'both' CHECK (applies_to IN ('venue','product','user','both')),
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  color text,
  image_url text,
  translations jsonb DEFAULT '{}',
  seo_title text,
  seo_description text,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX category_slug_tenant ON categories(tenant_id, slug);
CREATE INDEX category_tenant_active ON categories(tenant_id, is_active);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON categories USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON categories USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  icon text,
  description text,
  applies_to text DEFAULT 'both' CHECK (applies_to IN ('venue','product','user','both')),
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  translations jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX subcategory_slug_tenant ON subcategories(tenant_id, slug);
CREATE INDEX subcategory_category ON subcategories(category_id);

ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON subcategories USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON subcategories USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE filter_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id uuid REFERENCES subcategories(id) ON DELETE CASCADE,
  label text NOT NULL,
  field_key text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text','number','number_range','select','multiselect','boolean','date','date_range','color','url')),
  options jsonb DEFAULT '[]',
  applies_to text DEFAULT 'both' CHECK (applies_to IN ('venue','product','user','both')),
  is_required boolean DEFAULT false,
  show_in_quick_filters boolean DEFAULT false,
  show_in_card boolean DEFAULT false,
  placeholder text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  translations jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX filter_fields_category ON filter_fields(category_id);
CREATE INDEX filter_fields_subcategory ON filter_fields(subcategory_id);
CREATE UNIQUE INDEX filter_field_key_cat ON filter_fields(tenant_id, category_id, field_key);

ALTER TABLE filter_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON filter_fields USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON filter_fields USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE product_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  icon text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  translations jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX product_type_slug_tenant ON product_types(tenant_id, slug);

ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON product_types USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON product_types USING (auth.jwt() ->> 'role' = 'platform_admin');

-- ===================== 4. VENUES & PRODUCTS =====================

CREATE TABLE venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  slug text UNIQUE,
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id uuid REFERENCES subcategories(id) ON DELETE SET NULL,
  description text,
  short_description text,
  images jsonb DEFAULT '[]',
  cover_image_url text,
  location_lat numeric,
  location_lng numeric,
  location_city text,
  location_country text,
  address text,
  postcode text,
  phone text,
  email text,
  website text,
  social_links jsonb DEFAULT '{}',
  opening_hours jsonb DEFAULT '{}',
  filter_values jsonb DEFAULT '{}',
  status text DEFAULT 'unclaimed' CHECK (status IN ('unclaimed','claim_pending','claimed_directory','claimed_commerce','opted_out')),
  subscription_status text DEFAULT 'none' CHECK (subscription_status IN ('none','active','expired')),
  subscription_expires_at timestamptz,
  commerce_terms_accepted_at timestamptz,
  rating_avg numeric DEFAULT 0,
  rating_count int DEFAULT 0,
  likes_count int DEFAULT 0,
  views_count int DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX venues_tenant_status ON venues(tenant_id, status);
CREATE INDEX venues_tenant_category ON venues(tenant_id, category_id);
CREATE INDEX venues_tenant_city ON venues(tenant_id, location_city);
CREATE INDEX venues_location ON venues(location_lat, location_lng);
CREATE INDEX venues_filter_values ON venues USING GIN (filter_values);

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON venues USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON venues USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  images jsonb DEFAULT '[]',
  price numeric,
  price_unit text,
  currency text DEFAULT 'USD',
  product_type_id uuid REFERENCES product_types(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id uuid REFERENCES subcategories(id) ON DELETE SET NULL,
  payment_methods jsonb DEFAULT '[]',
  external_link text,
  filter_values jsonb DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active','hidden','pending')),
  rating_avg numeric DEFAULT 0,
  rating_count int DEFAULT 0,
  likes_count int DEFAULT 0,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX products_venue ON products(venue_id);
CREATE INDEX products_filter_values ON products USING GIN (filter_values);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON products USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON products USING (auth.jwt() ->> 'role' = 'platform_admin');

CREATE TABLE claim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  method text NOT NULL CHECK (method IN ('email_domain','document')),
  email_used text,
  document_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE claim_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON claim_requests USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
CREATE POLICY platform_admin_bypass ON claim_requests USING (auth.jwt() ->> 'role' = 'platform_admin');

-- ===================== PLATFORM ADMINS =====================

CREATE TABLE platform_admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);
