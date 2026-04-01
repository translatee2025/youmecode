import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FullscreenLoader from '@/components/FullscreenLoader';
import { BarChart3, Eye, Users, Star, MessageCircle, QrCode, ArrowLeft, Megaphone } from 'lucide-react';
import QRCode from 'qrcode';

function downloadPrintableCard(venue: any, qrDataUrl: string, tenant: any) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 600, 800);

  // Title
  ctx.fillStyle = '#111111';
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(tenant?.name ?? 'Platform', 300, 60);

  // Venue name
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(venue.name, 300, 120);

  // QR code
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 150, 180, 300, 300);

    // Scan text
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText('Scan to visit', 300, 530);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(`${window.location.origin}/venues/${venue.slug}`, 300, 560);

    const link = document.createElement('a');
    link.download = `${venue.slug}-card.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  img.src = qrDataUrl;
}

export default function VenueAdminPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const tenant = useTenantStore((s) => s.tenant);
  const profile = useAuthStore((s) => s.profile);
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ views: 0, followers: 0, rating: 0, comments: 0, responseRate: 0 });
  const [qrUrl, setQrUrl] = useState('');
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (!tenant || !venueId) return;
    Promise.all([
      (supabase.from('venues' as any).select('*').eq('id', venueId).eq('tenant_id', tenant.id).maybeSingle() as any),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('followee_id', venueId).eq('followee_type', 'venue'),
      supabase.from('ratings').select('score').eq('tenant_id', tenant.id).eq('entity_id', venueId).eq('entity_type', 'venue'),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('entity_id', venueId).eq('entity_type', 'venue'),
      (supabase.from('subscriptions' as any).select('*').eq('tenant_id', tenant.id).eq('venue_id', venueId).order('created_at', { ascending: false }).limit(1).maybeSingle() as any),
    ]).then(([vRes, fRes, rRes, cRes, sRes]: any) => {
      const v = vRes.data;
      setVenue(v);
      const ratings = rRes.data ?? [];
      const avgRating = ratings.length > 0 ? ratings.reduce((a: number, r: any) => a + r.score, 0) / ratings.length : 0;
      setStats({
        views: v?.views_count ?? 0,
        followers: fRes.count ?? 0,
        rating: Math.round(avgRating * 10) / 10,
        comments: cRes.count ?? 0,
        responseRate: 0,
      });
      setSubscription(sRes.data);
      setLoading(false);

      // Generate QR
      const url = `${window.location.origin}/venues/${v?.slug}`;
      QRCode.toDataURL(url, { width: 256, margin: 2 }).then(setQrUrl).catch(() => {});
    });
  }, [tenant, venueId]);

  if (loading) return <FullscreenLoader />;
  if (!venue) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Venue not found</div>;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2"><Link to={`/venues/${venue.slug}`}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link></Button>
            <h1 className="text-2xl font-bold text-foreground">{venue.name}</h1>
            <Badge variant="secondary">{venue.status}</Badge>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Views', value: stats.views, icon: Eye },
            { label: 'Followers', value: stats.followers, icon: Users },
            { label: 'Rating', value: stats.rating || '—', icon: Star },
            { label: 'Comments', value: stats.comments, icon: MessageCircle },
          ].map((s) => (
            <Card key={s.label} className="glass">
              <CardContent className="pt-4 text-center">
                <s.icon className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Subscription */}
        {subscription && (
          <Card className="glass">
            <CardHeader><CardTitle className="text-base">Subscription</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>{subscription.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cycle</span>
                <span className="text-sm text-foreground">{subscription.billing_cycle}</span>
              </div>
              {subscription.expires_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expires</span>
                  <span className="text-sm text-foreground">{new Date(subscription.expires_at).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Button variant="outline" asChild>
            <Link to={`/ads/purchase?venueId=${venueId}`}><Megaphone className="h-4 w-4 mr-2" /> Buy Ad Slot</Link>
          </Button>
          {qrUrl && (
            <a href={qrUrl} download={`${venue.slug}-qr.png`}>
              <Button variant="outline" className="w-full"><QrCode className="h-4 w-4 mr-2" /> Download QR</Button>
            </a>
          )}
          {qrUrl && (
            <Button variant="outline" onClick={() => downloadPrintableCard(venue, qrUrl, tenant)}>
              <QrCode className="h-4 w-4 mr-2" /> Printable Card
            </Button>
          )}
        </div>

        {/* Widget Embed Code */}
        <Card className="glass">
          <CardHeader><CardTitle className="text-base">Embeddable Widget</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">Copy this code to embed your venue card on any website:</p>
            <pre className="text-xs bg-secondary/30 p-3 rounded overflow-x-auto text-foreground">
{`<script src="${window.location.origin}/widget.js"></script>
<div data-nexus-venue="${venue.slug}"></div>`}
            </pre>
            <Button size="sm" variant="outline" onClick={() => {
              navigator.clipboard.writeText(`<script src="${window.location.origin}/widget.js"></script>\n<div data-nexus-venue="${venue.slug}"></div>`);
              toast({ title: 'Embed code copied!' });
            }}>Copy Code</Button>
          </CardContent>
        </Card>

        {/* QR Preview */}
        {qrUrl && (
          <Card className="glass">
            <CardContent className="pt-4 text-center">
              <img src={qrUrl} alt="QR Code" className="mx-auto w-48 h-48" />
              <p className="text-xs text-muted-foreground mt-2">Scan to visit your venue page</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
