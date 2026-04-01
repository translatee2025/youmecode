

# Bug Fix & Performance Plan

## Critical Issues Found

### 1. RLS Policies Block ALL Data Access (SHOWSTOPPER)
Every table except `tenants` uses `tenant_isolation` RLS policy with `current_setting('app.tenant_id', true)::uuid`. This PostgreSQL session variable is **never set** by the Supabase JS client. Result: every query to every table returns 0 rows or silently fails on insert/update. The entire app is non-functional beyond the initial tenant fetch.

**Fix:** Replace all `tenant_isolation` policies across all tables (~30 tables) with a simple `true` USING expression. Since this is a one-deployment-per-tenant architecture, there is only ever one tenant. The tenant_id column and `.eq('tenant_id', tenant.id)` filters in application code already provide the logical scoping. The RLS policies should allow authenticated users to read/write within their tenant, and anon users to read public data.

New policies per table:
- **SELECT**: `USING (true)` for public-readable tables (venues, categories, posts, events, etc.)
- **INSERT**: `USING (auth.uid() IS NOT NULL)` for authenticated writes, plus `WITH CHECK (true)` 
- **UPDATE/DELETE**: `USING (auth.uid() IS NOT NULL)` for authenticated users
- Keep `platform_admin_bypass` policies as-is

### 2. SetupPage Broken on Fresh Deploy (SHOWSTOPPER)
`SetupPage` line 22: `if (!tenant) return;` — on a fresh deploy there's no tenant row, so `tenant` is null, the useEffect never runs, `checking` stays `true`, and the page shows FullscreenLoader forever.

Also, SetupPage never creates a `tenants` row — it assumes one already exists.

**Fix:** Rewrite SetupPage to:
- Remove the tenant dependency for initial render
- On submit: first INSERT into `tenants` table, capture returned ID, then create auth user, users row, and site_settings row
- Store new tenant in Zustand and redirect to `/onboarding`

### 3. AuthPage Calls navigate() During Render
Line 22-24: `if (session) { navigate('/', { replace: true }); return null; }` — calling navigate during render is invalid React.

**Fix:** Move to a `useEffect` or use `<Navigate>` component.

### 4. Console Warning: Function Components Given Refs
`FullscreenLoader` and `SetupPage` are function components being passed refs by React Router. 

**Fix:** This is a React Router internal ref-passing issue — not critical but noisy. Can be suppressed by ensuring components are proper function declarations (already are), so this is a React Router v6 known warning with lazy routes. Low priority.

### 5. ThemeProvider/LanguageProvider Queries Fail Silently
These query `theme_settings`, `site_settings`, and `translations` tables — all blocked by RLS. They fail silently and use defaults, which is why the app still renders but with no custom data.

**Fix:** Resolved by fix #1 (RLS).

### 6. Auth Provider Never Sets Loading to False on No-Tenant
`AuthProvider` has `if (!tenant) return;` in useEffect — when there's no tenant, `isLoading` stays `true` in auth store. Any `RequireAuth` guard shows FullscreenLoader forever.

**Fix:** Add early `setLoading(false)` when tenant is null.

## Implementation Plan

### Step 1: Database Migration — Fix RLS Policies
Single migration that:
- Drops all `tenant_isolation` policies on every table
- Creates new permissive policies:
  - `public_read` (SELECT, USING true) on public-facing tables
  - `authenticated_insert` (INSERT, for authenticated role)
  - `authenticated_modify` (UPDATE/DELETE, for authenticated role)
- Keeps `platform_admin_bypass` untouched
- Adds public read + authenticated write to `site_settings`

Tables to update: `users`, `site_settings`, `theme_settings`, `module_settings`, `categories`, `subcategories`, `filter_fields`, `product_types`, `venues`, `products`, `claim_requests`, `posts`, `follows`, `likes`, `comments`, `ratings`, `saves`, `blocks`, `mutes`, `conversations`, `messages`, `polls`, `poll_votes`, `events`, `subscriptions`, `subscription_plans`, `ads`, `ad_slots`, `audit_log`, `webhooks`, `translations`, `badges`, `hashtags`, `deals`, `blog_posts`, `pages`, `faqs`, `groups`, `group_members`, `chat_rooms`, `discussions`, `discussion_boards`, `discussion_replies`, `reports`

### Step 2: Fix SetupPage
- Remove tenant null-guard on render
- Create tenant row on submit (INSERT into `tenants`)
- Then create auth user, users row, site_settings row
- Store tenant in Zustand, redirect to `/onboarding`

### Step 3: Fix AuthPage Navigate During Render
- Replace imperative `navigate()` with `<Navigate>` component

### Step 4: Fix AuthProvider Loading State
- When tenant is null, set `isLoading: false` so guards don't hang

### Step 5: Fix TenantGate for Setup Flow
- Allow `/setup` and `/auth` paths when no tenant exists without infinite redirect loops

## Performance Notes
- No major performance issues detected — the app is lightweight
- All Supabase queries use `.eq('tenant_id')` filters which are indexed
- React Query is configured with defaults (fine for this scale)
- The real "performance" problem is that nothing works due to RLS — fixing that resolves perceived slowness

## Files to Modify
1. New migration SQL (RLS policy replacement)
2. `src/pages/SetupPage.tsx` (fix fresh deploy flow)
3. `src/pages/AuthPage.tsx` (fix navigate during render)
4. `src/providers/AuthProvider.tsx` (fix loading state)
5. `src/App.tsx` (minor TenantGate adjustments)

