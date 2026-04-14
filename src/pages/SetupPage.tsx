import { DEFAULT_TENANT_ID } from '@/config';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import FullscreenLoader from '@/components/FullscreenLoader';
import { Rocket } from 'lucide-react';

export default function SetupPage() {
  const tenant = useTenantStore((s) => s.tenant);
  const setTenant = useTenantStore((s) => s.setTenant);
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [platformName, setPlatformName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // If tenant already exists, redirect away from setup
    if (tenant) {
      navigate('/auth', { replace: true });
      return;
    }
    // Check DB directly (tenant store might not have loaded yet)
    supabase
      .from('tenants')
      .select('id')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          navigate('/auth', { replace: true });
        } else {
          setChecking(false);
        }
      });
  }, [tenant, navigate]);

  const handleSubmit = async () => {
    if (!platformName.trim() || !email.trim() || password.length < 6) {
      toast({ title: 'Please fill all fields (password min 6 chars)', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      // 1. Create tenant row
      const { data: newTenant, error: tenantErr } = await supabase
        .from('tenants')
        .insert({ tenant_id: DEFAULT_TENANT_ID, name: platformName.trim() })
        .select()
        .single();
      if (tenantErr) throw tenantErr;
      if (!newTenant) throw new Error('Tenant creation failed');

      // 2. Create auth user
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (authErr) throw authErr;
      if (!authData.user) throw new Error('User creation failed');

      // 3. Insert users row with creator role
      const { error: userErr } = await supabase.from('users').insert({
        id: authData.user.id,
        tenant_id: newTenant.id,
        email: email.trim(),
        username: email.split('@')[0],
        display_name: 'Admin',
        role: 'creator',
      });
      if (userErr) throw userErr;

      // 4. Insert site_settings
      const { error: settingsErr } = await supabase.from('site_settings').insert({
        tenant_id: newTenant.id,
        site_name: platformName.trim(),
      });
      if (settingsErr) throw settingsErr;

      // 5. Store tenant in Zustand
      setTenant({
        id: newTenant.id,
        name: newTenant.name,
        subdomain: newTenant.subdomain ?? null,
        logo_url: newTenant.logo_url ?? null,
        status: newTenant.status ?? null,
        onboarding_completed: newTenant.onboarding_completed ?? false,
        platform_type: newTenant.platform_type ?? null,
      });

      toast({ title: 'Setup complete! Redirecting to onboarding...' });
      navigate('/onboarding', { replace: true });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  if (checking) return <FullscreenLoader />;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg, #0a0a0a)' }}>
      <Card className="w-full max-w-md glass">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-2">
            <Rocket className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome! Let's set up your platform</CardTitle>
          <CardDescription>Create your admin account and name your platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Platform Name</label>
            <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} placeholder="My Awesome Platform" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Admin Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Admin Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? 'Setting up...' : 'Create Platform'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
