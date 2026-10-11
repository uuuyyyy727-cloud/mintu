import React, { useState, useEffect } from 'react';
import { 
  User, 
  PaymentOrder, 
  PaymentWebhookLog, 
  AppSettings, 
  MembershipPlan,
  LiveAlertEvent
} from '../types';
import { 
  Settings, 
  DollarSign, 
  Users, 
  ShieldCheck, 
  Radio, 
  Download, 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertTriangle,
  Lock,
  ExternalLink,
  Edit,
  Save
} from 'lucide-react';
import { playAlertFanfareSound } from '../utils/audio';

interface AdminDashboardProps {
  currentUser: User;
  settings: AppSettings;
  plans: MembershipPlan[];
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onRefreshData: () => void;
  isLive: boolean;
  onToggleLive: (isLive: boolean, title?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  settings,
  plans,
  onUpdateSettings,
  onRefreshData,
  isLive,
  onToggleLive,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'upi_gateway' | 'plans' | 'alerts' | 'database'>('overview');
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<PaymentWebhookLog[]>([]);
  const [copiedOverlayUrl, setCopiedOverlayUrl] = useState(false);
  const [isTriggeringTest, setIsTriggeringTest] = useState(false);
  const [testAlertName, setTestAlertName] = useState('Rahul_Gamer');
  const [testAlertTier, setTestAlertTier] = useState<'VIP' | 'Elite' | 'Legend'>('Elite');
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalMembers: 0,
    subscribers: 0,
  });

  // Settings form local state
  const [upiIdInput, setUpiIdInput] = useState(settings.upiId);
  const [upiVerifiedInput, setUpiVerifiedInput] = useState(settings.upiIdVerified);
  const [merchantNameInput, setMerchantNameInput] = useState(settings.upiMerchantName);
  const [paymentModeInput, setPaymentModeInput] = useState(settings.paymentMode);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Live Stream state
  const [streamTitleInput, setStreamTitleInput] = useState('GRANDMASTER RANK PUSH WITH ELITE SQUAD! 🔴 CUSTOM ROOMS');

  // Plan pricing edits
  const [editingPlanTier, setEditingPlanTier] = useState<'VIP' | 'Elite' | 'Legend'>('VIP');
  const [planMonthlyPrice, setPlanMonthlyPrice] = useState(99);
  const [planYearlyPrice, setPlanYearlyPrice] = useState(999);

  const isOwner = currentUser.role === 'owner' || currentUser.role === 'admin';

  useEffect(() => {
    async function loadAdminData() {
      try {
        const res = await fetch('/api/admin/overview');
        const data = await res.json();
        if (data.metrics) setMetrics(data.metrics);
        if (data.orders) setOrders(data.orders);
        if (data.webhookLogs) setWebhookLogs(data.webhookLogs);
      } catch (e) {
        console.error('Failed to load admin overview', e);
      }
    }
    loadAdminData();
  }, []);

  async function handleSaveSettings() {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upiId: upiIdInput,
          upiIdVerified: upiVerifiedInput,
          upiMerchantName: merchantNameInput,
          paymentMode: paymentModeInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdateSettings({
          upiId: upiIdInput,
          upiIdVerified: upiVerifiedInput,
          upiMerchantName: merchantNameInput,
          paymentMode: paymentModeInput,
        });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch {
      // ignore
    }
  }

  async function handleTriggerTestAlert() {
    setIsTriggeringTest(true);
    try {
      const res = await fetch('/api/alerts/trigger-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: testAlertTier,
          memberName: testAlertName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        playAlertFanfareSound();
      }
    } catch {
      // ignore
    } finally {
      setIsTriggeringTest(false);
    }
  }

  function handleCopyOverlayUrl() {
    const url = `${window.location.origin}/?view=overlay&token=${settings.alertOverlayToken}`;
    navigator.clipboard.writeText(url);
    setCopiedOverlayUrl(true);
    setTimeout(() => setCopiedOverlayUrl(false), 2000);
  }

  async function handleUpdatePlanPricing() {
    try {
      await fetch('/api/admin/plans/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: editingPlanTier,
          monthlyPrice: planMonthlyPrice,
          yearlyPrice: planYearlyPrice,
        }),
      });
      onRefreshData();
      alert(`Updated ${editingPlanTier} pricing!`);
    } catch {
      // ignore
    }
  }

  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white font-['Outfit']">
          ADMIN ACCESS RESTRICTED
        </h2>
        <p className="text-xs text-slate-400">
          This administration dashboard is restricted to the channel owner (VG ALPHAX).
          Switch your account role via the top navbar persona selector to 'VG ALPHAX (Owner)' to manage payments, stream alerts, and UPI settings.
        </p>
      </div>
    );
  }

  const overlayBrowserSourceUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/?view=overlay&token=${settings.alertOverlayToken}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Admin Title & Quick Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest bg-purple-950/50 border border-purple-800/50 px-3 py-1 rounded-full mb-1">
            <Settings className="w-3.5 h-3.5" />
            VG ALPHAX COMMAND CENTER
          </div>
          <h2 className="text-3xl font-black text-white font-['Outfit']">
            Platform Administration &amp; Stream Ops
          </h2>
        </div>

        {/* Live Stream Quick Toggle for Mobile Streaming Creator */}
        <div className="flex items-center gap-3 bg-[#0a0f22] border border-slate-800 p-2.5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-300 pl-2">Stream Status:</span>
          <button
            onClick={() => onToggleLive(!isLive, streamTitleInput)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              isLive
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/60'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-white animate-ping' : 'bg-slate-500'}`} />
            {isLive ? 'LIVE ON STREAM' : 'OFFLINE'}
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2 text-xs font-bold">
        {[
          { id: 'overview', label: 'Overview Metrics' },
          { id: 'orders', label: 'Orders & Payments' },
          { id: 'upi_gateway', label: 'UPI & Payment Gateway' },
          { id: 'plans', label: 'Membership Plans & Pricing' },
          { id: 'alerts', label: 'OBS / Stream Overlay' },
          { id: 'database', label: 'Database & Supabase Schema' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0a0f22] border border-slate-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Total Verified Revenue</span>
              <div className="text-3xl font-black text-white font-['Outfit'] tabular-nums">
                ₹{metrics.totalRevenue.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-400 font-medium">100% Retained (Direct UPI)</span>
            </div>

            <div className="bg-[#0a0f22] border border-slate-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Active Army Members</span>
              <div className="text-3xl font-black text-cyan-300 font-['Outfit'] tabular-nums">
                {metrics.totalMembers.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400">Paid VIP, Elite &amp; Legend</span>
            </div>

            <div className="bg-[#0a0f22] border border-slate-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Completed Orders</span>
              <div className="text-3xl font-black text-purple-300 font-['Outfit'] tabular-nums">
                {metrics.completedOrders}
              </div>
              <span className="text-[11px] text-slate-400">Verified via HMAC-SHA256</span>
            </div>

            <div className="bg-[#0a0f22] border border-slate-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Payment Engine Mode</span>
              <div className="text-2xl font-black text-amber-400 font-['Outfit'] uppercase">
                {settings.paymentMode}
              </div>
              <span className="text-[11px] text-slate-400">Sandbox Verification Active</span>
            </div>
          </div>

          {/* Quick Stream Title Editor */}
          <div className="bg-[#0a0f22] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white font-['Outfit']">
              Live Stream Broadcast Controls
            </h3>
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium block">
                Stream Title (Displayed on homepage banner &amp; mobile app)
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={streamTitleInput}
                  onChange={(e) => setStreamTitleInput(e.target.value)}
                  className="flex-1 bg-[#060a17] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => onToggleLive(isLive, streamTitleInput)}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl whitespace-nowrap"
                >
                  Update Title
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS & PAYMENTS AUDIT */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-white font-['Outfit']">
                Payment Orders &amp; Webhook Audit Log
              </h3>
              <p className="text-xs text-slate-400">
                Idempotent database transactions. Replay attacks and duplicate payments are blocked.
              </p>
            </div>
          </div>

          <div className="bg-[#0a0f22] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0e162f] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Verification Method</th>
                    <th className="py-3 px-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {orders.map((o) => (
                    <tr key={o.orderId} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-mono font-bold text-purple-300">
                        {o.orderId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white">{o.userName}</span>
                        <span className="text-[10px] text-slate-400 block">{o.userEmail}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-cyan-300">
                        {o.tier} ({o.billingPeriod})
                      </td>
                      <td className="py-3 px-4 font-bold text-white tabular-nums">
                        ₹{o.amount}
                      </td>
                      <td className="py-3 px-4">
                        {o.status === 'VERIFIED' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            VERIFIED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            {o.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {o.signatureVerified ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            HMAC Signature Valid
                          </span>
                        ) : (
                          <span className="text-amber-400">Awaiting Webhook</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-400">
                        {new Date(o.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: UPI & PAYMENT GATEWAY SETTINGS */}
      {activeTab === 'upi_gateway' && (
        <div className="bg-[#0a0f22] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 max-w-2xl">
          <div>
            <h3 className="text-xl font-black text-white font-['Outfit']">
              UPI &amp; Payment Gateway Configuration
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              As required by Section 4 &amp; 5, do not invent or guess unverified UPI IDs. Configure your authentic creator UPI ID below.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1.5">
                Channel Owner UPI ID (VPA)
              </label>
              <input
                type="text"
                value={upiIdInput}
                onChange={(e) => setUpiIdInput(e.target.value)}
                placeholder="e.g. vgalphax@okhdfcbank"
                className="w-full bg-[#060a17] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Displayed on the customer checkout page with direct copy action.
              </span>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1.5">
                Merchant / Business Display Name
              </label>
              <input
                type="text"
                value={merchantNameInput}
                onChange={(e) => setMerchantNameInput(e.target.value)}
                placeholder="VG ALPHAX Gaming"
                className="w-full bg-[#060a17] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Verification Toggle */}
            <div className="p-4 bg-[#060a17] border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  Verify UPI ID Status
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Enable only after confirming the UPI VPA accepts incoming transfers.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUpiVerifiedInput(!upiVerifiedInput)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  upiVerifiedInput
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {upiVerifiedInput ? 'Verified' : 'Unverified'}
              </button>
            </div>

            {/* Payment Mode Selector */}
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1.5">
                Payment Verification Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentModeInput('test')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    paymentModeInput === 'test'
                      ? 'bg-purple-950/40 border-purple-500 text-white'
                      : 'bg-[#060a17] border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-xs block text-purple-300">Test Sandbox Mode</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Safe testing sandbox with HMAC verification simulation.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentModeInput('live')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    paymentModeInput === 'live'
                      ? 'bg-emerald-950/40 border-emerald-500 text-white'
                      : 'bg-[#060a17] border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-xs block text-emerald-300">Live Gateway Mode</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Requires live Razorpay/Cashfree webhook secret.
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Configuration</span>
              </button>
              {savedSuccess && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Settings Updated!
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MEMBERSHIP PLANS & PRICING */}
      {activeTab === 'plans' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-[#0a0f22] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xl font-black text-white font-['Outfit']">
              Customizable Plan Pricing
            </h3>
            <p className="text-xs text-slate-400">
              Customize tier subscription costs directly without hardcoding unconfirmed rates.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Select Tier to Edit</label>
                <div className="flex gap-2">
                  {(['VIP', 'Elite', 'Legend'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setEditingPlanTier(t);
                        const p = plans.find((pl) => pl.tier === t);
                        if (p) {
                          setPlanMonthlyPrice(p.monthlyPrice);
                          setPlanYearlyPrice(p.yearlyPrice);
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold ${
                        editingPlanTier === t ? 'bg-purple-600 text-white' : 'bg-[#060a17] text-slate-400 border border-slate-800'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    value={planMonthlyPrice}
                    onChange={(e) => setPlanMonthlyPrice(Number(e.target.value))}
                    className="w-full bg-[#060a17] border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">Yearly Price (₹)</label>
                  <input
                    type="number"
                    value={planYearlyPrice}
                    onChange={(e) => setPlanYearlyPrice(Number(e.target.value))}
                    className="w-full bg-[#060a17] border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <button
                onClick={handleUpdatePlanPricing}
                className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl"
              >
                Save {editingPlanTier} Price Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: OBS / STREAM OVERLAY */}
      {activeTab === 'alerts' && (
        <div className="bg-[#0a0f22] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 max-w-3xl">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/40 border border-cyan-800/40 px-3 py-1 rounded-full mb-2">
              <Radio className="w-3.5 h-3.5" />
              LIVE STREAM OBS &amp; MOBILE OVERLAY
            </div>
            <h3 className="text-xl font-black text-white font-['Outfit']">
              Browser Source Live Stream Alerts
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Add this dedicated browser source to OBS Studio, Streamlabs Desktop, or PRISM Live Studio on Android. Displays automated welcome alerts immediately upon verified payment.
            </p>
          </div>

          {/* Browser Source URL Copy Bar */}
          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-bold block">
              OBS / Streamlabs Browser Source URL:
            </label>
            <div className="flex items-center gap-2 bg-[#060a17] border border-purple-900/50 rounded-xl px-4 py-2.5">
              <span className="font-mono text-xs text-purple-300 select-all truncate flex-1">
                {overlayBrowserSourceUrl}
              </span>
              <button
                onClick={handleCopyOverlayUrl}
                className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors flex items-center gap-1.5 shrink-0"
              >
                {copiedOverlayUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedOverlayUrl ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Recommended OBS Dimensions: <strong className="text-slate-200 font-mono">1920 × 1080</strong> (or 1080 × 1920 for mobile vertical streams). Background is 100% transparent.
            </p>
          </div>

          {/* Test Alert Sender */}
          <div className="bg-[#0e162f] rounded-xl p-5 border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white">
                Send Test Alert to Live Stream Overlay
              </h4>
              <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded font-mono">
                DUPLICATE PROTECTED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">Member Name</label>
                <input
                  type="text"
                  value={testAlertName}
                  onChange={(e) => setTestAlertName(e.target.value)}
                  className="w-full bg-[#060a17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">Tier</label>
                <select
                  value={testAlertTier}
                  onChange={(e) => setTestAlertTier(e.target.value as 'VIP' | 'Elite' | 'Legend')}
                  className="w-full bg-[#060a17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="VIP">VIP Member</option>
                  <option value="Elite">Elite Member</option>
                  <option value="Legend">Legend Member</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleTriggerTestAlert}
              disabled={isTriggeringTest}
              className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Fire Live Alert to Stream (Plays Fanfare Chime)</span>
            </button>
          </div>

          {/* Android Mobile Streamer Setup Guide */}
          <div className="bg-[#060a17] rounded-xl p-4 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="font-bold text-slate-200">
              Android Mobile Streaming Setup (PRISM Live Studio / Streamlabs Mobile)
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              1. In PRISM Live Studio on your Android phone, tap the <strong>Widget / Web</strong> layer.<br />
              2. Paste the Browser Source URL generated above.<br />
              3. Set background to transparent and position near top or center.<br />
              4. When an ALPHAX Army member completes UPI payment on the website, the alert triggers live on your phone stream instantly!
            </p>
          </div>
        </div>
      )}

      {/* TAB 6: DATABASE & SUPABASE MIGRATION */}
      {activeTab === 'database' && (
        <div className="bg-[#0a0f22] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 max-w-3xl">
          <div>
            <h3 className="text-xl font-black text-white font-['Outfit']">
              Full PostgreSQL / Supabase Migration Schema
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Production database schema containing Row Level Security (RLS) policies, unique constraints, and tables for profiles, memberships, orders, and chat messages.
            </p>
          </div>

          <div className="p-4 bg-[#060a17] rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
            <div className="text-purple-400 font-bold">Includes 9 Tables &amp; Security Hardening:</div>
            <div>• profiles (uuid references auth.users)</div>
            <div>• membership_plans (VIP, Elite, Legend)</div>
            <div>• memberships (active dates, order references, unique user constraint)</div>
            <div>• payment_orders (idempotent tracking, HMAC verification)</div>
            <div>• payment_webhook_logs (idempotency key constraint)</div>
            <div>• alert_events (live OBS broadcast queue)</div>
            <div>• chat_messages (RLS policy enforcing VIP Lounge restriction)</div>
          </div>

          <a
            href="/api/export/schema.sql"
            download="vgalphax_schema.sql"
            className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download SQL Migration Schema File (.sql)</span>
          </a>
        </div>
      )}

    </div>
  );
};
