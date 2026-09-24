import type { MotionBufferFrame } from '../pipeline/motionBuffer';
import type { DynamicMovementConfig } from './scoringTypes';
import { median } from '../pipeline/geometry';
import { javascriptSequenceEngine, type SequenceEngine } from './sequenceEngine';

export type SequenceReport =
  | { status: 'unavailable'; reason: string }
  | { status: 'analyzed'; engine: SequenceEngine['kind']; reference: 'synthetic-turn-v1';
      distance: number; readyMs: number; movingMs: number | null; holdMs: number;
      maxReversalDeg: number; motionObserved: boolean; startReady: boolean; complete: boolean; feedback: string[];
      trace: { timeMs: number; progress: number }[] };

const wrap = (v: number) => ((v + 180) % 360 + 360) % 360 - 180;

/** Observed phases validate evidence; synthetic DTW distance remains feedback only. */
export function analyzeTurnSequence(frames: readonly MotionBufferFrame[], config: DynamicMovementConfig,
  engine: SequenceEngine = javascriptSequenceEngine): SequenceReport {
  const unavailable = (reason: string): SequenceReport => ({ status: 'unavailable', reason });
  if (frames.length < 10 || !Number.isFinite(config.targetYawDeg) || Math.abs(config.targetYawDeg) < 1) {
    return unavailable('Chưa đủ dữ liệu để phân tích chuỗi động tác.');
  }
  const valid = frames.filter(f => f.isReliable && Number.isFinite(f.bodyYawDeg) &&
    Number.isFinite(f.timestampMs) && Number.isFinite(f.confidence) && f.confidence >= 0.6);
  if (valid.length < 10 || valid.length / frames.length < 0.85) return unavailable('Nhiều khung hình chưa đủ tin cậy để so sánh chuyển động.');
  for (let i = 1; i < valid.length; i++) {
    const gap = valid[i].timestampMs - valid[i - 1].timestampMs;
    if (gap <= 0 || gap > 250) return unavailable('Chuỗi có đoạn bị gián đoạn; hãy thực hiện lại trong khung hình.');
  }
  const start = valid[0].timestampMs, duration = valid.at(-1)!.timestampMs - start;
  if (duration < 1200) return unavailable('Chuỗi chuyển động quá ngắn để so sánh.');
  const baseline = median(valid.filter(f => f.timestampMs - start <= config.startReadyDurationMs).map(f => f.bodyYawDeg));
  const sign = config.direction === 'left' ? 1 : -1, target = Math.abs(config.targetYawDeg);
  const deltas = valid.map(f => wrap(f.bodyYawDeg - baseline) * sign);
  // Use observed angles, not interpolated/smoothed trace points, as proof of motion.
  // Accept either direction here so a clearly observed wrong turn can still be scored.
  const intermediate = deltas.filter(v => Math.abs(v) > 12 && Math.abs(v) < target - config.yawToleranceDeg);
  const motionObserved = intermediate.some((v, i) => intermediate.slice(i + 1).some(next =>
    Math.sign(next) === Math.sign(v) && Math.abs(next) - Math.abs(v) >= 10));
  // Median of three neighbouring frames suppresses isolated landmark jitter.
  const smooth = deltas.map((_, i) => median(deltas.slice(Math.max(0, i - 1), Math.min(deltas.length, i + 2))));
  const firstMove = smooth.findIndex(v => Math.abs(v) > 12);
  const firstTarget = smooth.findIndex((v, i) => i >= firstMove && Math.abs(v - target) <= config.yawToleranceDeg);
  const readyMs = firstMove < 0 ? duration : valid[firstMove].timestampMs - start;
  const startReady = Math.abs(baseline) <= 25 && readyMs >= config.startReadyDurationMs &&
    valid.filter(f => f.timestampMs - start < config.startReadyDurationMs).every(f => Math.abs(f.bodyYawDeg) <= 25);
  let holdStart = valid.length - 1;
  if (Math.abs(smooth[holdStart] - target) <= config.yawToleranceDeg) {
    while (holdStart > 0 && Math.abs(smooth[holdStart - 1] - target) <= config.yawToleranceDeg) holdStart--;
  }
  const holdMs = valid.at(-1)!.timestampMs - valid[holdStart].timestampMs;
  const movingMs = firstMove >= 0 && firstTarget >= firstMove ? valid[firstTarget].timestampMs - valid[firstMove].timestampMs : null;
  let peak = 0, maxReversalDeg = 0;
  for (const v of smooth) { peak = Math.max(peak, v); maxReversalDeg = Math.max(maxReversalDeg, peak - v); }
  const trace: { timeMs: number; progress: number }[] = [];
  let cursor = 0;
  for (let i = 0; i < 64; i++) {
    const timeMs = duration * i / 63, t = start + timeMs;
    while (cursor < valid.length - 2 && valid[cursor + 1].timestampMs < t) cursor++;
    const fraction = (t - valid[cursor].timestampMs) / (valid[cursor + 1].timestampMs - valid[cursor].timestampMs);
    trace.push({ timeMs, progress: Math.max(-2, Math.min(2, (smooth[cursor] + fraction * (smooth[cursor + 1] - smooth[cursor])) / target)) });
  }
  // An explicitly synthetic ready → move → hold envelope, normalized in time.
  const reference = trace.map((_, i) => Math.max(0, Math.min(1, (i / 63 - 0.2) / 0.4)));
  const distance = engine.distance(trace.map(p => p.progress), reference, 12);
  const complete = motionObserved && startReady && firstTarget >= firstMove && holdMs >= config.finalHoldDurationMs && maxReversalDeg <= 15;
  const feedback: string[] = [];
  if (!startReady) feedback.push('Chưa ghi nhận đủ tư thế xuất phát nhìn thẳng camera trước khi quay.');
  if (!motionObserved) feedback.push('Camera chưa ghi nhận đủ các tư thế trung gian khi quay. Hãy thực hiện lại liên tục từ tư thế nhìn thẳng.');
  if (firstMove < 0) feedback.push('Chưa ghi nhận được chuyển động rõ ràng.');
  else if (firstTarget < 0) feedback.push('Chưa đạt tư thế đích theo hướng đã chọn.');
  if (maxReversalDeg > 15) feedback.push('Có đoạn quay ngược hướng hoặc quay trở lại sau khi đã tiến tới tư thế đích.');
  if (holdMs < config.finalHoldDurationMs) feedback.push('Chưa giữ liên tục tư thế kết thúc đủ thời gian.');
  if (movingMs !== null) feedback.push(`Thời gian chuyển động ghi nhận: ${(movingMs / 1000).toFixed(1)} giây.`);
  if (complete && maxReversalDeg <= 15) feedback.push('Đã ghi nhận đủ trình tự: chuẩn bị → chuyển động → giữ thế kết thúc.');
  return { status: 'analyzed', engine: engine.kind, reference: 'synthetic-turn-v1', distance, readyMs, movingMs, holdMs, maxReversalDeg, motionObserved, startReady, complete, feedback, trace };
}
