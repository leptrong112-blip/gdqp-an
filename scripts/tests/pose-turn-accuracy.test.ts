import test from 'node:test';
import assert from 'node:assert/strict';
import { attentionFrame, rotatedPoseFrame } from './fixtures/pose/attention';
import { createCalibration, normalizePose } from '../../src/features/pose-analysis/pipeline/normalization';
import { extractFeatures } from '../../src/features/pose-analysis/pipeline/featureExtraction';
import { calculateBodyYaw, horizontalTilt3D } from '../../src/features/pose-analysis/pipeline/geometry';
import { TemporalMotionBuffer, type MotionBufferFrame } from '../../src/features/pose-analysis/pipeline/motionBuffer';
import { evaluateDynamicAttempt } from '../../src/features/pose-analysis/scoring/dynamicMovementAnalyzer';
import { turnLeftMovement, turnRightMovement } from '../../src/features/pose-analysis/scoring/turnMovements';
import { buildRequirementCards } from '../../src/features/pose-analysis/scoring/postureFeedback';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ScoreResults } from '../../src/features/pose-analysis/components/ScoreResults';
import { DiagnosticSessionRecorder, diagnosticReportToCsv } from '../../src/features/pose-analysis/diagnostics/diagnosticSession';
import { QualityChecker } from '../../src/features/pose-analysis/pipeline/qualityChecks';
import { goodLighting } from './fixtures/pose/attention';

const profile = createCalibration(Array.from({ length: 20 }, (_, i) => attentionFrame(i * 100)))!;
function bufferFor(target = 90, modify?: (frame: MotionBufferFrame) => void) {
  const buffer = new TemporalMotionBuffer();
  for (let t = 0; t <= 4000; t += 100) {
    const pose = rotatedPoseFrame(Math.max(0, Math.min(Math.abs(target), (t - 600) * .15)) * Math.sign(target), t);
    const features = extractFeatures(normalizePose(pose, profile, true)!, true).values;
    const frame: MotionBufferFrame = {
      timestampMs: t, bodyYawDeg: features.bodyYaw!.value, confidence: .99, isReliable: true,
      footOpeningAngle: 45, heelGapRatio: .17,
      shoulderTilt: features.shoulderTilt?.value, torsoTilt: features.torsoTilt?.value,
      leftWristHipDistance: .4, rightWristHipDistance: .4,
      imageRoot: { x: 0, y: 0 }, leftHeelPosition: { x: -.1, y: 1 }, rightToePosition: { x: .1, y: 1 },
    };
    modify?.(frame);
    buffer.push(frame);
  }
  return buffer;
}
test('yaw preserves both anatomical directions beyond 90 degrees, regardless of display mirror', () => {
  for (const yaw of [0, 60, 90, 105, 120, 150, -60, -90, -105, -120, -150]) {
    for (const mirrored of [false, true]) {
      const f = extractFeatures(normalizePose(rotatedPoseFrame(yaw, 0, mirrored), profile, true)!, true);
      assert.ok(Math.abs(f.values.bodyYaw!.value - yaw) < 1e-6);
    }
  }
  assert.equal(calculateBodyYaw({ x: NaN, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }), null);
});
test('overshooting loses angle criterion points independently of the overall grade', () => {
  for (const sign of [1, -1]) for (const angle of [120, 150]) {
    const score = evaluateDynamicAttempt(sign === 1 ? turnLeftMovement : turnRightMovement, bufferFor(sign * angle));
    assert.ok(score.status === 'scored');
    assert.equal(score.passed, score.assessment !== 'incomplete' && score.total >= 65);
    assert.equal(score.assessment, score.unassessedPoints ? 'incomplete' : score.total >= 65 ? 'pass' : 'fail');
    assert.ok(score.total < 100);
    assert.ok(score.criteria.find(c => c.id === 'angle')!.points < 25);
    assert.ok(Math.abs(score.criteria.find(c => c.id === 'angle')!.measurements[0].value - angle) < 1e-6);
  }
});
test('side-facing image compression does not become a false 3D shoulder tilt; static mode stays 2D', () => {
  for (const yaw of [0, 60, 90, 120, -90]) {
    const pose = rotatedPoseFrame(yaw);
    pose.landmarks.leftShoulder!.image.y += .002;
    pose.landmarks.leftShoulder!.world!.y += .002;
    const normalized = normalizePose(pose, profile, true)!;
    const dynamic = extractFeatures(normalized, true).values.shoulderTilt!.value;
    assert.ok(dynamic < 1);
    if (Math.abs(yaw) === 90) assert.ok(extractFeatures(normalized).values.shoulderTilt!.value > 89);
  }
  assert.ok(horizontalTilt3D({ x: 0, y: .1, z: 0 }, { x: 0, y: 0, z: .2 }) > 20);
  assert.ok(Number.isNaN(horizontalTilt3D({ x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 0 })));
});
test('missing world shoulders do not fall back to image tilt in turn mode', () => {
  const pose = rotatedPoseFrame(90);
  delete pose.landmarks.leftShoulder!.world;
  const f = extractFeatures(normalizePose(pose, profile, true)!, true);
  assert.equal(f.values.shoulderTilt, undefined);
});
test('missing arm or torso evidence cannot silently earn full points or an overall pass', () => {
  for (const mode of ['left', 'both', 'ready-only', 'invalid', 'torso']) {
    const buffer = bufferFor(90, f => {
      if (mode === 'left' || mode === 'both' || (mode === 'ready-only' && f.bodyYawDeg > 25)) delete f.leftWristHipDistance;
      if (mode === 'both') delete f.rightWristHipDistance;
      if (mode === 'invalid') f.rightWristHipDistance = NaN;
      if (mode === 'torso') delete f.shoulderTilt;
    });
    const score = evaluateDynamicAttempt(turnLeftMovement, buffer);
    assert.ok(score.status === 'scored');
    const criterion = score.criteria.find(c => c.id === (mode === 'torso' ? 'torso' : 'arms'))!;
    assert.equal(criterion.statusLevel, 'NOT_SCORABLE');
    assert.equal(criterion.points, 0);
    assert.equal(score.passed, false);
    assert.equal(score.assessment, 'incomplete');
    assert.equal(score.unassessedPoints, 10);
    assert.equal(score.total, 90);
    assert.ok(criterion.measurements.every(m => Number.isFinite(m.value)));
    if (mode !== 'torso') {
      const cards = buildRequirementCards(score.criteria, 'turnLeft');
      assert.equal(cards.find(c => c.id === 'card-turn-arms')!.statusLevel, 'NOT_SCORABLE');
      assert.equal(cards.find(c => c.id === 'card-hold')!.statusLevel, 'PASS');
    }
  }
});
test('arms can be assessed separately when never simultaneously visible during the turn', () => {
  const score = evaluateDynamicAttempt(turnLeftMovement, bufferFor(90, f => {
    if (f.timestampMs < 1800) delete f.rightWristHipDistance;
    else delete f.leftWristHipDistance;
  }));
  assert.ok(score.status === 'scored');
  assert.equal(score.criteria.find(c => c.id === 'arms')!.points, 10);
  assert.equal(score.total, 100);
  assert.equal(score.passed, true);
});
test('a visible swinging arm is not hidden by missing opposite-arm samples', () => {
  const score = evaluateDynamicAttempt(turnLeftMovement, bufferFor(90, f => {
    if (f.timestampMs < 1800) { delete f.rightWristHipDistance; f.leftWristHipDistance = 1; }
    else delete f.leftWristHipDistance;
  }));
  assert.ok(score.status === 'scored');
  const arms = score.criteria.find(c => c.id === 'arms')!;
  assert.equal(arms.points, 4);
  assert.equal(arms.statusLevel, 'NOT_ACHIEVED');
});

test('unknown arms show 90 recorded points, not a capped percentage or an unsupported mistake', () => {
  const score = evaluateDynamicAttempt(turnLeftMovement, bufferFor(90, f => {
    delete f.rightWristHipDistance;
    f.leftWristHipDistance = .75;
  }));
  assert.ok(score.status === 'scored');
  assert.equal(score.total, 90);
  assert.equal(score.assessment, 'incomplete');
  assert.equal(score.unassessedPoints, 10);
  assert.deepEqual(score.criteria.find(c => c.id === 'arms')!.mistakes, []);
  const html = renderToStaticMarkup(React.createElement(ScoreResults, {
    result: score, movementId: 'turnLeft', scoreComparison: { previous: 90, delta: 0 },
  }));
  assert.match(html, /Điểm đã ghi nhận/);
  assert.match(html, /1 điểm chưa đánh giá/);
  assert.match(html, /Tư thế kết thúc được giữ vững chắc/);
  assert.match(html, /Camera chưa quan sát rõ tay phải/);
  assert.doesNotMatch(html, /3 khung hình|0,2 giây|Độ tin cậy phân tích/);
  assert.doesNotMatch(html, /Cần giữ yên ổn định 1.5 giây/);
  assert.match(html, /CHƯA KẾT LUẬN TOÀN BÀI/);
  assert.doesNotMatch(html, /Tương đương 64|Tương đương 90\/100|Bằng lần trước|Tay hơi rời thân/);

  const recorder = new DiagnosticSessionRecorder();
  recorder.start('turnLeft');
  recorder.recordFrame(new QualityChecker().check(attentionFrame(), goodLighting), {}, []);
  recorder.finish(score);
  const report = recorder.generateReport()!;
  assert.equal(report.aiAssessment, 'INSUFFICIENT_EVIDENCE');
  assert.equal(report.officialScore?.total, 90);
  assert.equal(report.officialScore?.assessment, 'incomplete');
  assert.equal(report.officialScore?.unassessedPoints, 10);
  assert.deepEqual(report.summary.topDeductions, []);
  assert.match(diagnosticReportToCsv(report), /incomplete,10/);
});

test('unknown arms retain incomplete overall evidence and the observed direction error', () => {
  const score = evaluateDynamicAttempt(turnLeftMovement, bufferFor(-90, f => {
    delete f.rightWristHipDistance;
  }));
  assert.ok(score.status === 'scored');
  assert.equal(score.assessment, 'incomplete');
  assert.equal(score.passed, false);
  assert.equal(score.criteria.find(c => c.id === 'direction')!.statusLevel, 'NOT_ACHIEVED');
  const html = renderToStaticMarkup(React.createElement(ScoreResults, { result: score, movementId: 'turnLeft' }));
  assert.match(html, /CHƯA KẾT LUẬN TOÀN BÀI/);
  assert.doesNotMatch(html, /Điểm tổng chưa thể đạt vì còn tiêu chí thiếu dữ liệu/);
});

test('early observed motion supplies arm evidence before side-on occlusion for both directions', () => {
  for (const sign of [1, -1]) {
    const score = evaluateDynamicAttempt(sign === 1 ? turnLeftMovement : turnRightMovement, bufferFor(sign * 90, f => {
      f.rightHeelPosition = { x: .1, y: 1 };
      f.leftToePosition = { x: -.1, y: 1 };
      if (Math.abs(f.bodyYawDeg) > 46) delete f.rightWristHipDistance;
    }));
    assert.ok(score.status === 'scored');
    assert.equal(score.criteria.find(c => c.id === 'arms')!.statusLevel, 'PASS');
    assert.equal(score.total, 100);
  }
});

test('isolated arm detections separated by tracking gaps cannot certify the arm', () => {
  const score = evaluateDynamicAttempt(turnLeftMovement, bufferFor(90, f => {
    if (![700, 1400, 2100].includes(f.timestampMs)) delete f.rightWristHipDistance;
  }));
  assert.ok(score.status === 'scored');
  assert.equal(score.criteria.find(c => c.id === 'arms')!.statusLevel, 'NOT_SCORABLE');
  assert.equal(score.assessment, 'incomplete');
});
