import test from 'node:test';
import assert from 'node:assert/strict';
import { AdaptiveBudget, startFrameScheduler } from '../../src/features/pose-analysis/runtime/frameScheduler';
import { VisualSkeleton } from '../../src/features/pose-analysis/rendering/visualSkeleton';
import { PreparationReadiness } from '../../src/features/pose-analysis/runtime/commandFlow';
import { attentionMovement } from '../../src/features/pose-analysis/scoring/attentionMovement';
import { createCalibration, normalizePose } from '../../src/features/pose-analysis/pipeline/normalization';
import { extractFeatures } from '../../src/features/pose-analysis/pipeline/featureExtraction';
import { attentionFrame } from './fixtures/pose/attention';
import { stablePreparationHold, stableStaticHold } from '../../src/features/pose-analysis/pipeline/staticHold';

test('30 FPS camera timestamps do not halve inference cadence due to rounding', async () => {
  const original=Object.getOwnPropertyDescriptor(globalThis,'performance');
  let now=0, callback:()=>void=()=>{};
  const submitted:number[]=[];
  Object.defineProperty(globalThis,'performance',{configurable:true,value:{now:()=>now}});
  const video={currentTime:0,readyState:2,requestVideoFrameCallback(fn:()=>void){callback=fn;return 1;},cancelVideoFrameCallback(){}} as unknown as HTMLVideoElement;
  const stop=startFrameScheduler(video,new AdaptiveBudget(),async timestamp=>{submitted.push(timestamp);},message=>assert.fail(message));
  try {
    for(let i=0;i<90;i++) {
      now=Math.round(i*1000/30);video.currentTime=i/30;callback();
      await Promise.resolve();await Promise.resolve();await Promise.resolve();
    }
    assert.equal(submitted.length,90);
    assert.equal(new Set(submitted).size,90);
  } finally {stop();if(original)Object.defineProperty(globalThis,'performance',original);}
});

test('all preparation/action phases retain throughput and slow devices recover without queues', () => {
  const budget=new AdaptiveBudget();
  for(const movement of ['attention','atEase','turnLeft','turnRight','salute','basicDrill']) {
    for(const phase of ['quality-check','waiting-precondition','countdown','transition','scoring'] as const) {
      budget.setPhase(phase,movement);budget.observe(20);assert.equal(budget.fps,30);
    }
  }
  for(let i=0;i<8;i++)budget.observe(150,i*200);
  assert.equal(budget.profile,'LOW');assert.equal(budget.fps,5);
  budget.setPhase('waiting-precondition','attention');assert.equal(budget.fps,5);
  for(let i=0;i<130;i++)budget.observe(20,2000+i*100);
  assert.equal(budget.fps,30);
  const fallback=new AdaptiveBudget(true);
  for(let i=0;i<100;i++)fallback.observe(20,i*100);
  assert.ok(fallback.fps<=15,'main-thread inference preserves UI headroom');
});

test('moving joints follow the latest observation on first paint; tiny jitter is eased without mutation', () => {
  const visual=new VisualSkeleton(),first=attentionFrame(1000);
  visual.frame(first,1000);
  const jitter=attentionFrame(1033);jitter.landmarks.rightWrist!.image.y+=.002;
  const shown=visual.frame(jitter,1033)!;
  assert.ok(shown.landmarks.rightWrist!.image.y>first.landmarks.rightWrist!.image.y);
  assert.ok(shown.landmarks.rightWrist!.image.y<jitter.landmarks.rightWrist!.image.y);
  const moved=attentionFrame(1066);moved.landmarks.rightWrist!.image.y-=.2;
  const before=JSON.stringify(moved);
  assert.deepEqual(visual.frame(moved,1066)!.landmarks.rightWrist!.image,moved.landmarks.rightWrist!.image);
  assert.equal(JSON.stringify(moved),before);
  delete moved.landmarks.rightWrist;
  assert.equal(visual.frame(moved,1080)!.landmarks.rightWrist,undefined);
});

test('attention identity ignores isolated arm-estimation spikes but rejects sustained raised/bent arms', () => {
  const profile=createCalibration(Array.from({length:12},()=>attentionFrame()))!;
  const tracker=new PreparationReadiness();
  const sample=(t:number,bad:boolean)=>{
    const s=extractFeatures(normalizePose(attentionFrame(t),profile)!);
    // A natural straight-arm estimate near the ideal boundary, with isolated
    // erroneous 3D bends. The raw sample is deliberately retained for scoring.
    s.values.leftElbowAngle!.value=bad?30:155;
    s.values.rightElbowAngle!.value=bad?30:155;
    return s;
  };
  for(let i=0;i<100;i++) {
    const s=sample(i*1000/30,i>15&&i%5===0),before=JSON.stringify(s);
    assert.equal(tracker.update(s,attentionMovement),'READY');
    assert.equal(JSON.stringify(s),before);
  }
  for(let i=100;i<140;i++)tracker.update(sample(i*1000/30,true),attentionMovement);
  assert.equal(tracker.update(sample(4700,true),attentionMovement),'WRONG_PRECONDITION');
  const missing=sample(4800,false);delete missing.values.leftKneeAngle;
  assert.equal(tracker.update(missing,attentionMovement),'INSUFFICIENT_EVIDENCE');
});

test('preparation tolerates elbow-depth variation only; grading and real wrist/body motion remain strict', () => {
  const profile=createCalibration(Array.from({length:12},()=>attentionFrame()))!;
  const samples=Array.from({length:24},(_,i)=>{
    const s=extractFeatures(normalizePose(attentionFrame(i*1000/30),profile)!);
    s.values.leftElbowAngle!.value=i%2?150:180;
    s.values.rightElbowAngle!.value=i%2?150:180;
    return s;
  });
  assert.equal(stablePreparationHold(samples),true);
  assert.equal(stableStaticHold(samples),false,'the scored hold still requires arm stability');
  for(const [key,spread] of [['rightWristHipDistance',.4],['torsoTilt',15],['leftKneeAngle',25]] as const) {
    const moving=structuredClone(samples);
    moving.forEach((s,i)=>{s.values[key]!.value+=i%2?spread:0;});
    assert.equal(stablePreparationHold(moving),false,key);
  }
});
