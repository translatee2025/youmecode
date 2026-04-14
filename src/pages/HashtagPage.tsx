import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import PostCard from '@/components/social/PostCard';
import FollowButton from '@/components/common/FollowButton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hash } from 'lucide-react';

export default function HashtagPage() {
  const { tag } = useParams<{ tag: string }>();
  const [hashtag, setHashtag] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [tab, setTab] = useState('top');

  useEffect(() => {
    if (!tenant || !tag) return;
    supabase.from('hashtags').select('*').eq('tag', tag).maybeSingle()
      .then(({ data }) => setHashtag(data));
  }, [tenant, tag]);

  useEffect(() => {
    if (!tenant || !tag) return;
    let query = supabase.from('posts').select('*').contains('hashtags', [tag]);
    if (tab === 'top') {
      query = query.order('likes_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    query.limit(50).then(({ data }) => setPosts(data ?? []));
  }, [tenant, tag, tab]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <Hash className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">#{tag}</h1>
              <p className="text-sm text-muted-foreground">{hashtag?.posts_count ?? posts.length} posts</p>
            </div>
          </div>
          {hashtag && <FollowButton followeeType="hashtag" followeeId={hashtag.id} />}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="top">Top</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
          {posts.length === 0 && <p className="text-center text-muted-foreground py-8">No posts with this hashtag</p>}
        </div>
      </div>
    </div>
  );
}
