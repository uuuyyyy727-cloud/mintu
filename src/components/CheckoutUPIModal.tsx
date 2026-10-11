import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  User, 
  MembershipPlan, 
  PaymentOrder, 
  MembershipTierName, 
  BillingPeriod, 
  AppSettings 
} from '../types';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  ShieldAlert, 
  ShieldCheck, 
  ExternalLink, 
  Sparkles, 
  Smartphone, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  Clock
} from 'lucide-react';
import { playAlertFanfareSound } from '../utils/audio';
import { INITIAL_PLANS } from '../constants';
import QRCode from 'qrcode';

interface CheckoutUPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: MembershipTierName;
  billingPeriod: BillingPeriod;
  plans: MembershipPlan[];
  currentUser: User;
  settings: AppSettings;
  onSuccess: (order: PaymentOrder) => void;
}

export const CheckoutUPIModal: React.FC<CheckoutUPIModalProps> = ({
  isOpen,
  onClose,
  tier,
  billingPeriod,
  plans,
  currentUser,
  settings,
  onSuccess,
}) => {
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [pollInterval, setPollInterval] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGatewayReady, setIsGatewayReady] = useState<boolean>(false);
  const [dynamicQrDataUrl, setDynamicQrDataUrl] = useState<string | null>(null);
  const [qrMode, setQrMode] = useState<'official' | 'dynamic'>('official');

  const availablePlans = (plans && Array.isArray(plans) && plans.length > 0) ? plans : INITIAL_PLANS;
  const selectedPlan = availablePlans.find((p) => p && p.tier === tier) || availablePlans[0] || INITIAL_PLANS[0];
  const monthlyPrice = selectedPlan?.monthlyPrice ?? (tier === 'VIP' ? 99 : tier === 'Elite' ? 299 : 799);
  const yearlyPrice = selectedPlan?.yearlyPrice ?? (tier === 'VIP' ? 999 : tier === 'Elite' ? 2999 : 7999);
  const amount = billingPeriod === 'yearly' ? yearlyPrice : monthlyPrice;
  const planBadge = selectedPlan?.badge || (tier === 'VIP' ? '👑 VIP' : tier === 'Elite' ? '⚡ ELITE' : '🔥 LEGEND');
  const planName = selectedPlan?.name || `${tier} Member`;

  // Initialize pending order on backend when modal opens
  useEffect(() => {
    if (!isOpen) {
      setOrder(null);
      if (pollInterval) clearInterval(pollInterval);
      return;
    }

    async function createOrder() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await fetch('/api/memberships/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            tier,
            billingPeriod,
          }),
        });
        const data = await res.json();
        if (data.order) {
          setOrder(data.order);
          setIsGatewayReady(Boolean(data.isGatewayReady));
        } else {
          setErrorMessage(data.error || 'Failed to initialize order on server');
        }
      } catch {
        setErrorMessage('Network connection error while initializing order');
      } finally {
        setLoading(false);
      }
    }

    createOrder();
  }, [isOpen, tier, billingPeriod, currentUser.id]);

  // Polling for server-side payment verification (webhook confirmation)
  useEffect(() => {
    if (!order || order.status === 'VERIFIED') return;

    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/memberships/orders/${order.orderId}`);
        const data = await res.json();
        if (data.order && data.order.status === 'VERIFIED') {
          setOrder(data.order);
          clearInterval(interval);
          triggerSuccessFlow(data.order);
        }
      } catch (err) {
        console.error('Order status poll error', err);
      }
    }, 3000);

    setPollInterval(interval);

    return () => clearInterval(interval);
  }, [order?.orderId]);

  function triggerSuccessFlow(completedOrder: PaymentOrder) {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#38bdf8', '#eab308', '#ffffff'],
      });
      playAlertFanfareSound();
    } catch {
      // ignore
    }
    onSuccess(completedOrder);
  }

  function handleCopyUpi() {
    if (!settings.upiId) return;
    navigator.clipboard.writeText(settings.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  }

  function handleCopyOrderId() {
    if (!order?.orderId) return;
    navigator.clipboard.writeText(order.orderId);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2000);
  }

  // Generate dynamic QR code with exact pre-filled amount when order exists
  useEffect(() => {
    if (!settings.upiId || !order) return;
    const uri = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
      settings.upiMerchantName || 'VG ALPHAX Gaming'
    )}&am=${amount}&cu=INR&tn=${encodeURIComponent(
      `ALPHAX ${tier} Plan Order ${order.orderId}`
    )}`;

    QRCode.toDataURL(uri, {
      width: 320,
      margin: 2,
      color: {
        dark: '#050814',
        light: '#ffffff',
      },
    })
      .then((url) => setDynamicQrDataUrl(url))
      .catch((err) => console.error('Error generating dynamic UPI QR', err));
  }, [settings.upiId, settings.upiMerchantName, order?.orderId, amount, tier]);

  if (!isOpen) return null;

  // Generate UPI Deep Link only after verified UPI ID and parameters exist
  const upiIntentUri = settings.upiIdVerified && settings.upiId && order
    ? `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
        settings.upiMerchantName || 'VG ALPHAX Gaming'
      )}&am=${amount}&cu=INR&tn=${encodeURIComponent(
        `ALPHAX ${tier} Plan Order ${order.orderId}`
      )}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-xl bg-[#090e21] border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Top Header */}
        <div className="bg-[#0e162f] px-5 py-4 border-b border-purple-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-sm">
              👑
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-['Outfit']">
                Complete Membership Checkout
              </h3>
              <p className="text-[11px] text-slate-400">
                Official ALPHAX Army Membership Activation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6">

          {/* Plan Summary Bar */}
          <div className="bg-[#060a17] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-400 font-mono">
                  {planBadge}
                </span>
                <span className="text-sm font-extrabold text-white">
                  {planName}
                </span>
              </div>
              <p className="text-xs text-slate-400 capitalize">
                Billed {billingPeriod} · Verified Gateway Activation
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-white font-['Outfit'] tabular-nums">
                ₹{amount}
              </div>
              <span className="text-[10px] text-slate-400">INR Incl. Taxes</span>
            </div>
          </div>

          {/* If Order Completed Successfully */}
          {order?.status === 'VERIFIED' ? (
            <div className="py-6 text-center space-y-4 bg-emerald-950/20 border border-emerald-500/40 rounded-2xl p-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-white font-['Outfit']">
                  PAYMENT VERIFIED! WELCOME TO THE ARMY!
                </h4>
                <p className="text-xs text-emerald-300">
                  Your <strong className="text-white">{tier} Membership</strong> is now active.
                </p>
              </div>

              <div className="bg-[#050814] rounded-xl p-3 text-xs text-slate-300 font-mono space-y-1 text-left max-w-sm mx-auto border border-slate-800">
                <div>Order ID: <span className="text-purple-300">{order.orderId}</span></div>
                <div>Status: <span className="text-emerald-400 font-bold">VERIFIED</span></div>
                <div>Activation: <span className="text-slate-400">{new Date(order.completedAt || '').toLocaleString()}</span></div>
                <div>Expiry: <span className="text-cyan-400">{new Date(order.expiresAt || '').toLocaleDateString()}</span></div>
              </div>

              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                A live celebration alert event was sent to VG ALPHAX's streaming overlay!
              </p>

              <button
                onClick={onClose}
                className="w-full py-3 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl"
              >
                Access Member Lounge &amp; Badges
              </button>
            </div>
          ) : (
            <>
              {/* Order Metadata Strip */}
              {order && (
                <div className="grid grid-cols-2 gap-2 text-xs bg-[#060a17] p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block">UNIQUE ORDER ID</span>
                    <div className="flex items-center gap-1.5 font-mono text-purple-300 font-bold">
                      <span className="truncate">{order.orderId}</span>
                      <button 
                        onClick={handleCopyOrderId} 
                        className="text-slate-400 hover:text-white"
                        title="Copy Order ID"
                      >
                        {copiedOrderId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">PAYMENT STATUS</span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      {order.status}
                    </span>
                  </div>
                </div>
              )}

              {/* UPI QR Code Display Asset (Preserved, uncropped PhonePe QR or Pre-filled Amount QR) */}
              <div className="bg-[#050814] rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-col items-center text-center space-y-4">
                
                {/* QR Code View Selector */}
                <div className="flex items-center gap-1.5 p-1 bg-[#0b1021] border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setQrMode('official')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      qrMode === 'official'
                        ? 'bg-purple-600 text-white shadow-sm font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Official PhonePe QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrMode('dynamic')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      qrMode === 'dynamic'
                        ? 'bg-purple-600 text-white shadow-sm font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Amount QR (₹{amount})
                  </button>
                </div>

                {/* QR Code Graphic Container */}
                <div className="relative p-2.5 bg-white rounded-xl shadow-xl max-w-[240px] sm:max-w-[260px] aspect-square flex items-center justify-center">
                  <img
                    src={qrMode === 'dynamic' && dynamicQrDataUrl ? dynamicQrDataUrl : (settings.qrAssetUrl || '/vgalphax-upi-qr.svg')}
                    alt="Official PhonePe UPI QR Code for vgalphax@axl"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* QR Actions: Download & Verified Status */}
                <div className="flex items-center gap-2">
                  <a
                    href={qrMode === 'dynamic' && dynamicQrDataUrl ? dynamicQrDataUrl : (settings.qrAssetUrl || '/vgalphax-upi-qr.svg')}
                    download={qrMode === 'dynamic' ? `VG_ALPHAX_Order_${amount}_QR.png` : "VG_ALPHAX_PhonePe_QR.svg"}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#0e162f] border border-slate-700 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    Download QR
                  </a>

                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified VPA (PhonePe)
                  </span>
                </div>

                {/* UPI ID Field with Copy Button */}
                <div className="w-full max-w-sm space-y-1.5 text-left">
                  <label className="text-[11px] text-slate-400 font-semibold block">
                    CHANNEL OWNER OFFICIAL UPI ID:
                  </label>
                  <div className="flex items-center gap-2 bg-[#0e162f] border border-slate-700 rounded-xl px-3 py-2">
                    <span className="font-mono text-xs text-slate-200 select-all flex-1 truncate">
                      {settings.upiId || 'vgalphax@axl'}
                    </span>
                    <button
                      onClick={handleCopyUpi}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors flex items-center gap-1 shrink-0"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy UPI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Mobile Intent Direct Button */}
                {upiIntentUri && (
                  <div className="w-full max-w-sm pt-1">
                    <a
                      href={upiIntentUri}
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Open UPI App (PhonePe / GPay / Paytm)</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Strict Security & Verification Protocol Details */}
              <div className="bg-[#0b1021] border border-purple-900/40 rounded-xl p-4 text-xs text-slate-300 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Real Payment Verification Protocol</span>
                </div>
                <div className="text-[11px] leading-relaxed text-slate-400 space-y-1.5">
                  <p>
                    1. <strong>Strict Backend Verification:</strong> In accordance with payment security policies, scanning a personal QR code alone cannot automatically confirm a payment without an authenticated server-side gateway webhook.
                  </p>
                  <p>
                    2. <strong>Zero Client-Side Trust:</strong> Neither screenshot submissions, URL parameters, nor client-side flags can activate paid memberships. Only genuine server-side HMAC-SHA256 verified webhooks or authorized admin verification can mark orders <span className="text-emerald-400 font-bold">VERIFIED</span>.
                  </p>
                  <p>
                    3. <strong>Security:</strong> Never enter your banking UPI PIN or OTP on this website. Payments take place solely inside your secure UPI banking application.
                  </p>
                </div>

                {/* Gateway Integration Status Banner */}
                <div className="pt-2 border-t border-slate-800">
                  {isGatewayReady ? (
                    <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Server Webhook Listener: <strong>ACTIVE</strong> (Awaiting gateway payment notification)</span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Automatic Verification Awaiting Gateway Secret</span>
                      </div>
                      <p className="text-slate-400">
                        Live automated verification requires configuring your payment gateway webhook secret (<code className="text-amber-300">PAYMENT_WEBHOOK_SECRET</code>) in <code className="text-slate-300">.env</code>. Direct transfers to <strong className="text-slate-200">{settings.upiId}</strong> remain in <strong className="text-amber-400">PENDING</strong> status until verified.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-xs text-red-300">
                  {errorMessage}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};
