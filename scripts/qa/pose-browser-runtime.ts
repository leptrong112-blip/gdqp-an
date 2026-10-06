/** Test-only detector replacement. SessionProcessor, hook, UI and API remain real. */
import { SessionProcessor } from '../../src/features/pose-analysis/runtime/sessionProcessor';
import { attentionFrame, goodLighting } from '../tests/fixtures/pose/attention';
import { drillFrame, saluteMotionFrame } from '../tests/fixtures/pose/drill';
import type { PoseRuntime } from '../../src/features/pose-analysis/runtime/poseRuntime';
import type { WorkerEvent } from '../../src/features/pose-analysis/runtime/workerProtocol';
import type { MovementId, AnalysisSnapshot } from '../../src/features/pose-analysis/types';

export async function createPoseRuntime(signal: AbortSignal, emit: (event: WorkerEvent) => void): Promise<PoseRuntime> {
  const processor = new SessionProcessor();
  let movement: MovementId = 'attention', snapshot: AnalysisSnapshot | null = null;
  let saluteCommandMs: number | undefined;
  return {
    mode: 'QA synthetic detector · REAL SessionProcessor', fallback: false, sequenceEngine: 'javascript',
    command(command, attempt) {
      if (attempt) movement = attempt.movementId;
      snapshot = null; saluteCommandMs = undefined; processor.command(command, attempt);
    },
    async analyze(_video, timestamp) {
      if (signal.aborted || processor.isFinalized) return;
      const posture = processor.expectedPostureId;
      const events = processor.process(posture === 'salute' && saluteCommandMs !== undefined ? saluteMotionFrame(timestamp, saluteCommandMs) : drillFrame(posture, timestamp), goodLighting, 0);
      if (events.some(e => e.type === 'commandCue' && e.command === 'CHÀO')) saluteCommandMs = timestamp;
      for (const event of events) {
        if (event.type === 'analysis') snapshot = event.snapshot;
        emit(event);
        if (event.type === 'score') {
          const before = JSON.stringify(event.result);
          const lateEvents = Array.from({ length: 20 }, (_, index) => processor.process(attentionFrame(timestamp + index + 1), goodLighting, 0)).flat();
          void fetch('/__qa/evidence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
            id: event.attemptId, timing: event.timing, score: event.result.status === 'scored' ? event.result.total : null,
            immutable: Object.isFrozen(event.result) && before === JSON.stringify(event.result), lateEvents: lateEvents.length,
            steps: event.result.drill?.steps.map(step => ({ movementId: step.movementId, score: step.result.status === 'scored' ? step.result.total : null })),
          }) });
        }
      }
    },
    dispose() {},
  };
}
