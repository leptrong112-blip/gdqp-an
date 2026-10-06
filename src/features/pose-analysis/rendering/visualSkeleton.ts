import type { CanonicalPoseFrame, LandmarkName, Vec3 } from '../types';
import { drawSkeleton } from './skeletonRenderer';

/** Display-only easing towards the latest observation, never extrapolated motion/evidence. */
export class VisualSkeleton {
  private shown: CanonicalPoseFrame | null = null;
  private lastPaint = 0;
  clear() { this.shown = null; this.lastPaint = 0; }
  frame(latest: CanonicalPoseFrame | null, now: number): CanonicalPoseFrame | null {
    if (!latest || latest.personCount !== 1 || now - latest.timestampMs > 250 || latest.timestampMs > now + 50) { this.clear(); return null; }
    const previous = this.shown;
    const alpha = previous ? 1 - Math.exp(-Math.max(0, now - this.lastPaint) / 24) : 1;
    const mix = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + (b.x-a.x)*alpha, y: a.y + (b.y-a.y)*alpha, z: a.z + (b.z-a.z)*alpha });
    const landmarks: CanonicalPoseFrame['landmarks'] = {};
    for (const [key, point] of Object.entries(latest.landmarks)) {
      const name = key as LandmarkName, old = previous?.landmarks[name];
      if (point) landmarks[name] = { ...point, image: old && previous?.aspectRatio === latest.aspectRatio ? mix(old.image, point.image) : { ...point.image } };
    }
    const hand = latest.saluteHand;
    const oldHand = previous?.saluteHand;
    this.shown = { ...latest, landmarks, saluteHand: hand ? { ...hand, image: hand.image.map((p, i) => oldHand?.image[i] ? mix(oldHand.image[i], p) : { ...p }) } : undefined };
    this.lastPaint = now;
    return this.shown;
  }
}

export function startSkeletonRenderer(canvas: HTMLCanvasElement, latest: () => CanonicalPoseFrame | null,
  metrics: (fps: number, age: number | undefined) => void) {
  const visual = new VisualSkeleton();
  let stopped = false, callback = 0, count = 0, since = performance.now();
  const paint = (now: number) => {
    if (stopped) return;
    const observed = latest();
    drawSkeleton(canvas, visual.frame(observed, now));
    count++;
    if (now - since >= 1000) { metrics(count * 1000 / (now - since), observed ? Math.max(0, now - observed.timestampMs) : undefined); since = now; count = 0; }
    callback = requestAnimationFrame(paint);
  };
  callback = requestAnimationFrame(paint);
  return () => { stopped = true; cancelAnimationFrame(callback); visual.clear(); drawSkeleton(canvas, null); };
}
