import React, { useState } from 'react';
import { 
  supabase, 
  isSupabaseConfigured, 
  supabaseSignUp, 
  supabaseSignIn, 
  supabaseResetPassword, 
  supabaseUpdateProfile 
} from '../lib/supabase';
import { User } from '../types';
import { X, Lock, Mail, User as UserIcon, AlertCircle, CheckCircle2, KeyRound, ExternalLink, ShieldCheck } from 'lucide-react';

interface SupabaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onAuthSuccess: (user: User) => void;
}

export const SupabaseAuthModal: React.FC<SupabaseAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset' | 'profile'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(currentUser.name || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!isSupabaseConfigured) {
          // Fallback to local server login if Supabase anon key not entered yet
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name }),
          });
          const data = await res.json();
          if (data.user) {
            onAuthSuccess(data.user);
            setSuccessMessage('Account created successfully!');
            setTimeout(onClose, 1000);
          }
          return;
        }

        const data = await supabaseSignUp(email, password, name);
        if (data.user) {
          const newUser: User = {
            id: data.user.id,
            email: data.user.email || email,
            name: name || data.user.user_metadata?.name || 'Recruit',
            avatar: data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
            role: 'member',
            createdAt: new Date().toISOString(),
          };
          onAuthSuccess(newUser);
          setSuccessMessage('Supabase account registered! Verification email sent if enabled.');
          setTimeout(onClose, 1200);
        }
      } else if (mode === 'login') {
        if (!isSupabaseConfigured) {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name: email.split('@')[0] }),
          });
          const data = await res.json();
          if (data.user) {
            onAuthSuccess(data.user);
            setSuccessMessage('Signed in successfully!');
            setTimeout(onClose, 1000);
          }
          return;
        }

        const data = await supabaseSignIn(email, password);
        if (data.user) {
          const loggedInUser: User = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.name || 'ALPHAX Member',
            avatar: data.user.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Alpha',
            role: 'member',
            createdAt: data.user.created_at,
          };
          onAuthSuccess(loggedInUser);
          setSuccessMessage('Signed in with Supabase successfully!');
          setTimeout(onClose, 1000);
        }
      } else if (mode === 'reset') {
        if (!isSupabaseConfigured) {
          setSuccessMessage('Password reset requested for local account.');
          return;
        }
        await supabaseResetPassword(email);
        setSuccessMessage('Password reset link dispatched via Supabase Auth.');
      } else if (mode === 'profile') {
        if (isSupabaseConfigured) {
          await supabaseUpdateProfile(name, avatar);
        }
        const res = await fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, name, avatar }),
        });
        const data = await res.json();
        if (data.user) {
          onAuthSuccess(data.user);
          setSuccessMessage('Profile updated!');
          setTimeout(onClose, 1000);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#090e21] border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#0e162f] px-5 py-4 border-b border-purple-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-sm font-bold text-white">
              {mode === 'profile' ? <UserIcon className="w-4 h-4 text-purple-300" /> : <Lock className="w-4 h-4 text-cyan-400" />}
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-['Outfit']">
                {mode === 'login' && 'Member Login'}
                {mode === 'signup' && 'Create ALPHAX Account'}
                {mode === 'reset' && 'Reset Password'}
                {mode === 'profile' && 'Edit Member Profile'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Supabase Auth &amp; Session Management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Supabase Status Banner */}
        <div className="px-5 pt-4">
          <div className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
            isSupabaseConfigured 
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
              : 'bg-purple-950/40 border-purple-800/40 text-purple-300'
          }`}>
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Supabase Project:</span>{' '}
              <code className="text-[10px] text-slate-300">kvksunfttokewwdyonxl.supabase.co</code>
              {!isSupabaseConfigured && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Set <code className="text-purple-300">VITE_SUPABASE_ANON_KEY</code> in <code className="text-slate-300">.env</code> to connect directly to your live Supabase database.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Gamer Tag / Display Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ShadowStrike_99"
                  className="w-full bg-[#060a17] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {mode !== 'profile' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gamer@alphaxarmy.in"
                  className="w-full bg-[#060a17] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {mode !== 'reset' && mode !== 'profile' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#060a17] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {mode === 'profile' && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#060a17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Avatar Image URL</label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#060a17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </>
          )}

          {errorMessage && (
            <div className="p-2.5 bg-red-950/40 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : mode === 'reset' ? 'Send Reset Email' : 'Save Profile'}
          </button>

          {/* Toggle modes */}
          <div className="pt-2 text-center text-xs text-slate-400 space-y-1">
            {mode === 'login' && (
              <>
                <p>
                  New to ALPHAX Army?{' '}
                  <button type="button" onClick={() => setMode('signup')} className="text-purple-400 font-bold hover:underline">
                    Create an account
                  </button>
                </p>
                <button type="button" onClick={() => setMode('reset')} className="text-slate-400 hover:text-slate-200 text-[11px] block mx-auto">
                  Forgot password?
                </button>
              </>
            )}

            {mode === 'signup' && (
              <p>
                Already have an account?{' '}
                <button type="button" onClick={() => setMode('login')} className="text-purple-400 font-bold hover:underline">
                  Sign in
                </button>
              </p>
            )}

            {mode === 'reset' && (
              <button type="button" onClick={() => setMode('login')} className="text-purple-400 font-bold hover:underline">
                Back to Sign In
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
};
