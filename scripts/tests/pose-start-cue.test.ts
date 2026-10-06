import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TemporalMotionBuffer, type MotionBufferFrame } from '../../src/features/pose-analysis/pipeline/motionBuffer';
import { DynamicTurnTracker, evaluateDynamicAttempt } from '../../src/features/pose-analysis/scoring/dynamicMovementAnalyzer';
import { analyzeTurnSequence } from '../../src/features/pose-analysis/scoring/sequenceAnalysis';
import { javascriptSequenceEngine, sequenceEngineFromInstance } from '../../src/features/pose-analysis/scoring/sequenceEngine';
import { turnLeftMovement, turnRightMovement } from '../../src/features/pose-analysis/scoring/turnMovements';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { attentionFrame, rotatedPoseFrame, goodLighting } from './fixtures/pose/attention';
import type { WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';

const native = sequenceEngineFromInstance(new WebAssembly.Instance(new WebAssembly.Module(
  readFileSync(new URL('../../src/features/pose-analysis/scoring/sequence.wasm', import.meta.url)),
)));
function frame(t: number, yaw: number): MotionBufferFrame {
  return { timestampMs: t, bodyYawDeg: yaw, confidence: .99, isReliable: true,
    footOpeningAngle: 45, heelGapRatio: .17,
    torsoTilt: 0, shoulderTilt: 0, leftWristHipDistance: .4, rightWristHipDistance: .4,
    imageRoot: { x: 0, y: 0 }, leftHeelPosition: { x: -.1, y: 1 }, rightToePosition: { x: .1, y: 1 },
    rightHeelPosition: { x: .1, y: 1 }, leftToePosition: { x: -.1, y: 1 } };
}
for (const sign of [1, -1]) {
  test(`confirmed countdown jitter does not invalidate an immediate ${sign > 0 ? 'left' : 'right'} turn`, () => {
    const definition = sign > 0 ? turnLeftMovement : turnRightMovement;
    const buffer = new TemporalMotionBuffer();
    for (let t = 0; t <= 600; t += 100) buffer.push(frame(t, t < 200 ? -20 : 0));
    const tracker = new DynamicTurnTracker(); tracker.prime(buffer, definition);
    assert.equal(tracker.update(0, buffer, definition).phase, 'MOVING');
    assert.ok(buffer.preparation);
    for (let t = 700; t <= 4000; t += 100) buffer.push(frame(t, sign * Math.min(90, (t - 600) * .15)));
    // The previous inference-only readiness rule reproduces the false rejection.
    assert.equal(analyzeTurnSequence(buffer.frames, definition.dynamicConfig!).status, 'analyzed');
    for (const engine of [native, javascriptSequenceEngine]) {
      const result = evaluateDynamicAttempt(definition, buffer, engine);
      assert.ok(result.status === 'scored', JSON.stringify(result));
      assert.equal(result.total, 100);
      assert.equal(result.passed, true);
      assert.ok(result.sequence?.status === 'analyzed' && result.sequence.startReady && result.sequence.complete);
      assert.equal(result.sequence.readyMs, 600);
      assert.equal(result.sequence.maxReversalDeg, 0);
    }
  });
  test(`whole session accepts countdown angle noise followed by immediate direction ${sign}`, () => {
    const session = new SessionProcessor(); session.command(sign > 0 ? 'selectTurnLeft' : 'selectTurnRight');
    for (let t = 0; t <= 1500; t += 100) session.process(attentionFrame(t), goodLighting, 20);
    session.command('startCalibration');
    let previousStage = '', progress = 0, cue = -1;
    for (let t = 1600; t < 11000; t += 100) {
      const noisy = previousStage === 'countdown' && progress >= .8 && progress < .9;
      const events = session.process(rotatedPoseFrame(noisy ? -18 : 0, t), goodLighting, 20);
      const analysis = events.find(e => e.type === 'analysis');
      if (analysis?.type !== 'analysis') continue;
      previousStage = analysis.snapshot.stage; progress = analysis.snapshot.progress;
      if (previousStage === 'scoring') { cue = t; assert.equal(analysis.snapshot.dynamicProgress?.phase, 'MOVING'); break; }
    }
    assert.ok(cue > 0);
    const events: WorkerEvent[] = [];
    for (let dt = 100; dt <= 4000; dt += 100) events.push(...session.process(rotatedPoseFrame(sign * Math.min(90, dt * .15), cue + dt), goodLighting, 20));
    const scores = events.filter(e => e.type === 'score');
    assert.equal(scores.length, 1);
    assert.ok(scores[0].result.status === 'scored' && scores[0].result.passed, JSON.stringify(scores[0].result));
  });
}
test('confirmed preparation does not excuse a wrong direction or an unobserved jump', () => {
  for (const mode of ['wrong', 'jump']) {
    const buffer = new TemporalMotionBuffer();
    for (let t = 0; t <= 600; t += 100) buffer.push(frame(t, t < 200 ? -20 : 0));
    assert.ok(buffer.confirmPreparation(500));
    for (let t = 700; t <= 4000; t += 100) buffer.push(frame(t, mode === 'jump' ? 90 : -Math.min(90, (t - 600) * .15)));
    const score = evaluateDynamicAttempt(turnLeftMovement, buffer);
    if (mode === 'jump') assert.equal(score.status, 'notScorable');
    else { assert.ok(score.status === 'scored'); assert.equal(score.passed, false); assert.equal(score.criteria.find(c => c.id === 'direction')!.points, 0); }
  }
});
test('insufficient, nonfrontal, uncertain or interrupted preparation cannot be confirmed', () => {
  for (const mode of ['short', 'side', 'confidence', 'gap']) {
    const buffer = new TemporalMotionBuffer();
    for (let t = 0; t <= (mode === 'short' ? 400 : 600); t += 100) {
      if (mode === 'gap' && t > 100 && t < 500) continue;
      const f = frame(t, mode === 'side' ? 35 : 0);
      if (mode === 'confidence') f.confidence = .4;
      buffer.push(f);
    }
    assert.equal(buffer.confirmPreparation(500), null, mode);
  }
  const buffer = new TemporalMotionBuffer();
  for (let t = 0; t <= 600; t += 100) buffer.push(frame(t, 0));
  buffer.confirmPreparation(500); buffer.clear(); assert.equal(buffer.preparation, null);
  buffer.push(frame(0, 90)); assert.equal(buffer.getBaselineYaw(), 90);
});
test('uneven slow camera sampling retains enough preparation at the cue', () => {
  const session = new SessionProcessor(); session.command('selectTurnLeft');
  const gaps = [220, 235, 200]; let t = 0, cue = -1;
  for (let i = 0; t < 1700; i++) { session.process(attentionFrame(t), goodLighting, 30); t += gaps[i % gaps.length]; }
  session.command('startCalibration');
  for (let i = 0; t < 13000; i++) {
    const events = session.process(attentionFrame(t), goodLighting, 30);
    const snapshot = events.find(e => e.type === 'analysis');
    if (snapshot?.type === 'analysis' && snapshot.snapshot.stage === 'scoring') {
      cue = t; assert.equal(snapshot.snapshot.dynamicProgress?.phase, 'MOVING'); break;
    }
    t += gaps[i % gaps.length];
  }
  assert.ok(cue > 0);
});
