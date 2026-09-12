import type { CriterionResult, CriterionStatusLevel, MovementDefinition, ScoreResult } from './scoringTypes';
import type { DynamicPhase, DynamicProgress } from '../types';
import type { TemporalMotionBuffer } from '../pipeline/motionBuffer';
import { mean, median } from '../pipeline/geometry';

export class DynamicTurnTracker {
  private phase: DynamicPhase = 'WAITING_FOR_START';
  private baselineYaw: number | null = null;
  private startReadySince: number | null = null;
  private holdStartMs: number | null = null;
  private attemptStartMs: number | null = null;
  private completed = false;

  reset() {
    this.phase = 'WAITING_FOR_START';
    this.baselineYaw = null;
    this.startReadySince = null;
    this.holdStartMs = null;
    this.attemptStartMs = null;
    this.completed = false;
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
      this.completed = true;
      this.phase = 'COMPLETE';
    }

    if (this.completed) {
      return {
        phase: 'COMPLETE',
        progressRatio: 1,
        isComplete: true,
        currentDeltaYaw: this.baselineYaw !== null ? buffer.getCurrentDeltaYaw(this.baselineYaw) : 0,
        message: 'Hoàn thành động tác!',
        dynamicProgress: {
          phase: 'COMPLETE',
          currentYawDeg: this.baselineYaw !== null ? buffer.getCurrentDeltaYaw(this.baselineYaw) : 0,
          targetYawDeg: config.targetYawDeg,
          progressRatio: 1,
          message: 'Hoàn thành động tác!',
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

      const readyElapsed = this.startReadySince ? timestampMs - this.startReadySince : 0;
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
      const isTargetReached = (config.direction === 'left' && currentDelta >= 68) ||
                              (config.direction === 'right' && currentDelta <= -68);

      if (isTargetReached) {
        this.phase = 'FINAL_HOLD';
        this.holdStartMs = timestampMs;
      }

      const turnProgress = Math.min(1, currentRotMag / targetAbs);
      const overallProgress = 0.2 + turnProgress * 0.4;
      const targetText = config.direction === 'left' ? 'trái' : 'phải';

      return {
        phase: 'MOVING',
        progressRatio: overallProgress,
        isComplete: false,
        currentDeltaYaw: currentDelta,
        message: `Đang quay ${targetText}: ${Math.round(currentRotMag)}° / 90°`,
        dynamicProgress: {
          phase: 'MOVING',
          currentYawDeg: currentDelta,
          targetYawDeg: config.targetYawDeg,
          progressRatio: overallProgress,
          message: `Đang quay ${targetText}...`,
        },
      };
    }

    // 3. Giai đoạn: FINAL_HOLD
    if (this.phase === 'FINAL_HOLD') {
      this.holdStartMs ??= timestampMs;
      const holdDuration = timestampMs - this.holdStartMs;
      const holdRemaining = Math.max(0, config.finalHoldDurationMs - holdDuration);

      // Nếu góc quay bị tụt ngược lại quá nhiều (> 30° so với mục tiêu), quay lại trạng thái MOVING
      const isStillNearTarget = Math.abs(currentRotMag - targetAbs) <= (config.yawToleranceDeg + 15);
      if (!isStillNearTarget && holdDuration < 600) {
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
  buffer: TemporalMotionBuffer
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

  const baseline = buffer.getBaselineYaw(800);
  if (baseline === null) {
    return refuse('Không xác định được tư thế xuất phát ban đầu. Hãy đứng nhìn thẳng camera trước khi quay.');
  }

  const detectedDir = buffer.detectDirection(baseline, 25);
  const finalDelta = buffer.getCurrentDeltaYaw(baseline, 600);
  const finalAngleMag = Math.abs(finalDelta);

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

    // Lý tưởng: 78° - 102°
    if (finalAngleMag >= 78 && finalAngleMag <= 102) {
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
      points = Math.max(0, Math.round(finalAngleMag / 90 * 10));
      statusLevel = 'NOT_ACHIEVED';
      mistakes.push(`Góc quay lệch nhiều so với chuẩn 90° (đo được ${Math.round(finalAngleMag)}°).`);
      specificFeedback = mistakes[0];
    }

    criteria.push({
      id: 'angle',
      label: 'Góc quay 90°',
      points,
      maximum: 25,
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

  // 3. TIÊU CHÍ: THÂN TRÊN NGAY NGẮN (Torso Stability - 20 điểm)
  {
    const meanTorsoTilt = buffer.getMeanTorsoTilt();
    const meanShoulderTilt = buffer.getMeanShoulderTilt();
    let points = 20;
    let statusLevel: CriterionStatusLevel = 'PASS';
    const mistakes: string[] = [];
    let specificFeedback = 'Thân người giữ ngay ngắn, thẳng đứng trong suốt quá trình quay.';

    if (meanTorsoTilt > 12) {
      points -= 8;
      mistakes.push('Thân người bị ngả nghiêng hoặc chúi về trước khi quay.');
    } else if (meanTorsoTilt > 8) {
      points -= 4;
      mistakes.push('Thân người hơi nghiêng nhẹ khi đổi hướng.');
    }

    if (meanShoulderTilt > 9) {
      points -= 4;
      mistakes.push('Hai vai chưa giữ cân bằng ngang nhau khi quay.');
    }

    points = Math.max(5, points);
    if (points >= 18) statusLevel = 'PASS';
    else if (points >= 12) statusLevel = 'NEEDS_ADJUSTMENT';
    else statusLevel = 'NOT_ACHIEVED';

    if (mistakes.length > 0) specificFeedback = mistakes[0];

    criteria.push({
      id: 'torso',
      label: 'Thân người thẳng',
      points,
      maximum: 20,
      status: points >= 18 ? 'good' : 'improve',
      statusLevel,
      feedback: specificFeedback,
      specificFeedback,
      mistakes,
      measurements: [
        { feature: 'torsoTilt', value: meanTorsoTilt, variability: 0 },
        { feature: 'shoulderTilt', value: meanShoulderTilt, variability: 0 },
      ],
    });
  }

  // 4. TIÊU CHÍ: GIỮ THẾ KẾT THÚC ỔN ĐỊNH (Final Hold - 20 điểm)
  {
    const isStable = buffer.isHoldingStable(1200, 8);
    let points = 0;
    let statusLevel: CriterionStatusLevel = 'PASS';
    const mistakes: string[] = [];
    let specificFeedback = '';

    if (isStable) {
      points = 20;
      statusLevel = 'PASS';
      specificFeedback = 'Tư thế kết thúc được giữ vững chắc, ổn định sau khi quay.';
    } else {
      points = 10;
      statusLevel = 'NEEDS_ADJUSTMENT';
      mistakes.push('Tư thế kết thúc chưa được giữ đủ ổn định. Hãy giữ yên thân người 1.5 giây sau khi quay.');
      specificFeedback = mistakes[0];
    }

    criteria.push({
      id: 'stability',
      label: 'Giữ thế kết thúc',
      points,
      maximum: 20,
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

    // Check wrist distances in buffer
    const wristDists = buffer.frames
      .filter(f => f.leftWristHipDistance !== undefined && f.rightWristHipDistance !== undefined)
      .map(f => Math.max(f.leftWristHipDistance!, f.rightWristHipDistance!));

    const maxDist = wristDists.length ? Math.max(...wristDists) : 0.4;
    if (maxDist > 0.85) {
      points = 4;
      mistakes.push('Hai tay bị vung ra xa thân khi quay. Hãy giữ ngón tay áp sát chỉ quần.');
    } else if (maxDist > 0.65) {
      points = 7;
      mistakes.push('Tay hơi rời thân khi xoay người.');
    }

    if (points >= 9) statusLevel = 'PASS';
    else if (points >= 6) statusLevel = 'NEEDS_ADJUSTMENT';
    else statusLevel = 'NOT_ACHIEVED';

    if (mistakes.length > 0) specificFeedback = mistakes[0];

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
        { feature: 'leftWristHipDistance', value: maxDist, variability: 0 },
      ],
    });
  }

  const total = Math.round(criteria.reduce((s, c) => s + c.points, 0));
  const confidences = buffer.frames.map(f => f.confidence);

  return {
    status: 'scored',
    total,
    confidence: mean(confidences),
    criteria,
    corrections: [...criteria]
      .filter(c => c.status === 'improve')
      .sort((a, b) => (b.maximum - b.points) - (a.maximum - a.points))
      .slice(0, 2)
      .map(c => c.feedback),
  };
}
