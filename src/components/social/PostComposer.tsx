import { DEFAULT_TENANT_ID } from '@/config';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { checkBadges } from '@/lib/badges';
import { Image, MapPin, BarChart3, Calendar, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onPost?: () => void;
}

export default function PostComposer({ onPost }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [longPost, setLongPost] = useState(false);
  const [location, setLocation] = useState('');
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const maxLen = longPost ? 2000 : 280;

  if (!profile) return null;

  const handleMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 4 - mediaFiles.length);
    setMediaFiles([...mediaFiles, ...files]);
    setMediaPreviews([...mediaPreviews, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeMedia = (i: number) => {
    setMediaFiles(mediaFiles.filter((_, idx) => idx !== i));
    setMediaPreviews(mediaPreviews.filter((_, idx) => idx !== i));
  };

  const extractHashtags = (text: string): string[] => {
    const matches = text.match(/#[\w]+/g);
    return matches ? matches.map((h) => h.slice(1).toLowerCase()) : [];
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const mediaUrls: string[] = [];
      for (const f of mediaFiles) {
        const path = `posts/${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const { data, error } = await supabase.storage.from('media').upload(path, f);
        if (error) throw error;
        const { data: pub } = supabase.storage.from('media').getPublicUrl(data.path);
        mediaUrls.push(pub.publicUrl);
      }

      let pollId: string | null = null;
      if (showPoll && pollQuestion.trim()) {
        const { data: poll } = await supabase.from('polls').insert({ tenant_id: DEFAULT_TENANT_ID,
          user_id: profile.id,
          question: pollQuestion,
          options: pollOptions.filter(Boolean).map((o) => ({ text: o, votes: 0 })),
        }).select('id').single();
        pollId = poll?.id ?? null;
      }

      const hashtags = extractHashtags(content);

      await supabase.from('posts').insert({ tenant_id: DEFAULT_TENANT_ID,
        user_id: profile.id,
        content: content.trim(),
        media_urls: mediaUrls,
        hashtags,
        location_city: location.trim() || null,
        poll_id: pollId,
        post_type: 'wall',
      });

      // Update hashtag counts
      for (const tag of hashtags) {
        const { data: existing } = await supabase.from('hashtags').select('id, posts_count').eq('tag', tag).maybeSingle();
        if (existing) {
          await supabase.from('hashtags').update({ posts_count: (existing.posts_count ?? 0) + 1 }).eq('id', existing.id);
        } else {
          await supabase.from('hashtags').insert({ tenant_id: DEFAULT_TENANT_ID,
 tag, posts_count: 1 });
        }
      }

      // Badge checks
      const { count } = await supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', profile.id);
      await checkBadges(profile.id, 'first_post', 1);
      await checkBadges(profile.id, 'posts', count ?? 1);

      setContent(''); setMediaFiles([]); setMediaPreviews([]); setShowPoll(false);
      setPollQuestion(''); setPollOptions(['', '']); setLocation(''); setExpanded(false);
      toast({ title: 'Posted!' });
      onPost?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  return (
    <div className="glass p-4 space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile.avatar_url ?? ''} />
          <AvatarFallback>{(profile.display_name ?? profile.username)?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        {!expanded ? (
          <button onClick={() => setExpanded(true)} className="flex-1 text-left px-4 py-2.5 rounded-full bg-muted/50 text-muted-foreground text-sm hover:bg-muted transition-colors">
            Share something...
          </button>
        ) : (
          <div className="flex-1 space-y-3">
            <Textarea value={content} onChange={(e) => setContent(e.target.value.slice(0, maxLen))} placeholder="What's on your mind?" className="min-h-[80px] resize-none" autoFocus />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{content.length}/{maxLen}</span>
              <div className="flex items-center gap-2">
                <span>Long post</span>
                <Switch checked={longPost} onCheckedChange={setLongPost} />
              </div>
            </div>

            {mediaPreviews.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {mediaPreviews.map((p, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden">
                    <img src={p} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeMedia(i)} className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}

            {showPoll && (
              <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                <Input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="Poll question" />
                {pollOptions.map((o, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={o} onChange={(e) => { const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n); }} placeholder={`Option ${i + 1}`} />
                    {i > 1 && <Button size="icon" variant="ghost" onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></Button>}
                  </div>
                ))}
                {pollOptions.length < 6 && <Button size="sm" variant="ghost" onClick={() => setPollOptions([...pollOptions, ''])}>+ Add option</Button>}
              </div>
            )}

            {location && (
              <div className="flex items-center gap-1 text-xs text-primary">
                <MapPin className="h-3 w-3" /> {location}
                <button onClick={() => setLocation('')}><X className="h-3 w-3" /></button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <label className="p-2 hover:bg-muted rounded-lg cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                  <Image className="h-4 w-4" />
                  <input type="file" accept="image/*,video/*" multiple onChange={handleMedia} className="hidden" />
                </label>
                <button onClick={() => { const loc = prompt('Enter location'); if (loc) setLocation(loc); }} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                  <MapPin className="h-4 w-4" />
                </button>
                <button onClick={() => setShowPoll(!showPoll)} className={cn('p-2 hover:bg-muted rounded-lg transition-colors', showPoll ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
                  <BarChart3 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setExpanded(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSubmit} disabled={submitting || !content.trim()}>
                  <Send className="h-3 w-3 mr-1" /> {submitting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
