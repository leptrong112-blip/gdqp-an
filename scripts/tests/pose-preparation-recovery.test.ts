import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { POSE_CONFIG as C } from '../../src/features/pose-analysis/config';
import { postureReadiness } from '../../src/features/pose-analysis/runtime/commandFlow';
import { attentionMovement } from '../../src/features/pose-analysis/scoring/attentionMovement';
import { createCalibration, normalizePose } from '../../src/features/pose-analysis/pipeline/normalization';
import { extractFeatures } from '../../src/features/pose-analysis/pipeline/featureExtraction';
import { drillFrame } from './fixtures/pose/drill';
import { goodLighting } from './fixtures/pose/attention';
import type { CanonicalPoseFrame, PoseStage } from '../../src/features/pose-analysis/types';
import type { WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';

function flow(movement: 'attention' | 'atEase' = 'atEase', fps = 10, gradePreparation = true) {
  let t = 0;
  const processor = new SessionProcessor(undefined, () => 100_000 + t), events: WorkerEvent[] = [];
  processor.command(movement === 'attention' ? 'selectAttention' : 'selectAtEase', {
    id: 'preparation-recovery', movementId: movement, startedAt: new Date(100_000).toISOString(), startedAtMs: 100_000, frameTimeOriginMs: 100_000,
  });
  processor.command(gradePreparation ? 'enablePreconditionScoring' : 'disablePreconditionScoring');
  const feed = (change?: (frame: CanonicalPoseFrame) => void, dark = false, gap = 0) => {
    t += 1000 / fps + gap;
    const frame = drillFrame(processor.expectedPostureId, t); change?.(frame);
    const next = processor.process(frame, dark ? { ...goodLighting, mean: 10 } : goodLighting, 0);
    events.push(...next);
    return next.find((e): e is Extract<WorkerEvent, {type:'analysis'}> => e.type === 'analysis')?.snapshot;
  };
  for (let i = 0; i < Math.ceil(fps * 1.6); i++) feed();
  processor.command('startCalibration');
  const reach = (stage: PoseStage, progress = 0) => {
    for (let i = 0; i < fps * 30; i++) { const snapshot = feed(); if (snapshot?.stage === stage && snapshot.progress >= progress) return snapshot; }
    throw new Error(`Did not reach ${stage}`);
  };
  return { processor, events, feed, reach, time: () => t };
}

test('natural straight knees are not rejected as resting just because of mild asymmetry', () => {
  const frame = drillFrame('attention', 0), profile = createCalibration(Array.from({length:12}, () => frame))!;
  const sample = extractFeatures(normalizePose(frame, profile)!);
  sample.values.leftKneeAngle!.value = 174; sample.values.rightKneeAngle!.value = 180;
  sample.values.minKneeAngle!.value = 174; sample.values.maxKneeAngle!.value = 180; sample.values.kneeAngleDiff!.value = 6;
  assert.equal(postureReadiness(sample, attentionMovement), 'READY');
  assert.equal(postureReadiness(extractFeatures(normalizePose(drillFrame('atEase', 0), profile)!), attentionMovement), 'WRONG_PRECONDITION');
});

test('repositioning, darkness and missing body before the command recover without THÔI or a rejected result', () => {
  for (const fault of ['movement', 'dark', 'missing', 'gap']) {
    const h = flow();
    for (let i = 0; i < 15; i++) h.feed(frame => {
      if (fault === 'movement') for (const point of Object.values(frame.landmarks)) {point.image.x += .035; if (point.world) point.world.x += .035;}
      if (fault === 'missing') delete frame.landmarks.leftAnkle;
    }, fault === 'dark', fault === 'gap' ? 400 : 0);
    assert.equal(h.events.some(e => e.type === 'score' || e.type === 'commandCue'), false, fault);
    assert.equal(h.processor.isFinalized, false, fault);
    h.reach('countdown');
    assert.equal(h.events.filter(e => e.type === 'score').length, 0, fault);
  }
});

test('one missing wrist pauses precondition grade without erasing the valid hold or inserting missing samples', () => {
  const h = flow(); const before = h.reach('precondition-scoring', .4);
  const paused = h.feed(frame => { delete frame.landmarks.leftWrist; });
  assert.equal(paused?.stage, 'precondition-scoring');
  assert.equal(paused?.progress, before.progress);
  for (let i = 0; i < 12; i++) {
    const current = h.feed();
    if (current?.stage === 'precondition-scoring') assert.ok(current.progress >= before.progress);
  }
  h.reach('countdown');
  assert.equal(h.events.some(e => e.type === 'score'), false);
});

test('stationary rest workflow with intermittent wrist confidence reaches one command and one result without repeating the action', () => {
  for (const fps of [5,8,12,20]) for (const gradePreparation of [false,true]) {
    const h=flow('atEase',fps,gradePreparation);
    for(let i=0;i<fps*50&&!h.processor.isFinalized;i++) h.feed(frame=>{
      if(i%10===0) {frame.landmarks.leftWrist!.confidence=.2;frame.landmarks.leftWrist!.visibility=.2;}
    });
    assert.equal(h.events.filter(e=>e.type==='commandCue'&&e.command==='NGHỈ').length,1);
    const scores=h.events.filter((e):e is Extract<WorkerEvent,{type:'score'}>=>e.type==='score');
    assert.equal(scores.length,1);assert.ok(scores[0].result.status==='scored');assert.equal(scores[0].result.total,100);
    if(gradePreparation)assert.equal(scores[0].result.precondition?.result.total,100);
  }
});

test('a clear stable but insufficiently bent rest pose is graded with leg feedback instead of waiting for another movement', () => {
  const h=flow('atEase',10,false);h.reach('transition');
  for(let i=0;i<100&&!h.processor.isFinalized;i++)h.feed(frame=>{frame.landmarks.leftKnee!.world!.z=.004;});
  const scores=h.events.filter((e):e is Extract<WorkerEvent,{type:'score'}>=>e.type==='score');
  assert.equal(scores.length,1);assert.ok(scores[0].result.status==='scored');
  const legs=scores[0].result.criteria.find(c=>c.id==='legs')!;
  assert.ok(legs.points<legs.maximum);assert.notEqual(legs.statusLevel,'PASS');assert.notEqual(legs.statusLevel,'NOT_SCORABLE');
  assert.equal(h.events.filter(e=>e.type==='commandCue'&&e.command==='NGHỈ').length,1);
});

test('a brief pose-identity spike does not stretch countdown; sustained wrong stance returns to preparation', () => {
  const h = flow('atEase', 10, false); const before = h.reach('countdown', .3);
  // Readiness differs while tracking remains clear: unsupported head/arms do not
  // need a camera error to prevent an exercise command.
  const wrong = (frame:CanonicalPoseFrame) => { frame.landmarks.leftKnee!.world!.z = .03; };
  const paused = h.feed(wrong);
  assert.equal(paused?.stage, 'countdown');
  assert.ok(paused!.progress > before.progress);
  h.feed();
  assert.equal(h.events.some(e => e.type === 'commandCue'), false);
  for (let i = 0; i < 12; i++) h.feed(wrong);
  assert.ok(h.events.some(e => e.type === 'analysis' && e.snapshot.stage === 'waiting-precondition'));
  assert.equal(h.events.some(e => e.type === 'score' || e.type === 'commandCue'), false);
});

test('3,2,1 lasts three seconds and does not grade the main posture before the command', () => {
  const h = flow('atEase', 10, false); const started = h.reach('countdown');
  const startMs = started.frame.timestampMs, ticks = new Map<number, number[]>();
  while (!h.events.some(e => e.type === 'commandCue')) {
    const snapshot = h.feed();
    if (snapshot?.stage === 'countdown') {
      const tick = Math.max(1, Math.ceil(3 * (1 - snapshot.progress)));
      ticks.set(tick, [...(ticks.get(tick) ?? []), snapshot.frame.timestampMs]);
    }
  }
  const cue = h.events.find(e => e.type === 'commandCue'); assert.ok(cue?.type === 'commandCue');
  assert.equal(cue.timestampMs - 100_000 - startMs, C.countdownMs);
  assert.deepEqual([...ticks.keys()], [3,2,1]);
  assert.ok([...ticks.values()].every(times => times.length >= 9));
  assert.equal(h.events.some(e => e.type === 'score' || e.type === 'analysis' && e.snapshot.stage === 'scoring'), false);
});

test('light body repositioning during countdown does not stop or restart 3,2,1', () => {
  const h = flow('atEase', 10, false), started = h.reach('countdown');
  const startMs = started.frame.timestampMs;
  for (let i = 0; i < 30; i++) h.feed(frame => {
    const offset = i % 2 ? .025 : 0;
    for (const point of Object.values(frame.landmarks)) { point.image.x += offset; if (point.world) point.world.x += offset * frame.aspectRatio; }
  });
  const cue = h.events.find(e => e.type === 'commandCue'); assert.ok(cue?.type === 'commandCue');
  assert.equal(cue.timestampMs - 100_000 - startMs, 3000);
  assert.equal(h.events.filter(e => e.type === 'analysis' && e.snapshot.stage === 'countdown').length, 30);
});

test('elapsed countdown cannot issue the command while the preparation pose is still wrong', () => {
  const h = flow('atEase', 10, false); h.reach('countdown', .9);
  for (let i = 0; i < 3; i++) h.feed(frame => { frame.landmarks.leftKnee!.world!.z = .03; });
  assert.equal(h.events.some(e => e.type === 'commandCue'), false);
  h.feed();
  assert.equal(h.events.filter(e => e.type === 'commandCue' && e.command === 'NGHỈ').length, 1);
});

test('5 FPS waits for actual samples for both static grades and an independent attention precondition', () => {
  for (const movement of ['attention','atEase'] as const) {
    const h = flow(movement, 5); h.reach('scoring');
    const started = h.time(); let final:Extract<WorkerEvent,{type:'score'}> | undefined;
    for (let i = 0; i < 40 && !final; i++) { h.feed(); final = h.events.find((e):e is Extract<WorkerEvent,{type:'score'}> => e.type === 'score'); }
    assert.ok(final?.result.status === 'scored', movement);
    assert.equal(final.result.total, 100); assert.ok(h.time() - started >= 3400);
    assert.equal(final.timing!.scoringWindowFinishedAtMs, 100_000 + h.time());
    if (movement === 'atEase') {
      assert.equal(final.result.precondition?.result.total, 100);
      assert.ok(Object.isFrozen(final.result.precondition?.result));
    }
    assert.equal(h.events.filter(e => e.type === 'commandCue' && e.command === 'THÔI').length, 1);
  }
});

test('persistent tracking loss after the action command still finishes without a fabricated static score', () => {
  const h = flow(); h.reach('scoring');
  for (let i = 0; i < 15; i++) h.feed(frame => { delete frame.landmarks.leftAnkle; });
  const scores = h.events.filter((e):e is Extract<WorkerEvent,{type:'score'}> => e.type === 'score');
  assert.equal(scores.length, 1); assert.equal(scores[0].result.status, 'notScorable');
});
