import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LikeButton from '@/components/common/LikeButton';
import FollowButton from '@/components/common/FollowButton';
import ShareButton from '@/components/common/ShareButton';
import SaveButton from '@/components/common/SaveButton';
import CommentSection from '@/components/common/CommentSection';
import RatingDisplay from '@/components/common/RatingDisplay';
import DynamicFilterValues from '@/components/common/DynamicFilterValues';
import EventCard from '@/components/common/EventCard';
import PaymentMethodBadges from '@/components/common/PaymentMethodBadges';
import FullscreenLoader from '@/components/FullscreenLoader';
import {
  MapPin, Phone, Mail, Globe, Clock, CheckCircle2, ShieldCheck, AlertCircle,
  ChevronLeft, ChevronRight, MapPinned, Zap, Eye, Users, Star, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VenueDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const profile = useAuthStore((s) => s.profile);
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      const [venueRes, settingsRes] = await Promise.all([
        supabase.from('venues' as any).select('*').eq('slug', slug).maybeSingle() as any,
        supabase.from('site_settings').select('*').maybeSingle(),
      ]);
      const v = venueRes.data as any;
      if (!v) { setLoading(false); return; }
      setVenue(v);
      setSiteSettings(settingsRes.data);

      // Increment view count
      (supabase.from('venues' as any) as any).update({ views_count: (v.views_count ?? 0) + 1 }).eq('id', v.id).then();

      // Load related data in parallel
      const [prodRes, evtRes, dealRes] = await Promise.all([
        supabase.from('products').select('*').eq('venue_id', v.id).eq('status', 'active').order('sort_order'),
        supabase.from('events').select('*').eq('venue_id', v.id).order('start_at'),
        supabase.from('deals').select('*').eq('venue_id', v.id).eq('is_active', true),
      ]);
      setProducts(prodRes.data ?? []);
      setEvents(evtRes.data ?? []);
      setDeals(dealRes.data ?? []);
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) return <FullscreenLoader />;
  if (!venue) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Venue not found</div>;

  const isOwner = profile && (profile.id === venue.owner_id || profile.role === 'creator' || profile.role === 'moderator');
  const showCommerceTab = venue.status === 'claimed_commerce' && siteSettings?.commerce_enabled;
  const images: string[] = [venue.cover_image_url, ...((venue.images as string[]) ?? [])].filter(Boolean);

  const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    claimed_commerce: { label: 'Verified', icon: ShieldCheck, className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    claimed_directory: { label: 'Listed', icon: CheckCircle2, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    unclaimed: { label: 'Unclaimed', icon: AlertCircle, className: 'bg-muted text-muted-foreground border-border' },
  };
  const st = statusConfig[venue.status] ?? statusConfig.unclaimed;
  const StatusIcon = st.icon;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Helmet>
        <title>{venue.name} — {siteSettings?.site_name ?? 'My Community'}</title>
        <meta name="description" content={venue.short_description || venue.description?.slice(0, 160) || ''} />
        <meta property="og:title" content={venue.name} />
        <meta property="og:description" content={venue.short_description || venue.description?.slice(0, 160) || ''} />
        {venue.cover_image_url && <meta property="og:image" content={venue.cover_image_url} />}
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'LocalBusiness',
          name: venue.name,
          address: { '@type': 'PostalAddress', streetAddress: venue.address, addressLocality: venue.location_city },
          telephone: venue.phone, url: venue.website,
          ...(venue.rating_count > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: venue.rating_avg, reviewCount: venue.rating_count } } : {}),
        })}</script>
      </Helmet>
      {/* Hero */}
      <div className="relative">
        {images.length > 0 ? (
          <div className="relative aspect-[21/9] max-h-[400px] overflow-hidden">
            <img src={images[0]} alt={venue.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
          </div>
        ) : (
          <div className="aspect-[21/9] max-h-[400px] flex items-center justify-center text-6xl font-bold text-muted-foreground/30"
            style={{ background: 'linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--accent)))' }}>
            {venue.name?.charAt(0)?.toUpperCase()}
          </div>
        )}

        {/* Gallery thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-1">
            {images.slice(0, 5).map((img: string, i: number) => (
              <button key={i} onClick={() => setGalleryIndex(i)} className="w-12 h-12 rounded-lg overflow-hidden border-2 border-background/50 hover:border-primary transition-colors">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
            {images.length > 5 && (
              <button onClick={() => setGalleryIndex(5)} className="w-12 h-12 rounded-lg bg-secondary/80 flex items-center justify-center text-xs font-medium text-foreground">
                +{images.length - 5}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-12 relative z-10">
        {/* Title section */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{venue.name}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="outline" className={cn('text-xs', st.className)}>
                  <StatusIcon className="h-3 w-3 mr-1" />{st.label}
                </Badge>
                {venue.category_name && <Badge variant="secondary" className="text-xs">{venue.category_name}</Badge>}
                {venue.subcategory_name && <Badge variant="outline" className="text-xs">{venue.subcategory_name}</Badge>}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {[venue.address, venue.city, venue.country].filter(Boolean).join(', ')}
              </div>
            </div>
          </div>

          {/* Status + claim bar */}
          {venue.status === 'unclaimed' && (
            <div className="glass p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">This venue hasn't been claimed yet</span>
              <Button size="sm" variant="outline" asChild>
                <Link to={`/claim/${venue.id}`}>Own this? Claim it</Link>
              </Button>
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <LikeButton entityType="venue" entityId={venue.id} initialCount={venue.likes_count ?? 0} />
            <FollowButton followeeType="venue" followeeId={venue.id} />
            <ShareButton url={window.location.href} title={venue.name} />
            <SaveButton entityType="venue" entityId={venue.id} />
            <Button variant="outline" size="sm" className="text-xs">
              <MapPinned className="h-3.5 w-3.5 mr-1" /> Check In
            </Button>
          </div>

          {/* Rating summary */}
          <RatingDisplay entityType="venue" entityId={venue.id} compact />
        </div>

        {/* Owner banner */}
        {isOwner && (
          <div className="glass p-4 mt-4 space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5"><Eye className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{venue.views_count ?? 0}</span> views</div>
              <div className="flex items-center gap-1.5"><Users className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{venue.follower_count ?? 0}</span> followers</div>
              <div className="flex items-center gap-1.5"><Star className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{(venue.rating_avg ?? 0).toFixed(1)}</span> avg</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">Edit Venue</Button>
              {venue.status === 'claimed_directory' && siteSettings?.commerce_enabled && (
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-primary-foreground">
                  <Zap className="h-3.5 w-3.5 mr-1" /> Activate Commerce
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="w-full justify-start bg-secondary/30 overflow-x-auto">
            <TabsTrigger value="about">About</TabsTrigger>
            {showCommerceTab && <TabsTrigger value="products">Products</TabsTrigger>}
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>

          {/* ABOUT */}
          <TabsContent value="about" className="space-y-6 mt-4">
            {venue.description && <p className="text-sm text-foreground/90 whitespace-pre-line">{venue.description}</p>}

            {/* Opening hours */}
            {venue.opening_hours && typeof venue.opening_hours === 'object' && (
              <div className="glass p-4 space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-1.5"><Clock className="h-4 w-4" /> Opening Hours</h3>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{day}</span>
                    <span className="text-foreground">{(venue.opening_hours as any)[day.toLowerCase()] ?? 'Closed'}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Contact */}
            <div className="flex flex-wrap gap-2">
              {venue.phone && <Button variant="outline" size="sm" asChild><a href={`tel:${venue.phone}`}><Phone className="h-3.5 w-3.5 mr-1" />{venue.phone}</a></Button>}
              {venue.email && <Button variant="outline" size="sm" asChild><a href={`mailto:${venue.email}`}><Mail className="h-3.5 w-3.5 mr-1" />Email</a></Button>}
              {venue.website && <Button variant="outline" size="sm" asChild><a href={venue.website} target="_blank" rel="noopener noreferrer"><Globe className="h-3.5 w-3.5 mr-1" />Website</a></Button>}
            </div>

            {/* Dynamic filter values */}
            <DynamicFilterValues filterValues={venue.filter_values} categoryId={venue.category_id} />

            {/* Deals */}
            {deals.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Active Deals</h3>
                {deals.map((d) => (
                  <div key={d.id} className="glass p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{d.title}</span>
                      {d.badge_label && <Badge variant="secondary" className="text-[10px]">{d.badge_label}</Badge>}
                    </div>
                    {d.description && <p className="text-xs text-muted-foreground mt-1">{d.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* PRODUCTS */}
          {showCommerceTab && (
            <TabsContent value="products" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <Link key={p.id} to={`/products/${p.id}`} className="glass overflow-hidden hover:scale-[1.01] transition-all">
                    {(p.images as any[])?.[0] && (
                      <img src={(p.images as any[])[0]} alt={p.name} className="w-full aspect-video object-cover" loading="lazy" />
                    )}
                    <div className="p-3 space-y-1.5">
                      <h4 className="font-semibold text-sm">{p.name}</h4>
                      {p.price != null && (
                        <span className="text-sm font-medium text-foreground">{p.currency ?? '$'}{p.price}</span>
                      )}
                      <PaymentMethodBadges methods={(p.payment_methods as string[]) ?? []} />
                    </div>
                  </Link>
                ))}
                {products.length === 0 && <p className="text-sm text-muted-foreground col-span-full text-center py-8">No products listed yet</p>}
              </div>
            </TabsContent>
          )}

          {/* EVENTS */}
          <TabsContent value="events" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {events.map((e) => <EventCard key={e.id} event={e} />)}
              {events.length === 0 && <p className="text-sm text-muted-foreground col-span-full text-center py-8">No upcoming events</p>}
            </div>
          </TabsContent>

          {/* GALLERY */}
          <TabsContent value="gallery" className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setGalleryIndex(i)} className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity">
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
              {images.length === 0 && <p className="text-sm text-muted-foreground col-span-full text-center py-8">No photos yet</p>}
            </div>
          </TabsContent>

          {/* REVIEWS */}
          <TabsContent value="reviews" className="mt-4">
            <RatingDisplay entityType="venue" entityId={venue.id} showForm />
          </TabsContent>

          {/* COMMENTS */}
          <TabsContent value="comments" className="mt-4">
            <CommentSection entityType="venue" entityId={venue.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Lightbox */}
      {galleryIndex !== null && (
        <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center" onClick={() => setGalleryIndex(null)}>
          <button className="absolute top-4 right-4 text-foreground" onClick={() => setGalleryIndex(null)}><X className="h-6 w-6" /></button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground" onClick={(e) => { e.stopPropagation(); setGalleryIndex(Math.max(0, galleryIndex - 1)); }}><ChevronLeft className="h-8 w-8" /></button>
          <img src={images[galleryIndex]} alt="" className="max-h-[85vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground" onClick={(e) => { e.stopPropagation(); setGalleryIndex(Math.min(images.length - 1, galleryIndex + 1)); }}><ChevronRight className="h-8 w-8" /></button>
          <div className="absolute bottom-4 text-sm text-muted-foreground">{galleryIndex + 1} / {images.length}</div>
        </div>
      )}
    </div>
  );
}
