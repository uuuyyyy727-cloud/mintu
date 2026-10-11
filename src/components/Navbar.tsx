import React, { useState } from 'react';
import { User } from '../types';
import { 
  ShieldCheck, 
  Crown, 
  Flame, 
  MessageSquare, 
  Users, 
  Video, 
  Settings, 
  Menu, 
  X, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User;
  onSwitchUser: (userId: string) => void;
  onOpenCheckout: (tier?: 'VIP' | 'Elite' | 'Legend') => void;
  isLive: boolean;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onSwitchUser,
  onOpenCheckout,
  isLive,
  onOpenAuth,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const demoAccounts = [
    { id: 'usr_owner', name: 'VG ALPHAX (Owner / Creator)', role: 'owner', badge: '👑 OWNER' },
    { id: 'usr_elite_1', name: 'ShadowStrike_99 (Elite Member)', role: 'member', badge: '⚡ ELITE' },
    { id: 'usr_vip_1', name: 'AaravFF_Pro (VIP Member)', role: 'member', badge: '👑 VIP' },
    { id: 'usr_guest_demo', name: 'Recruit_Player (Guest / Visitor)', role: 'guest', badge: '🎮 RECRUIT' },
  ];

  return (
    <>
      {/* Top Banner Notice: YouTube Channel Membership vs Website Membership */}
      <aside aria-label="Official platform notice" className="bg-[#0b1021] border-b border-purple-950/40 px-4 py-1.5 text-xs text-slate-300 text-center flex items-center justify-center gap-2">
        <span className="text-amber-400 font-semibold">ALPHAX PLATFORM NOTICE:</span>
        <span>Independent creator membership platform. Benefits active here &amp; on Discord (distinct from YouTube channel memberships).</span>
        <a 
          href="https://youtube.com/@vg_alphax" 
          target="_blank" 
          rel="noreferrer" 
          className="text-purple-400 hover:text-purple-300 underline inline-flex items-center gap-1 font-medium"
        >
          YouTube Channel (@vg_alphax) <ExternalLink className="w-3 h-3" />
        </a>
      </aside>

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#050814]/90 backdrop-blur-md border-b border-purple-900/20 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          
          {/* Zone 1: Brand Wordmark */}
          <button 
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-3 text-left focus:outline-none group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-[2px] transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-[#070b18] rounded-[10px] flex items-center justify-center">
                <span className="font-extrabold text-sm tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                  VG
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white font-['Outfit'] uppercase">
                  VG ALPHAX
                </span>
                {isLive && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 tracking-wider">OFFICIAL GAMING HUB</p>
            </div>
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-300">
            <button
              onClick={() => setCurrentTab('home')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                currentTab === 'home' ? 'text-purple-400 font-bold border-b-2 border-purple-500 pb-1' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentTab('memberships')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentTab === 'memberships' ? 'text-purple-400 font-bold border-b-2 border-purple-500 pb-1' : ''
              }`}
            >
              <Crown className="w-4 h-4 text-amber-400" />
              Memberships
            </button>
            <button
              onClick={() => setCurrentTab('community')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentTab === 'community' ? 'text-purple-400 font-bold border-b-2 border-purple-500 pb-1' : ''
              }`}
            >
              <Users className="w-4 h-4 text-cyan-400" />
              Community Groups
            </button>
            <button
              onClick={() => setCurrentTab('chat')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentTab === 'chat' ? 'text-purple-400 font-bold border-b-2 border-purple-500 pb-1' : ''
              }`}
            >
              <MessageSquare className="w-4 h-4 text-purple-400" />
              Live Chat
            </button>
            <button
              onClick={() => setCurrentTab('videos')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentTab === 'videos' ? 'text-purple-400 font-bold border-b-2 border-purple-500 pb-1' : ''
              }`}
            >
              <Video className="w-4 h-4 text-emerald-400" />
              Videos &amp; Streams
            </button>
            <button
              onClick={() => setCurrentTab('admin')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 text-purple-300 bg-purple-950/40 border border-purple-700/40 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                currentTab === 'admin' ? 'border-purple-400 bg-purple-900/60 text-white' : ''
              }`}
              title="Protected Administrator Portal (/admin)"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          </nav>

          {/* Zone 3: Primary Actions & User Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            {/* User Account Switcher / Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 bg-[#0e162e] border border-slate-700/50 hover:border-purple-500/50 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 transition-all"
              >
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="w-6 h-6 rounded-lg object-cover border border-purple-500/40"
                  referrerPolicy="no-referrer"
                />
                <div className="hidden sm:block text-left">
                  <div className="font-bold text-white truncate max-w-[100px] leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-purple-300">
                    {currentUser.membership?.active 
                      ? `${currentUser.membership.tier} Tier` 
                      : currentUser.role === 'owner' 
                        ? 'Channel Owner' 
                        : 'Recruit'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#0a0f20] border border-purple-900/50 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-800 text-xs text-slate-400 font-semibold">
                    SWITCH TEST PERSONA / ROLE
                  </div>
                  <div className="py-1">
                    {demoAccounts.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => {
                          onSwitchUser(acc.id);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          currentUser.id === acc.id 
                            ? 'bg-purple-600/20 text-purple-200 font-semibold border border-purple-500/30' 
                            : 'text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="truncate">{acc.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60">
                          {acc.badge}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-800 pt-1 mt-1 space-y-1">
                    <button
                      onClick={() => {
                        onOpenAuth();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-purple-300 hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span>Supabase Login / Sign Up</span>
                      <span className="text-[9px] bg-purple-900/60 px-1.5 py-0.5 rounded text-purple-200">Auth</span>
                    </button>
                    {currentUser.role === 'owner' && (
                      <button
                        onClick={() => {
                          setCurrentTab('admin');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-cyan-400 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Open Admin Dashboard
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Guest Sign In Button */}
            {currentUser.role === 'guest' && (
              <button
                onClick={onOpenAuth}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#0e162e] border border-slate-700/60 hover:border-purple-500/50 rounded-xl transition-all"
              >
                Sign In
              </button>
            )}

            {/* Primary Action Button */}
            {!currentUser.membership?.active ? (
              <button
                onClick={() => onOpenCheckout('Elite')}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl shadow-lg shadow-purple-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                Join Membership
              </button>
            ) : (
              <button
                onClick={() => setCurrentTab('chat')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-500/40 hover:bg-cyan-900/50 rounded-xl transition-all whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                VIP Member Active
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-800/60 text-slate-300 hover:text-white"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-800/80 space-y-1">
            <button
              onClick={() => { setCurrentTab('home'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold ${
                currentTab === 'home' ? 'bg-purple-900/40 text-purple-300' : 'text-slate-300 hover:bg-slate-800/40'
              }`}
            >
              Home Dashboard
            </button>
            <button
              onClick={() => { setCurrentTab('memberships'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between ${
                currentTab === 'memberships' ? 'bg-purple-900/40 text-purple-300' : 'text-slate-300 hover:bg-slate-800/40'
              }`}
            >
              <span className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                Membership Plans
              </span>
              <span className="text-[10px] bg-purple-900/80 text-purple-300 px-2 py-0.5 rounded">UPI Instant</span>
            </button>
            <button
              onClick={() => { setCurrentTab('community'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                currentTab === 'community' ? 'bg-purple-900/40 text-purple-300' : 'text-slate-300 hover:bg-slate-800/40'
              }`}
            >
              <Users className="w-4 h-4 text-cyan-400" />
              Community Groups
            </button>
            <button
              onClick={() => { setCurrentTab('chat'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                currentTab === 'chat' ? 'bg-purple-900/40 text-purple-300' : 'text-slate-300 hover:bg-slate-800/40'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-purple-400" />
              Live Member Chat
            </button>
            <button
              onClick={() => { setCurrentTab('videos'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                currentTab === 'videos' ? 'bg-purple-900/40 text-purple-300' : 'text-slate-300 hover:bg-slate-800/40'
              }`}
            >
              <Video className="w-4 h-4 text-emerald-400" />
              Gaming Videos &amp; Livestreams
            </button>
            <button
              onClick={() => { setCurrentTab('admin'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-purple-900/60 text-white border border-purple-500/40'
                  : 'text-purple-300 hover:bg-slate-800/40'
              }`}
            >
              <Settings className="w-4 h-4 text-purple-400" />
              <span>Admin Portal (/admin)</span>
            </button>
            <div className="pt-2 px-4">
              <button
                onClick={() => { onOpenCheckout('Elite'); setMobileMenuOpen(false); }}
                className="w-full py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl"
              >
                Join ALPHAX Army Membership
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (Optimized for Android phone creators & viewers) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070b18]/95 backdrop-blur-lg border-t border-purple-900/30 px-2 py-2 flex items-center justify-around text-[10px] font-semibold text-slate-400">
        <button
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center gap-1 ${currentTab === 'home' ? 'text-purple-400 font-bold' : ''}`}
        >
          <Flame className="w-5 h-5" />
          <span>Home</span>
        </button>
        <button
          onClick={() => setCurrentTab('memberships')}
          className={`flex flex-col items-center gap-1 ${currentTab === 'memberships' ? 'text-purple-400 font-bold' : ''}`}
        >
          <Crown className="w-5 h-5" />
          <span>Plans</span>
        </button>
        <button
          onClick={() => setCurrentTab('chat')}
          className={`flex flex-col items-center gap-1 ${currentTab === 'chat' ? 'text-purple-400 font-bold' : ''}`}
        >
          <MessageSquare className="w-5 h-5" />
          <span>Chat</span>
        </button>
        <button
          onClick={() => setCurrentTab('community')}
          className={`flex flex-col items-center gap-1 ${currentTab === 'community' ? 'text-purple-400 font-bold' : ''}`}
        >
          <Users className="w-5 h-5" />
          <span>Groups</span>
        </button>
        <button
          onClick={() => onOpenCheckout('Elite')}
          className="flex flex-col items-center gap-1 text-cyan-400"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white font-black text-[9px]">
            ₹
          </div>
          <span>Join</span>
        </button>
      </div>
    </>
  );
};
