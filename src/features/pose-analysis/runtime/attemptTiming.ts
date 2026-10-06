import type { MovementId } from '../types';

/** Epoch-based monotonic timestamps share a clock across main thread and worker. */
export const poseNowMs = () => performance.timeOrigin + performance.now();

export interface PoseAttemptContext {
  id: string;
  movementId: MovementId;
  startedAt: string;
  startedAtMs: number;
  frameTimeOriginMs: number;
}

export interface PoseFinalTiming {
  attemptStartedAtMs: number;
  qualityReadyAtMs?: number;
  countdownFinishedAtMs?: number;
  scoringWindowFinishedAtMs?: number;
  finalFrameProcessedAtMs: number;
  resultFinalizedAtMs: number;
  uiReceivedAtMs?: number;
  inferenceMs: number;
  workerLatencyMs?: number;
  finalizationMs: number;
  processingLatencyMs: number;
}

export interface PoseFinalAttempt {
  id: string;
  movementId: MovementId;
  startedAt: string;
  finishedAt: string;
  timing: PoseFinalTiming;
}

export function createPoseAttempt(movementId: MovementId): PoseAttemptContext {
  const startedAtMs = poseNowMs();
  // Older/insecure browser contexts may lack randomUUID before the camera gate.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID()
    : `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  return Object.freeze({
    id, movementId, startedAt: new Date(startedAtMs).toISOString(),
    startedAtMs, frameTimeOriginMs: performance.timeOrigin,
  });
}

/** Clone before freezing: callers cannot change prior steps through shared arrays. */
export function freezeSnapshot<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return Object.freeze(value.map(item => freezeSnapshot(item))) as T;
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, freezeSnapshot(item)]))) as T;
}
