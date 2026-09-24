import { POSE_CONFIG as C } from '../config';
import type { CalibrationProfile, CanonicalPoseFrame, DynamicProgress, FeatureSample, LightingMetrics, PoseStage } from '../types';
import { filterLandmarks } from '../pipeline/confidenceFilter';
import { LandmarkSmoother } from '../pipeline/smoothing';
import { LandmarkOutlierFilter } from '../pipeline/outlierFilter';
import { QualityChecker } from '../pipeline/qualityChecks';
import { createCalibration, normalizePose } from '../pipeline/normalization';
import { extractFeatures } from '../pipeline/featureExtraction';
import { evaluate } from '../scoring/scoringEngine';
import { attentionMovement } from '../scoring/attentionMovement';
import { atEaseMovement } from '../scoring/atEaseMovement';
import { turnLeftMovement, turnRightMovement } from '../scoring/turnMovements';
import { saluteMovement } from '../scoring/saluteMovement';
import { distance } from '../pipeline/geometry';
import { TemporalMotionBuffer } from '../pipeline/motionBuffer';
import { DynamicTurnTracker } from '../scoring/dynamicMovementAnalyzer';
import type { MovementDefinition, DrillStepResult, ScoreResult } from '../scoring/scoringTypes';
import { BASIC_DRILL, DRILL_IDS, summarizeDrill } from '../scoring/basicDrill';
import { stableStaticHold } from '../pipeline/staticHold';
import type { SessionCommand, WorkerEvent } from './workerProtocol';
import { javascriptSequenceEngine, type SequenceEngine } from '../scoring/sequenceEngine';

export class SessionProcessor {
  constructor(private sequenceEngine: SequenceEngine = javascriptSequenceEngine) {}
  private quality = new QualityChecker();
  private smoother = new LandmarkSmoother();
  private outliers = new LandmarkOutlierFilter();
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
  private drill = false;
  private drillIndex = 0;
  private drillSteps: DrillStepResult[] = [];

  private finish(result: ScoreResult, events: WorkerEvent[]) {
    if (this.drill) {
      this.drillSteps.push({ movementId: DRILL_IDS[this.drillIndex], result });
      if (result.status === 'scored' && this.drillIndex < BASIC_DRILL.length - 1) {
        this.drillIndex++;
        this.movement = BASIC_DRILL[this.drillIndex];
        this.stage = 'countdown'; this.elapsed = 0; this.samples = [];
        this.lastGood = false; this.failureSince = null;
        this.quality.reset(); this.smoother.reset(); this.outliers.reset();
        return;
      }
      const drill = summarizeDrill(this.drillSteps);
      result = result.status === 'scored'
        ? { status: 'scored', total: Math.round(drill.totalPoints / 3), confidence: Math.min(...this.drillSteps.map(s => s.result.status === 'scored' ? s.result.confidence : 0)),
            criteria: [], corrections: drill.passed ? [] : ['Xem nhận xét từng động tác và luyện lại bước chưa đạt.'], passed: drill.passed, drill }
        : { ...result, drill };
    }
    events.push({ type: 'score', result });
    this.stage = result.status === 'scored' ? 'completed' : 'blocked';
    this.samples = [];
  }

  command(command: SessionCommand) {
    if (command.startsWith('select')) {
      const definitions: Partial<Record<SessionCommand, MovementDefinition>> = {
        selectAttention: attentionMovement, selectAtEase: atEaseMovement, selectTurnLeft: turnLeftMovement,
        selectTurnRight: turnRightMovement, selectSalute: saluteMovement, selectBasicDrill: attentionMovement,
      };
      this.drill = command === 'selectBasicDrill'; this.drillIndex = 0; this.drillSteps = [];
      this.command('reset');
      this.movement = definitions[command] ?? attentionMovement;
      return;
    }
    if (command === 'reset' || command === 'startCalibration' || command === 'startAttempt') {
      this.drillSteps = []; this.drillIndex = 0;
      if (this.drill) this.movement = attentionMovement;
    }
    if (command === 'reset' || command === 'startCalibration') this.outliers.reset();
    if (command === 'reset') { this.quality.reset(); this.smoother.reset(); this.profile = undefined; this.stage = 'quality-check'; }
    if (command === 'startCalibration') { this.profile = undefined; this.smoother.reset(); this.stage = 'calibrating'; }
    if (command === 'startAttempt' && this.profile) this.stage = 'countdown';
    this.calibration = []; this.samples = []; this.motionBuffer.clear(); this.dynamicTracker.reset(); this.elapsed = 0; this.lastGood = false; this.failureSince = null;
  }

  process(raw: CanonicalPoseFrame, lighting: LightingMetrics, inferenceMs: number): WorkerEvent[] {
    if (raw.timestampMs <= this.lastTime) return [];
    const delta = this.lastTime < 0 ? 0 : raw.timestampMs - this.lastTime;
    this.lastTime = raw.timestampMs;
    const events: WorkerEvent[] = [];
    const initialStage = this.stage;
    let message: string | undefined;
    const { frame: filtered, rejected } = this.outliers.apply(filterLandmarks(raw));
    this.smoother.discard(rejected);
    const allowTurn = this.stage === 'scoring' && this.movement.type === 'DYNAMIC';
    // Evaluate current raw evidence, never carried-forward smoothed points.
    const quality = this.quality.check(filtered, lighting, this.profile, {
      allowTurn, assessKnees: this.movement.id === 'atEase' && this.stage === 'scoring',
      relaxedPosture: !!this.movement.robustPosture && (this.stage === 'countdown' || this.stage === 'scoring'),
    });
    const continuous = delta <= C.maximumFrameGapMs;
    if (!continuous) { quality.passed = false; quality.reasons = ['Camera quá chậm hoặc bị gián đoạn. Vui lòng thử lại.']; }
    if (raw.personCount !== 1) this.smoother.reset();
    const smoothed = this.smoother.apply(filtered);
    const good = quality.passed;
    const duration = good && this.lastGood && continuous ? delta : 0;
    const active = ['calibrating', 'countdown', 'scoring'].includes(this.stage);
    const rawGood = quality.checks.every(check => check.passed) && continuous;

    if (active && !good) {
      if (this.movement.type === 'DYNAMIC') this.dynamicTracker.pause();
      if (rawGood) this.failureSince = null;
      else this.failureSince ??= raw.timestampMs;
      if (this.stage === 'calibrating') { this.elapsed = 0; this.calibration = []; }
      if (this.stage === 'countdown' || (this.stage === 'scoring' && this.movement.type !== 'DYNAMIC')) {
        this.elapsed = 0; this.samples = [];
        message = 'Tạm dừng: giữ lại tư thế ổn định. Thời gian giữ sẽ tính lại từ đầu.';
      }
      // Repositioning during preparation is expected; missing/cropped joints are not.
      const onlyRepositioning = this.stage === 'countdown' && quality.checks.filter(c => !c.passed).every(c => c.id === 'stability' || c.id === 'orientation');
      if (onlyRepositioning) this.failureSince = null;
      if ((this.failureSince !== null && raw.timestampMs - this.failureSince > C.maximumQualityGapMs) || !continuous) {
        this.stage = 'blocked'; this.profile = undefined; this.samples = []; this.calibration = []; this.motionBuffer.clear();
        this.finish({ status: 'notScorable', reasons: quality.reasons.length ? quality.reasons : ['Không đủ dữ liệu để theo dõi chuyển động ổn định. Vui lòng đảm bảo toàn thân nằm trong khung hình.'] }, events);
      }
    } else if (good) this.failureSince = null;

    if (this.stage === 'calibrating' && good) {
      this.elapsed += duration; this.calibration.push(filtered);
      if (this.elapsed >= C.calibrationMs) {
        this.profile = createCalibration(this.calibration) ?? undefined;
        this.calibration = []; this.elapsed = 0;
        if (this.profile) { events.push({ type: 'calibrationComplete', profile: this.profile }); this.stage = 'countdown'; }
        else { this.finish({ status: 'notScorable', reasons: ['Chưa hiệu chuẩn được tỷ lệ cơ thể. Giữ toàn thân rõ ràng rồi thử lại.'] }, events); }
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
      // The interval ending at countdown completion belongs to preparation, not scoring.
      this.elapsed += initialStage === 'scoring' ? duration : 0;
      // Short visual holds must never supply missing/rejected joints to scoring.
      const observed = { ...smoothed, landmarks: Object.fromEntries(
        Object.keys(filtered.landmarks).map(name => [name, smoothed.landmarks[name as keyof typeof smoothed.landmarks]]),
      ) };
      const normalized = normalizePose(observed, this.profile);
      if (normalized) {
        const sample = extractFeatures(normalized);
        this.samples.push(sample);
        if (this.movement.type !== 'DYNAMIC' && !stableStaticHold(this.samples)) {
          this.samples = []; this.elapsed = 0;
          message = 'Tư thế còn thay đổi. Giữ yên khoảng 3 giây để chốt kết quả.';
        }
        if (this.movement.type === 'DYNAMIC') {
          // Smoothing is visual assistance, not evidence that intermediate poses occurred.
          const measured = normalizePose(filtered, this.profile);
          const observedYaw = measured ? extractFeatures(measured).values.bodyYaw : undefined;
          const yaw = observedYaw?.value ?? NaN;
          const conf = observedYaw?.confidence ?? 0;
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
            isReliable: Number.isFinite(yaw) && conf >= 0.6,
          });
        }
      }

      if (this.movement.type === 'DYNAMIC') {
        const update = this.dynamicTracker.update(this.elapsed, this.motionBuffer, this.movement);
        dynamicProgress = update.dynamicProgress;
        dynamicRatio = update.progressRatio;
        if (update.isComplete) {
          const result = evaluate(this.movement, { samples: this.samples, validDurationMs: this.elapsed, qualityPassed: good }, this.motionBuffer, this.sequenceEngine);
          this.finish(result, events);
        }
      } else {
        if (this.elapsed >= C.attemptMs) {
          const result = evaluate(this.movement, { samples: this.samples, validDurationMs: this.elapsed, qualityPassed: good });
          this.finish(result, events);
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
        message,
        drillProgress: this.drill ? { index: this.drillIndex, completed: this.drillSteps.filter(s => s.result.status === 'scored').length, total: 3, movementId: DRILL_IDS[this.drillIndex] } : undefined,
      },
    });

    return events;
  }
}
