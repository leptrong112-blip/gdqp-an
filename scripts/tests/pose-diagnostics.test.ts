import test from 'node:test';
import assert from 'node:assert/strict';
import { extractDualMeasurements } from '../../src/features/pose-analysis/diagnostics/dualMeasurement';
import {
  DiagnosticSessionRecorder,
  type DiagnosticSessionReport,
} from '../../src/features/pose-analysis/diagnostics/diagnosticSession';
import { attentionFrame } from './fixtures/pose/attention';
import { createCalibration, normalizePose } from '../../src/features/pose-analysis/pipeline/normalization';
import { evaluate } from '../../src/features/pose-analysis/scoring/scoringEngine';
import { attentionMovement } from '../../src/features/pose-analysis/scoring/attentionMovement';
import { atEaseMovement } from '../../src/features/pose-analysis/scoring/atEaseMovement';
import { BASIC_DRILL } from '../../src/features/pose-analysis/scoring/basicDrill';
import { QualityChecker } from '../../src/features/pose-analysis/pipeline/qualityChecks';

const goodLighting = { mean: 120, darkRatio: 0.05, brightRatio: 0.01 };

test('dualMeasurement: deterministic and produces both 2D and 3D measurements on same frame', () => {
  const frame = attentionFrame();
  const profile = createCalibration(Array(20).fill(frame))!;
  const norm = normalizePose(frame, profile)!;

  const duals1 = extractDualMeasurements(norm);
  const duals2 = extractDualMeasurements(norm);

  assert.equal(duals1.length, duals2.length);
  assert.ok(duals1.length >= 8, 'Expected at least 8 comparable dual features');

  for (let i = 0; i < duals1.length; i++) {
    assert.equal(duals1[i].featureId, duals2[i].featureId);
    assert.equal(duals1[i].value2D, duals2[i].value2D);
    assert.equal(duals1[i].value3D, duals2[i].value3D);
    assert.equal(duals1[i].officialValue, duals2[i].officialValue);
    assert.equal(duals1[i].delta, duals2[i].delta);
  }
});

test('dualMeasurement: graceful handling when world landmarks are missing or lack depth', () => {
  const frame = attentionFrame();
  // Clear world coordinates from landmarks
  for (const l of Object.values(frame.landmarks)) {
    if (l) l.world = undefined;
  }
  const profile = createCalibration(Array(20).fill(attentionFrame()))!;
  const norm = normalizePose(frame, profile);

  // Even if norm is null or partial, extractDualMeasurements handles empty worldBody gracefully
  const fakeNorm = {
    ...frame,
    body: { leftHip: { x: -0.1, y: 0.5, z: 0 }, leftKnee: { x: -0.1, y: 0.7, z: 0 }, leftAnkle: { x: -0.1, y: 0.9, z: 0 } },
    worldBody: {},
  };

  const duals = extractDualMeasurements(fakeNorm);
  const knee = duals.find(d => d.featureId === 'leftKneeAngle');
  assert.ok(knee);
  assert.ok(Number.isFinite(knee.value2D));
  assert.ok(Number.isNaN(knee.value3D));
  assert.equal(knee.isReliable, false, 'Should flag as unreliable when 3D is missing');
});

test('dualMeasurement: low confidence marks feature as not reliable', () => {
  const frame = attentionFrame();
  frame.landmarks.leftKnee!.confidence = 0.3; // Low confidence
  const profile = createCalibration(Array(20).fill(attentionFrame()))!;
  const norm = normalizePose(frame, profile)!;

  const duals = extractDualMeasurements(norm);
  const knee = duals.find(d => d.featureId === 'leftKneeAngle');
  assert.ok(knee);
  assert.equal(knee.isReliable, false);
  assert.ok(knee.confidence < 0.6);
});

test('dualMeasurement: 2D/3D divergence computes delta without mutating official score', () => {
  const frame = attentionFrame();
  const profile = createCalibration(Array(20).fill(frame))!;
  // Intentionally introduce difference between 2D image and 3D world
  frame.landmarks.leftKnee!.world = { x: -0.055, y: 0.655 - 0.5, z: 0.08 }; // Bends forward in 3D
  const norm = normalizePose(frame, profile)!;

  const duals = extractDualMeasurements(norm);
  const knee = duals.find(d => d.featureId === 'leftKneeAngle')!;
  assert.ok(knee);
  assert.ok(Number.isFinite(knee.value2D));
  assert.ok(Number.isFinite(knee.value3D));
  assert.ok(knee.delta > 0, 'Expected positive delta between 2D and 3D');
  assert.equal(knee.officialSystem, 'CURRENT_3D');
});

test('mirroring: left and right anatomical conventions are preserved', () => {
  const normalFrame = attentionFrame(0, 1, 0, false);
  const mirroredFrame = attentionFrame(0, 1, 0, true);
  const profile = createCalibration(Array(20).fill(normalFrame))!;

  const normNormal = normalizePose(normalFrame, profile)!;
  const normMirrored = normalizePose(mirroredFrame, profile)!;

  const dualsNormal = extractDualMeasurements(normNormal);
  const dualsMirrored = extractDualMeasurements(normMirrored);

  const lNorm = dualsNormal.find(d => d.featureId === 'leftKneeAngle')!;
  const lMirr = dualsMirrored.find(d => d.featureId === 'leftKneeAngle')!;
  assert.ok(Math.abs(lNorm.value2D - lMirr.value2D) < 0.01);
  assert.ok(Math.abs(lNorm.value3D - lMirr.value3D) < 0.01);
});

test('diagnosticSessionRecorder: start, record, stop, cap at MAX_FRAMES, clear', () => {
  const recorder = new DiagnosticSessionRecorder();
  assert.equal(recorder.getActiveStatus().isRecording, false);

  // Generate report when empty returns null
  assert.equal(recorder.generateReport(), null);

  recorder.start('attention', { cameraHeight: 'desk', clothing: 'normal' });
  const status = recorder.getActiveStatus();
  assert.equal(status.isRecording, true);
  assert.ok(status.sessionId.startsWith('qpan_'));

  const checker = new QualityChecker();
  const frame = attentionFrame();
  const quality = checker.check(frame, goodLighting);
  const profile = createCalibration(Array(20).fill(frame))!;
  const norm = normalizePose(frame, profile)!;
  const duals = extractDualMeasurements(norm);

  // Record 25 frames
  for (let i = 0; i < 25; i++) {
    recorder.recordFrame(quality, { leftKneeAngle: { value: 175, confidence: 0.95 } }, duals);
  }
  assert.equal(recorder.getActiveStatus().frameCount, 25);

  recorder.stop();
  assert.equal(recorder.getActiveStatus().isRecording, false);

  // Set teacher evaluation
  recorder.setReferenceEvaluation({
    status: 'MEETS_CRITERIA',
    teacherNotes: 'Đứng nghiêm rất chuẩn, mắt nhìn thẳng.',
  });

  const report = recorder.generateReport({ status: 'scored', total: 100, passed: true, confidence: 0.95, criteria: [], corrections: [] });
  assert.ok(report);
  assert.equal(report.sessionId, status.sessionId);
  assert.equal(report.movementId, 'attention');
  assert.equal(report.frameCount, 25);
  assert.equal(report.referenceEvaluation.status, 'MEETS_CRITERIA');
  assert.ok(report.analysis.observed.length > 0);
  assert.ok(Array.isArray(report.analysis.hypothesis));
  assert.ok(Array.isArray(report.analysis.needsHumanReview));

  // Clear resets frames
  recorder.clear();
  assert.equal(recorder.getActiveStatus().frameCount, 0);
  assert.equal(recorder.generateReport(), null);
});

test('diagnosticSessionRecorder: Teacher disagreeing with AI produces NEEDS HUMAN REVIEW note', () => {
  const recorder = new DiagnosticSessionRecorder();
  recorder.start('attention');

  const checker = new QualityChecker();
  const frame = attentionFrame();
  const quality = checker.check(frame, goodLighting);
  recorder.recordFrame(quality, {}, []);

  recorder.stop();
  recorder.setReferenceEvaluation({
    status: 'DOES_NOT_MEET',
    unmetCriteria: ['Bàn chân / Gót'],
    teacherNotes: 'Gót chưa khép sát',
  });

  // AI scored 100 PASS, but teacher evaluated DOES_NOT_MEET
  const report = recorder.generateReport({
    status: 'scored',
    total: 100,
    passed: true,
    confidence: 0.95,
    criteria: [{ id: 'feet', label: 'Bàn chân', points: 20, maximum: 20, status: 'good', statusLevel: 'PASS', feedback: 'Tốt', specificFeedback: 'Tốt', mistakes: [], measurements: [], required: false }],
    corrections: [],
  });

  assert.ok(report);
  assert.ok(
    report.analysis.needsHumanReview.some(note => note.includes('BẤT ĐỒNG ĐÁNH GIÁ')),
    'Expected disagreement note in needsHumanReview'
  );
});

test('diagnostics do not affect official scoring engine or basic drill', () => {
  const frame = attentionFrame();
  const profile = createCalibration(Array(20).fill(frame))!;
  const windowData = {
    samples: Array.from({ length: 30 }, (_, i) => {
      const f = attentionFrame(i * 100);
      const norm = normalizePose(f, profile)!;
      // Also invoke dual measurements on the side
      extractDualMeasurements(norm);
      return {
        timestampMs: i * 100,
        values: {
          leftKneeAngle: { value: 175, confidence: 0.95 },
          rightKneeAngle: { value: 175, confidence: 0.95 },
          torsoTilt: { value: 2, confidence: 0.95 },
          shoulderTilt: { value: 1, confidence: 0.95 },
          hipTilt: { value: 1, confidence: 0.95 },
          heelGapRatio: { value: 0.1, confidence: 0.95 },
          footOpeningAngle: { value: 45, confidence: 0.95 },
          leftElbowAngle: { value: 170, confidence: 0.95 },
          rightElbowAngle: { value: 170, confidence: 0.95 },
          leftWristHipDistance: { value: 0.35, confidence: 0.95 },
          rightWristHipDistance: { value: 0.35, confidence: 0.95 },
          headOffset: { value: 0.02, confidence: 0.95 },
        },
      };
    }),
    validDurationMs: 3000,
    qualityPassed: true,
  };

  const officialResult = evaluate(attentionMovement, windowData);
  assert.equal(officialResult.status, 'scored');
  if (officialResult.status === 'scored') {
    assert.equal(officialResult.total, 100);
    assert.equal(officialResult.passed, true);
  }

  // Basic Drill steps are completely unaffected
  assert.equal(BASIC_DRILL.length, 3);
  assert.equal(BASIC_DRILL[0].id, 'attention');
  assert.equal(BASIC_DRILL[1].id, 'atEase');
  assert.equal(BASIC_DRILL[2].id, 'salute');
});
