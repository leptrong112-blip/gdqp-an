import { median } from '../pipeline/geometry';
import type { MovementId, PoseStage } from '../types';
export class AdaptiveBudget {
  fps: number;
  profile: 'FAST' | 'NORMAL' | 'LOW';
  private durations: number[] = [];
  private salute = false;
  private phase: PoseStage = 'quality-check';
  private healthySince?: number;
  constructor(private fallback = false) { this.fps = fallback ? 10 : 15; this.profile = fallback ? 'LOW' : 'NORMAL'; }
  setPhase(stage: PoseStage, movement: MovementId | string) {
    const wasSalute = this.salute;
    this.salute = movement === 'salute'; this.phase = stage;
    if (wasSalute && !this.salute) {
      this.durations = []; this.healthySince = undefined;
      this.fps = this.fallback ? 10 : 15; this.profile = this.fallback ? 'LOW' : 'NORMAL';
    }
    if (this.salute) this.recompute();
  }
  private recompute() {
    if (!this.salute) return;
    const target = this.phase === 'transition' ? 20 : this.phase === 'scoring' ? 15 : this.phase === 'countdown' ? 12 : 10;
    const cap = this.profile === 'FAST' ? 20 : this.profile === 'NORMAL' ? 15 : 8;
    const cost = this.durations.length ? median(this.durations.slice(-10)) : 0;
    this.fps = Math.max(4, Math.min(target, cap, cost > 0 ? Math.floor(850 / cost) : cap));
  }
  observe(duration: number, now = performance.now()) {
    if (!Number.isFinite(duration) || duration < 0) return;
    this.durations.push(duration); if (this.durations.length > 30) this.durations.shift();
    if (this.salute && this.durations.length >= 3) {
      const recent = this.durations.slice(-5), worst = Math.max(...recent), typical = median(recent);
      const next = worst > 100 || typical > 80 ? 'LOW' : typical > 45 ? 'NORMAL' : 'FAST';
      const rank = { LOW: 0, NORMAL: 1, FAST: 2 };
      if (rank[next] < rank[this.profile]) { this.profile = next; this.healthySince = undefined; }
      else if (rank[next] > rank[this.profile]) {
        this.healthySince ??= now;
        if (this.durations.length >= 20 && now - this.healthySince > 5000) { this.profile = next; this.healthySince = undefined; }
      } else this.healthySince = undefined;
      this.recompute(); return;
    }
    if (this.durations.length < 15) return;
    const typical = median(this.durations);
    // Lower inference frequency without renegotiating the camera's aspect ratio.
    if (typical > 80) this.fps = Math.min(this.fps, 10);
    if (typical > 125) this.fps = 8;
    if (this.fps <= 10) this.profile = 'LOW';
  }
}
export interface FrameScheduleStats { submitted: number; dropped: number; droppedRatio: number }
export function startFrameScheduler(video: HTMLVideoElement, budget: AdaptiveBudget, analyze: (timestamp: number) => Promise<void>, fail: (message: string) => void, metrics?: (stats: FrameScheduleStats) => void) {
  let stopped = false, busy = false, callback = 0, lastSent = -Infinity, lastVideoTime = -1, busySince = 0, lastNewFrame = performance.now();
  const useVideoCallback = typeof video.requestVideoFrameCallback === 'function';
  let observedVideoTime = -1, observedFrames = 0, submitted = 0, dropped = 0, previousPresented: number | undefined;
  const schedule = () => { if (!stopped) callback = useVideoCallback ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(tick); };
  const tick = (_?: number, metadata?: VideoFrameCallbackMetadata) => {
    if (stopped) return;
    const now = performance.now();
    const newFrame = video.currentTime !== observedVideoTime;
    if (newFrame) {
      observedVideoTime = video.currentTime; lastNewFrame = now;
      const count = metadata && previousPresented !== undefined ? Math.max(1, metadata.presentedFrames - previousPresented) : 1;
      previousPresented = metadata?.presentedFrames; observedFrames += count; dropped += count - 1;
    }
    if (!busy && video.readyState >= 2 && video.currentTime !== lastVideoTime && now - lastSent >= 1000 / budget.fps) {
      busy = true; busySince = now; lastVideoTime = video.currentTime; lastSent = now;
      submitted++;
      void analyze(now).catch(error => { if (!stopped) fail(error instanceof Error ? error.message : 'Phân tích bị gián đoạn.'); }).finally(() => { busy = false; });
    }
    else if (newFrame) dropped++;
    metrics?.({ submitted, dropped, droppedRatio: observedFrames ? dropped / observedFrames : 0 });
    schedule();
  };
  const watchdog = setInterval(() => {
    if (!stopped && ((busy && performance.now() - busySince > 10000) || performance.now() - lastNewFrame > 5000)) fail('Camera hoặc mô hình không phản hồi. Bật lại camera để thử lại.');
  }, 1000);
  schedule();
  return () => { stopped = true; clearInterval(watchdog); if (useVideoCallback) video.cancelVideoFrameCallback(callback); else cancelAnimationFrame(callback); };
}
