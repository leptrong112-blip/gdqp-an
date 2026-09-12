import { POSE_CONFIG as C } from '../config';
import type { CalibrationProfile, CanonicalPoseFrame, DynamicProgress, FeatureSample, LightingMetrics, PoseStage } from '../types';
import { filterLandmarks } from '../pipeline/confidenceFilter';
import { LandmarkSmoother } from '../pipeline/smoothing';
import { QualityChecker } from '../pipeline/qualityChecks';
import { createCalibration, normalizePose } from '../pipeline/normalization';
import { extractFeatures } from '../pipeline/featureExtraction';
import { evaluate } from '../scoring/scoringEngine';
import { attentionMovement } from '../scoring/attentionMovement';
import { atEaseMovement } from '../scoring/atEaseMovement';
import { turnLeftMovement, turnRightMovement } from '../scoring/turnMovements';
import { distance } from '../pipeline/geometry';
import { TemporalMotionBuffer } from '../pipeline/motionBuffer';
import { DynamicTurnTracker } from '../scoring/dynamicMovementAnalyzer';
import type { MovementDefinition } from '../scoring/scoringTypes';
import type { SessionCommand, WorkerEvent } from './workerProtocol';

export class SessionProcessor {
  private quality = new QualityChecker();
  private smoother = new LandmarkSmoother();
  private stage: PoseStage = 'quality-check';
  private profile?: CalibrationProfile;
  private movement: MovementDefinition = attentionMovement;
  private calibration: CanonicalPoseFrame[] = [];
  private samples: FeatureSample[] = [];
  private motionBuffer = new TemporalMotionBuffer(150);
  private dynamicTracker = new DynamicTurnTracker();
  private elapsed = 0;
  private lastTime = -1;
  private lastGood = false;
  private failureSince: number | null = null;

  command(command: SessionCommand) {
    if (command === 'selectAttention') { this.movement = attentionMovement; this.motionBuffer.clear(); this.dynamicTracker.reset(); return; }
    if (command === 'selectAtEase') { this.movement = atEaseMovement; this.motionBuffer.clear(); this.dynamicTracker.reset(); return; }
    if (command === 'selectTurnLeft') { this.movement = turnLeftMovement; this.motionBuffer.clear(); this.dynamicTracker.reset(); return; }
    if (command === 'selectTurnRight') { this.movement = turnRightMovement; this.motionBuffer.clear(); this.dynamicTracker.reset(); return; }
    if (command === 'reset') { this.quality.reset(); this.smoother.reset(); this.profile = undefined; this.stage = 'quality-check'; }
    if (command === 'startCalibration') { this.profile = undefined; this.smoother.reset(); this.stage = 'calibrating'; }
    if (command === 'startAttempt' && this.profile) this.stage = 'countdown';
    this.calibration = []; this.samples = []; this.motionBuffer.clear(); this.dynamicTracker.reset(); this.elapsed = 0; this.lastGood = false; this.failureSince = null;
  }

  process(raw: CanonicalPoseFrame, lighting: LightingMetrics, inferenceMs: number): WorkerEvent[] {
    if (raw.timestampMs <= this.lastTime) return [];
    const delta = this.lastTime < 0 ? 0 : raw.timestampMs - this.lastTime;
    this.lastTime = raw.timestampMs;
    const events: WorkerEvent[] = [], filtered = filterLandmarks(raw);
    const allowTurn = this.stage === 'scoring' && this.movement.type === 'DYNAMIC';
    // Evaluate current raw evidence, never carried-forward smoothed points.
    const quality = this.quality.check(filtered, lighting, this.profile, { allowTurn });
    const continuous = delta <= C.maximumFrameGapMs;
    if (!continuous) { quality.passed = false; quality.reasons = ['Camera quá chậm hoặc bị gián đoạn. Vui lòng thử lại.']; }
    if (raw.personCount !== 1) this.smoother.reset();
    const smoothed = this.smoother.apply(filtered);
    const good = quality.passed;
    const duration = good && this.lastGood && continuous ? delta : 0;
    const active = ['calibrating', 'countdown', 'scoring'].includes(this.stage);
    const rawGood = quality.checks.every(check => check.passed) && continuous;

    if (active && !good) {
      if (rawGood) this.failureSince = null;
      else this.failureSince ??= raw.timestampMs;
      if (this.stage === 'calibrating') { this.elapsed = 0; this.calibration = []; }
      if ((this.failureSince !== null && raw.timestampMs - this.failureSince > C.maximumQualityGapMs) || !continuous) {
        this.stage = 'blocked'; this.profile = undefined; this.samples = []; this.calibration = []; this.motionBuffer.clear();
        events.push({ type: 'score', result: { status: 'notScorable', reasons: quality.reasons.length ? quality.reasons : ['Không đủ dữ liệu để theo dõi chuyển động ổn định. Vui lòng đảm bảo toàn thân nằm trong khung hình.'] } });
      }
    } else if (good) this.failureSince = null;

    if (this.stage === 'calibrating' && good) {
      this.elapsed += duration; this.calibration.push(filtered);
      if (this.elapsed >= C.calibrationMs) {
        this.profile = createCalibration(this.calibration) ?? undefined;
        this.calibration = []; this.elapsed = 0;
        if (this.profile) { events.push({ type: 'calibrationComplete', profile: this.profile }); this.stage = 'countdown'; }
        else { this.stage = 'blocked'; events.push({ type: 'score', result: { status: 'notScorable', reasons: ['Chưa hiệu chuẩn được tỷ lệ cơ thể. Giữ toàn thân rõ ràng rồi thử lại.'] } }); }
      }
    } else if (this.stage === 'countdown' && good) {
      this.elapsed += duration;
      if (this.elapsed >= C.countdownMs) {
        this.stage = 'scoring';
        this.elapsed = 0;
        this.samples = [];
        this.motionBuffer.clear();
        this.dynamicTracker.reset();
      }
    }

    let dynamicProgress: DynamicProgress | undefined;
    let dynamicRatio = 0;

    if (this.stage === 'scoring' && good && this.profile) {
      this.elapsed += duration;
      const normalized = normalizePose(smoothed, this.profile);
      if (normalized) {
        const sample = extractFeatures(normalized);
        this.samples.push(sample);
        if (this.movement.type === 'DYNAMIC') {
          const yaw = sample.values.bodyYaw?.value ?? 0;
          const conf = sample.values.bodyYaw?.confidence ?? 0.8;
          let leftWristDist = sample.values.leftWristHipDistance?.value;
          let rightWristDist = sample.values.rightWristHipDistance?.value;
          const w = normalized.worldBody;
          if (w.leftShoulder && w.rightShoulder) {
            const span = distance(w.leftShoulder, w.rightShoulder);
            if (span > 1e-4) {
              if (w.leftHip && w.leftWrist) leftWristDist = distance(w.leftWrist, w.leftHip) / span;
              if (w.rightHip && w.rightWrist) rightWristDist = distance(w.rightWrist, w.rightHip) / span;
            }
          }
          this.motionBuffer.push({
            timestampMs: raw.timestampMs,
            bodyYawDeg: yaw,
            confidence: conf,
            torsoTilt: sample.values.torsoTilt?.value,
            shoulderTilt: sample.values.shoulderTilt?.value,
            leftWristHipDistance: leftWristDist,
            rightWristHipDistance: rightWristDist,
            isReliable: conf >= 0.5,
          });
        }
      }

      if (this.movement.type === 'DYNAMIC') {
        const update = this.dynamicTracker.update(raw.timestampMs, this.motionBuffer, this.movement);
        dynamicProgress = update.dynamicProgress;
        dynamicRatio = update.progressRatio;
        if (update.isComplete) {
          const result = evaluate(this.movement, { samples: this.samples, validDurationMs: this.elapsed, qualityPassed: good }, this.motionBuffer);
          events.push({ type: 'score', result });
          this.stage = result.status === 'scored' ? 'completed' : 'blocked';
          this.samples = [];
        }
      } else {
        if (this.elapsed >= C.attemptMs) {
          const result = evaluate(this.movement, { samples: this.samples, validDurationMs: this.elapsed, qualityPassed: good });
          events.push({ type: 'score', result });
          this.stage = result.status === 'scored' ? 'completed' : 'blocked';
          this.samples = [];
        }
      }
    }

    this.lastGood = good;
    const target = this.stage === 'calibrating' ? C.calibrationMs : this.stage === 'countdown' ? C.countdownMs : C.attemptMs;
    const progress = (this.stage === 'scoring' && this.movement.type === 'DYNAMIC')
      ? dynamicRatio
      : Math.min(1, this.elapsed / target);

    events.push({
      type: 'analysis',
      snapshot: {
        frame: smoothed,
        quality,
        stage: this.stage,
        progress,
        inferenceMs,
        inferenceFps: delta > 0 ? 1000 / delta : 0,
        dynamicProgress,
      },
    });

    return events;
  }
}
