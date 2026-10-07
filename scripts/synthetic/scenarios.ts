import { EXERCISE_CATALOG, MOVEMENTS } from '../../src/features/pose-analysis/scoring/movements';
import { commandFlow } from '../../src/features/pose-analysis/runtime/commandFlow';
import { BASIC_DRILL } from '../../src/features/pose-analysis/scoring/basicDrill';
import type { MovementId } from '../../src/features/pose-analysis/types';
import { CAMERA, PROFILES, type Camera } from './model';

export type Outcome = 'PASS' | 'FAIL' | 'INSUFFICIENT_EVIDENCE';
export interface Scenario {
  testId: string; movement: MovementId; scenario: string; seed: number; profile: number; fps: number;
  speed: 'FAST'|'NORMAL'|'SLOW'; transitionMs: number; holdMs: number; camera: Camera;
  noise: 'NONE'|'LOW'|'MEDIUM'|'HIGH'; drop: string; anomaly: string; occlusion: string; hand: string;
  fault: string; faultPhase: 'motion'|'scoring'; faultStep?: string;
  expected: { result: Outcome; scoreRange?: [number,number]; criteria?: Record<string,string[]>; finalizationCount: number; missingEvidence?: string[] };
}
export const available = EXERCISE_CATALOG.filter(e => e.available && commandFlow(e.id) && (MOVEMENTS[e.id] || e.id === 'basicDrill'));
export const unavailable = EXERCISE_CATALOG.filter(e => !e.available).map(e=>e.id);
export function coreScenarios(): Scenario[] {
  const cases: Scenario[] = [];
  const add = (movement: MovementId, name: string, options: Partial<Scenario> = {}) => {
    cases.push({ testId: `${movement}-${name}`, movement, scenario:name, seed:12345, profile:0, fps:12,
      speed:'NORMAL', transitionMs:1400, holdMs:20000, camera:{...CAMERA}, noise:'NONE', drop:'none', anomaly:'none', occlusion:'none', hand:'normal', fault:'none', faultPhase:'motion',
      expected:{result:'PASS',scoreRange:[65,100],finalizationCount:1}, ...options });
  };
  const incomplete = (finalizationCount=1): Scenario['expected'] => ({ result:'INSUFFICIENT_EVIDENCE', finalizationCount });
  for (const {id} of available) {
    for (const fps of [5,8,10,12,15,20]) add(id,`${fps}fps`,{fps});
    for (let profile=1;profile<PROFILES.length;profile++) add(id,`profile-${profile}`,{profile});
    add(id,'fast',{speed:'FAST',transitionMs:450}); add(id,'slow',{speed:'SLOW',transitionMs:2800});
    add(id,'camera-oblique',{camera:{...CAMERA,yaw:8,pitch:4,roll:2,height:.015}});
    if (id==='attention'||id==='salute') add(id,'camera-far',{camera:{...CAMERA,distance:2.9,height:-.015,yaw:-8,pitch:-3}});
    if (id==='turnLeft'||id==='turnRight') add(id,'mirror',{camera:{...CAMERA,mirror:true}});
  }
  // Twenty independent low-noise repeats, not a Cartesian product.
  for (let seed=1;seed<=20;seed++) add('attention',`noise-seed-${seed}`,{seed,noise:'LOW'});
  for (const movement of ['attention','atEase','salute'] as const) {
    add(movement,'severe-after-acquisition',{fault:'severe',faultPhase:'scoring',expected:{result:'FAIL',scoreRange:[0,64.9],finalizationCount:1}});
    add(movement,'missing-feet',{occlusion:'feet',expected:incomplete()});
  }
  add('attention','parallel-feet',{fault:'parallel-feet',expected:{result:'PASS',scoreRange:[65,95],criteria:{feet:['NOT_ACHIEVED','NEEDS_ADJUSTMENT']},finalizationCount:1}});
  add('attention','wrong-arms',{fault:'arms',faultPhase:'scoring',expected:{result:'PASS',criteria:{arms:['NOT_ACHIEVED','NEEDS_ADJUSTMENT']},finalizationCount:1}});
  add('attention','bent-knees',{fault:'both-knees',faultPhase:'scoring',expected:{result:'PASS',criteria:{legs:['NOT_ACHIEVED']},finalizationCount:1}});
  add('atEase','right-leg',{fault:'right-leg'});
  add('atEase','both-knees',{fault:'both-knees',faultPhase:'scoring',expected:{result:'PASS',criteria:{legs:['NOT_ACHIEVED']},finalizationCount:1}});
  add('atEase','no-asymmetry',{fault:'no-asymmetry',faultPhase:'scoring',expected:{result:'PASS',criteria:{legs:['NOT_ACHIEVED']},finalizationCount:1}});
  add('atEase','missing-knee',{occlusion:'knee',expected:incomplete()});
  for (const hand of ['missing','low-confidence','partial','stale','tiny','clipped','blur']) add('salute',`hand-${hand}`,{hand,expected:{...incomplete(),criteria:{saluteHand:['NOT_SCORABLE']},missingEvidence:['saluteHand']}});
  for (const hand of ['flexed','spread','thumb-open','bent']) add('salute',`hand-${hand}`,{hand,expected:{result:'PASS',criteria:{saluteHand:['NOT_ACHIEVED','NEEDS_ADJUSTMENT']},finalizationCount:1}});
  add('salute','direct-jump',{fault:'jump',expected:incomplete()});
  add('salute','already-saluting',{fault:'already',expected:incomplete(0)});
  add('salute','wrong-final',{fault:'wrong-salute',expected:incomplete()});
  for (const movement of ['turnLeft','turnRight'] as const) {
    add(movement,'wrong-direction',{fault:'wrong-direction',expected:{result:'FAIL',scoreRange:[0,64.9],finalizationCount:1,criteria:{direction:['NOT_ACHIEVED']}}});
    add(movement,'under-turn',{fault:'under-turn',expected:{result:'FAIL',finalizationCount:1,criteria:{angle:['NOT_ACHIEVED','NEEDS_ADJUSTMENT']}}});
    add(movement,'over-turn',{fault:'over-turn',expected:{result:'PASS',finalizationCount:1,criteria:{angle:['NOT_ACHIEVED','NEEDS_ADJUSTMENT']}}});
    add(movement,'direct-jump',{fault:'jump',expected:incomplete()});
    add(movement,'walking',{fault:'walking',expected:{result:'PASS',finalizationCount:1,criteria:{torso:['NOT_ACHIEVED','NEEDS_ADJUSTMENT']}}});
    add(movement,'missing-final-feet',{occlusion:'final-feet',expected:{...incomplete(),criteria:{feetFinal:['NOT_SCORABLE']},missingEvidence:['feetFinal']}});
    add(movement,'missing-shoulder',{occlusion:'shoulder',expected:incomplete()});
  }
  for (const step of BASIC_DRILL) add('basicDrill',`bad-step-${step.id}`,{fault:'severe',faultPhase:'scoring',faultStep:step.id,
    expected:{result:'PASS',finalizationCount:1,criteria:{[`${step.id}:torso`]:['NOT_ACHIEVED']}}});
  add('basicDrill','tracking-loss-between-steps',{occlusion:'between-steps',expected:incomplete()});
  for (const [index,drop] of ['every-second','random20','random40','burst','gap250','gap500'].entries()) add(index%2?'salute':'turnLeft',`drop-${drop}`,{drop,expected:drop==='gap500'||drop==='burst'?incomplete():{result:'PASS',finalizationCount:1}});
  for (const anomaly of ['duplicate','backwards','stale']) add('salute',`timestamp-${anomaly}`,{anomaly});
  for (const noise of ['MEDIUM','HIGH'] as const) add('attention',`noise-${noise}`,{noise});
  add('turnRight','wrist-briefly-hidden',{occlusion:'brief-wrist'});
  add('attention','feet-cropped',{occlusion:'cropped',expected:incomplete()});
  return cases;
}
