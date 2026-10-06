import type { PosePerformanceTelemetry } from '../types';

/** Bounded local timings. No video/landmarks and no fabricated webcam benchmarks. */
export class RuntimePerformance {
  private samples = new Map<string, number[]>();
  observe(value: PosePerformanceTelemetry) {
    for (const [key, ms] of Object.entries({ pose: value.poseMs, hand: value.handMs, worker: value.workerLatencyMs, age: value.landmarkAgeMs })) {
      if (ms === undefined || !Number.isFinite(ms) || ms < 0 || (key === 'hand' && ms === 0)) continue;
      this.samples.set(key, [...(this.samples.get(key) ?? []), ms].slice(-120));
    }
  }
  summary(): PosePerformanceTelemetry['benchmark'] {
    return Object.fromEntries([...this.samples].map(([key, values]) => {
      const sorted = [...values].sort((a,b) => a-b);
      return [key, { medianMs: sorted[Math.floor(sorted.length/2)], p90Ms: sorted[Math.ceil(sorted.length*.9)-1], samples: sorted.length }];
    }));
  }
}
