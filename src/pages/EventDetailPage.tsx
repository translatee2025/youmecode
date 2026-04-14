import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ShareButton from '@/components/common/ShareButton';
import CommentSection from '@/components/common/CommentSection';
import FullscreenLoader from '@/components/FullscreenLoader';
import NotFound from '@/pages/NotFound';
import { Helmet } from 'react-helmet-async';
import { Calendar, MapPin, Users, ExternalLink, ArrowLeft, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const profile = useAuthStore((s) => s.profile);
  const [event, setEvent] = useState<any>(null);
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [siteName, setSiteName] = useState('');

  useEffect(() => {
    if (!tenant || !id) return;
    supabase.from('site_settings').select('site_name').maybeSingle().then(({ data }) => {
      setSiteName((data as any)?.site_name ?? tenant.name);
    });
    supabase.from('events').select('*').eq('id', id).maybeSingle().then(async ({ data }) => {
      setEvent(data);
      if (data?.venue_id) {
        const { data: v } = await supabase.from('venues').select('name, slug').eq('id', data.venue_id).maybeSingle();
        setVenue(v);
      }
      setLoading(false);
    });
  }, [tenant, id]);

  if (loading) return <FullscreenLoader />;
  if (!event) return <NotFound />;

  const title = `${event.title} — ${siteName}`;
  const spotsLeft = event.capacity ? Math.max(0, event.capacity - (event.attendees_count ?? 0)) : null;

  const googleCalUrl = () => {
    const s = event.start_at ? format(new Date(event.start_at), "yyyyMMdd'T'HHmmss") : '';
    const e2 = event.end_at ? format(new Date(event.end_at), "yyyyMMdd'T'HHmmss") : s;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${s}/${e2}&location=${encodeURIComponent(event.address ?? '')}&details=${encodeURIComponent(event.description ?? '')}`;
  };

  const handleRsvp = async () => {
    if (!profile || !tenant) return;
    await supabase.from('events').update({ attendees_count: (event.attendees_count ?? 0) + 1 } as any).eq('id', event.id);
    setEvent({ ...event, attendees_count: (event.attendees_count ?? 0) + 1 });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={event.description?.slice(0, 160) ?? ''} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={event.description?.slice(0, 160) ?? ''} />
        {event.cover_image_url && <meta property="og:image" content={event.cover_image_url} />}
        <meta property="og:type" content="event" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Event',
          name: event.title, startDate: event.start_at, endDate: event.end_at,
          location: event.address ? { '@type': 'Place', name: event.address, address: event.address } : undefined,
          image: event.cover_image_url,
          offers: event.is_free ? { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' }
            : event.price ? { '@type': 'Offer', price: String(event.price), priceCurrency: event.currency ?? 'USD' } : undefined,
        })}</script>
      </Helmet>

      {event.cover_image_url && (
        <div className="w-full max-h-[350px] overflow-hidden">
          <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Link to="/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>

        <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>

        <div className="flex flex-wrap gap-3 items-center">
          {event.is_free ? <Badge variant="secondary">Free</Badge> : event.price ? <Badge variant="secondary">{event.currency ?? '$'}{event.price}</Badge> : null}
          <Badge variant="outline">{event.status ?? 'upcoming'}</Badge>
          {venue && <Link to={`/venues/${venue.slug}`} className="text-sm text-primary hover:underline">📍 {venue.name}</Link>}
        </div>

        <div className="glass rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {event.start_at ? format(new Date(event.start_at), 'EEEE, MMMM d, yyyy · h:mm a') : 'TBD'}
            {event.end_at && <span className="text-muted-foreground">— {format(new Date(event.end_at), 'h:mm a')}</span>}
          </div>
          {event.address && (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="h-4 w-4 text-muted-foreground" /> {event.address}
            </div>
          )}
          {spotsLeft !== null && (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Users className="h-4 w-4 text-muted-foreground" /> {spotsLeft} spots remaining
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> {event.attendees_count ?? 0} attending
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {event.ticket_link ? (
            <Button asChild><a href={event.ticket_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-1" />Get Ticket</a></Button>
          ) : (
            <Button onClick={handleRsvp} disabled={!profile}>RSVP</Button>
          )}
          <Button variant="outline" asChild>
            <a href={googleCalUrl()} target="_blank" rel="noopener noreferrer"><CalendarPlus className="h-4 w-4 mr-1" />Add to Calendar</a>
          </Button>
          <ShareButton title={event.title} />
        </div>

        {event.description && (
          <div className="prose prose-invert max-w-none text-foreground/90" dangerouslySetInnerHTML={{ __html: event.description.replace(/\n/g, '<br />') }} />
        )}

        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Comments</h3>
          <CommentSection entityType="event" entityId={event.id} />
        </div>
      </div>
    </div>
  );
}
