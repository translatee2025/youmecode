import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { useWizardStore } from '@/stores/wizardStore';
import { ArrowLeft, Upload, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function StepIdentity({ onNext, onBack }: Props) {
  const tenant = useTenantStore((s) => s.tenant);
  const {
    platformName, setPlatformName,
    tagline, setTagline,
    logoUrl, setLogoUrl,
    subdomain, setSubdomain,
    colors,
  } = useWizardStore();

  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [uploading, setUploading] = useState(false);

  // Debounced subdomain check
  useEffect(() => {
    if (!subdomain || subdomain.length < 2) {
      setSubdomainStatus('idle');
      return;
    }
    setSubdomainStatus('checking');
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', subdomain)
        .neq('id', tenant?.id || '')
        .maybeSingle();
      setSubdomainStatus(data ? 'taken' : 'available');
    }, 500);
    return () => clearTimeout(timer);
  }, [subdomain, tenant?.id]);

  const handleLogoUpload = useCallback(async (file: File) => {
    if (!tenant) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${tenant.id}/logo.${ext}`;

    const { error } = await supabase.storage
      .from('media')
      .upload(path, file, { upsert: true });

    if (!error) {
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      setLogoUrl(urlData.publicUrl);
    }
    setUploading(false);
  }, [tenant, setLogoUrl]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleLogoUpload(file);
  }, [handleLogoUpload]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--color-text, #f0f0f0)' }}>
          Give your platform an identity
        </h1>
        <p style={{ color: 'var(--color-text-muted, #888)' }}>
          You can always change these later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left — Form */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Label style={{ color: 'var(--color-text)' }}>Platform Name</Label>
            <Input
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              placeholder="My Awesome Platform"
              className="bg-transparent text-base"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>

          <div className="space-y-2">
            <Label style={{ color: 'var(--color-text)' }}>Tagline</Label>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Discover the best in your city"
              className="bg-transparent"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>

          {/* Logo upload */}
          <div className="space-y-2">
            <Label style={{ color: 'var(--color-text)' }}>Logo</Label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleLogoUpload(file);
                };
                input.click();
              }}
              className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl cursor-pointer transition-colors"
              style={{
                border: '2px dashed var(--color-border)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <>
                  <Upload className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {uploading ? 'Uploading...' : 'Drop logo here or click to upload'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Subdomain */}
          <div className="space-y-2">
            <Label style={{ color: 'var(--color-text)' }}>Subdomain</Label>
            <div className="flex items-center gap-0">
              <Input
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="myplatform"
                className="bg-transparent rounded-r-none"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              />
              <span
                className="px-3 py-2 text-xs font-medium rounded-r-lg whitespace-nowrap h-9 flex items-center"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                  borderLeft: 'none',
                }}
              >
                .nexusos.com
              </span>
            </div>
            {subdomainStatus === 'available' && (
              <p className="flex items-center gap-1 text-xs text-green-400">
                <Check className="w-3 h-3" /> Available
              </p>
            )}
            {subdomainStatus === 'taken' && (
              <p className="flex items-center gap-1 text-xs text-red-400">
                <X className="w-3 h-3" /> Already taken
              </p>
            )}
          </div>
        </div>

        {/* Right — Live Preview */}
        <div className="space-y-3">
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Live Preview
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
            {/* Mock nav */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ background: colors.nav }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-7 w-7 rounded-lg object-cover" />
              ) : (
                <div
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: colors.primary, color: colors.bg }}
                >
                  {platformName?.[0]?.toUpperCase() || 'N'}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold" style={{ color: colors.text }}>
                  {platformName || 'Your Platform'}
                </p>
                {tagline && (
                  <p className="text-[10px]" style={{ color: colors.textMuted }}>
                    {tagline}
                  </p>
                )}
              </div>
            </div>
            {/* Mock content */}
            <div className="p-4 space-y-3" style={{ background: colors.bg }}>
              <div className="h-20 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-12 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
                <div className="h-12 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ color: 'var(--color-text-muted, #888)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={onNext}
            className="px-6 py-2.5 rounded-xl text-sm font-medium"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Skip
          </button>
          <button
            onClick={onNext}
            className="px-10 py-3 rounded-xl font-semibold text-base"
            style={{
              background: 'var(--color-button, #fff)',
              color: 'var(--color-bg, #0a0a0a)',
            }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
