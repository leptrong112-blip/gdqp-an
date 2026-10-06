import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { createPoseAttempt, freezeSnapshot, type PoseAttemptContext } from '../../src/features/pose-analysis/runtime/attemptTiming';
import { attentionFrame, goodLighting } from './fixtures/pose/attention';
import { drillFrame, saluteMotionFrame } from './fixtures/pose/drill';
import type { CanonicalPoseFrame } from '../../src/features/pose-analysis/types';
import type { WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';
import type { DrillStepResult } from '../../src/features/pose-analysis/scoring/scoringTypes';

const origin = 100_000;
const attempt = (id: string): PoseAttemptContext => ({ id, movementId: 'attention', startedAt: new Date(origin).toISOString(), startedAtMs: origin, frameTimeOriginMs: origin });
function harness(interval = 100) {
  let clock = origin;
  const processor = new SessionProcessor(undefined, () => (clock += .25));
  const context = attempt('attempt-1');
  processor.command('reset', context);
  const feed = (frame: CanonicalPoseFrame) => { clock = origin + frame.timestampMs + 20; return processor.process(frame, goodLighting, 20); };
  let next = 0;
  for (; next <= 1500; next += interval) feed(attentionFrame(next));
  processor.command('startCalibration', context);
  for (; next < 10_000; next += interval) {
    const events = feed(drillFrame(processor.expectedPostureId, next));
    const analysis = events.find(e => e.type === 'analysis');
    if (analysis?.type === 'analysis' && analysis.snapshot.stage === 'scoring') return { processor, feed, context, scoringAt: next, next: next + interval };
  }
  throw new Error('Countdown did not finish');
}

test('the first sufficient hold frame finalizes synchronously once with exact hold-boundary timing', () => {
  const { processor, feed, scoringAt, next } = harness(67);
  let final: Extract<WorkerEvent, { type: 'score' }> | undefined;
  let finalAt = 0;
  for (let t = next; t < next + 5000; t += 67) {
    const events = feed(attentionFrame(t));
    if (t - scoringAt < 3000) assert.equal(events.some(e => e.type === 'score'), false);
    const score = events.find(e => e.type === 'score');
    if (score?.type === 'score') { final = score; finalAt = t; break; }
  }
  assert.ok(final?.timing);
  assert.equal(final.attemptId, 'attempt-1');
  assert.equal(final.timing.scoringWindowFinishedAtMs, origin + scoringAt + 3000);
  assert.ok(final.timing.countdownFinishedAtMs! < origin + scoringAt, 'target settling is separate from the countdown boundary');
  assert.equal(final.timing.inferenceMs, 20);
  assert.equal(final.timing.finalizationMs, .25);
  assert.equal(final.timing.processingLatencyMs, finalAt - scoringAt - 3000 + 20.5);
  assert.equal(processor.isFinalized, true);
  const snapshot = JSON.stringify(final.result);
  for (let i = 1; i <= 30; i++) {
    const frame = attentionFrame(finalAt + i * 100); frame.personCount = 0;
    assert.deepEqual(feed(frame), [], 'late camera frames do not perform analysis or emit another result');
  }
  assert.equal(JSON.stringify(final.result), snapshot);
  assert.ok(Object.isFrozen(final.result));
  assert.ok(final.result.status === 'scored' && Object.isFrozen(final.result.criteria[0].measurements));
});

test('retry has a new identifier, clears completed state, and does not change the frozen old result', () => {
  const { processor, feed, scoringAt } = harness();
  let result: Extract<WorkerEvent, { type: 'score' }> | undefined;
  for (let t = scoringAt + 100; t <= scoringAt + 4000; t += 100) {
    const score = feed(attentionFrame(t)).find(e => e.type === 'score');
    if (score?.type === 'score') { result = score; break; }
  }
  assert.ok(result);
  const old = JSON.stringify(result);
  processor.command('reset', attempt('attempt-2'));
  assert.equal(processor.attemptId, 'attempt-2');
  assert.equal(processor.isFinalized, false);
  const events = feed(attentionFrame(0));
  assert.ok(events.some(e => e.type === 'analysis' && e.snapshot.stage === 'quality-check' && e.attemptId === 'attempt-2'));
  assert.equal(JSON.stringify(result), old);
  const first = createPoseAttempt('attention'), second = createPoseAttempt('attention');
  assert.notEqual(first.id, second.id);
});

test('basic drill freezes each step before later frames and emits only the final sequence', () => {
  let clock = origin;
  const processor = new SessionProcessor(undefined, () => (clock += .25));
  const context = { ...attempt('drill-1'), movementId: 'basicDrill' as const };
  processor.command('selectBasicDrill', context);
  const feed = (frame: CanonicalPoseFrame) => { clock = origin + frame.timestampMs + 20; return processor.process(frame, goodLighting, 20); };
  for (let t = 0; t <= 1500; t += 100) feed(attentionFrame(t));
  processor.command('startCalibration', context);
  const steps: { result: DrillStepResult; json: string }[] = [];
  let movement = 'attention';
  let saluteCommandMs: number | undefined;
  let final: Extract<WorkerEvent, { type: 'score' }> | undefined;
  for (let t = 1600; t < 35_000; t += 100) {
    const events = feed(processor.expectedPostureId === 'salute' && saluteCommandMs !== undefined ? saluteMotionFrame(t, saluteCommandMs) : drillFrame(processor.expectedPostureId, t));
    if (events.some(e => e.type === 'commandCue' && e.command === 'CHÀO')) saluteCommandMs = t;
    const snapshot = events.find(e => e.type === 'analysis');
    if (snapshot?.type === 'analysis') movement = snapshot.snapshot.drillProgress!.movementId;
    const completed = (processor as unknown as { drillSteps: DrillStepResult[] }).drillSteps;
    for (const step of completed.slice(steps.length)) steps.push({ result: step, json: JSON.stringify(step) });
    for (const step of steps) { assert.ok(Object.isFrozen(step.result.result)); assert.equal(JSON.stringify(step.result), step.json); }
    const score = events.find(e => e.type === 'score');
    if (score?.type === 'score') { final = score; break; }
    assert.equal(events.filter(e => e.type === 'score').length, 0);
  }
  assert.ok(final?.result.drill);
  assert.equal(final.result.drill.steps.length, 3);
  assert.ok(Object.isFrozen(final.result.drill.steps));
  assert.equal(final.attemptId, 'drill-1');
});

test('freezing snapshots detaches nested criteria, feedback and quality data from mutable input', () => {
  const source = { score: 90, criteria: [{ points: 25, mistakes: ['A'] }], quality: { confidence: .9 } };
  const frozen = freezeSnapshot(source);
  source.criteria[0].points = 0; source.criteria[0].mistakes.push('B'); source.quality.confidence = 0;
  assert.deepEqual(frozen, { score: 90, criteria: [{ points: 25, mistakes: ['A'] }], quality: { confidence: .9 } });
  assert.throws(() => { frozen.criteria[0].points = 0; }, TypeError);
});
