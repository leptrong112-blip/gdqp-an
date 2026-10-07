import { performance } from 'node:perf_hooks';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { FrameFreshnessGate } from '../../src/features/pose-analysis/runtime/frameFreshness';
import { commandFlow } from '../../src/features/pose-analysis/runtime/commandFlow';
import { BASIC_DRILL } from '../../src/features/pose-analysis/scoring/basicDrill';
import type { SessionCommand, WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';
import type { AnalysisSnapshot } from '../../src/features/pose-analysis/types';
import type { CriterionResult, ScoreResult } from '../../src/features/pose-analysis/scoring/scoringTypes';
import { createSyntheticHuman, rng, type BodyState } from './model';
import type { Scenario, Outcome } from './scenarios';

export const lighting = {mean:120,darkRatio:.05,brightRatio:.01};
export const quantile = (a: number[], p: number) => { const s=[...a].sort((x,y)=>x-y); return s.length?s[Math.min(s.length-1,Math.floor((s.length-1)*p))]:0; };
export function runScenario(config: Scenario, reuse?: {processor: SessionProcessor; clock: {value:number}}) {
  let now=0;
  const processor=reuse?.processor??new SessionProcessor(undefined,()=>now), freshness=new FrameFreshnessGate(), random=rng(config.seed);
  if(reuse) {reuse.clock.value=0;processor.command('reset');}
  processor.command(`select${config.movement[0].toUpperCase()}${config.movement.slice(1)}` as SessionCommand);
  let snapshot: AnalysisSnapshot | undefined, cue: number | undefined, cueMovement='', scoringAt: number | undefined;
  let calibrated=false, previousStep='', generated=0, accepted=0, rejected=0, dropped=0, finalizationCount=0;
  let final: ScoreResult | undefined, finalSerialized='', finalAt: number | null=null, finalizationMs: number|null=null;
  const stateSequence: {state:string;timeMs:number;movement:string}[]=[], commands: {command:string;timeMs:number}[]=[], times:number[]=[], trace:any[]=[];
  const stageEntries: {movement:string;delayFromCommandMs:number}[]=[], handSamples:any[]=[];
  const recordEvents=(events:WorkerEvent[])=>{
    for(const e of events) {
      if(e.type==='commandCue') { commands.push({command:e.command,timeMs:now}); if(e.command!=='THÔI') {cue=now;cueMovement=currentMovement();scoringAt=undefined;} }
      if(e.type==='score') {finalizationCount++;final=e.result;finalSerialized=JSON.stringify(final);finalAt=now;}
      if(e.type==='analysis') {
        snapshot=e.snapshot;
        const movement=currentMovement();
        if(stateSequence.at(-1)?.state!==snapshot.stage||stateSequence.at(-1)?.movement!==movement) stateSequence.push({state:snapshot.stage,timeMs:now,movement});
        if(snapshot.stage==='scoring' && scoringAt===undefined) {scoringAt=now;stageEntries.push({movement,delayFromCommandMs:cue===undefined?-1:now-cue});}
        trace.push({t:now,stage:snapshot.stage,step:movement,quality:snapshot.quality.passed,reasons:snapshot.quality.reasons,salute:snapshot.saluteProgress?.state});
        if(trace.length>12) trace.shift();
      }
    }
  };
  function currentMovement() {return config.movement==='basicDrill'?(snapshot?.drillProgress?.movementId ?? BASIC_DRILL[0].id):config.movement;}
  const dt=1000/config.fps, limit=config.movement==='basicDrill'?90000:40000;
  for(let i=0;i*dt<=limit;i++) {
    now=Math.round(i*dt*1000)/1000;
    if(reuse)reuse.clock.value=now;
    if(!calibrated&&now>=1500) {processor.command('startCalibration');calibrated=true;}
    const movement=currentMovement();
    if(previousStep && previousStep!==movement) {cue=undefined;cueMovement='';scoringAt=undefined;}
    previousStep=movement;
    const after=cue!==undefined && cueMovement===movement, elapsed=after?now-cue!:0;
    if(after && elapsed>config.transitionMs+config.holdMs) break;
    const f=config.fault==='jump'&&after?1:Math.min(1,elapsed/config.transitionMs);
    const prep=commandFlow(movement as Scenario['movement'])!.precondition;
    const state:BodyState={rest:prep==='atEase'?1:0,restRight:config.fault==='right-leg'};
    if(after) {
      state.rest=movement==='atEase'?f:prep==='atEase'?1-f:0;
      if(movement==='salute') state.salute=f;
      if(movement==='turnLeft'||movement==='turnRight') {
        const sign=movement==='turnLeft'?1:-1;
        const angle=config.fault==='under-turn'?40:config.fault==='over-turn'?135:90;
        state.yaw=sign*(config.fault==='wrong-direction'?-1:1)*angle*f;
        if(config.fault==='walking') state.root=.2*f;
      }
    }
    if(config.fault==='already') state.salute=1;
    const faultActive=after&&(!config.faultStep||config.faultStep===movement)&&(config.faultPhase==='motion'||scoringAt!==undefined);
    if(faultActive) {state.fault=config.fault;state.faultAmount=config.faultPhase==='scoring'?Math.min(1,(now-scoringAt!)/500):f;}
    let occlusion='none';
    if(after && (config.faultPhase==='motion'||scoringAt!==undefined)) {
      occlusion=config.occlusion;
      if(occlusion==='final-feet') occlusion=f>=.95?'feet':'none';
      if(occlusion==='brief-wrist') occlusion=elapsed>500&&elapsed<700?'wrist':'none';
    }
    if(config.occlusion==='between-steps'&&movement!==BASIC_DRILL[0].id) occlusion='torso';
    const frame=createSyntheticHuman(state,now,{profile:config.profile,camera:config.camera,seed:config.seed,
      noise:{NONE:0,LOW:.0006,MEDIUM:.003,HIGH:.012}[config.noise],occlusion,
      hand:{mode:config.hand,confidence:config.hand==='low-confidence'?.2:.99,sharpness:config.hand==='blur'?2:25,ageMs:config.hand==='stale'?300:0}});
    generated++;
    const drop=after && ((config.drop==='every-second'&&i%2===0)||(config.drop==='random20'&&random()<.2)||(config.drop==='random40'&&random()<.4)||
      (config.drop==='burst'&&elapsed>500&&elapsed<1300)||(config.drop==='gap250'&&elapsed>500&&elapsed<650)||(config.drop==='gap500'&&elapsed>500&&elapsed<1000));
    if(drop) {dropped++;continue;}
    const submit=(timestamp=now,age=0)=>{
      const input={...frame,timestampMs:timestamp};
      if(!freshness.accept(timestamp,now-age,now)){rejected++;return;}
      const started=performance.now(); const events=processor.process(input,lighting,0); const processMs=performance.now()-started; times.push(processMs);
      // Includes the final frame's pipeline work; unlike the injected virtual clock,
      // this measures real CPU wall time. It is an upper bound for finalization alone.
      if(events.some(e=>e.type==='score')) finalizationMs=processMs;
      if(events.length) accepted++; else rejected++;
      recordEvents(events);
    };
    if(config.anomaly==='stale'&&i%4===0) {generated++;submit(now,350);}
    submit();
    if(config.anomaly==='duplicate'&&i%4===0) {generated++;submit();}
    if(config.anomaly==='backwards'&&i%4===0) {generated++;submit(Math.max(0,now-dt));}
    if(frame.saluteHand&&handSamples.length<30&&scoringAt!==undefined) handSamples.push({count:frame.saluteHand.image.length,confidence:frame.saluteHand.confidence,sharpness:frame.saluteHand.sharpness,age:now-frame.saluteHand.timestampMs});
    if(processor.isFinalized) break;
  }
  let frozen=!!final&&Object.isFrozen(final);
  if(final) {
    for(let i=0;i<5;i++) {now+=dt;if(reuse)reuse.clock.value=now;recordEvents(processor.process(createSyntheticHuman({fault:'severe'},now),lighting,0));}
    frozen=frozen&&JSON.stringify(final)===finalSerialized;
  }
  const actual:Outcome=!final||final.status==='notScorable'||final.assessment==='incomplete'?'INSUFFICIENT_EVIDENCE':final.passed?'PASS':'FAIL';
  const criteria:CriterionResult[] = final?.drill ? final.drill.steps.flatMap(step=>step.result.status==='scored'?step.result.criteria.map(c=>({...c,id:`${step.movementId}:${c.id}`})):[]) : final?.status==='scored'?final.criteria:[];
  const score=final?.status==='scored'?final.total:null, mismatch:string[]=[];
  if(actual!==config.expected.result) mismatch.push(actual==='INSUFFICIENT_EVIDENCE'?'UNEXPECTED_INSUFFICIENT':config.expected.result==='INSUFFICIENT_EVIDENCE'?'UNEXPECTED_DECISION':actual==='PASS'?'FALSE_POSITIVE':'FALSE_NEGATIVE');
  const scoreInRange=!config.expected.scoreRange||score!==null&&score>=config.expected.scoreRange[0]&&score<=config.expected.scoreRange[1];
  if(actual===config.expected.result&&!scoreInRange)mismatch.push('SCORE_OUT_OF_RANGE');
  if(finalizationCount!==config.expected.finalizationCount||final&&!frozen)mismatch.push('FINALIZATION_ERROR');
  for(const [id,status] of Object.entries(config.expected.criteria??{})) if(!status.includes(criteria.find(c=>c.id===id)?.statusLevel??'ABSENT'))mismatch.push(`CRITERION_MISMATCH:${id}`);
  const expectedCommands=config.expected.finalizationCount===0?[]:(config.movement==='basicDrill'?BASIC_DRILL.map(m=>commandFlow(m.id as Scenario['movement'])!.command):[commandFlow(config.movement)!.command]);
  const observedCommands=commands.filter(c=>c.command!=='THÔI').map(c=>c.command);
  const commandCorrect=config.expected.result==='INSUFFICIENT_EVIDENCE'?observedCommands.every((c,i)=>c===expectedCommands[i]):JSON.stringify(observedCommands)===JSON.stringify(expectedCommands);
  const transitionScored=stageEntries.some(e=>!(e.movement==='turnLeft'||e.movement==='turnRight')&&e.delayFromCommandMs<config.transitionMs&&config.fault!=='jump');
  if(!commandCorrect||transitionScored||finalizationCount>0&&commands.at(-1)?.command!=='THÔI') mismatch.push('STATE_MACHINE_MISMATCH');
  return {testId:config.testId,movement:config.movement,scenario:config.scenario,seed:config.seed,conditions:config,expected:config.expected,
    actual:{result:actual,score,assessment:final?.status==='scored'?final.assessment:null,missingEvidence:criteria.filter(c=>c.statusLevel==='NOT_SCORABLE').map(c=>c.id),
      corrections:final?.status==='scored'?final.corrections:final?.reasons??['No final result before the modeled time budget.'],requiredCriteria:criteria.filter(c=>c.required).map(c=>({id:c.id,status:c.statusLevel})),
      finalState:snapshot?.stage??'unknown',frozen,commandCorrect,transitionScored,scoreInRange,
      turnTechnique:final?.status==='scored'?final.turnTechnique:undefined,
      drillSteps:final?.drill?.steps.map(s=>({movement:s.movementId,status:s.result.status,score:s.result.status==='scored'?s.result.total:null,frozen:Object.isFrozen(s)&&Object.isFrozen(s.result)}))},criteria,stateSequence,commandSequence:commands,
    performance:{framesGenerated:generated,framesAccepted:accepted,framesRejected:rejected,framesDropped:dropped,processorTimeMs:times.reduce((a,b)=>a+b,0),medianMs:quantile(times,.5),p90Ms:quantile(times,.9),finalizationMs,finalizationCount,finalAtMs:finalAt,stateCount:stateSequence.length},
    handSamples,match:mismatch.length===0,mismatch,trace:mismatch.length?trace:[]};
}
export type ScenarioResult=ReturnType<typeof runScenario>;
