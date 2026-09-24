// Development-only fixture. All scores/video are synthetic; never opens a webcam.
import React from 'react';
import { createRoot } from 'react-dom/client';
import PoseAnalysisPage from '../src/features/pose-analysis/PoseAnalysisPage';
import { SessionProcessor } from '../src/features/pose-analysis/runtime/sessionProcessor';
import type { WorkerCommand, WorkerEvent } from '../src/features/pose-analysis/runtime/workerProtocol';
import type { AnalysisSnapshot } from '../src/features/pose-analysis/types';
import { attentionFrame, goodLighting } from './tests/fixtures/pose/attention';
import '../src/index.css';

let currentWorker: FixtureWorker | undefined;
class FixtureWorker {
  onmessage: ((event: { data: WorkerEvent }) => void) | null = null;
  processor = new SessionProcessor();
  time = 0;
  snapshot?: AnalysisSnapshot;
  constructor() { currentWorker = this; }
  emit(data: WorkerEvent) { this.onmessage?.({ data }); }
  postMessage(command: WorkerCommand) {
    if (command.type === 'initialize') queueMicrotask(() => this.emit({ type: 'ready', delegate: 'CPU', sequenceEngine: 'wasm' }));
    else if (command.type === 'dispose') queueMicrotask(() => this.emit({ type: 'disposed' }));
    else if (command.type === 'analyzeFrame') {
      command.frame.close();
      this.time += 100;
      queueMicrotask(() => {
        for (const event of this.processor.process(attentionFrame(this.time), goodLighting, 10)) {
          if (event.type === 'analysis') this.snapshot = event.snapshot;
          this.emit(event);
        }
      });
    } else this.processor.command(command.type);
  }
  terminate() {}
  finish(scored: boolean) {
    this.emit({ type: 'score', result: scored
      ? { status: 'scored', total: 87, confidence: 0.96, criteria: [], corrections: [] }
      : { status: 'notScorable', reasons: ['Camera quá chậm hoặc bị gián đoạn. Vui lòng thử lại.'] } });
    // Reproduce the real worker's score-then-analysis event ordering.
    if (this.snapshot) this.emit({ type: 'analysis', snapshot: { ...this.snapshot, stage: scored ? 'completed' : 'blocked' } });
  }
}
Object.defineProperty(window, 'Worker', { configurable: true, value: FixtureWorker });
Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => {
  const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
  const ctx = canvas.getContext('2d')!;
  const stream = canvas.captureStream(15);
  const timer = window.setInterval(() => {
    if (!stream.active) { clearInterval(timer); return; }
    ctx.fillStyle = '#334155'; ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = 'white'; ctx.font = '20px sans-serif'; ctx.fillText(`Synthetic video ${Date.now()}`, 30, 240);
  }, 66);
  return stream;
} });

createRoot(document.getElementById('root')!).render(<React.StrictMode>
  <div className="min-h-screen bg-slate-100 p-4 text-slate-900">
    <div className="sticky top-0 z-50 mb-6 flex flex-wrap gap-3 rounded-xl bg-amber-100 p-4">
      <strong>TEST ONLY · Camera giả, kết quả giả</strong>
      <button onClick={() => currentWorker?.finish(true)}>Giả lập kết quả 87%</button>
      <button onClick={() => currentWorker?.finish(false)}>Giả lập từ chối chấm</button>
      <button onClick={() => window.dispatchEvent(new Event('pagehide'))}>Giả lập rời trang</button>
    </div>
    <PoseAnalysisPage />
  </div>
</React.StrictMode>);
