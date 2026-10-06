import { attentionFrame } from './attention';
import { attachSaluteHand } from './hand';
import type { CanonicalPoseFrame } from '../../../../src/features/pose-analysis/types';

export function drillFrame(id: string, timestampMs: number): CanonicalPoseFrame {
  const frame = attentionFrame(timestampMs);
  if (id === 'atEase') frame.landmarks.leftKnee!.world!.z = 0.03;
  if (id === 'salute') {
    for (const [name, x, y] of [['rightElbow', 0.28, 0.26], ['rightWrist', 0.065, 0.13]] as const) {
      frame.landmarks[name]!.world = { x, y: y - 0.5, z: 0 };
      frame.landmarks[name]!.image = { x: 0.5 + x / frame.aspectRatio, y, z: 0 };
    }
    attachSaluteHand(frame);
  }
  return frame;
}

/** Synthetic detector observations along a raise (not renderer-generated scoring frames). */
export function saluteMotionFrame(timestampMs: number, commandMs: number, durationMs = 1000): CanonicalPoseFrame {
  const start = attentionFrame(timestampMs), end = drillFrame('salute', timestampMs);
  const fraction = Math.max(0, Math.min(1, (timestampMs - commandMs) / durationMs));
  const original = attentionFrame(timestampMs);
  for (const [parent, name] of [['rightShoulder','rightElbow'], ['rightElbow','rightWrist']] as const) {
    const a = original.landmarks[parent]!.world!, b = original.landmarks[name]!.world!;
    const c = end.landmarks[parent]!.world!, d = end.landmarks[name]!.world!;
    const initialAngle = Math.atan2(b.y-a.y,b.x-a.x), finalAngle = Math.atan2(d.y-c.y,d.x-c.x);
    const delta = Math.atan2(Math.sin(finalAngle-initialAngle), Math.cos(finalAngle-initialAngle));
    const angle = initialAngle+delta*fraction;
    const length = Math.hypot(b.x-a.x,b.y-a.y)*(1-fraction)+Math.hypot(d.x-c.x,d.y-c.y)*fraction;
    const root = start.landmarks[parent]!.world!;
    const world = { x: root.x+Math.cos(angle)*length, y:root.y+Math.sin(angle)*length, z:0 };
    start.landmarks[name]!.world=world;
    start.landmarks[name]!.image={x:.5+world.x/start.aspectRatio,y:.5+world.y,z:0};
  }
  if (fraction >= .9) attachSaluteHand(start);
  return start;
}
