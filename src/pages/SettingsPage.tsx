import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Lock, Shield, Trash2, UserX, VolumeX } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const tenant = useTenantStore((s) => s.tenant);
  const { profile, session } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [blocked, setBlocked] = useState<any[]>([]);
  const [muted, setMuted] = useState<any[]>([]);
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    new_follower: true,
    post_liked: true,
    post_commented: true,
    mention: true,
    claim_approved: true,
    claim_rejected: true,
    badge_earned: true,
    new_message: true,
  });

  useEffect(() => {
    if (!profile || !tenant) return;
    setEmail(profile.email ?? '');
    // Load notification prefs from user record
    (supabase.from('users' as any).select('notification_prefs').eq('id', profile.id).maybeSingle() as any)
      .then(({ data }: any) => { if (data?.notification_prefs) setNotifPrefs(data.notification_prefs); });

    // Load blocked and muted
    Promise.all([
      supabase.from('blocks').select('id, blocked_id').eq('tenant_id', tenant.id).eq('blocker_id', profile.id),
      supabase.from('mutes').select('id, muted_id').eq('tenant_id', tenant.id).eq('muter_id', profile.id),
    ]).then(([b, m]) => {
      setBlocked(b.data ?? []);
      setMuted(m.data ?? []);
    });
  }, [profile, tenant]);

  const changeEmail = async () => {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Verification email sent to ' + email });
  };

  const changePassword = async () => {
    if (password.length < 6) { toast({ title: 'Password must be at least 6 characters', variant: 'destructive' }); return; }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Password updated' }); setPassword(''); }
  };

  const saveNotifPrefs = async () => {
    if (!profile) return;
    await supabase.from('users' as any).update({ notification_prefs: notifPrefs }).eq('id', profile.id);
    toast({ title: 'Notification preferences saved' });
  };

  const unblock = async (blockId: string) => {
    await supabase.from('blocks').delete().eq('id', blockId);
    setBlocked(blocked.filter((b) => b.id !== blockId));
    toast({ title: 'User unblocked' });
  };

  const unmute = async (muteId: string) => {
    await supabase.from('mutes').delete().eq('id', muteId);
    setMuted(muted.filter((m) => m.id !== muteId));
    toast({ title: 'User unmuted' });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

        <Tabs defaultValue="account">
          <TabsList className="w-full justify-start bg-secondary/30">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* ACCOUNT */}
          <TabsContent value="account" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email</CardTitle>
                <CardDescription>Change your email address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
                <Button size="sm" onClick={changeEmail}>Update Email</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Password</CardTitle>
                <CardDescription>Set a new password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button size="sm" onClick={changePassword}>Update Password</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PRIVACY */}
          <TabsContent value="privacy" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><UserX className="h-4 w-4" /> Blocked Users</CardTitle>
              </CardHeader>
              <CardContent>
                {blocked.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No blocked users</p>
                ) : (
                  <div className="space-y-2">
                    {blocked.map((b) => (
                      <div key={b.id} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{b.blocked_id}</span>
                        <Button variant="outline" size="sm" onClick={() => unblock(b.id)}>Unblock</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><VolumeX className="h-4 w-4" /> Muted Users</CardTitle>
              </CardHeader>
              <CardContent>
                {muted.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No muted users</p>
                ) : (
                  <div className="space-y-2">
                    {muted.map((m) => (
                      <div key={m.id} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{m.muted_id}</span>
                        <Button variant="outline" size="sm" onClick={() => unmute(m.id)}>Unmute</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* NOTIFICATIONS */}
          <TabsContent value="notifications" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notification Preferences</CardTitle>
                <CardDescription>Choose which notifications you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(notifPrefs).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <Switch checked={val} onCheckedChange={(v) => setNotifPrefs({ ...notifPrefs, [key]: v })} />
                  </div>
                ))}
                <Button size="sm" onClick={saveNotifPrefs} className="mt-2">Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECURITY */}
          <TabsContent value="security" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Two-Factor Authentication</CardTitle>
                <CardDescription>Coming soon</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" disabled>Enable 2FA</Button>
              </CardContent>
            </Card>

            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4" /> Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" disabled>Download My Data</Button>
                <Button variant="destructive" size="sm" disabled>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
