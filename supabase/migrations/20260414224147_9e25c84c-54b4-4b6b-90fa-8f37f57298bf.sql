
DO $$
DECLARE
  tid uuid := 'e47461d3-56e2-45cd-90ec-64e15f155a51';
  cat_restaurants uuid := gen_random_uuid();
  cat_cafes uuid := gen_random_uuid();
  cat_fitness uuid := gen_random_uuid();
  cat_nightlife uuid := gen_random_uuid();
  cat_shopping uuid := gen_random_uuid();
BEGIN

INSERT INTO public.categories (id, tenant_id, name, slug, icon, color, description, sort_order, is_active)
VALUES
  (cat_restaurants, tid, 'Restaurants', 'restaurants', 'utensils', '#e85d3a', 'Dining and restaurants', 1, true),
  (cat_cafes, tid, 'Cafés', 'cafes', 'coffee', '#8b7355', 'Coffee shops and tea houses', 2, true),
  (cat_fitness, tid, 'Fitness', 'fitness', 'dumbbell', '#2dd4a8', 'Gyms and fitness studios', 3, true),
  (cat_nightlife, tid, 'Nightlife', 'nightlife', 'music', '#6c5ce7', 'Bars, clubs and nightlife', 4, true),
  (cat_shopping, tid, 'Shopping', 'shopping', 'shopping-bag', '#3b82f6', 'Retail and shopping', 5, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.venues (tenant_id, name, slug, description, address, location_city, category_id, status, location_lat, location_lng, cover_image_url, is_featured, rating_avg, rating_count)
VALUES
  (tid, 'The Golden Fork', 'the-golden-fork', 'Award-winning modern European cuisine in the heart of the city.', '42 High Street', 'London', cat_restaurants, 'claimed_directory', 51.5074, -0.1278, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', true, 4.5, 28),
  (tid, 'Sakura Garden', 'sakura-garden', 'Authentic Japanese dining with a beautiful zen garden setting.', '15 Cherry Lane', 'London', cat_restaurants, 'claimed_directory', 51.5124, -0.1358, 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800', true, 4.7, 42),
  (tid, 'Bean & Brew', 'bean-and-brew', 'Artisan coffee roasters with cozy seating and fresh pastries.', '8 Mill Road', 'London', cat_cafes, 'claimed_directory', 51.5204, -0.1418, 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800', true, 4.3, 65),
  (tid, 'Iron Temple Gym', 'iron-temple-gym', 'State-of-the-art fitness facility with personal training.', '200 Fitness Avenue', 'London', cat_fitness, 'unclaimed', 51.4974, -0.1178, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', false, 4.6, 31),
  (tid, 'Velvet Lounge', 'velvet-lounge', 'Premium cocktail bar with live jazz music every weekend.', '55 Nightfall Street', 'London', cat_nightlife, 'claimed_directory', 51.5154, -0.1298, 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800', true, 4.4, 19),
  (tid, 'Urban Market', 'urban-market', 'Curated lifestyle store featuring local designers.', '33 Market Square', 'London', cat_shopping, 'unclaimed', 51.5094, -0.1238, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800', false, 4.2, 15)
ON CONFLICT DO NOTHING;

INSERT INTO public.blog_posts (tenant_id, title, slug, content, excerpt, is_published, published_at, tags, cover_image_url)
VALUES
  (tid, 'Welcome to Our Community', 'welcome-to-our-community', 'We are thrilled to launch our community platform! Discover the best venues, share experiences, and connect with each other.', 'Discover the best local venues and connect with your community.', true, now(), ARRAY['welcome','community'], 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800'),
  (tid, 'Getting Started Guide', 'getting-started-guide', 'New here? Browse the directory, filter by category, read reviews, and save your favorites.', 'Everything you need to know to start using the platform.', true, now() - interval '1 day', ARRAY['guide','help'], 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800'),
  (tid, 'Community Guidelines', 'community-guidelines', 'Be respectful, write honest reviews, do not post spam, and report inappropriate behavior.', 'Our rules for keeping the community positive and safe.', true, now() - interval '2 days', ARRAY['rules','community'], 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800'),
  (tid, 'Top 5 Hidden Gems This Month', 'top-5-hidden-gems', 'Every month we highlight venues that deserve more attention from our community members.', 'Discover underrated venues you might have missed.', true, now() - interval '3 days', ARRAY['featured','venues'], 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800')
ON CONFLICT DO NOTHING;

INSERT INTO public.events (tenant_id, title, description, start_at, end_at, address, is_free, status, cover_image_url)
VALUES
  (tid, 'Community Meetup', 'Join us for our monthly community meetup! Meet fellow members and discover new venues together.', now() + interval '7 days', now() + interval '7 days' + interval '3 hours', 'Bean & Brew, 8 Mill Road, London', true, 'upcoming', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800'),
  (tid, 'Food Festival Weekend', 'A celebration of local food culture featuring pop-up kitchens from the best restaurants in town.', now() + interval '14 days', now() + interval '16 days', 'Market Square, London', false, 'upcoming', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800'),
  (tid, 'Live Jazz Night', 'An evening of smooth jazz featuring top musicians. Cocktail specials all night.', now() + interval '21 days', now() + interval '21 days' + interval '4 hours', 'Velvet Lounge, 55 Nightfall Street', false, 'upcoming', 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800')
ON CONFLICT DO NOTHING;

INSERT INTO public.module_settings (tenant_id, module_key, label, is_enabled, show_in_nav, sort_order, icon)
VALUES
  (tid, 'landing', 'Landing Page', true, false, 0, 'home'),
  (tid, 'directory', 'Directory', true, true, 1, 'map'),
  (tid, 'feed', 'Feed', true, true, 2, 'rss'),
  (tid, 'events', 'Events', true, true, 3, 'calendar'),
  (tid, 'blog', 'Blog', true, true, 4, 'book-open')
ON CONFLICT DO NOTHING;

END $$;
