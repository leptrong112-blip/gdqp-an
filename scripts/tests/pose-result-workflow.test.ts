import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createPoseStudentSession } from '../../src/features/pose-analysis/results/studentSession';
import { buildPoseResultSubmission } from '../../src/features/pose-analysis/results/buildPoseResult';
import { concisePoseFeedback, displayedProcessingLatency, requiredCriteriaPassed } from '../../src/features/pose-analysis/results/resultPresentation';
import { PoseResultSaver } from '../../src/features/pose-analysis/results/resultSaver';
import { ScoreResults } from '../../src/features/pose-analysis/components/ScoreResults';
import { PoseStudentForm } from '../../src/features/pose-analysis/components/PoseStudentForm';
import { PoseResultDialog } from '../../src/features/pose-analysis/components/PoseResultDialog';
import { PoseStepDashboard } from '../../src/features/pose-analysis/components/PoseStepDashboard';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import type { PoseFinalAttempt } from '../../src/features/pose-analysis/runtime/attemptTiming';
import type { ScoreResult } from '../../src/features/pose-analysis/scoring/scoringTypes';
import { evaluate } from '../../src/features/pose-analysis/scoring/scoringEngine';
import { BASIC_DRILL, summarizeDrill } from '../../src/features/pose-analysis/scoring/basicDrill';
import { extractFeatures } from '../../src/features/pose-analysis/pipeline/featureExtraction';
import { createCalibration, normalizePose } from '../../src/features/pose-analysis/pipeline/normalization';
import { saluteHandMetrics } from '../../src/features/pose-analysis/pipeline/saluteHand';
import { attentionFrame, goodLighting, rotatedPoseFrame } from './fixtures/pose/attention';
import { drillFrame } from './fixtures/pose/drill';

const student = createPoseStudentSession('  Học sinh mô phỏng  ', ' 10A1 ')!;
const attempt: PoseFinalAttempt = { id: 'workflow-attempt-001', movementId: 'attention', startedAt: '2026-10-04T03:00:00.000Z', finishedAt: '2026-10-04T03:00:10.000Z', timing: {
  attemptStartedAtMs: 0, scoringWindowFinishedAtMs: 9900, finalFrameProcessedAtMs: 9910, resultFinalizedAtMs: 9920,
  uiReceivedAtMs: 9930, inferenceMs: 10, finalizationMs: 10, processingLatencyMs: 30,
} };
test('result latency is safe before the first attempt and never uses a previous attempt presentation', () => {
  assert.equal(displayedProcessingLatency(null, null), undefined);
  assert.equal(displayedProcessingLatency(null, { id: attempt.id, latencyMs: 42 }), undefined);
  assert.equal(displayedProcessingLatency(attempt, null), 30);
  assert.equal(displayedProcessingLatency(attempt, { id: 'previous-attempt', latencyMs: 42 }), 30);
  assert.equal(displayedProcessingLatency(attempt, { id: attempt.id, latencyMs: 42 }), 42);
});
test('viewing movement instructions before opening the camera never claims the quality gate passed', () => {
  const props = { stage: 'idle' as const, ready: false, progress: 0, result: null, activeStep: 2 as const,
    onStart() {}, onStop() {}, onCalibrate() {} };
  const idle = renderToStaticMarkup(React.createElement(PoseStepDashboard, props));
  assert.ok(idle.includes('Bước 1: Kiểm tra vị trí camera'));
  assert.ok(!idle.includes('Vị trí camera đã đạt chuẩn'));
  assert.ok(renderToStaticMarkup(React.createElement(PoseStepDashboard, { ...props, ready: true })).includes('Vị trí camera đã đạt chuẩn'));
});
function posture(id: 'attention' | 'atEase' | 'salute', hands = true): ScoreResult {
  const profile = createCalibration(Array.from({ length: 20 }, () => attentionFrame()))!;
  const samples = Array.from({ length: 31 }, (_, index) => {
    const frame = drillFrame(id, index * 100), sample = extractFeatures(normalizePose(frame, profile)!);
    if (hands && id === 'salute') sample.saluteHand = saluteHandMetrics(frame);
    return sample;
  });
  return evaluate(BASIC_DRILL.find(movement => movement.id === id)!, { samples, validDurationMs: 3000, qualityPassed: true });
}

test('student session trims and validates required identity, then keeps an immutable copy', () => {
  assert.equal(student.studentName, 'Học sinh mô phỏng'); assert.equal(student.className, '10A1');
  assert.ok(Object.isFrozen(student));
  for (const [name, room] of [[' ', '10A1'], ['Name', ' '], ['x'.repeat(121), '10A1'], ['Name', 'x'.repeat(41)], ['Name\u0001', '10A1']]) assert.equal(createPoseStudentSession(name, room), null);
});

test('real scored postures become validated immutable records without measurement or camera data', () => {
  for (const id of ['attention', 'atEase', 'salute'] as const) {
    const result = posture(id);
    const record = buildPoseResultSubmission(result, { ...attempt, movementId: id }, student, 42.5);
    assert.ok(record, id); assert.equal(record.assessment, 'pass'); assert.equal(record.score, 100);
    assert.equal(record.studentName, student.studentName); assert.equal(record.processingLatencyMs, 42.5);
    assert.ok(Object.isFrozen(record.criteria[0]));
    const encoded = JSON.stringify(record);
    for (const forbidden of ['landmarks', 'measurements', 'image', 'video', 'sequence', 'turnTechnique']) assert.ok(!encoded.includes(`"${forbidden}"`));
  }
  const unknown = buildPoseResultSubmission(posture('salute', false), { ...attempt, movementId: 'salute' }, student, null)!;
  assert.equal(unknown.assessment, 'incomplete'); assert.equal(unknown.passed, false);
  assert.equal(unknown.quality!.unassessedPoints, 10);
  assert.equal(unknown.conciseFeedback.find(item => item.criterionId === 'saluteHand')!.type, 'INSUFFICIENT_EVIDENCE');
  assert.equal(buildPoseResultSubmission({ status: 'notScorable', reasons: ['Tracking mất'] }, attempt, student, null), null);
});

test('Basic Drill stores one finalized sequence with three separate immutable steps; partial drills do not save', () => {
  const steps = (['attention', 'atEase', 'salute'] as const).map(movementId => ({ movementId, result: posture(movementId, false) }));
  const drill = summarizeDrill(steps);
  const result: ScoreResult = { status: 'scored', total: Math.round(drill.totalPoints / 3), confidence: .99, criteria: [], corrections: [], assessment: 'incomplete', passed: false, drill };
  const record = buildPoseResultSubmission(result, { ...attempt, movementId: 'basicDrill' }, student, 55)!;
  assert.ok(record); assert.equal(record.stepResults!.length, 3); assert.equal(record.assessment, 'incomplete');
  assert.equal(record.stepResults![0].score, 100); assert.equal(record.stepResults![2].assessment, 'incomplete');
  assert.ok(record.criteria.some(criterion => criterion.id === 'salute:saluteHand'));
  assert.equal(record.quality!.unassessedPoints, 10 / 3);
  const before = JSON.stringify(record);
  if (steps[0].result.status === 'scored') steps[0].result.criteria[0].points = 0;
  assert.equal(JSON.stringify(record), before);
  assert.equal(buildPoseResultSubmission({ ...result, drill: summarizeDrill(steps.slice(0, 2)) }, { ...attempt, movementId: 'basicDrill' }, student, 55), null);
});

test('both actual turn completion paths can be saved with their score-based overall results', () => {
  for (const [movementId, direction] of [['turnLeft', 1], ['turnRight', -1]] as const) {
    for (const sign of [direction, -direction]) {
    const processor = new SessionProcessor();
    const events: ReturnType<SessionProcessor['process']> = [];
    processor.command(movementId === 'turnLeft' ? 'selectTurnLeft' : 'selectTurnRight');
    for (let t = 0; t <= 2000; t += 100) processor.process(attentionFrame(t), goodLighting, 10);
    processor.command('startCalibration');
    let cue = 0;
    for (let t = 2100; t <= 12000; t += 100) {
      const event = processor.process(attentionFrame(t), goodLighting, 10).find(event => event.type === 'analysis');
      if (event?.type === 'analysis' && event.snapshot.stage === 'scoring') { cue = t; break; }
    }
    assert.ok(cue > 0);
    for (let dt = 100; dt <= 10000; dt += 100) {
      const yaw = sign * Math.min(90, dt / 600 * 90);
      events.push(...processor.process(rotatedPoseFrame(yaw, cue + dt), goodLighting, 10));
    }
    const scored = events.find(event => event.type === 'score');
    assert.ok(scored?.type === 'score', movementId);
    const record = buildPoseResultSubmission(scored.result, { ...attempt, movementId }, student, 20);
    assert.ok(record, movementId);
    if (sign !== direction) {
      assert.equal(record.assessment, record.criteria.some(c => c.statusLevel === 'NOT_SCORABLE') ? 'incomplete' : record.score >= 65 ? 'pass' : 'fail');
      assert.equal(record.criteria.find(c => c.id === 'direction')!.statusLevel, 'NOT_ACHIEVED');
    }
    }
  }
});

test('concise feedback prioritizes required errors and separates unobserved criteria from movement errors', () => {
  const result = posture('attention'); assert.ok(result.status === 'scored');
  result.criteria[0] = { ...result.criteria[0], id: 'minor', label: 'Lỗi nhẹ', points: 8, maximum: 10, statusLevel: 'NEEDS_ADJUSTMENT', required: false };
  result.criteria[1] = { ...result.criteria[1], id: 'required', label: 'Bắt buộc sai', points: 0, maximum: 10, statusLevel: 'NOT_ACHIEVED', required: true };
  result.criteria[2] = { ...result.criteria[2], id: 'missing', label: 'Chân bị che', points: 0, maximum: 10, statusLevel: 'NOT_SCORABLE', required: true };
  const items = concisePoseFeedback(result);
  assert.equal(items[0].criterionId, 'required'); assert.equal(items.at(-1)!.type, 'INSUFFICIENT_EVIDENCE');
  assert.ok(items.every(item => !result.criteria.some(c => c.id === item.criterionId && c.statusLevel === 'PASS')));
  assert.equal(requiredCriteriaPassed(result), false);
  result.criteria[1].points = 10; result.criteria[1].statusLevel = 'PASS';
  assert.equal(requiredCriteriaPassed(result), null);
});

test('student result starts concise/collapsed, has no export actions, and labels unknown evidence separately', () => {
  const result = posture('salute', false);
  const markup = renderToStaticMarkup(React.createElement(ScoreResults, { result, movementId: 'salute', concise: true }));
  assert.ok(markup.includes('Camera chưa ghi nhận đủ')); assert.ok(markup.includes('9/9'));
  assert.ok(markup.includes('Xem thông số chi tiết')); assert.ok(!markup.includes('CHI TIẾT YÊU CẦU BÀI TẬP'));
  assert.ok(!markup.includes('0 / 10')); assert.ok(!markup.includes('<details open'));
  const dialog = renderToStaticMarkup(React.createElement(PoseResultDialog, { result, movementId: 'salute', student, open: true, onClose() {}, onRetry() {} }));
  for (const word of ['Xuất', 'Download', 'Print', 'Excel', 'CSV', 'JSON', 'PDF']) assert.ok(!dialog.includes(word), word);
  assert.ok(dialog.includes(student.studentName)); assert.ok(dialog.includes('10A1'));
  const form = renderToStaticMarkup(React.createElement(PoseStudentForm, { onStart() {} }));
  assert.ok(form.includes('Thông tin học sinh')); assert.ok(form.includes('required=""')); assert.ok(!form.includes('Xuất'));
});

test('async save keeps the result visible, deduplicates rerenders, retries the same frozen identity after API failure', async () => {
  const recordA = buildPoseResultSubmission(posture('attention'), attempt, student, 20)!;
  const studentB = createPoseStudentSession('Học sinh B', '11B2')!;
  const recordB = buildPoseResultSubmission(posture('attention'), { ...attempt, id: 'workflow-attempt-002' }, studentB, 30)!;
  let finishA!: () => void;
  const calls: typeof recordA[] = [];
  let firstA = true;
  const saver = new PoseResultSaver(async record => {
    calls.push(record);
    if (record.id === recordA.id && firstA) { firstA = false; await new Promise<void>(resolve => { finishA = resolve; }); throw new Error('API unavailable'); }
  });
  const visible = recordA;
  const pending = saver.submit(recordA);
  assert.equal(saver.submit({ ...recordA, studentName: 'Wrong replacement' }), pending);
  assert.equal(saver.getState(recordA.id)!.status, 'saving'); assert.equal(visible.studentName, student.studentName);
  await Promise.resolve(); await saver.submit(recordB); finishA(); await pending;
  assert.equal(saver.getState(recordB.id)!.status, 'saved'); assert.equal(saver.getState(recordA.id)!.status, 'error');
  await saver.retry(recordA.id);
  await saver.submit(recordA); await saver.retry(recordA.id);
  assert.equal(calls.length, 3); assert.deepEqual(calls.filter(record => record.id === recordA.id).map(record => record.studentName), [student.studentName, student.studentName]);
  assert.equal(saver.getState(recordA.id)!.status, 'saved'); assert.equal(saver.getState(recordB.id)!.status, 'saved');
});

test('official result save survives a dialog closed before RAF and student switches; timing stays null when unmeasured', async () => {
  const record = buildPoseResultSubmission(posture('attention'), attempt, student, null)!;
  const saved: typeof record[] = [];
  const saver = new PoseResultSaver(async value => { saved.push(value); });
  saver.prepare(record, 1);
  saver.prepare({ ...record, studentName: 'Another student' }, 1);
  // No presented callback: closing/unmounting the dialog must not cancel persistence.
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(saved.length, 1); assert.equal(saved[0].studentName, student.studentName); assert.equal(saved[0].processingLatencyMs, null);
  assert.equal(saver.getState(record.id)!.status, 'saved');
  saver.presented(record.id, 999);
  assert.equal(saved[0].processingLatencyMs, null);
});

test('first result paint supplies T3→T7 once, then opening again cannot rewrite the persisted snapshot', async () => {
  const record = buildPoseResultSubmission(posture('attention'), attempt, student, null)!;
  const saved: typeof record[] = [];
  const saver = new PoseResultSaver(async value => { saved.push(value); });
  saver.prepare(record);
  saver.presented(record.id, 73.25);
  await Promise.resolve(); await Promise.resolve(); await saver.retry(record.id);
  saver.presented(record.id, 2000);
  assert.equal(saved.length, 1); assert.equal(saved[0].processingLatencyMs, 73.25); assert.ok(Object.isFrozen(saved[0]));
});
