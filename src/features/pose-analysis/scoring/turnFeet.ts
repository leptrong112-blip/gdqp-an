import type { NormalizedPoseFrame, Vec3 } from '../types';
import type { MotionBufferFrame } from '../pipeline/motionBuffer';
import type { CriterionResult } from './scoringTypes';
import { angleBetween, distance, mad, median, midpoint, subtract } from '../pipeline/geometry';

/** Foot geometry in the plane perpendicular to the upright torso.
 * Uses observed world landmarks, never the compressed side-on image angle.
 */
export function measureTurnFeet(frame: NormalizedPoseFrame): { footOpeningAngle: number; heelGapRatio: number } | undefined {
  const names = ['leftHeel', 'rightHeel', 'leftFootIndex', 'rightFootIndex', 'leftShoulder', 'rightShoulder', 'leftHip', 'rightHip'] as const;
  if (names.some(n => !frame.worldBody[n] || (frame.landmarks[n]?.confidence ?? 0) < .7)) return;
  const w = frame.worldBody;
  const up = subtract(midpoint(w.leftShoulder!, w.rightShoulder!), midpoint(w.leftHip!, w.rightHip!));
  const length = Math.hypot(up.x, up.y, up.z), width = distance(w.leftShoulder!, w.rightShoulder!);
  if (!Number.isFinite(length) || !Number.isFinite(width) || length < .1 || width < .1) return;
  const normal = { x: up.x / length, y: up.y / length, z: up.z / length };
  const project = (v: Vec3) => {
    const dot = v.x * normal.x + v.y * normal.y + v.z * normal.z;
    return { x: v.x - dot * normal.x, y: v.y - dot * normal.y, z: v.z - dot * normal.z };
  };
  const left = project(subtract(w.leftFootIndex!, w.leftHeel!));
  const right = project(subtract(w.rightFootIndex!, w.rightHeel!));
  const ll = Math.hypot(left.x, left.y, left.z), rl = Math.hypot(right.x, right.y, right.z);
  if ([ll / width, rl / width].some(v => !Number.isFinite(v) || v < .15 || v > 1.2) || ll / rl < .4 || ll / rl > 2.5) return;
  const lateral = project(subtract(w.rightShoulder!, w.leftShoulder!));
  const lateralLength = Math.hypot(lateral.x, lateral.y, lateral.z);
  if (lateralLength < .1) return;
  const outward = (v: Vec3, length: number) => (v.x * lateral.x + v.y * lateral.y + v.z * lateral.z) / (length * lateralLength);
  const inward = outward(left, ll) > .1 || outward(right, rl) < -.1;
  const footOpeningAngle = inward ? -angleBetween(left, right) : angleBetween(left, right);
  const gap = project(subtract(w.leftHeel!, w.rightHeel!));
  const heelGapRatio = Math.hypot(gap.x, gap.y, gap.z) / width;
  if (Number.isFinite(footOpeningAngle) && Number.isFinite(heelGapRatio)) return { footOpeningAngle, heelGapRatio };
}

export function scoreTurnFeet(frames: readonly MotionBufferFrame[], phase: 'ready' | 'final'): CriterionResult {
  const label = phase === 'ready' ? 'Bàn chân khi chuẩn bị' : 'Bàn chân khi kết thúc';
  const valid = frames.filter(f => f.isReliable && Number.isFinite(f.footOpeningAngle) && Number.isFinite(f.heelGapRatio));
  const observed = valid.length >= 3 && valid.at(-1)!.timestampMs - valid[0].timestampMs >= 200 &&
    valid.length >= frames.length * .6 && valid.every((f, i) => !i || f.timestampMs - valid[i - 1].timestampMs <= 250);
  const angle = median(valid.map(f => f.footOpeningAngle!)), gap = median(valid.map(f => f.heelGapRatio!));
  const consistent = mad(valid.map(f => f.footOpeningAngle!)) <= 10 && mad(valid.map(f => f.heelGapRatio!)) <= .07;
  if (!observed || !consistent) return { id: phase === 'ready' ? 'feetReady' : 'feetFinal', label,
    points: 0, maximum: 5, required: true, status: 'improve', statusLevel: 'NOT_SCORABLE', mistakes: [], measurements: [],
    feedback: `Camera chưa quan sát rõ hai bàn chân ${phase === 'ready' ? 'lúc chuẩn bị' : 'ở tư thế cuối'}. Phần này chưa được đánh giá, không trừ điểm vì thiếu hình ảnh.` };
  const good = angle >= 25 && angle <= 65 && gap <= .25;
  const acceptable = angle >= 15 && angle <= 75 && gap <= .4;
  const mistakes: string[] = [];
  if (angle < 0) mistakes.push('Mũi chân đang hướng vào trong, chưa mở chữ V ra ngoài.');
  else if (angle < 25) mistakes.push('Hai mũi chân chưa mở thành chữ V rõ ràng.');
  if (angle > 65) mistakes.push('Hai mũi chân mở quá rộng so với tư thế chữ V.');
  if (gap > .25) mistakes.push('Hai gót chân còn cách xa nhau, cần khép gần sát.');
  return { id: phase === 'ready' ? 'feetReady' : 'feetFinal', label, points: good ? 5 : acceptable ? 3 : 0,
    maximum: 5, required: true, status: good ? 'good' : 'improve', statusLevel: good ? 'PASS' : acceptable ? 'NEEDS_ADJUSTMENT' : 'NOT_ACHIEVED',
    feedback: good ? `${label}: hai gót gần sát, hai mũi chân mở chữ V.` : `${label}: ${mistakes.join(' ')}`,
    mistakes: mistakes.map(m => `${label}: ${m}`),
    measurements: [{ feature: 'footOpeningAngle', value: angle, variability: mad(valid.map(f => f.footOpeningAngle!)) },
      { feature: 'heelGapRatio', value: gap, variability: mad(valid.map(f => f.heelGapRatio!)) }] };
}
