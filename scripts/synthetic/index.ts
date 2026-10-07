import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { POSE_SCORING_VERSION } from '../../src/features/pose-analysis/results/buildPoseResult';
import { coreScenarios, available, unavailable } from './scenarios';
import { runScenario } from './runner';
import { boundaryAudit, differentialAudit, isolationAudit, repeatability, stressAudit } from './audits';
import { DISCLAIMER, scenarioIssues, summarize, writeArtifacts } from './report';

const args=process.argv.slice(2),value=(key:string)=>args.includes(key)?args[args.indexOf(key)+1]:undefined;
const selected=value('--testId'),seed=value('--seed');
if(args.some((v,i)=>v.startsWith('--')&&!['--testId','--seed'].includes(v)))throw new Error('Supported: --testId ID --seed INTEGER');
if(args.includes('--testId')&&!selected||args.includes('--seed')&&!seed)throw new Error('Missing option value');
if(seed!==undefined&&(!Number.isSafeInteger(Number(seed))||Number(seed)<0))throw new Error('Seed must be a non-negative integer');
const configs=coreScenarios().filter(c=>!selected||c.testId===selected).map(c=>seed===undefined?c:{...c,seed:Number(seed)});
if(!configs.length)throw new Error(`Unknown testId: ${selected}`);
const scenarios=configs.map(c=>runScenario(c)),summary=summarize(scenarios);
if(selected) {
  console.log(JSON.stringify({summary,scenario:scenarios[0]},null,2));process.exitCode=summary.mismatch?1:0;
} else {
  const git=(...args:string[])=>execFileSync('git',args,{encoding:'utf8'}).trim();
  const files=(folder:string):string[]=>fs.readdirSync(folder,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(folder,e.name)):[path.join(folder,e.name)]);
  const sources=[...files('scripts/synthetic'),...files('src/features/pose-analysis'),'package.json'].sort();
  const sourceFingerprint=createHash('sha256');for(const f of sources){sourceFingerprint.update(f.replaceAll('\\','/'));sourceFingerprint.update(fs.readFileSync(f));}
  const audits={boundaries:boundaryAudit(),differential:differentialAudit(),stress:stressAudit(),isolation:isolationAudit(),repeatability:repeatability(scenarios)};
  const issues:any[]=scenarioIssues(scenarios);
  for(const b of audits.boundaries.filter(b=>!b.rangeValid||b.probes.some(p=>p.match===false)||b.monotonic===false))issues.push({id:`boundary-${b.movement}-${b.criterion}-${b.rule}`,severity:'NEEDS_REVIEW',categories:['BOUNDARY_RANGE'],expected:'Ordered piecewise band, monotonic degradation',actual:b.rangeValid?'PROBE_MISMATCH':'NON_ORDERED_BAND',score:null,cause:b.route,reproduce:'npm run test:pose:synthetic'});
  for(const [index,i] of audits.isolation.entries())if(!i.match)issues.push({id:`isolation-${index}`,severity:'HIGH',categories:['STATE_LEAK'],expected:'same as standalone',actual:'DIFFERENT',score:null,cause:i.testId,reproduce:'npm run test:pose:synthetic'});
  const validation=['npm run test:pose','npm run test:pose:synthetic','npm run test:physics','npm run lint','npm run build'].map(command=>({command,status:command.endsWith(':synthetic')?(summary.mismatch?'MISMATCH':'PASS'):'NOT_RECORDED',detail:command.endsWith(':synthetic')?`${summary.match}/${summary.total} scenarios match; artifacts generated`:''}));
  const data={run:{metadata:{suiteVersion:'synthetic-human-v1',generatedAt:new Date().toISOString(),gitHead:git('rev-parse','HEAD'),dirtyStatus:git('status','--short'),sourceFingerprint:sourceFingerprint.digest('hex'),
    node:process.version,os:`${os.platform()} ${os.release()}`,arch:os.arch(),cpu:os.cpus()[0]?.model,rubricVersion:POSE_SCORING_VERSION,available:available.map(m=>m.id),unavailable,
    sampling:'160 representative core scenarios, not Cartesian; no extended suite',seedOverride:seed??null,disclaimer:DISCLAIMER},validation},scenarios,summary,audits,issues};
  writeArtifacts(data);
  console.log(JSON.stringify({summary,issues:issues.length,outputs:['artifacts/ai-pose-synthetic-results.json','artifacts/ai-pose-synthetic-tests.xlsx','docs/ai-pose-synthetic-human-report.md']},null,2));
  process.exitCode=summary.mismatch||audits.isolation.some(i=>!i.match)||audits.boundaries.some(b=>b.monotonic===false||b.probes.some(p=>p.match===false))?1:0;
}
