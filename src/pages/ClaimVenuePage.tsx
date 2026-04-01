import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import FullscreenLoader from '@/components/FullscreenLoader';
import { CheckCircle2, FileText, Mail, Upload, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ClaimVenuePage() {
  const { venueId } = useParams<{ venueId: string }>();
  const tenant = useTenantStore((s) => s.tenant);
  const profile = useAuthStore((s) => s.profile);
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<'email_domain' | 'document' | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [note, setNote] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!tenant || !venueId) return;
    (supabase.from('venues' as any).select('*').eq('id', venueId).eq('tenant_id', tenant.id).maybeSingle() as any)
      .then(({ data }: any) => { setVenue(data); setLoading(false); });
  }, [tenant, venueId]);

  if (loading) return <FullscreenLoader />;
  if (!venue) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Venue not found</div>;

  const venueDomain = (venue.email?.split('@')[1] || venue.website?.replace(/^https?:\/\//, '').split('/')[0]) ?? '';
  const inputDomain = emailInput.includes('@') ? emailInput.split('@')[1] : '';
  const domainMatch = inputDomain && venueDomain && inputDomain.toLowerCase() === venueDomain.toLowerCase();
  const showEmailOption = !!(venue.email || venue.website);

  const handleSubmitEmail = async () => {
    if (!profile || !tenant) return;
    setSubmitting(true);
    await supabase.from('claim_requests').insert({
      tenant_id: tenant.id,
      venue_id: venue.id,
      user_id: profile.id,
      method: 'email_domain',
      email_used: emailInput,
      message: note.trim() || null,
      status: 'pending',
    });
    setSubmitting(false);
    setSubmitted(true);
    toast({ title: 'Claim submitted!' });
  };

  const handleSubmitDoc = async () => {
    if (!profile || !tenant || !docFile) return;
    setSubmitting(true);
    const path = `claims/${venue.id}/${Date.now()}-${docFile.name}`;
    const { error } = await supabase.storage.from('media').upload(path, docFile);
    if (error) { toast({ title: 'Upload failed', variant: 'destructive' }); setSubmitting(false); return; }
    const { data: pub } = supabase.storage.from('media').getPublicUrl(path);

    await supabase.from('claim_requests').insert({
      tenant_id: tenant.id,
      venue_id: venue.id,
      user_id: profile.id,
      method: 'document',
      document_url: pub.publicUrl,
      message: note.trim() || null,
      status: 'pending',
    });
    setSubmitting(false);
    setSubmitted(true);
    toast({ title: 'Claim submitted!' });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <Card className="glass max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Claim Submitted!</h2>
            <p className="text-sm text-muted-foreground">Your claim for <strong>{venue.name}</strong> is being reviewed. You'll be notified when a decision is made.</p>
            <div className="flex gap-2 justify-center">
              <Button asChild><Link to={`/claim/${venueId}/status`}>Track Status</Link></Button>
              <Button variant="outline" asChild><Link to={`/venues/${venue.slug}`}>Back to Venue</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-lg mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" asChild className="mb-4"><Link to={`/venues/${venue.slug}`}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link></Button>
        <h1 className="text-2xl font-bold text-foreground mb-1">Claim {venue.name}</h1>
        <p className="text-sm text-muted-foreground mb-6">Prove you own this venue to manage its listing</p>

        {!method ? (
          <div className="space-y-3">
            {showEmailOption && (
              <Card className="glass cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setMethod('email_domain')}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Email Verification</CardTitle>
                  <CardDescription>Use your business email to prove ownership</CardDescription>
                </CardHeader>
              </Card>
            )}
            <Card className="glass cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setMethod('document')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Document Upload</CardTitle>
                <CardDescription>Upload a business licence, trade registration, or ID</CardDescription>
              </CardHeader>
            </Card>
          </div>
        ) : method === 'email_domain' ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Your Business Email</label>
              <Input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="you@business.com" />
              {inputDomain && (
                <p className={cn('text-xs mt-1', domainMatch ? 'text-primary' : 'text-destructive')}>
                  {domainMatch ? '✓ Domain matches venue website' : '⚠ Domain does not match — you can still submit'}
                </p>
              )}
            </div>
            <div><label className="text-sm font-medium text-foreground">Note (optional)</label><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Additional context..." /></div>
            <div className="flex gap-2">
              <Button onClick={handleSubmitEmail} disabled={submitting || !emailInput.includes('@')}>{submitting ? 'Submitting...' : 'Submit Claim'}</Button>
              <Button variant="outline" onClick={() => setMethod(null)}>Back</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Upload Document</label>
              <label className="glass flex flex-col items-center justify-center p-8 cursor-pointer hover:border-primary/50 transition-colors mt-1">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">{docFile ? docFile.name : 'Click to upload (JPG, PNG, PDF, DOC)'}</span>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} className="hidden" />
              </label>
            </div>
            <div><label className="text-sm font-medium text-foreground">Note (optional)</label><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Additional context..." /></div>
            <div className="flex gap-2">
              <Button onClick={handleSubmitDoc} disabled={submitting || !docFile}>{submitting ? 'Submitting...' : 'Submit Claim'}</Button>
              <Button variant="outline" onClick={() => setMethod(null)}>Back</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
