import type { ScoreResult } from '../scoring/scoringTypes';
import type { PoseFinalAttempt } from '../runtime/attemptTiming';
import { freezeSnapshot } from '../runtime/attemptTiming';
import { EXERCISE_CATALOG } from '../scoring/movements';
import { DRILL_LABELS, DRILL_IDS } from '../scoring/basicDrill';
import { concisePoseFeedback, criterionLevel, requiredCriteriaPassed } from './resultPresentation';
import { parsePoseResultSubmission, type PoseResultCriterion, type PoseResultStep, type PoseResultSubmission } from './poseResultTypes';
import type { PoseStudentSession } from './studentSession';
import { overallPoseAssessment } from '../scoring/assessmentPolicy';

export const POSE_SCORING_VERSION = 'v1.10-salute-dynamic';

function scoredFields(result: Extract<ScoreResult, { status: 'scored' }>) {
  const criteria: PoseResultCriterion[] = result.criteria.map(criterion => ({
    id: criterion.id, label: criterion.label, points: criterion.points, maximum: criterion.maximum,
    statusLevel: criterionLevel(criterion), required: !!criterion.required,
    feedback: criterion.specificFeedback || criterion.feedback,
  }));
  const missing = criteria.some(c => c.statusLevel === 'NOT_SCORABLE') || result.assessment === 'incomplete';
  const assessment = overallPoseAssessment(result.total, missing ? 1 : 0);
  return {
    score: result.total, passed: assessment === 'pass', assessment, requiredCriteriaPassed: requiredCriteriaPassed(result),
    criteria, conciseFeedback: concisePoseFeedback(result),
    quality: { ...(Number.isFinite(result.confidence) ? { confidence: result.confidence } : {}),
      unassessedPoints: result.unassessedPoints ?? criteria.filter(c => c.statusLevel === 'NOT_SCORABLE').reduce((sum, c) => sum + c.maximum, 0) },
  };
}

/** Only completed scored attempts cross the persistence boundary; no camera data is copied. */
export function buildPoseResultSubmission(result: ScoreResult, attempt: PoseFinalAttempt, student: PoseStudentSession, processingLatencyMs: number | null): PoseResultSubmission | null {
  if (result.status !== 'scored') return null;
  let fields = scoredFields(result);
  let stepResults: PoseResultStep[] | undefined;
  if (attempt.movementId === 'basicDrill') {
    if (!result.drill || result.drill.completion !== 1 || result.drill.steps.length !== 3 || result.drill.steps.some(step => step.result.status !== 'scored')) return null;
    stepResults = result.drill.steps.map((step, index) => ({
      movementId: step.movementId, movementLabel: DRILL_LABELS[index], ...scoredFields(step.result as Extract<ScoreResult, { status: 'scored' }>),
    }));
    if (stepResults.some((step, index) => step.movementId !== DRILL_IDS[index])) return null;
    fields = { ...fields,
      criteria: stepResults.flatMap(step => step.criteria.map(criterion => ({ ...criterion, id: `${step.movementId}:${criterion.id}`, label: `${step.movementLabel}: ${criterion.label}` }))),
      quality: { ...fields.quality, unassessedPoints: stepResults.reduce((sum, step) => sum + (step.quality?.unassessedPoints ?? 0), 0) / 3 },
    };
  }
  const parsed = parsePoseResultSubmission({
    id: attempt.id, studentName: student.studentName, className: student.className,
    movementId: attempt.movementId, movementLabel: EXERCISE_CATALOG.find(item => item.id === attempt.movementId)?.name ?? 'AI Pose',
    ...fields, ...(stepResults ? { stepResults } : {}), startedAt: attempt.startedAt, finishedAt: attempt.finishedAt,
    ...(result.precondition ? { preconditionResult: { movementId: 'attention', movementLabel: 'Đứng nghiêm', ...scoredFields(result.precondition.result) } } : {}),
    processingLatencyMs, rubricVersion: POSE_SCORING_VERSION,
  });
  return parsed ? freezeSnapshot(parsed) : null;
}
