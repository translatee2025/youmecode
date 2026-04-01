import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import FullscreenLoader from '@/components/FullscreenLoader';
import { CheckCircle2, Clock, XCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'review', label: 'Under Review' },
  { key: 'decision', label: 'Decision' },
];

export default function ClaimStatusPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const tenant = useTenantStore((s) => s.tenant);
  const profile = useAuthStore((s) => s.profile);
  const [claim, setClaim] = useState<any>(null);
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant || !profile || !venueId) return;
    Promise.all([
      supabase.from('claim_requests').select('*').eq('tenant_id', tenant.id).eq('venue_id', venueId).eq('user_id', profile.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      (supabase.from('venues' as any).select('name, slug').eq('id', venueId).maybeSingle() as any),
    ]).then(([claimRes, venueRes]: any) => {
      setClaim(claimRes.data);
      setVenue(venueRes.data);
      setLoading(false);
    });
  }, [tenant, profile, venueId]);

  if (loading) return <FullscreenLoader />;
  if (!claim) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">No claim found</div>;

  const currentStep = claim.status === 'pending' ? 1 : 2;
  const isApproved = claim.status === 'approved';
  const isRejected = claim.status === 'rejected';

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-lg mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to={venue ? `/venues/${venue.slug}` : '/'}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-1">Claim Status</h1>
        <p className="text-sm text-muted-foreground mb-6">{venue?.name ?? 'Venue'}</p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors',
                i <= currentStep
                  ? (i === 2 && isRejected ? 'border-destructive bg-destructive/20 text-destructive' : 'border-primary bg-primary/20 text-primary')
                  : 'border-border text-muted-foreground'
              )}>
                {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i === 2 && isRejected ? <XCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">{s.label}</span>
              {i < steps.length - 1 && <div className={cn('flex-1 h-0.5', i < currentStep ? 'bg-primary' : 'bg-border')} />}
            </div>
          ))}
        </div>

        <Card className="glass">
          <CardContent className="pt-6 text-center space-y-4">
            {claim.status === 'pending' && (
              <>
                <Clock className="h-12 w-12 text-amber-400 mx-auto" />
                <h2 className="text-lg font-semibold text-foreground">Under Review</h2>
                <p className="text-sm text-muted-foreground">Your claim is being reviewed. This usually takes 1-3 business days.</p>
              </>
            )}
            {isApproved && (
              <>
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                <h2 className="text-lg font-semibold text-foreground">Claim Approved!</h2>
                <p className="text-sm text-muted-foreground">You now manage this venue.</p>
                {venue && <Button asChild><Link to={`/venues/${venue.slug}`}>Go to Venue</Link></Button>}
              </>
            )}
            {isRejected && (
              <>
                <XCircle className="h-12 w-12 text-destructive mx-auto" />
                <h2 className="text-lg font-semibold text-foreground">Claim Not Approved</h2>
                {claim.message && <p className="text-sm text-muted-foreground">Reason: {claim.message}</p>}
                <Button asChild><Link to={`/claim/${venueId}`}>Submit Another Claim</Link></Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
