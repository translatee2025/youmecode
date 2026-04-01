import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Check, MapPin, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = ['Basic Info', 'Location', 'Contact & Hours', 'Details', 'Images', 'Preview'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function CreateVenuePage() {
  const navigate = useNavigate();
  const tenant = useTenantStore((s) => s.tenant);
  const profile = useAuthStore((s) => s.profile);
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [filterFields, setFilterFields] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [postcode, setPostcode] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [socialLinks, setSocialLinks] = useState('');
  const [tags, setTags] = useState('');
  const [hours, setHours] = useState<Record<string, { enabled: boolean; open: string; close: string }>>(
    Object.fromEntries(DAYS.map((d) => [d.toLowerCase(), { enabled: false, open: '09:00', close: '17:00' }]))
  );
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!tenant) return;
    Promise.all([
      supabase.from('categories').select('*').eq('tenant_id', tenant.id).eq('is_active', true).in('applies_to', ['venue', 'both']).order('sort_order'),
      supabase.from('site_settings').select('*').eq('tenant_id', tenant.id).maybeSingle(),
    ]).then(([catRes, settRes]) => {
      setCategories(catRes.data ?? []);
      setSiteSettings(settRes.data);
    });
  }, [tenant]);

  useEffect(() => {
    if (!tenant || !categoryId) { setSubcategories([]); return; }
    supabase.from('subcategories').select('*').eq('tenant_id', tenant.id).eq('category_id', categoryId).eq('is_active', true).order('sort_order')
      .then(({ data }) => setSubcategories(data ?? []));
  }, [tenant, categoryId]);

  useEffect(() => {
    if (!tenant || !categoryId) { setFilterFields([]); return; }
    let q = supabase.from('filter_fields').select('*').eq('tenant_id', tenant.id).eq('category_id', categoryId).eq('is_active', true).in('applies_to', ['venue', 'both']).order('sort_order');
    q.then(({ data }) => setFilterFields(data ?? []));
  }, [tenant, categoryId]);

  const hasCustomFields = filterFields.length > 0;
  const activeSteps = hasCustomFields ? STEPS : STEPS.filter((_, i) => i !== 3);
  const totalSteps = activeSteps.length;
  const realStep = hasCustomFields ? step : (step >= 3 ? step + 1 : step);

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setCoverImage(f); setCoverPreview(URL.createObjectURL(f)); }
  };

  const handleGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 10 - galleryFiles.length);
    setGalleryFiles([...galleryFiles, ...files]);
    setGalleryPreviews([...galleryPreviews, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeGallery = (i: number) => {
    setGalleryFiles(galleryFiles.filter((_, idx) => idx !== i));
    setGalleryPreviews(galleryPreviews.filter((_, idx) => idx !== i));
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage.from('media').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: pub } = supabase.storage.from('media').getPublicUrl(data.path);
    return pub.publicUrl;
  };

  const handleSubmit = async () => {
    if (!tenant || !profile || !name.trim()) return;
    setSubmitting(true);
    try {
      let coverUrl: string | null = null;
      const imageUrls: string[] = [];
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

      if (coverImage) {
        coverUrl = await uploadFile(coverImage, `venues/${slug}/cover-${Date.now()}`);
      }
      for (const f of galleryFiles) {
        const url = await uploadFile(f, `venues/${slug}/gallery-${Date.now()}-${Math.random().toString(36).slice(2)}`);
        imageUrls.push(url);
      }

      const venueData = {
        tenant_id: tenant.id,
        name: name.trim(),
        slug,
        category_id: categoryId || null,
        subcategory_id: subcategoryId || null,
        description: description.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        country: country.trim() || null,
        postcode: postcode.trim() || null,
        location_lat: lat ? parseFloat(lat) : null,
        location_lng: lng ? parseFloat(lng) : null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        social_links: socialLinks.trim() ? { raw: socialLinks.trim() } : {},
        tags: tags.trim() ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        opening_hours: hours,
        filter_values: filterValues,
        cover_image_url: coverUrl,
        images: imageUrls,
        status: profile.role === 'creator' ? 'claimed_directory' : 'unclaimed',
        owner_id: profile.role === 'creator' ? profile.id : null,
      };

      const { error } = await (supabase.from('venues' as any).insert(venueData) as any);
      if (error) throw error;
      toast({ title: 'Venue created!' });
      navigate(`/venues/${slug}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const copyHours = (fromDay: string) => {
    const src = hours[fromDay];
    const updated = { ...hours };
    DAYS.forEach((d) => { const key = d.toLowerCase(); if (key !== fromDay) updated[key] = { ...src }; });
    setHours(updated);
  };

  const renderFieldInput = (field: any) => {
    const val = filterValues[field.field_key];
    const set = (v: any) => setFilterValues({ ...filterValues, [field.field_key]: v });
    const opts: string[] = Array.isArray(field.options) ? field.options : [];

    switch (field.field_type) {
      case 'text': case 'url':
        return <Input placeholder={field.placeholder ?? ''} value={val ?? ''} onChange={(e) => set(e.target.value)} />;
      case 'number':
        return <Input type="number" placeholder={field.placeholder ?? ''} value={val ?? ''} onChange={(e) => set(e.target.value)} />;
      case 'number_range':
        return (
          <div className="flex gap-2">
            <Input type="number" placeholder="Min" value={val?.min ?? ''} onChange={(e) => set({ ...val, min: e.target.value })} />
            <Input type="number" placeholder="Max" value={val?.max ?? ''} onChange={(e) => set({ ...val, max: e.target.value })} />
          </div>
        );
      case 'select':
        return (
          <Select value={val ?? ''} onValueChange={set}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>{opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        );
      case 'multiselect':
        return (
          <div className="flex flex-wrap gap-2">
            {opts.map((o) => {
              const selected = Array.isArray(val) && val.includes(o);
              return (
                <button key={o} onClick={() => set(selected ? (val as string[]).filter((v: string) => v !== o) : [...(val ?? []), o])}
                  className={cn('px-3 py-1 rounded-full text-xs border transition-colors', selected ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50')}>
                  {o}
                </button>
              );
            })}
          </div>
        );
      case 'boolean':
        return <Switch checked={!!val} onCheckedChange={set} />;
      case 'date':
        return <Input type="date" value={val ?? ''} onChange={(e) => set(e.target.value)} />;
      case 'date_range':
        return (
          <div className="flex gap-2">
            <Input type="date" value={val?.from ?? ''} onChange={(e) => set({ ...val, from: e.target.value })} />
            <Input type="date" value={val?.to ?? ''} onChange={(e) => set({ ...val, to: e.target.value })} />
          </div>
        );
      case 'color':
        return (
          <div className="flex flex-wrap gap-2">
            {opts.map((o) => (
              <button key={o} onClick={() => set(o)} className={cn('w-8 h-8 rounded-full border-2 transition-all', val === o ? 'border-primary scale-110' : 'border-transparent')} style={{ background: o }} />
            ))}
          </div>
        );
      default:
        return <Input value={val ?? ''} onChange={(e) => set(e.target.value)} />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Create Venue</h1>
        <Progress value={((step + 1) / totalSteps) * 100} className="h-2 mb-6" />
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {activeSteps.map((s, i) => (
            <Badge key={s} variant={i === step ? 'default' : i < step ? 'secondary' : 'outline'} className="text-xs shrink-0">
              {i < step ? <Check className="h-3 w-3 mr-1" /> : null}{s}
            </Badge>
          ))}
        </div>

        {/* STEP 1: Basic Info */}
        {realStep === 0 && (
          <div className="space-y-4">
            <div><Label>Venue Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter venue name" /></div>
            <div>
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubcategoryId(''); }}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {subcategories.length > 0 && (
              <div>
                <Label>Subcategory</Label>
                <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                  <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                  <SelectContent>{subcategories.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Short Description <span className="text-muted-foreground">({shortDesc.length}/140)</span></Label>
              <Input value={shortDesc} onChange={(e) => setShortDesc(e.target.value.slice(0, 140))} placeholder="Brief one-liner" />
            </div>
            <div><Label>Full Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the venue..." className="min-h-[120px]" /></div>
          </div>
        )}

        {/* STEP 2: Location */}
        {realStep === 1 && (
          <div className="space-y-4">
            <div><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
              <div><Label>Country</Label><Input value={country} onChange={(e) => setCountry(e.target.value)} /></div>
            </div>
            <div><Label>Postcode</Label><Input value={postcode} onChange={(e) => setPostcode(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Latitude</Label><Input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="e.g. 51.5074" /></div>
              <div><Label>Longitude</Label><Input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="e.g. -0.1278" /></div>
            </div>
            <div className="glass p-8 flex items-center justify-center text-muted-foreground text-sm">
              <MapPin className="h-5 w-5 mr-2" /> Map preview available with Mapbox token
            </div>
          </div>
        )}

        {/* STEP 3: Contact & Hours */}
        {realStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            </div>
            <div><Label>Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" /></div>
            <div><Label>Social Links</Label><Input value={socialLinks} onChange={(e) => setSocialLinks(e.target.value)} placeholder="Instagram, Twitter URLs..." /></div>
            <div><Label>Tags (comma separated)</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="cozy, rooftop, live-music" /></div>
            <div className="space-y-2">
              <Label>Opening Hours</Label>
              {DAYS.map((day, i) => {
                const key = day.toLowerCase();
                const h = hours[key];
                return (
                  <div key={day} className="flex items-center gap-3">
                    <Switch checked={h.enabled} onCheckedChange={(v) => setHours({ ...hours, [key]: { ...h, enabled: v } })} />
                    <span className="w-24 text-sm text-foreground">{day}</span>
                    {h.enabled ? (
                      <>
                        <Input type="time" value={h.open} onChange={(e) => setHours({ ...hours, [key]: { ...h, open: e.target.value } })} className="w-28" />
                        <span className="text-muted-foreground text-xs">to</span>
                        <Input type="time" value={h.close} onChange={(e) => setHours({ ...hours, [key]: { ...h, close: e.target.value } })} className="w-28" />
                        {i === 0 && <Button size="sm" variant="ghost" className="text-xs" onClick={() => copyHours(key)}>Copy to all</Button>}
                      </>
                    ) : <span className="text-xs text-muted-foreground">Closed</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Dynamic Fields */}
        {realStep === 3 && hasCustomFields && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Fill in details specific to this category</p>
            {filterFields.map((f) => (
              <div key={f.id}>
                <Label>{f.label}{f.is_required && ' *'}</Label>
                {renderFieldInput(f)}
              </div>
            ))}
          </div>
        )}

        {/* STEP 5: Images */}
        {realStep === 4 && (
          <div className="space-y-4">
            <div>
              <Label>Cover Image</Label>
              {coverPreview ? (
                <div className="relative">
                  <img src={coverPreview} alt="" className="w-full aspect-video object-cover rounded-lg" />
                  <button onClick={() => { setCoverImage(null); setCoverPreview(''); }} className="absolute top-2 right-2 bg-background/80 rounded-full p-1"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <label className="glass flex flex-col items-center justify-center aspect-video cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload cover image</span>
                  <input type="file" accept="image/*" onChange={handleCover} className="hidden" />
                </label>
              )}
            </div>
            <div>
              <Label>Gallery ({galleryFiles.length}/10)</Label>
              <div className="grid grid-cols-3 gap-2">
                {galleryPreviews.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                    <img src={p} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeGallery(i)} className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                {galleryFiles.length < 10 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <input type="file" accept="image/*" multiple onChange={handleGallery} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Preview */}
        {realStep === 5 && (
          <div className="space-y-4">
            <Card className="glass overflow-hidden">
              {coverPreview && <img src={coverPreview} alt="" className="w-full aspect-video object-cover" />}
              <div className="p-4 space-y-2">
                <h2 className="text-lg font-bold text-foreground">{name || 'Venue Name'}</h2>
                {categoryId && <Badge variant="secondary" className="text-xs">{categories.find((c) => c.id === categoryId)?.name}</Badge>}
                {city && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{city}{country ? `, ${country}` : ''}</p>}
                {shortDesc && <p className="text-sm text-foreground/80">{shortDesc}</p>}
              </div>
            </Card>
            <div className="glass p-4 space-y-2 text-sm">
              <h3 className="font-semibold text-foreground">Summary</h3>
              {address && <p><span className="text-muted-foreground">Address:</span> {address}</p>}
              {phone && <p><span className="text-muted-foreground">Phone:</span> {phone}</p>}
              {email && <p><span className="text-muted-foreground">Email:</span> {email}</p>}
              {website && <p><span className="text-muted-foreground">Website:</span> {website}</p>}
              {Object.entries(filterValues).filter(([, v]) => v != null && v !== '').map(([k, v]) => (
                <p key={k}><span className="text-muted-foreground">{k}:</span> {typeof v === 'object' ? JSON.stringify(v) : String(v)}</p>
              ))}
              <p><span className="text-muted-foreground">Images:</span> {galleryFiles.length + (coverImage ? 1 : 0)} uploaded</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} disabled={submitting}>
            <ArrowLeft className="h-4 w-4 mr-1" /> {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          {step < totalSteps - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={realStep === 0 && !name.trim()}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
              {submitting ? 'Creating...' : 'Create Venue'} <Check className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
