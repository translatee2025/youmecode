import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';
import LikeButton from '@/components/common/LikeButton';
import SaveButton from '@/components/common/SaveButton';
import ShareButton from '@/components/common/ShareButton';
import FollowButton from '@/components/common/FollowButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle, Volume2, VolumeX, Plus, Upload, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ReelsPage() {
  const tenant = useTenantStore((s) => s.tenant);
  const profile = useAuthStore((s) => s.profile);
  const [reels, setReels] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [tab, setTab] = useState('foryou');
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tenant) return;
    supabase.from('posts').select('*').eq('tenant_id', tenant.id).eq('post_type', 'reel').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setReels(data ?? []));
  }, [tenant, tab]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const idx = Math.round(containerRef.current.scrollTop / window.innerHeight);
    if (idx !== currentIdx) {
      setCurrentIdx(idx);
      // Increment view
      if (reels[idx]) {
        supabase.from('posts').update({ views_count: (reels[idx].views_count ?? 0) + 1 }).eq('id', reels[idx].id);
      }
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setVideoFile(f); setVideoPreview(URL.createObjectURL(f)); }
  };

  const handleUploadReel = async () => {
    if (!tenant || !profile || !videoFile) return;
    setUploading(true);
    try {
      const path = `reels/${profile.id}/${Date.now()}`;
      const { data, error } = await supabase.storage.from('media').upload(path, videoFile);
      if (error) throw error;
      const { data: pub } = supabase.storage.from('media').getPublicUrl(data.path);

      const hashtags = (caption.match(/#[\w]+/g) ?? []).map((h) => h.slice(1).toLowerCase());
      await supabase.from('posts').insert({
        tenant_id: tenant.id, user_id: profile.id, post_type: 'reel',
        video_url: pub.publicUrl, content: caption, hashtags,
      });
      toast({ title: 'Reel posted!' });
      setShowUpload(false); setCaption(''); setVideoFile(null); setVideoPreview('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const current = reels[currentIdx];

  return (
    <div className="fixed inset-0 bg-background">
      {/* Top tabs */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-background/80 to-transparent">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mx-auto">
            <TabsTrigger value="foryou">For You</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="nearme">Near Me</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Reels container */}
      <div ref={containerRef} onScroll={handleScroll} className="h-full overflow-y-scroll snap-y snap-mandatory">
        {reels.length === 0 ? (
          <div className="h-screen flex items-center justify-center text-muted-foreground">No reels yet</div>
        ) : (
          reels.map((reel, i) => (
            <div key={reel.id} className="h-screen w-full snap-start relative flex items-center justify-center bg-background">
              {reel.video_url ? (
                <video src={reel.video_url} className="h-full w-full object-cover" autoPlay={i === currentIdx} loop muted={muted} playsInline />
              ) : reel.media_urls?.[0] ? (
                <img src={reel.media_urls[0]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground">No media</div>
              )}

              {/* Right sidebar */}
              <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4">
                <LikeButton entityType="post" entityId={reel.id} />
                <button className="flex flex-col items-center text-foreground/80">
                  <MessageCircle className="h-6 w-6" />
                  <span className="text-xs">{reel.comments_count ?? 0}</span>
                </button>
                <ShareButton url={`/reels#${reel.id}`} title="" />
                <SaveButton entityType="post" entityId={reel.id} />
              </div>

              {/* Bottom overlay */}
              <div className="absolute bottom-4 left-3 right-16 space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border-2 border-foreground/50">
                    <AvatarFallback>R</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold text-foreground drop-shadow">@{reel.user_id?.slice(0, 8)}</span>
                  <FollowButton followeeType="user" followeeId={reel.user_id} />
                </div>
                {reel.content && <p className="text-xs text-foreground/90 drop-shadow line-clamp-2">{reel.content}</p>}
              </div>

              {/* Mute toggle */}
              <button onClick={() => setMuted(!muted)} className="absolute top-20 right-3 p-2 bg-background/30 rounded-full">
                {muted ? <VolumeX className="h-5 w-5 text-foreground" /> : <Volume2 className="h-5 w-5 text-foreground" />}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Upload FAB */}
      {profile && (
        <button onClick={() => setShowUpload(true)} className="absolute bottom-6 right-6 z-30 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:scale-105 transition-transform">
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Upload dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Reel</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {videoPreview ? (
              <video src={videoPreview} className="w-full aspect-[9/16] object-cover rounded-lg" controls />
            ) : (
              <label className="flex flex-col items-center justify-center aspect-[9/16] border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Select video</span>
                <input type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
              </label>
            )}
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption, #hashtags..." />
            <Button onClick={handleUploadReel} disabled={!videoFile || uploading} className="w-full">
              <Send className="h-4 w-4 mr-2" /> {uploading ? 'Uploading...' : 'Post Reel'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
