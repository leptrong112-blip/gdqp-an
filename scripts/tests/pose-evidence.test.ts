import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { attentionFrame, rotatedPoseFrame, goodLighting } from './fixtures/pose/attention';
import { TemporalMotionBuffer } from '../../src/features/pose-analysis/pipeline/motionBuffer';
import { QualityChecker } from '../../src/features/pose-analysis/pipeline/qualityChecks';
import { createCalibration, normalizePose } from '../../src/features/pose-analysis/pipeline/normalization';
import { extractFeatures } from '../../src/features/pose-analysis/pipeline/featureExtraction';
import { evaluateDynamicAttempt } from '../../src/features/pose-analysis/scoring/dynamicMovementAnalyzer';
import { turnLeftMovement, turnRightMovement } from '../../src/features/pose-analysis/scoring/turnMovements';
import { atEaseMovement } from '../../src/features/pose-analysis/scoring/atEaseMovement';
import { evaluate } from '../../src/features/pose-analysis/scoring/scoringEngine';
import { javascriptSequenceEngine, sequenceEngineFromInstance } from '../../src/features/pose-analysis/scoring/sequenceEngine';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import type { CanonicalPoseFrame } from '../../src/features/pose-analysis/types';
import type { WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';

const native = sequenceEngineFromInstance(new WebAssembly.Instance(new WebAssembly.Module(
  readFileSync(new URL('../../src/features/pose-analysis/scoring/sequence.wasm', import.meta.url)),
)));
function bufferFor(yawAt: (t: number) => number, gap = false) {
  const buffer = new TemporalMotionBuffer();
  for (let t = 0; t <= 4000; t += 100) {
    if (gap && t > 700 && t < 1300) continue;
    buffer.push({ timestampMs: t, bodyYawDeg: yawAt(t), confidence: 0.99, isReliable: true,
      torsoTilt: 0, shoulderTilt: 0, leftWristHipDistance: 0.4, rightWristHipDistance: 0.4 });
  }
  return buffer;
}
const cleanYaw = (t: number) => Math.max(0, Math.min(90, (t - 600) * 0.15));

test('both engines refuse static finals, jumps, one intermediate image, gaps and invalid starts', () => {
  const cases = [
    bufferFor(() => 90),
    bufferFor(() => 0),
    bufferFor(t => t <= 600 ? 0 : 90),
    bufferFor(t => t <= 600 ? 0 : t === 700 ? 45 : 90),
    bufferFor(cleanYaw, true),
    bufferFor(t => 35 + cleanYaw(t)),
  ];
  for (const engine of [native, javascriptSequenceEngine]) {
    for (const buffer of cases) {
      assert.equal(evaluateDynamicAttempt(turnLeftMovement, buffer, engine).status, 'notScorable');
    }
  }
});

test('an observed reversal reduces direction points in both engines, not just feedback', () => {
  const reversed = bufferFor(t => t <= 1200 ? cleanYaw(t) : t <= 1700 ? 90 - (t - 1200) * 0.1 : t <= 2200 ? 40 + (t - 1700) * 0.1 : 90);
  for (const engine of [native, javascriptSequenceEngine]) {
    const good = evaluateDynamicAttempt(turnLeftMovement, bufferFor(cleanYaw), engine);
    const bad = evaluateDynamicAttempt(turnLeftMovement, reversed, engine);
    assert.ok(good.status === 'scored' && bad.status === 'scored');
    assert.equal(good.total, 100);
    assert.ok(bad.total < good.total);
    const direction = bad.criteria.find(c => c.id === 'direction')!;
    assert.ok(direction.points < direction.maximum);
    assert.match(direction.specificFeedback!, /quay ngược/);
    assert.ok(bad.sequence?.status === 'analyzed' && !bad.sequence.complete);
  }
});

function turnSession(sign: number, mirrored: boolean, jump = false) {
  const session = new SessionProcessor();
  session.command(sign === 1 ? 'selectTurnLeft' : 'selectTurnRight');
  for (let t = 0; t <= 1500; t += 100) session.process(attentionFrame(t), goodLighting, 20);
  session.command('startCalibration');
  for (let t = 1600; t <= 7000; t += 100) session.process(attentionFrame(t), goodLighting, 20);
  const events: WorkerEvent[] = [];
  for (let t = 7100; t <= 15500; t += 100) {
    const yaw = t <= 7700 ? 0 : jump ? 90 : Math.min(90, (t - 7800) / 700 * 90);
    events.push(...session.process(rotatedPoseFrame(sign * yaw, t, mirrored), goodLighting, 20));
  }
  return events.find(e => e.type === 'score');
}

test('full session cannot manufacture turn evidence by smoothing an abrupt jump', () => {
  const score = turnSession(1, false, true);
  assert.ok(score?.type === 'score');
  assert.equal(score.result.status, 'notScorable');
  if (score.result.status === 'notScorable') assert.match(score.result.reasons.join(' '), /trung gian/);
});

test('full sessions preserve left/right scoring with mirrored or unmirrored display coordinates', () => {
  for (const sign of [1, -1]) for (const mirrored of [false, true]) {
    const score = turnSession(sign, mirrored);
    assert.ok(score?.type === 'score' && score.result.status === 'scored');
    assert.equal(score.result.total, 100);
  }
});

test('observed wrong-side turns still receive a direction correction rather than being relabelled', () => {
  const score = evaluateDynamicAttempt(turnRightMovement, bufferFor(cleanYaw));
  assert.ok(score.status === 'scored');
  assert.equal(score.criteria.find(c => c.id === 'direction')?.points, 0);
});

test('standing-at-ease refuses overlapping, invisible, missing-depth and unstable knees', () => {
  for (const mode of ['overlap', 'invisible', 'depth', 'unstable']) {
    const checker = new QualityChecker();
    let report;
    for (let t = 0; t <= 2000; t += 100) {
      const frame = attentionFrame(t);
      if (mode === 'overlap') frame.landmarks.leftKnee!.image = { ...frame.landmarks.rightKnee!.image };
      if (mode === 'invisible') frame.landmarks.leftKnee!.visibility = 0.1;
      if (mode === 'depth') frame.landmarks.leftKnee!.world = undefined;
      if (mode === 'unstable') frame.landmarks.leftKnee!.world!.z = (t / 100) % 2 ? 0.045 : 0;
      report = checker.check(frame, goodLighting, undefined, { assessKnees: true });
    }
    assert.equal(report!.passed, false, mode);
    assert.match(report!.checks.find(c => c.id === 'reliability')!.message, /đầu gối/, mode);
  }
});

test('2D straight-looking knees retain distinct 3D scores and correct at-ease feedback', () => {
  const profile = createCalibration(Array.from({ length: 20 }, (_, i) => attentionFrame(i * 100)))!;
  for (const bent of [false, true]) {
    const checker = new QualityChecker();
    const samples = Array.from({ length: 30 }, (_, i) => {
      const frame = attentionFrame(i * 100);
      if (bent) frame.landmarks.leftKnee!.world!.z = 0.045;
      assert.deepEqual(frame.landmarks.leftKnee!.image, attentionFrame().landmarks.leftKnee!.image);
      const report = checker.check(frame, goodLighting, profile, { assessKnees: true });
      if (i >= 10) assert.equal(report.passed, true);
      return extractFeatures(normalizePose(frame, profile)!);
    });
    const result = evaluate(atEaseMovement, { samples, validDurationMs: 3000, qualityPassed: true });
    assert.ok(result.status === 'scored');
    const legs = result.criteria.find(c => c.id === 'legs')!;
    assert.equal(legs.points, bent ? 25 : 0);
    if (bent) {
      assert.match(legs.specificFeedback!, /Một đầu gối chùng nhẹ/);
      assert.doesNotMatch(legs.specificFeedback!, /Hai chân duỗi thẳng/);
    }
  }
});

test('an at-ease session aborts with a knee-evidence explanation instead of grading occlusion', () => {
  const session = new SessionProcessor();
  session.command('selectAtEase');
  for (let t = 0; t <= 1500; t += 100) session.process(attentionFrame(t), goodLighting, 20);
  session.command('startCalibration');
  for (let t = 1600; t <= 7000; t += 100) session.process(attentionFrame(t), goodLighting, 20);
  const events: WorkerEvent[] = [];
  for (let t = 7100; t <= 9500; t += 100) {
    const frame: CanonicalPoseFrame = attentionFrame(t);
    frame.landmarks.leftKnee!.image = { ...frame.landmarks.rightKnee!.image };
    events.push(...session.process(frame, goodLighting, 20));
  }
  const score = events.find(e => e.type === 'score');
  assert.ok(score?.type === 'score' && score.result.status === 'notScorable');
  assert.match(score.result.reasons.join(' '), /đầu gối.*chồng hình/);
});
