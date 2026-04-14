import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ArrowLeft, Hash, Send, Trash2, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatRoom {
  id: string;
  name: string;
  type: string | null;
  venue_id: string | null;
  group_id: string | null;
}

interface ChatMessage {
  id: string;
  content: string | null;
  sender_id: string | null;
  created_at: string | null;
  is_deleted: boolean | null;
  media_url: string | null;
  sender?: { username: string | null; display_name: string | null; avatar_url: string | null };
}

export default function ChatRoomsPage() {
  const { profile } = useAuthStore();
  const isMobile = useIsMobile();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from('chat_rooms')
      .select('*')
      .then(({ data }) => setRooms(data || []));
  }, [tenant]);

  useEffect(() => {
    if (!activeRoom || !tenant) return;
    const load = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', activeRoom.id)
        .order('created_at', { ascending: true })
        .limit(200);

      if (data && data.length > 0) {
        const senderIds = [...new Set(data.map((m) => m.sender_id).filter(Boolean))];
        const { data: users } = await supabase
          .from('users')
          .select('id,username,display_name,avatar_url')
          .in('id', senderIds as string[]);
        const userMap = new Map((users || []).map((u) => [u.id, u]));
        setMessages(data.map((m) => ({ ...m, sender: userMap.get(m.sender_id || '') })));
      } else {
        setMessages([]);
      }
    };
    load();

    const channel = supabase
      .channel(`chat:${activeRoom.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${activeRoom.id}`,
      }, async (payload) => {
        const newMsg = payload.new as ChatMessage;
        const { data: sender } = await supabase.from('users').select('id,username,display_name,avatar_url').eq('id', newMsg.sender_id || '').maybeSingle();
        setMessages((prev) => [...prev, { ...newMsg, sender: sender || undefined }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeRoom, tenant]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !activeRoom || !tenant || !profile) return;
    const content = input.trim();
    setInput('');
    await supabase.from('chat_messages').insert({
      room_id: activeRoom.id,
      sender_id: profile.id,
      content,
    });
  };

  const deleteMessage = async (msgId: string) => {
    await supabase.from('chat_messages').update({ is_deleted: true, content: null } as any).eq('id', msgId);
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, is_deleted: true, content: null } : m)));
  };

  const canModerate = profile?.role === 'creator' || profile?.role === 'admin' || profile?.role === 'moderator';

  const filteredRooms = rooms.filter((r) => !search || r.name.toLowerCase().includes(search.toLowerCase()));

  const RoomList = () => (
    <div className="flex flex-col h-full" style={{ borderRight: '1px solid var(--color-border, rgba(255,255,255,0.1))' }}>
      <div className="p-3" style={{ borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.1))' }}>
        <Input placeholder="Search rooms..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <ScrollArea className="flex-1">
        {filteredRooms.map((r) => (
          <button key={r.id} onClick={() => setActiveRoom(r)}
            className={`flex items-center gap-3 w-full p-3 transition-colors ${activeRoom?.id === r.id ? 'bg-secondary/30' : 'hover:bg-secondary/10'}`}>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
              <Badge variant="secondary" className="text-[10px]">{r.type || 'public'}</Badge>
            </div>
          </button>
        ))}
      </ScrollArea>
    </div>
  );

  const ChatPanel = () => {
    if (!activeRoom) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Select a chat room</p>
        </div>
      );
    }
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.1))' }}>
          <div className="flex items-center gap-3">
            {isMobile && <Button variant="ghost" size="icon" onClick={() => setActiveRoom(null)}><ArrowLeft className="h-5 w-5" /></Button>}
            <Hash className="h-5 w-5 text-primary" />
            <span className="font-medium text-sm text-foreground">{activeRoom.name}</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Users className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader><SheetTitle>Members</SheetTitle></SheetHeader>
              <p className="text-sm text-muted-foreground mt-4">Member list coming soon</p>
            </SheetContent>
          </Sheet>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3 group">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={msg.sender?.avatar_url || ''} />
                <AvatarFallback>{(msg.sender?.display_name || msg.sender?.username || '?')[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-foreground">{msg.sender?.display_name || msg.sender?.username || 'Unknown'}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {msg.created_at && formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </span>
                </div>
                {msg.is_deleted ? (
                  <p className="text-sm text-muted-foreground italic">[Message deleted]</p>
                ) : (
                  <>
                    {msg.media_url && <img src={msg.media_url} alt="" className="rounded-lg max-w-xs mt-1" />}
                    <p className="text-sm text-foreground">{msg.content}</p>
                  </>
                )}
              </div>
              {canModerate && !msg.is_deleted && (
                <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="p-3 flex gap-2" style={{ borderTop: '1px solid var(--color-border, rgba(255,255,255,0.1))' }}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            className="flex-1"
          />
          <Button size="icon" onClick={sendMessage} disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
        {activeRoom ? <ChatPanel /> : <RoomList />}
      </div>
    );
  }

  return (
    <div className="h-screen flex" style={{ background: 'var(--color-bg)' }}>
      <div className="w-72 shrink-0"><RoomList /></div>
      <ChatPanel />
    </div>
  );
}
