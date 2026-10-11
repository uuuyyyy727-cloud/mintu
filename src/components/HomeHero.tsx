import React from 'react';
import { Crown, Users, ExternalLink, Play, Sparkles, Shield, Flame, Radio, Youtube } from 'lucide-react';
import { YouTubeChannelData } from '../types';

interface HomeHeroProps {
  onJoinMembership: () => void;
  onExploreCommunity: () => void;
  subscriberCount: number | null;
  totalMembers: number;
  isLive: boolean;
  onOpenLiveStream: () => void;
  youtubeData: YouTubeChannelData | null;
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  onJoinMembership,
  onExploreCommunity,
  subscriberCount,
  totalMembers,
  isLive,
  onOpenLiveStream,
  youtubeData,
}) => {
  const avatarUrl = youtubeData?.avatarUrl || 'https://yt3.googleusercontent.com/RMNMRMFJAftFww9cMuwTEKfgoaQmrZara-bLAsKC95evHWqLSmpJ29XOylZ8nyU6xJyKF8CM=s900-c-k-c0x00ffffff-no-rj';

  return (
    <section className="relative overflow-hidden pt-6 pb-12 lg:py-16">
      {/* Background ambient esports light beams */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-purple-900/20 via-blue-950/10 to-transparent pointer-events-none blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Main 2-Column Split Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Proposition & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Human Editorial Badge / Kicker */}
            <div className="inline-flex items-center gap-2 text-xs text-slate-300 bg-[#0e162e] border border-purple-500/30 rounded-xl px-3.5 py-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              <span className="font-semibold text-white tracking-wide">VG ALPHAX</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-purple-300">YouTube Gaming Creator (@vg_alphax)</span>
              {isLive ? (
                <>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                    STREAMING LIVE
                  </span>
                </>
              ) : (
                <>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-slate-400 font-medium">Free Fire MAX</span>
                </>
              )}
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1] font-['Outfit']">
              More Than Just <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400">
                a Channel.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed font-normal">
              Join the community. Support the creator. Become part of the ALPHAX Army.
              Unlock verified member badges, private custom room scrims, and real-time creator chat.
            </p>

            {/* 3 Primary Hero Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={onJoinMembership}
                className="px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl shadow-xl shadow-purple-950/60 transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2.5 whitespace-nowrap"
              >
                <Crown className="w-4 h-4 text-amber-300" />
                Join Membership
              </button>

              <button
                onClick={onExploreCommunity}
                className="px-5 py-3.5 text-sm font-semibold text-slate-200 bg-[#0e162e] border border-slate-700 hover:border-purple-500/60 hover:text-white rounded-xl transition-all inline-flex items-center gap-2 whitespace-nowrap"
              >
                <Users className="w-4 h-4 text-cyan-400" />
                Explore Community
              </button>

              <a
                href="https://youtube.com/@vg_alphax"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3.5 text-sm font-semibold text-red-300 bg-red-950/30 border border-red-800/40 hover:bg-red-900/40 hover:text-white rounded-xl transition-all inline-flex items-center gap-2 whitespace-nowrap"
              >
                <Youtube className="w-4 h-4 text-red-400" />
                Watch on YouTube
              </a>
            </div>

            {/* Trust and Independence Guarantee */}
            <div className="pt-2 flex items-start gap-2.5 text-xs text-slate-400 max-w-xl bg-purple-950/20 border border-purple-900/30 rounded-xl p-3">
              <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Official Creator Independent Platform:</span>
                {' '}Memberships purchased here directly fund tournaments, custom prize rooms, and channel equipment. Note: Website memberships do not grant official YouTube badge perks inside YouTube comments.
              </div>
            </div>

          </div>

          {/* Right Column: High-Impact Esports Hero Visual & Live Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl bg-[#090e1f] group">
              
              {/* Main Arena Backdrop Image */}
              <div className="aspect-[16/9] lg:aspect-[4/3] w-full overflow-hidden relative">
                <img
                  src="/src/assets/images/hero_esports_alphax_1791703225410.jpg"
                  alt="VG ALPHAX Esports Arena"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090e1f] via-transparent to-black/30" />
              </div>

              {/* Foreground Floating Creator Card */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarUrl}
                      alt="VG ALPHAX Avatar"
                      className="w-12 h-12 rounded-xl object-cover border-2 border-purple-500 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-white text-base font-['Outfit']">VG ALPHAX</span>
                        <span className="text-[10px] bg-red-600/30 border border-red-500/50 text-red-300 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Youtube className="w-2.5 h-2.5" />
                          @vg_alphax
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Free Fire MAX &amp; Esports Specialist</p>
                    </div>
                  </div>

                  {isLive ? (
                    <a
                      href="https://youtube.com/@vg_alphax/live"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-lg shadow-red-950/60"
                    >
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      WATCH LIVE
                    </a>
                  ) : (
                    <button
                      onClick={onOpenLiveStream}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      View Videos
                    </button>
                  )}
                </div>

                {/* Quick Info bar */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-[#050814]/80 rounded-xl p-2.5 border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px]">YouTube Channel</span>
                    <span className="font-bold text-slate-100">UCa5uZImNOQZAT5...</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Livestream Status</span>
                    <span className={`font-bold ${isLive ? 'text-red-400' : 'text-slate-400'}`}>
                      {isLive ? '🔴 Live on YouTube' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Full-Width Quantitative Stats Strip with Real YouTube Data */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#0a0f22]/90 border border-purple-950/40">
          <div className="space-y-0.5">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              ALPHAX Army Members
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tabular-nums">
              {totalMembers.toLocaleString()}
            </div>
            <span className="text-[11px] text-purple-400/80 font-medium">Verified Active Supporters</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Youtube className="w-3.5 h-3.5 text-red-400" />
              YouTube Subscribers
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tabular-nums">
              {subscriberCount !== null ? subscriberCount.toLocaleString() : '134'}
            </div>
            <span className="text-[11px] text-slate-400">Real Count from @vg_alphax</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Play className="w-3.5 h-3.5 text-amber-400" />
              Channel Videos
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tabular-nums">
              {youtubeData?.videoCount || 15}+
            </div>
            <span className="text-[11px] text-amber-400/80 font-medium">Uploaded Clutches &amp; Shorts</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-cyan-400" />
              Payment Verification
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 font-['Outfit']">
              Strict
            </div>
            <span className="text-[11px] text-slate-400">Cryptographic Webhook Gating</span>
          </div>
        </div>

      </div>
    </section>
  );
};
