import React, { useState } from 'react';
import { CommunityGroup, CommunityPost, User } from '../types';
import { 
  Users, 
  Flame, 
  Megaphone, 
  Trophy, 
  Crown, 
  ThumbsUp, 
  MessageCircle, 
  Lock, 
  Plus, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface CommunityViewProps {
  groups: CommunityGroup[];
  posts: CommunityPost[];
  currentUser: User;
  onJoinTier: () => void;
  onRefreshPosts: () => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  groups,
  posts,
  currentUser,
  onJoinTier,
  onRefreshPosts,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<CommunityGroup | null>(groups[0] || null);
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set(['grp_freefire', 'grp_announcements']));
  const [votingMap, setVotingMap] = useState<Record<string, string>>({});
  const [postsList, setPostsList] = useState<CommunityPost[]>(posts);

  React.useEffect(() => {
    setPostsList(posts);
  }, [posts]);

  React.useEffect(() => {
    if (!selectedGroup && groups.length > 0) {
      setSelectedGroup(groups[0]);
    }
  }, [groups, selectedGroup]);

  const isMember = currentUser.membership?.active;
  const isOwner = currentUser.role === 'owner' || currentUser.role === 'admin';

  function handleToggleJoin(groupId: string) {
    setJoinedGroupIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(groupId)) {
        updated.delete(groupId);
      } else {
        updated.add(groupId);
      }
      return updated;
    });
  }

  async function handleVote(postId: string, optionId: string) {
    try {
      const res = await fetch(`/api/community/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });
      const data = await res.json();
      if (data.post) {
        setPostsList((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
        setVotingMap((prev) => ({ ...prev, [postId]: optionId }));
      }
    } catch {
      // ignore
    }
  }

  async function handleLike(postId: string) {
    try {
      const res = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.post) {
        setPostsList((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
      }
    } catch {
      // ignore
    }
  }

  // Group icons map
  const renderGroupIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-5 h-5 text-amber-400" />;
      case 'Users': return <Users className="w-5 h-5 text-sky-400" />;
      case 'Megaphone': return <Megaphone className="w-5 h-5 text-red-400" />;
      case 'Trophy': return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 'Crown': return <Crown className="w-5 h-5 text-purple-400" />;
      default: return <Users className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Title & Hub Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/40 border border-cyan-800/40 px-3 py-1 rounded-full mb-2">
            <Users className="w-3.5 h-3.5" />
            ALPHAX ARMY SQUADS &amp; COMMUNITY
          </div>
          <h2 className="text-3xl font-black text-white font-['Outfit']">
            Community Groups &amp; Creator Feed
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Connect with squad members, vote in official stream polls, and read exclusive tactical playbooks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshPosts}
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#0e162f] border border-slate-700 rounded-xl"
          >
            Refresh Feed
          </button>
        </div>
      </div>

      {/* Grid: Left Groups Selector & Right Posts / Polls Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 4 Cols: 5 Community Squad Groups */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            FEATURED SQUADS &amp; HUBS
          </h3>

          <div className="space-y-3">
            {groups.map((grp) => {
              const isJoined = joinedGroupIds.has(grp.id);
              const isLocked = grp.isPrivate && !isMember && !isOwner;
              const isSelected = selectedGroup?.id === grp.id;

              return (
                <div
                  key={grp.id}
                  onClick={() => !isLocked && setSelectedGroup(grp)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/30 border-purple-500 shadow-lg shadow-purple-950/40'
                      : 'bg-[#0a0f22] border-slate-800 hover:border-slate-700'
                  } ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#101833] border border-slate-800 flex items-center justify-center shrink-0">
                        {renderGroupIcon(grp.iconName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-sm text-white font-['Outfit']">
                            {grp.name}
                          </h4>
                          {grp.isPrivate && (
                            <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                              VIP
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {grp.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 tabular-nums">
                      {grp.memberCount.toLocaleString()} Members
                    </span>

                    {isLocked ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onJoinTier();
                        }}
                        className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Unlock</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleJoin(grp.id);
                        }}
                        className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                          isJoined
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-purple-600 text-white hover:bg-purple-500'
                        }`}
                      >
                        {isJoined ? 'Joined' : 'Join Squad'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 8 Cols: Creator Feed & Polls */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              OFFICIAL CREATOR POSTS &amp; INTERACTIVE POLLS
            </h3>
            <span className="text-xs text-slate-400">YouTube-Style Community Hub</span>
          </div>

          <div className="space-y-6">
            {postsList.map((post) => {
              const isLocked = post.isMemberOnly && !isMember && !isOwner;

              return (
                <div
                  key={post.id}
                  className="bg-[#0a0f22] border border-slate-800 hover:border-purple-900/40 rounded-2xl p-5 sm:p-6 transition-all space-y-4"
                >
                  {/* Post Author Lockup */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="w-10 h-10 rounded-xl object-cover border border-purple-500/50"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-white font-['Outfit']">
                            {post.authorName}
                          </span>
                          <span className="text-[10px] bg-red-600/30 text-red-300 border border-red-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                            OWNER
                          </span>
                          {post.isMemberOnly && (
                            <span className="text-[10px] bg-purple-600/30 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                              MEMBERS ONLY
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {post.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Post Title & Content */}
                  <div>
                    <h4 className="text-lg font-black text-white font-['Outfit']">
                      {post.title}
                    </h4>

                    {isLocked ? (
                      <div className="mt-4 p-6 bg-[#060a17] rounded-xl border border-purple-900/40 text-center space-y-3">
                        <Lock className="w-8 h-8 text-purple-400 mx-auto" />
                        <h5 className="font-bold text-white text-sm">
                          Exclusive Member Content
                        </h5>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          This pro gameplay breakdown and strategy guide is unlocked for VIP, Elite, and Legend Army members.
                        </p>
                        <button
                          onClick={onJoinTier}
                          className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl"
                        >
                          Join Membership to Read
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-300 leading-relaxed mt-2 whitespace-pre-line">
                        {post.content}
                      </p>
                    )}
                  </div>

                  {/* Interactive Poll (if post includes poll) */}
                  {post.poll && !isLocked && (
                    <div className="bg-[#060a17] rounded-xl p-4 border border-slate-800 space-y-3 mt-4">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                        <span>📊 {post.poll.question}</span>
                        <span className="text-[11px] text-slate-400 tabular-nums font-normal">
                          {post.poll.totalVotes.toLocaleString()} votes
                        </span>
                      </div>

                      <div className="space-y-2">
                        {post.poll.options.map((option) => {
                          const percentage = post.poll!.totalVotes > 0 
                            ? Math.round((option.votes / post.poll!.totalVotes) * 100) 
                            : 0;
                          const hasVotedThis = post.poll?.userVoteId === option.id || votingMap[post.id] === option.id;

                          return (
                            <button
                              key={option.id}
                              onClick={() => handleVote(post.id, option.id)}
                              className={`relative w-full text-left p-2.5 rounded-xl border transition-all overflow-hidden flex items-center justify-between text-xs ${
                                hasVotedThis
                                  ? 'border-purple-500 bg-purple-950/40 font-bold text-white'
                                  : 'border-slate-800 bg-[#0a0f22] text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              {/* Background Percentage Fill Bar */}
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-purple-600/20 -z-0 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />

                              <span className="relative z-10 flex items-center gap-2">
                                {hasVotedThis && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                                {option.text}
                              </span>

                              <span className="relative z-10 text-[11px] font-mono tabular-nums text-slate-400">
                                {percentage}% ({option.votes})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Likes and Comments Bar */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center gap-6 text-xs text-slate-400">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        post.likedByMe ? 'text-purple-400 font-bold' : 'hover:text-white'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${post.likedByMe ? 'fill-purple-400' : ''}`} />
                      <span className="tabular-nums">{post.likes}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="tabular-nums">{post.commentsCount} comments</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
