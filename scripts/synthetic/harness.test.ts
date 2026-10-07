import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMERA, PROFILES, createSyntheticHuman, project, skeleton } from './model';
import { available, coreScenarios } from './scenarios';
import { runScenario } from './runner';
import { boundaryAudit, differentialAudit, isolationAudit } from './audits';

test('core suite has unique IDs, independent contracts and registry-derived coverage',()=>{
  const cases=coreScenarios();assert.equal(cases.length,160);assert.equal(new Set(cases.map(c=>c.testId)).size,cases.length);
  for(const movement of available)for(const fps of [5,8,10,12,15,20])assert.ok(cases.some(c=>c.movement===movement.id&&c.fps===fps));
  assert.equal(cases.filter(c=>c.testId.includes('noise-seed-')).length,20);
});
test('one world skeleton projects consistently into image landmarks for five bodies',()=>{
  for(let profile=0;profile<PROFILES.length;profile++)for(const yaw of [-90,0,90]){
    const camera={...CAMERA,pitch:4,roll:2,yaw:8}; const frame=createSyntheticHuman({yaw},100,{profile,camera,noise:.001});
    for(const p of Object.values(frame.landmarks)) {assert.deepEqual(p.image,project(p.world!,camera));assert.ok(p.image.x>0&&p.image.x<1&&p.image.y>0&&p.image.y<1);}
    const body=skeleton({},profile);assert.ok(body.leftAnkle!.y>body.leftKnee!.y&&body.leftKnee!.y>body.leftHip!.y);
  }
});
test('seeded frames are deterministic and presentation mirroring never swaps anatomy',()=>{
  const a=createSyntheticHuman({yaw:45},400,{seed:42,noise:.001});assert.deepEqual(a,createSyntheticHuman({yaw:45},400,{seed:42,noise:.001}));
  assert.deepEqual(a,createSyntheticHuman({yaw:45},400,{seed:42,noise:.001,camera:{...CAMERA,mirror:true}}));
  assert.notDeepEqual(a,createSyntheticHuman({yaw:45},400,{seed:43,noise:.001}));
});
test('hand has 21 points, synchronized wrist, and deliberate missing/crop anomalies',()=>{
  const f=createSyntheticHuman({salute:1},100);assert.equal(f.saluteHand!.image.length,21);
  const wrist=f.landmarks.rightWrist!.image;assert.deepEqual(f.saluteHand!.image[0],wrist);
  assert.equal(createSyntheticHuman({salute:1},100,{hand:{mode:'missing'}}).saluteHand,undefined);
  assert.equal(createSyntheticHuman({salute:1},100,{hand:{mode:'partial'}}).saluteHand!.image.length,18);
});
test('happy sequence freezes one result; duplicate/stale/backward transport frames cannot alter it',()=>{
  const cases=coreScenarios(),baseline=runScenario(cases.find(c=>c.testId==='salute-12fps')!);
  assert.equal(baseline.actual.result,'PASS');assert.equal(baseline.performance.finalizationCount,1);assert.equal(baseline.actual.frozen,true);
  for(const anomaly of ['duplicate','backwards','stale']) {const result=runScenario(cases.find(c=>c.anomaly===anomaly)!);
    assert.deepEqual(result.criteria,baseline.criteria);assert.equal(result.actual.score,baseline.actual.score);assert.ok(result.performance.framesRejected>0);}
});
test('per-session reset isolates A -> B and B -> A',()=>{assert.ok(isolationAudit().every(r=>r.match));});
test('boundary audit probes every rule; valid static bands satisfy endpoint and monotonic contracts',()=>{
  const results=boundaryAudit();assert.ok(results.length>20);
  for(const r of results.filter(r=>r.rangeValid)){assert.equal(r.monotonic,true);assert.ok(r.probes.every(p=>p.match));}
  assert.ok(differentialAudit().some(d=>d.delta>1)); // Projection differences are expected, not scoring errors.
});
