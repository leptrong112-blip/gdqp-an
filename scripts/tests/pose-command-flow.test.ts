import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { COMMAND_FLOW, ATTENTION_FEET_INSTRUCTION, postureReadiness } from '../../src/features/pose-analysis/runtime/commandFlow';
import { PoseViewport } from '../../src/features/pose-analysis/components/PoseViewport';
import { PoseFinalSummary } from '../../src/features/pose-analysis/components/PoseFinalSummary';
import { speakPoseCommand } from '../../src/features/pose-analysis/utils/audioFeedback';
import { drillFrame, saluteMotionFrame } from './fixtures/pose/drill';
import { goodLighting } from './fixtures/pose/attention';
import { attentionMovement } from '../../src/features/pose-analysis/scoring/attentionMovement';
import { EXERCISE_CATALOG } from '../../src/features/pose-analysis/scoring/movements';
import { buildPoseResultSubmission } from '../../src/features/pose-analysis/results/buildPoseResult';
import type { WorkerEvent, SessionCommand } from '../../src/features/pose-analysis/runtime/workerProtocol';
import type { PoseAttemptContext, PoseFinalAttempt } from '../../src/features/pose-analysis/runtime/attemptTiming';

function harness(id: 'attention' | 'atEase' | 'salute' = 'attention', scorePrep = false) {
  const p = new SessionProcessor(undefined, () => 100_000 + time);
  let time = 0;
  let saluteCommandMs: number | undefined;
  const events: WorkerEvent[] = [];
  const attempt: PoseAttemptContext = { id: 'command-flow-001', movementId: id, startedAt: new Date(100_000).toISOString(), startedAtMs: 100_000, frameTimeOriginMs: 100_000 };
  const select = { attention: 'selectAttention', atEase: 'selectAtEase', salute: 'selectSalute' } as const;
  p.command(select[id], attempt); p.command(scorePrep ? 'enablePreconditionScoring' : 'disablePreconditionScoring');
  const feed = (posture = p.expectedPostureId, missing = false, straightRestKnee = false) => {
    time += 100;
    const frame = posture === 'salute' && saluteCommandMs !== undefined ? saluteMotionFrame(time, saluteCommandMs) : drillFrame(posture, time);
    if (straightRestKnee) frame.landmarks.leftKnee!.world!.z = 0;
    if (missing) delete frame.landmarks.leftAnkle;
    const next = p.process(frame, goodLighting, 0); events.push(...next);
    if (next.some(e => e.type === 'commandCue' && e.command === 'CHÀO')) saluteCommandMs = time;
    return next;
  };
  for (let i = 0; i < 16; i++) feed(); p.command('startCalibration', attempt);
  return { p, feed, events, attempt };
}
test('attention waits for resting precondition; wrong pose and insufficient evidence cannot start countdown', () => {
  const h = harness();
  for (let i = 0; i < 60; i++) h.feed('attention');
  assert.ok(h.events.some(e => e.type === 'analysis' && e.snapshot.workflow?.status === 'WRONG_PRECONDITION'));
  assert.equal(h.events.some(e => e.type === 'analysis' && e.snapshot.stage === 'countdown'), false);
  assert.equal(h.events.some(e => e.type === 'commandCue'), false);
  for (let i = 0; i < 8; i++) h.feed('atEase', true);
  assert.ok(h.events.some(e => e.type === 'analysis' && e.snapshot.workflow?.status === 'INSUFFICIENT_EVIDENCE'));
});
test('rest → 3,2,1 → NGHIÊM → transition excluded → stable hold → frozen result → THÔI once', () => {
  const h = harness(); let commandAt = 0;
  for (let i = 0; i < 170; i++) {
    const inTransition = h.events.some(e => e.type === 'commandCue' && e.command === 'NGHIÊM');
    const frameTime = (i + 17) * 100;
    const next = h.feed(inTransition && frameTime - commandAt < 1300 ? 'atEase' : h.p.expectedPostureId);
    const cue = next.find(e => e.type === 'commandCue' && e.command === 'NGHIÊM');
    if (cue?.type === 'commandCue') commandAt = cue.timestampMs - 100_000;
    if (next.some(e => e.type === 'score')) break;
  }
  const ticks = h.events.filter(e => e.type === 'analysis' && e.snapshot.stage === 'countdown').map(e => Math.max(1, Math.ceil(3 * (1 - (e as Extract<WorkerEvent, {type:'analysis'}>).snapshot.progress))));
  assert.deepEqual([...new Set(ticks)], [3, 2, 1]);
  assert.equal(h.events.filter(e => e.type === 'commandCue' && e.command === 'NGHIÊM').length, 1);
  assert.equal(h.events.filter(e => e.type === 'commandCue' && e.command === 'THÔI').length, 1);
  const final = h.events.find(e => e.type === 'score'); assert.ok(final?.type === 'score' && final.result.status === 'scored');
  assert.equal(final.result.total, 100);
  const scoredAt = h.events.find(e => e.type === 'analysis' && e.snapshot.stage === 'scoring');
  assert.ok(scoredAt?.type === 'analysis' && scoredAt.snapshot.frame.timestampMs > commandAt + 1300);
  assert.equal(h.events.at(-3)?.type, 'commandCue'); assert.equal(h.events.at(-2)?.type, 'score');
  const frozen = JSON.stringify(final.result); for (let i = 0; i < 15; i++) assert.deepEqual(h.feed('salute'), []);
  assert.ok(Object.isFrozen(final.result)); assert.equal(JSON.stringify(final.result), frozen);
});
test('rest and salute registry require attention and optional precondition snapshots are separate, persisted, immutable', () => {
  for (const id of ['atEase', 'salute'] as const) {
    const h = harness(id, true);
    for (let i = 0; i < 200 && !h.p.isFinalized; i++) h.feed();
    const final = h.events.find(e => e.type === 'score'); assert.ok(final?.type === 'score' && final.result.status === 'scored');
    assert.equal(final.result.precondition?.result.total, 100); assert.equal(final.result.total, 100);
    assert.ok(Object.isFrozen(final.result.precondition!.result.criteria));
    const attempt: PoseFinalAttempt = { id: h.attempt.id, movementId: id, startedAt: h.attempt.startedAt, finishedAt: new Date(final.timing!.resultFinalizedAtMs).toISOString(), timing: final.timing! };
    const saved = buildPoseResultSubmission(final.result, attempt, { studentName: 'QA commands', className: 'TEST', startedAt: attempt.startedAt }, 20);
    assert.ok(saved); assert.equal(saved.preconditionResult!.score, 100); assert.equal(saved.score, 100);
    const html = renderToStaticMarkup(React.createElement(PoseFinalSummary, { result: final.result, movementId: id, children: null }));
    assert.match(html, /Tiền đề — Đứng nghiêm/); assert.match(html, /Động tác chính/);
    h.p.command('reset', { ...h.attempt, id: 'command-flow-002' });
    assert.equal(h.p.isFinalized, false); assert.equal(h.p.expectedPostureId, 'attention');
  }
  for (const id of ['turnLeft', 'turnRight', 'salute', 'atEase'] as const) assert.equal(COMMAND_FLOW[id].precondition, 'attention');
  assert.equal(postureReadiness(undefined, attentionMovement), 'INSUFFICIENT_EVIDENCE');
});
test('wording and large command overlays are exact; audio failure or hung playback never returns an awaited promise', () => {
  assert.equal(attentionMovement.criteria.find(c => c.id === 'feet')!.label, ATTENTION_FEET_INSTRUCTION);
  assert.equal(EXERCISE_CATALOG.find(e => e.id === 'attention')!.guidelines[0].description, ATTENTION_FEET_INSTRUCTION);
  const html = renderToStaticMarkup(React.createElement(PoseViewport, { videoRef: { current: null }, canvasRef: { current: null }, mirrored: true, stage: 'transition', progress: 0, commandCue: { command: 'NGHIÊM' } }));
  assert.match(html, /Khẩu lệnh NGHIÊM/); assert.match(html, /pointer-events-none/); assert.match(html, /NGHIÊM/);
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window'), originalSpeech = Object.getOwnPropertyDescriptor(globalThis, 'SpeechSynthesisUtterance');
  try {
    Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', { configurable: true, value: class { lang = ''; rate = 1; } });
    for (const fail of [true, false]) {
      Object.defineProperty(globalThis, 'window', { configurable: true, value: { speechSynthesis: { cancel() {}, getVoices: () => [], speak() { if (fail) throw Error('blocked audio'); return new Promise(() => {}); } } } });
      assert.equal(speakPoseCommand('NGHIÊM'), undefined); assert.equal(speakPoseCommand('THÔI', true), undefined);
    }
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow); else Reflect.deleteProperty(globalThis, 'window');
    if (originalSpeech) Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', originalSpeech); else Reflect.deleteProperty(globalThis, 'SpeechSynthesisUtterance');
  }
});

test('preparation overlay shows the current reason rather than a generic insufficient-data loop', () => {
  const html=renderToStaticMarkup(React.createElement(PoseViewport,{
    videoRef:{current:null},canvasRef:{current:null},mirrored:true,stage:'waiting-precondition',progress:0,
    workflow:{preconditionId:'attention',preconditionLabel:'Đứng nghiêm',status:'INSUFFICIENT_EVIDENCE',scoringPrecondition:false,
      message:'Chưa nhìn rõ đầu gối và chân trụ. Giữ cả hai chân trong khung hình, tránh che khuất.'},
  }));
  assert.match(html,/Chưa nhìn rõ đầu gối và chân trụ/);
  assert.doesNotMatch(html,/Camera chưa đủ dữ liệu để xác nhận\./);
});

test('main movement frames cannot overwrite the already frozen attention snapshot or average its score into the main grade', () => {
  const h = harness('atEase', true); let savedPreparation = ''; let preparation: unknown;
  for (let i = 0; i < 240 && !h.p.isFinalized; i++) {
    const latest = [...h.events].reverse().find(e => e.type === 'analysis');
    h.feed(h.p.expectedPostureId, false, latest?.type === 'analysis' && latest.snapshot.stage === 'scoring');
    const pre = (h.p as unknown as { precondition?: unknown }).precondition;
    if (pre && !savedPreparation) { preparation = pre; savedPreparation = JSON.stringify(pre); assert.ok(Object.isFrozen(pre)); }
    if (pre) assert.equal(JSON.stringify(pre), savedPreparation);
  }
  const final = h.events.find(e => e.type === 'score'); assert.ok(final?.type === 'score' && final.result.status === 'scored');
  assert.ok(preparation); assert.equal(final.result.precondition!.result.total, 100);
  assert.ok(final.result.total < 100); assert.equal(JSON.stringify(final.result.precondition!), savedPreparation);
  assert.ok(Object.isFrozen(final.result.precondition!.quality));
});
