import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, User } from '../types';
import { 
  Send, 
  Smile, 
  Pin, 
  Crown, 
  ShieldAlert, 
  Lock, 
  Check, 
  Flag, 
  Sparkles,
  Users,
  Flame,
  AlertCircle
} from 'lucide-react';

interface ChatViewProps {
  currentUser: User;
  onJoinTier: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentUser,
  onJoinTier,
}) => {
  const [activeChannel, setActiveChannel] = useState<'general' | 'vip_lounge'>('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';
  const isMember = currentUser.membership?.active;
  const canAccessVipLounge = isOwnerOrAdmin || isMember;

  // Fetch messages for active channel
  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch(`/api/chat/messages?channelId=${activeChannel}`);
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
          scrollToBottom();
        }
      } catch (e) {
        console.error('Failed to load chat messages', e);
      }
    }

    loadMessages();

    // Subscribe to SSE chat stream
    const eventSource = new EventSource('/api/chat/stream');
    eventSource.onmessage = (event) => {
      try {
        const newMsg: ChatMessage = JSON.parse(event.data);
        if (newMsg.channelId === activeChannel) {
          setMessages((prev) => [...prev, newMsg]);
          scrollToBottom();
        }
      } catch (err) {
        // ignore
      }
    };

    return () => eventSource.close();
  }, [activeChannel]);

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (activeChannel === 'vip_lounge' && !canAccessVipLounge) {
      setErrorMessage('VIP Lounge is locked. Verified membership required.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: activeChannel,
          userId: currentUser.id,
          content: inputText.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.message) {
        setInputText('');
      } else {
        setErrorMessage(data.error || 'Failed to send message');
      }
    } catch (err) {
      setErrorMessage('Network connection error while sending message');
    } finally {
      setIsSending(false);
    }
  }

  async function handleReact(messageId: string, emoji: string) {
    try {
      const res = await fetch('/api/chat/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          emoji,
          userName: currentUser.name,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? data.message : m))
        );
      }
    } catch {
      // ignore
    }
  }

  function handleReportMessage(id: string) {
    setReportedIds((prev) => new Set(prev).add(id));
  }

  const pinnedMessages = messages.filter((m) => m.pinned);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-[#090e21] border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-4 min-h-[640px]">
        
        {/* Left Sidebar: Channel Navigation */}
        <div className="md:col-span-1 bg-[#060a17] border-r border-slate-800 p-4 space-y-6">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              CHAT CHANNELS
            </div>
            <div className="space-y-1.5">
              <button
                onClick={() => setActiveChannel('general')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                  activeChannel === 'general'
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-slate-400">#</span>
                  general-chat
                </span>
                <span className="text-[10px] text-emerald-400">Open</span>
              </button>

              <button
                onClick={() => setActiveChannel('vip_lounge')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                  activeChannel === 'vip_lounge'
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  vip-elite-lounge
                </span>
                {!canAccessVipLounge && (
                  <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* Member Status Card */}
          <div className="bg-[#0b1022] rounded-xl p-3 border border-slate-800 text-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              YOUR CHAT IDENTITY
            </span>
            <div className="flex items-center gap-2.5">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-lg object-cover border border-purple-500/40"
                referrerPolicy="no-referrer"
              />
              <div className="overflow-hidden">
                <div className="font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] text-purple-300">
                  {currentUser.role === 'owner' ? '👑 OWNER' : currentUser.membership?.active ? `${currentUser.membership.tier} MEMBER` : 'Recruit'}
                </div>
              </div>
            </div>

            {!isMember && currentUser.role !== 'owner' && (
              <button
                onClick={onJoinTier}
                className="w-full mt-2 py-1.5 rounded-lg text-[10px] font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all flex items-center justify-center gap-1"
              >
                <Crown className="w-3 h-3 text-amber-300" />
                Unlock VIP Lounge
              </button>
            )}
          </div>

          {/* Channel Rules */}
          <div className="text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-300">Army Guidelines</div>
            <p className="leading-tight">
              • Keep chat respectful<br />
              • No spam or unauthorized links<br />
              • Custom room IDs drop in VIP Lounge first
            </p>
          </div>
        </div>

        {/* Right Main Panel: Messages and Input */}
        <div className="md:col-span-3 flex flex-col justify-between bg-[#080d1d]">
          
          {/* Channel Top Header */}
          <div className="px-5 py-3.5 bg-[#0b1022] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {activeChannel === 'vip_lounge' ? (
                <Crown className="w-4 h-4 text-amber-400" />
              ) : (
                <span className="text-slate-400 font-bold">#</span>
              )}
              <h3 className="font-bold text-white text-sm">
                {activeChannel === 'vip_lounge' ? 'vip-elite-lounge (Exclusive)' : 'general-chat'}
              </h3>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {activeChannel === 'vip_lounge' ? '· Direct with VG ALPHAX' : '· ALPHAX Army Public Hub'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-[11px]">Real-Time Active</span>
            </div>
          </div>

          {/* Pinned Announcement Box */}
          {pinnedMessages.length > 0 && (
            <div className="bg-purple-950/30 border-b border-purple-800/30 px-5 py-2.5 flex items-center gap-3 text-xs">
              <Pin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <div className="text-slate-200 truncate flex-1">
                <strong className="text-purple-300 font-semibold">PINNED:</strong>{' '}
                {pinnedMessages[0].content}
              </div>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[500px]">
            {activeChannel === 'vip_lounge' && !canAccessVipLounge ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-white font-['Outfit']">
                    VIP &amp; ELITE LOUNGE ACCESS RESTRICTED
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    This private room is exclusively reserved for verified VIP, Elite, and Legend Army members to chat directly with VG ALPHAX and get early custom room passes.
                  </p>
                </div>
                <button
                  onClick={onJoinTier}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
                >
                  Join Membership to Unlock
                </button>
              </div>
            ) : (
              messages.map((msg) => {
                const isReported = reportedIds.has(msg.id);
                return (
                  <div
                    key={msg.id}
                    className="flex items-start gap-3 group animate-in fade-in"
                  >
                    <img
                      src={msg.userAvatar}
                      alt={msg.userName}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-700 mt-0.5 shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-white">
                          {msg.userName}
                        </span>

                        {msg.userRole === 'owner' && (
                          <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded font-mono">
                            OWNER
                          </span>
                        )}

                        {msg.userTier && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                            msg.userTier === 'Legend' 
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-500/30' 
                              : msg.userTier === 'Elite' 
                                ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-500/30' 
                                : 'bg-purple-400/20 text-purple-300 border border-purple-500/30'
                          }`}>
                            {msg.userTier}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {/* Report Action */}
                        <button
                          onClick={() => handleReportMessage(msg.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400 text-[10px] flex items-center gap-1 ml-auto"
                          title="Report Message"
                        >
                          <Flag className="w-3 h-3" />
                          <span>{isReported ? 'Reported' : 'Report'}</span>
                        </button>
                      </div>

                      {isReported ? (
                        <p className="text-xs text-slate-400 italic">
                          [Message hidden pending review]
                        </p>
                      ) : (
                        <p className="text-xs text-slate-200 leading-relaxed break-words bg-[#0b1021] rounded-xl px-3.5 py-2 border border-slate-800/80 inline-block max-w-2xl">
                          {msg.content}
                        </p>
                      )}

                      {/* Emoji Reactions Bar */}
                      <div className="flex items-center gap-1.5 pt-1">
                        {['🔥', '⚡', '👑', '❤️'].map((emoji) => {
                          const users = msg.reactions?.[emoji] || [];
                          const hasReacted = users.includes(currentUser.name);
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleReact(msg.id, emoji)}
                              className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 ${
                                hasReacted
                                  ? 'bg-purple-900/50 border-purple-500 text-purple-200'
                                  : 'bg-[#060a17] border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              <span>{emoji}</span>
                              {users.length > 0 && <span className="text-[10px] font-mono">{users.length}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 bg-[#0a0f22] border-t border-slate-800 flex items-center gap-3"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                activeChannel === 'vip_lounge' && !canAccessVipLounge
                  ? 'VIP Membership required to send messages here...'
                  : `Message #${activeChannel === 'vip_lounge' ? 'vip-elite-lounge' : 'general-chat'}...`
              }
              disabled={activeChannel === 'vip_lounge' && !canAccessVipLounge}
              className="flex-1 bg-[#060a17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSending || (activeChannel === 'vip_lounge' && !canAccessVipLounge) || !inputText.trim()}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>

          {errorMessage && (
            <div className="px-4 py-2 bg-red-950/40 text-red-400 text-xs flex items-center gap-2 border-t border-red-500/30">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
