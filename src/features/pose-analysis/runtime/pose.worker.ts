import { MediaPipePoseDetector } from './MediaPipePoseDetector';
import { SessionProcessor } from './sessionProcessor';
import type { WorkerCommand, WorkerEvent } from './workerProtocol';
const scope = self as unknown as { onmessage: ((event: MessageEvent<WorkerCommand>) => void) | null; postMessage: (event: WorkerEvent) => void; close: () => void };
let detector = new MediaPipePoseDetector(), processor = new SessionProcessor(), ready = false, disposed = false;
scope.onmessage = async ({ data }) => {
  try {
    if (data.type === 'dispose') { disposed = true; ready = false; detector.dispose(); scope.postMessage({ type: 'disposed' }); scope.close(); return; }
    if (disposed) { if (data.type === 'analyzeFrame') data.frame.close(); return; }
    if (data.type === 'initialize') {
      let delegate = data.delegate ?? 'CPU';
      try { await detector.initialize(delegate); }
      catch (error) { if (delegate !== 'GPU' || disposed) throw error; detector.dispose(); detector = new MediaPipePoseDetector(); delegate = 'CPU'; await detector.initialize(delegate); }
      if (!disposed) { ready = true; scope.postMessage({ type: 'ready', delegate }); }
    } else if (data.type === 'analyzeFrame') {
      try {
        if (!ready) throw new Error('Mô hình chưa sẵn sàng.');
        const start = performance.now(), frame = detector.detect(data.frame, data.timestampMs, data.width, data.height);
        for (const event of processor.process(frame, data.lighting, performance.now() - start)) scope.postMessage(event);
      } finally { data.frame.close(); }
    } else processor.command(data.type);
  } catch (error) { if (!disposed) scope.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Không thể phân tích hình ảnh.' }); }
};
