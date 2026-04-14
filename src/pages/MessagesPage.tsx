import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Image, Languages, MessageSquarePlus, Send, Check, CheckCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  participants: string[];
  last_message: string | null;
  last_message_at: string | null;
  otherUser?: { id: string; username: string | null; display_name: string | null; avatar_url: string | null };
}

interface Message {
  id: string;
  content: string | null;
  sender_id: string | null;
  created_at: string | null;
  read_at: string | null;
  media_url: string | null;
  translated_content: any;
}

export default function MessagesPage() {
  const { profile, session } = useAuthStore();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [newMsgSearch, setNewMsgSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [typing, setTyping] = useState<string | null>(null);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<any>(null);

  // Load conversations
  useEffect(() => {
    if (!profile) return;
    const loadConvos = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [profile.id])
        .order('last_message_at', { ascending: false });
      if (!data) return;

      // Load other user info
      const otherIds = data.map((c) => c.participants.find((p: string) => p !== profile.id)).filter(Boolean);
      const { data: users } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url')
        .in('id', otherIds as string[]);

      const userMap = new Map((users || []).map((u) => [u.id, u]));
      setConversations(
        data.map((c) => ({
          ...c,
          otherUser: userMap.get(c.participants.find((p: string) => p !== profile.id) || '') || undefined,
        }))
      );
    };
    loadConvos();

    // Load blocked
    supabase
      .from('blocks')
      .select('blocked_id, blocker_id')
      .or(`blocker_id.eq.${profile.id},blocked_id.eq.${profile.id}`)
      .then(({ data }) => {
        if (data) {
          const ids = data.map((b) => (b.blocker_id === profile.id ? b.blocked_id : b.blocker_id));
          setBlockedIds(ids);
        }
      });
  }, [profile]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConvo) return;
    const load = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConvo.id)
        .order('created_at', { ascending: true })
        .limit(100);
      setMessages(data || []);

      // Mark as read
      if (profile) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() } as any)
          .eq('conversation_id', activeConvo.id)
          .neq('sender_id', profile.id)
          .is('read_at', null);
      }
    };
    load();

    // Real-time subscription
    const channel = supabase
      .channel(`messages:${activeConvo.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConvo.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        // Mark as read if from other user
        if (profile && (payload.new as any).sender_id !== profile.id) {
          supabase.from('messages').update({ read_at: new Date().toISOString() } as any).eq('id', (payload.new as any).id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConvo, profile]);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Typing indicator via presence
  useEffect(() => {
    if (!activeConvo || !profile) return;
    const channel = supabase.channel(`typing:${activeConvo.id}`, { config: { presence: { key: profile.id } } });
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const others = Object.keys(state).filter((k) => k !== profile.id);
        setTyping(others.length > 0 ? activeConvo.otherUser?.display_name || 'Someone' : null);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConvo, profile]);

  const sendMessage = async () => {
    if (!input.trim() || !activeConvo || !profile) return;
    const content = input.trim();
    setInput('');

    await supabase.from('messages').insert({
      conversation_id: activeConvo.id,
      sender_id: profile.id,
      content,
    });

    await supabase
      .from('conversations')
      .update({ last_message: content, last_message_at: new Date().toISOString() } as any)
      .eq('id', activeConvo.id);
  };

  const handleTranslate = async (msg: Message) => {
    if (!profile?.preferred_language) return;
    const lang = profile.preferred_language;
    const existing = msg.translated_content as any;
    if (existing && existing[lang]) return;

    try {
      const { data, error } = await supabase.functions.invoke('translate-message', {
        body: { text: msg.content, targetLang: lang },
      });
      if (error) throw error;
      const translated = { ...(existing || {}), [lang]: data.translated };
      await supabase.from('messages').update({ translated_content: translated } as any).eq('id', msg.id);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, translated_content: translated } : m))
      );
    } catch {
      toast({ title: 'Translation unavailable', variant: 'destructive' });
    }
  };

  const startNewConversation = async (userId: string) => {
    if (!profile) return;
    // Check if conversation exists
    const existing = conversations.find(
      (c) => c.participants.includes(userId) && c.participants.includes(profile.id)
    );
    if (existing) {
      setActiveConvo(existing);
      setShowNewMsg(false);
      return;
    }
    const { data, error } = await supabase
      .from('conversations')
      .insert({
 participants: [profile.id, userId] })
      .select()
      .single();
    if (data) {
      const { data: user } = await supabase.from('users').select('id,username,display_name,avatar_url').eq('id', userId).single();
      const convo = { ...data, otherUser: user || undefined };
      setConversations((prev) => [convo, ...prev]);
      setActiveConvo(convo);
    }
    setShowNewMsg(false);
  };

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    const { data } = await supabase
      .from('users')
      .select('id,username,display_name,avatar_url')
      .neq('id', profile?.id || '')
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(10);
    setSearchResults(data || []);
  }, [profile]);

  const isBlocked = activeConvo?.otherUser ? blockedIds.includes(activeConvo.otherUser.id) : false;

  const filteredConvos = conversations.filter((c) => {
    if (!search) return true;
    const name = c.otherUser?.display_name || c.otherUser?.username || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  // CONVERSATION LIST
  const ConvoList = () => (
    <div className="flex flex-col h-full" style={{ borderRight: '1px solid var(--color-border, rgba(255,255,255,0.1))' }}>
      <div className="p-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.1))' }}>
        <Input placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Dialog open={showNewMsg} onOpenChange={setShowNewMsg}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost"><MessageSquarePlus className="h-5 w-5" /></Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Message</DialogTitle></DialogHeader>
            <Input placeholder="Search users..." value={newMsgSearch} onChange={(e) => { setNewMsgSearch(e.target.value); searchUsers(e.target.value); }} />
            <div className="space-y-1 max-h-60 overflow-auto">
              {searchResults.map((u) => (
                <button key={u.id} onClick={() => startNewConversation(u.id)}
                  className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                  <Avatar className="h-8 w-8"><AvatarImage src={u.avatar_url} /><AvatarFallback>{(u.display_name || u.username || '?')[0]}</AvatarFallback></Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{u.display_name || u.username}</p>
                    {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                  </div>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ScrollArea className="flex-1">
        {filteredConvos.map((c) => (
          <button key={c.id} onClick={() => setActiveConvo(c)}
            className={`flex items-center gap-3 w-full p-3 transition-colors ${activeConvo?.id === c.id ? 'bg-secondary/30' : 'hover:bg-secondary/10'}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={c.otherUser?.avatar_url || ''} />
              <AvatarFallback>{(c.otherUser?.display_name || c.otherUser?.username || '?')[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-foreground truncate">{c.otherUser?.display_name || c.otherUser?.username || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground truncate">{c.last_message || 'No messages yet'}</p>
            </div>
            {c.last_message_at && (
              <span className="text-[10px] text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: false })}
              </span>
            )}
          </button>
        ))}
        {filteredConvos.length === 0 && (
          <p className="text-center text-sm text-muted-foreground p-6">No conversations yet</p>
        )}
      </ScrollArea>
    </div>
  );

  // CHAT PANEL
  const ChatPanel = () => {
    if (!activeConvo) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Select a conversation to start chatting</p>
        </div>
      );
    }

    const lang = profile?.preferred_language || 'en';

    return (
      <div className="flex-1 flex flex-col h-full">
        {/* Top bar */}
        <div className="p-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.1))' }}>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setActiveConvo(null)}><ArrowLeft className="h-5 w-5" /></Button>
          )}
          <Avatar className="h-8 w-8">
            <AvatarImage src={activeConvo.otherUser?.avatar_url || ''} />
            <AvatarFallback>{(activeConvo.otherUser?.display_name || '?')[0]}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm text-foreground">{activeConvo.otherUser?.display_name || activeConvo.otherUser?.username}</span>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3">
          {messages.map((msg) => {
            const isOwn = msg.sender_id === profile?.id;
            const translatedText = msg.translated_content && (msg.translated_content as any)[lang];
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                  {msg.media_url && <img src={msg.media_url} alt="" className="rounded-lg mb-2 max-w-full" />}
                  <p className="text-sm">{msg.content}</p>
                  {translatedText && <p className="text-xs italic mt-1 opacity-75">{translatedText}</p>}
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] opacity-60">
                      {msg.created_at && formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </span>
                    {isOwn && (msg.read_at ? <CheckCheck className="h-3 w-3 opacity-60" /> : <Check className="h-3 w-3 opacity-40" />)}
                  </div>
                  {!isOwn && !translatedText && !isBlocked && (
                    <button onClick={() => handleTranslate(msg)} className="text-[10px] mt-1 underline opacity-60 hover:opacity-100">
                      <Languages className="h-3 w-3 inline mr-0.5" />Translate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {typing && <p className="text-xs text-muted-foreground italic">{typing} is typing...</p>}
        </div>

        {/* Input */}
        {isBlocked ? (
          <div className="p-4 text-center text-sm text-muted-foreground" style={{ borderTop: '1px solid var(--color-border, rgba(255,255,255,0.1))' }}>
            You cannot send messages to this user
          </div>
        ) : (
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
        )}
      </div>
    );
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <p className="text-muted-foreground">Please sign in to access messages</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
        {activeConvo ? <ChatPanel /> : <ConvoList />}
      </div>
    );
  }

  return (
    <div className="h-screen flex" style={{ background: 'var(--color-bg)' }}>
      <div className="w-80 shrink-0"><ConvoList /></div>
      <ChatPanel />
    </div>
  );
}
