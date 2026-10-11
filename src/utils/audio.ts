/**
 * Synthesizes an esports membership fanfare sound using Web Audio API.
 * Guaranteed to work without external audio assets or network requests.
 */
export function playAlertFanfareSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Esports Victory Fanfare Notes: D4, F#4, A4, D5 (Ascending victory arpeggio)
    const notes = [
      { freq: 293.66, start: 0.0, dur: 0.18, vol: 0.35 },
      { freq: 369.99, start: 0.15, dur: 0.18, vol: 0.35 },
      { freq: 440.0, start: 0.30, dur: 0.22, vol: 0.40 },
      { freq: 587.33, start: 0.48, dur: 0.85, vol: 0.50 },
      { freq: 880.0, start: 0.52, dur: 0.90, vol: 0.30 }, // High harmonic chime
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      // Attack and exponential decay
      gain.gain.setValueAtTime(0.001, now + note.start);
      gain.gain.linearRampToValueAtTime(note.vol, now + note.start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.dur);
    });
  } catch (e) {
    console.warn('Audio playback not supported or user gesture required', e);
  }
}
