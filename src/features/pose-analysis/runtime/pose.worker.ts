import { MediaPipePoseDetector } from './MediaPipePoseDetector';
import { SessionProcessor } from './sessionProcessor';
import type { WorkerCommand, WorkerEvent } from './workerProtocol';
import { loadSequenceEngine } from './loadSequenceEngine';
import { poseNowMs } from './attemptTiming';
import { FrameFreshnessGate } from './frameFreshness';
const scope = self as unknown as { onmessage: ((event: MessageEvent<WorkerCommand>) => void) | null; postMessage: (event: WorkerEvent) => void; close: () => void };
let detector = new MediaPipePoseDetector(), processor = new SessionProcessor(), ready = false, disposed = false;
const freshness = new FrameFreshnessGate();
scope.onmessage = async ({ data }) => {
  try {
    if (data.type === 'dispose') { disposed = true; ready = false; detector.dispose(); scope.postMessage({ type: 'disposed' }); scope.close(); return; }
    if (disposed) { if (data.type === 'analyzeFrame') data.frame.close(); return; }
    if (data.type === 'initialize') {
      const sequenceReady = loadSequenceEngine();
      let delegate = data.delegate ?? 'CPU';
      try { await detector.initialize(delegate); }
      catch (error) { if (delegate !== 'GPU' || disposed) throw error; detector.dispose(); detector = new MediaPipePoseDetector(); delegate = 'CPU'; await detector.initialize(delegate); }
      if (data.prepareHands && !disposed) await detector.prepareHands();
      const sequenceEngine = await sequenceReady;
      if (!disposed) { processor = new SessionProcessor(sequenceEngine); ready = true; scope.postMessage({ type: 'ready', delegate, sequenceEngine: sequenceEngine.kind }); }
    } else if (data.type === 'analyzeFrame') {
      const receivedAtMs = poseNowMs();
      try {
        if (!ready) throw new Error('Mô hình chưa sẵn sàng.');
        if (processor.isFinalized || data.attemptId !== processor.attemptId || !freshness.accept(data.timestampMs, data.capturedAtMs, receivedAtMs)) {
          scope.postMessage({ type: 'frameComplete', attemptId: data.attemptId }); return;
        }
        const start = performance.now(), frame = detector.detect(data.frame, data.timestampMs, data.width, data.height, processor.needsHandTracking);
        const events = processor.process(frame, data.lighting, performance.now() - start);
        for (const event of events) {
          if (event.type === 'analysis') event.snapshot.performance = { ...event.snapshot.performance,
            workerLatencyMs: Math.max(0, receivedAtMs - (data.sentAtMs ?? receivedAtMs)) };
          if (event.type === 'score' && event.timing) {
            scope.postMessage({ ...event, timing: { ...event.timing,
              workerLatencyMs: Math.max(0, receivedAtMs - (data.sentAtMs ?? receivedAtMs)) } });
          } else scope.postMessage(event);
        }
        if (!events.length) scope.postMessage({ type: 'frameComplete', attemptId: data.attemptId });
      } finally { data.frame.close(); }
    } else {
      if (data.type === 'reset' || data.type.startsWith('select')) freshness.reset();
      if (data.type === 'selectSalute' || data.type === 'selectBasicDrill') void detector.prepareHands();
      processor.command(data.type, data.attempt);
    }
  } catch (error) { if (!disposed) scope.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Không thể phân tích hình ảnh.' }); }
};
