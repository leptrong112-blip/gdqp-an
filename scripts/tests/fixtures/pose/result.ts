import type { PoseResultSubmission, PoseResultStep } from '../../../../src/features/pose-analysis/results/poseResultTypes';

export function finalPoseSubmission(overrides: Partial<PoseResultSubmission> = {}): PoseResultSubmission {
  return {
    id: 'attempt-fixture-001', studentName: 'Nguyễn Minh An', className: '10A1', movementId: 'attention', movementLabel: 'Động tác đứng nghiêm',
    score: 90, passed: true, assessment: 'pass', requiredCriteriaPassed: true,
    criteria: [{ id: 'torso', label: 'Thân người thẳng', points: 90, maximum: 100, statusLevel: 'PASS', required: true, feedback: 'Đã giữ thân người thẳng.' }],
    conciseFeedback: [], quality: { confidence: 0.95, unassessedPoints: 0 },
    startedAt: '2026-10-04T00:00:00.000Z', finishedAt: '2026-10-04T00:00:05.000Z', processingLatencyMs: 18.5,
    rubricVersion: 'v1.7-salute-hand-observation', ...overrides
  };
}
export function finalDrillSubmission(): PoseResultSubmission {
  const single = finalPoseSubmission();
  const stepResults: PoseResultStep[] = (['attention', 'atEase', 'salute'] as const).map(movementId => ({
    movementId, movementLabel: movementId, score: single.score, passed: single.passed, assessment: single.assessment,
    requiredCriteriaPassed: single.requiredCriteriaPassed, criteria: single.criteria, conciseFeedback: single.conciseFeedback, quality: single.quality
  }));
  return finalPoseSubmission({ id: 'drill-fixture-001', movementId: 'basicDrill', movementLabel: 'Chuỗi điều lệnh cơ bản',
    criteria: stepResults.flatMap(step => step.criteria.map(criterion => ({ ...criterion, id: `${step.movementId}:${criterion.id}` }))), stepResults });
}
