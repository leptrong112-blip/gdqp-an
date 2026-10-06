export function playCountdownBeep(frequency = 750, duration = 0.08, muted = false) {
  if (muted) return;
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    osc.onended = () => { void ctx.close().catch(() => {}); };
  } catch {
    // Graceful fallback if AudioContext is blocked or unsupported in current environment
  }
}

/** Never awaited: text/state transitions remain authoritative if speech fails. */
export function speakPoseCommand(command: string, muted = false) {
  if (muted || typeof window === 'undefined') return;
  try {
    if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(command.toLocaleLowerCase('vi-VN'));
    utterance.lang = 'vi-VN'; utterance.rate = 1.05;
    const voice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('vi'));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  } catch { /* Speech is optional. */ }
}
export function cancelPoseSpeech() {
  try { if (typeof window !== 'undefined') window.speechSynthesis?.cancel(); } catch { /* Non-blocking cleanup. */ }
}
