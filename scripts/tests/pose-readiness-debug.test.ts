import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {shouldAutoCalibrate} from '../../src/features/pose-analysis/runtime/autoCalibration';
import {SessionProcessor} from '../../src/features/pose-analysis/runtime/sessionProcessor';
import {postureReadiness} from '../../src/features/pose-analysis/runtime/commandFlow';
import {attentionMovement} from '../../src/features/pose-analysis/scoring/attentionMovement';
import {createCalibration,normalizePose} from '../../src/features/pose-analysis/pipeline/normalization';
import {extractFeatures} from '../../src/features/pose-analysis/pipeline/featureExtraction';
import {VisualSkeleton} from '../../src/features/pose-analysis/rendering/visualSkeleton';
import {PoseReadinessStatus} from '../../src/features/pose-analysis/components/PoseReadinessStatus';
import {PoseViewport} from '../../src/features/pose-analysis/components/PoseViewport';
import {attentionFrame,goodLighting} from './fixtures/pose/attention';
import {drillFrame} from './fixtures/pose/drill';
import type {AnalysisSnapshot} from '../../src/features/pose-analysis/types';
import {referenceSilhouetteFrame} from './fixtures/pose/referenceSilhouettes';

test('all six workflows automatically calibrate and issue their first cue from the preparation references',()=>{
  const workflows=[['selectAttention',3,'NGHIÊM'],['selectAtEase',0,'NGHỈ'],['selectTurnLeft',1,'BÊN TRÁI — QUAY'],['selectTurnRight',2,'BÊN PHẢI — QUAY'],['selectSalute',0,'CHÀO'],['selectBasicDrill',3,'NGHIÊM']] as const;
  for(const [select,index,expected] of workflows){
    const p=new SessionProcessor();p.command(select);
    let starts=0,cue='';
    for(let t=0;t<20000&&!cue;t+=100){
      for(const e of p.process(referenceSilhouetteFrame(index,t),goodLighting,0)){
        if(e.type==='commandCue')cue=e.command;
        if(e.type==='analysis'&&shouldAutoCalibrate(true,e.snapshot.stage,e.snapshot.quality.passed,false)){starts++;p.command('startCalibration');}
      }
    }
    assert.equal(starts,1,select);assert.equal(cue,expected,select);
  }
});

test('automatic calibration uses camera readiness, once; wrong preparation still cannot issue a cue',()=>{
  const p=new SessionProcessor();p.command('selectSalute');
  let starts=0,cues=0,last:AnalysisSnapshot|undefined;
  for(let t=0;t<14000;t+=100){
    for(const e of p.process(drillFrame('atEase',t),goodLighting,0)){
      if(e.type==='commandCue')cues++;
      if(e.type==='analysis'){
        last=e.snapshot;
        if(shouldAutoCalibrate(true,last.stage,last.quality.passed,false)){starts++;p.command('startCalibration');}
      }
    }
  }
  assert.equal(starts,1);assert.equal(cues,0);assert.equal(last?.stage,'waiting-precondition');
  assert.match(last!.readinessDebug!.blockers.join(' '),/gối.*nghỉ/);
  for(const [enabled,stage,ready,result] of [[false,'quality-check',true,false],[true,'quality-check',false,false],[true,'quality-check',true,true],[true,'calibrating',true,false],[true,'blocked',true,false]] as const)
    assert.equal(shouldAutoCalibrate(enabled,stage,ready,result),false);
});

test('readiness explanations match the actual gate without changing status or samples',()=>{
  const profile=createCalibration(Array.from({length:12},()=>attentionFrame()))!;
  const sample=extractFeatures(normalizePose(attentionFrame(),profile)!);
  const reasons:string[]=[];
  sample.values.torsoTilt!.value=22;
  const before=JSON.stringify(sample);
  assert.equal(postureReadiness(sample,attentionMovement,{allowUnobservedArms:true,reasons}),'WRONG_PRECONDITION');
  assert.match(reasons.join(' '),/Độ nghiêng thân: 22.0/);
  assert.equal(JSON.stringify(sample),before);
  reasons.length=0;delete sample.values.leftKneeAngle;
  assert.equal(postureReadiness(sample,attentionMovement,{reasons}),'INSUFFICIENT_EVIDENCE');
  assert.match(reasons.join(' '),/Góc gối trái.*chưa đo được/);
});

test('diagnostic UI distinguishes auto-off, camera loss and pose rejection, outside the video',()=>{
  const p=new SessionProcessor();p.command('selectSalute');p.command('startCalibration');
  let snapshot:AnalysisSnapshot|undefined;
  for(let t=0;t<7000;t+=100){const e=p.process(drillFrame('atEase',t),goodLighting,0).find(e=>e.type==='analysis');if(e?.type==='analysis')snapshot=e.snapshot;}
  assert.ok(snapshot?.readinessDebug);
  const status=React.createElement(PoseReadinessStatus,{snapshot,stage:snapshot.stage,autoCalibrate:true});
  const html=renderToStaticMarkup(React.createElement(PoseViewport,{
    videoRef:React.createRef<HTMLVideoElement>(),canvasRef:React.createRef<HTMLCanvasElement>(),mirrored:true,
    stage:snapshot.stage,progress:0,readinessStatus:status,
  }));
  assert.ok(html.indexOf('data-pose-status-strip')<html.indexOf('Chẩn đoán tiền đề trực tiếp'));
  for(const text of ['gối','WRONG_PRECONDITION','FPS','Chi tiết để quay video','không phải điểm bài'])assert.ok(html.includes(text),text);
  const manual=renderToStaticMarkup(React.createElement(PoseReadinessStatus,{snapshot,stage:'quality-check',autoCalibrate:false}));
  assert.ok(manual.includes('Tự động đang TẮT'));
  const f=attentionFrame(7100);delete f.landmarks.leftKnee;
  const e=p.process(f,goodLighting,0).find(e=>e.type==='analysis');
  assert.ok(e?.type==='analysis');assert.ok(e.snapshot.readinessDebug!.blockers.length);
  assert.equal(e.snapshot.quality.passed,false);
});

test('standing jitter is filtered once per observation, independent of display refresh rate',()=>{
  const visual=new VisualSkeleton();visual.frame(attentionFrame(1000),1000);
  const next=attentionFrame(1033);next.landmarks.leftKnee!.image.x+=.007;
  const first=visual.frame(next,1033)!.landmarks.leftKnee!.image.x;
  const later=visual.frame(next,1050)!.landmarks.leftKnee!.image.x;
  assert.equal(first,later,'repainting must not amplify the same noisy input');
  const raw=next.landmarks.leftKnee!.image.x;
  const original=attentionFrame().landmarks.leftKnee!.image.x;
  assert.ok(Math.abs(first-original)<Math.abs(raw-original)*.4);
  const moving=attentionFrame(1066);moving.landmarks.rightWrist!.image.y-=.2;
  assert.equal(visual.frame(moving,1066)!.landmarks.rightWrist!.image.y,moving.landmarks.rightWrist!.image.y);
  assert.equal(visual.frame(moving,1600),null);
});
