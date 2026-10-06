import type { CanonicalPoseFrame, FeatureSample, SaluteProgress } from '../types';
import { distance } from './geometry';
import { usable } from './confidenceFilter';
import { stableStaticHold } from './staticHold';
import { handFeatures } from './saluteHand';

/** Evidence/sequence gate, not a new military rubric. Never grade speed or exact path. */
export class SaluteSequenceTracker {
  private baseline?: { y: number; scale: number };
  private progress: SaluteProgress = this.empty();
  private observations: { t: number; rise: number; x: number; y: number }[] = [];
  private stableSamples: FeatureSample[] = [];
  private handPositions: { t: number; x: number; y: number }[] = [];
  private heldSince?: number;
  private empty(): SaluteProgress { return { state: 'ATTENTION_READY', stableMs: 0, motionObserved: false, observationCount: 0, wristRise: 0, wristVelocity: 0 }; }
  reset() { this.baseline = undefined; this.progress = this.empty(); this.observations = []; this.stableSamples = []; this.handPositions = []; this.heldSince = undefined; }
  begin(frame: CanonicalPoseFrame) {
    this.reset();
    const p = frame.landmarks, wrist = p.rightWrist, shoulder = p.rightShoulder, hip = p.rightHip;
    if ([wrist, shoulder, hip].every(usable)) {
      const scale = distance({ ...shoulder!.image, x: shoulder!.image.x * frame.aspectRatio, z: 0 }, { ...hip!.image, x: hip!.image.x * frame.aspectRatio, z: 0 });
      if (scale > .02) this.baseline = { y: wrist!.image.y, scale };
    }
    this.progress = { ...this.progress, state: 'COMMAND', commandMs: frame.timestampMs };
  }
  pause() { this.heldSince = undefined; this.stableSamples = []; this.handPositions = []; this.progress.stableMs = 0; }
  get snapshot(): SaluteProgress { return { ...this.progress }; }
  get timedOut() { return (this.observations.at(-1)?.t ?? 0) - (this.progress.commandMs ?? 0) > 15000; }
  update(frame: CanonicalPoseFrame, sample: FeatureSample | undefined, bodyReady: boolean): boolean {
    const p = frame.landmarks, wrist = p.rightWrist, elbow = p.rightElbow;
    const t = frame.timestampMs, prev = this.observations.at(-1);
    if (!this.baseline || !usable(wrist) || !usable(elbow) || !sample || t <= (prev?.t ?? this.progress.commandMs ?? t)) { this.pause(); return false; }
    const rise = (this.baseline.y - wrist.image.y) / this.baseline.scale;
    const observation = { t, rise, x: wrist.image.x * frame.aspectRatio, y: wrist.image.y };
    this.observations.push(observation);
    // Bounded, actual observations only. A jump from the thigh straight to the head is not a trajectory.
    if (this.observations.length > 300) this.observations.shift();
    const intermediate = this.observations.filter(o => o.rise > .15 && o.rise < 1.15);
    const motionObserved = intermediate.some((a, i) => intermediate.slice(i + 1).some(b => b.rise - a.rise > .12 && b.t - a.t <= 500));
    this.progress = { ...this.progress, state: 'TRANSITION', observationCount: this.observations.length,
      motionObserved, wristRise: rise, wristVelocity: prev ? (rise - prev.rise) * 1000 / (t - prev.t) : 0,
      elbowAngle: sample.values.rightElbowAngle?.value, wristHeadDistance: sample.values.rightWristHeadDistance?.value,
      firstMovementMs: this.progress.firstMovementMs ?? (rise > .15 ? t : undefined), hand: handFeatures(frame),
    };
    if (this.observations.length > 2) {
      const path = this.observations.slice(-20);
      const travelled = path.slice(1).reduce((sum, b, i) => sum + Math.hypot(b.x - path[i].x, b.y - path[i].y), 0);
      this.progress.pathSmoothness = travelled > 0 ? Math.hypot(path.at(-1)!.x - path[0].x, path.at(-1)!.y - path[0].y) / travelled : 1;
    }
    if (!motionObserved || !bodyReady) { this.pause(); return false; }
    this.progress.arrivalMs ??= t;
    this.progress.state = this.progress.hand?.available ? 'HAND_ACQUIRED' : 'TRANSITION';
    if (prev && t - prev.t > 250) this.pause();
    this.heldSince ??= t;
    this.stableSamples.push(sample);
    this.stableSamples = this.stableSamples.filter(s => t - s.timestampMs <= 1500);
    const hand = frame.saluteHand;
    if (hand && this.progress.hand?.available) {
      this.handPositions.push({ t, x: hand.image[0].x, y: hand.image[0].y });
      this.handPositions = this.handPositions.filter(s => t - s.t <= 800);
    }
    const recent = this.observations.filter(o => t - o.t <= 700);
    const spread = (values: number[]) => Math.max(...values) - Math.min(...values);
    const wristStable = recent.length >= 4 && spread(recent.map(o => o.x)) / this.baseline.scale <= .15 && spread(recent.map(o => o.y)) / this.baseline.scale <= .15;
    const handStable = this.handPositions.length < 3 || (spread(this.handPositions.map(h => h.x)) / this.baseline.scale < .15 && spread(this.handPositions.map(h => h.y)) / this.baseline.scale < .15);
    if (!stableStaticHold(this.stableSamples) || !wristStable || !handStable) {
      this.heldSince = t; this.stableSamples = [sample];
    }
    this.progress.stableMs = t - this.heldSince;
    const ready = this.progress.stableMs >= 700 && this.stableSamples.length >= 6;
    if (ready) this.progress.state = 'STABLE';
    return ready;
  }
  scoring(frame?: CanonicalPoseFrame) { this.progress.state = 'SCORING'; if (frame) this.progress.hand = handFeatures(frame); }
  finalize() { this.progress.state = 'FINALIZED'; return this.snapshot; }
}
