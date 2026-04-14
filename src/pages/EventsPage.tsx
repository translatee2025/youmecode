import { useEffect, useState } from 'react';
import PublicNav from '@/components/PublicNav';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import EventCard from '@/components/common/EventCard';
import FullscreenLoader from '@/components/FullscreenLoader';
import { Helmet } from 'react-helmet-async';
import { List, CalendarDays, MapPin, Plus } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { useAuthStore } from '@/stores/authStore';

export default function EventsPage() {
  const profile = useAuthStore((s) => s.profile);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [calDate, setCalDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [siteName, setSiteName] = useState('');

  useEffect(() => {
    supabase.from('site_settings').select('site_name').maybeSingle().then(({ data }) => {
      setSiteName((data as any)?.site_name ?? 'My Community');
    });
    supabase
      .from('events')
      .select('*')
      .order('start_at', { ascending: true })
      .then(({ data }) => {
        setEvents(data ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <FullscreenLoader />;

  const eventDates = events.filter((e) => e.start_at).map((e) => new Date(e.start_at));
  const dayEvents = selectedDay ? events.filter((e) => e.start_at && isSameDay(new Date(e.start_at), selectedDay)) : [];

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <Helmet>
        <title>Events — {siteName}</title>
        <meta name="description" content={`Upcoming events on ${siteName}`} />
        <meta property="og:title" content={`Events — ${siteName}`} />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-3xl font-bold text-foreground">Events</h1>
          <div className="flex items-center gap-2">
            {profile && (profile.role === 'creator' || profile.role === 'moderator') && (
              <Button asChild size="sm"><Link to="/events/create"><Plus className="h-4 w-4 mr-1" />Create Event</Link></Button>
            )}
          </div>
        </div>

        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="list"><List className="h-4 w-4 mr-1" />List</TabsTrigger>
            <TabsTrigger value="calendar"><CalendarDays className="h-4 w-4 mr-1" />Calendar</TabsTrigger>
            <TabsTrigger value="map"><MapPin className="h-4 w-4 mr-1" />Map</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((e) => (
                <Link key={e.id} to={`/events/${e.id}`}><EventCard event={e} /></Link>
              ))}
            </div>
            {events.length === 0 && <p className="text-center text-muted-foreground py-12">No events yet.</p>}
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <div className="flex flex-col md:flex-row gap-6">
              <Calendar
                mode="single"
                selected={selectedDay}
                onSelect={setSelectedDay}
                month={calDate}
                onMonthChange={setCalDate}
                className="rounded-md border border-border pointer-events-auto"
                modifiers={{ hasEvent: eventDates }}
                modifiersClassNames={{ hasEvent: 'bg-primary/20 font-bold text-primary' }}
              />
              <div className="flex-1 space-y-3">
                {selectedDay ? (
                  <>
                    <h3 className="font-semibold text-foreground">{format(selectedDay, 'MMMM d, yyyy')}</h3>
                    {dayEvents.length === 0 && <p className="text-sm text-muted-foreground">No events on this day.</p>}
                    {dayEvents.map((e) => (
                      <Link key={e.id} to={`/events/${e.id}`}><EventCard event={e} /></Link>
                    ))}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">Select a day to see events.</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="map" className="mt-4">
            <div className="glass rounded-lg p-8 text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2" />
              <p>Event map view requires Mapbox. Events with locations will be shown here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
