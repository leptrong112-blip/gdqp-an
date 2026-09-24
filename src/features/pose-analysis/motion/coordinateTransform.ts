import type { Vec3Tuple } from './motionContract';

/**
 * Canonical MediaPipe world data used by the existing QPAN pipeline has:
 * - X increasing toward camera-right,
 * - Y increasing downward,
 * - Z carrying the unmirrored depth signal.
 *
 * The authored soldier has +Y up, +Z forward and anatomical left on +X.
 * A 180-degree rotation around Z maps the two conventions without introducing
 * a reflection: model = [-source.x, -source.y, source.z]. UI mirroring remains
 * presentation-only and must never be passed to this transform.
 */
export function mediaPipeWorldToModel(point: { readonly x: number; readonly y: number; readonly z: number }): [number, number, number] {
  return [-point.x, -point.y, point.z];
}

export function mediaPipeTupleToModel(point: Vec3Tuple): [number, number, number] {
  return [-point[0], -point[1], point[2]];
}

export function isFiniteVec3(point: ArrayLike<number>): boolean {
  return point.length >= 3 && Number.isFinite(point[0]) && Number.isFinite(point[1]) && Number.isFinite(point[2]);
}
