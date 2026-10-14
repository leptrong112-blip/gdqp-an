import test from 'node:test';
import assert from 'node:assert/strict';
import { postureReadiness } from '../../src/features/pose-analysis/runtime/commandFlow';
import { attentionMovement } from '../../src/features/pose-analysis/scoring/attentionMovement';
import { createCalibration, normalizePose } from '../../src/features/pose-analysis/pipeline/normalization';
import { extractFeatures } from '../../src/features/pose-analysis/pipeline/featureExtraction';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { SaluteSequenceTracker } from '../../src/features/pose-analysis/pipeline/saluteSequence';
import { attentionFrame, goodLighting } from './fixtures/pose/attention';
import { drillFrame, saluteMotionFrame } from './fixtures/pose/drill';
import { waitForPoseCommand } from './fixtures/pose/session';
import type { WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';

const profile=createCalibration(Array.from({length:12},()=>attentionFrame()))!;
test('112420 video: mildly flexed bilateral estimates must not prove a resting stance; arms remain down',()=>{
  // Values transcribed from the diagnostic HUD, not invented raw 3D landmarks.
  for(const [left,right] of [[154.1,158.7],[157.8,161.3]]) {
    const s=extractFeatures(normalizePose(attentionFrame(),profile)!);
    for(const [key,value] of Object.entries({leftKneeAngle:left,rightKneeAngle:right,minKneeAngle:Math.min(left,right),maxKneeAngle:Math.max(left,right),kneeAngleDiff:Math.abs(left-right)}))
      s.values[key as keyof typeof s.values]={value,confidence:.97};
    const before=JSON.stringify(s);
    assert.equal(postureReadiness(s,attentionMovement,{allowUnobservedArms:true}),'READY');
    assert.equal(JSON.stringify(s),before,'readiness must never rewrite grading evidence');
  }
  const resting=extractFeatures(normalizePose(drillFrame('atEase',0),profile)!);
  assert.equal(postureReadiness(resting,attentionMovement,{allowUnobservedArms:true}),'WRONG_PRECONDITION');
  const bent=extractFeatures(normalizePose(attentionFrame(),profile)!);
  bent.values.leftKneeAngle!.value=bent.values.rightKneeAngle!.value=140;
  bent.values.minKneeAngle!.value=bent.values.maxKneeAngle!.value=140;bent.values.kneeAngleDiff!.value=0;
  assert.equal(postureReadiness(bent,attentionMovement,{allowUnobservedArms:true}),'WRONG_PRECONDITION');
  const raised=extractFeatures(normalizePose(drillFrame('salute',0),profile)!);
  assert.equal(postureReadiness(raised,attentionMovement,{allowUnobservedArms:true}),'WRONG_PRECONDITION');
});

test('video-shaped bilateral depth estimates reach the first cue with both arms at the thighs',()=>{
  // Synthetic 3D geometry matching the HUD angles; this is not a recovered
  // camera capture. Image coordinates/arms are deliberately unchanged.
  for(const select of ['selectSalute','selectAtEase','selectTurnLeft','selectTurnRight'] as const) {
    for(const fps of [5,8]) {
      const p=new SessionProcessor();p.command(select);p.command('startCalibration');
      let cue=false;
      for(let i=0;i<fps*20&&!cue;i++){
        const frame=attentionFrame(i*1000/fps);
        for(const [side,degrees] of [['left',154.1],['right',158.7]] as const){
          const hip=frame.landmarks[`${side}Hip`]!.world!,knee=frame.landmarks[`${side}Knee`]!.world!;
          knee.z=Math.hypot(knee.x-hip.x,knee.y-hip.y)/Math.tan(degrees*Math.PI/360);
        }
        cue=p.process(frame,goodLighting,100).some(e=>e.type==='commandCue');
      }
      assert.equal(cue,true,`${select} at ${fps} FPS`);
    }
  }
});

function interruptedSalute(gaps:number[],firstGapAt=300, duration=1800) {
  const p=new SessionProcessor();p.command('selectSalute');
  const cue=waitForPoseCommand(p),events:WorkerEvent[]=[];
  let t=cue+100,used=0;
  while(t<cue+18000&&!p.isFinalized){
    if(t>=cue+firstGapAt&&used<gaps.length)t+=gaps[used++];
    events.push(...p.process(saluteMotionFrame(t,cue,duration),goodLighting,100));t+=100;
  }
  return {events,result:events.find(e=>e.type==='score')};
}
test('salute pauses a single 450 ms frame gap and finishes the first observed raise',()=>{
  const h=interruptedSalute([350]);
  assert.ok(h.result?.type==='score'&&h.result.result.status==='scored',JSON.stringify(h.result));
  assert.equal(h.result.result.saluteSequence?.motionObserved,true);
  assert.equal(h.events.filter(e=>e.type==='score').length,1);
});
test('salute scoring reacquires a fresh hold after a delayed frame without asking for another raise',()=>{
  const h=interruptedSalute([600],4200);
  assert.ok(h.result?.type==='score'&&h.result.result.status==='scored',JSON.stringify(h.result));
  assert.equal(h.result.result.saluteSequence?.motionObserved,true);
});
test('long or repeatedly discontinuous capture still ends without a fabricated grade',()=>{
  for(const gaps of [[1600],[350,350,350,350,350]]){
    const h=interruptedSalute(gaps);
    assert.ok(h.result?.type==='score'&&h.result.result.status==='notScorable');
  }
});
test('a missing entire raise cannot be replaced by the final salute pose after recovery',()=>{
  const h=interruptedSalute([800],100,450);
  assert.ok(h.result?.type==='score'&&h.result.result.status==='notScorable');
  assert.equal(h.result.result.saluteSequence?.motionObserved,false);
});
test('salute cannot join two isolated intermediate points across a pause into a trajectory',()=>{
  const tracker=new SaluteSequenceTracker();tracker.begin(attentionFrame(0));
  const a=saluteMotionFrame(200,0,1000),b=saluteMotionFrame(600,0,1000);
  a.landmarks.rightWrist!.image.y=.55-.3*.22;
  b.landmarks.rightWrist!.image.y=.55-.7*.22;
  tracker.update(a,extractFeatures(normalizePose(a,profile)!),false);
  tracker.interrupt();
  tracker.update(b,extractFeatures(normalizePose(b,profile)!),false);
  assert.equal(tracker.snapshot.motionObserved,false);
});
