import { POSE_CONFIG as C } from '../config';
import type { CalibrationProfile, CanonicalPoseFrame, DualMeasurement, DynamicProgress, FeatureSample, LightingMetrics, PoseStage } from '../types';
import { filterLandmarks } from '../pipeline/confidenceFilter';
import { LandmarkSmoother } from '../pipeline/smoothing';
import { LandmarkOutlierFilter } from '../pipeline/outlierFilter';
import { QualityChecker } from '../pipeline/qualityChecks';
import { createCalibration, normalizePose, measurements } from '../pipeline/normalization';
import { extractFeatures } from '../pipeline/featureExtraction';
import { extractDualMeasurements } from '../diagnostics/dualMeasurement';
import { evaluate } from '../scoring/scoringEngine';
import { attentionMovement } from '../scoring/attentionMovement';
import { atEaseMovement } from '../scoring/atEaseMovement';
import { turnLeftMovement, turnRightMovement } from '../scoring/turnMovements';
import { saluteMovement } from '../scoring/saluteMovement';
import { distance } from '../pipeline/geometry';
import { TemporalMotionBuffer } from '../pipeline/motionBuffer';
import { DynamicTurnTracker } from '../scoring/dynamicMovementAnalyzer';
import type { MovementDefinition, DrillStepResult, ScoreResult, PreconditionScore } from '../scoring/scoringTypes';
import { BASIC_DRILL, DRILL_IDS, summarizeDrill } from '../scoring/basicDrill';
import { stableStaticHold } from '../pipeline/staticHold';
import { saluteHandMetrics } from '../pipeline/saluteHand';
import { measureTurnFeet } from '../scoring/turnFeet';
import type { SessionCommand, WorkerEvent } from './workerProtocol';
import { javascriptSequenceEngine, type SequenceEngine } from '../scoring/sequenceEngine';
import { freezeSnapshot, poseNowMs, type PoseAttemptContext, type PoseFinalTiming } from './attemptTiming';
import { commandFlow, preparationDefinition, postureReadiness, PREPARATION_STABLE_MS, MOVEMENT_SETTLE_MS, type PreconditionStatus } from './commandFlow';
import { SaluteSequenceTracker } from '../pipeline/saluteSequence';

export class SessionProcessor {
  get needsHandTracking() { return this.movement.id === 'salute' && ['transition', 'scoring'].includes(this.stage); }
  get isFinalized() { return this.finalized; }
  get attemptId() { return this.attempt?.id; }
  get preparationMovementId() { return preparationDefinition(this.movement.id as import('../types').MovementId).id as 'attention' | 'atEase'; }
  get expectedPostureId() {
    return ['quality-check', 'calibrating', 'waiting-precondition', 'precondition-scoring', 'countdown'].includes(this.stage) ? this.preparationMovementId : this.movement.id;
  }
  constructor(private sequenceEngine: SequenceEngine = javascriptSequenceEngine, private now = poseNowMs) {}
  private finalized = false;
  private attempt?: PoseAttemptContext;
  private qualityReadyAtMs?: number;
  private countdownFinishedAtMs?: number;
  private windowFinishedAtMs?: number;
  private finalizationStartedAtMs?: number;
  private inferenceMs = 0;
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
  private saluteTracker = new SaluteSequenceTracker();
  private elapsed = 0;
  private lastTime = -1;
  private lastGood = false;
  private failureSince: number | null = null;
  private drill = false;
  private drillIndex = 0;
  private drillSteps: DrillStepResult[] = [];
  private preconditionScoring = false;
  private precondition?: PreconditionScore;
  private preparationSamples: FeatureSample[] = [];
  private preparationStatus: PreconditionStatus = 'INSUFFICIENT_EVIDENCE';
  private preparationSince: number | null = null;
  private preparationHeldMs = 0;
  private preparationLossSince: number | null = null;
  private transitionStartedAtMs?: number;
  private transitionHeldMs = 0;
  private targetReadyHeldMs = 0;
  private lastTargetReady = false;

  private resetTransitionHold() {
    this.transitionHeldMs = 0; this.targetReadyHeldMs = 0; this.lastTargetReady = false;
  }

  private resetPreparationHold() {
    this.preparationSince = null; this.preparationSamples = [];
    this.preparationHeldMs = 0; this.preparationLossSince = null;
  }

  private waitForPreparation() {
    this.stage = 'waiting-precondition'; this.elapsed = 0; this.samples = []; this.preparationSamples = [];
    this.resetPreparationHold(); this.preparationStatus = 'INSUFFICIENT_EVIDENCE';
    this.transitionStartedAtMs = undefined;
    this.resetTransitionHold();
    this.motionBuffer.clear(); this.dynamicTracker.reset(); this.failureSince = null;
    this.saluteTracker.reset();
  }

  private recordMotion(frame: CanonicalPoseFrame) {
    if (!this.profile) return;
    const normalized = normalizePose(frame, this.profile, true);
    if (!normalized) return;
    const sample = extractFeatures(normalized, true);
    const yaw = sample.values.bodyYaw;
    const w = normalized.worldBody;
    const span = w.leftShoulder && w.rightShoulder ? distance(w.leftShoulder, w.rightShoulder) : 0;
    const position = (name: keyof CanonicalPoseFrame['landmarks']) => {
      const p = frame.landmarks[name];
      return p ? { x: p.image.x * frame.aspectRatio / this.profile!.torsoLength, y: p.image.y / this.profile!.torsoLength } : undefined;
    };
    const leftHip = position('leftHip'), rightHip = position('rightHip');
    const leftShoulder = position('leftShoulder'), rightShoulder = position('rightShoulder');
    const imageTorsoTilt = leftHip && rightHip && leftShoulder && rightShoulder
      ? Math.atan2(leftShoulder.x + rightShoulder.x - leftHip.x - rightHip.x,
        leftHip.y + rightHip.y - leftShoulder.y - rightShoulder.y) * 180 / Math.PI : undefined;
    this.motionBuffer.push({
      timestampMs: frame.timestampMs,
      bodyYawDeg: yaw?.value ?? NaN,
      confidence: yaw?.confidence ?? 0,
      torsoTilt: sample.values.torsoTilt?.value,
      imageTorsoTilt,
      ...measureTurnFeet(normalized),
      shoulderTilt: sample.values.shoulderTilt?.value,
      leftWristHipDistance: span > 1e-4 && w.leftHip && w.leftWrist ? distance(w.leftWrist, w.leftHip) / span : undefined,
      rightWristHipDistance: span > 1e-4 && w.rightHip && w.rightWrist ? distance(w.rightWrist, w.rightHip) / span : undefined,
      isReliable: !!yaw && Number.isFinite(yaw.value) && yaw.confidence >= 0.6,
      imageRoot: leftHip && rightHip ? { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 } : undefined,
      leftHeelPosition: position('leftHeel'), rightHeelPosition: position('rightHeel'),
      leftToePosition: position('leftFootIndex'), rightToePosition: position('rightFootIndex'),
    });
  }

  private finish(result: ScoreResult, events: WorkerEvent[]) {
    if (this.finalized) return;
    if (this.movement.id === 'salute') result = { ...result, saluteSequence: this.saluteTracker.finalize() };
    result = freezeSnapshot(result);
    if (this.drill) {
      this.drillSteps.push(freezeSnapshot({ movementId: DRILL_IDS[this.drillIndex], result }));
      if (result.status === 'scored' && this.drillIndex < BASIC_DRILL.length - 1) {
        this.drillIndex++;
        this.movement = BASIC_DRILL[this.drillIndex];
        this.waitForPreparation();
        this.motionBuffer.clear(); this.dynamicTracker.reset();
        this.lastGood = false; this.failureSince = null;
        this.quality.reset(); this.smoother.reset(); this.outliers.reset();
        this.windowFinishedAtMs = undefined; this.finalizationStartedAtMs = undefined;
        return;
      }
      const drill = summarizeDrill(this.drillSteps);
      const unknown = this.drillSteps.some(s => s.result.status === 'scored' && s.result.assessment === 'incomplete');
      result = result.status === 'scored'
        ? { status: 'scored', total: Math.round(drill.totalPoints / 3), confidence: Math.min(...this.drillSteps.map(s => s.result.status === 'scored' ? s.result.confidence : 0)),
            criteria: [], corrections: drill.passed ? [] : ['Xem nhận xét từng động tác và luyện lại bước chưa đạt.'], passed: drill.passed,
            assessment: unknown ? 'incomplete' : drill.passed ? 'pass' : 'fail', drill }
        : { ...result, drill };
    }
    this.finalized = true;
    if (this.precondition && !this.drill) result = { ...result, precondition: this.precondition };
    result = freezeSnapshot(result);
    const finalizedAtMs = this.now();
    const frameProcessedAtMs = this.finalizationStartedAtMs ?? finalizedAtMs;
    const windowFinishedAtMs = this.windowFinishedAtMs ?? frameProcessedAtMs;
    const timing: PoseFinalTiming = freezeSnapshot({
      attemptStartedAtMs: this.attempt?.startedAtMs ?? this.qualityReadyAtMs ?? frameProcessedAtMs,
      qualityReadyAtMs: this.qualityReadyAtMs,
      countdownFinishedAtMs: this.countdownFinishedAtMs,
      scoringWindowFinishedAtMs: windowFinishedAtMs,
      finalFrameProcessedAtMs: frameProcessedAtMs,
      resultFinalizedAtMs: finalizedAtMs,
      inferenceMs: this.inferenceMs,
      finalizationMs: Math.max(0, finalizedAtMs - frameProcessedAtMs),
      processingLatencyMs: Math.max(0, finalizedAtMs - windowFinishedAtMs),
    });
    events.push({ type: 'commandCue', command: 'THÔI', attemptId: this.attempt?.id, timestampMs: finalizedAtMs });
    events.push({ type: 'score', result, attemptId: this.attempt?.id, timing });
    this.stage = result.status === 'scored' ? 'completed' : 'blocked';
    this.samples = [];
  }

  command(command: SessionCommand, attempt?: PoseAttemptContext) {
    if (command === 'enablePreconditionScoring' || command === 'disablePreconditionScoring') {
      this.preconditionScoring = command === 'enablePreconditionScoring'; return;
    }
    if (attempt && attempt.id !== this.attempt?.id) {
      this.attempt = { ...attempt };
      this.qualityReadyAtMs = undefined; this.countdownFinishedAtMs = undefined;
    }
    this.finalized = false; this.windowFinishedAtMs = undefined; this.finalizationStartedAtMs = undefined;
    this.transitionStartedAtMs = undefined;
    this.resetTransitionHold();
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
      this.precondition = undefined; this.resetPreparationHold();
      this.drillSteps = []; this.drillIndex = 0;
      if (this.drill) this.movement = attentionMovement;
    }
    if (command === 'reset' || command === 'startCalibration') this.outliers.reset();
    if (command === 'reset') { this.quality.reset(); this.smoother.reset(); this.profile = undefined; this.stage = 'quality-check'; }
    if (command === 'startCalibration') { this.profile = undefined; this.smoother.reset(); this.stage = 'calibrating'; }
    if (command === 'startAttempt' && this.profile) this.waitForPreparation();
    this.calibration = []; this.samples = []; this.motionBuffer.clear(); this.dynamicTracker.reset(); this.elapsed = 0; this.lastGood = false; this.failureSince = null; this.lastTime = -1;
    this.saluteTracker.reset();
  }

  process(raw: CanonicalPoseFrame, lighting: LightingMetrics, inferenceMs: number): WorkerEvent[] {
    if (this.finalized) return [];
    if (!Number.isFinite(raw.timestampMs) || raw.timestampMs < 0 || raw.timestampMs <= this.lastTime) return [];
    const delta = this.lastTime < 0 ? 0 : raw.timestampMs - this.lastTime;
    this.lastTime = raw.timestampMs;
    this.inferenceMs = inferenceMs;
    const events: WorkerEvent[] = [];
    const initialStage = this.stage;
    let message: string | undefined;
    const { frame: filtered, rejected } = this.outliers.apply(filterLandmarks(raw));
    this.smoother.discard(rejected);
    const allowTurn = this.stage === 'scoring' && this.movement.type === 'DYNAMIC';
    // Evaluate current raw evidence, never carried-forward smoothed points.
    const preparing = ['quality-check', 'calibrating', 'waiting-precondition', 'precondition-scoring', 'countdown'].includes(this.stage);
    const beforeCommand = preparing;
    const prepDefinition = preparationDefinition(this.movement.id as import('../types').MovementId);
    const quality = this.quality.check(filtered, lighting, this.profile, {
      allowTurn, assessKnees: (preparing ? prepDefinition.id : this.movement.id) === 'atEase',
      relaxedPosture: !!this.movement.robustPosture && (this.stage === 'countdown' || this.stage === 'scoring'),
      countdown: this.stage === 'countdown', transition: this.stage === 'transition',
      tolerateBriefLoss: preparing || !!this.movement.robustPosture,
    });
    const continuous = delta <= C.maximumFrameGapMs;
    if (!continuous) { quality.passed = false; quality.reasons = ['Camera quá chậm hoặc bị gián đoạn. Vui lòng thử lại.']; }
    if (raw.personCount !== 1) this.smoother.reset();
    const smoothed = this.smoother.apply(filtered);
    const good = quality.passed;
    const sourceTimeMs = (this.attempt?.frameTimeOriginMs ?? performance.timeOrigin) + raw.timestampMs;
    if (good) this.qualityReadyAtMs ??= sourceTimeMs;
    const duration = good && this.lastGood && continuous ? delta : 0;
    const active = ['calibrating', 'countdown', 'transition', 'precondition-scoring', 'scoring'].includes(this.stage);
    const rawGood = quality.checks.every(check => check.passed) && continuous;
    // Keep the existing terminal snapshot contract without recomputing telemetry.
    const finalEvents = () => {
      events.push({ type: 'analysis', attemptId: this.attempt?.id, snapshot: {
        frame: smoothed, quality, stage: this.stage, progress: 1, inferenceMs,
        inferenceFps: delta > 0 ? 1000 / delta : 0,
        performance: { poseMs: raw.detectorTelemetry?.poseMs ?? inferenceMs, handMs: raw.detectorTelemetry?.handMs },
        saluteProgress: this.movement.id === 'salute' ? this.saluteTracker.snapshot : undefined,
        drillProgress: this.drill ? { index: this.drillIndex, completed: this.drillSteps.filter(s => s.result.status === 'scored').length,
          total: 3, movementId: DRILL_IDS[this.drillIndex] } : undefined,
      } });
      return events;
    };

    if (active && !good) {
      if (this.movement.id === 'salute') this.saluteTracker.pause();
      if (this.movement.type === 'DYNAMIC') this.dynamicTracker.pause();
      if (rawGood) this.failureSince = null;
      else this.failureSince ??= raw.timestampMs;
      if (this.stage === 'calibrating' && (!continuous || raw.personCount !== 1 ||
          quality.checks.some(c=>!c.passed && (c.id==='stability'||c.id==='orientation')) ||
          this.failureSince !== null && raw.timestampMs-this.failureSince > C.maximumQualityGapMs)) {
        this.elapsed = 0; this.calibration = [];
      }
      if (this.stage === 'scoring' && this.movement.type !== 'DYNAMIC') {
        if (!this.movement.robustPosture) { this.elapsed = 0; this.samples = []; }
        message = 'Tạm dừng ghi nhận: camera đang nhận lại khớp. Giữ tư thế; đoạn thiếu dữ liệu không được tính điểm.';
      }
      if (beforeCommand) message = `Đang chờ bạn ổn định vị trí. ${quality.reasons[0] ?? 'Giữ tư thế chuẩn bị và nhìn thẳng camera.'} Chưa bắt đầu động tác.`;
      // Repositioning during preparation is expected; missing/cropped joints are not.
      const onlyRepositioning = ['countdown', 'transition', 'precondition-scoring'].includes(this.stage) && quality.checks.filter(c => !c.passed).every(c => c.id === 'stability' || c.id === 'orientation');
      if (onlyRepositioning) this.failureSince = null;
      if ((this.failureSince !== null && raw.timestampMs - this.failureSince > C.maximumQualityGapMs) || !continuous) {
        if (beforeCommand) {
          // Repositioning/acquisition is not a completed attempt. Keep the camera
          // running, discard interrupted evidence and reacquire without a result.
          if (this.stage === 'countdown' || this.stage === 'precondition-scoring') this.waitForPreparation();
          else this.resetPreparationHold();
        } else {
          this.stage = 'blocked'; this.profile = undefined; this.samples = []; this.calibration = []; this.motionBuffer.clear();
          this.finish({ status: 'notScorable', reasons: quality.reasons.length ? quality.reasons : ['Không đủ dữ liệu để theo dõi chuyển động ổn định. Vui lòng đảm bảo toàn thân nằm trong khung hình.'] }, events);
          return finalEvents();
        }
      }
    } else if (good) this.failureSince = null;

    if (this.stage === 'calibrating' && good) {
      this.elapsed += duration; this.calibration.push(filtered);
      // Slow cameras need a little more time to supply twelve actual observations.
      if (this.elapsed >= C.calibrationMs && this.calibration.length >= 12) {
        this.profile = createCalibration(this.calibration) ?? undefined;
        this.calibration = []; this.elapsed = 0;
        if (this.profile) { events.push({ type: 'calibrationComplete', profile: this.profile }); this.waitForPreparation(); }
        else { message = 'Đang đo lại vị trí đứng. Giữ toàn thân rõ trong hình và ổn định; chưa bắt đầu động tác.'; }
      }
    }

    const provisional = this.profile ?? (() => {
      const m = measurements(filtered);
      return m ? { ...m, baselineJitter: .01, coverage: 1, frontFacing: true, sampleCount: 1 } : undefined;
    })();
    const currentPose = provisional ? normalizePose(filtered, provisional, allowTurn) : undefined;
    const currentSample = currentPose ? extractFeatures(currentPose, allowTurn) : undefined;
    if (preparing) this.preparationStatus = good ? postureReadiness(currentSample, prepDefinition) : 'INSUFFICIENT_EVIDENCE';
    if (this.stage === 'waiting-precondition' || this.stage === 'precondition-scoring') {
      if (this.preparationStatus !== 'READY' || !currentSample) {
        // An isolated landmark spike must not erase an otherwise valid hold.
        // Warmup after a short quality interruption pauses time, never invents samples.
        if (rawGood && postureReadiness(currentSample, prepDefinition) === 'READY') this.preparationLossSince = null;
        else this.preparationLossSince ??= raw.timestampMs;
        if (this.preparationLossSince !== null && raw.timestampMs - this.preparationLossSince > C.maximumQualityGapMs) {
          this.resetPreparationHold(); this.elapsed = 0; this.stage = 'waiting-precondition';
        }
        message = this.preparationStatus === 'WRONG_PRECONDITION' ? `Vui lòng ${prepDefinition.id === 'atEase' ? 'vào tư thế Đứng nghỉ' : 'về tư thế Đứng nghiêm'} để chuẩn bị. Hệ thống vẫn đang chờ, chưa bắt đầu động tác.`
          : `${quality.reasons[0] ?? 'Chưa nhìn rõ đủ thân, tay và chân để xác nhận tư thế chuẩn bị.'} Giữ vị trí để camera nhận lại; không cần làm lại lượt.`;
      } else {
        this.preparationLossSince = null;
        this.preparationSince ??= raw.timestampMs;
        this.preparationSamples.push(currentSample);
        this.preparationHeldMs += ['waiting-precondition', 'precondition-scoring'].includes(initialStage) ? duration : 0;
        if (!stableStaticHold(this.preparationSamples)) { this.preparationSince = raw.timestampMs; this.preparationSamples = [currentSample]; this.preparationHeldMs = 0; }
        const held = this.preparationHeldMs;
        const scorePrep = this.preconditionScoring && !this.drill && prepDefinition.id === 'attention';
        this.elapsed = held;
        if (scorePrep) this.stage = 'precondition-scoring';
        message = scorePrep ? 'Đang ghi nhận riêng tư thế Đứng nghiêm trước động tác. Giữ ổn định; hệ thống sẽ đếm ngược khi đã đủ dữ liệu.'
          : `Đang xác nhận tư thế ${prepDefinition.label}. Giữ ổn định, chờ đếm ngược và khẩu lệnh rồi mới thực hiện.`;
        if (held >= (scorePrep ? C.attemptMs : PREPARATION_STABLE_MS) && this.preparationSamples.length >= (scorePrep ? prepDefinition.minimumSamples : 6)) {
          const scored = scorePrep ? evaluate(prepDefinition, { samples: this.preparationSamples, validDurationMs: held, qualityPassed: true }) : undefined;
          if (!scored || (scored.status === 'scored' && scored.passed)) {
            if (scored?.status === 'scored') this.precondition = freezeSnapshot({ movementId: 'attention', result: scored,
              quality: { confidence: scored.confidence, unassessedPoints: scored.unassessedPoints ?? 0 } });
            this.stage = 'countdown'; this.elapsed = 0; this.resetPreparationHold();
          } else {
            message = scored.status === 'notScorable' ? scored.reasons.join(' ')
              : `Điểm tư thế chuẩn bị chưa đạt. ${scored.corrections.join(' ') || 'Chỉnh tư thế theo hướng dẫn rồi giữ ổn định.'}`;
            this.waitForPreparation();
          }
        }
      }
    } else if (this.stage === 'countdown' && good) {
      if (this.preparationStatus !== 'READY') {
        this.preparationLossSince ??= raw.timestampMs;
        if (raw.timestampMs - this.preparationLossSince > C.maximumQualityGapMs) {
          this.waitForPreparation();
          message = `Giữ lại tư thế ${prepDefinition.label} để chuẩn bị trước khi bắt đầu động tác.`;
        }
      } else this.preparationLossSince = null;
      if (this.stage === 'countdown') {
      if (this.movement.type === 'DYNAMIC') {
        this.recordMotion(filtered);
        // Keep a sampling margin so uneven FPS still retains >=500ms of evidence.
        const readyMs = this.movement.dynamicConfig?.startReadyDurationMs ?? 500;
        this.motionBuffer.retainSince(raw.timestampMs - readyMs - C.maximumFrameGapMs);
      }
      // An isolated readiness fluctuation must not freeze the visible clock.
      // Countdown never supplies graded hold time; still validate pose at cue.
      this.elapsed += delta;
      if (this.elapsed >= C.countdownMs && this.preparationStatus === 'READY') {
        this.countdownFinishedAtMs ??= sourceTimeMs;
        const flow = commandFlow(this.movement.id as import('../types').MovementId)!;
        events.push({ type: 'commandCue', command: flow.command, attemptId: this.attempt?.id, timestampMs: sourceTimeMs });
        if (this.movement.id === 'salute') this.saluteTracker.begin(filtered);
        this.transitionStartedAtMs = raw.timestampMs;
        this.resetTransitionHold();
        this.stage = this.movement.type === 'DYNAMIC' ? 'scoring' : 'transition';
        if (this.movement.type !== 'DYNAMIC') { this.outliers.reset(); this.smoother.reset(); }
        this.elapsed = 0;
        this.samples = [];
        this.dynamicTracker.reset();
        if (this.movement.type === 'DYNAMIC') this.dynamicTracker.prime(this.motionBuffer, this.movement);
        else this.motionBuffer.clear();
      }
      }
    } else if (this.stage === 'transition') {
      this.preparationStatus = good ? postureReadiness(currentSample, this.movement) : 'INSUFFICIENT_EVIDENCE';
      if (this.movement.id === 'salute') {
        const stable = good && this.saluteTracker.update(filtered, currentSample, this.preparationStatus === 'READY');
        message = this.saluteTracker.snapshot.motionObserved ? 'Đã ghi nhận nâng tay. Giữ tư thế Chào ổn định để bắt đầu chấm.' : 'Nâng tay phải sau khẩu lệnh CHÀO; hệ thống đang theo dõi chuyển động, chưa tính lỗi tư thế cuối.';
        if (this.saluteTracker.timedOut) {
          this.finish({ status: 'notScorable', reasons: ['Chưa ghi nhận đủ chuỗi nâng tay và giữ Chào sau khẩu lệnh. Hãy thử lại từ Đứng nghiêm; đây là thiếu dữ liệu chuyển động, không kết luận tay sai.'] }, events);
        } else if (stable) { this.stage = 'scoring'; this.elapsed = 0; this.samples = []; this.saluteTracker.scoring(filtered); }
      } else {
      if (!good || !currentSample) {
        // Pause a short tracking loss. Only current observed samples contribute
        // on recovery; no carried-forward landmark is added to the hold.
        this.lastTargetReady = false;
      }
      else {
        this.transitionHeldMs += duration;
        if (this.preparationStatus === 'READY') {
          this.targetReadyHeldMs += this.lastTargetReady ? duration : 0;
          this.lastTargetReady = true;
        } else { this.targetReadyHeldMs = 0; this.lastTargetReady = false; }
        this.preparationSince ??= raw.timestampMs; this.preparationSamples.push(currentSample);
        this.preparationSamples = this.preparationSamples.filter(sample=>raw.timestampMs-sample.timestampMs <= C.attemptMs);
        if (!stableStaticHold(this.preparationSamples)) {
          this.preparationSince = raw.timestampMs; this.preparationSamples = [currentSample];
          this.resetTransitionHold();
          this.lastTargetReady = this.preparationStatus === 'READY';
        }
        // Readiness is useful during settling, but is not permission to grade.
        // Once the command's transition grace has elapsed, a clear stable wrong
        // stance must receive criterion feedback instead of waiting forever.
        const canGrade = this.targetReadyHeldMs >= MOVEMENT_SETTLE_MS ||
          this.preparationStatus === 'WRONG_PRECONDITION' && raw.timestampMs-(this.transitionStartedAtMs ?? raw.timestampMs) >= C.staticTransitionGraceMs;
        if (canGrade && this.transitionHeldMs >= MOVEMENT_SETTLE_MS && this.preparationSamples.length >= 6) {
          this.stage = 'scoring'; this.elapsed = 0; this.samples = []; this.preparationSamples = []; this.preparationSince = null;
        }
      }
      message = good ? `Đã nhận khẩu lệnh. Đang ghi nhận ${this.movement.label}; giữ tư thế cuối để chốt điểm. Nếu tư thế chưa đúng, hệ thống sẽ nhận xét theo tiêu chí.`
        : `Đã nhận khẩu lệnh, camera đang nhận lại hình. ${quality.reasons[0] ?? 'Giữ toàn thân rõ trong hình.'}`;
      }
    }

    if (this.finalized) return finalEvents();
    let dynamicProgress: DynamicProgress | undefined;
    let dynamicRatio = 0;
    let liveSample: FeatureSample | undefined;
    let liveDualMeasurements: DualMeasurement[] | undefined;

    if (this.stage === 'scoring' && good && this.profile) {
      // The interval ending at countdown completion belongs to preparation, not scoring.
      this.elapsed += initialStage === 'scoring' ? duration : 0;
      // Short visual holds must never supply missing/rejected joints to scoring.
      const observed = this.movement.id === 'salute' ? filtered : { ...smoothed, landmarks: Object.fromEntries(
        Object.keys(filtered.landmarks).map(name => [name, smoothed.landmarks[name as keyof typeof smoothed.landmarks]]),
      ) };
      const normalized = normalizePose(observed, this.profile, allowTurn);
      if (normalized) {
        const sample = extractFeatures(normalized, allowTurn);
        if (this.movement.id === 'salute') sample.saluteHand = saluteHandMetrics(filtered);
        if (this.movement.id === 'salute') this.saluteTracker.scoring(filtered);
        liveSample = sample;
        liveDualMeasurements = extractDualMeasurements(normalized, allowTurn);
        this.samples.push(sample);
        if (this.movement.type !== 'DYNAMIC' && !stableStaticHold(this.samples)) {
          this.samples = []; this.elapsed = 0;
          message = 'Tư thế còn thay đổi. Giữ yên khoảng 3 giây để chốt kết quả.';
        }
        if (this.movement.type === 'DYNAMIC') {
          // Smoothing is visual assistance, not evidence that intermediate poses occurred.
          this.recordMotion(filtered);
        }
      }

      if (this.movement.type === 'DYNAMIC') {
        const update = this.dynamicTracker.update(this.elapsed, this.motionBuffer, this.movement);
        dynamicProgress = update.dynamicProgress;
        dynamicRatio = update.progressRatio;
        if (update.isComplete) {
          this.windowFinishedAtMs = sourceTimeMs;
          this.finalizationStartedAtMs = this.now();
          const result = evaluate(this.movement, { samples: this.samples, validDurationMs: this.elapsed, qualityPassed: good }, this.motionBuffer, this.sequenceEngine);
          this.finish(result, events);
          if (this.finalized) return finalEvents();
        }
      } else {
        if (this.elapsed >= C.attemptMs && this.samples.length >= this.movement.minimumSamples) {
          // Slow cameras keep observing until enough real samples arrive. Their
          // extra acquisition time belongs to scoring, not processing latency.
          this.windowFinishedAtMs = this.samples.length === this.movement.minimumSamples ? sourceTimeMs : sourceTimeMs - Math.max(0, this.elapsed - C.attemptMs);
          this.finalizationStartedAtMs = this.now();
          const result = evaluate(this.movement, { samples: this.samples, validDurationMs: this.elapsed, qualityPassed: good });
          this.finish(result, events);
          if (this.finalized) return finalEvents();
        }
      }
    }

    // Telemetry fallback: compute live measurements in any stage for developer HUD
    if (!liveSample) {
      const provisional = this.profile ?? (() => {
        const m = measurements(smoothed);
        if (!m || m.bodyScale <= 0 || m.worldScale <= 0) return null;
        return {
          bodyScale: m.bodyScale,
          worldScale: m.worldScale,
          shoulderWidth: m.shoulderWidth,
          hipWidth: m.hipWidth,
          torsoLength: m.torsoLength,
          legLength: m.legLength,
          baselineJitter: 0.01,
          coverage: 1,
          frontFacing: true,
          sampleCount: 1,
        };
      })();
      if (provisional) {
        const norm = normalizePose(smoothed, provisional);
        if (norm) {
          liveSample = extractFeatures(norm, allowTurn);
          liveDualMeasurements = extractDualMeasurements(norm, allowTurn);
        }
      }
    }

    const holdingPreparation = ['waiting-precondition', 'precondition-scoring', 'countdown'].includes(initialStage);
    this.lastGood = good && (!holdingPreparation || this.preparationStatus === 'READY');
    const target = this.stage === 'calibrating' ? C.calibrationMs : this.stage === 'countdown' ? C.countdownMs : this.stage === 'waiting-precondition' ? PREPARATION_STABLE_MS : C.attemptMs;
    const progress = (this.stage === 'scoring' && this.movement.type === 'DYNAMIC')
      ? dynamicRatio
      : Math.min(1, this.elapsed / target);

    events.push({
      type: 'analysis',
      attemptId: this.attempt?.id,
      snapshot: {
        frame: this.movement.id === 'salute' ? filtered : smoothed,
        quality,
        stage: this.stage,
        progress,
        inferenceMs,
        inferenceFps: delta > 0 ? 1000 / delta : 0,
        dynamicProgress,
        message,
        workflow: { preconditionId: this.preparationMovementId, preconditionLabel: prepDefinition.label, status: this.preparationStatus, scoringPrecondition: this.stage === 'precondition-scoring', message: message ?? quality.reasons[0] },
        drillProgress: this.drill ? { index: this.drillIndex, completed: this.drillSteps.filter(s => s.result.status === 'scored').length, total: 3, movementId: DRILL_IDS[this.drillIndex] } : undefined,
        features: liveSample?.values,
        dualMeasurements: liveDualMeasurements,
        performance: { poseMs: raw.detectorTelemetry?.poseMs ?? inferenceMs, handMs: raw.detectorTelemetry?.handMs },
        saluteProgress: this.movement.id === 'salute'
          ? ['quality-check', 'calibrating', 'waiting-precondition', 'precondition-scoring', 'countdown'].includes(this.stage) ? { ...this.saluteTracker.snapshot, state: this.stage === 'countdown' ? 'COUNTDOWN' : 'ATTENTION_READY' } : this.saluteTracker.snapshot : undefined,
      },
    });

    return events;
  }
}
