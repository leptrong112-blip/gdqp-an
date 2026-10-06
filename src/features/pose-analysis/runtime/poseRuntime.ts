import type { LightingMetrics } from '../types';
import type { PoseDetector, SessionCommand, WorkerCommand, WorkerEvent } from './workerProtocol';
import { SessionProcessor } from './sessionProcessor';
import type { SequenceEngine } from '../scoring/sequenceEngine';
import { poseNowMs, type PoseAttemptContext } from './attemptTiming';
import { FrameFreshnessGate, MAX_TRANSPORT_FRAME_AGE_MS } from './frameFreshness';
export interface PoseRuntime {
  mode: string;
  fallback: boolean;
  sequenceEngine: SequenceEngine['kind'];
  analyze(source: HTMLVideoElement, timestamp: number, lighting: LightingMetrics): Promise<void>;
  command(command: SessionCommand, attempt?: PoseAttemptContext): void;
  dispose(): void;
}
export async function createPoseRuntime(signal: AbortSignal, emit: (event: WorkerEvent) => void, preferGpu = false, prepareHands = false): Promise<PoseRuntime> {
  if (typeof Worker !== 'undefined' && typeof createImageBitmap === 'function' && typeof OffscreenCanvas !== 'undefined') {
    try { return await workerRuntime(signal, emit, preferGpu, prepareHands); }
    catch (error) { if (signal.aborted) throw error; /* Unsupported worker runtimes fall back to the same local pipeline. */ }
  }
  const { MediaPipePoseDetector } = await import('./MediaPipePoseDetector');
  const { loadSequenceEngine } = await import('./loadSequenceEngine');
  if (signal.aborted) throw new Error('Phiên đã dừng.');
  const detector: PoseDetector = new MediaPipePoseDetector();
  const sequenceReady = loadSequenceEngine();
  const dispose = () => detector.dispose();
  signal.addEventListener('abort', dispose, { once: true });
  try { await detector.initialize('CPU'); if (prepareHands && !signal.aborted) await detector.prepareHands?.(); }
  catch (error) { dispose(); signal.removeEventListener('abort', dispose); throw error; }
  const sequenceEngine = await sequenceReady;
  const processor = new SessionProcessor(sequenceEngine);
  const freshness = new FrameFreshnessGate();
  if (signal.aborted) { dispose(); throw new Error('Phiên đã dừng.'); }
  return {
    mode: 'CPU · chế độ tương thích', fallback: true,
    sequenceEngine: sequenceEngine.kind,
    async analyze(video, timestamp, lighting) {
      if (signal.aborted || processor.isFinalized) return;
      if (!freshness.accept(timestamp, performance.timeOrigin + timestamp, poseNowMs())) return;
      const start = performance.now(), frame = detector.detect(video, timestamp, video.videoWidth, video.videoHeight, processor.needsHandTracking);
      for (const event of processor.process(frame, lighting, performance.now() - start)) {
        if (event.type === 'analysis') event.snapshot.performance = { ...event.snapshot.performance, workerLatencyMs: 0, landmarkAgeMs: Math.max(0, performance.now() - timestamp) };
        emit(event);
      }
    },
    command: (command, attempt) => {
      if (command === 'reset' || command.startsWith('select')) freshness.reset();
      if (command === 'selectSalute' || command === 'selectBasicDrill') void detector.prepareHands?.();
      processor.command(command, attempt);
    },
    dispose() { signal.removeEventListener('abort', dispose); dispose(); },
  };
}
function workerRuntime(signal: AbortSignal, emit: (event: WorkerEvent) => void, preferGpu: boolean, prepareHands: boolean): Promise<PoseRuntime> {
  return new Promise((resolve, reject) => {
    // Classic worker is intentional: the pinned WASM loader calls importScripts.
    const worker = new Worker(new URL('./pose.worker.ts', import.meta.url));
    let ready = false, closed = false, capturing = false, finalized = false;
    let attempt: PoseAttemptContext | undefined;
    let pending: { resolve: () => void; reject: (error: Error) => void; sentAtMs: number; attemptId?: string } | null = null;
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
          sequenceEngine: data.sequenceEngine,
          async analyze(video, timestampMs, lighting) {
            if (closed || finalized || pending || capturing) return;
            const capturedAttemptId = attempt?.id;
            const captureStartedAt = performance.now();
            capturing = true;
            let frame: ImageBitmap;
            try { frame = await createImageBitmap(video); } finally { capturing = false; }
            if (closed || capturedAttemptId !== attempt?.id || finalized || performance.now() - captureStartedAt > MAX_TRANSPORT_FRAME_AGE_MS) { frame.close(); return; }
            return new Promise<void>((done, failed) => {
              pending = { resolve: done, reject: failed, sentAtMs: poseNowMs(), attemptId: capturedAttemptId };
              try { send({ type: 'analyzeFrame', frame, timestampMs, width: frame.width, height: frame.height, lighting, attemptId: capturedAttemptId, sentAtMs: pending.sentAtMs, capturedAtMs: performance.timeOrigin + timestampMs }, [frame]); }
              catch (error) { frame.close(); pending = null; failed(error instanceof Error ? error : new Error('Không thể gửi hình ảnh.')); }
            });
          },
          command(command, context) { if (!closed) { finalized = false; if (context) attempt = context; send({ type: command, attempt: context }); } },
          dispose,
        });
      } else {
        if (data.type === 'analysis' && data.snapshot?.frame) data.snapshot.performance = { ...data.snapshot.performance,
          landmarkAgeMs: Math.max(0, poseNowMs() - (performance.timeOrigin + data.snapshot.frame.timestampMs)) };
        if (data.type === 'score') {
          if (data.attemptId === attempt?.id) finalized = true;
          if (data.timing && pending?.attemptId === data.attemptId) {
            data.timing = { ...data.timing, workerLatencyMs: (data.timing.workerLatencyMs ?? 0) + Math.max(0, poseNowMs() - data.timing.resultFinalizedAtMs) };
          }
        }
        if (data.type !== 'frameComplete' &&
          ((data.type !== 'score' && data.type !== 'analysis' && data.type !== 'commandCue') || data.attemptId === attempt?.id)) emit(data);
        if ((data.type === 'analysis' || data.type === 'score' || data.type === 'frameComplete') && pending?.attemptId === data.attemptId) {
          pending.resolve(); pending = null;
        }
      }
    };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort(); else send({ type: 'initialize', delegate: preferGpu ? 'GPU' : 'CPU', prepareHands });
  });
}
