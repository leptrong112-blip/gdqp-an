import test from 'node:test';
import assert from 'node:assert/strict';
import { QualityChecker, lightingMetrics } from '../../src/features/pose-analysis/pipeline/qualityChecks';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { attentionFrame, goodLighting } from './fixtures/pose/attention';
import { shouldDrawSkeleton } from '../../src/features/pose-analysis/rendering/skeletonRenderer';
test('quality needs warmup, fails immediately and recovers with hysteresis', () => {
  const checker = new QualityChecker(); assert.equal(checker.check(attentionFrame(0), goodLighting).passed, false);
  for (let t = 100; t <= 1100; t += 100) checker.check(attentionFrame(t), goodLighting);
  assert.equal(checker.check(attentionFrame(1200), goodLighting).passed, true);
  assert.equal(checker.check(attentionFrame(1300), { ...goodLighting, mean: 10 }).passed, false);
  assert.equal(checker.check(attentionFrame(1400), goodLighting).passed, false);
  for (let t = 1500; t <= 2500; t += 100) checker.check(attentionFrame(t), goodLighting);
  assert.equal(checker.check(attentionFrame(2600), goodLighting).passed, true);
});
test('rejects multiple people, cropped body, unreliable joints, rotation and movement', () => {
  for (const kind of ['person', 'framing', 'reliability', 'orientation', 'stability'] as const) {
    const checker = new QualityChecker(); for (let t = 0; t <= 1100; t += 100) checker.check(attentionFrame(t), goodLighting);
    const frame = attentionFrame(1200);
    if (kind === 'person') frame.personCount = 2;
    if (kind === 'framing') frame.landmarks.nose!.image.y = 0.01;
    if (kind === 'reliability') frame.landmarks.leftWrist!.visibility = 0.2;
    if (kind === 'orientation') frame.landmarks.leftShoulder!.world!.z = 0.5;
    if (kind === 'stability') { frame.landmarks.leftHip!.image.x += 0.1; frame.landmarks.rightHip!.image.x += 0.1; }
    const result = checker.check(frame, goodLighting); assert.equal(result.passed, false, kind); assert.equal(result.checks.find(c => c.id === kind)?.passed, false, kind);
  }
});
test('skeleton overlay shows partial detections independently of scoring readiness', () => {
  const fullBody = attentionFrame();
  delete fullBody.landmarks.leftWrist;
  assert.equal(shouldDrawSkeleton(fullBody), true, 'an optional missing wrist must not hide the full overlay');

  const cropped = attentionFrame(); delete cropped.landmarks.leftAnkle;
  assert.equal(shouldDrawSkeleton(cropped), true);

  const outside = attentionFrame(); outside.landmarks.rightKnee!.image.x = 1.1;
  assert.equal(shouldDrawSkeleton(outside), true);
  const upperBody = attentionFrame();
  upperBody.landmarks = { leftShoulder: upperBody.landmarks.leftShoulder, rightShoulder: upperBody.landmarks.rightShoulder };
  assert.equal(shouldDrawSkeleton(upperBody), true);
  assert.equal(new QualityChecker().check(upperBody, goodLighting).passed, false);
  assert.equal(shouldDrawSkeleton({ ...upperBody, personCount: 2 }), false);
  assert.equal(shouldDrawSkeleton({ ...upperBody, landmarks: {} }), false);
});
test('pixel lighting metrics discriminate dark and bright scenes', () => {
  assert.deepEqual(lightingMetrics([0, 0, 0, 255]), { mean: 0, darkRatio: 1, brightRatio: 0 });
  assert.ok(lightingMetrics([255, 255, 255, 255]).brightRatio === 1);
});
test('quality loss or long frame gaps during calibration wait for recovery without ending a practice attempt', () => {
  for (const gap of [false, true]) {
    const session = new SessionProcessor(); for (let t = 0; t <= 1100; t += 100) session.process(attentionFrame(t), goodLighting, 10);
    session.command('startCalibration'); let events = [];
    for (let t = 1200; t <= 2000; t += 100) events.push(...session.process(attentionFrame(gap ? t + 1000 : t), { ...goodLighting, mean: 10 }, 10));
    assert.equal(events.some(e => e.type === 'score' || e.type === 'commandCue'), false);
    assert.equal(session.isFinalized, false);
    assert.ok(events.some(e => e.type === 'analysis' && e.snapshot.stage === 'calibrating'));
  }
});

test('transition observes body settling immediately but still rejects dark, clipped, missing and multi-person frames', () => {
  for (const fault of ['none', 'dark', 'clipped', 'missing', 'people']) {
    const checker = new QualityChecker();
    for (let t = 0; t <= 1100; t += 100) checker.check(attentionFrame(t), goodLighting);
    const frame = attentionFrame(1200);
    for (const point of Object.values(frame.landmarks)) point.image.x += .025;
    if (fault === 'clipped') frame.landmarks.leftAnkle!.image.y = 1.1;
    if (fault === 'missing') delete frame.landmarks.leftWrist;
    if (fault === 'people') frame.personCount = 2;
    assert.equal(checker.check(frame, fault === 'dark' ? { ...goodLighting, mean: 10 } : goodLighting, undefined, { transition:true }).passed, fault === 'none', fault);
  }
});

test('rest transition permits changing knee angles but never treats overlapping or depthless knees as observed', () => {
  for (const fault of ['moving','overlap','depth']) {
    const checker = new QualityChecker(); let report;
    for (let t = 0; t <= 2000; t += 100) {
      const frame = attentionFrame(t); frame.landmarks.leftKnee!.world!.z = t % 200 ? .03 : 0;
      if (fault === 'overlap') frame.landmarks.leftKnee!.image = { ...frame.landmarks.rightKnee!.image };
      if (fault === 'depth') frame.landmarks.leftKnee!.world = undefined;
      report = checker.check(frame,goodLighting,undefined,{ transition:true,assessKnees:true });
    }
    assert.equal(report!.passed,fault==='moving',fault);
  }
});

test('brief-loss recovery accepts only current clear frames, never persistent low-quality evidence', () => {
  for (const persistent of [false,true]) {
    const checker=new QualityChecker();let accepted=0;
    for(let t=0;t<=4000;t+=100) {
      const frame=attentionFrame(t), missing=persistent||t%1000===0;
      if(missing)delete frame.landmarks.leftWrist;
      const report=checker.check(frame,goodLighting,undefined,{tolerateBriefLoss:true});
      if(missing)assert.equal(report.passed,false);
      else if(t>=1500)assert.equal(report.passed,true);
      if(report.passed)accepted++;
    }
    assert.equal(accepted>0,!persistent);
  }
});
