import { performance } from 'node:perf_hooks';
import { SessionProcessor } from '../src/features/pose-analysis/runtime/sessionProcessor';
import { attentionFrame, goodLighting } from './tests/fixtures/pose/attention';

// Measures fixture CPU work and source-frame sampling only, not MediaPipe or UI.
const median = (values: number[]) => [...values].sort((a,b) => a-b)[Math.floor(values.length/2)];
const report = [];
for (const intervalMs of [67, 100, 125]) {
  const costs: number[] = [], overshoots: number[] = [];
  let scoreEvents = 0, lateFrameEvents = 0;
  for (let trial = 0; trial < 40; trial++) {
    const processor = new SessionProcessor();
    let timestamp = 0, scoringAt: number | undefined;
    for (; timestamp <= 1500; timestamp += intervalMs) processor.process(attentionFrame(timestamp), goodLighting, 20);
    processor.command('startCalibration');
    let finalized = false;
    for (let frames = 0; frames < 300; frames++, timestamp += intervalMs) {
      const started = performance.now();
      const events = processor.process(attentionFrame(timestamp), goodLighting, 20);
      const duration = performance.now() - started;
      const snapshot = events.find(e => e.type === 'analysis');
      if (snapshot?.type === 'analysis' && snapshot.snapshot.stage === 'scoring') scoringAt ??= timestamp;
      if (events.some(e => e.type === 'score')) {
        scoreEvents++; costs.push(duration); overshoots.push(timestamp - scoringAt! - 3000); finalized = true; break;
      }
    }
    if (!finalized) throw new Error('Fixture did not finalize');
    for (let frame = 1; frame <= 20; frame++) {
      const events = processor.process(attentionFrame(timestamp + frame*intervalMs), goodLighting, 20);
      scoreEvents += events.filter(e => e.type === 'score').length; lateFrameEvents += events.length;
    }
  }
  report.push({ intervalMs, trials: 40, finalFrameProcessMs: { median: median(costs), max: Math.max(...costs) },
    holdBoundaryToFinalSourceFrameMs: { median: median(overshoots), max: Math.max(...overshoots) }, scoreEvents, lateFrameEvents });
}
console.log(JSON.stringify({ kind: 'Synthetic CPU benchmark; MediaPipe, worker transport and React render excluded', report }, null, 2));
