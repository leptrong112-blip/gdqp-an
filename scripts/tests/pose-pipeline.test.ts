import test from 'node:test';
import assert from 'node:assert/strict';
import { angleAt2D, angleAt3D } from '../../src/features/pose-analysis/pipeline/geometry';
import { createCalibration, normalizePose } from '../../src/features/pose-analysis/pipeline/normalization';
import { extractFeatures } from '../../src/features/pose-analysis/pipeline/featureExtraction';
import { filterLandmarks } from '../../src/features/pose-analysis/pipeline/confidenceFilter';
import { LandmarkSmoother } from '../../src/features/pose-analysis/pipeline/smoothing';
import { attentionFrame, goodLighting } from './fixtures/pose/attention';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { getSkeletonViewport, projectSkeletonPoint } from '../../src/features/pose-analysis/rendering/skeletonRenderer';
import type { PoseDetector, WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';
test('angles use geometry and reject zero-length limbs', () => {
  const a = { x: 1, y: 0, z: 0 }, b = { x: 0, y: 0, z: 0 }, c = { x: 0, y: 1, z: 1 };
  assert.equal(angleAt2D(a, b, c), 90); assert.equal(angleAt3D(a, b, c), 90); assert.ok(Number.isNaN(angleAt3D(a, a, c)));
});
test('body features are invariant to image scale, translation, mirroring and aspect correction', () => {
  const features = [attentionFrame(0), attentionFrame(0, 0.7, 0.1), attentionFrame(0, 1, 0, true)].map(frame => {
    const profile = createCalibration(Array.from({ length: 20 }, () => frame))!;
    return extractFeatures(normalizePose(frame, profile)!).values;
  });
  for (const key of Object.keys(features[0])) for (const values of features.slice(1)) assert.ok(Math.abs(values[key].value - features[0][key].value) < 1e-6, key);
  const frame = attentionFrame(), oldAspect = frame.aspectRatio, nextAspect = 9 / 16;
  for (const point of Object.values(frame.landmarks)) {
    if (!point) continue;
    point.image.x = 0.5 + (point.image.x - 0.5) * oldAspect / nextAspect;
    point.image.z = point.image.z * oldAspect / nextAspect;
  }
  frame.aspectRatio = nextAspect;
  // Equivalent normalized coordinates at another aspect ratio keep body geometry.
  const adjusted = extractFeatures(normalizePose(frame, createCalibration(Array(20).fill(frame))!)!).values;
  for (const key of Object.keys(features[0])) assert.ok(Math.abs(adjusted[key].value - features[0][key].value) < 1e-12, key);
});
test('skeleton projection uses the same object-contain rectangle as the video', () => {
  const viewport = getSkeletonViewport(1280, 720, 4 / 3);
  assert.deepEqual(viewport, { width: 960, height: 720, offsetX: 160, offsetY: 0 });
  assert.deepEqual(projectSkeletonPoint(viewport, { x: 0.5, y: 0.25, z: 0 }), { x: 640, y: 180 });
  assert.deepEqual(projectSkeletonPoint(viewport, { x: 0, y: 1, z: 0 }), { x: 160, y: 720 });
});
test('filter rejects uncertain, absent-presence failures and nonfinite points', () => {
  const frame = attentionFrame(); frame.landmarks.leftWrist!.visibility = 0.4; frame.landmarks.rightWrist!.presence = 0.2; frame.landmarks.nose!.image.x = NaN;
  const filtered = filterLandmarks(frame); assert.equal(filtered.landmarks.leftWrist, undefined); assert.equal(filtered.landmarks.rightWrist, undefined); assert.equal(filtered.landmarks.nose, undefined); assert.ok(filtered.landmarks.leftHip);
});
test('smoothing expires missing data and resets after long gaps', () => {
  const smoother = new LandmarkSmoother(), initial = attentionFrame(); smoother.apply(initial);
  const next = attentionFrame(50); next.landmarks.nose!.image.x += 0.1;
  const value = smoother.apply(next).landmarks.nose!.image.x;
  assert.ok(value > initial.landmarks.nose!.image.x && value < next.landmarks.nose!.image.x);
  const missing = attentionFrame(200); delete missing.landmarks.nose; assert.ok(smoother.apply(missing).landmarks.nose);
  missing.timestampMs = 251; assert.equal(smoother.apply(missing).landmarks.nose, undefined);
  assert.equal(smoother.apply(attentionFrame(1000)).landmarks.nose!.image.x, initial.landmarks.nose!.image.x);
  const changedAspect = attentionFrame(1050); changedAspect.aspectRatio = 16 / 9; changedAspect.landmarks.nose!.image.x = 0.75;
  assert.equal(smoother.apply(changedAspect).landmarks.nose!.image.x, 0.75, 'aspect changes must not blend incompatible image coordinates');
});
test('calibration rejects unstable anatomical proportions', () => {
  const frames = Array.from({ length: 20 }, (_, i) => attentionFrame(i * 100));
  for (let i = 0; i < 10; i++) frames[i].landmarks.leftShoulder!.image.x -= 0.2;
  assert.equal(createCalibration(frames), null);
});
test('a fake detector drives the entire session without MediaPipe or browser APIs', async () => {
  const detector: PoseDetector = { async initialize() {}, detect: (_source, timestamp) => attentionFrame(timestamp), dispose() {} };
  await detector.initialize(); const session = new SessionProcessor(); let events: WorkerEvent[] = [];
  for (let t = 0; t <= 1500; t += 100) session.process(detector.detect(null as never, t, 640, 480), goodLighting, 20);
  session.command('startCalibration');
  for (let t = 1600; t <= 10400; t += 100) events.push(...session.process(detector.detect(null as never, t, 640, 480), goodLighting, 20));
  assert.ok(events.some(e => e.type === 'calibrationComplete'));
  const scored = events.find(e => e.type === 'score'); assert.ok(scored && scored.type === 'score' && scored.result.status === 'scored');
  assert.equal(events.filter(e => e.type === 'score').length, 1, 'scoring window is frozen and cannot emit duplicate scores');
  assert.ok(events.some(e => e.type === 'analysis' && e.snapshot.stage === 'completed'), 'stage transitions to completed');
  assert.equal(session.process(attentionFrame(10000), goodLighting, 20).length, 0, 'stale responses ignored'); detector.dispose();
});
