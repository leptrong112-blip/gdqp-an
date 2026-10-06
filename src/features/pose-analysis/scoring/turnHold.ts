import type { MotionBufferFrame } from '../pipeline/motionBuffer';
import { mad, median } from '../pipeline/geometry';

/** Shared observed final hold, independent of camera frame rate. */
export function turnHoldMs(frames: readonly MotionBufferFrame[], baseline: number, target: number, tolerance: number): number {
  if (frames.length < 3) return 0;
  const values = frames.map(f => ((f.bodyYawDeg - baseline - target + 180) % 360 + 360) % 360 - 180);
  const smooth = values.map((_, i) => median(values.slice(Math.max(0, i - 1), Math.min(values.length, i + 2))));
  const last = frames.length - 1;
  let first = last;
  for (let i = last; i >= 0; i--) {
    const f = frames[i];
    if (!f.isReliable || !Number.isFinite(f.bodyYawDeg) || !Number.isFinite(f.timestampMs) || !Number.isFinite(f.confidence) || f.confidence < .6 ||
      !Number.isFinite(smooth[i]) || Math.abs(smooth[i]) > tolerance ||
      (i < last && (frames[i + 1].timestampMs - f.timestampMs > 250 || frames[i + 1].timestampMs <= f.timestampMs)) ||
      mad(smooth.slice(i)) > 8) break;
    first = i;
  }
  return last - first >= 2 ? frames[last].timestampMs - frames[first].timestampMs : 0;
}
