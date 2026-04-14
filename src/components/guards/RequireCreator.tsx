import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_TENANT_ID } from '@/config';
import FullscreenLoader from '@/components/FullscreenLoader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';

function FirstAdminSetup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [platformName, setPlatformName] = useState('My Community');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Insert user row with creator role
      await supabase.from('users').insert({
        id: authData.user.id,
        email,
        role: 'creator',
        display_name: 'Admin',
        username: 'admin',
      } as any);

      // Upsert site_settings
      const { data: existing } = await supabase.from('site_settings').select('id').eq('tenant_id', DEFAULT_TENANT_ID).maybeSingle();
      if (existing) {
        await supabase.from('site_settings').update({ site_name: platformName } as any).eq('id', existing.id);
      } else {
        await supabase.from('site_settings').insert({ tenant_id: DEFAULT_TENANT_ID, site_name: platformName } as any);
      }

      toast({ title: 'Admin account created! Reloading...' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg, #0a0a0a)' }}>
      <Card className="w-full max-w-md border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 h-12 w-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <Shield className="h-6 w-6" style={{ color: 'var(--color-text)' }} />
          </div>
          <CardTitle className="text-xl" style={{ color: 'var(--color-text)' }}>Create Admin Account</CardTitle>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No admin exists yet. Set up the first admin account to get started.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label style={{ color: 'var(--color-text-muted)' }}>Email</Label>
              <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: 'var(--color-text-muted)' }}>Password</Label>
              <Input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: 'var(--color-text-muted)' }}>Confirm Password</Label>
              <Input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: 'var(--color-text-muted)' }}>Platform Name</Label>
              <Input value={platformName} onChange={e => setPlatformName(e.target.value)} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting} style={{ background: 'var(--color-button)', color: 'var(--color-bg)' }}>
              {submitting ? 'Creating...' : 'Create Admin & Launch'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function RequireCreator({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [noAdmin, setNoAdmin] = useState(false);

  useEffect(() => {
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'creator')
      .then(({ count }) => {
        setNoAdmin((count ?? 0) === 0);
        setChecking(false);
      });
  }, []);

  if (isLoading || checking) return <FullscreenLoader />;

  // No admin exists — show setup form regardless of auth state
  if (noAdmin) return <FirstAdminSetup />;

  // Normal guard
  if (!profile || profile.role !== 'creator') return <Navigate to="/" replace />;

  return <>{children}</>;
}
