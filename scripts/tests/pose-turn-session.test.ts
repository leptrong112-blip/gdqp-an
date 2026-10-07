import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { QualityChecker } from '../../src/features/pose-analysis/pipeline/qualityChecks';
import { PoseViewport } from '../../src/features/pose-analysis/components/PoseViewport';
import { ScoreResults } from '../../src/features/pose-analysis/components/ScoreResults';
import { analyzeTurnTechnique } from '../../src/features/pose-analysis/scoring/turnTechnique';
import { evaluateDynamicAttempt } from '../../src/features/pose-analysis/scoring/dynamicMovementAnalyzer';
import { turnLeftMovement, turnRightMovement } from '../../src/features/pose-analysis/scoring/turnMovements';
import { TemporalMotionBuffer } from '../../src/features/pose-analysis/pipeline/motionBuffer';
import { attentionFrame, rotatedPoseFrame, goodLighting } from './fixtures/pose/attention';
import type { CanonicalPoseFrame } from '../../src/features/pose-analysis/types';
import type { WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';

function readySession(sign: number) {
  const session = new SessionProcessor();
  session.command(sign > 0 ? 'selectTurnLeft' : 'selectTurnRight');
  for (let t = 0; t <= 1500; t += 100) session.process(attentionFrame(t), goodLighting, 20);
  session.command('startCalibration');
  for (let t = 1600; t < 10000; t += 100) {
    const events = session.process(attentionFrame(t), goodLighting, 20);
    const snapshot = events.find(e => e.type === 'analysis');
    if (snapshot?.type === 'analysis' && snapshot.snapshot.stage === 'scoring') {
      assert.equal(snapshot.snapshot.dynamicProgress?.phase, 'MOVING');
      return { session, start: t };
    }
  }
  throw new Error('Countdown did not complete');
}

function sideOcclusion(frame: CanonicalPoseFrame, sign: number) {
  const far = sign > 0 ? 'right' : 'left';
  for (const joint of ['Elbow', 'Wrist', 'Knee', 'Ankle', 'Heel', 'FootIndex'] as const) {
    delete frame.landmarks[`${far}${joint}`];
  }
}

test('light settling through countdown still records the first and only turn in both directions', () => {
  for (const sign of [1,-1]) {
    const session = new SessionProcessor(); session.command(sign > 0 ? 'selectTurnLeft' : 'selectTurnRight');
    for (let t = 0; t <= 1500; t += 100) session.process(attentionFrame(t), goodLighting, 0);
    session.command('startCalibration');
    let countdownAt:number|undefined, cue:number|undefined;
    const events:WorkerEvent[]=[];
    for (let t = 1600; t < 20000 && cue === undefined; t += 100) {
      const frame=attentionFrame(t);
      if (countdownAt !== undefined) for (const point of Object.values(frame.landmarks)) point.image.x += t % 200 ? .025 : 0;
      const next=session.process(frame,goodLighting,0);events.push(...next);
      if (next.some(e=>e.type==='analysis'&&e.snapshot.stage==='countdown')) countdownAt??=t;
      if (next.some(e=>e.type==='commandCue')) cue=t;
    }
    assert.ok(cue!==undefined&&countdownAt!==undefined);assert.equal(cue-countdownAt,3000);
    for (let dt = 100; dt <= 5000 && !session.isFinalized; dt += 100) {
      events.push(...session.process(rotatedPoseFrame(sign*Math.min(90,dt/600*90),cue+dt),goodLighting,0));
    }
    const scores=events.filter((e):e is Extract<WorkerEvent,{type:'score'}>=>e.type==='score');
    assert.equal(scores.length,1);assert.ok(scores[0].result.status==='scored');
    assert.equal(scores[0].result.criteria.find(c=>c.id==='direction')?.points,25);
    assert.ok(scores[0].result.sequence?.status==='analyzed'&&scores[0].result.sequence.motionObserved);
  }
});

test('turning immediately at the start cue retains countdown baseline and scores both directions', () => {
  for (const sign of [1, -1]) {
    const { session, start } = readySession(sign);
    const events: WorkerEvent[] = [];
    for (let dt = 100; dt <= 4000; dt += 100) {
      const frame = rotatedPoseFrame(sign * Math.min(90, dt * 0.15), start + dt);
      if (dt >= 300) sideOcclusion(frame, sign);
      if (dt >= 600) delete frame.landmarks.nose;
      // A modest pivot translates the image while the camera stays fixed.
      for (const p of Object.values(frame.landmarks)) p!.image.x += Math.min(0.07, dt / 1000 * 0.07);
      const next = session.process(frame, goodLighting, 20);
      events.push(...next);
      const score = next.find(e => e.type === 'score');
      if (score) break;
      assert.ok(next.some(e => e.type === 'analysis' && e.snapshot.stage === 'scoring'));
    }
    const scores = events.filter(e => e.type === 'score');
    assert.equal(scores.length, 1);
    const result = scores[0].result;
    assert.ok(result.status === 'scored', JSON.stringify(result));
    assert.equal(result.criteria.find(c => c.id === 'direction')?.points, 25);
    assert.ok(result.sequence?.status === 'analyzed' && result.sequence.motionObserved && result.sequence.startReady);
  }
});

test('one dropped torso observation recovers without a one-second warmup erasing turn evidence', () => {
  const { session, start } = readySession(1);
  const events: WorkerEvent[] = [];
  for (let dt = 100; dt <= 4000; dt += 100) {
    const frame = rotatedPoseFrame(Math.min(90, dt * 0.15), start + dt);
    if (dt === 300) delete frame.landmarks.leftShoulder;
    events.push(...session.process(frame, goodLighting, 20));
  }
  const score = events.find(e => e.type === 'score');
  assert.ok(score?.type === 'score' && score.result.status === 'scored');
});

test('side-on visibility is accepted only during turn tracking, with observed torso and visible leg', () => {
  const side = rotatedPoseFrame(90);
  sideOcclusion(side, 1);
  assert.equal(new QualityChecker().check(side, goodLighting, undefined, { allowTurn: true }).passed, true);
  assert.equal(new QualityChecker().check(side, goodLighting).passed, false);
  for (const mode of ['torso', 'legs', 'cropped', 'dark', 'people'] as const) {
    const frame = rotatedPoseFrame(90);
    sideOcclusion(frame, 1);
    if (mode === 'torso') delete frame.landmarks.leftShoulder!.world;
    if (mode === 'legs') delete frame.landmarks.leftAnkle;
    if (mode === 'cropped') frame.landmarks.leftAnkle!.image.y = 1.1;
    if (mode === 'people') frame.personCount = 2;
    const lighting = mode === 'dark' ? { ...goodLighting, mean: 10 } : goodLighting;
    assert.equal(new QualityChecker().check(frame, lighting, undefined, { allowTurn: true }).passed, false, mode);
  }
});

test('persistent loss of torso, feet or camera frames still refuses a turn', () => {
  for (const mode of ['torso', 'feet', 'camera'] as const) {
    const { session, start } = readySession(1);
    const events: WorkerEvent[] = [];
    for (let dt = 100; dt <= 1400; dt += 100) {
      const frame = rotatedPoseFrame(Math.min(90, dt * 0.15), start + dt + (mode === 'camera' ? 1000 : 0));
      if (mode === 'torso') delete frame.landmarks.rightHip;
      if (mode === 'feet') { delete frame.landmarks.leftAnkle; delete frame.landmarks.rightAnkle; }
      events.push(...session.process(frame, goodLighting, 20));
    }
    assert.ok(events.some(e => e.type === 'score' && e.result.status === 'notScorable'), mode);
  }
});

test('jumping straight to final pose at start cue cannot replace observed intermediate motion', () => {
  const { session, start } = readySession(1);
  const events: WorkerEvent[] = [];
  for (let dt = 100; dt <= 4000; dt += 100) events.push(...session.process(rotatedPoseFrame(90, start + dt), goodLighting, 20));
  const score = events.find(e => e.type === 'score');
  assert.ok(score?.type === 'score' && score.result.status === 'notScorable');
  assert.match(score.result.reasons.join(' '), /trung gian/);
});

test('turn guidance shows dynamic phases and final hold instead of a static three-second hold', () => {
  const html = renderToStaticMarkup(React.createElement(PoseViewport, {
    videoRef: { current: null }, canvasRef: { current: null }, mirrored: true,
    stage: 'scoring', progress: 0.7, dynamicProgress: {
      phase: 'FINAL_HOLD', currentYawDeg: 90, targetYawDeg: 90, progressRatio: 0.7, message: 'Giữ ổn định: 0.5s',
    },
  }));
  assert.match(html, /Giữ ổn định: 0.5s/);
  assert.doesNotMatch(html, /3.0s/);
  const refusal = renderToStaticMarkup(React.createElement(ScoreResults, {
    result: { status: 'notScorable', reasons: ['Thiếu dữ liệu'] }, movementId: 'turnLeft',
  }));
  assert.match(refusal, /quay liên tục/);
  assert.doesNotMatch(refusal, /đứng yên không cử động/);
});

test('opposite-side turns fail both selected directions, get no target-angle points and render red', () => {
  for (const sign of [1, -1]) {
    const { session, start } = readySession(sign);
    const events: WorkerEvent[] = [];
    for (let dt = 100; dt <= 9000; dt += 100) {
      events.push(...session.process(rotatedPoseFrame(-sign * Math.min(90, dt * 0.15), start + dt), goodLighting, 20));
    }
    const score = events.find(e => e.type === 'score');
    assert.ok(score?.type === 'score' && score.result.status === 'scored');
    assert.equal(score.result.passed, false);
    assert.ok(score.result.total < 65);
    assert.equal(score.result.criteria.find(c => c.id === 'direction')?.points, 0);
    assert.equal(score.result.criteria.find(c => c.id === 'angle')?.points, 0);
    assert.ok(events.some(e => e.type === 'analysis' && e.snapshot.dynamicProgress?.message?.includes('Sai hướng')));
    const html = renderToStaticMarkup(React.createElement(ScoreResults, { result: score.result, movementId: sign > 0 ? 'turnLeft' : 'turnRight' }));
    assert.match(html, /Chưa đạt/);
    assert.match(html, score.result.assessment === 'incomplete' ? /CHƯA KẾT LUẬN TOÀN BÀI/ : /CHƯA ĐẠT/);
  }
});

test('walking receives a criterion deduction without overriding a qualifying total', () => {
  for (const sign of [1, -1]) for (const walking of [false, true]) {
    const { session, start } = readySession(sign);
    const events: WorkerEvent[] = [];
    for (let dt = 100; dt <= 4000; dt += 100) {
      const frame = rotatedPoseFrame(sign * Math.min(90, dt * 0.15), start + dt);
      // Smooth translation is coherent camera evidence, not a landmark spike.
      const step = walking ? Math.min(0.16, dt / 800 * 0.16) : 0;
      for (const p of Object.values(frame.landmarks)) p!.image.x += step;
      events.push(...session.process(frame, goodLighting, 20));
    }
    const score = events.find(e => e.type === 'score');
    assert.ok(score?.type === 'score' && score.result.status === 'scored');
    assert.equal(score.result.turnTechnique?.status, 'observed');
    assert.equal(score.result.passed, score.result.assessment !== 'incomplete' && score.result.total >= 65);
    assert.equal(score.result.turnTechnique?.passed, !walking);
    if (walking) {
      assert.ok(score.result.total < 100);
      assert.match(score.result.corrections.join(' '), /bước dịch chuyển/);
    } else assert.equal(score.result.total, 100);
  }
});

test('normal free-foot closing and one-frame tracking noise do not prove walking', () => {
  for (const direction of ['left', 'right'] as const) {
    const frames = Array.from({ length: 40 }, (_, i) => {
      const close = i < 10 ? 0 : 0.9;
      return { timestampMs: i * 100, bodyYawDeg: Math.min(90, Math.max(0, (i - 6) * 15)), confidence: 0.99, isReliable: true,
        imageRoot: { x: 0, y: 0 },
        leftHeelPosition: { x: direction === 'left' ? (i === 15 ? 1 : 0) : close, y: 1 },
        rightHeelPosition: { x: direction === 'right' ? (i === 15 ? 1 : 0) : close, y: 1 },
        leftToePosition: { x: close, y: 1 }, rightToePosition: { x: close, y: 1 } };
    });
    assert.equal(analyzeTurnTechnique(frames, direction, 500).passed, true);
  }
});

test('missing pivot evidence cannot earn an overall pass; unobserved final-foot data stays incomplete', () => {
  for (const sign of [1, -1]) for (const missingFeet of [false, true]) {
    const buffer = new TemporalMotionBuffer();
    for (let t = 0; t <= (missingFeet ? 4000 : 1700); t += 100) {
      buffer.push({ timestampMs: t, bodyYawDeg: sign * Math.min(90, Math.max(0, (t - 600) * 0.15)), confidence: 0.99, isReliable: true,
        torsoTilt: 0, shoulderTilt: 0, leftWristHipDistance: 0.4, rightWristHipDistance: 0.4,
        imageRoot: { x: 0, y: 0 },
        ...(missingFeet ? {} : { leftHeelPosition: { x: 0, y: 1 }, rightHeelPosition: { x: 0, y: 1 } }) });
    }
    const result = evaluateDynamicAttempt(sign > 0 ? turnLeftMovement : turnRightMovement, buffer);
    assert.ok(result.status === 'scored');
    assert.equal(result.passed, false);
    if (missingFeet) { assert.equal(result.assessment, 'incomplete'); assert.equal(result.total, 80); }
    else { assert.equal(result.assessment, 'incomplete'); assert.ok(result.criteria.some(c => c.statusLevel === 'NOT_SCORABLE')); }
    if (missingFeet) assert.equal(result.criteria.find(c => c.id === 'torso')?.statusLevel, 'NOT_SCORABLE');
  }
});
