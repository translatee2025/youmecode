import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { useWizardStore } from '@/stores/wizardStore';
import { ArrowLeft, Rocket, ExternalLink, Loader2 } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

const MODULE_LABELS: Record<string, string> = {
  landing: 'Landing Page', directory: 'Directory', wall: 'Wall',
  reels: 'Reels', explore: 'Explore', events: 'Events',
  blog: 'Blog', messenger: 'Messenger', chatrooms: 'Chat Rooms',
  discussions: 'Discussions', groups: 'Groups', charts: 'Charts',
  faq: 'FAQ', pages: 'CMS Pages', profiles: 'Profiles',
  notifications: 'Notifications',
};

interface Props {
  onBack: () => void;
}

export function StepSummary({ onBack }: Props) {
  const navigate = useNavigate();
  const tenant = useTenantStore((s) => s.tenant);
  const setTenant = useTenantStore((s) => s.setTenant);
  const wizard = useWizardStore();

  const [status, setStatus] = useState<'saving' | 'done' | 'error'>('saving');
  const [errorMsg, setErrorMsg] = useState('');
  const [totalCategories, setTotalCategories] = useState(0);

  useEffect(() => {
    if (!tenant) return;
    saveAll();
  }, []);

  const saveAll = async () => {
    if (!tenant) return;
    try {
      // 1. Upsert site_settings
      await supabase.from('site_settings').upsert({
        tenant_id: tenant.id,
        site_name: wizard.platformName || tenant.name,
        site_tagline: wizard.tagline || null,
        site_logo_url: wizard.logoUrl || null,
      }, { onConflict: 'tenant_id' });

      // 2. Update tenants
      await supabase.from('tenants').update({
        name: wizard.platformName || tenant.name,
        subdomain: wizard.subdomain || tenant.subdomain,
        platform_type: wizard.platformType,
        onboarding_completed: true,
        logo_url: wizard.logoUrl || tenant.logo_url,
      }).eq('id', tenant.id);

      // 3. Insert module_settings — delete existing first
      await supabase.from('module_settings').delete().eq('tenant_id', tenant.id);

      const moduleRows = wizard.enabledModules.map((key, i) => ({
        tenant_id: tenant.id,
        module_key: key,
        label: MODULE_LABELS[key] || key,
        is_enabled: true,
        sort_order: i,
        is_homepage: key === wizard.homepageModule,
      }));
      if (moduleRows.length > 0) {
        await supabase.from('module_settings').insert(moduleRows);
      }

      // 4. Import category packages
      let catCount = 0;
      if (wizard.selectedPackageIds.length > 0) {
        const { data: packages } = await supabase
          .from('category_packages')
          .select('*')
          .in('id', wizard.selectedPackageIds);

        if (packages) {
          for (const pkg of packages) {
            const suggestedCats = (pkg.suggested_categories || []) as { name: string; icon?: string; applies_to?: string }[];
            const suggestedSubs = (pkg.suggested_subcategories || []) as { name: string; parent_category_name?: string }[];
            const suggestedFilters = (pkg.suggested_filter_fields || []) as {
              label: string; key: string; field_type: string;
              options?: string[]; show_in_quick_filters?: boolean;
              applies_to?: string;
            }[];

            // Insert categories
            for (const cat of suggestedCats) {
              const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              const { data: inserted } = await supabase.from('categories').insert({
                tenant_id: tenant.id,
                name: cat.name,
                slug,
                icon: cat.icon || null,
                applies_to: (cat.applies_to as any) || 'both',
              }).select('id, name').single();

              if (inserted) {
                catCount++;

                // Insert subcategories for this category
                const subs = suggestedSubs.filter(
                  (s) => s.parent_category_name === cat.name
                );
                for (const sub of subs) {
                  const subSlug = sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                  await supabase.from('subcategories').insert({
                    tenant_id: tenant.id,
                    category_id: inserted.id,
                    name: sub.name,
                    slug: subSlug,
                  });
                }

                // Insert filter_fields for this category
                for (const f of suggestedFilters) {
                  await supabase.from('filter_fields').insert({
                    tenant_id: tenant.id,
                    category_id: inserted.id,
                    label: f.label,
                    field_key: f.key,
                    field_type: f.field_type,
                    options: (f.options || []) as unknown as Json,
                    show_in_quick_filters: f.show_in_quick_filters || false,
                    applies_to: (f.applies_to as any) || 'both',
                  });
                }
              }
            }
          }
        }
      }
      setTotalCategories(catCount);

      // 5. Insert theme_settings
      await supabase.from('theme_settings').delete().eq('tenant_id', tenant.id);

      const themeMap: Record<string, string> = {
        'color-bg': wizard.colors.bg,
        'color-card-bg': wizard.colors.cardBg,
        'color-text': wizard.colors.text,
        'color-text-muted': wizard.colors.textMuted,
        'color-primary': wizard.colors.primary,
        'color-nav': wizard.colors.nav,
        'color-button': wizard.colors.button,
        'color-border': wizard.colors.border,
      };

      const themeRows = Object.entries(themeMap).map(([key, value]) => ({
        tenant_id: tenant.id,
        key,
        value,
      }));
      await supabase.from('theme_settings').insert(themeRows);

      // Update local tenant state
      setTenant({
        ...tenant,
        name: wizard.platformName || tenant.name,
        subdomain: wizard.subdomain || tenant.subdomain,
        platform_type: wizard.platformType,
        onboarding_completed: true,
        logo_url: wizard.logoUrl || tenant.logo_url,
      });

      setStatus('done');
    } catch (e: any) {
      setErrorMsg(e.message || 'Something went wrong');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      {status === 'saving' && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--color-primary)' }} />
          <p className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>
            Setting up your platform...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center py-20 gap-4">
          <p className="text-lg font-medium text-red-400">Something went wrong</p>
          <p className="text-sm text-red-300">{errorMsg}</p>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
        </div>
      )}

      {status === 'done' && (
        <>
          <div className="text-center space-y-3">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--color-text, #f0f0f0)' }}>
              Your platform is ready!
            </h1>
          </div>

          {/* Summary card */}
          <div
            className="rounded-2xl p-6 space-y-5"
            style={{
              background: wizard.colors.cardBg,
              border: `1px solid ${wizard.colors.border}`,
            }}
          >
            <div className="flex items-center gap-4">
              {wizard.logoUrl ? (
                <img src={wizard.logoUrl} alt="" className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <div
                  className="h-14 w-14 rounded-xl flex items-center justify-center text-xl font-bold"
                  style={{ background: wizard.colors.primary, color: wizard.colors.bg }}
                >
                  {(wizard.platformName || 'N')[0].toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold" style={{ color: wizard.colors.text }}>
                  {wizard.platformName || tenant?.name}
                </h3>
                {wizard.tagline && (
                  <p className="text-sm" style={{ color: wizard.colors.textMuted }}>
                    {wizard.tagline}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: wizard.colors.primary }}>
                  {wizard.platformType || '—'}
                </p>
                <p className="text-xs mt-1" style={{ color: wizard.colors.textMuted }}>Type</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: wizard.colors.primary }}>
                  {wizard.enabledModules.length}
                </p>
                <p className="text-xs mt-1" style={{ color: wizard.colors.textMuted }}>Modules</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: wizard.colors.primary }}>
                  {totalCategories}
                </p>
                <p className="text-xs mt-1" style={{ color: wizard.colors.textMuted }}>Categories</p>
              </div>
            </div>

            {/* Palette preview */}
            <div className="flex gap-2 justify-center">
              {[wizard.colors.bg, wizard.colors.primary, wizard.colors.button, wizard.colors.text].map((c, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full"
                  style={{ background: c, border: '2px solid rgba(128,128,128,0.3)' }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-base"
              style={{
                background: wizard.colors.button,
                color: wizard.colors.bg,
              }}
            >
              <Rocket className="w-5 h-5" />
              Go to Admin Panel
            </button>
            <button
              onClick={() => window.open('/', '_blank')}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-medium text-sm"
              style={{
                border: `1px solid ${wizard.colors.border}`,
                color: wizard.colors.text,
              }}
            >
              <ExternalLink className="w-4 h-4" />
              Preview My Platform
            </button>
          </div>
        </>
      )}
    </div>
  );
}
