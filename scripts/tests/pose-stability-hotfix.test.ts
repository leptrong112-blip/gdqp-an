import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { PreparationReadiness } from '../../src/features/pose-analysis/runtime/commandFlow';
import { AdaptiveBudget } from '../../src/features/pose-analysis/runtime/frameScheduler';
import { FrameFreshnessGate } from '../../src/features/pose-analysis/runtime/frameFreshness';
import { VisualSkeleton } from '../../src/features/pose-analysis/rendering/visualSkeleton';
import { QualityChecker } from '../../src/features/pose-analysis/pipeline/qualityChecks';
import { createCalibration, normalizePose } from '../../src/features/pose-analysis/pipeline/normalization';
import { extractFeatures } from '../../src/features/pose-analysis/pipeline/featureExtraction';
import { attentionMovement } from '../../src/features/pose-analysis/scoring/attentionMovement';
import { atEaseMovement } from '../../src/features/pose-analysis/scoring/atEaseMovement';
import { POSE_CONFIG as C } from '../../src/features/pose-analysis/config';
import { attentionFrame, goodLighting } from './fixtures/pose/attention';
import { drillFrame } from './fixtures/pose/drill';
import type { CanonicalPoseFrame } from '../../src/features/pose-analysis/types';
import type { WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';

function preparation(interval = 100) {
  const p = new SessionProcessor(); let t=0;
  p.command('selectAtEase'); p.command('enablePreconditionScoring');
  const feed=(change?: (f:CanonicalPoseFrame)=>void, gap=0) => {
    t+=interval+gap; const f=drillFrame(p.expectedPostureId,t);change?.(f);
    return p.process(f,goodLighting,0).find((e):e is Extract<WorkerEvent,{type:'analysis'}>=>e.type==='analysis')!.snapshot;
  };
  for(let i=0;i<16;i++)feed();p.command('startCalibration');
  for(let i=0;i<100;i++) {const s=feed();if(s.stage==='precondition-scoring'&&s.progress>=.5)return {p,feed,start:s};}
  throw new Error('Preparation did not reach 50%');
}

test('A: two dropped core frames preserve valid preparation progress through warmup without accumulating bad time', () => {
  const h=preparation();
  for(let i=0;i<2;i++) {
    const s=h.feed(f=>{delete f.landmarks.leftAnkle;});
    assert.equal(s.progress,h.start.progress);assert.equal(s.stage,'precondition-scoring');
  }
  let recovered=false;
  for(let i=0;i<12;i++) {
    const s=h.feed();
    assert.notEqual(s.stage,'waiting-precondition');
    if(s.stage==='precondition-scoring')assert.ok(s.progress>=h.start.progress);
    if(s.progress>h.start.progress)recovered=true;
  }
  assert.ok(recovered);
});

test('A: missing wrist and rejected wrist spike never fabricate live arm features or reset preparation', () => {
  for(const fault of ['missing','spike']) {
    const h=preparation();const s=h.feed(f=>{
      if(fault==='missing')delete f.landmarks.leftWrist;
      else f.landmarks.leftWrist!.image.x+=.6;
    });
    assert.equal(s.stage,'precondition-scoring');assert.ok(s.progress>=h.start.progress);
    assert.equal(s.features?.leftWristHipDistance,undefined);
  }
});

test('A: small body sway is tolerated in acquisition only; grading stability remains unchanged', () => {
  for(const preparation of [true,false]) {
    const q=new QualityChecker();let s;
    for(let t=0;t<=3000;t+=100) {
      const f=attentionFrame(t);for(const p of Object.values(f.landmarks))p.image.x+=t%400<200?.02:0;
      s=q.check(f,goodLighting,undefined,{preparation});
    }
    assert.equal(s!.checks.find(c=>c.id==='stability')!.passed,preparation);
  }
});

test('A: sustained wrong posture, missing core body, wrong person count and real frame gaps reset preparation', () => {
  for(const fault of ['wrong','missing','people','gap']) {
    const h=preparation();let reset=false;
    for(let i=0;i<25;i++) {
      const s=h.feed(f=>{
        if(fault==='wrong')f.landmarks.leftKnee!.world!.z=.03;
        if(fault==='missing')delete f.landmarks.leftAnkle;
        if(fault==='people')f.personCount=2;
      },fault==='gap'?600:0);
      if(s.stage==='waiting-precondition'&&s.progress===0)reset=true;
    }
    assert.ok(reset,fault);
  }
});

const profile=createCalibration(Array.from({length:12},()=>attentionFrame()))!;
function knees(t:number,bend:number) {
  const s=extractFeatures(normalizePose(attentionFrame(t),profile)!);
  s.values.leftKneeAngle!.value=bend;s.values.rightKneeAngle!.value=180;
  s.values.minKneeAngle!.value=bend;s.values.maxKneeAngle!.value=180;s.values.kneeAngleDiff!.value=180-bend;
  return s;
}

test('B: boundary oscillation is temporally confirmed rather than READY/WRONG every frame', () => {
  for(const first of [176,177]) {
    const tracker=new PreparationReadiness();const statuses=[];
    for(let t=0;t<=3000;t+=100)statuses.push(tracker.update(knees(t,t%200?353-first:first),atEaseMovement));
    const flips=statuses.slice(1).filter((v,i)=>v!==statuses[i]).length;
    assert.ok(flips<=2,`first=${first}, flips=${flips}`);
    assert.equal(statuses.at(-1),'READY');
  }
});

test('B: stable real posture changes are recognized, and missing current evidence immediately invalidates readiness', () => {
  for(const definition of [attentionMovement,atEaseMovement]) {
    const tracker=new PreparationReadiness();
    for(let t=0;t<1000;t+=100)tracker.update(knees(t,180),definition);
    let resting;
    for(let t=1000;t<2200;t+=100)resting=tracker.update(knees(t,160),definition);
    assert.equal(resting,definition.id==='atEase'?'READY':'WRONG_PRECONDITION');
    let straight;
    for(let t=2200;t<3400;t+=100)straight=tracker.update(knees(t,180),definition);
    assert.equal(straight,definition.id==='attention'?'READY':'WRONG_PRECONDITION');
    const missing=knees(3500,160);delete missing.values.minKneeAngle;
    assert.equal(tracker.update(missing,definition),'INSUFFICIENT_EVIDENCE');
    assert.equal(tracker.update(undefined,definition),'INSUFFICIENT_EVIDENCE');
  }
});

test('C: adaptive floor and regular 260 ms observations fit bounded evidence and display freshness', () => {
  const b=new AdaptiveBudget();b.setPhase('scoring','salute');
  for(let t=0;t<5000;t+=100)b.observe(240,t);
  assert.equal(b.fps,C.minimumInferenceFps);assert.equal(b.fps,5);
  assert.ok(1000/b.fps+50<C.maximumFrameGapMs);
  const h=preparation(260);assert.ok(h.start.progress>=.5);
  const visual=new VisualSkeleton(),f=attentionFrame(1000);
  assert.ok(visual.frame(f,1260));
  assert.ok(visual.frame(attentionFrame(1260),1520));
  assert.equal(visual.frame(f,1000+C.visualFreshnessMs+1),null);
});

test('C: duplicates, backwards, stale and future captures are still rejected', () => {
  const gate=new FrameFreshnessGate();assert.equal(gate.accept(1000,1000,1000),true);
  assert.equal(gate.accept(1000,1000,1000),false);assert.equal(gate.accept(900,1000,1000),false);
  assert.equal(gate.accept(1260,1000,1260),false);assert.equal(gate.accept(1260,1400,1260),false);
  assert.equal(gate.accept(1260,1260,1260),true);
});

test('D: crop, unreliable feet, other joints, lighting and people have distinct actionable diagnostics', () => {
  for(const fault of ['crop','heel','toe','joint','dark','people']) {
    const f=attentionFrame();
    if(fault==='crop')f.landmarks.leftFootIndex!.image.y=1.1;
    if(fault==='heel')delete f.landmarks.leftHeel;
    if(fault==='toe')delete f.landmarks.rightFootIndex;
    if(fault==='joint')delete f.landmarks.leftKnee;
    if(fault==='people')f.personCount=2;
    const q=new QualityChecker().check(f,fault==='dark'?{...goodLighting,mean:10}:goodLighting);
    const reason=q.reasons.join(' ');assert.equal(q.passed,false);
    if(fault==='crop')assert.match(reason,/Lùi ra/);
    if(['heel','toe'].includes(fault)) {assert.match(reason,/chưa nhận rõ bàn chân/);assert.doesNotMatch(reason,/Lùi ra/);}
    if(fault==='joint') {assert.match(reason,/chưa nhận rõ các khớp/);assert.doesNotMatch(reason,/Lùi ra/);}
    if(fault==='dark')assert.match(reason,/ánh sáng phía trước/);
    if(fault==='people')assert.match(reason,/một người/);
  }
});
