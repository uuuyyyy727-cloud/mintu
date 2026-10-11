import React, { useState } from 'react';
import { MembershipPlan, User, MembershipTierName, BillingPeriod } from '../types';
import { 
  Check, 
  Crown, 
  ShieldCheck, 
  Zap, 
  Flame, 
  ArrowRight, 
  Sparkles, 
  Info,
  Calendar,
  CreditCard
} from 'lucide-react';

interface MembershipPlansProps {
  plans: MembershipPlan[];
  currentUser: User;
  onSelectTier: (tier: MembershipTierName, billingPeriod: BillingPeriod) => void;
}

export const MembershipPlans: React.FC<MembershipPlansProps> = ({
  plans,
  currentUser,
  onSelectTier,
}) => {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  const activeMembership = currentUser.membership?.active ? currentUser.membership : null;

  return (
    <section className="py-10 max-w-7xl mx-auto px-4 lg:px-8 space-y-10">
      
      {/* Active Membership Banner (if user already holds active tier) */}
      {activeMembership && (
        <div className="bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-[#0b1021] border border-purple-500/50 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-2xl">
                👑
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-white font-['Outfit']">
                    ACTIVE {activeMembership.tier.toUpperCase()} MEMBERSHIP
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    VERIFIED ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Order ID: <span className="font-mono text-purple-300">{activeMembership.orderId}</span>
                  {' '}· Valid until {new Date(activeMembership.expiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="bg-[#050814]/80 px-3.5 py-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">RENEWAL TYPE</span>
                <span className="font-bold text-slate-200 capitalize">{activeMembership.billingPeriod}</span>
              </div>
              <div className="bg-[#050814]/80 px-3.5 py-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">PAYMENT GATEWAY REF</span>
                <span className="font-mono font-bold text-cyan-400 truncate max-w-[120px]">{activeMembership.paymentRef}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header and Value Proposition */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest bg-purple-950/40 border border-purple-800/40 px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          ALPHAX ARMY TIERS
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] tracking-tight">
          Choose Your Membership Tier
        </h2>
        <p className="text-sm text-slate-300">
          Support VG ALPHAX directly, participate in private Free Fire custom rooms, unlock real-time creator chat, and earn exclusive badges.
        </p>

        {/* Billing Switcher (Interactive Segmented Control) */}
        <div className="inline-flex items-center p-1 bg-[#0e162e] rounded-xl border border-slate-800">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              billingPeriod === 'yearly'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Yearly Billing
            <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded">
              SAVE 16%
            </span>
          </button>
        </div>
      </div>

      {/* Three Customizable Membership Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {plans.map((plan) => {
          const isCurrentTier = activeMembership?.tier === plan.tier;
          const price = billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-2xl p-6 sm:p-7 transition-all duration-300 ${
                plan.popular
                  ? 'bg-gradient-to-b from-[#131b38] to-[#0a0f22] border-2 border-purple-500 shadow-2xl shadow-purple-950/60 scale-[1.02]'
                  : 'bg-[#0a0f22] border border-slate-800 hover:border-purple-500/40'
              }`}
            >
              {/* Featured Badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-md">
                  MOST POPULAR SQUAD PICK
                </div>
              )}

              <div>
                {/* Tier Title and Tagline */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-extrabold tracking-wider uppercase font-mono px-2.5 py-1 rounded-md bg-purple-950/60 border border-purple-800/40 text-purple-300">
                    {plan.badge}
                  </span>
                  <span className="text-xs text-slate-400">{plan.discordRole}</span>
                </div>

                <h3 className="text-2xl font-black text-white font-['Outfit'] mt-1">
                  {plan.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px]">
                  {plan.tagline}
                </p>

                {/* Price Display */}
                <div className="my-6 pb-6 border-b border-slate-800">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-white font-['Outfit'] tabular-nums">
                      ₹{price}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      /{billingPeriod === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {billingPeriod === 'yearly' ? 'Billed annually via UPI / Gateway' : 'Billed monthly via UPI / Gateway'}
                  </p>
                </div>

                {/* Perks Checklist */}
                <div className="space-y-3 mb-8">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    What's Included:
                  </span>
                  <ul className="space-y-2.5">
                    {plan.perks.map((perk, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300 leading-snug">
                        <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div>
                {isCurrentTier ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 cursor-default flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Current Active Tier
                  </button>
                ) : (
                  <button
                    onClick={() => onSelectTier(plan.tier, billingPeriod)}
                    className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-950/50'
                        : 'bg-[#0e162e] hover:bg-purple-600/20 text-slate-200 hover:text-white border border-slate-700 hover:border-purple-500'
                    }`}
                  >
                    <span>Unlock {plan.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  Instant activation upon verified payment
                </p>
              </div>

            </div>
          );
        })}
      </div>

      {/* Comparison Grid & Notice */}
      <div className="bg-[#0a0f22] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <h3 className="text-xl font-black text-white font-['Outfit']">
          Membership Benefits Comparison
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">Feature / Perk</th>
                <th className="py-3 px-4 text-center font-bold text-purple-300">VIP (₹99)</th>
                <th className="py-3 px-4 text-center font-bold text-cyan-300">ELITE (₹299)</th>
                <th className="py-3 px-4 text-center font-bold text-amber-300">LEGEND (₹799)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-3 px-4 font-medium">Chat &amp; Profile Badge</td>
                <td className="py-3 px-4 text-center">👑 VIP</td>
                <td className="py-3 px-4 text-center">⚡ ELITE</td>
                <td className="py-3 px-4 text-center">🔥 LEGEND GOLD</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Member-Only Posts &amp; Polls</td>
                <td className="py-3 px-4 text-center text-emerald-400">✓ Included</td>
                <td className="py-3 px-4 text-center text-emerald-400">✓ Included</td>
                <td className="py-3 px-4 text-center text-emerald-400">✓ Included</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Free Fire Custom Room Priority</td>
                <td className="py-3 px-4 text-center text-slate-500">—</td>
                <td className="py-3 px-4 text-center text-emerald-400">✓ 10-Min Early Code</td>
                <td className="py-3 px-4 text-center text-amber-400">✓ Guaranteed Slot</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Private Member Chat Room</td>
                <td className="py-3 px-4 text-center text-slate-500">—</td>
                <td className="py-3 px-4 text-center text-emerald-400">✓ VIP Lounge</td>
                <td className="py-3 px-4 text-center text-amber-400">✓ Direct Creator Voice</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Live Stream Alert Callout</td>
                <td className="py-3 px-4 text-center text-emerald-400">✓ On-screen Banner</td>
                <td className="py-3 px-4 text-center text-emerald-400">✓ Animated Fanfare</td>
                <td className="py-3 px-4 text-center text-amber-400">✓ Gold Sound &amp; Shoutout</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex items-start gap-3 bg-slate-900/60 rounded-xl p-4 border border-slate-800 text-xs text-slate-400">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-200">Payment Security Notice:</strong> All payments are processed through secure UPI or verified payment gateway webhooks. The creator will never ask for your UPI PIN, card passwords, or OTPs. Membership is activated instantly and tied to your registered account.
          </p>
        </div>
      </div>

    </section>
  );
};
