import test from 'node:test';
import assert from 'node:assert/strict';
import { attentionFrame, rotatedPoseFrame, goodLighting } from './fixtures/pose/attention';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import type { WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';
import { createCalibration, normalizePose } from '../../src/features/pose-analysis/pipeline/normalization';
import { measureTurnFeet } from '../../src/features/pose-analysis/scoring/turnFeet';
import { TemporalMotionBuffer } from '../../src/features/pose-analysis/pipeline/motionBuffer';
import { evaluateDynamicAttempt } from '../../src/features/pose-analysis/scoring/dynamicMovementAnalyzer';
import { turnLeftMovement, turnRightMovement } from '../../src/features/pose-analysis/scoring/turnMovements';

const profile = createCalibration(Array.from({ length: 20 }, (_, i) => attentionFrame(i * 100)))!;
test('the real session pipeline records parallel-foot failures separately from the overall grade in both turn directions', () => {
  for (const sign of [1, -1]) {
    const session = new SessionProcessor();
    session.command(sign > 0 ? 'selectTurnLeft' : 'selectTurnRight');
    const frame = (t: number, yaw: number) => {
      const pose = rotatedPoseFrame(yaw, t), a = yaw * Math.PI / 180;
      for (const side of ['left', 'right'] as const) {
        const heel = pose.landmarks[`${side}Heel`]!.world!;
        const toe = pose.landmarks[`${side}FootIndex`]!;
        toe.world = { x: heel.x - .05 * Math.sin(a), y: heel.y, z: heel.z - .05 * Math.cos(a) };
        toe.image.x = .5 + toe.world.x / pose.aspectRatio;
      }
      return pose;
    };
    let t = 0;
    for (; t < 1600; t += 100) session.process(frame(t, 0), goodLighting, 20);
    session.command('startCalibration');
    let started = false;
    for (; t < 12000; t += 100) {
      if (session.process(frame(t, 0), goodLighting, 20).some(e => e.type === 'analysis' && e.snapshot.stage === 'scoring')) { started = true; break; }
    }
    assert.ok(started);
    const events: WorkerEvent[] = [];
    for (let dt = 100; dt <= 5000; dt += 100) events.push(...session.process(frame(t + dt, sign * Math.min(90, dt * .1)), goodLighting, 20));
    const event = events.find(e => e.type === 'score');
    assert.ok(event?.type === 'score' && event.result.status === 'scored');
    assert.equal(event.result.assessment, event.result.total >= 65 ? 'pass' : 'fail');
    assert.equal(event.result.criteria.find(c => c.id === 'feetReady')!.points, 0);
    assert.equal(event.result.criteria.find(c => c.id === 'feetFinal')!.points, 0);
  }
});
test('foot opening and heel distance survive side views, mirror display and tilted cameras', () => {
  for (const yaw of [-90, 0, 90]) for (const mirror of [false, true]) for (const pitch of [-25, 0, 25]) {
    const pose = rotatedPoseFrame(yaw, 0, mirror), a = pitch * Math.PI / 180;
    for (const p of Object.values(pose.landmarks)) {
      const w = p!.world!;
      p!.world = { x: w.x, y: w.y * Math.cos(a) - w.z * Math.sin(a), z: w.y * Math.sin(a) + w.z * Math.cos(a) };
    }
    const measured = measureTurnFeet(normalizePose(pose, profile, true)!)!;
    assert.ok(measured);
    assert.ok(Math.abs(measured.footOpeningAngle - 45) < .01);
    assert.ok(Math.abs(measured.heelGapRatio - 1 / 6) < .001);
  }
});

test('occluded, low-confidence, degenerate or implausible feet never become valid geometry', () => {
  for (const mode of ['missing', 'low', 'degenerate', 'long']) {
    const pose = attentionFrame();
    if (mode === 'missing') delete pose.landmarks.leftHeel;
    if (mode === 'low') pose.landmarks.leftHeel!.confidence = .5;
    if (mode === 'degenerate') pose.landmarks.leftFootIndex!.world = { ...pose.landmarks.leftHeel!.world! };
    if (mode === 'long') pose.landmarks.leftFootIndex!.world!.z = -2;
    assert.equal(measureTurnFeet(normalizePose(pose, profile, true)!), undefined);
  }
});

test('inward-pointing feet are not mistaken for an outward V', () => {
  const pose = attentionFrame();
  pose.landmarks.leftFootIndex!.world!.x = .000710678;
  pose.landmarks.rightFootIndex!.world!.x = -.000710678;
  assert.ok(measureTurnFeet(normalizePose(pose, profile, true)!)!.footOpeningAngle < 0);
});

for (const sign of [1, -1]) for (const scenario of ['good', 'parallel-ready', 'parallel-final', 'wide-heels', 'occluded', 'noise', 'during-pivot'] as const) {
  test(`turn ${sign}: ${scenario} feet affect only the observed ready/final stance`, () => {
    const buffer = new TemporalMotionBuffer();
    for (let t = 0; t <= 4000; t += 100) {
      const yaw = sign * Math.min(90, Math.max(0, (t - 600) * .15));
      let angle: number | undefined = 45;
      let gap: number | undefined = .17;
      if (scenario === 'parallel-ready' && t <= 600) angle = 0;
      if (scenario === 'parallel-final' && t >= 1800) angle = 0;
      if (scenario === 'wide-heels') gap = .7;
      if (scenario === 'occluded' && t >= 1800) { angle = undefined; gap = undefined; }
      if (scenario === 'noise' && t === 3600) { angle = 0; gap = .8; }
      if (scenario === 'during-pivot' && t > 600 && t < 1600) { angle = 0; gap = .8; }
      buffer.push({ timestampMs: t, bodyYawDeg: yaw, confidence: .99, isReliable: true,
        torsoTilt: 0, imageTorsoTilt: 0, shoulderTilt: 0, leftWristHipDistance: .4, rightWristHipDistance: .4,
        footOpeningAngle: angle, heelGapRatio: gap, imageRoot: { x: 0, y: 0 },
        leftHeelPosition: { x: -.1, y: 1 }, rightHeelPosition: { x: .1, y: 1 },
        leftToePosition: { x: -.1, y: 1 }, rightToePosition: { x: .1, y: 1 } });
    }
    const result = evaluateDynamicAttempt(sign > 0 ? turnLeftMovement : turnRightMovement, buffer);
    assert.ok(result.status === 'scored');
    assert.equal(result.criteria.reduce((sum, c) => sum + c.maximum, 0), 100);
    if (['good', 'noise', 'during-pivot'].includes(scenario)) {
      assert.equal(result.total, 100); assert.equal(result.passed, true);
    } else if (scenario === 'occluded') {
      assert.equal(result.total, 95); assert.equal(result.assessment, 'incomplete');
      assert.equal(result.unassessedPoints, 5);
      assert.equal(result.criteria.find(c => c.id === 'feetFinal')!.statusLevel, 'NOT_SCORABLE');
    } else {
      assert.equal(result.assessment, result.total >= 65 ? 'pass' : 'fail'); assert.ok(result.total < 100);
      const id = scenario === 'parallel-ready' ? 'feetReady' : 'feetFinal';
      assert.equal(result.criteria.find(c => c.id === id)!.points, 0);
    }
  });
}
