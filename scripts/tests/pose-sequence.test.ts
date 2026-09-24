import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { javascriptSequenceEngine, sequenceEngineFromInstance } from '../../src/features/pose-analysis/scoring/sequenceEngine';
import { analyzeTurnSequence } from '../../src/features/pose-analysis/scoring/sequenceAnalysis';
import { turnLeftMovement, turnRightMovement } from '../../src/features/pose-analysis/scoring/turnMovements';
import { DynamicTurnTracker } from '../../src/features/pose-analysis/scoring/dynamicMovementAnalyzer';
import { TemporalMotionBuffer, type MotionBufferFrame } from '../../src/features/pose-analysis/pipeline/motionBuffer';
import { evaluate } from '../../src/features/pose-analysis/scoring/scoringEngine';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { attentionFrame, rotatedPoseFrame, goodLighting } from './fixtures/pose/attention';
import type { WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';

const module = new WebAssembly.Module(readFileSync(new URL('../../src/features/pose-analysis/scoring/sequence.wasm', import.meta.url)));
const instance = new WebAssembly.Instance(module);
const native = sequenceEngineFromInstance(instance);
function frames(sign = 1): MotionBufferFrame[] {
  return Array.from({ length: 35 }, (_, i) => ({ timestampMs: i * 100,
    bodyYawDeg: sign * Math.max(0, Math.min(90, (i - 6) * 10)), confidence: 0.95, isReliable: true,
    torsoTilt: 0, shoulderTilt: 0, leftWristHipDistance: 0.4, rightWristHipDistance: 0.4 }));
}

test('actual C++ sequence binary: no host imports, bounded ABI and erased scratch memory', () => {
  assert.deepEqual(WebAssembly.Module.imports(module), []);
  assert.equal(native.distance([0, 0.5, 1], [0, 0.5, 1], 1), 0);
  assert.equal(native.distance([0, 0, 0], [1, 1, 1], 1), 1);
  const ptr = (instance.exports.observed_ptr as () => number)();
  assert.ok(new Float64Array((instance.exports.memory as WebAssembly.Memory).buffer, ptr, 128).every(v => v === 0));
  assert.throws(() => native.distance([], [], 0), RangeError);
  assert.throws(() => native.distance([0, NaN], [0, 1], 1), RangeError);
  assert.throws(() => native.distance([0, 1], [0, 1], 2), RangeError);
  assert.throws(() => native.distance(Array(129).fill(0), Array(129).fill(0), 1), RangeError);
});

test('native and fallback distances agree across varied bounded arrays', () => {
  for (let n = 2; n <= 128; n += 3) {
    const a = Array.from({ length: n }, (_, i) => Math.sin(i * 0.1));
    const b = Array.from({ length: n }, (_, i) => Math.cos(i * 0.13));
    for (const window of [0, Math.min(12, n - 1)]) {
      assert.ok(Math.abs(native.distance(a, b, window) - javascriptSequenceEngine.distance(a, b, window)) < 1e-12);
    }
  }
});

test('JavaScript sequence fallback is disclosed without changing the scored result', () => {
  const buffer = new TemporalMotionBuffer();
  frames().forEach(frame => buffer.push(frame));
  const nativeScore = evaluate(turnLeftMovement, { samples: [], validDurationMs: 3400, qualityPassed: true }, buffer, native);
  const fallbackScore = evaluate(turnLeftMovement, { samples: [], validDurationMs: 3400, qualityPassed: true }, buffer, javascriptSequenceEngine);
  assert.equal(nativeScore.status, 'scored');
  assert.equal(fallbackScore.status, 'scored');
  if (nativeScore.status === 'scored' && fallbackScore.status === 'scored') {
    assert.equal(fallbackScore.total, nativeScore.total);
    assert.deepEqual(fallbackScore.criteria, nativeScore.criteria);
    assert.equal(nativeScore.sequence?.status, 'analyzed');
    assert.equal(fallbackScore.sequence?.status, 'analyzed');
    if (nativeScore.sequence?.status === 'analyzed' && fallbackScore.sequence?.status === 'analyzed') {
      assert.equal(nativeScore.sequence.engine, 'wasm');
      assert.equal(fallbackScore.sequence.engine, 'javascript');
      assert.equal(fallbackScore.sequence.distance, nativeScore.sequence.distance);
    }
  }
});

test('left/right full sequences report phases, duration and a bounded display trace', () => {
  for (const [direction, definition] of [[1, turnLeftMovement], [-1, turnRightMovement]] as const) {
    const report = analyzeTurnSequence(frames(direction), definition.dynamicConfig!, native);
    assert.equal(report.status, 'analyzed');
    if (report.status === 'analyzed') {
      assert.equal(report.engine, 'wasm');
      assert.equal(report.complete, true);
      assert.equal(report.maxReversalDeg, 0);
      assert.equal(report.trace.length, 64);
      assert.ok(report.holdMs >= 1500);
      assert.ok(report.distance < 0.1);
    }
  }
});

test('same final angle cannot conceal an intermediate reversal', () => {
  const clean = frames(), reversed = frames();
  [0, 25, 55, 65, 20, 20, 55, 75, 90].forEach((yaw, i) => { reversed[i + 7].bodyYawDeg = yaw; });
  const good = analyzeTurnSequence(clean, turnLeftMovement.dynamicConfig!, native);
  const bad = analyzeTurnSequence(reversed, turnLeftMovement.dynamicConfig!, native);
  assert.equal(good.status, 'analyzed'); assert.equal(bad.status, 'analyzed');
  if (good.status === 'analyzed' && bad.status === 'analyzed') {
    assert.ok(bad.maxReversalDeg > 15);
    assert.ok(bad.feedback.some(t => t.includes('quay ngược')));
    assert.ok(bad.distance > good.distance);
  }
});

test('missing final hold, no movement and wrong direction are not a complete sequence', () => {
  for (const sample of [frames().slice(0, 20), frames().map(f => ({ ...f, bodyYawDeg: 0 })), frames(-1)]) {
    const report = analyzeTurnSequence(sample, turnLeftMovement.dynamicConfig!, native);
    assert.equal(report.status, 'analyzed');
    if (report.status === 'analyzed') assert.equal(report.complete, false);
  }
});

test('quality gaps, nonmonotonic time and low confidence refuse sequence comparison', () => {
  const gap = frames().filter(f => f.timestampMs < 900 || f.timestampMs > 1400);
  const backward = frames(); backward[10].timestampMs = 0;
  const low = frames().map(f => ({ ...f, confidence: 0.1 }));
  for (const sample of [gap, backward, low]) assert.equal(analyzeTurnSequence(sample, turnLeftMovement.dynamicConfig!, native).status, 'unavailable');
  const buffer = new TemporalMotionBuffer(); frames().forEach(f => buffer.push(f));
  assert.equal(evaluate(turnLeftMovement, { qualityPassed: false, validDurationMs: 3000, samples: [] }, buffer, native).status, 'notScorable');
});

test('leaving the final pose after 600ms resets hold; a quality pause also resets it', () => {
  const tracker = new DynamicTurnTracker(), buffer = new TemporalMotionBuffer();
  const update = (t: number, yaw: number) => {
    buffer.push({ timestampMs: t, bodyYawDeg: yaw, confidence: 0.95, isReliable: true });
    return tracker.update(t, buffer, turnLeftMovement);
  };
  for (let t = 0; t <= 600; t += 100) update(t, 0);
  for (let t = 700; t <= 1700; t += 100) update(t, 90);
  let result = update(1800, 0);
  for (let t = 1900; t <= 2300; t += 100) result = update(t, 0);
  assert.equal(result.isComplete, false);
  assert.equal(result.phase, 'MOVING');
  for (let t = 2400; t <= 2800; t += 100) update(t, 90);
  tracker.pause();
  assert.equal(update(2900, 90).isComplete, false);
});

test('a full SessionProcessor run attaches the actual native report and clears on reset', () => {
  const session = new SessionProcessor(native), events: WorkerEvent[] = [];
  session.command('selectTurnLeft');
  for (let t = 0; t <= 1500; t += 100) session.process(attentionFrame(t), goodLighting, 20);
  session.command('startCalibration');
  for (let t = 1600; t <= 7000; t += 100) session.process(attentionFrame(t), goodLighting, 20);
  for (let t = 7100; t <= 7700; t += 100) session.process(rotatedPoseFrame(0, t), goodLighting, 20);
  for (let t = 7800; t <= 8500; t += 100) session.process(rotatedPoseFrame((t - 7800) / 700 * 90, t), goodLighting, 20);
  for (let t = 8600; t <= 10500; t += 100) events.push(...session.process(rotatedPoseFrame(90, t), goodLighting, 20));
  const score = events.find(e => e.type === 'score');
  assert.ok(score?.type === 'score' && score.result.status === 'scored');
  assert.equal(score.result.sequence?.status, 'analyzed');
  if (score.result.sequence?.status === 'analyzed') assert.equal(score.result.sequence.engine, 'wasm');
  session.command('reset');
  assert.ok(session.process(attentionFrame(10600), goodLighting, 20).some(e => e.type === 'analysis' && e.snapshot.stage === 'quality-check'));
});
