import { attentionMovement } from './attentionMovement';
import { atEaseMovement } from './atEaseMovement';
import { saluteMovement } from './saluteMovement';
import type { DrillStepResult, DrillSummary, ScoreResult } from './scoringTypes';

export const BASIC_DRILL = [attentionMovement, atEaseMovement, saluteMovement] as const;
export const DRILL_IDS = ['attention', 'atEase', 'salute'] as const;
export const DRILL_LABELS = ['Đứng nghiêm', 'Đứng nghỉ', 'Chào'] as const;

// Reuse the existing 65/100 pass band; every step must pass, not just the average.
export function stepPassed(result: ScoreResult): boolean {
  return result.status === 'scored' && result.total >= 65 && result.passed !== false &&
    result.criteria.every(c => !(c.required || c.id === 'saluteArm') || c.points / c.maximum >= 0.6);
}
export function summarizeDrill(steps: DrillStepResult[]): DrillSummary {
  const completed = steps.filter(s => s.result.status === 'scored');
  return { steps: [...steps], totalPoints: completed.reduce((sum, s) => sum + (s.result.status === 'scored' ? s.result.total : 0), 0),
    maximum: 300, completion: completed.length / BASIC_DRILL.length,
    passed: completed.length === BASIC_DRILL.length && steps.every(s => stepPassed(s.result)) };
}
