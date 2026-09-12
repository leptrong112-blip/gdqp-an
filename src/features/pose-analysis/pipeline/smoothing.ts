import { POSE_CONFIG as C } from '../config';
import type { CanonicalPoseFrame, Landmark, LandmarkName, Vec3 } from '../types';
export class LandmarkSmoother {
  private points = new Map<LandmarkName, { point: Landmark; time: number }>();
  reset() { this.points.clear(); }
  apply(frame: CanonicalPoseFrame): CanonicalPoseFrame {
    const landmarks: CanonicalPoseFrame['landmarks'] = {};
    const names = new Set([...this.points.keys(), ...Object.keys(frame.landmarks) as LandmarkName[]]);
    for (const name of names) {
      const p = frame.landmarks[name], previous = this.points.get(name);
      if (!p) {
        if (previous && frame.timestampMs - previous.time <= C.expiryMs) landmarks[name] = previous.point;
        else this.points.delete(name);
        continue;
      }
      let point = p;
      if (previous && frame.timestampMs > previous.time && frame.timestampMs - previous.time <= C.expiryMs) {
        const alpha = (1 - Math.exp(-(frame.timestampMs - previous.time) / C.smoothingMs)) * p.confidence;
        const mix = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + (b.x - a.x) * alpha, y: a.y + (b.y - a.y) * alpha, z: a.z + (b.z - a.z) * alpha });
        point = { ...p, image: mix(previous.point.image, p.image), world: p.world && previous.point.world ? mix(previous.point.world, p.world) : p.world };
      }
      this.points.set(name, { point, time: frame.timestampMs }); landmarks[name] = point;
    }
    return { ...frame, landmarks };
  }
}
