import { performance } from 'node:perf_hooks';
import { MOVEMENTS } from '../../src/features/pose-analysis/scoring/movements';
import { ruleScore } from '../../src/features/pose-analysis/scoring/scoringEngine';
import { createCalibration, normalizePose } from '../../src/features/pose-analysis/pipeline/normalization';
import { extractDualMeasurements } from '../../src/features/pose-analysis/diagnostics/dualMeasurement';
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { CAMERA, createSyntheticHuman } from './model';
import { lighting, quantile, runScenario, type ScenarioResult } from './runner';
import { coreScenarios } from './scenarios';

export const mean = (a:number[]) => a.length?a.reduce((s,v)=>s+v,0)/a.length:0;
export const std = (a:number[]) => Math.sqrt(mean(a.map(v=>(v-mean(a))**2)));
export function boundaryAudit() {
  return Object.values(MOVEMENTS).flatMap(m=>m.criteria.flatMap(c=>c.rules.map((rule,index)=>{
    const [lo,hi]=rule.ideal,[zl,zh]=rule.zero;
    const rangeValid=[lo,hi,zl,zh].every(Number.isFinite)&&zl<=lo&&lo<=hi&&hi<=zh;
    // Expected fractions are fixed endpoint/midpoint contracts, NOT scorer outputs.
    const probes=[{label:'ideal',value:(lo+hi)/2,expected:1},{label:'lower-boundary',value:lo,expected:1},
      {label:'upper-boundary',value:hi,expected:1},{label:'lower-mid',value:(zl+lo)/2,expected:lo===zl?1:.5},
      {label:'upper-mid',value:(hi+zh)/2,expected:hi===zh?1:.5},
      {label:'lower-near-failure',value:zl+(lo-zl)*.01,expected:lo===zl?1:.01},
      {label:'upper-near-failure',value:zh-(zh-hi)*.01,expected:hi===zh?1:.01},
      {label:'lower-failure',value:zl-Math.max(1,Math.abs(zl)*.01),expected:0},
      {label:'upper-failure',value:zh+Math.max(1,Math.abs(zh)*.01),expected:0}]
      .map(p=>({...p,actual:ruleScore(p.value,rule),match:rangeValid?Math.abs(ruleScore(p.value,rule)-p.expected)<1e-8:null}));
    const lower=Array.from({length:21},(_,i)=>ruleScore(zl+(lo-zl)*i/20,rule));
    const upper=Array.from({length:21},(_,i)=>ruleScore(hi+(zh-hi)*i/20,rule));
    const monotonic=rangeValid?lower.every((v,i)=>!i||v>=lower[i-1]-1e-8)&&upper.every((v,i)=>!i||v<=upper[i-1]+1e-8):null;
    return {movement:m.id,criterion:c.id,rule:index,feature:rule.feature,ideal:rule.ideal,zero:rule.zero,rangeValid,
      route:m.type==='DYNAMIC'?'dynamic evaluator (rule metadata is not its scoring function)':'static ruleScore',monotonic,probes};
  })));
}
export function differentialAudit() {
  return [CAMERA,{...CAMERA,yaw:15,pitch:8,roll:3},{...CAMERA,yaw:-15,pitch:-8,distance:2.9}].flatMap((camera,cameraIndex)=>
    [{rest:0},{rest:1},{salute:1},{yaw:90}].flatMap((state,pose)=>{
      const calibration=createCalibration(Array.from({length:12},(_,i)=>createSyntheticHuman({},i*100,{camera})))!;
      const normalized=normalizePose(createSyntheticHuman(state,2000,{camera}),calibration,true)!;
      return extractDualMeasurements(normalized,pose===3).map(d=>({cameraIndex,camera,pose,...d}));
    }));
}
export function stressAudit() {
  return [100,500,1000].map(frames=>{
    const processor=new SessionProcessor();processor.command('selectAttention');
    // Preflight remains active: no post-final no-op frames inflate throughput.
    const memoryBefore=process.memoryUsage(),times:number[]=[];let events=0;
    for(let i=0;i<frames;i++) {const frame=createSyntheticHuman({rest:1},i*100);const start=performance.now();events+=processor.process(frame,lighting,0).length;times.push(performance.now()-start);}
    const memoryAfter=process.memoryUsage();
    return {frames,phase:'active preflight pipeline; no detector inference',events,totalMs:times.reduce((a,b)=>a+b,0),medianMs:quantile(times,.5),p90Ms:quantile(times,.9),
      heapBefore:memoryBefore.heapUsed,heapAfter:memoryAfter.heapUsed,heapDelta:memoryAfter.heapUsed-memoryBefore.heapUsed,rssDelta:memoryAfter.rss-memoryBefore.rss,
      caveat:'Heap/RSS deltas are GC-sensitive snapshots, not retained-memory or leak proofs.'};
  });
}
const signature=(r:ScenarioResult)=>JSON.stringify({actual:r.actual,criteria:r.criteria,state:r.stateSequence,commands:r.commandSequence,frames:r.performance.framesAccepted});
export function isolationAudit() {
  const cases=coreScenarios(), a=cases.find(c=>c.testId==='turnLeft-12fps')!, b=cases.find(c=>c.testId==='salute-12fps')!;
  const baseline=new Map([a,b].map(c=>[c.testId,signature(runScenario(c))]));
  const clock={value:0},processor=new SessionProcessor(undefined,()=>clock.value);
  return [a,b,b,a].map(c=>({testId:c.testId,match:signature(runScenario(c,{processor,clock}))===baseline.get(c.testId),reset:true}));
}
export function repeatability(results:ScenarioResult[]) {
  const repeated=results.filter(r=>r.testId.includes('noise-seed-'));
  const ids=[...new Set(repeated.flatMap(r=>r.criteria.map(c=>c.id)))];
  return {count:repeated.length,scoreMean:mean(repeated.flatMap(r=>r.actual.score===null?[]:[r.actual.score])),scoreStd:std(repeated.flatMap(r=>r.actual.score===null?[]:[r.actual.score])),
    criteria:ids.map(id=>{const criteria=repeated.flatMap(r=>r.criteria.filter(c=>c.id===id));const values=criteria.map(c=>c.points/c.maximum);
      return {id,mean:mean(values),std:std(values),statuses:[...new Set(criteria.map(c=>c.statusLevel))]};}).sort((a,b)=>b.std-a.std)};
}
