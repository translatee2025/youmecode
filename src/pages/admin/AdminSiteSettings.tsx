import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_TENANT_ID } from '@/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SiteSettings {
  id?: string;
  site_name: string;
  site_tagline: string;
  site_logo_url: string;
  contact_email: string;
  social_links: Record<string, string>;
  commerce_enabled: boolean;
  media_upload_mode: string;
  venue_label: string;
  product_label: string;
  user_label: string;
}

const defaultSettings: SiteSettings = {
  site_name: '', site_tagline: '', site_logo_url: '', contact_email: '',
  social_links: { instagram: '', twitter: '', tiktok: '', facebook: '', whatsapp: '', telegram: '', youtube: '' },
  commerce_enabled: false, media_upload_mode: 'gallery_camera',
  venue_label: 'Venues', product_label: 'Products', user_label: 'Members',
};

export default function AdminSiteSettings() {
  const [form, setForm] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCommerceModal, setShowCommerceModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('*').eq('tenant_id', DEFAULT_TENANT_ID).maybeSingle().then(({ data }) => {
      if (data) {
        setForm({
          id: data.id,
          site_name: data.site_name || '',
          site_tagline: data.site_tagline || '',
          site_logo_url: data.site_logo_url || '',
          contact_email: data.contact_email || '',
          social_links: (data.social_links as Record<string, string>) || defaultSettings.social_links,
          commerce_enabled: data.commerce_enabled ?? false,
          media_upload_mode: data.media_upload_mode || 'gallery_camera',
          venue_label: data.venue_label || 'Venues',
          product_label: data.product_label || 'Products',
          user_label: data.user_label || 'Members',
        });
      }
      setLoading(false);
    });
  }, []);

  const update = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const updateSocial = (key: string, value: string) =>
    setForm(prev => ({ ...prev, social_links: { ...prev.social_links, [key]: value } }));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file ) return;
    setUploading(true);
    const path = `${DEFAULT_TENANT_ID}/logo-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true });
    if (error) { toast({ title: 'Upload failed', variant: 'destructive' }); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
    update('site_logo_url', publicUrl);
    setUploading(false);
  };

  const handleCommerceToggle = (enabled: boolean) => {
    if (enabled) { setShowCommerceModal(true); return; }
    update('commerce_enabled', false);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      tenant_id: DEFAULT_TENANT_ID,
      site_name: form.site_name,
      site_tagline: form.site_tagline,
      site_logo_url: form.site_logo_url,
      contact_email: form.contact_email,
      social_links: form.social_links,
      commerce_enabled: form.commerce_enabled,
      media_upload_mode: form.media_upload_mode,
      venue_label: form.venue_label,
      product_label: form.product_label,
      user_label: form.user_label,
    };

    if (form.id) {
      await supabase.from('site_settings').update(payload).eq('id', form.id);
    } else {
      const { data } = await supabase.from('site_settings').insert(payload).select('id').single();
      if (data) setForm(prev => ({ ...prev, id: data.id }));
    }
    setSaving(false);
    toast({ title: 'Settings saved!' });
  };

  if (loading) return <div className="animate-pulse h-64 rounded-xl" style={{ background: 'var(--color-card-bg)' }} />;

  const socialKeys = ['instagram', 'twitter', 'tiktok', 'facebook', 'whatsapp', 'telegram', 'youtube'];

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text, #f0f0f0)' }}>Site Settings</h1>

      {/* General */}
      <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--color-text)' }}>General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label style={{ color: 'var(--color-text-muted)' }}>Platform Name</Label>
            <Input value={form.site_name} onChange={e => update('site_name', e.target.value)} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
          </div>
          <div className="space-y-1.5">
            <Label style={{ color: 'var(--color-text-muted)' }}>Tagline</Label>
            <Input value={form.site_tagline} onChange={e => update('site_tagline', e.target.value)} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
          </div>
          <div className="space-y-1.5">
            <Label style={{ color: 'var(--color-text-muted)' }}>Logo</Label>
            <div className="flex items-center gap-3">
              {form.site_logo_url && <img src={form.site_logo_url} alt="Logo" className="h-10 rounded" />}
              <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label style={{ color: 'var(--color-text-muted)' }}>Contact Email</Label>
            <Input type="email" value={form.contact_email} onChange={e => update('contact_email', e.target.value)} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--color-text)' }}>Social Links</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {socialKeys.map(key => (
            <div key={key} className="space-y-1">
              <Label className="capitalize text-xs" style={{ color: 'var(--color-text-muted)' }}>{key === 'twitter' ? 'X / Twitter' : key}</Label>
              <Input value={form.social_links[key] || ''} onChange={e => updateSocial(key, e.target.value)} placeholder={`https://${key}.com/...`} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Commerce */}
      <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--color-text)' }}>Commerce</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Enable Commerce</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {form.commerce_enabled
                  ? 'Commerce is active. Vendors can claim venues and list products.'
                  : 'Commerce is off. No pricing, products, or payment features are visible.'}
              </p>
            </div>
            <Switch checked={form.commerce_enabled} onCheckedChange={handleCommerceToggle} />
          </div>
        </CardContent>
      </Card>

      {/* Media Upload Mode */}
      <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--color-text)' }}>Media Upload Mode</CardTitle></CardHeader>
        <CardContent>
          <RadioGroup value={form.media_upload_mode} onValueChange={v => update('media_upload_mode', v)} className="space-y-2">
            {[
              { value: 'gallery_cam', label: 'Gallery & Camera', desc: 'Users can upload files from their device OR record with camera' },
              { value: 'cam_only', label: 'Camera Only', desc: 'Users can only record with camera. No file picker. No gallery access. For platforms wanting only live authentic content.' },
              { value: 'links_only', label: 'Links Only', desc: 'Users paste a YouTube or TikTok URL. No upload, no camera.' },
            ].map(opt => (
              <div key={opt.value} className="flex items-start gap-3 p-3 rounded-lg cursor-pointer" style={{ background: form.media_upload_mode === opt.value ? 'rgba(255,255,255,0.08)' : 'transparent', border: `1px solid ${form.media_upload_mode === opt.value ? 'var(--color-primary)' : 'var(--color-border)'}` }}>
                <RadioGroupItem value={opt.value} id={opt.value} className="mt-0.5" />
                <div>
                  <Label htmlFor={opt.value} className="text-sm font-medium cursor-pointer" style={{ color: 'var(--color-text)' }}>{opt.label}</Label>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{opt.desc}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Custom Labels */}
      <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--color-text)' }}>Custom Labels</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Venue Label</Label>
            <Input value={form.venue_label} onChange={e => update('venue_label', e.target.value)} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Product Label</Label>
            <Input value={form.product_label} onChange={e => update('product_label', e.target.value)} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Member Label</Label>
            <Input value={form.user_label} onChange={e => update('user_label', e.target.value)} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} style={{ background: 'var(--color-button, #fff)', color: 'var(--color-bg, #0a0a0a)' }}>
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>

      {/* Commerce Confirmation */}
      <AlertDialog open={showCommerceModal} onOpenChange={setShowCommerceModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable Commerce?</AlertDialogTitle>
            <AlertDialogDescription>
              Enabling commerce allows vendors to claim venues, accept terms, activate subscriptions, and list products. This will show pricing and commerce-related UI across the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { update('commerce_enabled', true); setShowCommerceModal(false); }}>
              Enable Commerce
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
