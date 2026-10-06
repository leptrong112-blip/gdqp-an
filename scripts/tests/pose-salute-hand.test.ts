import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { drillFrame } from './fixtures/pose/drill';
import { attentionFrame } from './fixtures/pose/attention';
import { matchSaluteHand, raisedSaluteWrist, saluteHandMetrics } from '../../src/features/pose-analysis/pipeline/saluteHand';
import { scoreSaluteHand } from '../../src/features/pose-analysis/scoring/saluteHandScoring';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { ScoreResults } from '../../src/features/pose-analysis/components/ScoreResults';
import type { FeatureSample, SaluteHandMetrics } from '../../src/features/pose-analysis/types';

const good: SaluteHandMetrics = { extension:175,spread:5,thumbGap:.2,wristBend:10,tipHeadDistance:.2 };
const samples = (metrics: SaluteHandMetrics | undefined = good): FeatureSample[] => Array.from({length:16},(_,i)=>({timestampMs:i*125,values:{},saluteHand:metrics ? {...metrics} : undefined}));
test('resting hands at the thighs are not analyzed; anatomical matching survives mirror display',()=>{
  assert.equal(raisedSaluteWrist(attentionFrame()),false);
  for (const mirrored of [false,true]) {
    const f=drillFrame('salute',1000), hand=f.saluteHand!;
    if (mirrored) { Object.values(f.landmarks).forEach(p=>p!.image.x=1-p!.image.x); hand.image.forEach(p=>p.x=1-p.x); }
    assert.ok(raisedSaluteWrist(f));
    assert.ok(matchSaluteHand(f,[hand.image],[hand.world],960,720));
    const metrics=saluteHandMetrics(f)!;
    assert.ok(metrics);
    assert.ok(metrics.extension>170 && metrics.spread<1 && metrics.wristBend<20);
    assert.equal(scoreSaluteHand(samples(metrics)).points,10);
  }
});
test('left-hand proximity, duplicate candidates, tiny images and clipped fingers are not guessed',()=>{
  for (const kind of ['left','duplicate','tiny','clipped']) {
    const f=drillFrame('salute',1000), h=f.saluteHand!;
    if (kind==='left') f.landmarks.leftWrist!.image={...f.landmarks.rightWrist!.image};
    if (kind==='tiny') h.image=h.image.map(p=>({x:h.image[0].x+(p.x-h.image[0].x)*.05,y:h.image[0].y+(p.y-h.image[0].y)*.05,z:0}));
    if (kind==='clipped') h.image[8].x=-.01;
    assert.equal(matchSaluteHand(f,kind==='duplicate'?[h.image,h.image]:[h.image],kind==='duplicate'?[h.world,h.world]:[h.world],960,720),undefined);
  }
});
test('cached or malformed hand frames never add scoring evidence',()=>{
  const f=drillFrame('salute',1000); f.saluteHand!.timestampMs=875;
  assert.equal(saluteHandMetrics(f),undefined);
  f.saluteHand!.timestampMs=1000; f.saluteHand!.world[8].x=NaN;
  assert.equal(saluteHandMetrics(f),undefined);
});
test('missing, fleeting, gapped or unstable hand data remains unassessed',()=>{
  for (const data of [samples().map(s=>({...s,saluteHand:undefined})),samples().slice(0,3),samples().filter((_,i)=>i%4===0),samples().map((s,i)=>({...s,saluteHand:{...good,extension:i%2?170:80}}))]) {
    const score=scoreSaluteHand(data);
    assert.equal(score.statusLevel,'NOT_SCORABLE'); assert.deepEqual(score.mistakes,[]);
  }
});
test('observed curled fingers, spread fingers, open thumb and bent wrist lose their own points',()=>{
  for (const [key,value] of Object.entries({extension:90,spread:50,thumbGap:1.5,wristBend:80,tipHeadDistance:1})) {
    const score=scoreSaluteHand(samples({...good,[key]:value}));
    assert.equal(score.points,8); assert.ok(score.mistakes!.length>0);
  }
  const noisy=samples(); noisy[8].saluteHand!.extension=50;
  assert.equal(scoreSaluteHand(noisy).points,10);
});
test('hand tracking is only requested for salute and resets when switching movements',()=>{
  const session=new SessionProcessor(); assert.equal(session.needsHandTracking,false);
  session.command('selectSalute'); assert.equal(session.needsHandTracking,false, 'preparation does not run hand inference');
  session.command('selectTurnLeft'); assert.equal(session.needsHandTracking,false);
});
test('salute result shows unknown hand separately and never labels it as zero or a lowering step',()=>{
  const html=renderToStaticMarkup(React.createElement(ScoreResults,{movementId:'salute',result:{status:'scored',total:90,confidence:1,passed:false,assessment:'incomplete',unassessedPoints:10,criteria:[scoreSaluteHand([])],corrections:[]}}));
  assert.match(html,/Bàn tay và ngón tay chào/); assert.match(html,/Camera chưa xác nhận/);
  assert.doesNotMatch(html,/thôi chào|Độ tin cậy phân tích|0 \/ 10/);
});
