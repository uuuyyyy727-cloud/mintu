import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  PaymentOrder, 
  PaymentWebhookLog, 
  AppSettings, 
  MembershipPlan,
  LiveAlertEvent,
  AdminSessionInfo
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
  Save,
  LogOut,
  Key,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ShieldAlert,
  Clock,
  CreditCard,
  UserCheck,
  UserX,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { playAlertFanfareSound } from '../utils/audio';

interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  membership?: {
    tier: 'VIP' | 'Elite' | 'Legend';
    billingPeriod?: string;
    active: boolean;
    expiresAt: string;
    startedAt: string;
    orderId?: string;
    paymentRef?: string;
  } | null;
  createdAt: string;
}

interface AdminDashboardProps {
  currentUser: User;
  settings: AppSettings;
  plans: MembershipPlan[];
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onRefreshData: () => void;
  isLive: boolean;
  onToggleLive: (isLive: boolean, title?: string) => void;
  onNavigateHome?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  settings,
  plans,
  onUpdateSettings,
  onRefreshData,
  isLive,
  onToggleLive,
  onNavigateHome,
}) => {
  // ========================================================
  // SERVER-SIDE AUTHENTICATION & SESSION STATE
  // ========================================================
  const [adminToken, setAdminToken] = useState<string>(() => {
    return typeof window !== 'undefined' ? sessionStorage.getItem('alphax_admin_token') || '' : '';
  });
  const [adminSession, setAdminSession] = useState<AdminSessionInfo | null>(null);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState<boolean>(true);

  // Login form states
  const [loginMode, setLoginMode] = useState<'credentials' | 'secret_key' | 'supabase'>('credentials');
  const [loginEmail, setLoginEmail] = useState('admin@vgalphax.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginSecretKey, setLoginSecretKey] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // ========================================================
  // DASHBOARD STATE
  // ========================================================
  const [activeTab, setActiveTab] = useState<
    'pending_upi' | 'overview' | 'users' | 'orders' | 'upi_gateway' | 'plans' | 'alerts' | 'database'
  >('pending_upi');

  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<PaymentWebhookLog[]>([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    verifiedOrders: 0,
    pendingOrders: 0,
    totalMembers: 0,
    subscribers: 0,
    activeAlerts: 0,
    registeredUsersCount: 0,
  });

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Verification modal state (Requirement 4: Verify against bank before approving)
  const [orderToVerify, setOrderToVerify] = useState<PaymentOrder | null>(null);
  const [bankRefInput, setBankRefInput] = useState('');
  const [auditNotesInput, setAuditNotesInput] = useState('');
  const [confirmBankCreditChecked, setConfirmBankCreditChecked] = useState(false);
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);

  // Rejection modal state
  const [orderToCancel, setOrderToCancel] = useState<PaymentOrder | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('Payment not credited to bank account');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // User management state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilterRole, setUserFilterRole] = useState<'all' | 'admin' | 'member' | 'active_member'>('all');
  const [userToModifyRole, setUserToModifyRole] = useState<RegisteredUser | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<'admin' | 'member'>('admin');
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  // Settings form local state
  const [upiIdInput, setUpiIdInput] = useState(settings.upiId);
  const [upiVerifiedInput, setUpiVerifiedInput] = useState(settings.upiIdVerified);
  const [merchantNameInput, setMerchantNameInput] = useState(settings.upiMerchantName);
  const [paymentModeInput, setPaymentModeInput] = useState(settings.paymentMode);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Live Stream broadcast state
  const [streamTitleInput, setStreamTitleInput] = useState('GRANDMASTER RANK PUSH WITH ELITE SQUAD! 🔴 CUSTOM ROOMS');

  // Plan pricing edits
  const [editingPlanTier, setEditingPlanTier] = useState<'VIP' | 'Elite' | 'Legend'>('VIP');
  const [planMonthlyPrice, setPlanMonthlyPrice] = useState(99);
  const [planYearlyPrice, setPlanYearlyPrice] = useState(999);

  // Stream overlay copy
  const [copiedOverlayUrl, setCopiedOverlayUrl] = useState(false);
  const [isTriggeringTest, setIsTriggeringTest] = useState(false);
  const [testAlertName, setTestAlertName] = useState('Rahul_Gamer');
  const [testAlertTier, setTestAlertTier] = useState<'VIP' | 'Elite' | 'Legend'>('Elite');

  // Helper for notification toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // ========================================================
  // LOAD DATA FROM PROTECTED ENDPOINTS
  // ========================================================
  const loadDashboardData = useCallback(async (token: string) => {
    setIsLoadingData(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // 1. Overview metrics & orders
      const overviewRes = await fetch('/api/admin/overview', { headers });
      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        if (overviewData.metrics) setMetrics(overviewData.metrics);
        if (overviewData.orders) setOrders(overviewData.orders);
        if (overviewData.webhookLogs) setWebhookLogs(overviewData.webhookLogs);
      } else if (overviewRes.status === 401 || overviewRes.status === 403) {
        // Token invalid/expired
        sessionStorage.removeItem('alphax_admin_token');
        setAdminToken('');
        setAdminSession(null);
        return;
      }

      // 2. Real registered users from database
      const usersRes = await fetch('/api/admin/users', { headers });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.users) setRegisteredUsers(usersData.users);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Validate existing session on mount
  useEffect(() => {
    async function checkExistingSession() {
      if (!adminToken) {
        setIsVerifyingAuth(false);
        return;
      }

      try {
        const res = await fetch('/api/admin/auth/me', {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.admin) {
            setAdminSession(data.admin);
            loadDashboardData(adminToken);
          } else {
            sessionStorage.removeItem('alphax_admin_token');
            setAdminToken('');
          }
        } else {
          sessionStorage.removeItem('alphax_admin_token');
          setAdminToken('');
        }
      } catch {
        sessionStorage.removeItem('alphax_admin_token');
        setAdminToken('');
      } finally {
        setIsVerifyingAuth(false);
      }
    }

    checkExistingSession();
  }, [adminToken, loadDashboardData]);

  // ========================================================
  // ADMIN AUTHENTICATION HANDLERS
  // ========================================================
  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const payload: Record<string, string> = {};
      if (loginMode === 'secret_key') {
        if (!loginSecretKey.trim()) {
          setLoginError('Please enter the Admin Secret Key.');
          setLoginLoading(false);
          return;
        }
        payload.secretKey = loginSecretKey.trim();
      } else {
        if (!loginEmail.trim() || !loginPassword.trim()) {
          setLoginError('Both email and password are required.');
          setLoginLoading(false);
          return;
        }
        payload.email = loginEmail.trim();
        payload.password = loginPassword;
      }

      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(data.error || 'Authentication failed. Please verify credentials.');
        return;
      }

      // Store verified token in sessionStorage (server-enforced)
      sessionStorage.setItem('alphax_admin_token', data.token);
      setAdminToken(data.token);
      setAdminSession(data.session);
      showToast(`Welcome back, ${data.session.name}! Session authenticated.`);
      loadDashboardData(data.token);
    } catch (err: any) {
      setLoginError(err.message || 'Connection to authentication server failed.');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleAdminLogout() {
    try {
      if (adminToken) {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
      }
    } catch {
      // ignore
    } finally {
      sessionStorage.removeItem('alphax_admin_token');
      setAdminToken('');
      setAdminSession(null);
      showToast('Logged out of Admin Portal successfully.');
    }
  }

  // ========================================================
  // MANUAL PAYMENT APPROVAL HANDLER (Requirement 4)
  // ========================================================
  async function handleConfirmPaymentVerification() {
    if (!orderToVerify || !adminToken) return;
    if (!confirmBankCreditChecked) {
      alert('You must check the box confirming you verified credit in your bank account.');
      return;
    }

    setIsSubmittingVerify(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderToVerify.orderId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          confirmationRef: bankRefInput.trim() || undefined,
          verificationNotes:
            auditNotesInput.trim() ||
            `Manually verified by admin ${adminSession?.name} against payment account statement.`,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        playAlertFanfareSound();
        showToast(`Order ${orderToVerify.orderId} verified! ${orderToVerify.userName}'s membership is now active.`);
        setOrderToVerify(null);
        setBankRefInput('');
        setAuditNotesInput('');
        setConfirmBankCreditChecked(false);
        // Refresh orders and users
        loadDashboardData(adminToken);
        onRefreshData();
      } else {
        alert(data.error || 'Failed to verify order.');
      }
    } catch (err: any) {
      alert('Error verifying payment: ' + err.message);
    } finally {
      setIsSubmittingVerify(false);
    }
  }

  async function handleConfirmOrderCancel() {
    if (!orderToCancel || !adminToken) return;
    setIsSubmittingCancel(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderToCancel.orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          reason: cancelReasonInput.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`Order ${orderToCancel.orderId} marked CANCELLED.`);
        setOrderToCancel(null);
        loadDashboardData(adminToken);
      } else {
        alert(data.error || 'Failed to cancel order.');
      }
    } catch (err: any) {
      alert('Error cancelling order: ' + err.message);
    } finally {
      setIsSubmittingCancel(false);
    }
  }

  // ========================================================
  // USER ROLE MANAGEMENT (Requirement 5)
  // ========================================================
  async function handleUpdateUserRole() {
    if (!userToModifyRole || !adminToken) return;
    setIsSubmittingRole(true);
    try {
      const res = await fetch(`/api/admin/users/${userToModifyRole.id}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          role: selectedNewRole,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`Updated ${userToModifyRole.name}'s role to ${selectedNewRole.toUpperCase()}.`);
        setUserToModifyRole(null);
        loadDashboardData(adminToken);
      } else {
        alert(data.error || 'Failed to update user role.');
      }
    } catch (err: any) {
      alert('Error updating user role: ' + err.message);
    } finally {
      setIsSubmittingRole(false);
    }
  }

  // ========================================================
  // SETTINGS & STREAM HANDLERS
  // ========================================================
  async function handleSaveSettings() {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
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
        showToast('UPI Gateway configuration updated.');
      }
    } catch {
      // ignore
    }
  }

  async function handleTriggerTestAlert() {
    if (!adminToken) return;
    setIsTriggeringTest(true);
    try {
      const res = await fetch('/api/alerts/trigger-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          tier: testAlertTier,
          memberName: testAlertName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        playAlertFanfareSound();
        showToast(`Fired live alert for ${testAlertName} to OBS overlay!`);
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
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/plans/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          tier: editingPlanTier,
          monthlyPrice: planMonthlyPrice,
          yearlyPrice: planYearlyPrice,
        }),
      });
      if (res.ok) {
        onRefreshData();
        showToast(`Updated ${editingPlanTier} tier pricing successfully!`);
      }
    } catch {
      // ignore
    }
  }

  // Pending payments count
  const pendingOrders = orders.filter((o) => o.status === 'PENDING');

  // Filtered users
  const filteredUsers = registeredUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (userFilterRole === 'admin') return u.role === 'admin' || u.role === 'owner';
    if (userFilterRole === 'member') return u.role === 'member';
    if (userFilterRole === 'active_member') return u.membership?.active;
    return true;
  });

  // ========================================================
  // RENDER: LOADING CHECK
  // ========================================================
  if (isVerifyingAuth) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center animate-spin">
          <RefreshCw className="w-6 h-6 text-purple-400" />
        </div>
        <p className="text-sm font-semibold text-slate-300">
          Verifying administrator authorization...
        </p>
      </div>
    );
  }

  // ========================================================
  // RENDER: SECURE ADMIN LOGIN SCREEN (When Not Authenticated)
  // ========================================================
  if (!adminSession || !adminToken) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-[#0a0f20] border border-purple-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Subtle neon glow background */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-[2px] mx-auto shadow-lg shadow-purple-950/50">
              <div className="w-full h-full bg-[#070b18] rounded-[14px] flex items-center justify-center text-purple-400">
                <Lock className="w-7 h-7" />
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-purple-400 bg-purple-950/60 border border-purple-800/40 px-3 py-0.5 rounded-full mt-2">
              <ShieldAlert className="w-3 h-3 text-purple-400" />
              SERVER-AUTHENTICATED PORTAL
            </div>
            <h2 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
              VG ALPHAX Admin Login
            </h2>
            <p className="text-xs text-slate-400">
              Restricted area for authorized creators &amp; administrators. Role-based database authorization is strictly enforced.
            </p>
          </div>

          {/* Login Mode Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#060a16] border border-slate-800 rounded-xl mb-5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setLoginMode('credentials');
                setLoginError(null);
              }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                loginMode === 'credentials'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Admin Credentials</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('secret_key');
                setLoginError(null);
              }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                loginMode === 'secret_key'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Secret Master Key</span>
            </button>
          </div>

          {/* Error Banner */}
          {loginError && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4">
            {loginMode === 'credentials' ? (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Administrator Email / Username
                  </label>
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@vgalphax.com"
                    className="w-full bg-[#060a16] border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-[#060a16] border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Default admin credential configured via server <code className="text-purple-300">ADMIN_PASSWORD</code>.
                  </span>
                </div>
              </>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Admin Master Secret Key
                </label>
                <input
                  type="password"
                  required
                  value={loginSecretKey}
                  onChange={(e) => setLoginSecretKey(e.target.value)}
                  placeholder="Paste ADMIN_SECRET_KEY..."
                  className="w-full bg-[#060a16] border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Configured in <code className="text-purple-300">ADMIN_SECRET_KEY</code> inside server environment.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 transition-all shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Verify Credentials &amp; Enter Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-400">
              Only accounts with verified <code className="text-amber-400 font-mono">owner</code> or{' '}
              <code className="text-purple-400 font-mono">admin</code> role in the database are granted access.
            </p>
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="mt-3 text-xs text-purple-400 hover:text-purple-300 underline font-medium inline-flex items-center gap-1"
              >
                Return to Public Website <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: AUTHENTICATED ADMIN DASHBOARD
  // ========================================================
  const overlayBrowserSourceUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/?view=overlay&token=${settings.alertOverlayToken}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-[#0d142c] border border-purple-500/50 text-white text-xs px-4 py-3 rounded-2xl shadow-2xl shadow-purple-950/80 flex items-center gap-2.5 animate-in slide-in-from-top-4 fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Header Bar */}
      <div className="bg-[#0a0f22] border border-purple-900/40 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-[2px] shrink-0">
            <div className="w-full h-full bg-[#060a16] rounded-[10px] flex items-center justify-center font-black text-white text-sm">
              VG
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg sm:text-xl font-black text-white font-['Outfit'] uppercase">
                VG ALPHAX Command Center
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-600/30 text-purple-300 border border-purple-500/40">
                {adminSession.role === 'owner' ? '👑 OWNER' : '🛡️ ADMIN'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                Session Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as <strong className="text-slate-200">{adminSession.email}</strong> • Role-based authorization active
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Stream Quick Toggle */}
          <button
            onClick={() => onToggleLive(!isLive, streamTitleInput)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              isLive
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/60'
                : 'bg-[#060a16] border border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-white animate-ping' : 'bg-slate-500'}`} />
            <span>{isLive ? 'LIVE' : 'OFFLINE'}</span>
          </button>

          {/* Refresh Data */}
          <button
            onClick={() => loadDashboardData(adminToken)}
            disabled={isLoadingData}
            className="px-3 py-2 bg-[#060a16] border border-slate-700 hover:border-purple-500 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin text-purple-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleAdminLogout}
            className="px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Responsive Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none text-xs font-bold">
        {[
          {
            id: 'pending_upi',
            label: 'Pending UPI Approvals',
            badge: pendingOrders.length,
            badgeColor: 'bg-amber-500 text-slate-950',
          },
          { id: 'overview', label: 'Overview & Metrics' },
          { id: 'users', label: 'Registered Users', badge: registeredUsers.length },
          { id: 'orders', label: 'All Transactions' },
          { id: 'plans', label: 'Membership Plans' },
          { id: 'upi_gateway', label: 'UPI & Gateway Settings' },
          { id: 'alerts', label: 'OBS Stream Overlay' },
          { id: 'database', label: 'Database & SQL Migration' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  tab.badgeColor || 'bg-purple-950 text-purple-300 border border-purple-700/50'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PENDING UPI APPROVALS (Requirement 3 & 4) */}
      {/* ======================================================== */}
      {activeTab === 'pending_upi' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white font-['Outfit']">
                  Pending UPI Payments Needing Verification
                </h3>
                {pendingOrders.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 animate-pulse">
                    {pendingOrders.length} PENDING
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Requirement 4 Enforced: Only approve membership after opening your PhonePe / BharatPe account and confirming actual credit to <strong className="text-purple-300">vgalphax@axl</strong>.
              </p>
            </div>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="bg-[#0a0f22] border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-white">All Payments Up to Date!</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                There are currently no pending UPI membership requests. When users generate an order on the checkout page, it will appear here for verification.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="bg-[#0a0f22] border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-lg hover:border-amber-500/60 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-purple-300 bg-purple-950/60 border border-purple-800/50 px-2 py-0.5 rounded-md">
                          {order.orderId}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          PENDING VERIFICATION
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{order.userName}</span>
                        <span className="text-xs font-normal text-slate-400">({order.userEmail})</span>
                      </div>
                    </div>

                    {/* Amount & Tier */}
                    <div className="sm:text-right">
                      <div className="text-2xl font-black text-amber-400 font-['Outfit'] tabular-nums">
                        ₹{order.amount}
                      </div>
                      <div className="text-xs font-bold text-cyan-300">
                        {order.tier} Membership ({order.billingPeriod})
                      </div>
                    </div>
                  </div>

                  {/* Verification Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#060a16] p-3.5 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Destination UPI:</span>
                      <strong className="text-purple-300 font-mono">{order.upiIdUsed}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Submitted Bank UTR / Ref:</span>
                      <strong className="text-slate-200 font-mono">
                        {order.gatewayPaymentId || 'Awaiting customer entry'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Gateway Order ID:</span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {order.gatewayOrderId || 'Direct UPI'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOrderToCancel(order);
                        setCancelReasonInput('Payment not credited to bank account');
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-red-300 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject / Mark Invalid</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOrderToVerify(order);
                        setBankRefInput(order.gatewayPaymentId || '');
                        setAuditNotesInput('');
                        setConfirmBankCreditChecked(false);
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Audit Bank Credit &amp; Approve</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: OVERVIEW METRICS */}
      {/* ======================================================== */}
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
              <span className="text-xs text-slate-400 font-semibold">Registered Users</span>
              <div className="text-3xl font-black text-purple-300 font-['Outfit'] tabular-nums">
                {registeredUsers.length}
              </div>
              <span className="text-[11px] text-slate-400">Database user accounts</span>
            </div>

            <div className="bg-[#0a0f22] border border-slate-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Pending Verifications</span>
              <div className="text-3xl font-black text-amber-400 font-['Outfit'] tabular-nums">
                {pendingOrders.length}
              </div>
              <span className="text-[11px] text-slate-400">Needs bank audit</span>
            </div>

            <div className="bg-[#0a0f22] border border-slate-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Verified Orders</span>
              <div className="text-3xl font-black text-cyan-300 font-['Outfit'] tabular-nums">
                {orders.filter((o) => o.status === 'VERIFIED').length}
              </div>
              <span className="text-[11px] text-slate-400">Completed memberships</span>
            </div>
          </div>

          {/* Quick Stream Title Editor */}
          <div className="bg-[#0a0f22] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white font-['Outfit']">
              Live Stream Broadcast Controls
            </h3>
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium block">
                Stream Title (Displayed on homepage banner &amp; mobile app)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={streamTitleInput}
                  onChange={(e) => setStreamTitleInput(e.target.value)}
                  className="flex-1 bg-[#060a17] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => {
                    onToggleLive(isLive, streamTitleInput);
                    showToast('Stream title updated!');
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl whitespace-nowrap cursor-pointer"
                >
                  Update Title
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: REGISTERED USERS & MEMBERSHIPS (Requirement 3 & 5) */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-white font-['Outfit']">
                Registered Users &amp; Membership Status
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Database role-based access control. Only authorized accounts are granted admin permissions.
              </p>
            </div>

            {/* User Search & Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search name or email..."
                  className="bg-[#060a16] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 w-48 sm:w-60"
                />
              </div>

              <select
                value={userFilterRole}
                onChange={(e) => setUserFilterRole(e.target.value as any)}
                className="bg-[#060a16] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="active_member">Active Paid Members</option>
                <option value="admin">Admins &amp; Owner</option>
                <option value="member">Members</option>
              </select>
            </div>
          </div>

          {/* Users Table / Cards */}
          <div className="bg-[#0a0f22] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0e162f] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">System Role</th>
                    <th className="py-3 px-4">Active Membership</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/40">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-7 h-7 rounded-lg object-cover border border-purple-500/40"
                          />
                          <span className="font-bold text-white">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.role === 'owner' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            👑 OWNER
                          </span>
                        ) : u.role === 'admin' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            🛡️ ADMIN
                          </span>
                        ) : u.role === 'member' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                            MEMBER
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
                            GUEST
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.membership?.active ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/40">
                            {u.membership.tier}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">No Active Plan</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {u.membership?.expiresAt ? (
                          new Date(u.membership.expiresAt).toLocaleDateString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {u.role !== 'owner' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setUserToModifyRole(u);
                              setSelectedNewRole(u.role === 'admin' ? 'member' : 'admin');
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#060a16] border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            {u.role === 'admin' ? 'Demote to Member' : 'Promote to Admin'}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Immutable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: ALL TRANSACTIONS AUDIT */}
      {/* ======================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-white font-['Outfit']">
                Complete Payment Transactions History
              </h3>
              <p className="text-xs text-slate-400">
                Audited payment state machine records. Only backend service marks payments as VERIFIED.
              </p>
            </div>
          </div>

          <div className="bg-[#0a0f22] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0e162f] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Verified By</th>
                    <th className="py-3 px-4">Created Date</th>
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
                        ) : o.status === 'CANCELLED' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            CANCELLED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {o.verifiedBy || (o.signatureVerified ? 'Gateway Webhook' : 'Unverified')}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-400">
                        {new Date(o.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: MEMBERSHIP PLANS & PRICING */}
      {/* ======================================================== */}
      {activeTab === 'plans' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-[#0a0f22] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xl font-black text-white font-['Outfit']">
              Customizable Membership Pricing
            </h3>
            <p className="text-xs text-slate-400">
              Update monthly and yearly prices for VIP, Elite, and Legend membership tiers.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1.5">Select Tier to Edit</label>
                <div className="flex gap-2">
                  {(['VIP', 'Elite', 'Legend'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setEditingPlanTier(t);
                        const p = plans.find((pl) => pl.tier === t);
                        if (p) {
                          setPlanMonthlyPrice(p.monthlyPrice);
                          setPlanYearlyPrice(p.yearlyPrice);
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
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
                type="button"
                onClick={handleUpdatePlanPricing}
                className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl cursor-pointer"
              >
                Save {editingPlanTier} Price Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: UPI & PAYMENT GATEWAY SETTINGS */}
      {/* ======================================================== */}
      {activeTab === 'upi_gateway' && (
        <div className="bg-[#0a0f22] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 max-w-2xl">
          <div>
            <h3 className="text-xl font-black text-white font-['Outfit']">
              UPI &amp; Payment Gateway Configuration
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure creator UPI credentials and gateway modes.
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
                placeholder="vgalphax@axl"
                className="w-full bg-[#060a17] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Official UPI ID used for PhonePe and pre-filled amount QR code.
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
                  Verified as official creator receiving account.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUpiVerifiedInput(!upiVerifiedInput)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  upiVerifiedInput
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {upiVerifiedInput ? 'Verified' : 'Unverified'}
              </button>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-6 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl flex items-center gap-2 cursor-pointer"
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

      {/* ======================================================== */}
      {/* TAB 7: OBS / STREAM OVERLAY */}
      {/* ======================================================== */}
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
              Add this dedicated browser source to OBS Studio or PRISM Live Studio. Shows alert immediately upon verified membership.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-bold block">
              OBS / Streamlabs Browser Source URL:
            </label>
            <div className="flex items-center gap-2 bg-[#060a17] border border-purple-900/50 rounded-xl px-4 py-2.5">
              <span className="font-mono text-xs text-purple-300 select-all truncate flex-1">
                {overlayBrowserSourceUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyOverlayUrl}
                className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedOverlayUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedOverlayUrl ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>
          </div>

          {/* Test Alert Sender */}
          <div className="bg-[#0e162f] rounded-xl p-5 border border-slate-700/80 space-y-4">
            <h4 className="font-bold text-sm text-white">
              Send Test Alert to Live Stream Overlay
            </h4>
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
              type="button"
              onClick={handleTriggerTestAlert}
              disabled={isTriggeringTest}
              className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Fire Test Alert (Plays Sound)</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 8: DATABASE & SQL MIGRATION */}
      {/* ======================================================== */}
      {activeTab === 'database' && (
        <div className="bg-[#0a0f22] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 max-w-3xl">
          <div>
            <h3 className="text-xl font-black text-white font-['Outfit']">
              PostgreSQL / Supabase Migration Schema
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Production database schema containing Row Level Security (RLS) policies, RBAC user roles, and secure membership tables.
            </p>
          </div>

          <div className="p-4 bg-[#060a17] rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
            <div className="text-purple-400 font-bold">Includes 9 Tables &amp; Security Hardening:</div>
            <div>• profiles (uuid references auth.users with user_role enum)</div>
            <div>• membership_plans (VIP, Elite, Legend tiers)</div>
            <div>• memberships (active dates, order references, unique user constraint)</div>
            <div>• payment_orders (status enum: PENDING, VERIFIED, FAILED, CANCELLED)</div>
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

      {/* ======================================================== */}
      {/* MODAL: VERIFY PAYMENT CREDIT BEFORE APPROVING (Req 4) */}
      {/* ======================================================== */}
      {orderToVerify && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f20] border border-emerald-500/50 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  MANDATORY BANK VERIFICATION
                </div>
                <h3 className="text-xl font-black text-white font-['Outfit']">
                  Approve Membership for {orderToVerify.userName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOrderToVerify(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Verification checklist notice */}
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 text-xs text-slate-200 space-y-2">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Step 1: Check Payment Account Before Proceeding
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Open your PhonePe, Google Pay, or Bank statement for <strong className="text-white font-mono">{orderToVerify.upiIdUsed}</strong> and confirm that <strong className="text-emerald-300 font-bold">₹{orderToVerify.amount}</strong> was credited for order <span className="font-mono text-white">{orderToVerify.orderId}</span>.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Confirmed Bank / UPI UTR Number (Optional / Recommended)
                </label>
                <input
                  type="text"
                  value={bankRefInput}
                  onChange={(e) => setBankRefInput(e.target.value)}
                  placeholder="e.g. 428172918291 or PhonePe Txn ID"
                  className="w-full bg-[#060a16] border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Audit Notes
                </label>
                <input
                  type="text"
                  value={auditNotesInput}
                  onChange={(e) => setAuditNotesInput(e.target.value)}
                  placeholder="e.g. Confirmed credit in PhonePe statement at 12:45 PM"
                  className="w-full bg-[#060a16] border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Confirmation checkbox */}
              <label className="flex items-start gap-3 p-3.5 bg-[#060a16] border border-slate-800 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmBankCreditChecked}
                  onChange={(e) => setConfirmBankCreditChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-emerald-500 rounded"
                />
                <span className="text-slate-300 text-[11px] leading-tight">
                  <strong className="text-white block mb-0.5">I confirm that I have verified the credit</strong>
                  I personally checked the payment account and confirmed that ₹{orderToVerify.amount} was received from {orderToVerify.userName}.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToVerify(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!confirmBankCreditChecked || isSubmittingVerify}
                onClick={handleConfirmPaymentVerification}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-lg shadow-emerald-950/60 cursor-pointer flex items-center gap-2"
              >
                {isSubmittingVerify ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Activating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm &amp; Activate Membership</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REJECT ORDER */}
      {/* ======================================================== */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f20] border border-red-500/50 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
            <h3 className="text-lg font-black text-white font-['Outfit']">
              Reject Order {orderToCancel.orderId}
            </h3>
            <p className="text-xs text-slate-400">
              Mark this payment transaction as CANCELLED. The membership will remain inactive.
            </p>
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Reason for Rejection:
              </label>
              <input
                type="text"
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                className="w-full bg-[#060a16] border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isSubmittingCancel}
                onClick={handleConfirmOrderCancel}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingCancel ? 'Cancelling...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: MODIFY USER ROLE (Requirement 5) */}
      {/* ======================================================== */}
      {userToModifyRole && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f20] border border-purple-500/50 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
            <h3 className="text-lg font-black text-white font-['Outfit']">
              Change System Role for {userToModifyRole.name}
            </h3>
            <p className="text-xs text-slate-400">
              Only authorized staff can assign administrator privileges.
            </p>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-semibold block">Select Role:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedNewRole('admin')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedNewRole === 'admin'
                      ? 'bg-purple-950/60 border-purple-500 text-white'
                      : 'bg-[#060a16] border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-xs block text-purple-300">🛡️ Admin</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Can verify payments &amp; manage settings.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedNewRole('member')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedNewRole === 'member'
                      ? 'bg-blue-950/60 border-blue-500 text-white'
                      : 'bg-[#060a16] border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-xs block text-blue-300">🎮 Member</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Standard community user.
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToModifyRole(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingRole}
                onClick={handleUpdateUserRole}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingRole ? 'Saving...' : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
