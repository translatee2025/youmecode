

# Fix: Replace Placeholder Homepage + Seed Sample Data

## Problem
The app compiles and runs but shows the default "Your app will live here" placeholder because `src/pages/Index.tsx` was never replaced with a real landing page. The database tables also have no sample data, so even navigating to /directory or /feed shows empty pages.

## Plan

### Step 1 — Build a real landing page (Index.tsx)
Replace the placeholder with a proper community landing page that reads from `src/config.ts` for branding. It will show:
- Hero section with platform name, tagline, and CTA buttons (Browse Directory, Sign Up)
- Featured venues section (queries `venues` table, shows top 4 by `is_featured` or most recent)
- Categories grid (queries `categories` table, shows active categories as cards)
- Recent posts section (queries `posts` table, shows latest 3)
- Upcoming events section (queries `events` table, shows next 3)
- Stats bar (counts of venues, members, events)
- Navigation bar at the top with links to Directory, Events, Blog, Feed, and Login/Admin
- All styled with the existing CSS variable system (--color-bg, --color-card-bg, etc.)
- If tables are empty, sections gracefully hide instead of showing empty grids

### Step 2 — Seed sample data via migration
Create a database migration that inserts removable sample data. All rows will use `DEFAULT_TENANT_ID` from config. Data includes:

- **1 site_settings row** with platform name "My Community"
- **5 categories**: Restaurants, Cafés, Fitness, Nightlife, Shopping (with slugs, icons, colors)
- **6 venues**: 2 restaurants, 1 café, 1 gym, 1 bar, 1 shop — each with name, slug, description, address, category_id, status='active', location coordinates (London area), cover_image_url using placeholder URLs
- **4 blog_posts**: Welcome post, Getting Started guide, Community Guidelines, Platform Tips — with slugs, body content, published status
- **3 events**: upcoming events in the next 30 days with titles, descriptions, dates
- **2 module_settings seeds**: ensure landing and directory modules are enabled

All sample data will have a `-- SAMPLE DATA` comment block making it easy to identify and remove. The migration will use `ON CONFLICT DO NOTHING` to be safe on re-runs.

### Step 3 — Add a shared navigation component
Create a lightweight `PublicNav` component used on the landing page and public pages. Shows:
- Platform name from config
- Links: Directory, Events, Blog, Feed
- Login button (links to /auth)
- If logged in: link to /admin (if creator role) or /settings

### Files to create/modify
1. `src/pages/Index.tsx` — complete rewrite with real landing page
2. `src/components/PublicNav.tsx` — new shared navigation bar
3. New database migration — seed sample data (categories, venues, blog posts, events, site_settings)

### Technical notes
- All Supabase inserts use `tenant_id: 'e47461d3-56e2-45cd-90ec-64e15f155a51'` (the DEFAULT_TENANT_ID)
- Cover images will use `https://images.unsplash.com/...` placeholder URLs (free, no API key needed)
- The landing page uses `useEffect` + direct Supabase queries (no React Query needed for a simple landing page)
- Navigation uses `react-router-dom` Link components

