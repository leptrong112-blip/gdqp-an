import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { attentionFrame, goodLighting } from './fixtures/pose/attention';
import { drillFrame } from './fixtures/pose/drill';
import { createCalibration, normalizePose } from '../../src/features/pose-analysis/pipeline/normalization';
import { extractFeatures } from '../../src/features/pose-analysis/pipeline/featureExtraction';
import { QualityChecker } from '../../src/features/pose-analysis/pipeline/qualityChecks';
import { stableStaticHold } from '../../src/features/pose-analysis/pipeline/staticHold';
import { evaluate } from '../../src/features/pose-analysis/scoring/scoringEngine';
import { attentionMovement } from '../../src/features/pose-analysis/scoring/attentionMovement';
import { atEaseMovement } from '../../src/features/pose-analysis/scoring/atEaseMovement';
import { buildRequirementCards } from '../../src/features/pose-analysis/scoring/postureFeedback';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { PoseViewport } from '../../src/features/pose-analysis/components/PoseViewport';
import { ScoreResults } from '../../src/features/pose-analysis/components/ScoreResults';
import type { FeatureWindow, AnalysisSnapshot } from '../../src/features/pose-analysis/types';
import type { WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';

const profile = createCalibration(Array.from({ length: 20 }, (_, i) => attentionFrame(i * 100)))!;
function window(): FeatureWindow {
  return { samples: Array.from({ length: 30 }, (_, i) => extractFeatures(normalizePose(attentionFrame(i * 100), profile)!)), validDurationMs: 3000, qualityPassed: true };
}

test('mild knee flexion is fully tolerated, but sustained clear bends fail required legs without collapsing other scores', () => {
  for (const angle of [180, 167, 165, 140]) {
    const data = window();
    data.samples.forEach(s => { s.values.leftKneeAngle!.value = angle; s.values.rightKneeAngle!.value = angle; });
    const result = evaluate(attentionMovement, data);
    assert.ok(result.status === 'scored');
    if (angle >= 165) { assert.equal(result.total, 100); assert.equal(result.passed, true); }
    else {
      assert.equal(result.total, 80); assert.equal(result.passed, false);
      assert.equal(buildRequirementCards(result.criteria)[1].statusLevel, 'NOT_ACHIEVED');
    }
  }
});

test('rest has its own mild flexion bands, still distinguishing both-straight and both-bent knees', () => {
  for (const [max, min, expectedPass] of [[180, 174, true], [170, 165, true], [180, 180, false], [155, 150, false]]) {
    const data = window();
    data.samples.forEach(s => {
      s.values.maxKneeAngle!.value = Number(max); s.values.minKneeAngle!.value = Number(min);
      s.values.kneeAngleDiff!.value = Number(max) - Number(min);
    });
    const result = evaluate(atEaseMovement, data);
    assert.ok(result.status === 'scored');
    assert.equal(result.passed, expectedPass);
    if (expectedPass) {
      assert.equal(result.total, 100);
      assert.deepEqual(result.criteria.flatMap(c => c.mistakes ?? []), []);
    }
  }
});

test('one isolated bad frame is trimmed, sustained bad frames still lose points', () => {
  for (const badCount of [1, 12, 29]) {
    const data = window();
    data.samples.slice(0, badCount).forEach(s => { s.values.torsoTilt!.value = 25; });
    const result = evaluate(attentionMovement, data);
    assert.ok(result.status === 'scored');
    assert.equal(result.total === 100, badCount === 1);
    if (badCount === 29) assert.equal(result.passed, false);
  }
});

test('small whole-body lowering does not change normalized posture score or fail relaxed tracking', () => {
  const samples = [], checker = new QualityChecker();
  for (let t = 0; t <= 3000; t += 100) {
    const frame = attentionFrame(t);
    for (const p of Object.values(frame.landmarks)) { p!.image.y += t >= 1200 ? 0.025 : 0; p!.world!.y += t >= 1200 ? 0.025 : 0; }
    const quality = checker.check(frame, goodLighting, profile, { relaxedPosture: true });
    if (t >= 1000) assert.equal(quality.passed, true);
    samples.push(extractFeatures(normalizePose(frame, profile)!));
  }
  const result = evaluate(attentionMovement, { samples, validDurationMs: 3000, qualityPassed: true });
  assert.ok(result.status === 'scored' && result.total === 100);
});

test('minor single-condition error no longer drags down an entire group or yields contradictory feedback', () => {
  const data = window();
  data.samples.forEach(s => { s.values.leftWristHipDistance!.value = 0.65; s.values.footOpeningAngle!.value = 30; });
  const result = evaluate(attentionMovement, data);
  assert.ok(result.status === 'scored' && result.total >= 98);
  assert.ok(result.criteria.every(c => c.statusLevel === 'PASS' && !c.mistakes?.length));
});

test('a changing pose cannot satisfy the static-hold stability window', () => {
  const data = window();
  data.samples.forEach((s, i) => { s.values.leftElbowAngle!.value = i % 2 ? 80 : 180; });
  assert.equal(stableStaticHold(data.samples), false);
  assert.equal(stableStaticHold(window().samples), true);
});

function runDrill(options: { failAt?: number; wrongRest?: boolean; shortGap?: boolean } = {}) {
  const session = new SessionProcessor(), events: WorkerEvent[] = [];
  session.command('selectBasicDrill');
  let snapshot: AnalysisSnapshot | undefined;
  const feed = (t: number) => {
    const id = snapshot?.drillProgress?.movementId ?? 'attention';
    const frame = drillFrame(options.wrongRest && id === 'atEase' ? 'attention' : id, t);
    if (options.failAt !== undefined && snapshot?.drillProgress?.index === options.failAt) frame.personCount = 0;
    if (options.shortGap && t === 6800) frame.personCount = 0;
    const next = session.process(frame, goodLighting, 10);
    for (const e of next) if (e.type === 'analysis') snapshot = e.snapshot;
    events.push(...next);
  };
  for (let t = 0; t <= 1500; t += 100) feed(t);
  session.command('startCalibration');
  for (let t = 1600; t <= 35000 && !events.some(e => e.type === 'score'); t += 100) feed(t);
  return { session, events, snapshot };
}

test('full drill counts down for each step, holds 3s, emits only one final result with all three scores', () => {
  const { events } = runDrill();
  const scores = events.filter(e => e.type === 'score');
  assert.equal(events.filter(e => e.type === 'calibrationComplete').length, 1);
  assert.equal(scores.length, 1);
  const result = scores[0].result;
  assert.ok(result.status === 'scored', JSON.stringify(result));
  assert.equal(result.drill?.steps.length, 3);
  assert.deepEqual(result.drill?.steps.map(s => s.movementId), ['attention', 'atEase', 'salute']);
  assert.equal(result.drill?.completion, 1); assert.equal(result.drill?.passed, true);
  assert.equal(result.drill?.totalPoints, 300); assert.equal(result.total, 100);
  for (let index = 0; index < 3; index++) {
    const frames = events.filter(e => e.type === 'analysis' && e.snapshot.drillProgress?.index === index).map(e => (e as Extract<WorkerEvent, { type: 'analysis' }>).snapshot);
    const countdown = frames.find(f => f.stage === 'countdown')!;
    const scoring = frames.find(f => f.stage === 'scoring')!;
    assert.ok(scoring.frame.timestampMs - countdown.frame.timestampMs >= 3000);
    assert.equal(scoring.progress, 0, 'countdown interval cannot be credited as scoring time');
    const finished = events.find(e => e.type === 'analysis' && (e.snapshot.drillProgress?.index === index + 1 || (index === 2 && e.snapshot.stage === 'completed')));
    assert.ok(finished?.type === 'analysis');
    assert.ok(finished.snapshot.frame.timestampMs - scoring.frame.timestampMs >= 3000, 'each posture needs its own full hold');
  }
  const html = renderToStaticMarkup(React.createElement(ScoreResults, { result, movementId: 'basicDrill' }));
  assert.match(html, /ĐẠT TOÀN CHUỖI/); assert.match(html, /300/); assert.match(html, /100%/);
});

test('a wrong rest pose cannot be hidden by perfect attention and salute scores', () => {
  const result = runDrill({ wrongRest: true }).events.find(e => e.type === 'score')?.result;
  assert.ok(result?.status === 'scored');
  assert.equal(result.drill?.completion, 1); assert.equal(result.drill?.passed, false);
});

test('tracking loss preserves earlier step scores without grading unobserved steps', () => {
  const { events } = runDrill({ failAt: 1 });
  const result = events.find(e => e.type === 'score')?.result;
  assert.ok(result?.status === 'notScorable');
  assert.equal(result.drill?.steps[0].result.status, 'scored');
  assert.equal(result.drill?.steps[1].result.status, 'notScorable');
  assert.equal(result.drill?.completion, 1 / 3);
  assert.equal(result.drill?.passed, false);
  const html = renderToStaticMarkup(React.createElement(ScoreResults, { result, movementId: 'basicDrill' }));
  assert.match(html, /CHƯA HOÀN TẤT/); assert.match(html, /không quy thành điểm 0/);
});

test('a brief tracking loss restarts the hold, then permits completing the whole drill', () => {
  const baseline = runDrill(), recovered = runDrill({ shortGap: true });
  assert.ok(recovered.events.find(e => e.type === 'score')?.result.status === 'scored');
  assert.ok(recovered.snapshot!.frame.timestampMs > baseline.snapshot!.frame.timestampMs);
});

test('reset/retry and switching exercises clear drill results and return to the first step', () => {
  const { session, snapshot } = runDrill();
  let t = snapshot!.frame.timestampMs;
  for (const command of ['reset', 'startCalibration'] as const) {
    session.command(command);
    const next = session.process(attentionFrame(t += 100), goodLighting, 10).find(e => e.type === 'analysis');
    assert.ok(next?.type === 'analysis'); assert.equal(next.snapshot.drillProgress?.index, 0); assert.equal(next.snapshot.drillProgress?.completed, 0);
  }
  session.command('selectAtEase');
  const next = session.process(attentionFrame(t += 100), goodLighting, 10).find(e => e.type === 'analysis');
  assert.ok(next?.type === 'analysis'); assert.equal(next.snapshot.drillProgress, undefined);
});

test('preparation is visible in fullscreen, labels the actual movement, and pauses when quality fails', () => {
  for (const qualityPassed of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(PoseViewport, {
      videoRef: { current: null }, canvasRef: { current: null }, mirrored: true,
      stage: 'countdown', progress: 0.4, isFullscreen: true, movementLabel: 'Đứng nghỉ', qualityPassed,
      pauseReason: 'Chưa thấy toàn thân', drillProgress: { index: 1, completed: 1, total: 3, movementId: 'atEase' },
    }));
    assert.match(html, /Đứng nghỉ/); assert.match(html, /Tiến trình chuỗi/);
    assert.match(html, qualityPassed ? /Chuẩn bị bắt đầu/ : /Tạm dừng chuẩn bị/);
    if (!qualityPassed) assert.match(html, /Chưa thấy toàn thân/);
    assert.doesNotMatch(html, /Chuẩn bị đứng nghiêm/);
  }
});
