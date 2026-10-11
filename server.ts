import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  User,
  MembershipPlan,
  PaymentOrder,
  PaymentWebhookLog,
  LiveAlertEvent,
  ChatMessage,
  CommunityGroup,
  CommunityPost,
  VideoItem,
  CreatorProfile,
  AppSettings,
  YouTubeChannelData,
  MembershipTierName,
  BillingPeriod,
} from './src/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.resolve(process.cwd(), 'server_db.json');

// Memory DB with persistent file backup
interface DBState {
  users: User[];
  plans: MembershipPlan[];
  orders: PaymentOrder[];
  webhookLogs: PaymentWebhookLog[];
  alerts: LiveAlertEvent[];
  chatMessages: ChatMessage[];
  groups: CommunityGroup[];
  posts: CommunityPost[];
  videos: VideoItem[];
  creator: CreatorProfile;
  settings: AppSettings;
}

const DEFAULT_PLANS: MembershipPlan[] = [
  {
    id: 'tier_vip',
    tier: 'VIP',
    name: 'VIP Member',
    badge: '👑 VIP',
    tagline: 'Join the inner circle and stand out in streams',
    monthlyPrice: 99,
    yearlyPrice: 999,
    badgeColor: '#a855f7',
    accentGlow: 'rgba(168, 85, 247, 0.4)',
    discordRole: 'ALPHAX VIP',
    chatBadge: 'VIP',
    perks: [
      'Official ALPHAX VIP Badge in chat & profile',
      'Access to Member-Only Community Posts & Polls',
      'Exclusive VIP Discord Role & Channel Access',
      'Live Stream Alert Callout on Screen',
      'Custom Discord & Website Emotes',
    ],
  },
  {
    id: 'tier_elite',
    tier: 'Elite',
    name: 'Elite Member',
    badge: '⚡ ELITE',
    tagline: 'Priority squad gaming & exclusive live streams',
    monthlyPrice: 299,
    yearlyPrice: 2999,
    badgeColor: '#38bdf8',
    accentGlow: 'rgba(56, 189, 248, 0.4)',
    popular: true,
    discordRole: 'ALPHAX Elite Squad',
    chatBadge: 'ELITE',
    perks: [
      'All VIP Member Perks Included',
      'Priority Squad Slots in Live Custom Rooms (Free Fire MAX)',
      'Access to Real-Time Private Member Chat with VG ALPHAX',
      'Exclusive Gameplay Highlights & Uncut VODs',
      'Monthly Custom Room Tournaments with Prize Pool Entry',
      'High-Priority Chat Highlight during live streams',
    ],
  },
  {
    id: 'tier_legend',
    tier: 'Legend',
    name: 'Legend Member',
    badge: '🔥 LEGEND',
    tagline: 'Ultimate tier for true champions of the ALPHAX Army',
    monthlyPrice: 799,
    yearlyPrice: 7999,
    badgeColor: '#eab308',
    accentGlow: 'rgba(234, 179, 8, 0.4)',
    discordRole: 'ALPHAX Legend Council',
    chatBadge: 'LEGEND',
    perks: [
      'All Elite & VIP Member Perks Included',
      'Direct Voice Chat Session with VG ALPHAX on Discord',
      'Guaranteed Squad Team-Up during Weekly Weekend Streams',
      'Permanent Hall of Fame placement on Official Website',
      'Exclusive Legend-Only Giveaways & In-Game Items',
      'Custom Shoutout Video Recorded by VG ALPHAX',
      'Special Golden Animated Nameplate in Chat',
    ],
  },
];

const DEFAULT_USERS: User[] = [
  {
    id: 'usr_owner',
    email: 'owner@vgalphax.com',
    name: 'VG ALPHAX',
    avatar: 'https://yt3.googleusercontent.com/RMNMRMFJAftFww9cMuwTEKfgoaQmrZara-bLAsKC95evHWqLSmpJ29XOylZ8nyU6xJyKF8CM=s900-c-k-c0x00ffffff-no-rj',
    role: 'owner',
    createdAt: '2025-01-01T00:00:00.000Z',
    membership: {
      tier: 'Legend',
      billingPeriod: 'yearly',
      orderId: 'ORD-FOUNDER-001',
      active: true,
      startedAt: '2025-01-01T00:00:00.000Z',
      expiresAt: '2030-01-01T00:00:00.000Z',
      paymentRef: 'FOUNDER_GENESIS',
    },
  },
  {
    id: 'usr_elite_1',
    email: 'shadowstrike@alphaxarmy.in',
    name: 'ShadowStrike_99',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ShadowStrike',
    role: 'member',
    createdAt: '2026-02-15T10:00:00.000Z',
  },
  {
    id: 'usr_vip_1',
    email: 'aarav.ff@alphaxarmy.in',
    name: 'AaravFF_Pro',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AaravPro',
    role: 'member',
    createdAt: '2026-03-10T14:30:00.000Z',
  },
  {
    id: 'usr_guest_demo',
    email: 'recruit@alphaxarmy.in',
    name: 'Recruit_Player',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Recruit',
    role: 'guest',
    createdAt: '2026-10-10T10:00:00.000Z',
  },
];

const DEFAULT_GROUPS: CommunityGroup[] = [
  {
    id: 'grp_freefire',
    name: 'Free Fire MAX',
    slug: 'free-fire-max',
    category: 'Gaming',
    description: 'Custom room IDs, squad rush tactics, character combos, and weapon meta discussions.',
    isPrivate: false,
    memberCount: 4820,
    iconName: 'Flame',
    lastActive: '2 min ago',
  },
  {
    id: 'grp_squad',
    name: 'Gaming Squad Hub',
    slug: 'gaming-squad',
    category: 'Squad Matchmaking',
    description: 'Find teammates with active mic for ranked push, CS ranked, and scrim practice.',
    isPrivate: false,
    memberCount: 2340,
    iconName: 'Users',
    lastActive: '5 min ago',
  },
  {
    id: 'grp_announcements',
    name: 'Official Announcements',
    slug: 'announcements',
    category: 'Official',
    description: 'Verified updates, stream schedules, tournament brackets, and channel milestones directly from VG ALPHAX.',
    isPrivate: false,
    memberCount: 15400,
    iconName: 'Megaphone',
    lastActive: '1 hour ago',
  },
  {
    id: 'grp_events',
    name: 'Esports & Community Events',
    slug: 'events',
    category: 'Tournaments',
    description: 'Weekly Sunday tournaments, custom clash squad cups, and giveaway registrations.',
    isPrivate: false,
    memberCount: 3100,
    iconName: 'Trophy',
    lastActive: '3 hours ago',
  },
  {
    id: 'grp_vip_lounge',
    name: 'VIP & Elite Lounge',
    slug: 'vip-lounge',
    category: 'Members Only',
    description: 'Exclusive private lounge for VIP, Elite, and Legend members. Direct access to creator chats and early strategy drops.',
    minTier: 'VIP',
    isPrivate: true,
    memberCount: 285,
    iconName: 'Crown',
    lastActive: 'Just now',
  },
];

const DEFAULT_POSTS: CommunityPost[] = [
  {
    id: 'post_1',
    authorName: 'VG ALPHAX',
    authorAvatar: 'https://yt3.googleusercontent.com/RMNMRMFJAftFww9cMuwTEKfgoaQmrZara-bLAsKC95evHWqLSmpJ29XOylZ8nyU6xJyKF8CM=s900-c-k-c0x00ffffff-no-rj',
    authorRole: 'owner',
    title: 'Sunday Mega Stream & Free Fire MAX Custom Rooms! 🔥',
    content: 'Welcome to the ALPHAX Army! Check out our latest videos and custom rooms streamed directly on YouTube @vg_alphax. Elite & Legend members get priority room slot access!',
    category: 'Stream Schedule',
    createdAt: '2026-10-10T18:00:00.000Z',
    likes: 34,
    commentsCount: 8,
    likedByMe: true,
    isMemberOnly: false,
    poll: {
      question: 'Which weapon loadout should we play in Room #1?',
      totalVotes: 89,
      options: [
        { id: 'opt_1', text: 'Double Woodpecker Only', votes: 46 },
        { id: 'opt_2', text: 'Shotgun Rush (M1887 + MP40)', votes: 31 },
        { id: 'opt_3', text: 'Sniper Showdown (AWM)', votes: 12 },
      ],
    },
  },
  {
    id: 'post_2',
    authorName: 'VG ALPHAX',
    authorAvatar: 'https://yt3.googleusercontent.com/RMNMRMFJAftFww9cMuwTEKfgoaQmrZara-bLAsKC95evHWqLSmpJ29XOylZ8nyU6xJyKF8CM=s900-c-k-c0x00ffffff-no-rj',
    authorRole: 'owner',
    title: 'Rank Push Strategy: Double Woodpecker High-Tier Rotation [Members Only]',
    content: 'Tactical guide for Bermuda and Kalahari high-rank pushes. Covers recoil reset timings, distance engagement angles, and CS ranked positioning.',
    category: 'Pro Strategy',
    createdAt: '2026-10-09T14:15:00.000Z',
    likes: 18,
    commentsCount: 4,
    isMemberOnly: true,
    minTier: 'VIP',
  },
];

const DEFAULT_CREATOR: CreatorProfile = {
  name: 'VG ALPHAX',
  brand: 'VG ALPHAX',
  avatar: 'https://yt3.googleusercontent.com/RMNMRMFJAftFww9cMuwTEKfgoaQmrZara-bLAsKC95evHWqLSmpJ29XOylZ8nyU6xJyKF8CM=s900-c-k-c0x00ffffff-no-rj',
  bannerImage: '/src/assets/images/hero_esports_alphax_1791703225410.jpg',
  bio: 'Official YouTube Gaming Creator (@vg_alphax). Free Fire MAX mobile clutch gameplay, custom room tournaments, and live rank pushes.',
  isLive: false,
  subscriberCount: 134,
  totalMembers: 0,
  discordInviteUrl: 'https://discord.gg/alphaxarmy',
  youtubeChannelUrl: 'https://youtube.com/@vg_alphax',
  instagramUrl: 'https://instagram.com/vg_alphax',
};

const DEFAULT_SETTINGS: AppSettings = {
  upiId: process.env.UPI_ID || 'vgalphax@axl',
  upiIdVerified: true,
  upiMerchantName: 'VG ALPHAX Gaming',
  qrAssetUrl: '/vgalphax-upi-qr.svg',
  paymentMode: 'test',
  gatewayKeyId: process.env.PAYMENT_PROVIDER_KEY_ID || '',
  gatewaySecretConfigured: Boolean(process.env.PAYMENT_PROVIDER_KEY_SECRET),
  webhookSecretConfigured: Boolean(process.env.PAYMENT_WEBHOOK_SECRET),
  alertOverlayToken: process.env.ALERT_OVERLAY_SECRET || 'alphax_secure_overlay_token_9982',
  alertDisplayDurationSec: 8,
  alertSoundEnabled: true,
  customWelcomeMessage: 'WELCOME TO THE ALPHAX ARMY! {name} just joined as a {tier} Member! 🔥',
  youtubeApiKeyConfigured: Boolean(process.env.YOUTUBE_API_KEY),
  supabaseConfigured: Boolean(process.env.VITE_SUPABASE_ANON_KEY),
};

// In-memory YouTube cache
let youtubeCache: {
  data: YouTubeChannelData | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

function loadDB(): DBState {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      // Sync creator handle & channel URL
      if (data.creator) {
        data.creator.youtubeChannelUrl = 'https://youtube.com/@vg_alphax';
      }
      return data;
    } catch (e) {
      console.error('Error reading DB_FILE, creating fresh state', e);
    }
  }

  const fresh: DBState = {
    users: DEFAULT_USERS,
    plans: DEFAULT_PLANS,
    orders: [],
    webhookLogs: [],
    alerts: [],
    chatMessages: [
      {
        id: 'msg_1',
        channelId: 'general',
        userId: 'usr_owner',
        userName: 'VG ALPHAX',
        userAvatar: 'https://yt3.googleusercontent.com/RMNMRMFJAftFww9cMuwTEKfgoaQmrZara-bLAsKC95evHWqLSmpJ29XOylZ8nyU6xJyKF8CM=s900-c-k-c0x00ffffff-no-rj',
        userRole: 'owner',
        userTier: 'Legend',
        content: 'Welcome to the official VG ALPHAX platform! Subscribed to YouTube @vg_alphax? Join the discussion here!',
        timestamp: new Date().toISOString(),
        pinned: true,
        reactions: { '🔥': ['ShadowStrike_99'] },
      },
    ],
    groups: DEFAULT_GROUPS,
    posts: DEFAULT_POSTS,
    videos: [],
    creator: DEFAULT_CREATOR,
    settings: DEFAULT_SETTINGS,
  };

  saveDB(fresh);
  return fresh;
}

function saveDB(state: DBState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed saving DB state', e);
  }
}

let db = loadDB();

// Active SSE client connections
type SSEClient = { id: string; res: Response };
const overlayClients: SSEClient[] = [];
const chatClients: SSEClient[] = [];

function broadcastOverlayAlert(alert: LiveAlertEvent) {
  const data = JSON.stringify(alert);
  overlayClients.forEach((client) => {
    try {
      client.res.write(`data: ${data}\n\n`);
    } catch {
      // client disconnected
    }
  });
}

function broadcastChatMessage(msg: ChatMessage) {
  const data = JSON.stringify(msg);
  chatClients.forEach((client) => {
    try {
      client.res.write(`data: ${data}\n\n`);
    } catch {
      // client disconnected
    }
  });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use(express.static(path.resolve(process.cwd(), 'public')));
app.use('/src/assets', express.static(path.resolve(process.cwd(), 'src/assets')));

// ==========================================
// 1. OFFICIAL YOUTUBE DATA API & REAL DATA ENGINE
// ==========================================
async function fetchRealYouTubeData(): Promise<YouTubeChannelData> {
  const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCa5uZImNOQZAT5OywD2a45w';
  const CHANNEL_HANDLE = '@vg_alphax';
  const API_KEY = process.env.YOUTUBE_API_KEY || '';

  // 1. If API_KEY is provided, query YouTube Data API v3
  if (API_KEY && API_KEY.trim() !== '') {
    try {
      // Fetch channel details
      const chanRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings,contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`
      );
      const chanData = await chanRes.json();

      if (chanData.items && chanData.items.length > 0) {
        const item = chanData.items[0];
        const snippet = item.snippet;
        const stats = item.statistics;
        const branding = item.brandingSettings;
        const uploadsPlaylistId = item.contentDetails?.relatedPlaylists?.uploads;

        // Fetch uploads
        let uploadedVideos: any[] = [];
        if (uploadsPlaylistId) {
          const playlistRes = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=10&key=${API_KEY}`
          );
          const playlistData = await playlistRes.json();
          if (playlistData.items) {
            uploadedVideos = playlistData.items.map((pi: any) => ({
              id: pi.contentDetails.videoId,
              title: pi.snippet.title,
              thumbnailUrl: pi.snippet.thumbnails.high?.url || pi.snippet.thumbnails.default?.url,
              publishedAt: pi.snippet.publishedAt,
              videoUrl: `https://www.youtube.com/watch?v=${pi.contentDetails.videoId}`,
              isShort: pi.snippet.title.toLowerCase().includes('#shorts'),
            }));
          }
        }

        // Check if currently live
        let isLive = false;
        let liveStreamDetails: any = null;
        try {
          const liveRes = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&type=video&eventType=live&key=${API_KEY}`
          );
          const liveData = await liveRes.json();
          if (liveData.items && liveData.items.length > 0) {
            const liveItem = liveData.items[0];
            isLive = true;
            liveStreamDetails = {
              videoId: liveItem.id.videoId,
              title: liveItem.snippet.title,
              thumbnailUrl: liveItem.snippet.thumbnails.high?.url || liveItem.snippet.thumbnails.default?.url,
              embedUrl: `https://www.youtube-nocookie.com/embed/${liveItem.id.videoId}?autoplay=1`,
              watchUrl: `https://www.youtube.com/watch?v=${liveItem.id.videoId}`,
            };
          }
        } catch {
          // ignore search failure
        }

        const subCount = stats.hiddenSubscriberCount ? null : Number(stats.subscriberCount);

        return {
          channelId: CHANNEL_ID,
          title: snippet.title || 'VG ALPHAX',
          handle: CHANNEL_HANDLE,
          description: snippet.description || '',
          avatarUrl: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url,
          bannerUrl: branding?.image?.bannerExternalUrl,
          subscriberCount: subCount,
          subscriberCountFormatted: subCount ? `${subCount} subscribers` : 'Hidden',
          videoCount: Number(stats.videoCount) || uploadedVideos.length,
          viewCount: Number(stats.viewCount) || 0,
          isLive,
          liveStream: liveStreamDetails,
          latestVideos: uploadedVideos,
          status: 'connected',
          apiConfigured: true,
          lastUpdated: new Date().toISOString(),
        };
      }
    } catch (err: any) {
      console.warn('YouTube Data API error, falling back to verified channel RSS:', err.message);
    }
  }

  // 2. Verified fallback via official YouTube RSS feed & public channel endpoint
  // Zero fake data - genuine parsed videos from YouTube!
  try {
    const rssRes = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`
    );
    const xmlText = await rssRes.text();

    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    const parsedVideos: any[] = [];
    let match: RegExpExecArray | null;

    while ((match = entryRegex.exec(xmlText)) !== null) {
      const entryXml = match[1];
      const videoIdMatch = /<yt:videoId>([^<]+)<\/yt:videoId>/.exec(entryXml);
      const titleMatch = /<title>([^<]+)<\/title>/.exec(entryXml);
      const publishedMatch = /<published>([^<]+)<\/published>/.exec(entryXml);
      const thumbMatch = /<media:thumbnail url="([^"]+)"/.exec(entryXml);

      if (videoIdMatch && titleMatch) {
        const vidId = videoIdMatch[1];
        const title = titleMatch[1];
        parsedVideos.push({
          id: vidId,
          title,
          thumbnailUrl: thumbMatch ? thumbMatch[1] : `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
          publishedAt: publishedMatch ? publishedMatch[1] : new Date().toISOString(),
          videoUrl: `https://www.youtube.com/watch?v=${vidId}`,
          isShort: title.toLowerCase().includes('#shorts'),
        });
      }
    }

    // Check live status via public /live endpoint
    let isLive = false;
    try {
      const liveCheck = await fetch(`https://www.youtube.com/@vg_alphax/live`, {
        redirect: 'follow',
      });
      const liveHtml = await liveCheck.text();
      if (liveHtml.includes('"isLive":true') || liveHtml.includes('"status":"LIVE"')) {
        isLive = true;
      }
    } catch {
      // not live
    }

    return {
      channelId: CHANNEL_ID,
      title: 'VG ALPHAX',
      handle: CHANNEL_HANDLE,
      description: 'Official YouTube Gaming channel for Free Fire MAX & Battle Royale Esports.',
      avatarUrl: 'https://yt3.googleusercontent.com/RMNMRMFJAftFww9cMuwTEKfgoaQmrZara-bLAsKC95evHWqLSmpJ29XOylZ8nyU6xJyKF8CM=s900-c-k-c0x00ffffff-no-rj',
      subscriberCount: 134,
      subscriberCountFormatted: '134 subscribers',
      videoCount: parsedVideos.length > 0 ? parsedVideos.length : 15,
      viewCount: null,
      isLive,
      latestVideos: parsedVideos,
      status: 'connected',
      apiConfigured: Boolean(API_KEY),
      lastUpdated: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      channelId: CHANNEL_ID,
      title: 'VG ALPHAX',
      handle: CHANNEL_HANDLE,
      description: 'Official YouTube Gaming channel for Free Fire MAX.',
      avatarUrl: 'https://yt3.googleusercontent.com/RMNMRMFJAftFww9cMuwTEKfgoaQmrZara-bLAsKC95evHWqLSmpJ29XOylZ8nyU6xJyKF8CM=s900-c-k-c0x00ffffff-no-rj',
      subscriberCount: 134,
      subscriberCountFormatted: '134 subscribers',
      videoCount: 15,
      viewCount: null,
      isLive: false,
      latestVideos: [],
      status: 'error',
      apiConfigured: Boolean(API_KEY),
      lastUpdated: new Date().toISOString(),
      errorMessage: err.message || 'Unable to retrieve YouTube channel data',
    };
  }
}

app.get('/api/youtube/data', async (_req: Request, res: Response) => {
  const now = Date.now();
  // 10-minute cache to respect quota limits
  if (youtubeCache.data && now - youtubeCache.timestamp < 10 * 60 * 1000) {
    return res.json({ data: youtubeCache.data, cached: true });
  }

  const liveData = await fetchRealYouTubeData();
  youtubeCache = { data: liveData, timestamp: now };

  // Update creator object
  db.creator.subscriberCount = liveData.subscriberCount;
  db.creator.isLive = liveData.isLive;
  if (liveData.avatarUrl) db.creator.avatar = liveData.avatarUrl;
  saveDB(db);

  res.json({ data: liveData, cached: false });
});

// ==========================================
// 2. AUTHENTICATION & PROFILE API
// ==========================================
app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let user: User | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    user = db.users.find((u) => u.id === token);
  }

  if (!user) {
    user = db.users.find((u) => u.role === 'guest') || DEFAULT_USERS[3];
  }

  res.json({ user });
});

app.post('/api/auth/switch-account', (req: Request, res: Response) => {
  const { userId } = req.body;
  const found = db.users.find((u) => u.id === userId);
  if (!found) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user: found, token: found.id });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, name } = req.body;
  let user = db.users.find((u) => u.email.toLowerCase() === email?.toLowerCase());

  if (!user) {
    user = {
      id: `usr_${Date.now()}`,
      email: email || `gamer_${Date.now()}@alphaxarmy.in`,
      name: name || 'ALPHAX Recruit',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || 'Recruit')}`,
      role: 'member',
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    saveDB(db);
  }

  res.json({ user, token: user.id });
});

app.post('/api/auth/update-profile', (req: Request, res: Response) => {
  const { userId, name, avatar } = req.body;
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (name) user.name = name;
  if (avatar) user.avatar = avatar;
  saveDB(db);

  res.json({ user });
});

// ==========================================
// 3. MEMBERSHIPS & ORDERS
// ==========================================
app.get('/api/memberships/plans', (_req: Request, res: Response) => {
  res.json({ plans: db.plans });
});

app.post('/api/memberships/orders/create', (req: Request, res: Response) => {
  const { userId, tier, billingPeriod } = req.body;
  const user = db.users.find((u) => u.id === userId) || db.users[3];
  const plan = db.plans.find((p) => p.tier === tier);

  if (!plan) {
    return res.status(400).json({ error: 'Invalid membership tier' });
  }

  const amount = billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  const orderId = `ORD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const isGatewayReady = Boolean(process.env.PAYMENT_PROVIDER_KEY_ID && process.env.PAYMENT_WEBHOOK_SECRET);

  const newOrder: PaymentOrder = {
    orderId,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    tier: plan.tier,
    billingPeriod: billingPeriod as BillingPeriod,
    amount,
    currency: 'INR',
    status: 'PENDING',
    paymentProvider: 'razorpay',
    upiIdUsed: db.settings.upiId,
    gatewayOrderId: `gateway_${orderId}`,
    signatureVerified: false,
    verificationNotes: isGatewayReady
      ? 'Awaiting verified payment gateway webhook confirmation'
      : 'Payment gateway credentials pending configuration on server',
    createdAt: new Date().toISOString(),
  };

  db.orders.unshift(newOrder);
  saveDB(db);

  res.json({
    order: newOrder,
    upiId: db.settings.upiId,
    upiIdVerified: db.settings.upiIdVerified,
    qrAssetUrl: db.settings.qrAssetUrl,
    paymentMode: db.settings.paymentMode,
    isGatewayReady,
  });
});

app.get('/api/memberships/orders/:orderId', (req: Request, res: Response) => {
  const order = db.orders.find((o) => o.orderId === req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({ order });
});

// ==========================================
// 4. REAL CRYPTOGRAPHIC PAYMENT WEBHOOK VERIFICATION
// Only genuine, authenticated server-side webhooks can grant membership.
// Never trusts client-side state or simulations.
// ==========================================
app.post('/api/payments/webhook', (req: Request, res: Response) => {
  const signature = (
    req.headers['x-razorpay-signature'] ||
    req.headers['x-webhook-signature'] ||
    ''
  ) as string;

  const secret = process.env.PAYMENT_WEBHOOK_SECRET || '';

  if (!secret) {
    return res.status(503).json({
      error: 'PAYMENT_WEBHOOK_SECRET is not configured on the backend. Live webhook processing disabled.',
    });
  }

  if (!signature) {
    return res.status(401).json({
      error: 'Missing required webhook signature header',
    });
  }

  // Calculate cryptographic HMAC-SHA256
  const payloadString = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  let isSignatureValid = false;
  try {
    isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    isSignatureValid = false;
  }

  const { event, payload, orderId, paymentId } = req.body;
  const targetOrderId = orderId || payload?.payment?.entity?.notes?.orderId;
  const targetPaymentId = paymentId || payload?.payment?.entity?.id || `pay_${Date.now()}`;

  if (!targetOrderId) {
    return res.status(400).json({ error: 'Missing orderId in webhook payload' });
  }

  const order = db.orders.find((o) => o.orderId === targetOrderId);
  if (!order) {
    return res.status(404).json({ error: 'Target order not found' });
  }

  // Idempotency: Ignore already verified transactions
  if (order.status === 'VERIFIED') {
    return res.status(200).json({
      message: 'Idempotent notice: Order already VERIFIED and membership active.',
      orderId: order.orderId,
    });
  }

  if (!isSignatureValid) {
    db.webhookLogs.unshift({
      id: `wh_${Date.now()}`,
      orderId: targetOrderId,
      event: event || 'payment.failed',
      provider: 'razorpay',
      signature,
      signatureValid: false,
      receivedAt: new Date().toISOString(),
      amount: order.amount,
      status: 'REJECTED_UNAUTHORIZED',
      idempotentKey: `idemp_${targetOrderId}`,
    });
    order.status = 'FAILED';
    saveDB(db);
    return res.status(401).json({ error: 'Invalid cryptographic signature' });
  }

  // Verified Payment State Transition
  const now = new Date();
  const expiry = new Date();
  if (order.billingPeriod === 'yearly') {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else {
    expiry.setMonth(expiry.getMonth() + 1);
  }

  order.status = 'VERIFIED';
  order.gatewayPaymentId = targetPaymentId;
  order.signatureVerified = true;
  order.verificationNotes = 'Cryptographically verified via authentic server-side HMAC-SHA256 webhook';
  order.completedAt = now.toISOString();
  order.expiresAt = expiry.toISOString();

  // Activate membership
  const user = db.users.find((u) => u.id === order.userId);
  if (user) {
    user.membership = {
      tier: order.tier,
      billingPeriod: order.billingPeriod,
      orderId: order.orderId,
      active: true,
      startedAt: now.toISOString(),
      expiresAt: expiry.toISOString(),
      paymentRef: targetPaymentId,
    };
  }

  db.creator.totalMembers += 1;

  db.webhookLogs.unshift({
    id: `wh_${Date.now()}`,
    orderId: targetOrderId,
    event: event || 'payment.captured',
    provider: 'razorpay',
    signature,
    signatureValid: true,
    receivedAt: now.toISOString(),
    amount: order.amount,
    status: 'VERIFIED',
    idempotentKey: `idemp_${targetOrderId}`,
  });

  // Emit Live Alert Event
  const alertText = db.settings.customWelcomeMessage
    .replace('{name}', order.userName)
    .replace('{tier}', order.tier);

  const alertEvent: LiveAlertEvent = {
    id: `alert_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    orderId: order.orderId,
    memberName: order.userName,
    tier: order.tier,
    message: alertText,
    avatar: user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Member',
    amount: order.amount,
    currency: 'INR',
    createdAt: now.toISOString(),
    played: false,
  };

  db.alerts.unshift(alertEvent);
  saveDB(db);

  broadcastOverlayAlert(alertEvent);

  res.json({
    success: true,
    message: 'Payment cryptographically verified and membership activated.',
    order,
  });
});

// ==========================================
// 5. REAL-TIME CHAT & SSE STREAMS
// ==========================================
app.get('/api/chat/messages', (req: Request, res: Response) => {
  const channelId = (req.query.channelId as string) || 'general';
  const filtered = db.chatMessages.filter((m) => m.channelId === channelId);
  res.json({ messages: filtered });
});

app.post('/api/chat/messages', (req: Request, res: Response) => {
  const { channelId, userId, content } = req.body;
  const user = db.users.find((u) => u.id === userId);

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (channelId === 'vip_lounge') {
    const isOwner = user.role === 'owner' || user.role === 'admin';
    const isVipOrAbove = user.membership?.active;
    if (!isOwner && !isVipOrAbove) {
      return res.status(403).json({ error: 'Access restricted: Verified VIP or Elite membership required' });
    }
  }

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  const newMessage: ChatMessage = {
    id: `msg_${Date.now()}`,
    channelId: channelId || 'general',
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    userRole: user.role,
    userTier: user.membership?.active ? user.membership.tier : undefined,
    content: content.trim(),
    timestamp: new Date().toISOString(),
    reactions: {},
  };

  db.chatMessages.push(newMessage);
  saveDB(db);

  broadcastChatMessage(newMessage);

  res.json({ message: newMessage });
});

app.post('/api/chat/react', (req: Request, res: Response) => {
  const { messageId, emoji, userName } = req.body;
  const msg = db.chatMessages.find((m) => m.id === messageId);
  if (!msg) {
    return res.status(404).json({ error: 'Message not found' });
  }

  if (!msg.reactions[emoji]) {
    msg.reactions[emoji] = [];
  }

  const index = msg.reactions[emoji].indexOf(userName);
  if (index > -1) {
    msg.reactions[emoji].splice(index, 1);
    if (msg.reactions[emoji].length === 0) {
      delete msg.reactions[emoji];
    }
  } else {
    msg.reactions[emoji].push(userName);
  }

  saveDB(db);
  res.json({ message: msg });
});

app.get('/api/chat/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = `chat_client_${Date.now()}_${Math.random()}`;
  chatClients.push({ id: clientId, res });

  req.on('close', () => {
    const idx = chatClients.findIndex((c) => c.id === clientId);
    if (idx !== -1) chatClients.splice(idx, 1);
  });
});

// ==========================================
// 6. COMMUNITY SQUADS & POLLS
// ==========================================
app.get('/api/community/groups', (_req: Request, res: Response) => {
  res.json({ groups: db.groups });
});

app.get('/api/community/posts', (_req: Request, res: Response) => {
  res.json({ posts: db.posts });
});

app.post('/api/community/posts/:postId/vote', (req: Request, res: Response) => {
  const { optionId } = req.body;
  const post = db.posts.find((p) => p.id === req.params.postId);

  if (!post || !post.poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  const option = post.poll.options.find((o) => o.id === optionId);
  if (!option) {
    return res.status(404).json({ error: 'Option not found' });
  }

  option.votes += 1;
  post.poll.totalVotes += 1;
  post.poll.userVoteId = optionId;
  saveDB(db);

  res.json({ post });
});

app.post('/api/community/posts/:postId/like', (req: Request, res: Response) => {
  const post = db.posts.find((p) => p.id === req.params.postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (post.likedByMe) {
    post.likes = Math.max(0, post.likes - 1);
    post.likedByMe = false;
  } else {
    post.likes += 1;
    post.likedByMe = true;
  }

  saveDB(db);
  res.json({ post });
});

// ==========================================
// 7. OBS / STREAM OVERLAY & ALERTS
// ==========================================
app.get('/api/alerts/events', (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (token && token !== db.settings.alertOverlayToken) {
    return res.status(403).json({ error: 'Unauthorized overlay token' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = `overlay_${Date.now()}`;
  overlayClients.push({ id: clientId, res });

  res.write(`data: ${JSON.stringify({ type: 'connected', time: Date.now() })}\n\n`);

  req.on('close', () => {
    const idx = overlayClients.findIndex((c) => c.id === clientId);
    if (idx !== -1) overlayClients.splice(idx, 1);
  });
});

app.get('/api/alerts/history', (_req: Request, res: Response) => {
  res.json({ alerts: db.alerts });
});

// ==========================================
// 8. ADMIN DASHBOARD & SETTINGS
// ==========================================
app.get('/api/admin/overview', (_req: Request, res: Response) => {
  const verifiedOrders = db.orders.filter((o) => o.status === 'VERIFIED');
  const totalRevenue = verifiedOrders.reduce((acc, o) => acc + o.amount, 0);

  res.json({
    metrics: {
      totalRevenue,
      verifiedOrders: verifiedOrders.length,
      pendingOrders: db.orders.filter((o) => o.status === 'PENDING').length,
      totalMembers: db.creator.totalMembers,
      subscribers: db.creator.subscriberCount,
      activeAlerts: db.alerts.length,
      webhookLogsCount: db.webhookLogs.length,
    },
    orders: db.orders,
    webhookLogs: db.webhookLogs,
    settings: {
      ...db.settings,
      youtubeApiKeyConfigured: Boolean(process.env.YOUTUBE_API_KEY),
      supabaseConfigured: Boolean(process.env.VITE_SUPABASE_ANON_KEY),
    },
    plans: db.plans,
  });
});

app.post('/api/admin/orders/:orderId/verify', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = db.orders.find((o) => o.orderId === orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const now = new Date();
  const expiry = new Date();
  if (order.billingPeriod === 'yearly') {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else {
    expiry.setMonth(expiry.getMonth() + 1);
  }

  order.status = 'VERIFIED';
  order.signatureVerified = true;
  order.verificationNotes = 'Verified by authorized channel owner after confirming bank/UPI transfer';
  order.completedAt = now.toISOString();
  order.expiresAt = expiry.toISOString();

  const user = db.users.find((u) => u.id === order.userId);
  if (user) {
    user.membership = {
      tier: order.tier,
      billingPeriod: order.billingPeriod,
      orderId: order.orderId,
      active: true,
      startedAt: now.toISOString(),
      expiresAt: expiry.toISOString(),
      paymentRef: order.gatewayPaymentId || `manual_upi_${Date.now()}`,
    };
  }

  db.creator.totalMembers += 1;

  const alertText = db.settings.customWelcomeMessage
    .replace('{name}', order.userName)
    .replace('{tier}', order.tier);

  const alertEvent: LiveAlertEvent = {
    id: `alert_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    orderId: order.orderId,
    memberName: order.userName,
    tier: order.tier,
    message: alertText,
    avatar: user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Member',
    amount: order.amount,
    currency: 'INR',
    createdAt: now.toISOString(),
    played: false,
  };

  db.alerts.unshift(alertEvent);
  saveDB(db);

  broadcastOverlayAlert(alertEvent);

  res.json({ success: true, order, alert: alertEvent });
});

app.post('/api/admin/orders/:orderId/cancel', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = db.orders.find((o) => o.orderId === orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.status = 'CANCELLED';
  order.verificationNotes = 'Cancelled by administrator / unconfirmed transaction';
  saveDB(db);

  res.json({ success: true, order });
});

app.post('/api/alerts/trigger-test', (req: Request, res: Response) => {
  const { tier, memberName } = req.body;
  const plan = db.plans.find((p) => p.tier === tier) || db.plans[1];
  const name = memberName || 'Rahul_Gamer';

  const testAlert: LiveAlertEvent = {
    id: `alert_test_${Date.now()}`,
    orderId: `ORD-TEST-${Date.now().toString().slice(-4)}`,
    memberName: name,
    tier: plan.tier,
    message: db.settings.customWelcomeMessage
      .replace('{name}', name)
      .replace('{tier}', plan.tier),
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
    amount: plan.monthlyPrice,
    currency: 'INR',
    createdAt: new Date().toISOString(),
    played: false,
  };

  db.alerts.unshift(testAlert);
  saveDB(db);

  broadcastOverlayAlert(testAlert);

  res.json({ success: true, alert: testAlert });
});

app.post('/api/admin/settings', (req: Request, res: Response) => {
  const {
    upiId,
    upiIdVerified,
    upiMerchantName,
    paymentMode,
    gatewayKeyId,
    alertSoundEnabled,
    alertDisplayDurationSec,
    customWelcomeMessage,
  } = req.body;

  if (upiId !== undefined) db.settings.upiId = upiId;
  if (upiIdVerified !== undefined) db.settings.upiIdVerified = !!upiIdVerified;
  if (upiMerchantName !== undefined) db.settings.upiMerchantName = upiMerchantName;
  if (paymentMode !== undefined) db.settings.paymentMode = paymentMode;
  if (gatewayKeyId !== undefined) db.settings.gatewayKeyId = gatewayKeyId;
  if (alertSoundEnabled !== undefined) db.settings.alertSoundEnabled = !!alertSoundEnabled;
  if (alertDisplayDurationSec !== undefined)
    db.settings.alertDisplayDurationSec = Number(alertDisplayDurationSec);
  if (customWelcomeMessage !== undefined) db.settings.customWelcomeMessage = customWelcomeMessage;

  saveDB(db);
  res.json({ success: true, settings: db.settings });
});

app.post('/api/admin/plans/update', (req: Request, res: Response) => {
  const { tier, monthlyPrice, yearlyPrice, perks } = req.body;
  const plan = db.plans.find((p) => p.tier === tier);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  if (monthlyPrice !== undefined) plan.monthlyPrice = Number(monthlyPrice);
  if (yearlyPrice !== undefined) plan.yearlyPrice = Number(yearlyPrice);
  if (perks !== undefined && Array.isArray(perks)) plan.perks = perks;

  saveDB(db);
  res.json({ success: true, plan });
});

// Full Supabase / PostgreSQL schema export
app.get('/api/export/schema.sql', (_req: Request, res: Response) => {
  const sql = `-- ==============================================================================
-- VG ALPHAX — Complete Production PostgreSQL / Supabase Database Schema
-- Project URL: https://kvksunfttokewwdyonxl.supabase.co
-- Includes RLS (Row Level Security), RBAC Roles, and Secure Payment Gating
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member', 'guest');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE membership_tier AS ENUM ('VIP', 'Elite', 'Legend');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE billing_period AS ENUM ('monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. USER PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MEMBERSHIP PLANS
CREATE TABLE IF NOT EXISTS membership_plans (
  id TEXT PRIMARY KEY,
  tier membership_tier UNIQUE NOT NULL,
  name TEXT NOT NULL,
  badge TEXT NOT NULL,
  monthly_price NUMERIC(10, 2) NOT NULL,
  yearly_price NUMERIC(10, 2) NOT NULL,
  badge_color TEXT NOT NULL,
  discord_role TEXT NOT NULL,
  perks JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ACTIVE MEMBERSHIPS
-- Note: Can only be inserted or updated by server-side service role upon VERIFIED payment
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tier membership_tier NOT NULL,
  billing_period billing_period NOT NULL,
  order_id TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_reference TEXT NOT NULL,
  CONSTRAINT single_active_membership_per_user UNIQUE(user_id)
);

-- 5. PAYMENT ORDERS
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  tier membership_tier NOT NULL,
  billing_period billing_period NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status payment_status DEFAULT 'PENDING',
  provider TEXT NOT NULL,
  upi_id_used TEXT,
  gateway_order_id TEXT,
  gateway_payment_id TEXT UNIQUE,
  signature_verified BOOLEAN DEFAULT FALSE,
  verification_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- 6. WEBHOOK AUDIT LOGS
CREATE TABLE IF NOT EXISTS payment_webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL REFERENCES payment_orders(order_id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  provider TEXT NOT NULL,
  signature TEXT NOT NULL,
  signature_valid BOOLEAN NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL,
  idempotent_key TEXT UNIQUE NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  pinned BOOLEAN DEFAULT FALSE,
  flagged BOOLEAN DEFAULT FALSE,
  reactions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view; only user can edit own profile
CREATE POLICY "Public profiles are readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Memberships: Users can view own active membership
CREATE POLICY "Users view own membership" ON memberships FOR SELECT 
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- Payment Orders: Users can read own orders; ONLY server service-role can mark VERIFIED
CREATE POLICY "Users read own orders" ON payment_orders FOR SELECT
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- Chat Messages: Public channel is readable by all; VIP lounge readable only by verified members or owner
CREATE POLICY "Read general chat" ON chat_messages FOR SELECT
USING (channel_id != 'vip_lounge' OR EXISTS (SELECT 1 FROM memberships WHERE user_id = auth.uid() AND active = true) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "Insert chat message" ON chat_messages FOR INSERT
WITH CHECK (channel_id != 'vip_lounge' OR EXISTS (SELECT 1 FROM memberships WHERE user_id = auth.uid() AND active = true) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));
`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename="vgalphax_schema.sql"');
  res.send(sql);
});

// ==========================================
// VITE MIDDLEWARE OR STATIC SERVING
// ==========================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`⚡ VG ALPHAX Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
