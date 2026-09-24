import { POSE_CONFIG } from '../config';
import type { CanonicalPoseFrame, Landmark, LandmarkName } from '../types';
import { distance, median } from './geometry';

const C = POSE_CONFIG.outliers;
const TORSO = ['leftShoulder', 'rightShoulder', 'leftHip', 'rightHip'] as const;
const BONES: readonly (readonly [LandmarkName, LandmarkName])[] = [
  ['leftShoulder', 'leftElbow'], ['leftElbow', 'leftWrist'],
  ['rightShoulder', 'rightElbow'], ['rightElbow', 'rightWrist'],
  ['leftHip', 'leftKnee'], ['leftKnee', 'leftAnkle'],
  ['rightHip', 'rightKnee'], ['rightKnee', 'rightAnkle'],
];
type Observation = { point: Landmark; time: number };

/** Conservative rejection, never snapping a joint into a fabricated pose. */
export class LandmarkOutlierFilter {
  private previous?: CanonicalPoseFrame;
  private accepted = new Map<LandmarkName, Observation>();
  private pending = new Map<LandmarkName, Observation>();
  private lengths = new Map<LandmarkName, { samples: number[]; time: number }>();

  reset() {
    this.previous = undefined;
    this.accepted.clear(); this.pending.clear(); this.lengths.clear();
  }

  apply(frame: CanonicalPoseFrame): { frame: CanonicalPoseFrame; rejected: Set<LandmarkName> } {
    const rejected = new Set<LandmarkName>();
    if (frame.personCount !== 1) {
      this.reset();
      return { frame: { ...frame, landmarks: {} }, rejected };
    }
    if (this.previous && (frame.timestampMs <= this.previous.timestampMs ||
      frame.timestampMs - this.previous.timestampMs > C.resetAfterMs ||
      Math.abs(frame.aspectRatio - this.previous.aspectRatio) > 1e-3)) this.reset();

    // Use torso height rather than shoulder width, which collapses during turns.
    const torsoLengths = (['left', 'right'] as const).map(side => {
      const a = frame.landmarks[`${side}Shoulder`], b = frame.landmarks[`${side}Hip`];
      return a && b ? Math.hypot((a.image.x - b.image.x) * frame.aspectRatio, a.image.y - b.image.y) : NaN;
    });
    const bodyScale = median(torsoLengths);
    // Subtract coherent body/camera translation before testing individual jumps.
    const moves = TORSO.flatMap(name => {
      const a = this.previous?.landmarks[name], b = frame.landmarks[name];
      return a && b ? [{ x: (b.image.x - a.image.x) * frame.aspectRatio, y: b.image.y - a.image.y }] : [];
    });
    const dx = moves.length >= 3 ? median(moves.map(p => p.x)) : 0;
    const dy = moves.length >= 3 ? median(moves.map(p => p.y)) : 0;
    for (const [key, point] of Object.entries(frame.landmarks)) {
      const name = key as LandmarkName, previous = this.accepted.get(name);
      if (!previous || !Number.isFinite(bodyScale) || bodyScale < 0.03) continue;
      const elapsed = frame.timestampMs - previous.time;
      if (elapsed <= 0 || elapsed > POSE_CONFIG.expiryMs) continue;
      const jump = Math.hypot((point.image.x - previous.point.image.x) * frame.aspectRatio - dx,
        point.image.y - previous.point.image.y - dy);
      const limit = bodyScale * (C.jumpBaseTorsoLengths + C.jumpTorsoLengthsPerSecond * elapsed / 1000);
      if (jump <= limit) continue;
      const candidate = this.pending.get(name);
      const confirmed = candidate && frame.timestampMs - candidate.time <= POSE_CONFIG.expiryMs &&
        Math.hypot((point.image.x - candidate.point.image.x) * frame.aspectRatio,
          point.image.y - candidate.point.image.y) <= bodyScale * C.reacquireRadiusTorsoLengths;
      if (!confirmed) rejected.add(name);
    }

    // Only 3D lengths are constrained: projected 2D limbs legitimately shorten.
    for (const [parent, child] of BONES) {
      const a = frame.landmarks[parent], b = frame.landmarks[child];
      const history = this.lengths.get(child);
      if (!a?.world || !b?.world || !history || history.samples.length < C.minimumBoneSamples ||
        frame.timestampMs - history.time > C.resetAfterMs) continue;
      const ratio = distance(a.world, b.world) / median(history.samples);
      if (ratio >= C.minimumBoneRatio && ratio <= C.maximumBoneRatio) continue;
      const oldA = this.accepted.get(parent)?.point.world, oldB = this.accepted.get(child)?.point.world;
      const moveA = oldA ? distance(a.world, oldA) : 0, moveB = oldB ? distance(b.world, oldB) : 0;
      // Reject the displaced endpoint; ambiguous evidence invalidates both.
      if (moveA >= moveB * 0.8) rejected.add(parent);
      if (moveB >= moveA * 0.8) rejected.add(child);
    }
    for (const [parent, child] of BONES) if (rejected.has(parent)) rejected.add(child);

    const landmarks = { ...frame.landmarks };
    for (const [key, point] of Object.entries(frame.landmarks)) {
      const name = key as LandmarkName;
      if (rejected.has(name)) {
        this.pending.set(name, { point, time: frame.timestampMs });
        delete landmarks[name];
      } else {
        this.accepted.set(name, { point, time: frame.timestampMs });
        this.pending.delete(name);
      }
    }
    for (const [parent, child] of BONES) {
      const a = landmarks[parent]?.world, b = landmarks[child]?.world;
      if (!a || !b) continue;
      const length = distance(a, b);
      if (length < 1e-4) continue;
      const old = this.lengths.get(child);
      const samples = old && frame.timestampMs - old.time <= C.resetAfterMs ? old.samples : [];
      this.lengths.set(child, { samples: [...samples, length].slice(-C.historySize), time: frame.timestampMs });
    }
    this.previous = { ...frame, landmarks };
    return { frame: this.previous, rejected };
  }
}
