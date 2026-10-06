import { performance } from 'node:perf_hooks';
import { SessionProcessor } from '../src/features/pose-analysis/runtime/sessionProcessor';
import { attentionFrame, goodLighting } from './tests/fixtures/pose/attention';
import { saluteMotionFrame } from './tests/fixtures/pose/drill';

const report = [];
for (const fps of [8,12,20]) {
  const costs: number[] = [], detectionDelays: number[] = [];
  let finalizations = 0;
  for (let trial = 0; trial < 20; trial++) {
    const p = new SessionProcessor(); p.command('selectSalute');
    const step = 1000/fps;
    let t = 0, command: number | undefined;
    for (; t <= 1500; t += step) p.process(attentionFrame(t),goodLighting,0);
    p.command('startCalibration');
    for (; t <= 30000 && !p.isFinalized; t += step) {
      const frame = command === undefined ? attentionFrame(t) : saluteMotionFrame(t,command,1800);
      const start = performance.now(), events = p.process(frame,goodLighting,0); costs.push(performance.now()-start);
      if(events.some(e=>e.type==='commandCue'&&e.command==='CHÀO')) command=t;
      const result=events.find(e=>e.type==='score');
      if(result?.type==='score') {
        if(result.result.status!=='scored') throw new Error(JSON.stringify(result.result));
        finalizations++;
        detectionDelays.push(result.result.saluteSequence!.firstMovementMs!-command!);
      }
    }
    if(!p.isFinalized) throw new Error('Synthetic salute did not finalize');
  }
  costs.sort((a,b)=>a-b);
  report.push({fps,trials:20,finalizations,sessionProcessorMs:{median:costs[Math.floor(costs.length/2)],p90:costs[Math.ceil(costs.length*.9)-1]},
    commandToFirstObservedMovementMs:{min:Math.min(...detectionDelays),max:Math.max(...detectionDelays)}});
}
console.log(JSON.stringify({kind:'Synthetic observations only; NOT a webcam/MediaPipe benchmark',
  notMeasured:['Pose inference','Hand inference','worker transport','camera capture to display','render FPS'],report},null,2));
