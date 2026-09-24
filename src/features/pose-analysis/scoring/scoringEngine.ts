import type { FeatureWindow } from '../types';
import { mad, mean, median } from '../pipeline/geometry';
import type { FeatureRule, MovementDefinition, ScoreResult } from './scoringTypes';
import { diagnoseMeasurements } from './postureFeedback';
import { evaluateDynamicAttempt } from './dynamicMovementAnalyzer';
import { TemporalMotionBuffer } from '../pipeline/motionBuffer';
import { javascriptSequenceEngine, type SequenceEngine } from './sequenceEngine';

export function ruleScore(value: number, rule: FeatureRule): number {
  const [lo, hi] = rule.ideal, [zeroLo, zeroHi] = rule.zero;
  if (value >= lo && value <= hi) return 1;
  if (value < lo) return lo === zeroLo ? 0 : Math.max(0, (value - zeroLo) / (lo - zeroLo));
  return hi === zeroHi ? 0 : Math.max(0, (zeroHi - value) / (zeroHi - hi));
}

export function evaluate(
  definition: MovementDefinition,
  window: FeatureWindow,
  motionBuffer?: TemporalMotionBuffer,
  sequenceEngine: SequenceEngine = javascriptSequenceEngine
): ScoreResult {
  if (definition.type === 'DYNAMIC') {
    if (!window.qualityPassed) return { status: 'notScorable', reasons: ['Chất lượng dữ liệu chưa đủ để phân tích chuyển động.'] };
    if (motionBuffer && motionBuffer.length > 0) {
      return evaluateDynamicAttempt(definition, motionBuffer, sequenceEngine);
    }
    const buf = new TemporalMotionBuffer(Math.max(150, window.samples.length));
    for (const s of window.samples) {
      const yaw = s.values.bodyYaw?.value ?? NaN;
      const conf = s.values.bodyYaw?.confidence ?? 0;
      buf.push({
        timestampMs: s.timestampMs,
        bodyYawDeg: yaw,
        confidence: conf,
        torsoTilt: s.values.torsoTilt?.value,
        shoulderTilt: s.values.shoulderTilt?.value,
        leftWristHipDistance: s.values.leftWristHipDistance?.value,
        rightWristHipDistance: s.values.rightWristHipDistance?.value,
        isReliable: Number.isFinite(yaw) && conf >= 0.6,
      });
    }
    return evaluateDynamicAttempt(definition, buf, sequenceEngine);
  }

  const refuse = (reason: string): ScoreResult => ({ status: 'notScorable', reasons: [reason] });
  if (!window.qualityPassed || window.validDurationMs < definition.minimumDurationMs || window.samples.length < definition.minimumSamples) return refuse('Chưa đủ thời gian và dữ liệu đáng tin cậy để chấm. Vui lòng thử lại.');
  const confidences: number[] = [];
  const criteria = [];
  for (const criterion of definition.criteria) {
    const measurements = [], scores: number[] = [], essentialScores: number[] = [];
    for (const rule of criterion.rules) {
      const valid = window.samples.map(s => s.values[rule.feature]).filter(v => !!v && Number.isFinite(v.value) && v.confidence >= 0.6);
      if (valid.length < Math.max(definition.minimumSamples, Math.ceil(window.samples.length * 0.85)) || mean(valid.map(v => v.confidence)) < 0.75) return refuse(`Không đủ dữ liệu rõ ràng cho tiêu chí “${criterion.label}”.`);
      const values = valid.map(v => v.value), value = median(values);
      measurements.push({ feature: rule.feature, value, variability: mad(values) });
      // Symmetric 5% trimming removes isolated spikes, never a sustained bad hold.
      const frameScores = values.map(v => ruleScore(v, rule)).sort((a, b) => a - b);
      const trim = definition.robustPosture ? Math.floor(frameScores.length * 0.05) : 0;
      const score = mean(frameScores.slice(trim, frameScores.length - trim));
      scores.push(score);
      if (rule.essential) essentialScores.push(score);
      confidences.push(...valid.map(v => v.confidence));
    }
    const fraction = definition.robustPosture ? Math.min(mean(scores), ...essentialScores) : Math.min(...scores);
    const points = Math.round(fraction * criterion.weight * 10) / 10;
    const diagnosis = diagnoseMeasurements(criterion.id, measurements, criterion.feedback, fraction, definition.robustPosture ? criterion.rules : undefined);
    criteria.push({
      id: criterion.id,
      label: criterion.label,
      points,
      maximum: criterion.weight,
      status: fraction >= 0.9 ? 'good' as const : 'improve' as const,
      statusLevel: diagnosis.statusLevel,
      feedback: fraction >= 0.9 ? 'Giữ tốt tiêu chí này.' : criterion.feedback,
      specificFeedback: diagnosis.specificFeedback,
      mistakes: diagnosis.mistakes,
      measurements,
      required: criterion.required,
    });
  }
  const total = Math.round(criteria.reduce((sum, c) => sum + c.points, 0));
  return {
    status: 'scored',
    total,
    ...(definition.robustPosture ? { passed: total >= 65 && criteria.every(c => !c.required || c.points / c.maximum >= 0.6) } : {}),
    confidence: mean(confidences),
    criteria,
    corrections: [...criteria]
      .filter(c => c.status === 'improve')
      .sort((a, b) => (b.maximum - b.points) - (a.maximum - a.points))
      .slice(0, 2)
      .map(c => c.feedback),
  };
}
