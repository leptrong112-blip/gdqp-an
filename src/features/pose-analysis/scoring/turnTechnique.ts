import type { MotionBufferFrame } from '../pipeline/motionBuffer';
import { median } from '../pipeline/geometry';

export interface TurnTechniqueReport {
  status: 'observed' | 'unavailable';
  passed: boolean;
  rootTravel: number;
  pivotTravel: number;
  feedback: string;
}

// This detects travelling/stepping away from the pivot. A single RGB camera
// cannot certify pressure on the heel/toe or the exact foot-contact sequence.
export function analyzeTurnTechnique(frames: readonly MotionBufferFrame[], direction: 'left' | 'right', readyMs: number): TurnTechniqueReport {
  const unavailable = (): TurnTechniqueReport => ({ status: 'unavailable', passed: false, rootTravel: 0, pivotTravel: 0,
    feedback: 'Chưa đủ dữ liệu vị trí thân và điểm trụ bàn chân để xác nhận quay tại chỗ.' });
  if (!frames.length) return unavailable();
  const start = frames[0].timestampMs;
  const initial = frames.filter(f => f.timestampMs - start <= readyMs);
  const anchors = direction === 'left'
    ? ['leftHeelPosition', 'rightToePosition'] as const
    : ['rightHeelPosition', 'leftToePosition'] as const;
  type PositionKey = 'imageRoot' | typeof anchors[number];
  const baseline = (key: PositionKey) => {
    const positions = initial.flatMap(f => f[key] ? [f[key]!] : []).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
    return positions.length >= 3 ? { x: median(positions.map(p => p.x)), y: median(positions.map(p => p.y)) } : null;
  };
  const root = baseline('imageRoot'), anchorStart = anchors.map(baseline);
  if (!root || !anchorStart.some(Boolean)) return unavailable();
  const moving = frames.filter(f => f.timestampMs - start > readyMs && f.isReliable);
  let measured = 0, rootTravel = 0, pivotTravel = 0, badSince: number | null = null, walking = false;
  for (const f of moving) {
    const p = f.imageRoot;
    const drifts = anchors.flatMap((key, i) => {
      const a = anchorStart[i], b = f[key];
      return a && b && Number.isFinite(b.x) && Number.isFinite(b.y) ? [Math.hypot(b.x - a.x, b.y - a.y)] : [];
    });
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || !drifts.length) { badSince = null; continue; }
    measured++;
    const rootDrift = Math.hypot(p.x - root.x, p.y - root.y);
    // The more stable observed pivot allows the free foot to close normally.
    const pivotDrift = Math.min(...drifts);
    rootTravel = Math.max(rootTravel, rootDrift); pivotTravel = Math.max(pivotTravel, pivotDrift);
    if ((rootDrift > 0.45 && pivotDrift > 0.35) || pivotDrift > 0.7) {
      badSince ??= f.timestampMs;
      if (f.timestampMs - badSince >= 200) walking = true;
    } else badSince = null;
  }
  if (measured < 5 || measured < moving.length * 0.3) return unavailable();
  return { status: 'observed', passed: !walking, rootTravel, pivotTravel,
    feedback: walking ? 'Đã bước dịch chuyển khi quay: thân và điểm trụ bàn chân rời vị trí. Hãy xoay tại chỗ rồi đưa chân còn lại về khép.'
      : 'Vị trí thân và điểm trụ quan sát được phù hợp với quay tại chỗ.' };
}
