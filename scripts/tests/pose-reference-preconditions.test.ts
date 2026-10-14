import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { referenceSilhouetteFrame } from './fixtures/pose/referenceSilhouettes';
import { goodLighting } from './fixtures/pose/attention';
import type { WorkerEvent, SessionCommand } from '../../src/features/pose-analysis/runtime/workerProtocol';

// Independent workflow expectations: all exercises must accept the same
// observed preparation silhouettes through the actual shared runtime.
const workflows = [
  { select:'selectAttention', precondition:'atEase', cue:'NGHIÊM' },
  { select:'selectAtEase', precondition:'attention', cue:'NGHỈ' },
  { select:'selectTurnLeft', precondition:'attention', cue:'BÊN TRÁI — QUAY' },
  { select:'selectTurnRight', precondition:'attention', cue:'BÊN PHẢI — QUAY' },
  { select:'selectSalute', precondition:'attention', cue:'CHÀO' },
  { select:'selectBasicDrill', precondition:'atEase', cue:'NGHIÊM' },
] as const satisfies readonly {select:SessionCommand;precondition:'attention'|'atEase';cue:string}[];

for (const workflow of workflows) test(`${workflow.select}: reference preparation reaches its command with natural arm occlusion at varied FPS`, () => {
  for (const index of workflow.precondition === 'attention' ? [0,1,2] : [3]) {
    for (const fps of [5,10,15,30]) for (const scorePreparation of [false,true]) for (const hiddenArms of [false,true]) {
      const p = new SessionProcessor();
      p.command(workflow.select);
      p.command(scorePreparation ? 'enablePreconditionScoring' : 'disablePreconditionScoring');
      p.command('startCalibration');
      const events:WorkerEvent[]=[];
      for (let i=0;i<fps*20&&!events.some(e=>e.type==='commandCue');i++) {
        const frame=referenceSilhouetteFrame(index,i*1000/fps);
        if (hiddenArms) {
          // A hidden wrist must not force pupils to spread their arms. A recent
          // real right wrist remains available for the salute starting baseline.
          frame.landmarks.leftWrist!.visibility=.4;
          if (i%4===0) frame.landmarks.rightWrist!.visibility=.4;
        }
        events.push(...p.process(frame,goodLighting,0));
      }
      const label=`reference=${index+1}, fps=${fps}, grade=${scorePreparation}, hidden=${hiddenArms}`;
      const cues=events.filter(e=>e.type==='commandCue');
      assert.equal(cues.length,1,label);
      assert.equal(cues[0].command,workflow.cue,label);
      assert.equal(events.some(e=>e.type==='score'),false,label);
      const snapshots=events.filter(e=>e.type==='analysis').map(e=>e.snapshot);
      assert.ok(snapshots.every(s=>s.workflow?.preconditionId===workflow.precondition),label);
      const countdown=snapshots.filter(s=>s.stage==='countdown');
      assert.ok(countdown.length>0,label);
      const cueFrame=snapshots.at(-1)!.frame.timestampMs;
      assert.ok(Math.abs(cueFrame-countdown[0].frame.timestampMs-3000)<1000/fps+.01,label);
    }
  }
});

test('reference preparation does not substitute for genuinely missing core body or a dark camera in any workflow', () => {
  for(const workflow of workflows) for(const fault of ['core','dark'] as const) {
    const p=new SessionProcessor();p.command(workflow.select);p.command('startCalibration');
    const events:WorkerEvent[]=[];
    for(let i=0;i<160;i++) {
      const frame=referenceSilhouetteFrame(workflow.precondition==='attention'?0:3,i*100);
      if(fault==='core')delete frame.landmarks.leftKnee;
      events.push(...p.process(frame,fault==='dark'?{...goodLighting,mean:10}:goodLighting,0));
    }
    assert.equal(events.some(e=>e.type==='commandCue'||e.type==='score'),false,`${workflow.select}:${fault}`);
  }
});

test('basic drill reuses reference rest/attention preparation through all three command cues', () => {
  for(const attentionIndex of [0,1,2]) {
    const p=new SessionProcessor();p.command('selectBasicDrill');p.command('startCalibration');
    const events:WorkerEvent[]=[];
    for(let i=0;i<650&&events.filter(e=>e.type==='commandCue').length<3;i++) {
      const frame=referenceSilhouetteFrame(p.expectedPostureId==='atEase'?3:attentionIndex,i*100);
      events.push(...p.process(frame,goodLighting,0));
    }
    assert.deepEqual(events.filter(e=>e.type==='commandCue').map(e=>e.command),['NGHIÊM','NGHỈ','CHÀO']);
    const snapshots=events.filter(e=>e.type==='analysis').map(e=>e.snapshot);
    for(const [step,precondition] of ['atEase','attention','attention'].entries()) {
      const ready=snapshots.filter(s=>s.drillProgress?.index===step&&s.stage==='countdown');
      assert.ok(ready.length>0);
      assert.ok(ready.every(s=>s.workflow?.preconditionId===precondition));
    }
    assert.equal(snapshots.at(-1)?.drillProgress?.completed,2);
    // These are preparation references, not a substitute for the third step's
    // actual salute trajectory. No final grade before that action is observed.
    assert.equal(events.some(e=>e.type==='score'),false);
  }
});
