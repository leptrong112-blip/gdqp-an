import type { CanonicalPoseFrame, LandmarkName, Vec3 } from '../types';
import { POSE_CONFIG as C } from '../config';
import { drawSkeleton } from './skeletonRenderer';

/** Display-only easing towards the latest observation, never extrapolated motion/evidence. */
export class VisualSkeleton {
  private shown: CanonicalPoseFrame | null = null;
  private observationTime = -Infinity;
  clear() { this.shown = null; this.observationTime = -Infinity; }
  frame(latest: CanonicalPoseFrame | null, now: number): CanonicalPoseFrame | null {
    // Display age includes inference/transport latency; never scoring evidence.
    if (!latest || latest.personCount !== 1 || now - latest.timestampMs > C.visualFreshnessMs || latest.timestampMs > now + 50) { this.clear(); return null; }
    const previous = this.shown;
    // Filter once per observation, NOT once per display refresh. Otherwise a
    // 60 Hz screen repeatedly converges toward the same noisy 10–30 Hz sample.
    const isNew = latest.timestampMs !== this.observationTime;
    const elapsed = latest.timestampMs-this.observationTime;
    const dt = Math.max(1,elapsed);
    const reset = !previous || elapsed>300 || elapsed<0 || previous.aspectRatio!==latest.aspectRatio;
    const p=latest.landmarks;
    const shoulder=p.leftShoulder?.image,hip=p.leftHip?.image;
    const bodyScale=shoulder&&hip?Math.hypot((shoulder.x-hip.x)*latest.aspectRatio,shoulder.y-hip.y):.22;
    const mix = (a: Vec3, b: Vec3): Vec3 => {
      if (!isNew && !reset) return {...a};
      const travel=Math.hypot((b.x-a.x)*latest.aspectRatio,b.y-a.y)/Math.max(.05,bodyScale);
      // Body-relative thresholds work at different camera distances. Large real
      // raises snap immediately; small standing jitter gets a 100 ms low-pass.
      const tau=travel<.08?100:travel<.2?35:0;
      const weight=reset||tau===0?1:1-Math.exp(-dt/tau);
      return { x:a.x+(b.x-a.x)*weight, y:a.y+(b.y-a.y)*weight, z:a.z+(b.z-a.z)*weight };
    };
    const landmarks: CanonicalPoseFrame['landmarks'] = {};
    for (const [key, point] of Object.entries(latest.landmarks)) {
      const name = key as LandmarkName, old = previous?.landmarks[name];
      if (point) landmarks[name] = { ...point, image: old && previous?.aspectRatio === latest.aspectRatio ? mix(old.image, point.image) : { ...point.image } };
    }
    const hand = latest.saluteHand;
    const oldHand = previous?.saluteHand;
    this.shown = { ...latest, landmarks, saluteHand: hand ? { ...hand, image: hand.image.map((p, i) => oldHand?.image[i] ? mix(oldHand.image[i], p) : { ...p }) } : undefined };
    this.observationTime = latest.timestampMs;
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
