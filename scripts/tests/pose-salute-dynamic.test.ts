import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { AdaptiveBudget, startFrameScheduler } from '../../src/features/pose-analysis/runtime/frameScheduler';
import { FrameFreshnessGate } from '../../src/features/pose-analysis/runtime/frameFreshness';
import { VisualSkeleton } from '../../src/features/pose-analysis/rendering/visualSkeleton';
import { handFeatures, handSharpness, saluteHandMetrics } from '../../src/features/pose-analysis/pipeline/saluteHand';
import { RuntimePerformance } from '../../src/features/pose-analysis/diagnostics/runtimePerformance';
import { SaluteHandDetector } from '../../src/features/pose-analysis/runtime/SaluteHandDetector';
import { SaluteSequenceSummary } from '../../src/features/pose-analysis/components/SaluteSequenceSummary';
import { PoseDiagnosticOverlay } from '../../src/features/pose-analysis/components/PoseDiagnosticOverlay';
import { drillFrame, saluteMotionFrame } from './fixtures/pose/drill';
import { attentionFrame, goodLighting } from './fixtures/pose/attention';
import type { CanonicalPoseFrame, AnalysisSnapshot } from '../../src/features/pose-analysis/types';
import type { WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';

function runSalute(fps = 10, duration = 1000, mode: 'raise' | 'jump' | 'missingHand' | 'lowConfidence' = 'raise', change?: (frame:CanonicalPoseFrame, cue:number|undefined) => void) {
  const step = 1000 / fps, p = new SessionProcessor(), events: WorkerEvent[] = [];
  const handRequests: { t: number; active: boolean; stage?: string }[] = [];
  let cue: number | undefined, scoringAt: number | undefined, snapshot: AnalysisSnapshot | undefined;
  p.command('selectSalute');
  const feed = (t: number) => {
    const frame = cue === undefined ? attentionFrame(t) : mode === 'jump' ? drillFrame('salute', t) : saluteMotionFrame(t, cue, duration);
    if (mode === 'missingHand') delete frame.saluteHand;
    if (mode === 'lowConfidence' && frame.saluteHand) frame.saluteHand.confidence = .1;
    change?.(frame, cue);
    handRequests.push({ t, active: p.needsHandTracking, stage: snapshot?.stage });
    const next = p.process(frame, goodLighting, 15);
    if (next.some(e => e.type === 'commandCue' && e.command === 'CHÀO')) cue = t;
    const analysis = next.find(e => e.type === 'analysis');
    if (analysis?.type === 'analysis') { snapshot = analysis.snapshot; if (snapshot.stage === 'scoring') scoringAt ??= t; }
    events.push(...next);
  };
  let t = 0;
  for (; t <= 1500; t += step) feed(t);
  p.command('startCalibration');
  for (; t < 30000 && !p.isFinalized; t += step) feed(t);
  const result = events.find(e => e.type === 'score');
  return { p, events, cue, scoringAt, result: result?.type === 'score' ? result.result : undefined, handRequests, snapshot };
}

for (const droppedWrist of [false, true]) test(`first salute raise survives body settling after command, wrist dropout=${droppedWrist}`, () => {
  const h = runSalute(12, 900, 'raise', (frame, cue) => {
    if (cue === undefined) return;
    // Small relocation while raising once, then hold that final position.
    for (const point of Object.values(frame.landmarks)) { point.image.x += .025; if (point.world) point.world.x += .025 * frame.aspectRatio; }
    frame.saluteHand?.image.forEach(point => { point.x += .025; });
    if (droppedWrist && frame.timestampMs - cue >= 250 && frame.timestampMs - cue < 335) delete frame.landmarks.rightWrist;
  });
  assert.ok(h.result?.status === 'scored', JSON.stringify(h.result));
  assert.equal(h.result.total, 100);
  assert.equal(h.result.saluteSequence?.motionObserved, true);
  assert.equal(h.events.filter(e => e.type === 'commandCue' && e.command === 'CHÀO').length, 1);
  assert.equal(h.events.filter(e => e.type === 'score').length, 1);
});

for (const fps of [8, 12, 20]) for (const duration of [900, 1800, 2800]) {
  test(`salute observes attention → raise → stable → hold once at ${fps} FPS, ${duration} ms raise`, () => {
    const h = runSalute(fps, duration);
    assert.ok(h.result?.status === 'scored', JSON.stringify(h.result));
    assert.equal(h.result.total, 100);
    assert.ok(h.result.saluteSequence?.motionObserved);
    assert.ok(h.scoringAt! - h.cue! >= duration + 600, 'acquisition/transition not counted as final pose');
    assert.equal(h.events.filter(e => e.type === 'score').length, 1);
    const stop = h.events.findIndex(e => e.type === 'commandCue' && e.command === 'THÔI');
    assert.ok(stop >= 0 && h.events[stop + 1].type === 'score');
    assert.equal(h.p.needsHandTracking, false);
    assert.ok(h.handRequests.every(r => !r.active || ['transition','scoring'].includes(r.stage ?? '')));
    assert.deepEqual(h.p.process(attentionFrame(40000), goodLighting, 0), []);
    assert.ok(Object.isFrozen(h.result));
  });
}

test('already saluting cannot meet attention precondition; an abrupt final pose supplies no transition evidence', () => {
  const p = new SessionProcessor(); p.command('selectSalute');
  for (let t = 0; t <= 1500; t += 100) p.process(drillFrame('salute',t), goodLighting, 0);
  p.command('startCalibration');
  const events = Array.from({ length: 120 }, (_, i) => p.process(drillFrame('salute',1600+i*100),goodLighting,0)).flat();
  assert.equal(events.some(e => e.type === 'commandCue' && e.command === 'CHÀO'), false);
  const h = runSalute(10,1000,'jump');
  assert.ok(h.result?.status === 'notScorable');
  assert.equal(h.result.saluteSequence?.motionObserved, false);
  assert.equal(h.scoringAt, undefined);
});

test('very slow but continuous 5 FPS camera waits for actual sample count before finalizing salute', () => {
  const h=runSalute(5,1800);
  assert.ok(h.result?.status==='scored',JSON.stringify(h.result));
  assert.equal(h.result.total,100);
});

for (const mode of ['missingHand','lowConfidence'] as const) test(`${mode} does not convert valid body salute to hand pose error`, () => {
  const h = runSalute(8,1800,mode);
  assert.ok(h.result?.status === 'scored', JSON.stringify(h.result));
  assert.equal(h.result.total, 90);
  const hand = h.result.criteria.find(c => c.id === 'saluteHand')!;
  assert.equal(hand.statusLevel, 'NOT_SCORABLE'); assert.deepEqual(hand.mistakes, []);
  assert.equal(h.result.assessment, 'incomplete');
  const html = renderToStaticMarkup(React.createElement(SaluteSequenceSummary,{result:h.result}));
  assert.match(html,/chưa đủ dữ liệu để đánh giá/); assert.match(html,/không kết luận tay sai/);
});

test('hand quality separates small, clipped, low-confidence, unstable identity, blur and stale/future samples', () => {
  for (const issue of ['small','clipped','confidence','identity','blur','stale','future','missing'] as const) {
    const frame = drillFrame('salute',1000), hand = frame.saluteHand!;
    if (issue === 'small') hand.sourceWidth = hand.sourceHeight = 20;
    if (issue === 'clipped') hand.image[8].x = -1;
    if (issue === 'confidence') hand.confidence = .1;
    if (issue === 'identity') hand.identityStable = false;
    if (issue === 'blur') hand.sharpness = 0;
    if (issue === 'stale') hand.timestampMs = 500;
    if (issue === 'future') hand.timestampMs = 1500;
    if (issue === 'missing') hand.image.pop();
    assert.equal(handFeatures(frame).quality, 'INSUFFICIENT_HAND_EVIDENCE', issue);
    assert.equal(saluteHandMetrics(frame), undefined, issue);
  }
  const observed = drillFrame('salute',1000), features = handFeatures(observed);
  assert.equal(features.available, true);
  assert.equal(features.fingerExtension?.length,4);
  assert.ok(features.palmOrientation && features.wristOrientation);
  observed.saluteHand!.timestampMs = 925;
  assert.equal(handFeatures(observed).available, true, 'near sample may display/describe');
  assert.equal(saluteHandMetrics(observed), undefined, 'cached sample cannot duplicate official scoring evidence');
  assert.equal(handSharpness(new Uint8Array(10*10*4).fill(100),10,10),0);
});

test('ROI hand detector does no work for other poses, decimates costly frames, and rejects flickering handedness', () => {
  const original=Object.getOwnPropertyDescriptor(globalThis,'OffscreenCanvas');
  let calls=0, label='Right', crop={x:0,y:0,size:1}, current=drillFrame('salute',1000);
  class Canvas {
    constructor(public width:number,public height:number) {}
    getContext() { return { drawImage(_source:unknown,x:number,y:number,size:number) {crop={x,y,size};},
      getImageData(_x:number,_y:number,width:number,height:number) {
        const data=new Uint8Array(width*height*4);
        for(let y=0;y<height;y++) for(let x=0;x<width;x++) data.fill((x+y)%2?200:30,(y*width+x)*4,(y*width+x+1)*4);
        return {data};
      }}; }
  }
  Object.defineProperty(globalThis,'OffscreenCanvas',{configurable:true,value:Canvas});
  const detector=new SaluteHandDetector();
  const internals=detector as unknown as {state:string;model:unknown};
  internals.state='ready'; internals.model={detect() {calls++; return {
    landmarks:[current.saluteHand!.image.map(p=>({x:(p.x*960-crop.x)/crop.size,y:(p.y*720-crop.y)/crop.size,z:0}))],
    worldLandmarks:[current.saluteHand!.world], handedness:[[{categoryName:label,score:.99}]],
  };},close(){}};
  try {
    detector.detect({} as TexImageSource,current,960,720,false); assert.equal(calls,0);
    detector.detect({} as TexImageSource,attentionFrame(1050),960,720,true); assert.equal(calls,0);
    current=drillFrame('salute',1100);
    assert.equal(detector.detect({} as TexImageSource,current,960,720,true).saluteHand,undefined);
    current=drillFrame('salute',1200);
    assert.ok(detector.detect({} as TexImageSource,current,960,720,true).saluteHand);
    current=drillFrame('salute',1210);
    detector.detect({} as TexImageSource,current,960,720,true,150); assert.equal(calls,2);
    label='Left'; current=drillFrame('salute',1500);
    const changed=detector.detect({} as TexImageSource,current,960,720,true);
    assert.equal(changed.saluteHand,undefined); assert.equal(handFeatures(changed).quality,'INSUFFICIENT_HAND_EVIDENCE');
    assert.match(handFeatures(changed).reason!,/bên tay/);
    detector.detect({} as TexImageSource,current,960,720,false); assert.equal(calls,3);
  } finally {detector.dispose(); if(original) Object.defineProperty(globalThis,'OffscreenCanvas',original); else Reflect.deleteProperty(globalThis,'OffscreenCanvas');}
});

test('worker input guard drops stale, future, duplicate and backwards timestamps', () => {
  const guard = new FrameFreshnessGate();
  assert.equal(guard.accept(100,1000,1050),true);
  for (const [t,c] of [[100,1000],[99,1000],[101,500],[102,2000],[NaN,1000]]) assert.equal(guard.accept(t,c,1050),false);
  assert.equal(guard.accept(103,1040,1050),true);
  guard.reset(); assert.equal(guard.accept(1,1050,1050),true);
});

test('latest-frame scheduler stays single-in-flight and analyzes the current frame, never queued busy frames', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis,'performance');
  let now = 0, callback: (time:number, metadata?: VideoFrameCallbackMetadata) => void = () => {}, resolve: () => void = () => {};
  const times: number[] = [], stats: { submitted: number; dropped: number; droppedRatio: number }[] = [];
  Object.defineProperty(globalThis,'performance',{configurable:true,value:{now:()=>now}});
  const video = { currentTime:0, readyState:2, requestVideoFrameCallback(fn:typeof callback) { callback=fn; return 1; }, cancelVideoFrameCallback() {} } as unknown as HTMLVideoElement;
  const stop = startFrameScheduler(video,new AdaptiveBudget(), async () => { times.push(video.currentTime); await new Promise<void>(done=>{resolve=done;}); }, message=>assert.fail(message), stat=>stats.push(stat));
  try {
    callback(now);
    for (const t of [100,200,300]) { now=t; video.currentTime=t/1000; callback(now); }
    assert.deepEqual(times,[0]);
    resolve(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    now=400; video.currentTime=.4; callback(now);
    assert.deepEqual(times,[0,.4]);
    assert.equal(stats.at(-1)!.dropped,3);
    assert.equal(stats.at(-1)!.submitted,2);
    resolve(); await Promise.resolve();
  } finally { stop(); if(original) Object.defineProperty(globalThis,'performance',original); }
});

test('adaptive phase budgets decrease quickly and recover slowly without oscillating', () => {
  const budget = new AdaptiveBudget(); budget.setPhase('transition','salute');
  for(let i=0;i<4;i++) budget.observe(140,i*100);
  assert.equal(budget.profile,'LOW'); assert.ok(budget.fps<=8);
  for(let i=0;i<40;i++) budget.observe(i%2?50:40,500+i*50);
  assert.equal(budget.profile,'LOW');
  for(let i=0;i<150;i++) budget.observe(25,3000+i*100);
  assert.equal(budget.profile,'FAST'); assert.equal(budget.fps,20);
  budget.setPhase('countdown','salute'); assert.equal(budget.fps,12);
  budget.setPhase('waiting-precondition','salute'); assert.equal(budget.fps,10);
  budget.setPhase('scoring','salute'); assert.equal(budget.fps,15);
  budget.setPhase('quality-check','attention'); assert.equal(budget.fps,15);
});

test('display interpolation uses independent copies, omits missing joints, expires stale skeleton and cannot modify scoring input', () => {
  const renderer = new VisualSkeleton(), first = attentionFrame(1000), next = drillFrame('salute',1100);
  const before = JSON.stringify(next);
  renderer.frame(first,1000);
  const display = renderer.frame(next,1101)!;
  assert.notEqual(display.landmarks.rightWrist!.image.y,next.landmarks.rightWrist!.image.y);
  assert.equal(JSON.stringify(next),before);
  delete next.landmarks.rightWrist;
  assert.equal(renderer.frame(next,1120)?.landmarks.rightWrist,undefined);
  // Updated bounded display contract includes inference latency at the 5 Hz floor.
  assert.ok(renderer.frame(next,1400));
  assert.equal(renderer.frame(next,1601),null);
});

test('bounded runtime benchmark records real timing samples and HUD exposes phase, hand and latency measurements', () => {
  const perf = new RuntimePerformance();
  for(let i=1;i<=140;i++) perf.observe({poseMs:i,handMs:0,workerLatencyMs:2});
  const summary=perf.summary()!;
  assert.equal(summary.pose!.samples,120); assert.equal(summary.pose!.p90Ms,128); assert.equal(summary.hand,undefined);
  const h=runSalute();
  h.snapshot!.performance={benchmark:summary,profile:'LOW',targetFps:8,droppedFrameRatio:.3};
  const html=renderToStaticMarkup(React.createElement(PoseDiagnosticOverlay,{snapshot:h.snapshot,stage:'scoring',movementId:'salute',onClose(){}}));
  for(const term of ['p90','STATE','Hand FPS','Valid','Landmark age','Skipped camera frames']) assert.ok(html.includes(term),term);
});
