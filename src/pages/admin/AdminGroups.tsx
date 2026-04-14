import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_TENANT_ID } from '@/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, ChevronDown, ChevronRight, Users, Lock } from 'lucide-react';

interface Group {
  id: string; name: string; description: string | null; avatar_url: string | null;
  member_count: number; is_private: boolean; created_at: string;
}

interface Member {
  id: string; user_id: string; role: string | null;
  user?: { display_name: string | null; avatar_url: string | null; username: string | null };
}

export default function AdminGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);

  const fetchGroups = async () => {
    const { data } = await supabase.from('groups').select('*').eq('tenant_id', DEFAULT_TENANT_ID).order('created_at', { ascending: false });
    setGroups((data as Group[]) ?? []);
    setLoading(false);
  };

  const fetchMembers = async (groupId: string) => {
    const { data } = await supabase.from('group_members').select('id, user_id, role').eq('group_id', groupId);
    // Fetch user info separately
    const memberData = (data ?? []) as Member[];
    if (memberData.length > 0) {
      const userIds = memberData.map(m => m.user_id);
      const { data: users } = await supabase.from('users').select('id, display_name, avatar_url, username').in('id', userIds);
      const userMap = new Map((users ?? []).map(u => [u.id, u]));
      memberData.forEach(m => { m.user = userMap.get(m.user_id) as any; });
    }
    setMembers(memberData);
  };

  useEffect(() => { fetchGroups(); }, []);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    await fetchMembers(id);
  };

  const handleDeleteGroup = async () => {
    if (!deleteId) return;
    await supabase.from('groups').delete().eq('id', deleteId);
    if (expandedId === deleteId) setExpandedId(null);
    setDeleteId(null); await fetchGroups();
    toast({ title: 'Group deleted' });
  };

  const handleRemoveMember = async () => {
    if (!removeMemberId) return;
    await supabase.from('group_members').delete().eq('id', removeMemberId);
    setRemoveMemberId(null);
    if (expandedId) await fetchMembers(expandedId);
    toast({ title: 'Member removed' });
  };

  if (loading) return <div className="animate-pulse h-64 rounded-xl" style={{ background: 'var(--color-card-bg)' }} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Groups</h1>
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Groups are created by users on the platform. You can moderate them here.</p>

      <div className="space-y-2">
        {groups.map(g => (
          <div key={g.id}>
            <div onClick={() => toggleExpand(g.id)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors"
              style={{ background: expandedId === g.id ? 'rgba(255,255,255,0.08)' : 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
              <Avatar className="h-9 w-9">
                <AvatarImage src={g.avatar_url ?? ''} />
                <AvatarFallback>{g.name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{g.name}</p>
                  {g.is_private && <Badge variant="outline" className="text-[10px] px-1.5"><Lock className="h-2.5 w-2.5 mr-0.5" />Private</Badge>}
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <Users className="h-3 w-3 inline mr-1" />{g.member_count ?? 0} members · {new Date(g.created_at).toLocaleDateString()}
                </p>
              </div>
              {expandedId === g.id ? <ChevronDown className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} /> : <ChevronRight className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />}
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={e => { e.stopPropagation(); setDeleteId(g.id); }}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>

            {expandedId === g.id && (
              <Card className="ml-12 mt-1 border-0" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Members</CardTitle>
                </CardHeader>
                <CardContent>
                  {members.length === 0 ? (
                    <p className="text-xs py-2" style={{ color: 'var(--color-text-muted)' }}>No members</p>
                  ) : (
                    <div className="space-y-1">
                      {members.map(m => (
                        <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={m.user?.avatar_url ?? ''} />
                            <AvatarFallback className="text-[10px]">{(m.user?.display_name || m.user?.username || '?')[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs flex-1" style={{ color: 'var(--color-text)' }}>{m.user?.display_name || m.user?.username || m.user_id.slice(0, 8)}</span>
                          <Badge variant="outline" className="text-[10px]">{m.role || 'member'}</Badge>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setRemoveMemberId(m.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ))}
        {groups.length === 0 && <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No groups yet</p>}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this group and all its members.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!removeMemberId} onOpenChange={() => setRemoveMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>This member will be removed from the group.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
