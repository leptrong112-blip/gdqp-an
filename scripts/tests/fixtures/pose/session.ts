import type { SessionProcessor } from '../../../../src/features/pose-analysis/runtime/sessionProcessor';
import { attentionFrame, goodLighting } from './attention';

/** Start test actions from the real command, not a hard-coded countdown deadline. */
export function waitForPoseCommand(session: SessionProcessor): number {
  for (let t = 0; t <= 1500; t += 100) session.process(attentionFrame(t), goodLighting, 20);
  session.command('startCalibration');
  for (let t = 1600; t <= 20000; t += 100) {
    const events = session.process(attentionFrame(t), goodLighting, 20);
    if (events.some(e => e.type === 'commandCue' && e.command !== 'THÔI')) return t;
  }
  throw new Error('No exercise command after valid preparation');
}
