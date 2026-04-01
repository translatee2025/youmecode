import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Lock, MessageSquare, Plus, UserPlus, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function GroupsPage() {
  const { id } = useParams();
  if (id) return <GroupDetail groupId={id} />;
  return <GroupDiscovery />;
}

function GroupDiscovery() {
  const tenant = useTenantStore((s) => s.tenant);
  const { profile } = useAuthStore();
  const [tab, setTab] = useState<'discover' | 'mine'>('discover');
  const [groups, setGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!tenant) return;
    supabase.from('groups').select('*').eq('tenant_id', tenant.id).order('member_count', { ascending: false })
      .then(({ data }) => setGroups(data || []));

    if (profile) {
      supabase.from('group_members').select('group_id').eq('tenant_id', tenant.id).eq('user_id', profile.id)
        .then(async ({ data }) => {
          if (data && data.length > 0) {
            const ids = data.map((g) => g.group_id).filter(Boolean);
            const { data: grps } = await supabase.from('groups').select('*').in('id', ids as string[]);
            setMyGroups(grps || []);
          }
        });
    }
  }, [tenant, profile]);

  const createGroup = async () => {
    if (!name.trim() || !tenant || !profile) return;
    const { data, error } = await supabase.from('groups').insert({
      tenant_id: tenant.id,
      creator_id: profile.id,
      name: name.trim(),
      description: desc.trim() || null,
      is_private: isPrivate,
      member_count: 1,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    if (data) {
      // Add creator as admin member
      await supabase.from('group_members').insert({
        tenant_id: tenant.id,
        group_id: data.id,
        user_id: profile.id,
        role: 'admin',
      });
      // Auto-create chat room
      await supabase.from('chat_rooms').insert({
        tenant_id: tenant.id,
        group_id: data.id,
        name: `${name.trim()} Chat`,
        type: 'group',
        created_by: profile.id,
      });
      setShowCreate(false);
      navigate(`/groups/${data.id}`);
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!tenant || !profile) return;
    await supabase.from('group_members').insert({
      tenant_id: tenant.id,
      group_id: groupId,
      user_id: profile.id,
      role: 'member',
    });
    toast({ title: 'Joined group!' });
    setMyGroups((prev) => [...prev, groups.find((g) => g.id === groupId)].filter(Boolean));
  };

  const isMember = (groupId: string) => myGroups.some((g) => g?.id === groupId);

  const displayGroups = tab === 'mine' ? myGroups : groups;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Groups</h1>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> Create Group</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Group</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} />
                <Textarea placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground flex items-center gap-2"><Lock className="h-4 w-4" /> Private (invite only)</span>
                  <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                </div>
                <Button onClick={createGroup} disabled={!name.trim()} className="w-full">Create Group</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mb-6">
          <TabsList>
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="mine">My Groups</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayGroups.map((g) => g && (
            <Card key={g.id} className="overflow-hidden">
              {g.cover_url && <div className="h-24 bg-cover bg-center" style={{ backgroundImage: `url(${g.cover_url})` }} />}
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={g.avatar_url} />
                    <AvatarFallback>{g.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link to={`/groups/${g.id}`} className="text-sm font-semibold text-foreground hover:underline">{g.name}</Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{g.member_count || 0}</span>
                      {g.is_private && <Badge variant="outline" className="text-[10px]"><Lock className="h-2.5 w-2.5 mr-0.5" />Private</Badge>}
                    </div>
                  </div>
                </div>
                {g.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{g.description}</p>}
                {!isMember(g.id) && (
                  <Button size="sm" className="w-full mt-3" onClick={() => joinGroup(g.id)}>Join</Button>
                )}
              </CardContent>
            </Card>
          ))}
          {displayGroups.length === 0 && <p className="text-muted-foreground col-span-3 text-center py-8">No groups found</p>}
        </div>
      </div>
    </div>
  );
}

function GroupDetail({ groupId }: { groupId: string }) {
  const tenant = useTenantStore((s) => s.tenant);
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!tenant) return;
    supabase.from('groups').select('*').eq('id', groupId).eq('tenant_id', tenant.id).maybeSingle()
      .then(({ data }) => setGroup(data));

    supabase
      .from('group_members')
      .select('*, user:users!group_members_user_id_fkey(id, username, display_name, avatar_url)')
      .eq('group_id', groupId)
      .eq('tenant_id', tenant.id)
      .then(({ data }) => {
        setMembers(data || []);
        if (profile) setIsMember((data || []).some((m) => m.user_id === profile.id));
      });

    supabase.from('events').select('*').eq('tenant_id', tenant.id).eq('venue_id', groupId).order('start_at')
      .then(({ data }) => setEvents(data || []));
  }, [tenant, groupId, profile]);

  const joinGroup = async () => {
    if (!tenant || !profile) return;
    await supabase.from('group_members').insert({ tenant_id: tenant.id, group_id: groupId, user_id: profile.id, role: 'member' });
    setIsMember(true);
    toast({ title: 'Joined!' });
  };

  const leaveGroup = async () => {
    if (!tenant || !profile) return;
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', profile.id);
    setIsMember(false);
    toast({ title: 'Left group' });
  };

  if (!group) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}><p className="text-muted-foreground">Loading...</p></div>;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Cover */}
      <div className="h-40 relative" style={{ background: group.cover_url ? `url(${group.cover_url}) center/cover` : 'var(--color-card-bg, rgba(255,255,255,0.04))' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-10 relative">
        <div className="flex items-end gap-4 mb-6">
          <Avatar className="h-20 w-20 border-4 border-background">
            <AvatarImage src={group.avatar_url} />
            <AvatarFallback className="text-2xl">{group.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{group.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />{group.member_count || members.length} members
              {group.is_private && <Badge variant="outline"><Lock className="h-3 w-3 mr-0.5" />Private</Badge>}
            </p>
          </div>
          {profile && (
            isMember
              ? <Button variant="outline" onClick={leaveGroup}>Leave</Button>
              : <Button onClick={joinGroup}><UserPlus className="h-4 w-4 mr-1" /> Join</Button>
          )}
        </div>

        {group.description && <p className="text-sm text-muted-foreground mb-6">{group.description}</p>}

        <Tabs defaultValue="members">
          <TabsList>
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-4">
            <p className="text-muted-foreground text-sm text-center py-8">Group feed coming soon — posts scoped to this group</p>
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            <div className="space-y-2">
              {members.map((m) => (
                <Card key={m.id}>
                  <CardContent className="flex items-center gap-3 py-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={m.user?.avatar_url} />
                      <AvatarFallback>{(m.user?.display_name || m.user?.username || '?')[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Link to={`/users/${m.user?.username}`} className="text-sm font-medium text-foreground hover:underline">
                        {m.user?.display_name || m.user?.username}
                      </Link>
                    </div>
                    <Badge variant="secondary" className="text-xs">{m.role}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            {events.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No events yet</p>
            ) : (
              <div className="space-y-2">
                {events.map((e) => (
                  <Card key={e.id}>
                    <CardContent className="py-3">
                      <p className="text-sm font-medium text-foreground">{e.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />{e.start_at && new Date(e.start_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <p className="text-muted-foreground text-sm text-center py-8">
              <MessageSquare className="h-5 w-5 inline mr-1" />
              Open the <Link to="/chat" className="text-primary underline">Chat Rooms</Link> page to access this group's chat
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
