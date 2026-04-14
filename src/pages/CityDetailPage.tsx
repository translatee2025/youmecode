import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import VenueCard from '@/components/directory/VenueCard';
import FullscreenLoader from '@/components/FullscreenLoader';
import { Helmet } from 'react-helmet-async';
import { Badge } from '@/components/ui/badge';

export default function CityDetailPage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const [venues, setVenues] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [siteName, setSiteName] = useState('');

  const cityName = decodeURIComponent(citySlug ?? '').replace(/-/g, ' ');

  useEffect(() => {
    if (!citySlug) return;
    supabase.from('site_settings').select('site_name').maybeSingle().then(({ data }) => {
      setSiteName((data as any)?.site_name ?? 'My Community');
    });
    supabase.from('categories').select('id, name, slug').eq('is_active', true).then(({ data }) => {
      setCategories(data ?? []);
    });
    supabase
      .from('venues')
      .select('*')
      .neq('status', 'opted_out')
      .ilike('location_city', cityName)
      .order('is_featured', { ascending: false })
      .then(({ data }) => {
        setVenues(data ?? []);
        setLoading(false);
      });
  }, [citySlug]);

  if (loading) return <FullscreenLoader />;

  const filtered = catFilter ? venues.filter((v) => v.category_id === catFilter) : venues;
  const displayCity = venues[0]?.location_city ?? cityName;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Venues in {displayCity} — {siteName}</title>
        <meta name="description" content={`Browse venues in ${displayCity} on ${siteName}`} />
        <meta property="og:title" content={`Venues in ${displayCity} — ${siteName}`} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Place',
          name: displayCity,
        })}</script>
      </Helmet>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold text-foreground capitalize">Venues in {displayCity}</h1>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Badge variant={catFilter === null ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setCatFilter(null)}>All</Badge>
            {categories.map((c) => (
              <Badge key={c.id} variant={catFilter === c.id ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setCatFilter(c.id)}>{c.name}</Badge>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => <VenueCard key={v.id} venue={v} />)}
        </div>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">No venues found in this city.</p>}
      </div>
    </div>
  );
}
