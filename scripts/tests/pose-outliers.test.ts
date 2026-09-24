import test from 'node:test';
import assert from 'node:assert/strict';
import { LandmarkOutlierFilter } from '../../src/features/pose-analysis/pipeline/outlierFilter';
import { filterLandmarks } from '../../src/features/pose-analysis/pipeline/confidenceFilter';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { attentionFrame, goodLighting, rotatedPoseFrame } from './fixtures/pose/attention';

function warm() {
  const filter = new LandmarkOutlierFilter();
  for (let t = 0; t <= 500; t += 100) filter.apply(attentionFrame(t));
  return filter;
}

test('isolated image-coordinate spike is rejected without mutating detector evidence, then recovers', () => {
  const filter = warm(), bad = attentionFrame(600);
  bad.landmarks.leftWrist!.image.x += 0.6;
  const result = filter.apply(bad);
  assert.ok(result.rejected.has('leftWrist'));
  assert.equal(result.frame.landmarks.leftWrist, undefined);
  assert.ok(bad.landmarks.leftWrist);
  assert.ok(result.frame.landmarks.rightWrist);
  assert.ok(filter.apply(attentionFrame(700)).frame.landmarks.leftWrist);
});

test('3D bone-length spikes and collapse are rejected without poisoning the learned lengths', () => {
  for (const collapse of [false, true]) {
    const filter = warm();
    for (const t of [600, 700, 800]) {
      const bad = attentionFrame(t);
      bad.landmarks.leftWrist!.world = collapse ? { ...bad.landmarks.leftElbow!.world! } :
        { ...bad.landmarks.leftWrist!.world!, y: 1.5 };
      assert.equal(filter.apply(bad).frame.landmarks.leftWrist, undefined);
    }
    assert.ok(filter.apply(attentionFrame(900)).frame.landmarks.leftWrist);
  }
});

test('rejecting a bad elbow removes its downstream wrist but preserves the other arm', () => {
  const filter = warm(), bad = attentionFrame(600);
  bad.landmarks.leftElbow!.world!.x += 1;
  const result = filter.apply(bad);
  assert.equal(result.frame.landmarks.leftElbow, undefined);
  assert.equal(result.frame.landmarks.leftWrist, undefined);
  assert.ok(result.frame.landmarks.rightElbow);
  assert.ok(result.frame.landmarks.leftShoulder);
});

test('rigid body turns, translation and camera scale changes do not violate bone constraints', () => {
  const filter = warm();
  for (let i = 0; i <= 4; i++) {
    const frame = rotatedPoseFrame(i * 22.5, 600 + i * 100);
    assert.equal(filter.apply(frame).rejected.size, 0);
  }
  assert.equal(filter.apply(attentionFrame(1100, 1.1, 0.45)).rejected.size, 0);
});

test('fast real wrist motion preserving limb length is accepted', () => {
  const filter = warm(), raised = attentionFrame(600);
  const elbow = raised.landmarks.leftElbow!, wrist = raised.landmarks.leftWrist!;
  wrist.image.y = 2 * elbow.image.y - wrist.image.y;
  wrist.world!.y = 2 * elbow.world!.y - wrist.world!.y;
  assert.ok(filter.apply(raised).frame.landmarks.leftWrist);
});

test('large but sustained relocation reacquires after confirmation instead of freezing', () => {
  const filter = warm();
  for (const t of [600, 700]) {
    const frame = attentionFrame(t);
    // Temporal guard in isolation: no 3D evidence available for this point.
    delete frame.landmarks.leftWrist!.world;
    frame.landmarks.leftWrist!.image.x += 0.6;
    const result = filter.apply(frame);
    assert.equal(!!result.frame.landmarks.leftWrist, t === 700);
  }
});

test('tracking resets on no person, multiple people, aspect change, long gap and explicit reset', () => {
  for (const reason of ['absent', 'multiple', 'aspect', 'gap', 'reset']) {
    const filter = warm();
    if (reason === 'reset') filter.reset();
    if (reason === 'absent' || reason === 'multiple') {
      const lost = attentionFrame(600); lost.personCount = reason === 'absent' ? 0 : 2;
      assert.deepEqual(filter.apply(lost).frame.landmarks, {});
    }
    const frame = attentionFrame(reason === 'gap' ? 2200 : 700);
    if (reason === 'aspect') frame.aspectRatio = 16 / 9;
    frame.landmarks.leftWrist!.image.x += 0.6;
    frame.landmarks.leftWrist!.world!.y += 1;
    assert.ok(filter.apply(frame).frame.landmarks.leftWrist, reason);
  }
});

test('low or invalid confidence cannot seed bone history even when visibility is high', () => {
  for (const confidence of [0.1, NaN, Infinity]) {
    const frame = attentionFrame(); frame.landmarks.leftWrist!.confidence = confidence;
    assert.equal(filterLandmarks(frame).landmarks.leftWrist, undefined);
  }
});

test('session rejects outliers before quality checks and does not resurrect them through smoothing', () => {
  const session = new SessionProcessor();
  for (let t = 0; t <= 1500; t += 100) session.process(attentionFrame(t), goodLighting, 20);
  const bad = attentionFrame(1600); bad.landmarks.leftWrist!.image.x += 0.6;
  const analysis = session.process(bad, goodLighting, 20).find(e => e.type === 'analysis');
  assert.ok(analysis && analysis.type === 'analysis');
  assert.equal(analysis.snapshot.frame.landmarks.leftWrist, undefined);
  assert.equal(analysis.snapshot.quality.passed, false);
  const recovered = session.process(attentionFrame(1700), goodLighting, 20).find(e => e.type === 'analysis');
  assert.ok(recovered && recovered.type === 'analysis' && recovered.snapshot.frame.landmarks.leftWrist);
});
