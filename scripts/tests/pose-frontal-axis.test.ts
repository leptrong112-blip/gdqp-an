import test from 'node:test';
import assert from 'node:assert/strict';
import { attentionFrame, rotatedPoseFrame, goodLighting } from './fixtures/pose/attention';
import { createCalibration, normalizePose } from '../../src/features/pose-analysis/pipeline/normalization';
import { extractFeatures } from '../../src/features/pose-analysis/pipeline/featureExtraction';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import type { CanonicalPoseFrame } from '../../src/features/pose-analysis/types';
import type { WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';

function axisFrame(yaw: number, t: number, positiveX: boolean, mirrored: boolean) {
  const f = rotatedPoseFrame(yaw, t, mirrored);
  if (positiveX) for (const p of Object.values(f.landmarks)) {
    p!.world!.x *= -1;
    p!.image.x = 1 - p!.image.x;
  }
  return f;
}
for (const positiveX of [false, true]) for (const mirrored of [false, true]) {
  test(`calibrated yaw keeps frontal=0 and overshoot signed: positiveX=${positiveX}, mirrored=${mirrored}`, () => {
    const start = axisFrame(0, 0, positiveX, mirrored);
    const profile = createCalibration(Array(20).fill(start))!;
    assert.ok(profile);
    assert.equal(profile.frontalXSign, positiveX ? 1 : -1);
    for (const yaw of [0, 45, 90, 120, 150, -45, -90, -120, -150]) {
      const sample = extractFeatures(normalizePose(axisFrame(yaw, 100, positiveX, mirrored), profile, true)!, true);
      assert.ok(Math.abs(sample.values.bodyYaw!.value - yaw) < 1e-6);
    }
  });
  for (const sign of [1, -1]) test(`full turn session with calibrated axis ${positiveX}, mirror ${mirrored}, direction ${sign}`, () => {
    const session = new SessionProcessor(); session.command(sign > 0 ? 'selectTurnLeft' : 'selectTurnRight');
    for (let t = 0; t <= 1500; t += 100) session.process(axisFrame(0, t, positiveX, mirrored), goodLighting, 20);
    session.command('startCalibration');
    let cue = -1;
    for (let t = 1600; t < 11000; t += 100) {
      const events = session.process(axisFrame(0, t, positiveX, mirrored), goodLighting, 20);
      const a = events.find(e => e.type === 'analysis');
      if (a?.type === 'analysis' && a.snapshot.stage === 'scoring') {
        cue = t; assert.equal(a.snapshot.dynamicProgress?.phase, 'MOVING'); break;
      }
    }
    assert.ok(cue > 0);
    const events: WorkerEvent[] = [];
    for (let dt = 100; dt <= 4000; dt += 100) events.push(...session.process(axisFrame(sign * Math.min(90, dt * .15), cue + dt, positiveX, mirrored), goodLighting, 20));
    const score = events.find(e => e.type === 'score');
    assert.ok(score?.type === 'score' && score.result.status === 'scored' && score.result.passed, JSON.stringify(score));
  });
}
