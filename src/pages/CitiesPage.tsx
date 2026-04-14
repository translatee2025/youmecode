import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import FullscreenLoader from '@/components/FullscreenLoader';
import { Helmet } from 'react-helmet-async';
import { MapPin } from 'lucide-react';

export default function CitiesPage() {
  const [cities, setCities] = useState<{ city: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteName, setSiteName] = useState('');

  useEffect(() => {
    supabase.from('site_settings').select('site_name').maybeSingle().then(({ data }) => {
      setSiteName((data as any)?.site_name ?? 'My Community');
    });
    supabase
      .from('venues')
      .select('location_city')
      .neq('status', 'opted_out')
      .not('location_city', 'is', null)
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        (data ?? []).forEach((v: any) => {
          const c = v.location_city?.trim();
          if (c) counts[c] = (counts[c] ?? 0) + 1;
        });
        setCities(Object.entries(counts).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count));
        setLoading(false);
      });
  }, []);

  if (loading) return <FullscreenLoader />;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Cities — {siteName}</title>
        <meta name="description" content={`Browse by city on ${siteName}`} />
        <meta property="og:title" content={`Cities — ${siteName}`} />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Cities</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {cities.map((c) => (
            <Link key={c.city} to={`/city/${encodeURIComponent(c.city.toLowerCase().replace(/\s+/g, '-'))}`}
              className="glass rounded-lg p-5 hover:scale-[1.02] transition-all flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="font-semibold text-foreground">{c.city}</div>
                <div className="text-sm text-muted-foreground">{c.count} venue{c.count !== 1 ? 's' : ''}</div>
              </div>
            </Link>
          ))}
        </div>
        {cities.length === 0 && <p className="text-center text-muted-foreground py-12">No cities with venues yet.</p>}
      </div>
    </div>
  );
}
