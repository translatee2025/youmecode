import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_TENANT_ID } from '@/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Shield, Users, Key, Info } from 'lucide-react';

export default function AdminSecurity() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [requireEmail, setRequireEmail] = useState(true);
  const [allowGoogle, setAllowGoogle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('site_settings').select('*').eq('tenant_id', DEFAULT_TENANT_ID).maybeSingle(),
    ]).then(([usersRes, settRes]) => {
      setTotalUsers(usersRes.count ?? 0);
      if (settRes.data?.custom_css) {
        try {
          const sec = JSON.parse(settRes.data.custom_css);
          setRequireEmail(sec.require_email_verification ?? true);
          setAllowGoogle(sec.allow_google_login ?? false);
        } catch {}
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { data: existing } = await supabase.from('site_settings').select('id').eq('tenant_id', DEFAULT_TENANT_ID).maybeSingle();
    const payload = {
      tenant_id: DEFAULT_TENANT_ID,
      custom_css: JSON.stringify({ require_email_verification: requireEmail, allow_google_login: allowGoogle }),
    };
    if (existing) {
      await (supabase.from('site_settings').update(payload as any).eq('id', existing.id) as any);
    } else {
      await (supabase.from('site_settings').insert({ ...payload, site_name: 'My Community' } as any) as any);
    }
    setSaving(false);
    toast({ title: 'Security settings saved' });
  };

  if (loading) return <div className="animate-pulse h-64 rounded-xl" style={{ background: 'var(--color-card-bg)' }} />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Security</h1>

      {/* 2FA Status */}
      <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Key className="h-4 w-4" /> Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{totalUsers}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Total Users</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>—</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>2FA Enabled</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>—</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>2FA Disabled</p>
            </div>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
            2FA status tracking requires Supabase Auth MFA configuration. Counts will appear once MFA is enabled.
          </p>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Users className="h-4 w-4" /> Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Session management is handled by the authentication system. Active sessions, session revocation, and token management are configured at the infrastructure level through Lovable Cloud.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Shield className="h-4 w-4" /> Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Require email verification before login</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Users must verify their email address before they can sign in</p>
            </div>
            <Switch checked={requireEmail} onCheckedChange={setRequireEmail} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Allow social login via Google</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Enable Google OAuth as a login option</p>
            </div>
            <Switch checked={allowGoogle} onCheckedChange={setAllowGoogle} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} style={{ background: 'var(--color-button)', color: 'var(--color-bg)' }}>
        {saving ? 'Saving...' : 'Save Security Settings'}
      </Button>
    </div>
  );
}
