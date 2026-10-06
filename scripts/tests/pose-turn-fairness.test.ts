import test from 'node:test';
import assert from 'node:assert/strict';
import { TemporalMotionBuffer, type MotionBufferFrame } from '../../src/features/pose-analysis/pipeline/motionBuffer';
import { evaluateDynamicAttempt, DynamicTurnTracker } from '../../src/features/pose-analysis/scoring/dynamicMovementAnalyzer';
import { turnLeftMovement, turnRightMovement } from '../../src/features/pose-analysis/scoring/turnMovements';

function recording(sign = 1, fps = 6, modify?: (f: MotionBufferFrame) => void, end = 4500) {
  const buffer = new TemporalMotionBuffer();
  for (let t = 0; t <= end; t += 1000 / fps) {
    const f: MotionBufferFrame = { timestampMs: t, bodyYawDeg: sign * Math.min(90, Math.max(0, (t - 600) * .1)),
      isReliable: true, confidence: .99, torsoTilt: 0, imageTorsoTilt: 0, shoulderTilt: 0,
      footOpeningAngle: 45, heelGapRatio: .17,
      leftWristHipDistance: .4, rightWristHipDistance: .4, imageRoot: { x: 0, y: 0 },
      leftHeelPosition: { x: -.1, y: 1 }, rightHeelPosition: { x: .1, y: 1 },
      leftToePosition: { x: -.1, y: 1 }, rightToePosition: { x: .1, y: 1 } };
    modify?.(f); buffer.push(f);
  }
  return buffer;
}

test('live completion, sequence hold and hold points agree at irregular camera frame rates', () => {
  for (const sign of [1, -1]) for (const fps of [5, 6, 6.5, 7, 9, 11, 15]) {
    const definition = sign > 0 ? turnLeftMovement : turnRightMovement;
    const buffer = new TemporalMotionBuffer();
    const tracker = new DynamicTurnTracker();
    let completed = false;
    for (const f of recording(sign, fps).frames) {
      buffer.push(f);
      if (!tracker.update(f.timestampMs, buffer, definition).isComplete) continue;
      const result = evaluateDynamicAttempt(definition, buffer);
      assert.ok(result.status === 'scored', `${sign}, ${fps}: ${JSON.stringify(result)}`);
      assert.ok(result.sequence?.status === 'analyzed' && result.sequence.holdMs >= 1500);
      assert.equal(result.criteria.find(c => c.id === 'stability')!.points, 20);
      assert.equal(result.passed, true);
      completed = true; break;
    }
    assert.ok(completed, `not completed: ${sign}, ${fps}`);
  }
});

test('depth bias, camera roll and isolated spikes do not deduct torso or arm points', () => {
  for (const sign of [1, -1]) {
    const score = evaluateDynamicAttempt(sign > 0 ? turnLeftMovement : turnRightMovement, recording(sign, 10, f => {
      f.torsoTilt = 10;
      f.imageTorsoTilt = 7; // stationary camera roll, including preparation
      if (f.timestampMs === 1900) { f.torsoTilt = 45; f.leftWristHipDistance = 2; }
    }));
    assert.ok(score.status === 'scored');
    assert.equal(score.total, 100);
    assert.deepEqual(score.corrections, []);
  }
});

test('sustained corroborated leaning and arm swinging still lose points', () => {
  const score = evaluateDynamicAttempt(turnLeftMovement, recording(1, 10, f => {
    if (f.timestampMs > 700) { f.torsoTilt = 25; f.imageTorsoTilt = 23; f.leftWristHipDistance = 1; }
  }));
  assert.ok(score.status === 'scored');
  assert.equal(score.criteria.find(c => c.id === 'torso')!.points, 6);
  assert.equal(score.criteria.find(c => c.id === 'arms')!.points, 4);
});

test('short holds and sustained large yaw oscillations do not become successful holds', () => {
  for (const sway of [false, true]) {
    const score = evaluateDynamicAttempt(turnLeftMovement, recording(1, 6, f => {
      if (sway && f.timestampMs > 1500) f.bodyYawDeg += Math.round(f.timestampMs / (1000 / 6)) % 2 ? 15 : -15;
    }, sway ? 4500 : 2100));
    assert.ok(score.status === 'scored');
    assert.equal(score.criteria.find(c => c.id === 'stability')!.points, 0);
    assert.equal(score.passed, score.assessment !== 'incomplete' && score.total >= 65);
  }
});
