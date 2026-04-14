import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import LikeButton from '@/components/common/LikeButton';
import SaveButton from '@/components/common/SaveButton';
import ShareButton from '@/components/common/ShareButton';
import CommentSection from '@/components/common/CommentSection';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, MoreHorizontal, MessageCircle, Flag, VolumeX, Ban, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Props {
  post: any;
  user?: any;
  onReport?: (entityType: string, entityId: string) => void;
  onRefresh?: () => void;
}

export default function PostCard({ post, user, onReport, onRefresh }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const [showComments, setShowComments] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const author = user ?? post.users;
  const isOwn = profile?.id === post.user_id;
  const content = post.content ?? '';
  const truncated = content.length > 280 && !expanded;
  const mediaUrls: string[] = Array.isArray(post.media_urls) ? post.media_urls : [];
  const hashtags: string[] = Array.isArray(post.hashtags) ? post.hashtags : [];

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    await supabase.from('posts').delete().eq('id', post.id);
    toast({ title: 'Post deleted' });
    onRefresh?.();
  };

  const handleBlock = async () => {
    if (!tenant || !profile || !post.user_id) return;
    await supabase.from('blocks').insert({
 blocker_id: profile.id, blocked_id: post.user_id });
    toast({ title: 'User blocked' });
    onRefresh?.();
  };

  const handleMute = async () => {
    if (!tenant || !profile || !post.user_id) return;
    await supabase.from('mutes').insert({
 muter_id: profile.id, muted_id: post.user_id });
    toast({ title: 'User muted' });
    onRefresh?.();
  };

  return (
    <div className="glass p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <Link to={`/users/${author?.username ?? ''}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={author?.avatar_url ?? ''} />
              <AvatarFallback>{(author?.display_name ?? author?.username ?? '?')[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link to={`/users/${author?.username ?? ''}`} className="text-sm font-semibold text-foreground hover:underline">
              {author?.display_name ?? author?.username ?? 'User'}
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              {post.location_city && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{post.location_city}</span>}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwn && <DropdownMenuItem onClick={handleDelete}><Trash2 className="h-3 w-3 mr-2" />Delete</DropdownMenuItem>}
            {!isOwn && profile && (
              <>
                <DropdownMenuItem onClick={() => onReport?.('post', post.id)}><Flag className="h-3 w-3 mr-2" />Report</DropdownMenuItem>
                <DropdownMenuItem onClick={handleMute}><VolumeX className="h-3 w-3 mr-2" />Mute user</DropdownMenuItem>
                <DropdownMenuItem onClick={handleBlock}><Ban className="h-3 w-3 mr-2" />Block user</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="text-sm text-foreground">
        <p className="whitespace-pre-wrap">{truncated ? content.slice(0, 280) + '...' : content}</p>
        {truncated && <button onClick={() => setExpanded(true)} className="text-primary text-xs hover:underline">Read more</button>}
      </div>

      {/* Hashtags */}
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {hashtags.map((h) => (
            <Link key={h} to={`/hashtag/${h}`}><Badge variant="secondary" className="text-xs">#{h}</Badge></Link>
          ))}
        </div>
      )}

      {/* Media */}
      {mediaUrls.length > 0 && (
        <div className={`grid gap-1 rounded-lg overflow-hidden ${mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {mediaUrls.slice(0, 4).map((url, i) => (
            <img key={i} src={url as string} alt="" className="w-full aspect-square object-cover" />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-1 border-t border-border/50">
        <LikeButton entityType="post" entityId={post.id} />
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <MessageCircle className="h-4 w-4" /> {post.comments_count ?? 0}
        </button>
        <ShareButton url={`/feed#${post.id}`} title={content.slice(0, 50)} />
        <div className="ml-auto"><SaveButton entityType="post" entityId={post.id} /></div>
      </div>

      {showComments && <CommentSection entityType="post" entityId={post.id} />}
    </div>
  );
}
