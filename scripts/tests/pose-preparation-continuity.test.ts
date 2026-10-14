import test from 'node:test';
import assert from 'node:assert/strict';

test('natural attention remains ready despite noisy elbow depth, across all attention preconditions', () => {
  for (const command of ['selectAtEase','selectTurnLeft','selectTurnRight','selectSalute'] as const) {
    for (const gradePreparation of [false,true]) {
      const p=new SessionProcessor();p.command(command);
      p.command(gradePreparation?'enablePreconditionScoring':'disablePreconditionScoring');
      p.command('startCalibration');
      const events:WorkerEvent[]=[];
      for(let i=0;i<600&&!events.some(e=>e.type==='commandCue');i++) {
        const f=attentionFrame(i*1000/30);
        // Image/body/wrists remain stationary. Small world-depth estimation
        // changes swing elbow angles even though the starting stance stays READY.
        const z=.02*(1+Math.sin(i*.45));
        f.landmarks.leftElbow!.world!.z=z;f.landmarks.rightElbow!.world!.z=z;
        events.push(...p.process(f,goodLighting,0));
      }
      assert.equal(events.filter(e=>e.type==='commandCue').length,1,`${command}, grade=${gradePreparation}`);
      assert.equal(events.some(e=>e.type==='score'),false);
    }
  }
});
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { drillFrame } from './fixtures/pose/drill';
import { attentionFrame, goodLighting } from './fixtures/pose/attention';
import { referenceSilhouettes, referenceSilhouetteFrame } from './fixtures/pose/referenceSilhouettes';
import { postureReadiness } from '../../src/features/pose-analysis/runtime/commandFlow';
import { attentionMovement } from '../../src/features/pose-analysis/scoring/attentionMovement';
import { atEaseMovement } from '../../src/features/pose-analysis/scoring/atEaseMovement';
import { createCalibration, normalizePose } from '../../src/features/pose-analysis/pipeline/normalization';
import { extractFeatures } from '../../src/features/pose-analysis/pipeline/featureExtraction';
import type { CanonicalPoseFrame } from '../../src/features/pose-analysis/types';
import type { WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';

function session(id: 'attention' | 'atEase', gradePreparation = false) {
  const processor = new SessionProcessor();
  processor.command(id === 'attention' ? 'selectAttention' : 'selectAtEase');
  processor.command(gradePreparation ? 'enablePreconditionScoring' : 'disablePreconditionScoring');
  processor.command('startCalibration');
  let t = 0;
  const events: WorkerEvent[] = [];
  const feed = (change?: (frame: CanonicalPoseFrame) => void) => {
    t += 100;
    const frame = drillFrame(processor.expectedPostureId, t);
    change?.(frame);
    const next = processor.process(frame, goodLighting, 0);
    events.push(...next);
    return next.find((e): e is Extract<WorkerEvent, { type:'analysis' }> => e.type === 'analysis')?.snapshot;
  };
  return { processor, events, feed };
}

test('borderline resting knee jitter advances preparation using confirmed identity, then finishes one attention action', () => {
  const h = session('attention');
  for (let i = 0; i < 240 && !h.processor.isFinalized; i++) h.feed(frame => {
    if (h.processor.expectedPostureId !== 'atEase') return;
    // Actual 3-D observations alternate around the nghỉ identity boundary.
    // Symmetric thigh/shin segments give 180 - 2*atan(z/segment) degrees.
    const hip = frame.landmarks.leftHip!.world!, ankle = frame.landmarks.leftAnkle!.world!;
    const segment = Math.hypot(hip.x - ankle.x, hip.y - ankle.y) / 2;
    frame.landmarks.leftKnee!.world!.z = segment * Math.tan((180 - (i % 2 ? 176 : 177)) * Math.PI / 360);
  });
  assert.equal(h.events.filter(e => e.type === 'commandCue' && e.command === 'NGHIÊM').length, 1);
  const scores = h.events.filter(e => e.type === 'score');
  assert.equal(scores.length, 1);
  assert.equal(scores[0].result.status, 'scored');
});

test('an unavailable optional preparation grade does not repeatedly restart a confirmed stance', () => {
  const h = session('atEase', true);
  for (let i = 0; i < 240 && !h.processor.isFinalized; i++) h.feed(frame => {
    if (h.processor.expectedPostureId === 'attention') {
      // Whole-body quality passes, but the stricter per-criterion grade cannot
      // reliably grade this foot. Identity must not become a hidden score gate.
      frame.landmarks.leftFootIndex!.confidence = .7;
    }
  });
  assert.equal(h.events.filter(e => e.type === 'commandCue' && e.command === 'NGHỈ').length, 1);
  const score = h.events.find(e => e.type === 'score');
  assert.ok(score?.result.status === 'scored');
  assert.equal(score.result.precondition, undefined);
});

test('missing elbow depth after NGHIÊM produces an evidence result instead of an infinite transition', () => {
  const h = session('attention');
  for (let i = 0; i < 300 && !h.processor.isFinalized; i++) h.feed(frame => {
    if (h.processor.expectedPostureId === 'attention') delete frame.landmarks.leftElbow!.world;
  });
  const scores = h.events.filter(e => e.type === 'score');
  assert.equal(scores.length, 1);
  assert.equal(scores[0].result.status, 'notScorable');
  if (scores[0].result.status === 'notScorable') assert.match(scores[0].result.reasons.join(' '), /Tay dọc thân/);
  assert.equal(h.events.filter(e => e.type === 'commandCue' && e.command === 'NGHIÊM').length, 1);
});

test('a single observed settling movement is not reused as instability of the following static hold', () => {
  const h = session('atEase');
  let actionFrames = 0;
  for (let i = 0; i < 240 && !h.processor.isFinalized; i++) h.feed(frame => {
    if (h.processor.expectedPostureId !== 'atEase') return;
    actionFrames++;
    // 0.7 s of slow settling, then remain still after one response to NGHỈ.
    const shift = Math.min(actionFrames, 7) * .012;
    for (const p of Object.values(frame.landmarks)) p.image.x += shift;
  });
  const score = h.events.find(e => e.type === 'score');
  assert.ok(score?.result.status === 'scored', JSON.stringify(score?.result));
  assert.equal(h.events.filter(e => e.type === 'commandCue' && e.command === 'NGHỈ').length, 1);
});

test('the three attention silhouettes and one rest silhouette support their labeled preparation identity in projection', () => {
  referenceSilhouettes.forEach((reference, i) => {
    const frame = referenceSilhouetteFrame(i, 0);
    const profile = createCalibration(Array.from({length:12}, () => frame))!;
    const sample = extractFeatures(normalizePose(frame, profile)!);
    assert.equal(postureReadiness(sample, reference.posture === 'attention' ? attentionMovement : atEaseMovement), 'READY', `reference ${i+1}`);
  });
});

test('reference silhouette simulations perform either command once and complete without a second action', () => {
  for (const fps of [5,10,15]) for (const attentionIndex of [0,1,2]) for (const movement of ['attention','atEase'] as const) {
    const p = new SessionProcessor();
    p.command(movement === 'attention' ? 'selectAttention' : 'selectAtEase');
    p.command('enablePreconditionScoring'); p.command('startCalibration');
    const events: WorkerEvent[] = [];
    for (let i=0; i<fps*30 && !p.isFinalized; i++) {
      const frame = referenceSilhouetteFrame(p.expectedPostureId === 'attention' ? attentionIndex : 3, i*1000/fps);
      events.push(...p.process(frame, goodLighting, 0));
    }
    const label = `${movement}, reference ${attentionIndex+1}, ${fps} FPS`;
    assert.equal(events.filter(e => e.type === 'commandCue' && e.command !== 'THÔI').length, 1, label);
    const scores = events.filter(e => e.type === 'score');
    assert.equal(scores.length, 1, label);
    // Projection does not establish a true foot-opening angle or a perfect grade.
    assert.equal(scores[0].result.status, 'scored', label);
  }
});

test('repeated observed arm changes terminate with unavailable evidence rather than silently resetting forever', () => {
  const h = session('atEase');
  let actionFrames = 0;
  for (let i=0; i<350 && !h.processor.isFinalized; i++) h.feed(frame => {
    if (h.processor.expectedPostureId !== 'atEase') return;
    actionFrames++;
    const offset = Math.floor(actionFrames/3)%2 ? .12 : 0;
    frame.landmarks.leftWrist!.image.x -= offset;
  });
  const scores = h.events.filter(e => e.type === 'score');
  assert.equal(scores.length, 1);
  assert.equal(scores[0].result.status, 'notScorable');
  if (scores[0].result.status === 'notScorable') assert.match(scores[0].result.reasons.join(' '), /Đã nhận động tác/);
  assert.equal(h.events.filter(e => e.type === 'commandCue' && e.command === 'THÔI').length, 1);
});
