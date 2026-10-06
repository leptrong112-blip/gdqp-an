import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { overallPoseAssessment } from '../../src/features/pose-analysis/scoring/assessmentPolicy';
import { summarizeDrill } from '../../src/features/pose-analysis/scoring/basicDrill';
import { buildPoseResultSubmission } from '../../src/features/pose-analysis/results/buildPoseResult';
import { PoseFinalSummary } from '../../src/features/pose-analysis/components/PoseFinalSummary';
import type { ScoreResult } from '../../src/features/pose-analysis/scoring/scoringTypes';
import type { PoseFinalAttempt } from '../../src/features/pose-analysis/runtime/attemptTiming';

function result(total: number): Extract<ScoreResult, { status: 'scored' }> {
  return { status: 'scored', total, passed: total >= 65, assessment: total >= 65 ? 'pass' : 'fail', confidence: .95, corrections: [],
    criteria: [{ id: 'legs', label: 'Chân trụ', points: 11.4, maximum: 25, required: true, status: 'improve', statusLevel: 'NOT_ACHIEVED',
      feedback: 'Giữ chân trụ thẳng.', mistakes: ['Chân trụ chưa thẳng.'], measurements: [] }] };
}
test('overall grade passes at 6.5, fails below, and never guesses missing data', () => {
  assert.equal(overallPoseAssessment(65), 'pass');
  assert.equal(overallPoseAssessment(64.9), 'fail');
  assert.equal(overallPoseAssessment(83), 'pass');
  assert.equal(overallPoseAssessment(83, 10), 'incomplete');
  assert.equal(overallPoseAssessment(83, 0, false), 'incomplete');
});
test('8.3 overall pass retains the failed leg criterion in presentation and persistence', () => {
  const score = result(83);
  const summary = renderToStaticMarkup(React.createElement(PoseFinalSummary, { result: score, movementId: 'atEase', children: null }));
  assert.match(summary, /8\.3\/10/); assert.match(summary, />Đạt</); assert.match(summary, /Chưa đạt/);
  const attempt = { id: 'qa-policy-0001', movementId: 'atEase', startedAt: '2026-10-05T00:00:00.000Z', finishedAt: '2026-10-05T00:00:05.000Z', timing: {} } as PoseFinalAttempt;
  const saved = buildPoseResultSubmission(score, attempt, { studentName: 'QA policy', className: 'TEST', startedAt: attempt.startedAt }, 20);
  assert.ok(saved); assert.equal(saved.assessment, 'pass'); assert.equal(saved.requiredCriteriaPassed, false);
  assert.equal(saved.criteria[0].statusLevel, 'NOT_ACHIEVED'); assert.equal(saved.score, 83);
  assert.equal(saved.rubricVersion, 'v1.10-salute-dynamic');
});
test('three completed steps use their average and preserve individual low scores', () => {
  const drill = summarizeDrill((['attention', 'atEase', 'salute'] as const).map((movementId, i) => ({ movementId, result: result([20, 90, 90][i]) })));
  assert.equal(drill.totalPoints, 200); assert.equal(drill.passed, true);
  assert.equal(drill.steps[0].result.status === 'scored' && drill.steps[0].result.total, 20);
  const missing = result(90); missing.assessment = 'incomplete'; missing.unassessedPoints = 10;
  assert.equal(summarizeDrill([{ movementId: 'attention', result: result(20) }, { movementId: 'atEase', result: result(90) }, { movementId: 'salute', result: missing }]).passed, false);
});
