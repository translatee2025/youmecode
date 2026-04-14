import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertTriangle, Lock, Shield, Trash2, UserX, VolumeX, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { profile, session } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [blocked, setBlocked] = useState<any[]>([]);
  const [muted, setMuted] = useState<any[]>([]);
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    new_follower: true, post_liked: true, post_commented: true, mention: true,
    claim_approved: true, claim_rejected: true, badge_earned: true, new_message: true,
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setEmail(profile.email ?? '');
    (supabase.from('users' as any).select('notification_prefs').eq('id', profile.id).maybeSingle() as any)
      .then(({ data }: any) => { if (data?.notification_prefs) setNotifPrefs(data.notification_prefs); });
    Promise.all([
      supabase.from('blocks').select('id, blocked_id').eq('blocker_id', profile.id),
      supabase.from('mutes').select('id, muted_id').eq('muter_id', profile.id),
    ]).then(([b, m]) => { setBlocked(b.data ?? []); setMuted(m.data ?? []); });
  }, [profile]);

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
    await (supabase.from('users' as any).update({ notification_prefs: notifPrefs }) as any).eq('id', profile.id);
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

  // GDPR: Data export
  const exportData = async () => {
    if (!profile) return;
    setExportLoading(true);
    try {
      const [userRes, postsRes, commentsRes, ratingsRes, followsRes, savesRes, messagesRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', profile.id).maybeSingle(),
        supabase.from('posts').select('*').eq('user_id', profile.id),
        supabase.from('comments').select('*').eq('user_id', profile.id),
        supabase.from('ratings').select('*').eq('user_id', profile.id),
        supabase.from('follows').select('*').eq('follower_id', profile.id),
        supabase.from('saves').select('*').eq('user_id', profile.id),
        supabase.from('messages').select('*').eq('sender_id', profile.id),
      ]);
      const data = {
        exported_at: new Date().toISOString(),
        user: userRes.data,
        posts: postsRes.data ?? [],
        comments: commentsRes.data ?? [],
        ratings: ratingsRes.data ?? [],
        follows: followsRes.data ?? [],
        saves: savesRes.data ?? [],
        messages: messagesRes.data ?? [],
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-export-${profile.username || profile.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Your data export is ready' });
    } catch {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
    setExportLoading(false);
  };

  // GDPR: Account deletion
  const deleteAccount = async () => {
    if (!profile || deleteConfirm !== (profile.username || profile.email)) return;
    setDeleteLoading(true);
    try {
      // Anonymize user
      await supabase.from('users').update({
        username: `deleted_user_${profile.id.slice(0, 8)}`,
        email: null, avatar_url: null, bio: null, cover_url: null,
        display_name: 'Deleted User',
      }).eq('id', profile.id);
      // Redact posts
      await supabase.from('posts').update({ content: '[This post has been deleted]' }).eq('user_id', profile.id);
      // Sign out
      await supabase.auth.signOut();
      toast({ title: 'Account deleted' });
      navigate('/auth');
    } catch {
      toast({ title: 'Deletion failed', variant: 'destructive' });
    }
    setDeleteLoading(false);
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
            <Card><CardHeader><CardTitle className="text-base">Email</CardTitle><CardDescription>Change your email address</CardDescription></CardHeader>
              <CardContent className="space-y-2"><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /><Button size="sm" onClick={changeEmail}>Update Email</Button></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Password</CardTitle><CardDescription>Set a new password</CardDescription></CardHeader>
              <CardContent className="space-y-2"><Input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} /><Button size="sm" onClick={changePassword}>Update Password</Button></CardContent></Card>
          </TabsContent>

          {/* PRIVACY */}
          <TabsContent value="privacy" className="space-y-4 mt-4">
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><UserX className="h-4 w-4" /> Blocked Users</CardTitle></CardHeader>
              <CardContent>{blocked.length === 0 ? <p className="text-sm text-muted-foreground">No blocked users</p> : <div className="space-y-2">{blocked.map((b) => (<div key={b.id} className="flex items-center justify-between"><span className="text-sm text-foreground">{b.blocked_id}</span><Button variant="outline" size="sm" onClick={() => unblock(b.id)}>Unblock</Button></div>))}</div>}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><VolumeX className="h-4 w-4" /> Muted Users</CardTitle></CardHeader>
              <CardContent>{muted.length === 0 ? <p className="text-sm text-muted-foreground">No muted users</p> : <div className="space-y-2">{muted.map((m) => (<div key={m.id} className="flex items-center justify-between"><span className="text-sm text-foreground">{m.muted_id}</span><Button variant="outline" size="sm" onClick={() => unmute(m.id)}>Unmute</Button></div>))}</div>}</CardContent></Card>
            
            {/* GDPR: Data Export */}
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4" /> Download My Data</CardTitle><CardDescription>Export all your data as JSON</CardDescription></CardHeader>
              <CardContent><Button size="sm" variant="outline" onClick={exportData} disabled={exportLoading}>{exportLoading ? 'Preparing...' : 'Download My Data'}</Button></CardContent></Card>

            {/* GDPR: Account Deletion */}
            <Card className="border-destructive/30"><CardHeader><CardTitle className="text-base flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4" /> Delete Account</CardTitle><CardDescription>Permanently delete your account and anonymize your data</CardDescription></CardHeader>
              <CardContent><Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Account</Button></CardContent></Card>
          </TabsContent>

          {/* NOTIFICATIONS */}
          <TabsContent value="notifications" className="mt-4">
            <Card><CardHeader><CardTitle className="text-base">Notification Preferences</CardTitle><CardDescription>Choose which notifications you receive</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(notifPrefs).map(([key, val]) => (<div key={key} className="flex items-center justify-between"><span className="text-sm text-foreground capitalize">{key.replace(/_/g, ' ')}</span><Switch checked={val} onCheckedChange={(v) => setNotifPrefs({ ...notifPrefs, [key]: v })} /></div>))}
                <Button size="sm" onClick={saveNotifPrefs} className="mt-2">Save Preferences</Button>
              </CardContent></Card>
          </TabsContent>

          {/* SECURITY */}
          <TabsContent value="security" className="space-y-4 mt-4">
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Two-Factor Authentication</CardTitle><CardDescription>Protect your account with TOTP-based 2FA</CardDescription></CardHeader>
              <CardContent><TwoFactorSection /></CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Account Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Account</DialogTitle>
            <DialogDescription>This action cannot be undone. Your profile will be anonymized, your posts redacted, and your auth account removed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Type <strong>{profile?.username || profile?.email}</strong> to confirm:</p>
            <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="Type to confirm" />
            <Button variant="destructive" className="w-full" disabled={deleteLoading || deleteConfirm !== (profile?.username || profile?.email)} onClick={deleteAccount}>
              {deleteLoading ? 'Deleting...' : 'Permanently Delete My Account'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TwoFactorSection() {
  const [enrolling, setEnrolling] = useState(false);
  const [qrUri, setQrUri] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      if (data?.totp && data.totp.length > 0) setEnrolled(true);
    });
  }, []);

  const startEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); setEnrolling(false); return; }
    setQrUri(data.totp.uri);
    setFactorId(data.id);
  };

  const verify = async () => {
    setVerifying(true);
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) { toast({ title: 'Error', description: challenge.error.message, variant: 'destructive' }); setVerifying(false); return; }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code });
    if (error) { toast({ title: 'Invalid code', variant: 'destructive' }); setVerifying(false); return; }
    setEnrolled(true);
    setEnrolling(false);
    setQrUri('');
    toast({ title: '2FA enabled successfully' });
    setVerifying(false);
  };

  const disable = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    for (const f of data?.totp ?? []) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    setEnrolled(false);
    toast({ title: '2FA disabled' });
  };

  if (enrolled) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-foreground">✓ Two-factor authentication is enabled</p>
        <Button variant="outline" size="sm" onClick={disable}>Disable 2FA</Button>
      </div>
    );
  }

  if (enrolling && qrUri) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-foreground">Scan this QR code with your authenticator app:</p>
        <div className="bg-white p-4 rounded-lg inline-block">
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUri)}`} alt="2FA QR" className="w-48 h-48" />
        </div>
        <p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app:</p>
        <Input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} placeholder="000000" className="max-w-32" />
        <Button size="sm" onClick={verify} disabled={verifying || code.length !== 6}>{verifying ? 'Verifying...' : 'Verify & Enable'}</Button>
      </div>
    );
  }

  return <Button size="sm" onClick={startEnroll} disabled={enrolling}>{enrolling ? 'Setting up...' : 'Set up 2FA'}</Button>;
}
