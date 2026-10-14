import { median } from '../pipeline/geometry';
import { POSE_CONFIG as C } from '../config';
import type { MovementId, PoseStage } from '../types';
export class AdaptiveBudget {
  fps: number;
  profile: 'FAST' | 'NORMAL' | 'LOW';
  private durations: number[] = [];
  private healthySince?: number;
  constructor(private fallback = false) { this.fps = fallback ? 15 : C.targetFps; this.profile = fallback ? 'NORMAL' : 'FAST'; }
  setPhase(_stage: PoseStage, _movement: MovementId | string) {
    // Preparation and countdown also need fresh observations. Keep measured
    // hardware limits across movements rather than re-learning overload each time.
    this.recompute();
  }
  private recompute() {
    const target = this.fallback ? 15 : C.targetFps;
    const cap = this.profile === 'FAST' ? C.targetFps : this.profile === 'NORMAL' ? 20 : 8;
    const cost = this.durations.length ? median(this.durations.slice(-10)) : 0;
    // 5 Hz => 200 ms + one display tick, inside the bounded 300 ms evidence gap.
    // If hardware cannot keep up, reject real gaps; never queue old frames.
    this.fps = Math.max(C.minimumInferenceFps, Math.min(target, cap, cost > 0 ? Math.floor(850 / cost) : cap));
  }
  observe(duration: number, now = performance.now()) {
    if (!Number.isFinite(duration) || duration < 0) return;
    this.durations.push(duration); if (this.durations.length > 30) this.durations.shift();
    if (this.durations.length >= 3) {
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
    this.recompute();
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
    // Camera clocks commonly report 33.3 ms rather than 33.333... ms. A small
    // tolerance prevents a 30 Hz target accidentally skipping every other frame.
    if (!busy && video.readyState >= 2 && video.currentTime !== lastVideoTime && now - lastSent >= 1000 / budget.fps - 1) {
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
