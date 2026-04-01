
CREATE OR REPLACE FUNCTION insert_default_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;
