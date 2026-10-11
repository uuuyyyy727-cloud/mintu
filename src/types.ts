export type Role = 'owner' | 'admin' | 'member' | 'guest';

export type MembershipTierName = 'VIP' | 'Elite' | 'Legend';
export type BillingPeriod = 'monthly' | 'yearly';

export interface MembershipPlan {
  id: string;
  tier: MembershipTierName;
  name: string;
  badge: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  badgeColor: string;
  accentGlow: string;
  perks: string[];
  popular?: boolean;
  discordRole: string;
  chatBadge: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: Role;
  membership?: {
    tier: MembershipTierName;
    billingPeriod: BillingPeriod;
    orderId: string;
    active: boolean;
    startedAt: string;
    expiresAt: string;
    paymentRef: string;
  };
  createdAt: string;
}

export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'CANCELLED';

export interface PaymentOrder {
  orderId: string;
  userId: string;
  userName: string;
  userEmail: string;
  tier: MembershipTierName;
  billingPeriod: BillingPeriod;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentProvider: 'razorpay' | 'cashfree' | 'upi_gateway';
  upiIdUsed: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  signatureVerified: boolean;
  verificationNotes?: string;
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
}

export interface PaymentWebhookLog {
  id: string;
  orderId: string;
  event: string;
  provider: string;
  signature: string;
  signatureValid: boolean;
  receivedAt: string;
  amount: number;
  status: string;
  idempotentKey: string;
}

export interface LiveAlertEvent {
  id: string;
  orderId: string;
  memberName: string;
  tier: MembershipTierName;
  message: string;
  avatar: string;
  amount: number;
  currency: string;
  createdAt: string;
  played: boolean;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRole: Role;
  userTier?: MembershipTierName;
  content: string;
  timestamp: string;
  pinned?: boolean;
  flagged?: boolean;
  reactions: Record<string, string[]>; // emoji -> array of userNames
}

export interface CommunityGroup {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  minTier?: MembershipTierName;
  isPrivate: boolean;
  memberCount: number;
  iconName: string;
  lastActive: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorRole: Role;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  likes: number;
  commentsCount: number;
  likedByMe?: boolean;
  isMemberOnly: boolean;
  minTier?: MembershipTierName;
  poll?: {
    question: string;
    options: PollOption[];
    totalVotes: number;
    userVoteId?: string;
  };
}

export interface VideoItem {
  id: string;
  title: string;
  youtubeId: string;
  duration: string;
  views: string;
  publishedAt: string;
  category: string;
  isExclusive?: boolean;
  minTier?: MembershipTierName;
  thumbnailUrl?: string;
  videoUrl?: string;
}

export interface CreatorProfile {
  name: string;
  brand: string;
  avatar: string;
  bannerImage: string;
  bio: string;
  isLive: boolean;
  liveStreamId?: string;
  liveStreamTitle?: string;
  liveViewerCount?: number;
  subscriberCount: number | null;
  totalMembers: number;
  discordInviteUrl: string;
  youtubeChannelUrl: string;
  instagramUrl: string;
}

export interface YouTubeChannelData {
  channelId: string;
  title: string;
  handle: string;
  description: string;
  avatarUrl: string;
  bannerUrl?: string;
  subscriberCount: number | null;
  subscriberCountFormatted?: string;
  videoCount: number | null;
  viewCount?: number | null;
  isLive: boolean;
  liveStream?: {
    videoId: string;
    title: string;
    thumbnailUrl: string;
    viewerCount?: number;
    embedUrl: string;
    watchUrl: string;
  };
  latestVideos: {
    id: string;
    title: string;
    thumbnailUrl: string;
    publishedAt: string;
    videoUrl: string;
    isShort?: boolean;
  }[];
  status: 'connected' | 'not_configured' | 'error';
  apiConfigured: boolean;
  lastUpdated: string;
  errorMessage?: string;
}

export interface AppSettings {
  upiId: string;
  upiIdVerified: boolean;
  upiMerchantName: string;
  qrAssetUrl: string;
  paymentMode: 'test' | 'live';
  gatewayKeyId: string;
  gatewaySecretConfigured: boolean;
  webhookSecretConfigured: boolean;
  alertOverlayToken: string;
  alertDisplayDurationSec: number;
  alertSoundEnabled: boolean;
  customWelcomeMessage: string;
  youtubeApiKeyConfigured?: boolean;
  supabaseConfigured?: boolean;
}
