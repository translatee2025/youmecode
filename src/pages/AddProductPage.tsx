import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import FullscreenLoader from '@/components/FullscreenLoader';
import { ArrowLeft, ArrowRight, Check, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAYMENT_METHODS = ['cash', 'crypto', 'credit_card', 'paypal', 'third_party'];
const PAYMENT_LABELS: Record<string, string> = { cash: 'Cash', crypto: 'Crypto', credit_card: 'Credit Card', paypal: 'PayPal', third_party: 'Third Party Link' };

export default function AddProductPage() {
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get('venueId');
  const navigate = useNavigate();
  const tenant = useTenantStore((s) => s.tenant);
  const profile = useAuthStore((s) => s.profile);
  const [venue, setVenue] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [filterFields, setFilterFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [productTypeId, setProductTypeId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [priceUnit, setPriceUnit] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [externalLink, setExternalLink] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!tenant || !venueId) return;
    Promise.all([
      (supabase.from('venues' as any).select('*').eq('id', venueId).eq('tenant_id', tenant.id).maybeSingle() as any),
      supabase.from('site_settings').select('*').eq('tenant_id', tenant.id).maybeSingle(),
    ]).then(([vRes, sRes]: any) => {
      const v = vRes.data;
      setVenue(v);
      setSettings(sRes.data);
      if (v?.category_id) {
        supabase.from('product_types').select('*').eq('tenant_id', tenant.id).eq('category_id', v.category_id).eq('is_active', true).order('sort_order')
          .then(({ data }) => setProductTypes(data ?? []));
        supabase.from('filter_fields').select('*').eq('tenant_id', tenant.id).eq('category_id', v.category_id).eq('is_active', true).in('applies_to', ['product', 'both']).order('sort_order')
          .then(({ data }) => setFilterFields(data ?? []));
      }
      setLoading(false);
    });
  }, [tenant, venueId]);

  if (loading) return <FullscreenLoader />;
  if (!venue) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Venue not found</div>;

  const hasCustomFields = filterFields.length > 0;
  const STEPS = ['Type', 'Details', ...(hasCustomFields ? ['Custom Fields'] : []), 'Payment', 'Images', 'Preview'];
  const totalSteps = STEPS.length;

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 6 - images.length);
    setImages([...images, ...files]);
    setPreviews([...previews, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (i: number) => {
    setImages(images.filter((_, idx) => idx !== i));
    setPreviews(previews.filter((_, idx) => idx !== i));
  };

  const togglePayment = (m: string) => {
    setPaymentMethods(paymentMethods.includes(m) ? paymentMethods.filter((p) => p !== m) : [...paymentMethods, m]);
  };

  const renderFieldInput = (field: any) => {
    const val = filterValues[field.field_key];
    const set = (v: any) => setFilterValues({ ...filterValues, [field.field_key]: v });
    const opts: string[] = Array.isArray(field.options) ? field.options : [];
    switch (field.field_type) {
      case 'text': case 'url': return <Input placeholder={field.placeholder ?? ''} value={val ?? ''} onChange={(e) => set(e.target.value)} />;
      case 'number': return <Input type="number" placeholder={field.placeholder ?? ''} value={val ?? ''} onChange={(e) => set(e.target.value)} />;
      case 'select': return (
        <Select value={val ?? ''} onValueChange={set}>
          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
          <SelectContent>{opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      );
      case 'multiselect': return (
        <div className="flex flex-wrap gap-2">
          {opts.map((o) => {
            const sel = Array.isArray(val) && val.includes(o);
            return <button key={o} onClick={() => set(sel ? val.filter((v: string) => v !== o) : [...(val ?? []), o])}
              className={cn('px-3 py-1 rounded-full text-xs border', sel ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground')}>{o}</button>;
          })}
        </div>
      );
      case 'boolean': return <Switch checked={!!val} onCheckedChange={set} />;
      default: return <Input value={val ?? ''} onChange={(e) => set(e.target.value)} />;
    }
  };

  const handleSubmit = async () => {
    if (!tenant || !profile || !name.trim()) return;
    setSubmitting(true);
    try {
      const imageUrls: string[] = [];
      for (const f of images) {
        const path = `products/${venueId}/${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const { data, error } = await supabase.storage.from('media').upload(path, f, { upsert: true });
        if (error) throw error;
        const { data: pub } = supabase.storage.from('media').getPublicUrl(data.path);
        imageUrls.push(pub.publicUrl);
      }

      const { error } = await supabase.from('products').insert({
        tenant_id: tenant.id,
        venue_id: venueId,
        name: name.trim(),
        description: description.trim() || null,
        price: price ? parseFloat(price) : null,
        currency,
        price_unit: priceUnit.trim() || null,
        product_type_id: productTypeId || null,
        category_id: venue.category_id,
        subcategory_id: venue.subcategory_id ?? null,
        filter_values: filterValues,
        payment_methods: paymentMethods,
        external_link: externalLink.trim() || null,
        images: imageUrls,
        status: 'active',
      });
      if (error) throw error;
      toast({ title: 'Product added!' });
      navigate(`/venues/${venue.slug}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  // Map step index to actual content step
  const getContentStep = () => {
    if (!hasCustomFields && step >= 2) return step + 1;
    return step;
  };
  const contentStep = getContentStep();

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <h1 className="text-2xl font-bold text-foreground mb-1">Add Product</h1>
        <p className="text-sm text-muted-foreground mb-4">{venue.name}</p>
        <Progress value={((step + 1) / totalSteps) * 100} className="h-2 mb-6" />

        {/* Step 1: Type */}
        {contentStep === 0 && (
          <div className="space-y-4">
            <Label>Product Type</Label>
            <Select value={productTypeId} onValueChange={setProductTypeId}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Product</SelectItem>
                {productTypes.map((pt) => <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Step 2: Details */}
        {contentStep === 1 && (
          <div className="space-y-4">
            <div><Label>Product Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[100px]" /></div>
            {settings?.commerce_enabled && (
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Price</Label><Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
                <div><Label>Currency</Label><Input value={currency} onChange={(e) => setCurrency(e.target.value)} /></div>
                <div><Label>Unit</Label><Input placeholder="per night, each..." value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} /></div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Custom Fields (conditional) */}
        {contentStep === 2 && hasCustomFields && (
          <div className="space-y-4">
            {filterFields.map((f) => (
              <div key={f.id}><Label>{f.label}{f.is_required && ' *'}</Label>{renderFieldInput(f)}</div>
            ))}
          </div>
        )}

        {/* Step 4: Payment */}
        {contentStep === 3 && (
          <div className="space-y-4">
            <Label>Accepted Payment Methods</Label>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <div key={m} className="flex items-center gap-2">
                  <Checkbox checked={paymentMethods.includes(m)} onCheckedChange={() => togglePayment(m)} id={`pm-${m}`} />
                  <label htmlFor={`pm-${m}`} className="text-sm text-foreground">{PAYMENT_LABELS[m]}</label>
                </div>
              ))}
            </div>
            {paymentMethods.includes('third_party') && (
              <div><Label>External Link</Label><Input value={externalLink} onChange={(e) => setExternalLink(e.target.value)} placeholder="https://" /></div>
            )}
          </div>
        )}

        {/* Step 5: Images */}
        {contentStep === 4 && (
          <div className="space-y-4">
            <Label>Images ({images.length}/6)</Label>
            <div className="grid grid-cols-3 gap-2">
              {previews.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                </div>
              ))}
              {images.length < 6 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Step 6: Preview */}
        {contentStep === 5 && (
          <Card className="glass overflow-hidden">
            {previews[0] && <img src={previews[0]} alt="" className="w-full aspect-video object-cover" />}
            <div className="p-4 space-y-2">
              <h2 className="text-lg font-bold text-foreground">{name || 'Product Name'}</h2>
              {price && <span className="text-lg font-semibold text-foreground">{currency}{price}{priceUnit ? `/${priceUnit}` : ''}</span>}
              {paymentMethods.length > 0 && <div className="flex gap-1">{paymentMethods.map((m) => <Badge key={m} variant="outline" className="text-xs">{PAYMENT_LABELS[m]}</Badge>)}</div>}
            </div>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          {step < totalSteps - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={contentStep === 1 && !name.trim()}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
              {submitting ? 'Saving...' : 'Save Product'} <Check className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
