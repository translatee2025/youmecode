import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import FullscreenLoader from '@/components/FullscreenLoader';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Check, CreditCard, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const CYCLES = [
  { key: 'monthly', label: 'Monthly', field: 'price_monthly' },
  { key: 'quarterly', label: 'Quarterly', field: 'price_quarterly' },
  { key: 'annual', label: 'Annual', field: 'price_annual' },
] as const;

export default function CommerceActivationPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const [venue, setVenue] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [cycle, setCycle] = useState<string>('monthly');
  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    if (!tenant || !venueId) return;
    Promise.all([
      (supabase.from('venues' as any).select('*').eq('id', venueId).maybeSingle() as any),
      supabase.from('site_settings').select('*').maybeSingle(),
      supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order'),
    ]).then(([vRes, sRes, pRes]: any) => {
      setVenue(vRes.data);
      setSettings(sRes.data);
      setPlans(pRes.data ?? []);
      setLoading(false);
    });
  }, [tenant, venueId]);

  if (loading) return <FullscreenLoader />;
  if (!venue) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Venue not found</div>;
  if (venue.status !== 'claimed_directory') return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Venue must be claimed first</div>;
  if (!settings?.commerce_enabled) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Commerce is not enabled on this platform</div>;
  if (profile?.id !== venue.owner_id) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Only the venue owner can activate commerce</div>;

  const price = selectedPlan ? selectedPlan[CYCLES.find((c) => c.key === cycle)?.field ?? 'price_monthly'] : null;
  const monthlyPrice = selectedPlan?.price_monthly;
  const savings = monthlyPrice && price && cycle !== 'monthly'
    ? Math.round((1 - price / (monthlyPrice * (cycle === 'quarterly' ? 3 : 12))) * 100)
    : 0;

  const stepLabels = ['Choose Plan', 'Billing Cycle', 'Payment Provider', 'Terms', 'Payment'];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to={`/venues/${venue.slug}`}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
          <Zap className="h-6 w-6 text-amber-400" /> Activate Commerce
        </h1>
        <p className="text-sm text-muted-foreground mb-4">{venue.name}</p>
        <Progress value={((step + 1) / stepLabels.length) * 100} className="h-2 mb-6" />

        {/* Step 1: Plans */}
        {step === 0 && (
          <div className="space-y-3">
            {plans.map((p) => (
              <Card key={p.id} className={cn('glass cursor-pointer transition-all', selectedPlan?.id === p.id && 'border-primary ring-1 ring-primary')} onClick={() => setSelectedPlan(p)}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  {p.description && <CardDescription>{p.description}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex gap-4 text-sm">
                    {p.price_monthly != null && <span>{p.currency ?? '$'}{p.price_monthly}/mo</span>}
                    {p.price_quarterly != null && <span className="text-muted-foreground">{p.currency ?? '$'}{p.price_quarterly}/qtr</span>}
                    {p.price_annual != null && <span className="text-muted-foreground">{p.currency ?? '$'}{p.price_annual}/yr</span>}
                  </div>
                  {Array.isArray(p.features) && p.features.length > 0 && (
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {(p.features as string[]).map((f: string, i: number) => <li key={i} className="flex items-center gap-1"><Check className="h-3 w-3 text-emerald-400" />{f}</li>)}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
            {plans.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No plans available</p>}
          </div>
        )}

        {/* Step 2: Cycle */}
        {step === 1 && selectedPlan && (
          <div className="space-y-3">
            {CYCLES.filter((c) => selectedPlan[c.field] != null).map((c) => {
              const p = selectedPlan[c.field];
              const sav = c.key !== 'monthly' && monthlyPrice ? Math.round((1 - p / (monthlyPrice * (c.key === 'quarterly' ? 3 : 12))) * 100) : 0;
              return (
                <Card key={c.key} className={cn('glass cursor-pointer transition-all', cycle === c.key && 'border-primary ring-1 ring-primary')} onClick={() => setCycle(c.key)}>
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{c.label}</h3>
                      <span className="text-lg font-bold text-foreground">{selectedPlan.currency ?? '$'}{p}</span>
                    </div>
                    {sav > 0 && <Badge variant="secondary" className="text-xs">Save {sav}%</Badge>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Step 3: Provider */}
        {step === 2 && (
          <div className="space-y-3">
            {['Stripe', 'PayPal', 'Razorpay'].map((prov) => (
              <Card key={prov} className="glass cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="pt-4 flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground">{prov}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Step 4: Terms */}
        {step === 3 && (
          <Card className="glass">
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-foreground">Order Summary</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Plan:</span> {selectedPlan?.name}</p>
                <p><span className="text-muted-foreground">Cycle:</span> {cycle}</p>
                <p><span className="text-muted-foreground">Price:</span> {selectedPlan?.currency ?? '$'}{price}</p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(!!v)} id="terms" />
                <label htmlFor="terms" className="text-sm text-foreground">
                  I accept the <Link to="/pages/terms-and-conditions" className="text-primary hover:underline" target="_blank">Terms & Conditions</Link>
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Payment */}
        {step === 4 && (
          <Card className="glass">
            <CardContent className="pt-6 text-center space-y-4">
              <CreditCard className="h-12 w-12 text-primary mx-auto" />
              <h3 className="font-semibold text-foreground">Redirecting to payment provider...</h3>
              <p className="text-sm text-muted-foreground">Payment processing will be available once payment webhooks are configured.</p>
              <Button variant="outline" onClick={() => { toast({ title: 'Payment integration coming soon' }); navigate(`/venues/${venue.slug}`); }}>
                Return to Venue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        {step < 4 && (
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={() => setStep(step + 1)} disabled={
              (step === 0 && !selectedPlan) ||
              (step === 3 && !acceptTerms)
            }>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
