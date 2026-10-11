import React, { useState, useEffect } from 'react';
import { 
  User, 
  MembershipPlan, 
  AppSettings, 
  CreatorProfile, 
  CommunityGroup, 
  CommunityPost, 
  VideoItem, 
  MembershipTierName, 
  BillingPeriod, 
  PaymentOrder 
} from './types';
import { Navbar } from './components/Navbar';
import { HomeHero } from './components/HomeHero';
import { MembershipPlans } from './components/MembershipPlans';
import { CheckoutUPIModal } from './components/CheckoutUPIModal';
import { LiveAlertOverlay } from './components/LiveAlertOverlay';
import { ChatView } from './components/ChatView';
import { CommunityView } from './components/CommunityView';
import { VideoGallery } from './components/VideoGallery';
import { AdminDashboard } from './components/AdminDashboard';
import { SupabaseAuthModal } from './components/SupabaseAuthModal';
import { YouTubeChannelData } from './types';
import { INITIAL_PLANS, INITIAL_GROUPS } from './constants';
import { Crown, Flame, Shield, ExternalLink, Sparkles, Youtube, Disc as Discord } from 'lucide-react';

export default function App() {
  // Check if requested as standalone OBS / Streamlabs Browser Source overlay
  const isOverlayMode = typeof window !== 'undefined' && window.location.search.includes('view=overlay');

  // Application state
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr_guest_demo',
    email: 'recruit@alphaxarmy.in',
    name: 'Recruit_Player',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Recruit',
    role: 'guest',
    createdAt: new Date().toISOString(),
  });

  const [plans, setPlans] = useState<MembershipPlan[]>(INITIAL_PLANS);
  const [settings, setSettings] = useState<AppSettings>({
    upiId: 'vgalphax@axl',
    upiIdVerified: true,
    upiMerchantName: 'VG ALPHAX Gaming',
    qrAssetUrl: '/vgalphax-upi-qr.svg',
    paymentMode: 'test',
    gatewayKeyId: 'rzp_test_alphax12345',
    gatewaySecretConfigured: true,
    webhookSecretConfigured: true,
    alertOverlayToken: 'alphax_secure_overlay_token_9982',
    alertDisplayDurationSec: 8,
    alertSoundEnabled: true,
    customWelcomeMessage: 'WELCOME TO THE ALPHAX ARMY! {name} just joined as a {tier} Member! 🔥',
  });

  const [creator, setCreator] = useState<CreatorProfile>({
    name: 'VG ALPHAX',
    brand: 'VG ALPHAX',
    avatar: '/src/assets/images/creator_avatar_alphax_1791703237400.jpg',
    bannerImage: '/src/assets/images/hero_esports_alphax_1791703225410.jpg',
    bio: 'Top-tier Free Fire MAX & Battle Royale Esports Content Creator.',
    isLive: false,
    liveStreamTitle: 'GRANDMASTER RANK PUSH WITH ELITE SQUAD! 🔴 ROAD TO TOP 10 REGION | CUSTOM ROOMS',
    subscriberCount: 134,
    totalMembers: 412,
    discordInviteUrl: 'https://discord.gg/alphaxarmy',
    youtubeChannelUrl: 'https://youtube.com/@vg_alphax',
    instagramUrl: 'https://instagram.com/vg_alphax',
  });

  const [youtubeData, setYoutubeData] = useState<YouTubeChannelData | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [groups, setGroups] = useState<CommunityGroup[]>(INITIAL_GROUPS);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);

  // Checkout modal state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutTier, setCheckoutTier] = useState<MembershipTierName>('Elite');
  const [checkoutBilling, setCheckoutBilling] = useState<BillingPeriod>('monthly');

  // Load initial dataset
  useEffect(() => {
    async function loadData() {
      try {
        const [userRes, plansRes, creatorRes, groupsRes, postsRes, ytRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/memberships/plans'),
          fetch('/api/creator/profile'),
          fetch('/api/community/groups'),
          fetch('/api/community/posts'),
          fetch('/api/youtube/data').catch(() => null),
        ]);

        const userData = await userRes.json();
        if (userData.user) setCurrentUser(userData.user);

        const plansData = await plansRes.json();
        if (plansData.plans) setPlans(plansData.plans);

        const creatorData = await creatorRes.json();
        if (creatorData.creator) setCreator(creatorData.creator);
        if (creatorData.videos) setVideos(creatorData.videos);

        const groupsData = await groupsRes.json();
        if (groupsData.groups) setGroups(groupsData.groups);

        const postsData = await postsRes.json();
        if (postsData.posts) setPosts(postsData.posts);

        if (ytRes && ytRes.ok) {
          const ytJson = await ytRes.json();
          if (ytJson.data) {
            setYoutubeData(ytJson.data);
            if (ytJson.data.subscriberCount !== null && ytJson.data.subscriberCount !== undefined) {
              setCreator((prev) => ({
                ...prev,
                subscriberCount: ytJson.data.subscriberCount,
                isLive: ytJson.data.isLive ?? prev.isLive,
                liveStreamTitle: ytJson.data.liveStream?.title ?? prev.liveStreamTitle,
              }));
            }
          }
        }
      } catch (err) {
        console.error('Error initializing app state', err);
      }
    }

    loadData();
  }, []);

  async function handleSwitchUser(userId: string) {
    try {
      const res = await fetch('/api/auth/switch-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch {
      // ignore
    }
  }

  function handleOpenCheckout(tier: MembershipTierName = 'Elite', billing: BillingPeriod = 'monthly') {
    setCheckoutTier(tier);
    setCheckoutBilling(billing);
    setCheckoutOpen(true);
  }

  function handleOrderSuccess(completedOrder: PaymentOrder) {
    // Update local user's active membership
    setCurrentUser((prev) => ({
      ...prev,
      membership: {
        tier: completedOrder.tier,
        billingPeriod: completedOrder.billingPeriod,
        orderId: completedOrder.orderId,
        active: true,
        startedAt: completedOrder.completedAt || new Date().toISOString(),
        expiresAt: completedOrder.expiresAt || new Date().toISOString(),
        paymentRef: completedOrder.gatewayPaymentId || 'pay_upi_verified',
      },
    }));
    setCreator((prev) => ({ ...prev, totalMembers: prev.totalMembers + 1 }));
  }

  async function handleToggleLive(isLive: boolean, title?: string) {
    try {
      const res = await fetch('/api/creator/toggle-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLive, liveStreamTitle: title }),
      });
      const data = await res.json();
      if (data.creator) {
        setCreator(data.creator);
      }
    } catch {
      // ignore
    }
  }

  // If running in OBS / PRISM Mobile Browser Source overlay mode:
  if (isOverlayMode) {
    return <LiveAlertOverlay isStandalone={true} settings={settings} />;
  }

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] pb-16 md:pb-0">
      
      {/* Real-time live stream alert banner overlay for web viewer preview */}
      <LiveAlertOverlay isStandalone={false} settings={settings} />

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenCheckout={handleOpenCheckout}
        isLive={creator.isLive}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main Tab Views */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <div className="space-y-12">
            <HomeHero
              onJoinMembership={() => handleOpenCheckout('Elite')}
              onExploreCommunity={() => setCurrentTab('community')}
              subscriberCount={creator.subscriberCount}
              totalMembers={creator.totalMembers}
              isLive={creator.isLive}
              onOpenLiveStream={() => setCurrentTab('videos')}
              youtubeData={youtubeData}
            />

            {/* Quick Membership Cards Preview on Home */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
              <div className="text-center space-y-2 mb-8">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest bg-purple-950/40 border border-purple-800/40 px-3 py-1 rounded-full">
                  OFFICIAL TIERS
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
                  Join the ALPHAX Army
                </h3>
              </div>
              <MembershipPlans
                plans={plans}
                currentUser={currentUser}
                onSelectTier={handleOpenCheckout}
              />
            </div>
          </div>
        )}

        {currentTab === 'memberships' && (
          <MembershipPlans
            plans={plans}
            currentUser={currentUser}
            onSelectTier={handleOpenCheckout}
          />
        )}

        {currentTab === 'community' && (
          <CommunityView
            groups={groups}
            posts={posts}
            currentUser={currentUser}
            onJoinTier={() => handleOpenCheckout('Elite')}
            onRefreshPosts={() => {
              fetch('/api/community/posts')
                .then((r) => r.json())
                .then((d) => d.posts && setPosts(d.posts));
            }}
          />
        )}

        {currentTab === 'chat' && (
          <ChatView
            currentUser={currentUser}
            onJoinTier={() => handleOpenCheckout('VIP')}
          />
        )}

        {currentTab === 'videos' && (
          <VideoGallery
            videos={videos}
            creator={creator}
            currentUser={currentUser}
            onJoinTier={() => handleOpenCheckout('VIP')}
            youtubeData={youtubeData}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            settings={settings}
            plans={plans}
            onUpdateSettings={(newSet) => setSettings((prev) => ({ ...prev, ...newSet }))}
            onRefreshData={() => {
              fetch('/api/memberships/plans')
                .then((r) => r.json())
                .then((d) => d.plans && setPlans(d.plans));
            }}
            isLive={creator.isLive}
            onToggleLive={handleToggleLive}
          />
        )}
      </main>

      {/* Checkout UPI Modal */}
      <CheckoutUPIModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        tier={checkoutTier}
        billingPeriod={checkoutBilling}
        plans={plans}
        currentUser={currentUser}
        settings={settings}
        onSuccess={handleOrderSuccess}
      />

      {/* Supabase Authentication & Profile Modal */}
      <SupabaseAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setAuthModalOpen(false);
        }}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-purple-950/40 bg-[#070b18] text-xs text-slate-400 py-10 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 p-[2px]">
              <div className="w-full h-full bg-[#050814] rounded-[6px] flex items-center justify-center font-extrabold text-white text-xs">
                VG
              </div>
            </div>
            <div>
              <div className="font-extrabold text-white text-sm font-['Outfit']">VG ALPHAX</div>
              <div className="text-[11px] text-slate-400">Official Creator Membership &amp; Esports Community</div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-slate-300">
            <a 
              href={creator.youtubeChannelUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-red-400 flex items-center gap-1.5 transition-colors"
            >
              <Youtube className="w-4 h-4 text-red-500" />
              <span>YouTube</span>
            </a>
            <a 
              href={creator.discordInviteUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
            >
              <Discord className="w-4 h-4 text-indigo-400" />
              <span>Discord</span>
            </a>
            <button
              onClick={() => setCurrentTab('admin')}
              className="hover:text-purple-300 text-[11px]"
            >
              Owner Portal
            </button>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} VG ALPHAX. All rights reserved.
            <div className="text-slate-400 text-[10px] mt-0.5">
              Secure UPI Gateway &amp; Instant Webhook Verification
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
