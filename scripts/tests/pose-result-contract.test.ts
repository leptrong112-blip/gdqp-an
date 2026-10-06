import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePoseResultSubmission, parsePoseResultFilters, filterPoseResults, validatePoseStudentInfo } from '../../src/features/pose-analysis/results/poseResultTypes';
import { finalPoseSubmission, finalDrillSubmission } from './fixtures/pose/result';
import { createPoseSubmissionLimiter } from '../../server/poseResultPolicy';

test('FinalResult validation whitelists learning data and rejects partial, malformed or non-finite results', () => {
  const input = finalPoseSubmission();
  const sanitized = parsePoseResultSubmission({ ...input, video: 'private', rawLandmarks: [1, 2], image: 'private', createdAt: 'forged',
    quality: { ...input.quality, face: 'private' }, criteria: input.criteria.map(criterion => ({ ...criterion, measurements: [1, 2] })) });
  assert.deepEqual(sanitized, input);
  for (const invalid of [null, [], { ...input, id: 'x' }, { ...input, studentName: ' ' }, { ...input, className: 'x'.repeat(41) },
    { ...input, score: NaN }, { ...input, score: 101 }, { ...input, passed: false }, { ...input, assessment: 'incomplete' },
    { ...input, startedAt: 'tomorrow' }, { ...input, startedAt: '2026-02-30T00:00:00Z' }, { ...input, finishedAt: '2026-10-03T00:00:00.000Z' }, { ...input, processingLatencyMs: -1 },
    { ...input, quality: { confidence: 100 } }, { ...input, criteria: [] }, { ...input, stepResults: [] },
    { ...input, criteria: [{ ...input.criteria[0], points: 101 }] }, { ...input, criteria: [input.criteria[0], input.criteria[0]] }]) {
    assert.equal(parsePoseResultSubmission(invalid), null);
  }
  assert.deepEqual(validatePoseStudentInfo(' Nguyễn Minh An ', ' 10A1 '), { studentName: 'Nguyễn Minh An', className: '10A1' });
  assert.equal(validatePoseStudentInfo('A\nB', '10A1'), null);
});

test('Missing evidence remains incomplete; Basic Drill accepts only three finalized ordered scored steps', () => {
  const input = finalPoseSubmission({ score: 90, passed: false, assessment: 'incomplete', requiredCriteriaPassed: null,
    criteria: [{ id: 'arm', label: 'Tay trái', points: 0, maximum: 10, required: true, statusLevel: 'NOT_SCORABLE', feedback: 'Camera chưa thấy tay trái.' },
      { id: 'body', label: 'Thân người', points: 90, maximum: 90, statusLevel: 'PASS', feedback: 'Đã đạt.' }],
    conciseFeedback: [{ criterionId: 'arm', label: 'Tay trái', type: 'INSUFFICIENT_EVIDENCE', message: 'Camera chưa thấy tay trái.' }],
    quality: { confidence: 0.9, unassessedPoints: 10 } });
  assert.deepEqual(parsePoseResultSubmission(input), input);
  assert.equal(parsePoseResultSubmission({ ...input, conciseFeedback: [{ ...input.conciseFeedback[0], type: 'MOTION_ERROR' }] }), null);
  assert.equal(parsePoseResultSubmission({ ...input, criteria: input.criteria.map(item => ({ ...item, points: item.statusLevel === 'NOT_SCORABLE' ? 10 : item.points })) }), null);
  const drill = finalDrillSubmission();
  assert.deepEqual(parsePoseResultSubmission(drill), drill);
  assert.equal(parsePoseResultSubmission({ ...drill, stepResults: drill.stepResults!.slice(0, 2) }), null);
  assert.equal(parsePoseResultSubmission({ ...drill, stepResults: [...drill.stepResults!].reverse() }), null);
  assert.equal(parsePoseResultSubmission({ ...drill, stepResults: drill.stepResults!.map(step => ({ ...step, score: 101 })) }), null);
});

test('optional attention precondition is separately whitelisted, not averaged or faked for an incomplete preparation', () => {
  const step = finalDrillSubmission().stepResults![0];
  const input = finalPoseSubmission({ movementId: 'atEase', score: 75, preconditionResult: step });
  assert.deepEqual(parsePoseResultSubmission(input), input);
  const parsed = parsePoseResultSubmission({ ...input, preconditionResult: { ...step, image: 'secret', rawLandmarks: [1] } })!;
  assert.equal(parsed.score, 75); assert.equal(parsed.preconditionResult!.score, 90);
  assert.ok(!JSON.stringify(parsed).includes('secret'));
  assert.equal(parsePoseResultSubmission({ ...input, movementId: 'attention' }), null);
  assert.equal(parsePoseResultSubmission({ ...input, preconditionResult: { ...step, movementId: 'atEase' } }), null);
  assert.equal(parsePoseResultSubmission({ ...input, preconditionResult: { ...step, passed: false, assessment: 'fail', score: 20 } }), null);
});

test('Filters preserve Unicode names, inclusive dates, assessment and deterministic score/newest ordering', () => {
  const records = [finalPoseSubmission(), finalPoseSubmission({ id: 'attempt-fixture-002', studentName: 'Trần Bảo', className: '11B2', movementId: 'salute', score: 95,
    finishedAt: '2026-10-05T23:59:59.999Z' })].map(result => ({ ...result, createdAt: '2026-10-06T00:00:00.000Z' }));
  const filters = parsePoseResultFilters(new URLSearchParams({ studentName: ' nguyễn ', className: '10a', from: '2026-10-04', to: '2026-10-04' }));
  assert.deepEqual(filterPoseResults(records, filters).map(record => record.id), ['attempt-fixture-001']);
  assert.deepEqual(filterPoseResults(records, parsePoseResultFilters(new URLSearchParams({ from: '2026-10-04', to: '2026-10-05', sort: 'score' }))).map(record => record.id),
    ['attempt-fixture-002', 'attempt-fixture-001']);
  assert.deepEqual(filterPoseResults(records, { assessment: 'fail' }), []);
  assert.deepEqual(filterPoseResults(records, { from: '2026-10-04T07:00:00+07:00', to: '2026-10-04T07:00:06+07:00' }).map(record => record.id), ['attempt-fixture-001']);
  assert.equal(parsePoseResultFilters(new URLSearchParams({ from: '2026-13-32', to: '2026-02-30' })).from, undefined);
  assert.equal(parsePoseResultFilters(new URLSearchParams({ from: '2026-13-32', to: '2026-02-30' })).to, undefined);
});

test('Anonymous result submission rate protection expires without keeping student identities', () => {
  const allow = createPoseSubmissionLimiter();
  for (let i = 0; i < 120; i++) assert.equal(allow('client', 1000), true);
  assert.equal(allow('client', 1000), false);
  assert.equal(allow('other-client', 1000), true);
  assert.equal(allow('client', 601000), true);
});
