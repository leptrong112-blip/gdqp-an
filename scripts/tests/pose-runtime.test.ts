import test from 'node:test';
import assert from 'node:assert/strict';
import { createPoseRuntime } from '../../src/features/pose-analysis/runtime/poseRuntime';
import type { WorkerCommand, WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';
import { goodLighting } from './fixtures/pose/attention';
test('worker transport drops overlap, closes late bitmaps and disposes on abort', async () => {
  const keys = ['Worker', 'OffscreenCanvas', 'createImageBitmap'] as const;
  const original = keys.map(key => Object.getOwnPropertyDescriptor(globalThis, key));
  const workers: FakeWorker[] = [];
  class FakeWorker {
    onmessage: ((event: { data: WorkerEvent }) => void) | null = null;
    onerror: unknown; onmessageerror: unknown; messages: WorkerCommand[] = []; terminated = false;
    constructor() { workers.push(this); }
    postMessage(command: WorkerCommand) {
      this.messages.push(command);
      if (command.type === 'initialize') queueMicrotask(() => this.onmessage?.({ data: { type: 'ready', delegate: 'CPU' } }));
      if (command.type === 'dispose') queueMicrotask(() => this.onmessage?.({ data: { type: 'disposed' } }));
    }
    terminate() { this.terminated = true; }
  }
  let finishBitmap: (image: ImageBitmap) => void = () => {};
  Object.defineProperty(globalThis, 'Worker', { configurable: true, value: FakeWorker });
  Object.defineProperty(globalThis, 'OffscreenCanvas', { configurable: true, value: class {} });
  Object.defineProperty(globalThis, 'createImageBitmap', { configurable: true, value: () => new Promise<ImageBitmap>(resolve => { finishBitmap = resolve; }) });
  try {
    const abort = new AbortController(), events: WorkerEvent[] = [];
    const runtime = await createPoseRuntime(abort.signal, event => events.push(event));
    let closed = false;
    const pending = runtime.analyze({ videoWidth: 640, videoHeight: 480 } as HTMLVideoElement, 100, goodLighting);
    await runtime.analyze({ videoWidth: 640, videoHeight: 480 } as HTMLVideoElement, 101, goodLighting);
    abort.abort(); finishBitmap({ close() { closed = true; } } as ImageBitmap); await pending;
    await Promise.resolve(); assert.equal(closed, true); assert.equal(workers[0].terminated, true);
    assert.equal(workers[0].messages.some(m => m.type === 'analyzeFrame'), false);
    runtime.command('startCalibration'); assert.equal(workers[0].messages.some(m => m.type === 'startCalibration'), false);
    workers[0].onmessage?.({ data: { type: 'error', message: 'late error' } }); assert.equal(events.length, 0);
  } finally { keys.forEach((key, i) => { if (original[i]) Object.defineProperty(globalThis, key, original[i]!); else Reflect.deleteProperty(globalThis, key); }); }
});
