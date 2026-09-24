import { attentionFrame } from './attention';
import type { CanonicalPoseFrame } from '../../../../src/features/pose-analysis/types';

export function drillFrame(id: string, timestampMs: number): CanonicalPoseFrame {
  const frame = attentionFrame(timestampMs);
  if (id === 'atEase') frame.landmarks.leftKnee!.world!.z = 0.03;
  if (id === 'salute') {
    for (const [name, x, y] of [['rightElbow', 0.28, 0.26], ['rightWrist', 0.065, 0.13]] as const) {
      frame.landmarks[name]!.world = { x, y: y - 0.5, z: 0 };
      frame.landmarks[name]!.image = { x: 0.5 + x / frame.aspectRatio, y, z: 0 };
    }
  }
  return frame;
}
