import type { CriterionResult, CriterionStatusLevel, MovementDefinition, ScoreResult } from './scoringTypes';
import { overallPoseAssessment } from './assessmentPolicy';
import type { DynamicPhase, DynamicProgress } from '../types';
import type { TemporalMotionBuffer } from '../pipeline/motionBuffer';
import { mean, median } from '../pipeline/geometry';
import { analyzeTurnSequence } from './sequenceAnalysis';
import { javascriptSequenceEngine, type SequenceEngine } from './sequenceEngine';
import { analyzeTurnTechnique } from './turnTechnique';
import { turnHoldMs } from './turnHold';
import { scoreTurnFeet } from './turnFeet';

export class DynamicTurnTracker {
  private phase: DynamicPhase = 'WAITING_FOR_START';
  private baselineYaw: number | null = null;
  private startReadySince: number | null = null;
  private holdStartMs: number | null = null;
  private attemptStartMs: number | null = null;
  private completed = false;
  private timedOut = false;

  pause() {
    this.startReadySince = null;
    this.holdStartMs = null;
    if (this.phase === 'START_READY') this.phase = 'WAITING_FOR_START';
    if (this.phase === 'FINAL_HOLD') this.phase = 'MOVING';
  }

  reset() {
    this.phase = 'WAITING_FOR_START';
    this.baselineYaw = null;
    this.startReadySince = null;
    this.holdStartMs = null;
    this.attemptStartMs = null;
    this.completed = false;
    this.timedOut = false;
  }

  // Countdown already supplies the observed frontal start. The user can move
  // as soon as the start cue appears, without a second readiness hold.
  prime(buffer: TemporalMotionBuffer, definition: MovementDefinition) {
    const readyMs = definition.dynamicConfig?.startReadyDurationMs ?? 500;
    const preparation = buffer.confirmPreparation(readyMs);
    if (!preparation) return;
    this.baselineYaw = preparation.baselineYaw;
    this.phase = 'MOVING';
  }

  update(
    timestampMs: number,
    buffer: TemporalMotionBuffer,
    definition: MovementDefinition
  ): {
    phase: DynamicPhase;
    progressRatio: number;
    isComplete: boolean;
    currentDeltaYaw: number;
    message: string;
    dynamicProgress: DynamicProgress;
  } {
    const config = definition.dynamicConfig || {
      direction: 'left',
      targetYawDeg: 90,
      yawToleranceDeg: 20,
      startReadyDurationMs: 500,
      finalHoldDurationMs: 1500,
      maxAttemptDurationMs: 8000,
    };

    this.attemptStartMs ??= timestampMs;
    const elapsedTotal = timestampMs - this.attemptStartMs;

    // Timeout check
    if (elapsedTotal >= config.maxAttemptDurationMs && !this.completed) {
      this.timedOut = true;
      this.completed = true;
      this.phase = 'COMPLETE';
    }

    if (this.completed) {
      return {
        phase: 'COMPLETE',
        progressRatio: 1,
        isComplete: true,
        currentDeltaYaw: this.baselineYaw !== null ? buffer.getCurrentDeltaYaw(this.baselineYaw) : 0,
        message: this.timedOut ? 'Hết thời gian theo dõi; xem các bước còn thiếu trong kết quả.' : 'Hoàn thành động tác!',
        dynamicProgress: {
          phase: 'COMPLETE',
          currentYawDeg: this.baselineYaw !== null ? buffer.getCurrentDeltaYaw(this.baselineYaw) : 0,
          targetYawDeg: config.targetYawDeg,
          progressRatio: 1,
          message: this.timedOut ? 'Hết thời gian theo dõi.' : 'Hoàn thành động tác!',
        },
      };
    }

    // 1. Giai đoạn: WAITING_FOR_START & START_READY
    if (this.phase === 'WAITING_FOR_START' || this.phase === 'START_READY') {
      const latestYaw = buffer.getLatestYaw(300);
      // Người dùng đứng ổn định hướng về phía camera (góc xoay ban đầu ~0° ± 25°)
      if (latestYaw !== null && Math.abs(latestYaw) <= 25) {
        if (this.startReadySince === null) {
          this.startReadySince = timestampMs;
          this.phase = 'START_READY';
        } else if (timestampMs - this.startReadySince >= config.startReadyDurationMs) {
          this.baselineYaw = buffer.getBaselineYaw(config.startReadyDurationMs) ?? latestYaw;
          this.phase = 'MOVING';
        }
      } else {
        this.startReadySince = null;
        this.phase = 'WAITING_FOR_START';
      }

      const readyElapsed = this.startReadySince !== null ? timestampMs - this.startReadySince : 0;
      const progress = Math.min(1, readyElapsed / config.startReadyDurationMs) * 0.2;
      return {
        phase: this.phase,
        progressRatio: progress,
        isComplete: false,
        currentDeltaYaw: 0,
        message: this.phase === 'START_READY'
          ? 'Tư thế sẵn sàng... Chuẩn bị quay!'
          : 'Đứng ngay ngắn nhìn thẳng camera để bắt đầu.',
        dynamicProgress: {
          phase: this.phase,
          currentYawDeg: 0,
          targetYawDeg: config.targetYawDeg,
          progressRatio: progress,
          message: this.phase === 'START_READY' ? 'Tư thế sẵn sàng...' : 'Đứng nhìn thẳng camera.',
        },
      };
    }

    const baseline = this.baselineYaw ?? 0;
    const currentDelta = buffer.getCurrentDeltaYaw(baseline, 250);
    const targetAbs = Math.abs(config.targetYawDeg);
    const currentRotMag = Math.abs(currentDelta);

    // 2. Giai đoạn: MOVING
    if (this.phase === 'MOVING') {
      // Kiểm tra xem góc quay đã chạm ngưỡng kết thúc (tối thiểu 68° trong 90°)
      const isTargetReached = Math.abs(currentDelta - config.targetYawDeg) <= config.yawToleranceDeg;

      if (isTargetReached) {
        this.phase = 'FINAL_HOLD';
        this.holdStartMs = timestampMs;
      }

      const turnProgress = Math.max(0, Math.min(1, currentDelta * Math.sign(config.targetYawDeg) / targetAbs));
      const overallProgress = 0.2 + turnProgress * 0.4;
      const targetText = config.direction === 'left' ? 'trái' : 'phải';
      const wrongDirection = currentDelta * Math.sign(config.targetYawDeg) < -25;
      const turnMessage = wrongDirection
        ? `Sai hướng: đang quay ${config.direction === 'left' ? 'phải' : 'trái'}; yêu cầu quay ${targetText}.`
        : `Đang quay ${targetText}: ${Math.round(currentRotMag)}° / 90°`;

      return {
        phase: this.phase,
        progressRatio: overallProgress,
        isComplete: false,
        currentDeltaYaw: currentDelta,
        message: turnMessage,
        dynamicProgress: {
          phase: this.phase,
          currentYawDeg: currentDelta,
          targetYawDeg: config.targetYawDeg,
          progressRatio: overallProgress,
          message: turnMessage,
        },
      };
    }

    // 3. Giai đoạn: FINAL_HOLD
    if (this.phase === 'FINAL_HOLD') {
      this.holdStartMs ??= timestampMs;
      const holdDuration = turnHoldMs(buffer.frames, baseline, config.targetYawDeg, config.yawToleranceDeg);
      const holdRemaining = Math.max(0, config.finalHoldDurationMs - holdDuration);

      // Nếu góc quay bị tụt ngược lại quá nhiều (> 30° so với mục tiêu), quay lại trạng thái MOVING
      const isStillNearTarget = Math.abs(currentDelta - config.targetYawDeg) <= config.yawToleranceDeg;
      if (!isStillNearTarget) {
        this.phase = 'MOVING';
        this.holdStartMs = null;
      } else if (holdDuration >= config.finalHoldDurationMs) {
        this.phase = 'COMPLETE';
        this.completed = true;
      }

      const holdProgress = Math.min(1, holdDuration / config.finalHoldDurationMs);
      const overallProgress = 0.6 + holdProgress * 0.4;

      return {
        phase: this.phase,
        progressRatio: overallProgress,
        isComplete: this.completed,
        currentDeltaYaw: currentDelta,
        message: this.completed
          ? '✓ Hoàn thành động tác quay!'
          : `Giữ nguyên tư thế kết thúc: ${(holdDuration / 1000).toFixed(1)} / ${(config.finalHoldDurationMs / 1000).toFixed(1)}s`,
        dynamicProgress: {
          phase: this.phase,
          currentYawDeg: currentDelta,
          targetYawDeg: config.targetYawDeg,
          progressRatio: overallProgress,
          holdRemainingMs: holdRemaining,
          message: `Giữ ổn định: ${(holdDuration / 1000).toFixed(1)}s`,
        },
      };
    }

    return {
      phase: 'COMPLETE',
      progressRatio: 1,
      isComplete: true,
      currentDeltaYaw: currentDelta,
      message: 'Hoàn thành!',
      dynamicProgress: {
        phase: 'COMPLETE',
        currentYawDeg: currentDelta,
        targetYawDeg: config.targetYawDeg,
        progressRatio: 1,
        message: 'Hoàn thành!',
      },
    };
  }
}

/**
 * Đánh giá chi tiết kết quả một lần thực hiện động tác động (Turn Left / Turn Right).
 */
export function evaluateDynamicAttempt(
  definition: MovementDefinition,
  buffer: TemporalMotionBuffer,
  sequenceEngine: SequenceEngine = javascriptSequenceEngine
): ScoreResult {
  const refuse = (reason: string): ScoreResult => ({ status: 'notScorable', reasons: [reason] });

  if (buffer.length < 10 || buffer.durationMs < 1200) {
    return refuse('Không đủ dữ liệu để đánh giá toàn bộ chuyển động. Vui lòng đảm bảo toàn thân nằm trong khung hình.');
  }

  const config = definition.dynamicConfig || {
    direction: 'left',
    targetYawDeg: 90,
    yawToleranceDeg: 20,
    startReadyDurationMs: 500,
    finalHoldDurationMs: 1500,
    maxAttemptDurationMs: 8000,
  };

  const reliable = buffer.frames.filter(f => f.isReliable && Number.isFinite(f.bodyYawDeg) && Number.isFinite(f.confidence) && f.confidence >= 0.6);
  if (reliable.length < 10 || reliable.length < buffer.length * 0.85) return refuse('Không đủ góc quay đáng tin cậy để phân tích chuỗi.');

  const baseline = buffer.getBaselineYaw(config.startReadyDurationMs);
  if (baseline === null) {
    return refuse('Không xác định được tư thế xuất phát ban đầu. Hãy đứng nhìn thẳng camera trước khi quay.');
  }

  const detectedDir = buffer.detectDirection(baseline, 25);
  const sequence = analyzeTurnSequence(buffer.frames, config, sequenceEngine, buffer.preparation);
  if (sequence.status === 'unavailable') return refuse(sequence.reason);
  if (!sequence.startReady) return refuse('Chưa ghi nhận đủ tư thế xuất phát nhìn thẳng camera trước khi quay. Vui lòng thử lại.');
  if (!sequence.motionObserved) return refuse('Camera chưa ghi nhận đủ chuyển động trung gian để chấm bài quay. Hãy quay liên tục từ tư thế nhìn thẳng; không chỉ giữ tư thế cuối.');
  const finalDelta = buffer.getCurrentDeltaYaw(baseline, 600);
  const finalAngleMag = Math.abs(finalDelta);
  const correctDirection = detectedDir === config.direction && Math.sign(finalDelta) === Math.sign(config.targetYawDeg);
  const technique = analyzeTurnTechnique(buffer.frames, config.direction, config.startReadyDurationMs);
  const actionFrames = reliable.filter(f => (!buffer.preparation || f.timestampMs > buffer.preparation.cueMs) && Math.abs(f.bodyYawDeg - baseline) > 25);
  const enoughEvidence = (frames: typeof actionFrames) => frames.length >= 3 &&
    frames[frames.length - 1].timestampMs - frames[0].timestampMs >= 200;

  const criteria: CriterionResult[] = [];

  // 1. TIÊU CHÍ: HƯỚNG QUAY (Direction - 25 điểm)
  {
    const expected = config.direction;
    let points = 0;
    let statusLevel: CriterionStatusLevel = 'NOT_ACHIEVED';
    const mistakes: string[] = [];
    let specificFeedback = '';

    if (detectedDir === expected) {
      points = 25;
      statusLevel = 'PASS';
      specificFeedback = `Bạn đã thực hiện đúng hướng quay sang ${expected === 'left' ? 'trái' : 'phải'}.`;
      if (sequence.maxReversalDeg > 15) {
        points = 12;
        statusLevel = 'NEEDS_ADJUSTMENT';
        mistakes.push('Có đoạn quay ngược hoặc quay trở lại trong lượt thực hiện. Hãy quay một lần liên tục theo hướng đã chọn.');
        specificFeedback = mistakes[0];
      }
    } else if (detectedDir === 'none') {
      points = Math.max(0, Math.round(finalAngleMag / 90 * 12));
      statusLevel = 'NEEDS_ADJUSTMENT';
      mistakes.push('Động tác quay chưa rõ ràng hoặc biên độ quá nhỏ.');
      specificFeedback = mistakes[0];
    } else {
      // Quay ngược hướng
      points = 0;
      statusLevel = 'NOT_ACHIEVED';
      const wrongSide = expected === 'left' ? 'phải' : 'trái';
      const rightSide = expected === 'left' ? 'trái' : 'phải';
      mistakes.push(`Quay sai hướng (đã quay sang ${wrongSide} thay vì sang ${rightSide}).`);
      specificFeedback = mistakes[0];
    }

    criteria.push({
      id: 'direction',
      label: 'Hướng quay',
      points,
      maximum: 25,
      required: true,
      status: points >= 22 ? 'good' : 'improve',
      statusLevel,
      feedback: specificFeedback || 'Cần quay đúng hướng theo hiệu lệnh.',
      specificFeedback,
      mistakes,
      measurements: [
        { feature: 'bodyYaw', value: finalDelta, variability: 0 },
      ],
    });
  }

  // 2. TIÊU CHÍ: GÓC QUAY MỤC TIÊU (Rotation Angle - 25 điểm)
  {
    let points = 0;
    let statusLevel: CriterionStatusLevel = 'PASS';
    const mistakes: string[] = [];
    let specificFeedback = '';

    // A 90-degree angle on the wrong side is not the requested target.
    if (!correctDirection) {
      points = 0;
      statusLevel = 'NOT_ACHIEVED';
      mistakes.push('Chưa đạt góc 90° theo hướng đã chọn; góc quay sang phía đối diện không được tính.');
      specificFeedback = mistakes[0];
    } else if (finalAngleMag >= 78 && finalAngleMag <= 102) {
      points = 25;
      statusLevel = 'PASS';
      specificFeedback = `Góc quay chuẩn xác (${Math.round(finalAngleMag)}° / 90°).`;
    } else if (finalAngleMag >= 65 && finalAngleMag < 78) {
      // Thiếu góc
      const frac = (finalAngleMag - 50) / (78 - 50);
      points = Math.round(Math.max(10, frac * 22) * 10) / 10;
      statusLevel = 'NEEDS_ADJUSTMENT';
      mistakes.push(`Góc quay chưa đủ 90° (đạt khoảng ${Math.round(finalAngleMag)}°). Cần xoay người dứt khoát đến khi vuông góc.`);
      specificFeedback = mistakes[0];
    } else if (finalAngleMag > 102 && finalAngleMag <= 125) {
      // Quá đà
      points = 18;
      statusLevel = 'NEEDS_ADJUSTMENT';
      mistakes.push(`Quay hơi quá đà (đạt khoảng ${Math.round(finalAngleMag)}°). Cần khống chế dừng đúng góc 90°.`);
      specificFeedback = mistakes[0];
    } else {
      points = finalAngleMag > 125
        ? Math.max(0, Math.round((180 - finalAngleMag) / 55 * 10))
        : Math.max(0, Math.round(finalAngleMag / 90 * 10));
      statusLevel = 'NOT_ACHIEVED';
      mistakes.push(`Góc quay lệch nhiều so với chuẩn 90° (đo được ${Math.round(finalAngleMag)}°).`);
      specificFeedback = mistakes[0];
    }

    criteria.push({
      id: 'angle',
      label: 'Góc quay 90°',
      points,
      maximum: 25,
      required: true,
      status: points >= 22 ? 'good' : 'improve',
      statusLevel,
      feedback: specificFeedback || 'Góc quay cần đạt vuông góc 90°.',
      specificFeedback,
      mistakes,
      measurements: [
        { feature: 'turnProgress', value: finalAngleMag, variability: 0 },
      ],
    });
  }

  // 3. TIÊU CHÍ: THÂN TRÊN NGAY NGẮN (10 điểm; 10 điểm dành cho tư thế bàn chân)
  {
    const observedTorso = actionFrames.filter(f => Number.isFinite(f.torsoTilt) && Number.isFinite(f.shoulderTilt));
    const meanTorsoTilt = median(observedTorso.map(f => f.torsoTilt!));
    const meanShoulderTilt = median(observedTorso.map(f => f.shoulderTilt!));
    const preparationFrames = reliable.filter(f => buffer.preparation
      ? f.timestampMs <= buffer.preparation.cueMs
      : f.timestampMs <= reliable[0].timestampMs + config.startReadyDurationMs);
    const imageStart = preparationFrames.map(f => f.imageTorsoTilt).filter((v): v is number => Number.isFinite(v));
    const imageBaseline = imageStart.length >= 3 ? median(imageStart) : NaN;
    const corroboratedLean = observedTorso.filter(f => Number.isFinite(imageBaseline) && Number.isFinite(f.imageTorsoTilt) &&
      Math.abs(f.imageTorsoTilt! - imageBaseline) > 10 && f.torsoTilt! > 12);
    const sustainedLean = enoughEvidence(corroboratedLean) &&
      corroboratedLean.at(-1)!.timestampMs - corroboratedLean[0].timestampMs >= 300 &&
      corroboratedLean.length / observedTorso.length >= .6;
    let points = 20;
    let statusLevel: CriterionStatusLevel = 'PASS';
    const mistakes: string[] = [];
    let specificFeedback = 'Không ghi nhận thân người nghiêng rõ, kéo dài trong phần chuyển động quan sát được.';

    if (meanTorsoTilt > 20 && sustainedLean) {
      points -= 8;
      mistakes.push('Thân người bị ngả nghiêng hoặc chúi về trước khi quay.');
    } else if (meanTorsoTilt > 12 && sustainedLean) {
      points -= 4;
      mistakes.push('Thân người hơi nghiêng nhẹ khi đổi hướng.');
    }

    if (meanShoulderTilt > 12 && sustainedLean) {
      points -= 4;
      mistakes.push('Hai vai chưa giữ cân bằng ngang nhau khi quay.');
    }

    points = Math.max(5, points);
    if (points >= 18) statusLevel = 'PASS';
    else if (points >= 12) statusLevel = 'NEEDS_ADJUSTMENT';
    else statusLevel = 'NOT_ACHIEVED';

    if (mistakes.length > 0) specificFeedback = mistakes[0];

    if (!technique.passed) {
      points = 0;
      statusLevel = technique.status === 'unavailable' ? 'NOT_SCORABLE' : 'NOT_ACHIEVED';
      mistakes.unshift(technique.feedback);
      specificFeedback = technique.feedback;
    }
    const torsoObserved = enoughEvidence(observedTorso);
    if (!torsoObserved && (technique.status === 'unavailable' || technique.passed)) {
      points = 0;
      statusLevel = 'NOT_SCORABLE';
      specificFeedback = 'Chưa đủ dữ liệu 3D đáng tin cậy để đánh giá độ nghiêng thân và vai khi quay.';
      mistakes.unshift(specificFeedback);
    }
    if (torsoObserved && technique.passed && meanTorsoTilt > 12 && !sustainedLean &&
      observedTorso.filter(f => Number.isFinite(f.imageTorsoTilt)).length < 3) {
      points = 0;
      statusLevel = 'NOT_SCORABLE';
      specificFeedback = 'Camera chưa đủ bằng chứng để xác nhận độ nghiêng thân; phần này chưa được đánh giá.';
      mistakes.length = 0;
    }
    criteria.push({
      id: 'torso',
      label: 'Thân thẳng & quay tại chỗ',
      points: points / 2,
      maximum: 10,
      required: true,
      status: points >= 18 ? 'good' : 'improve',
      statusLevel,
      feedback: specificFeedback,
      specificFeedback,
      mistakes,
      measurements: [
        ...(observedTorso.length ? [
          { feature: 'torsoTilt' as const, value: meanTorsoTilt, variability: 0 },
          { feature: 'shoulderTilt' as const, value: meanShoulderTilt, variability: 0 },
        ] : []),
        { feature: 'rootTravel', value: technique.rootTravel, variability: 0 },
        { feature: 'pivotTravel', value: technique.pivotTravel, variability: 0 },
      ],
    });
  }

  // 4. TIÊU CHÍ: GIỮ THẾ KẾT THÚC ỔN ĐỊNH (Final Hold - 20 điểm)
  {
    const isStable = sequence.holdMs >= config.finalHoldDurationMs &&
      Math.abs(finalDelta - config.targetYawDeg) <= config.yawToleranceDeg;
    let points = 0;
    let statusLevel: CriterionStatusLevel = 'PASS';
    const mistakes: string[] = [];
    let specificFeedback = '';

    if (isStable) {
      points = 20;
      statusLevel = 'PASS';
      specificFeedback = 'Tư thế kết thúc được giữ vững chắc, ổn định sau khi quay.';
    } else {
      points = 0;
      statusLevel = 'NEEDS_ADJUSTMENT';
      mistakes.push('Tư thế kết thúc chưa được giữ đủ ổn định. Hãy giữ yên thân người 1.5 giây sau khi quay.');
      specificFeedback = mistakes[0];
    }

    criteria.push({
      id: 'stability',
      label: 'Giữ thế kết thúc',
      points,
      maximum: 20,
      required: true,
      status: points >= 18 ? 'good' : 'improve',
      statusLevel,
      feedback: specificFeedback,
      specificFeedback,
      mistakes,
      measurements: [
        { feature: 'torsoStability', value: isStable ? 1 : 0, variability: 0 },
      ],
    });
  }

  // 5. TIÊU CHÍ: HAI TAY KHÉP SÁT THÂN (Arms - 10 điểm)
  {
    let points = 10;
    let statusLevel: CriterionStatusLevel = 'PASS';
    const mistakes: string[] = [];
    let specificFeedback = 'Hai tay giữ khép sát chỉ quần tự nhiên.';

    // Include early observed motion (the sequence detector's 12-degree threshold),
    // before the far arm disappears side-on. Never substitute countdown frames.
    const armFrames = reliable.filter(f => (!buffer.preparation || f.timestampMs > buffer.preparation.cueMs) &&
      Math.abs(f.bodyYawDeg - baseline) > 12);
    const armEvidence = (side: 'left' | 'right') => armFrames.filter(f =>
      Number.isFinite(f[`${side}WristHipDistance`]) && f[`${side}WristHipDistance`]! >= 0);
    const leftEvidence = armEvidence('left'), rightEvidence = armEvidence('right');
    // Require a short continuous run, not isolated detections far apart.
    const armObserved = (frames: typeof armFrames) => frames.some((_, i) => {
      let end = i;
      while (end + 1 < frames.length && frames[end + 1].timestampMs - frames[end].timestampMs <= 250) end++;
      return enoughEvidence(frames.slice(i, end + 1));
    });
    const leftObserved = armObserved(leftEvidence), rightObserved = armObserved(rightEvidence);
    const armsObserved = leftObserved && rightObserved;
    const leftDistances = leftEvidence.map(f => f.leftWristHipDistance!);
    const rightDistances = rightEvidence.map(f => f.rightWristHipDistance!);
    const sustainedArmDistance = (side: 'left' | 'right', frames: typeof armFrames, threshold: number) =>
      frames.some((start, i) => {
        const window = frames.slice(i).filter(f => f.timestampMs - start.timestampMs <= 400);
        return armObserved(window) && window.filter(f => f[`${side}WristHipDistance`]! > threshold).length / window.length >= .75;
      });
    const armsBeyond = (threshold: number) => sustainedArmDistance('left', leftEvidence, threshold) || sustainedArmDistance('right', rightEvidence, threshold);
    if (armsBeyond(0.85)) {
      points = 4;
      mistakes.push('Hai tay bị vung ra xa thân khi quay. Hãy giữ ngón tay áp sát chỉ quần.');
    } else if (armsBeyond(0.65)) {
      points = 7;
      mistakes.push('Tay hơi rời thân khi xoay người.');
    }

    if (points >= 9) statusLevel = 'PASS';
    else if (points >= 6) statusLevel = 'NEEDS_ADJUSTMENT';
    else statusLevel = 'NOT_ACHIEVED';

    if (mistakes.length > 0) specificFeedback = mistakes[0];

    if (!armsObserved) {
      points = 0;
      statusLevel = 'NOT_SCORABLE';
      const missingSides = [!leftObserved ? 'tay trái' : '', !rightObserved ? 'tay phải' : ''].filter(Boolean).join(' và ');
      specificFeedback = `Camera chưa quan sát rõ ${missingSides} khi xoay nghiêng. Hệ thống chưa đánh giá phần tay này và không trừ điểm vì thiếu hình ảnh.`;
      mistakes.length = 0;
    }

    criteria.push({
      id: 'arms',
      label: 'Hai tay áp sát chỉ quần',
      points,
      maximum: 10,
      status: points >= 9 ? 'good' : 'improve',
      statusLevel,
      feedback: specificFeedback,
      specificFeedback,
      mistakes,
      measurements: [
        ...(leftDistances.length ? [{ feature: 'leftWristHipDistance' as const, value: Math.max(...leftDistances), variability: 0 }] : []),
        ...(rightDistances.length ? [{ feature: 'rightWristHipDistance' as const, value: Math.max(...rightDistances), variability: 0 }] : []),
      ],
    });
  }

  const readyEnd = buffer.preparation?.cueMs ?? reliable[0].timestampMs + config.startReadyDurationMs;
  criteria.push(scoreTurnFeet(reliable.filter(f => f.timestampMs <= readyEnd && Math.abs(f.bodyYawDeg - baseline) <= 25), 'ready'));
  const finalStart = reliable.at(-1)!.timestampMs - Math.min(800, sequence.holdMs);
  criteria.push(scoreTurnFeet(sequence.holdMs >= 500 ? reliable.filter(f => f.timestampMs >= finalStart) : [], 'final'));

  const rawTotal = Math.round(criteria.reduce((s, c) => s + c.points, 0));
  const unassessedPoints = criteria.filter(c => c.statusLevel === 'NOT_SCORABLE').reduce((sum, c) => sum + c.maximum, 0);
  const total = rawTotal;
  const assessment = overallPoseAssessment(total, unassessedPoints);
  const confidences = buffer.frames.map(f => f.confidence);

  return {
    status: 'scored',
    total,
    passed: assessment === 'pass', assessment,
    unassessedPoints,
    turnTechnique: technique,
    confidence: mean(confidences),
    criteria,
    corrections: [...criteria]
      .filter(c => c.status === 'improve' && c.statusLevel !== 'NOT_SCORABLE')
      .sort((a, b) => (b.maximum - b.points) - (a.maximum - a.points))
      .slice(0, 2)
      .map(c => c.feedback),
    sequence,
  };
}
