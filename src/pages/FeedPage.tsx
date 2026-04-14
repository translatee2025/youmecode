import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';
import { haversine } from '@/lib/haversine';
import PostComposer from '@/components/social/PostComposer';
import PostCard from '@/components/social/PostCard';
import ReportModal from '@/components/social/ReportModal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FeedPage() {
  const profile = useAuthStore((s) => s.profile);
  const { lat, lng, isActive } = useLocationStore();
  const [tab, setTab] = useState('following');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [mutedIds, setMutedIds] = useState<string[]>([]);
  const [reportTarget, setReportTarget] = useState<{ type: string; id: string } | null>(null);

  useEffect(() => {
    if (!tenant || !profile) return;
    Promise.all([
      supabase.from('blocks').select('blocked_id').eq('blocker_id', profile.id),
      supabase.from('mutes').select('muted_id').eq('muter_id', profile.id),
    ]).then(([b, m]) => {
      setBlockedIds((b.data ?? []).map((r: any) => r.blocked_id));
      setMutedIds((m.data ?? []).map((r: any) => r.muted_id));
    });
  }, [tenant, profile]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('posts').select('*').eq('post_type', 'wall').order('created_at', { ascending: false }).limit(50);

    if (tab === 'following' && profile) {
      const { data: follows } = await supabase.from('follows').select('followee_id').eq('follower_id', profile.id).eq('followee_type', 'user');
      const followIds = (follows ?? []).map((f: any) => f.followee_id);
      if (followIds.length > 0) {
        query = query.in('user_id', followIds);
      }
    } else if (tab === 'trending') {
      const since = new Date(Date.now() - 86400000).toISOString();
      query = supabase.from('posts').select('*').eq('post_type', 'wall').gte('created_at', since).order('likes_count', { ascending: false }).limit(50);
    }

    const { data } = await query;
    let items = data ?? [];

    // Filter blocked/muted
    const hidden = new Set([...blockedIds, ...(tab !== 'following' ? mutedIds : [])]);
    items = items.filter((p) => !hidden.has(p.user_id));

    // Near me filter
    if (tab === 'nearme' && isActive && lat && lng) {
      items = items.filter((p) => p.location_lat && p.location_lng && haversine(lat, lng, p.location_lat, p.location_lng) <= 25);
      items.sort((a, b) => haversine(lat, lng, a.location_lat, a.location_lng) - haversine(lat, lng, b.location_lat, b.location_lng));
    }

    setPosts(items);
    setLoading(false);
  }, [tenant, profile, tab, blockedIds, mutedIds, isActive, lat, lng]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Feed</h1>
        <PostComposer onPost={loadPosts} />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="following" className="flex-1">Following</TabsTrigger>
            <TabsTrigger value="trending" className="flex-1">Trending</TabsTrigger>
            <TabsTrigger value="nearme" className="flex-1">Near Me</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="text-center text-muted-foreground py-8">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No posts yet. Be the first!</div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onReport={(t, id) => setReportTarget({ type: t, id })} onRefresh={loadPosts} />
            ))}
          </div>
        )}
      </div>
      {reportTarget && <ReportModal open={!!reportTarget} onClose={() => setReportTarget(null)} entityType={reportTarget.type} entityId={reportTarget.id} />}
    </div>
  );
}
