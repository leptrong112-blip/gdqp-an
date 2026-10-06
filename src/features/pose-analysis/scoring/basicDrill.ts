import { attentionMovement } from './attentionMovement';
import { overallPoseAssessment } from './assessmentPolicy';
import { atEaseMovement } from './atEaseMovement';
import { saluteMovement } from './saluteMovement';
import type { DrillStepResult, DrillSummary, ScoreResult } from './scoringTypes';

export const BASIC_DRILL = [attentionMovement, atEaseMovement, saluteMovement] as const;
export const DRILL_IDS = ['attention', 'atEase', 'salute'] as const;
export const DRILL_LABELS = ['Đứng nghiêm', 'Đứng nghỉ', 'Chào'] as const;

// Each step keeps its own finding; the overall chain uses the mean of all three.
export function stepPassed(result: ScoreResult): boolean {
  return result.status === 'scored' && result.assessment !== 'incomplete' && overallPoseAssessment(result.total, result.unassessedPoints ??
    result.criteria.filter(c => c.statusLevel === 'NOT_SCORABLE').reduce((sum, c) => sum + c.maximum, 0)) === 'pass';
}
export function summarizeDrill(steps: DrillStepResult[]): DrillSummary {
  const completed = steps.filter(s => s.result.status === 'scored');
  const totalPoints = completed.reduce((sum, s) => sum + (s.result.status === 'scored' ? s.result.total : 0), 0);
  const missing = steps.some(s => s.result.status !== 'scored' || s.result.assessment === 'incomplete' || s.result.criteria.some(c => c.statusLevel === 'NOT_SCORABLE'));
  return { steps: [...steps], totalPoints,
    maximum: 300, completion: completed.length / BASIC_DRILL.length,
    passed: overallPoseAssessment(Math.round(totalPoints / 3), missing ? 1 : 0, completed.length === BASIC_DRILL.length) === 'pass' };
}
