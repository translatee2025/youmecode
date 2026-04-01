import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import FollowButton from '@/components/common/FollowButton';
import DynamicFilterValues from '@/components/common/DynamicFilterValues';
import FullscreenLoader from '@/components/FullscreenLoader';
import {
  BadgeCheck, Edit, FileText, MapPin, MessageCircle, MoreHorizontal, Shield, Users,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const tenant = useTenantStore((s) => s.tenant);
  const profile = useAuthStore((s) => s.profile);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0, venues: 0 });
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: '', bio: '', location_city: '' });
  const [badges, setBadges] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('posts');

  const isOwnProfile = profile?.username === username;

  useEffect(() => {
    if (!tenant || !username) return;
    const load = async () => {
      const { data: uRaw } = await (supabase.from('users' as any).select('*').eq('tenant_id', tenant.id).eq('username', username).maybeSingle() as any);
      const u = uRaw as any;
      if (!u) { setLoading(false); return; }
      setUser(u);
      setEditForm({ display_name: u.display_name ?? '', bio: u.bio ?? '', location_city: u.location_city ?? '' });

      const [postsRes, followersRes, followingRes, venuesRes, badgesRes] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('user_id', u.id),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('followee_type', 'user').eq('followee_id', u.id),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('follower_id', u.id),
        (supabase.from('venues' as any).select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('owner_id', u.id) as any),
        supabase.from('badges').select('*').eq('tenant_id', tenant.id).eq('is_active', true),
      ]);
      setStats({
        posts: postsRes.count ?? 0,
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
        venues: venuesRes.count ?? 0,
      });
      setBadges(badgesRes.data ?? []);
      setLoading(false);
    };
    load();
  }, [tenant, username]);

  const saveProfile = async () => {
    if (!user) return;
    await supabase.from('users' as any).update({
      display_name: editForm.display_name,
      bio: editForm.bio,
      location_city: editForm.location_city,
    }).eq('id', user.id);
    setUser({ ...user, ...editForm });
    setEditOpen(false);
    toast({ title: 'Profile updated' });
  };

  if (loading) return <FullscreenLoader />;
  if (!user) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">User not found</div>;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Cover */}
      <div className="h-40 sm:h-52" style={{ background: user.cover_url ? `url(${user.cover_url}) center/cover` : 'linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--accent)))' }} />

      <div className="max-w-3xl mx-auto px-4 -mt-12 relative z-10">
        {/* Profile header */}
        <div className="flex items-end gap-4">
          <Avatar className="h-20 w-20 border-4 border-background">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="text-2xl bg-secondary">{(user.display_name ?? user.username ?? '?').charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 mb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{user.display_name ?? user.username}</h1>
              {user.is_verified && <BadgeCheck className="h-5 w-5 text-blue-400" />}
            </div>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
          <div className="flex gap-2 mb-1">
            {isOwnProfile ? (
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm"><Edit className="h-3.5 w-3.5 mr-1" /> Edit Profile</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Display name" value={editForm.display_name} onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })} />
                    <Textarea placeholder="Bio" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} />
                    <Input placeholder="City" value={editForm.location_city} onChange={(e) => setEditForm({ ...editForm, location_city: e.target.value })} />
                    <Button onClick={saveProfile} className="w-full">Save</Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <>
                <FollowButton followeeType="user" followeeId={user.id} />
                <Button variant="outline" size="sm"><MessageCircle className="h-3.5 w-3.5" /></Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem><Shield className="h-3.5 w-3.5 mr-2" /> Report</DropdownMenuItem>
                    <DropdownMenuItem>Block</DropdownMenuItem>
                    <DropdownMenuItem>Mute</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {user.bio && <p className="text-sm text-foreground/90 mt-3">{user.bio}</p>}
        {user.location_city && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="h-3.5 w-3.5" /> {user.location_city}
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-6 mt-4 text-sm">
          {[
            { label: 'Posts', val: stats.posts },
            { label: 'Followers', val: stats.followers },
            { label: 'Following', val: stats.following },
            { label: 'Venues', val: stats.venues },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-bold text-foreground">{s.val}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Dynamic user fields */}
        {user.custom_field_values && (
          <div className="mt-4">
            <DynamicFilterValues filterValues={user.custom_field_values} categoryId={null} />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="w-full justify-start bg-secondary/30">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="reels">Reels</TabsTrigger>
            <TabsTrigger value="venues">Venues</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            {isOwnProfile && <TabsTrigger value="saved">Saved</TabsTrigger>}
            <TabsTrigger value="badges">Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4">
            <p className="text-sm text-muted-foreground text-center py-8">Posts will appear here</p>
          </TabsContent>
          <TabsContent value="reels" className="mt-4">
            <p className="text-sm text-muted-foreground text-center py-8">Reels will appear here</p>
          </TabsContent>
          <TabsContent value="venues" className="mt-4">
            <p className="text-sm text-muted-foreground text-center py-8">Venues will appear here</p>
          </TabsContent>
          <TabsContent value="reviews" className="mt-4">
            <p className="text-sm text-muted-foreground text-center py-8">Reviews will appear here</p>
          </TabsContent>
          {isOwnProfile && (
            <TabsContent value="saved" className="mt-4">
              <p className="text-sm text-muted-foreground text-center py-8">Saved items will appear here</p>
            </TabsContent>
          )}
          <TabsContent value="badges" className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badges.map((b) => (
                <div key={b.id} className="glass p-3 text-center space-y-1">
                  <span className="text-2xl">{b.icon ?? '🏆'}</span>
                  <h4 className="text-xs font-semibold">{b.name}</h4>
                  <p className="text-[10px] text-muted-foreground">{b.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
