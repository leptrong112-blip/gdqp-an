import { median } from '../pipeline/geometry';
export class AdaptiveBudget {
  fps: number; width = 640; height = 480;
  private durations: number[] = [];
  constructor(private fallback = false) { this.fps = fallback ? 10 : 15; }
  observe(duration: number) {
    this.durations.push(duration); if (this.durations.length > 30) this.durations.shift();
    if (this.durations.length < 15) return;
    const typical = median(this.durations);
    if (typical > 80) { this.fps = Math.min(this.fps, 10); this.width = 480; this.height = 360; }
    if (typical > 125) this.fps = 8;
  }
}
export function startFrameScheduler(video: HTMLVideoElement, budget: AdaptiveBudget, analyze: (timestamp: number) => Promise<void>, fail: (message: string) => void) {
  let stopped = false, busy = false, callback = 0, lastSent = -Infinity, lastVideoTime = -1, busySince = 0, lastNewFrame = performance.now();
  const useVideoCallback = typeof video.requestVideoFrameCallback === 'function';
  const schedule = () => { if (!stopped) callback = useVideoCallback ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(tick); };
  const tick = () => {
    if (stopped) return;
    const now = performance.now();
    if (video.currentTime !== lastVideoTime) lastNewFrame = now;
    if (!busy && video.readyState >= 2 && video.currentTime !== lastVideoTime && now - lastSent >= 1000 / budget.fps) {
      busy = true; busySince = now; lastVideoTime = video.currentTime; lastSent = now;
      void analyze(now).catch(error => { if (!stopped) fail(error instanceof Error ? error.message : 'Phân tích bị gián đoạn.'); }).finally(() => { busy = false; });
    }
    schedule();
  };
  const watchdog = setInterval(() => {
    if (!stopped && ((busy && performance.now() - busySince > 10000) || performance.now() - lastNewFrame > 5000)) fail('Camera hoặc mô hình không phản hồi. Bật lại camera để thử lại.');
  }, 1000);
  schedule();
  return () => { stopped = true; clearInterval(watchdog); if (useVideoCallback) video.cancelVideoFrameCallback(callback); else cancelAnimationFrame(callback); };
}
