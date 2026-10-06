import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { attentionFrame, rotatedPoseFrame, goodLighting } from './fixtures/pose/attention';
import { DiagnosticSessionRecorder, diagnosticReportToCsv } from '../../src/features/pose-analysis/diagnostics/diagnosticSession';
import { QualityChecker } from '../../src/features/pose-analysis/pipeline/qualityChecks';
import { extractDualMeasurements } from '../../src/features/pose-analysis/diagnostics/dualMeasurement';
import { extractFeatures } from '../../src/features/pose-analysis/pipeline/featureExtraction';
import { createCalibration, normalizePose } from '../../src/features/pose-analysis/pipeline/normalization';
import type { WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';
import type { ScoreResult } from '../../src/features/pose-analysis/scoring/scoringTypes';

const quality = new QualityChecker().check(attentionFrame(), goodLighting);
const passed: ScoreResult = { status: 'scored', total: 100, passed: true, confidence: .99, criteria: [], corrections: [] };
function ready(fps: number, sign: number) {
  const session = new SessionProcessor(), step = 1000 / fps;
  session.command(sign > 0 ? 'selectTurnLeft' : 'selectTurnRight');
  let t = 0;
  for (; t < 1600; t += step) session.process(attentionFrame(t), goodLighting, 20);
  session.command('startCalibration');
  for (; t < 12000; t += step) {
    const events = session.process(attentionFrame(t), goodLighting, 20);
    if (events.some(e => e.type === 'analysis' && e.snapshot.stage === 'scoring')) return { session, t, step };
  }
  throw new Error(`Not ready at ${fps} FPS`);
}
for (const fps of [5, 8, 10, 15]) for (const sign of [1, -1]) for (const turnMs of [800, 1400, 3500]) {
  test(`preflight: full ${sign > 0 ? 'left' : 'right'} turn at ${fps} FPS in ${turnMs}ms`, () => {
    const { session, t, step } = ready(fps, sign);
    const events: WorkerEvent[] = [];
    for (let dt = step; dt < 10000; dt += step) {
      events.push(...session.process(rotatedPoseFrame(sign * Math.min(90, dt / turnMs * 90), t + dt, true), goodLighting, 20));
    }
    const scores = events.filter(e => e.type === 'score');
    assert.equal(scores.length, 1);
    const score = scores[0].result;
    assert.ok(score.status === 'scored', JSON.stringify(score));
    assert.equal(score.passed, true, JSON.stringify(score));
    assert.equal(score.total, 100);
  });
}
test('nonfinite, duplicate and backwards timestamps cannot poison a session clock', () => {
  const { session, t, step } = ready(10, 1);
  for (const invalid of [NaN, Infinity, -1, t, t - step]) assert.deepEqual(session.process(attentionFrame(invalid), goodLighting, 20), []);
  const events: WorkerEvent[] = [];
  for (let dt = step; dt <= 4000; dt += step) events.push(...session.process(rotatedPoseFrame(Math.min(90, dt * .1), t + dt), goodLighting, 20));
  assert.ok(events.some(e => e.type === 'score' && e.result.status === 'scored' && e.result.passed));
});

for (const sign of [1, -1]) for (const scenario of ['correct-noisy', 'opposite', 'overshoot', 'walking', 'jump', 'gap'] as const) {
  test(`preflight: ${scenario} with direction ${sign}, seeded image and angle jitter`, () => {
    const { session, t, step } = ready(15, sign);
    const events: WorkerEvent[] = [];
    let state = 731;
    const random = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296 - .5; };
    for (let dt = step; dt <= 9500; dt += step) {
      if (scenario === 'gap' && dt > 300 && dt < 1100) continue;
      const limit = scenario === 'overshoot' ? 135 : 90;
      const yaw = (scenario === 'jump' ? 90 : Math.min(limit, dt * .1)) * sign * (scenario === 'opposite' ? -1 : 1);
      const frame = rotatedPoseFrame(yaw + random() * 2, t + dt, true);
      for (const landmark of Object.values(frame.landmarks)) {
        landmark!.image.x += random() * .0005 + (scenario === 'walking' ? Math.min(.16, dt / 800 * .16) : 0);
        landmark!.image.y += random() * .0005;
      }
      events.push(...session.process(frame, goodLighting, 30));
    }
    const scores = events.filter(e => e.type === 'score');
    assert.equal(scores.length, 1);
    const score = scores[0].result;
    if (scenario === 'correct-noisy') {
      assert.ok(score.status === 'scored' && score.passed, JSON.stringify(score));
    } else if (score.status === 'scored') {
      assert.equal(score.passed, score.assessment !== 'incomplete' && score.total >= 65);
      if (scenario === 'walking') assert.equal(score.turnTechnique?.passed, false);
    }
    if (score.status === 'scored') assert.ok(Number.isFinite(score.total) && score.total >= 0 && score.total <= 100);
  });
}
test('recorder captures the real final result, freezes, isolates data and resets next student', () => {
  const recorder = new DiagnosticSessionRecorder();
  recorder.start('turnLeft', { participantCode: 'HS01', trialCode: 'L01', device: 'phone' });
  const features = { bodyYaw: { value: 30, confidence: .99 } };
  recorder.recordFrame(quality, features, [], { timestampMs: 1000, stage: 'scoring', inferenceFps: 10 });
  features.bodyYaw.value = -90;
  recorder.recordFrame(quality, {}, [], { timestampMs: 1200, stage: 'completed', inferenceFps: 10 });
  recorder.setReferenceEvaluation({ status: 'MEETS_CRITERIA' });
  recorder.finish(passed);
  recorder.recordFrame(quality, {}, []);
  const report = recorder.generateReport()!;
  assert.equal(report.aiAssessment, 'PASS');
  assert.equal(report.officialScore?.total, 100);
  assert.equal(report.frameCount, 2);
  assert.equal(report.durationMs, 200);
  assert.equal(report.frames![0].features.bodyYaw!.value, 30);
  assert.ok(!report.analysis.needsHumanReview.some(s => s.includes('BẤT ĐỒNG')));
  report.frames![0].features.bodyYaw!.value = 0;
  assert.equal(recorder.generateReport()!.frames![0].features.bodyYaw!.value, 30);
  const csv = diagnosticReportToCsv(report);
  assert.match(csv, /participantCode/);
  assert.match(csv, /HS01,L01,phone,turnLeft/);
  assert.match(csv, /PASS,100,MEETS_CRITERIA/);
  recorder.start('turnRight', { participantCode: 'HS02' });
  assert.equal(recorder.generateReport()!.aiAssessment, 'NOT_EVALUATED');
  assert.equal(recorder.generateReport()!.referenceEvaluation.status, 'NOT_EVALUATED');
});
test('unknown AI or teacher evidence never becomes a false agreement or disagreement', () => {
  for (const teacher of ['MEETS_CRITERIA', 'DOES_NOT_MEET', 'INSUFFICIENT_EVIDENCE'] as const) {
    for (const result of [null, { status: 'notScorable', reasons: ['Mất khớp'] } as ScoreResult]) {
      const recorder = new DiagnosticSessionRecorder();
      recorder.start('turnLeft'); recorder.recordFrame(quality, {}, []);
      recorder.setReferenceEvaluation({ status: teacher });
      const report = recorder.generateReport(result)!;
      assert.ok(!report.analysis.observed.some(s => s.includes('đồng thuận')));
      assert.ok(!report.analysis.needsHumanReview.some(s => s.includes('BẤT ĐỒNG')));
      assert.equal(report.aiAssessment, result ? 'INSUFFICIENT_EVIDENCE' : 'NOT_EVALUATED');
      if (result) assert.deepEqual(report.refusalReasons, ['Mất khớp']);
    }
  }
});
test('recorder stops at its cap, explicitly marks truncation and rejects repeated frame timestamps', () => {
  const recorder = new DiagnosticSessionRecorder(); recorder.start('turnLeft');
  const max = recorder.getActiveStatus().maxFrames;
  for (let i = 0; i <= max; i++) recorder.recordFrame(quality, {}, [], { timestampMs: i * 200, stage: 'scoring', inferenceFps: 5 });
  assert.equal(recorder.getActiveStatus().frameCount, max);
  assert.equal(recorder.getActiveStatus().isRecording, false);
  assert.equal(recorder.generateReport()!.truncated, true);
  recorder.start('attention');
  for (const timestampMs of [100, 100, NaN, 99, 200]) recorder.recordFrame(quality, {}, [], { timestampMs, stage: 'scoring', inferenceFps: 10 });
  assert.equal(recorder.getActiveStatus().frameCount, 2);
});
test('turn telemetry labels 3D shoulder and wrist features consistently with the scoring geometry', () => {
  const profile = createCalibration(Array(20).fill(attentionFrame()))!;
  const frame = rotatedPoseFrame(90);
  frame.landmarks.leftShoulder!.image.y += .002;
  const normalized = normalizePose(frame, profile, true)!;
  const features = extractFeatures(normalized, true).values;
  const duals = extractDualMeasurements(normalized, true);
  for (const id of ['shoulderTilt', 'leftWristHipDistance', 'rightWristHipDistance'] as const) {
    const dual = duals.find(d => d.featureId === id)!;
    assert.equal(dual.officialSystem, 'CURRENT_3D');
    assert.equal(dual.officialValue, features[id]!.value);
    assert.ok(dual.isReliable);
  }
});
