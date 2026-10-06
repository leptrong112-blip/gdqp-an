import type { CriterionResult, ScoreResult } from '../scoring/scoringTypes';
import { DRILL_LABELS, DRILL_IDS } from '../scoring/basicDrill';
import type { PoseFinalAttempt } from '../runtime/attemptTiming';

export function displayedProcessingLatency(
  attempt: PoseFinalAttempt | null,
  presentation: { id: string; latencyMs: number } | null,
): number | undefined {
  if (!attempt) return undefined;
  return presentation?.id === attempt.id ? presentation.latencyMs : attempt.timing.processingLatencyMs;
}

export interface ConcisePoseFeedback {
  criterionId: string;
  label: string;
  type: 'MOTION_ERROR' | 'INSUFFICIENT_EVIDENCE';
  message: string;
  required: boolean;
}

export function criterionLevel(criterion: CriterionResult) {
  return criterion.statusLevel ?? (criterion.points / criterion.maximum >= 0.9 ? 'PASS' : 'NEEDS_ADJUSTMENT');
}

export function concisePoseFeedback(result: ScoreResult): ConcisePoseFeedback[] {
  if (result.drill) return result.drill.steps.flatMap(step => {
    const label = DRILL_LABELS[DRILL_IDS.indexOf(step.movementId)];
    return concisePoseFeedback(step.result).map(item => ({ ...item, criterionId: `${step.movementId}:${item.criterionId}`, label: `${label}: ${item.label}` }));
  }).sort(priority);
  if (result.status === 'notScorable') return result.reasons.map((message, index) => ({
    criterionId: `evidence-${index}`, label: 'Camera chưa ghi nhận đủ', type: 'INSUFFICIENT_EVIDENCE' as const, message, required: false,
  }));
  return result.criteria.filter(c => criterionLevel(c) !== 'PASS').map(c => {
    const missing = criterionLevel(c) === 'NOT_SCORABLE';
    const failed = criterionLevel(c) === 'NOT_ACHIEVED' || (c.required && c.points / c.maximum < 0.6);
    return {
      criterionId: c.id, label: c.label, required: !!c.required,
      type: missing ? 'INSUFFICIENT_EVIDENCE' as const : 'MOTION_ERROR' as const,
      message: missing ? 'Camera chưa có đủ dữ liệu để đánh giá.' : failed ? 'Chưa đạt' : 'Cần điều chỉnh',
    };
  }).sort(priority);
}

function priority(a: ConcisePoseFeedback, b: ConcisePoseFeedback) {
  const rank = (item: ConcisePoseFeedback) => item.type === 'INSUFFICIENT_EVIDENCE' ? 3 : item.required && item.message === 'Chưa đạt' ? 0 : item.message === 'Chưa đạt' ? 1 : 2;
  return rank(a) - rank(b);
}

export function requiredCriteriaPassed(result: ScoreResult): boolean | null {
  if (result.status !== 'scored') return null;
  if (result.drill) {
    const states = result.drill.steps.map(step => requiredCriteriaPassed(step.result));
    return states.includes(false) ? false : states.includes(null) || result.drill.completion < 1 ? null : true;
  }
  const required = result.criteria.filter(c => c.required);
  if (required.some(c => criterionLevel(c) !== 'NOT_SCORABLE' && c.points / c.maximum < 0.6)) return false;
  return required.some(c => criterionLevel(c) === 'NOT_SCORABLE') ? null : true;
}
