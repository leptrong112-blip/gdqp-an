import test from 'node:test';
import assert from 'node:assert/strict';
import { QualityChecker } from '../../src/features/pose-analysis/pipeline/qualityChecks';
import { filterLandmarks } from '../../src/features/pose-analysis/pipeline/confidenceFilter';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { postureReadiness } from '../../src/features/pose-analysis/runtime/commandFlow';
import { createCalibration, normalizePose } from '../../src/features/pose-analysis/pipeline/normalization';
import { extractFeatures } from '../../src/features/pose-analysis/pipeline/featureExtraction';
import { attentionMovement } from '../../src/features/pose-analysis/scoring/attentionMovement';
import { evaluate } from '../../src/features/pose-analysis/scoring/scoringEngine';
import { attentionFrame, goodLighting } from './fixtures/pose/attention';
import { drillFrame } from './fixtures/pose/drill';
import type { SessionCommand, WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';

test('preparation tolerates hidden arm joints but never missing core body, darkness or observed cropped arms', () => {
  for (const fault of ['arms', 'ankle', 'dark', 'cropped-arm', 'people']) {
    const checker = new QualityChecker(); let result;
    for (let t = 0; t <= 2000; t += 100) {
      const frame = attentionFrame(t);
      if (fault === 'arms') for (const n of ['leftWrist','rightWrist','leftElbow','rightElbow'] as const) frame.landmarks[n]!.visibility = .55;
      if (fault === 'ankle') delete frame.landmarks.leftAnkle;
      if (fault === 'cropped-arm') frame.landmarks.leftWrist!.image.x = 1.1;
      if (fault === 'people') frame.personCount = 2;
      result = checker.check(filterLandmarks(frame), fault === 'dark' ? {...goodLighting, mean:10} : goodLighting, undefined, { preparation:true });
    }
    assert.equal(result!.passed, fault === 'arms', fault);
  }
});

test('unobserved arms allow pose acquisition only, not invented arm grades or observed wrong arms', () => {
  const profile = createCalibration(Array.from({length:12}, () => attentionFrame()))!;
  const frame = attentionFrame(); delete frame.landmarks.leftWrist; delete frame.landmarks.rightWrist;
  const sample = extractFeatures(normalizePose(frame, profile)!);
  assert.equal(postureReadiness(sample, attentionMovement), 'INSUFFICIENT_EVIDENCE');
  assert.equal(postureReadiness(sample, attentionMovement, {allowUnobservedArms:true}), 'READY');
  assert.equal(evaluate(attentionMovement, {samples:Array.from({length:30}, () => sample), validDurationMs:3000, qualityPassed:true}).status, 'notScorable');
  sample.values.leftWristHipDistance = {value:2, confidence:.99};
  assert.equal(postureReadiness(sample, attentionMovement, {allowUnobservedArms:true}), 'WRONG_PRECONDITION');
});

test('every command flow reaches a single 3-second countdown with persistently occluded wrists, including optional preparation grading', () => {
  const selections: SessionCommand[] = ['selectAttention','selectAtEase','selectTurnLeft','selectTurnRight','selectSalute','selectBasicDrill'];
  for (const selection of selections) for (const grade of [false,true]) {
    const processor = new SessionProcessor(), events:WorkerEvent[] = []; let t = 0;
    processor.command(selection);
    processor.command(grade ? 'enablePreconditionScoring' : 'disablePreconditionScoring');
    const feed = () => {
      t += 100;
      const frame = drillFrame(processor.expectedPostureId, t);
      // Frequent confidence drops on one side, persistent occlusion on the other.
      frame.landmarks.leftWrist!.visibility = .55;
      frame.landmarks.rightWrist!.visibility = t % 300 ? .55 : .99;
      const next = processor.process(frame, goodLighting, 0); events.push(...next);
    };
    for (let i=0;i<16;i++) feed(); processor.command('startCalibration');
    for (let i=0;i<150 && !events.some(e=>e.type==='commandCue');i++) feed();
    const cues = events.filter(e=>e.type==='commandCue');
    assert.equal(cues.length,1, `${selection} grade=${grade}`);
    const snapshots = events.filter((e): e is Extract<WorkerEvent,{type:'analysis'}>=>e.type==='analysis');
    const countdown = snapshots.filter(e=>e.snapshot.stage==='countdown');
    assert.equal(countdown.length,30, `${selection} countdown must not restart`);
    assert.equal(events.some(e=>e.type==='score'),false);
    if (grade && processor.preparationMovementId === 'attention') assert.ok(snapshots.some(e=>e.snapshot.workflow?.message?.includes('không cần dang tay')));
  }
});
