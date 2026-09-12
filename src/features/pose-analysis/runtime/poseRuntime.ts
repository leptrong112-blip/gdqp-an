import type { LightingMetrics } from '../types';
import type { PoseDetector, SessionCommand, WorkerCommand, WorkerEvent } from './workerProtocol';
import { SessionProcessor } from './sessionProcessor';
export interface PoseRuntime {
  mode: string;
  fallback: boolean;
  analyze(source: HTMLVideoElement, timestamp: number, lighting: LightingMetrics): Promise<void>;
  command(command: SessionCommand): void;
  dispose(): void;
}
export async function createPoseRuntime(signal: AbortSignal, emit: (event: WorkerEvent) => void, preferGpu = false): Promise<PoseRuntime> {
  if (typeof Worker !== 'undefined' && typeof createImageBitmap === 'function' && typeof OffscreenCanvas !== 'undefined') {
    try { return await workerRuntime(signal, emit, preferGpu); }
    catch (error) { if (signal.aborted) throw error; /* Unsupported worker runtimes fall back to the same local pipeline. */ }
  }
  const { MediaPipePoseDetector } = await import('./MediaPipePoseDetector');
  if (signal.aborted) throw new Error('Phiên đã dừng.');
  const detector: PoseDetector = new MediaPipePoseDetector(), processor = new SessionProcessor();
  const dispose = () => detector.dispose();
  signal.addEventListener('abort', dispose, { once: true });
  try { await detector.initialize('CPU'); }
  catch (error) { dispose(); signal.removeEventListener('abort', dispose); throw error; }
  if (signal.aborted) { dispose(); throw new Error('Phiên đã dừng.'); }
  return {
    mode: 'CPU · chế độ tương thích', fallback: true,
    async analyze(video, timestamp, lighting) {
      if (signal.aborted) return;
      const start = performance.now(), frame = detector.detect(video, timestamp, video.videoWidth, video.videoHeight);
      for (const event of processor.process(frame, lighting, performance.now() - start)) emit(event);
    },
    command: command => processor.command(command),
    dispose() { signal.removeEventListener('abort', dispose); dispose(); },
  };
}
function workerRuntime(signal: AbortSignal, emit: (event: WorkerEvent) => void, preferGpu: boolean): Promise<PoseRuntime> {
  return new Promise((resolve, reject) => {
    // Classic worker is intentional: the pinned WASM loader calls importScripts.
    const worker = new Worker(new URL('./pose.worker.ts', import.meta.url));
    let ready = false, closed = false, capturing = false, pending: { resolve: () => void; reject: (error: Error) => void } | null = null;
    let killTimer: ReturnType<typeof setTimeout> | undefined;
    const send = (data: WorkerCommand, transfer: Transferable[] = []) => worker.postMessage(data, transfer);
    const timeout = setTimeout(() => failure(new Error('Khởi tạo mô hình quá lâu.')), 45000);
    const dispose = () => {
      if (closed) return;
      closed = true; clearTimeout(timeout); signal.removeEventListener('abort', abort);
      pending?.reject(new Error('Phiên đã dừng.')); pending = null;
      try { send({ type: 'dispose' }); } catch { worker.terminate(); }
      killTimer = setTimeout(() => worker.terminate(), 1000);
      if (!ready) reject(new Error('Phiên đã dừng.'));
    };
    const abort = () => dispose();
    const failure = (error: Error) => {
      if (closed) return;
      if (!ready) reject(error); else { pending?.reject(error); pending = null; emit({ type: 'error', message: error.message }); }
      dispose();
    };
    worker.onerror = event => { event.preventDefault(); failure(new Error(event.message || 'Web Worker không khả dụng.')); };
    worker.onmessageerror = () => failure(new Error('Không thể truyền dữ liệu hình ảnh.'));
    worker.onmessage = ({ data }: MessageEvent<WorkerEvent>) => {
      if (data.type === 'disposed') { clearTimeout(killTimer); worker.terminate(); return; }
      if (closed) return;
      if (data.type === 'error') { failure(new Error(data.message)); return; }
      if (data.type === 'ready') {
        ready = true; clearTimeout(timeout);
        resolve({
          mode: `${data.delegate} · Web Worker`, fallback: false,
          async analyze(video, timestampMs, lighting) {
            if (closed || pending || capturing) return;
            capturing = true;
            let frame: ImageBitmap;
            try { frame = await createImageBitmap(video); } finally { capturing = false; }
            if (closed) { frame.close(); return; }
            return new Promise<void>((done, failed) => {
              pending = { resolve: done, reject: failed };
              try { send({ type: 'analyzeFrame', frame, timestampMs, width: video.videoWidth, height: video.videoHeight, lighting }, [frame]); }
              catch (error) { frame.close(); pending = null; failed(error instanceof Error ? error : new Error('Không thể gửi hình ảnh.')); }
            });
          },
          command(command) { if (!closed) send({ type: command }); },
          dispose,
        });
      } else { emit(data); if (data.type === 'analysis') { pending?.resolve(); pending = null; } }
    };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort(); else send({ type: 'initialize', delegate: preferGpu ? 'GPU' : 'CPU' });
  });
}
