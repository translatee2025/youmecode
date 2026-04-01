import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { useLocationStore } from '@/stores/locationStore';
import { haversine } from '@/lib/haversine';
import DynamicFilterDrawer, { type FilterValues } from '@/components/directory/DynamicFilterDrawer';
import VenueCard from '@/components/directory/VenueCard';
import UserCard from '@/components/directory/UserCard';
import DirectoryMap from '@/components/directory/DirectoryMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Filter, LayoutGrid, Map, MapPin, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;
const RADIUS_OPTIONS = [1, 5, 10, 25, 50];

export default function DirectoryPage() {
  const tenant = useTenantStore((s) => s.tenant);
  const { lat, lng, isActive: nearMeActive, radius, activate, deactivate, setRadius } = useLocationStore();

  const [tab, setTab] = useState<'venues' | 'users'>('venues');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('featured');

  const [venues, setVenues] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const [cardBadgeFields, setCardBadgeFields] = useState<{ field_key: string; label: string }[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Load categories + site settings + ads once
  useEffect(() => {
    if (!tenant) return;
    const load = async () => {
      const [catRes, settingsRes, adsRes] = await Promise.all([
        supabase.from('categories').select('id, name, icon, slug').eq('tenant_id', tenant.id).eq('is_active', true).order('sort_order'),
        supabase.from('site_settings').select('*').eq('tenant_id', tenant.id).maybeSingle(),
        supabase.from('ads').select('*').eq('tenant_id', tenant.id).eq('slot_type', 'directory_top').eq('status', 'active'),
      ]);
      setCategories(catRes.data ?? []);
      setSiteSettings(settingsRes.data);
      setAds(adsRes.data ?? []);
    };
    load();
  }, [tenant]);

  // Load subcategories when category changes
  useEffect(() => {
    if (!tenant || !selectedCategory) {
      setSubcategories([]);
      setSelectedSubcategory(null);
      return;
    }
    supabase
      .from('subcategories')
      .select('id, name, slug')
      .eq('tenant_id', tenant.id)
      .eq('category_id', selectedCategory)
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setSubcategories(data ?? []));
  }, [tenant, selectedCategory]);

  // Load card badge fields
  useEffect(() => {
    if (!tenant || !selectedCategory) {
      setCardBadgeFields([]);
      return;
    }
    supabase
      .from('filter_fields')
      .select('field_key, label')
      .eq('tenant_id', tenant.id)
      .eq('category_id', selectedCategory)
      .eq('show_in_card', true)
      .eq('is_active', true)
      .then(({ data }) => setCardBadgeFields((data as any[]) ?? []));
  }, [tenant, selectedCategory]);

  // Fetch data
  const fetchData = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!tenant) return;
      setLoading(true);

      if (tab === 'venues') {
        let q = supabase
          .from('venues' as any)
          .select('*, categories!venues_category_id_fkey(name, icon), subcategories!venues_subcategory_id_fkey(name)')
          .eq('tenant_id', tenant.id)
          .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

        if (search) q = q.ilike('name', `%${search}%`);
        if (selectedCategory) q = q.eq('category_id', selectedCategory);
        if (selectedSubcategory) q = q.eq('subcategory_id', selectedSubcategory);
        if (minRating > 0) q = q.gte('rating_avg', minRating);

        // Apply dynamic filter values
        Object.entries(filterValues).forEach(([key, val]) => {
          if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) return;
          if (typeof val === 'object' && !Array.isArray(val)) {
            // Range
            if (val.min) q = q.gte(`filter_values->>${key}` as any, val.min);
            if (val.max) q = q.lte(`filter_values->>${key}` as any, val.max);
          } else if (Array.isArray(val)) {
            q = q.contains('filter_values', { [key]: val });
          } else if (typeof val === 'boolean') {
            q = q.eq(`filter_values->>${key}` as any, String(val));
          } else {
            q = q.eq(`filter_values->>${key}` as any, val);
          }
        });

        // Sort
        if (sortBy === 'featured') q = q.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
        else if (sortBy === 'highest_rated') q = q.order('rating_avg', { ascending: false });
        else if (sortBy === 'most_recent') q = q.order('created_at', { ascending: false });
        else q = q.order('created_at', { ascending: false });

        const { data } = await q;
        const items = (data ?? []).map((v: any) => ({
          ...v,
          category_name: v.categories?.name ?? null,
          category_icon: v.categories?.icon ?? null,
          subcategory_name: v.subcategories?.name ?? null,
        }));

        if (append) setVenues((p) => [...p, ...items]);
        else setVenues(items);
        setHasMore(items.length === PAGE_SIZE);
      } else {
        let q = supabase
          .from('users' as any)
          .select('*')
          .eq('tenant_id', tenant.id)
          .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

        if (search) q = q.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
        q = q.order('created_at', { ascending: false });

        const { data } = await q;
        const items = data ?? [];
        if (append) setUsers((p) => [...p, ...items]);
        else setUsers(items);
        setHasMore(items.length === PAGE_SIZE);
      }

      setLoading(false);
    },
    [tenant, tab, search, selectedCategory, selectedSubcategory, filterValues, minRating, sortBy],
  );

  // Reset and fetch when filters change
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchData(0, false);
  }, [fetchData]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const next = page + 1;
          setPage(next);
          fetchData(next, true);
        }
      },
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, page, fetchData]);

  // Apply Near Me distance + filter
  const processedVenues = useMemo(() => {
    if (!nearMeActive || !lat || !lng) return venues;
    return venues
      .map((v) => ({
        ...v,
        _distance: v.location_lat && v.location_lng ? haversine(lat, lng, v.location_lat, v.location_lng) : null,
      }))
      .filter((v) => v._distance === null || v._distance <= radius)
      .sort((a, b) => {
        if (sortBy === 'nearest') return (a._distance ?? 9999) - (b._distance ?? 9999);
        return 0;
      });
  }, [venues, nearMeActive, lat, lng, radius, sortBy]);

  const processedUsers = useMemo(() => {
    if (!nearMeActive || !lat || !lng) return users;
    return users.map((u) => ({
      ...u,
      _distance: u.location_lat && u.location_lng ? haversine(lat, lng, u.location_lat, u.location_lng) : null,
    }));
  }, [users, nearMeActive, lat, lng]);

  const venueLabel = siteSettings?.venue_label ?? 'Venues';
  const userLabel = siteSettings?.user_label ?? 'Members';

  const activeFilterCount = Object.values(filterValues).filter(
    (v) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0),
  ).length + (minRating > 0 ? 1 : 0);

  // Build list with ad injection
  const listItems = useMemo(() => {
    const items: { type: 'venue' | 'user' | 'ad'; data: any }[] = [];
    const src = tab === 'venues' ? processedVenues : processedUsers;

    src.forEach((item, i) => {
      // Inject ad at position 0 and 10
      if (tab === 'venues' && ads.length > 0 && (i === 0 || i === 10)) {
        items.push({ type: 'ad', data: ads[0] });
      }
      items.push({ type: tab === 'venues' ? 'venue' : 'user', data: item });
    });

    return items;
  }, [tab, processedVenues, processedUsers, ads]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Top Action Bar */}
      <div className="sticky top-0 z-30 border-b border-border backdrop-blur-xl" style={{ background: 'var(--color-nav)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
          {/* Row 1: Search + controls */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${tab === 'venues' ? venueLabel.toLowerCase() : userLabel.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Button
              variant={nearMeActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => (nearMeActive ? deactivate() : activate())}
              className="shrink-0"
            >
              <MapPin className="h-4 w-4 mr-1" />
              Near Me
            </Button>

            {/* Venues / Users toggle */}
            <div className="hidden sm:flex items-center bg-secondary/50 rounded-full p-0.5">
              <button
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors',
                  tab === 'venues' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setTab('venues')}
              >
                {venueLabel}
              </button>
              <button
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors',
                  tab === 'users' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setTab('users')}
              >
                {userLabel}
              </button>
            </div>

            {/* View toggle */}
            <div className="flex items-center bg-secondary/50 rounded-lg p-0.5">
              <button
                className={cn('p-1.5 rounded-md transition-colors', view === 'list' && 'bg-primary text-primary-foreground')}
                onClick={() => setView('list')}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                className={cn('p-1.5 rounded-md transition-colors', view === 'map' && 'bg-primary text-primary-foreground')}
                onClick={() => setView('map')}
              >
                <Map className="h-4 w-4" />
              </button>
            </div>

            <Button variant="outline" size="sm" onClick={() => setFilterOpen(true)} className="shrink-0 relative">
              <Filter className="h-4 w-4 mr-1" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 text-[9px] bg-primary text-primary-foreground">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Near Me radius slider */}
          {nearMeActive && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Radius:</span>
              <div className="flex gap-1">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                      radius === r ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 hover:bg-secondary',
                    )}
                  >
                    {r}km
                  </button>
                ))}
                <button
                  onClick={() => setRadius(999)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                    radius === 999 ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 hover:bg-secondary',
                  )}
                >
                  Any
                </button>
              </div>
            </div>
          )}

          {/* Mobile tab toggle */}
          <div className="flex sm:hidden items-center bg-secondary/50 rounded-full p-0.5 w-full">
            <button
              className={cn(
                'flex-1 py-1.5 rounded-full text-xs font-medium transition-colors text-center',
                tab === 'venues' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}
              onClick={() => setTab('venues')}
            >
              {venueLabel}
            </button>
            <button
              className={cn(
                'flex-1 py-1.5 rounded-full text-xs font-medium transition-colors text-center',
                tab === 'users' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}
              onClick={() => setTab('users')}
            >
              {userLabel}
            </button>
          </div>
        </div>

        {/* Category Quick Tabs */}
        {tab === 'venues' && categories.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 pb-2">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                  !selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary',
                )}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCategory(c.id); setSelectedSubcategory(null); }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 flex items-center gap-1',
                    selectedCategory === c.id ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary',
                  )}
                >
                  {c.icon && <span>{c.icon}</span>}
                  {c.name}
                </button>
              ))}
            </div>

            {/* Subcategory pills */}
            {selectedCategory && subcategories.length > 0 && (
              <div className="flex gap-1.5 mt-1.5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setSelectedSubcategory(null)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors shrink-0',
                    !selectedSubcategory ? 'bg-accent text-accent-foreground' : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50',
                  )}
                >
                  All
                </button>
                {subcategories.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSubcategory(s.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors shrink-0',
                      selectedSubcategory === s.id ? 'bg-accent text-accent-foreground' : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50',
                    )}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {view === 'list' ? (
          <>
            <div
              className={cn(
                'grid gap-4',
                tab === 'venues'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
              )}
            >
              {listItems.map((item, i) => {
                if (item.type === 'ad') {
                  return (
                    <a
                      key={`ad-${i}`}
                      href={item.data.link_url ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass overflow-hidden relative group"
                    >
                      {item.data.media_url && (
                        <img src={item.data.media_url} alt={item.data.headline ?? 'Ad'} className="w-full aspect-video object-cover" loading="lazy" />
                      )}
                      <div className="p-3">
                        <Badge className="text-[9px] bg-amber-500/20 text-amber-400 border-amber-500/30 mb-1">Sponsored</Badge>
                        {item.data.headline && <p className="text-sm font-medium text-foreground">{item.data.headline}</p>}
                      </div>
                    </a>
                  );
                }
                if (item.type === 'venue') {
                  return (
                    <VenueCard
                      key={item.data.id}
                      venue={item.data}
                      distance={item.data._distance ?? null}
                      cardBadgeFields={cardBadgeFields}
                    />
                  );
                }
                return <UserCard key={item.data.id} user={item.data} distance={item.data._distance ?? null} />;
              })}
            </div>

            {loading && (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && listItems.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg font-medium">No results found</p>
                <p className="text-sm mt-1">Try adjusting your filters or search query</p>
              </div>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />
          </>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4" style={{ height: 'calc(100vh - 180px)' }}>
            <DirectoryMap venues={processedVenues} />
            {/* Side list */}
            <div className="w-full lg:w-[300px] overflow-y-auto space-y-3 max-h-[50vh] lg:max-h-full">
              {processedVenues.map((v) => (
                <VenueCard key={v.id} venue={v} distance={v._distance ?? null} cardBadgeFields={cardBadgeFields} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      <DynamicFilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        categoryId={selectedCategory}
        subcategoryId={selectedSubcategory}
        filterValues={filterValues}
        onApply={setFilterValues}
        minRating={minRating}
        onMinRatingChange={setMinRating}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />
    </div>
  );
}
