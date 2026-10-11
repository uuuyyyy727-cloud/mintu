import React, { useState, useEffect, useRef } from 'react';
import { LiveAlertEvent, AppSettings } from '../types';
import { playAlertFanfareSound } from '../utils/audio';
import { Volume2, VolumeX, Sparkles, Shield, Crown } from 'lucide-react';

interface LiveAlertOverlayProps {
  isStandalone?: boolean;
  settings?: AppSettings;
}

export const LiveAlertOverlay: React.FC<LiveAlertOverlayProps> = ({
  isStandalone = false,
  settings,
}) => {
  const [currentAlert, setCurrentAlert] = useState<LiveAlertEvent | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const timerRef = useRef<number | null>(null);

  // Subscribe to SSE alert event stream
  useEffect(() => {
    const token = settings?.alertOverlayToken || 'alphax_secure_overlay_token_9982';
    const eventSource = new EventSource(`/api/alerts/events?token=${encodeURIComponent(token)}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') return;

        const alert: LiveAlertEvent = data;
        // Enforce duplicate prevention
        setProcessedIds((prev) => {
          if (prev.has(alert.id)) return prev;
          const updated = new Set(prev);
          updated.add(alert.id);
          triggerAlert(alert);
          return updated;
        });
      } catch (e) {
        console.error('Error handling SSE alert', e);
      }
    };

    return () => {
      eventSource.close();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [settings?.alertOverlayToken]);

  function triggerAlert(alert: LiveAlertEvent) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentAlert(alert);

    if (soundEnabled) {
      playAlertFanfareSound();
    }

    const duration = (settings?.alertDisplayDurationSec || 8) * 1000;
    timerRef.current = window.setTimeout(() => {
      setCurrentAlert(null);
    }, duration);
  }

  // Tier color styling
  const tierBadges: Record<string, { bg: string; text: string; glow: string; icon: string }> = {
    VIP: {
      bg: 'from-purple-900/90 to-indigo-900/90',
      text: 'text-purple-300',
      glow: 'shadow-[0_0_35px_rgba(168,85,247,0.6)]',
      icon: '👑',
    },
    Elite: {
      bg: 'from-sky-950/90 via-blue-900/90 to-purple-950/90',
      text: 'text-sky-300',
      glow: 'shadow-[0_0_35px_rgba(56,189,248,0.6)]',
      icon: '⚡',
    },
    Legend: {
      bg: 'from-amber-950/90 via-yellow-900/90 to-purple-950/90',
      text: 'text-amber-300',
      glow: 'shadow-[0_0_40px_rgba(234,179,8,0.7)]',
      icon: '🔥',
    },
  };

  const style = currentAlert ? tierBadges[currentAlert.tier] || tierBadges.Elite : tierBadges.Elite;

  if (isStandalone && !currentAlert) {
    // Pure transparent container for OBS Browser Source
    return (
      <div className="fixed inset-0 pointer-events-none flex items-start justify-center p-6 bg-transparent">
        {/* Floating Sound Toggle control for mobile streamer test */}
        <div className="absolute top-2 right-2 pointer-events-auto opacity-40 hover:opacity-100 transition-opacity">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-black/60 text-white text-[10px] flex items-center gap-1 border border-slate-700"
          >
            {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            <span>Overlay Audio</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${
        isStandalone
          ? 'fixed inset-0 pointer-events-none flex items-start justify-center p-6 bg-transparent z-50'
          : 'relative w-full flex items-center justify-center p-4'
      }`}
    >
      {currentAlert && (
        <div
          className={`animate-alert-banner pointer-events-auto max-w-xl w-full bg-gradient-to-r ${style.bg} border-2 border-purple-500 rounded-2xl p-5 ${style.glow} backdrop-blur-xl relative overflow-hidden`}
        >
          {/* Cyber scanline & particle background effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

          <div className="relative flex items-center gap-4">
            {/* Member Avatar with Tier Border */}
            <div className="relative shrink-0">
              <img
                src={currentAlert.avatar}
                alt={currentAlert.memberName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/60 shadow-xl"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-purple-400 flex items-center justify-center text-xs">
                {style.icon}
              </div>
            </div>

            {/* Alert Message Content */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-black/60 border border-purple-400/40 text-purple-300">
                  NEW ARMY MEMBER
                </span>
                <span className={`text-xs font-bold ${style.text}`}>
                  {currentAlert.tier} Tier Verified
                </span>
              </div>

              <h4 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight leading-tight">
                {currentAlert.memberName}
              </h4>

              <p className="text-xs text-slate-100 font-medium">
                {currentAlert.message}
              </p>
            </div>
          </div>

          {/* Bottom Sparkle Strip */}
          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
            <span className="font-mono text-cyan-300">VG ALPHAX OFFICIAL STREAM ALERT</span>
            <span className="text-[10px] text-purple-300">WELCOME TO THE SQUAD</span>
          </div>
        </div>
      )}
    </div>
  );
};
