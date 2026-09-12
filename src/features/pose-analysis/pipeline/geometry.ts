import type { Vec3 } from '../types';
export const distance = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export const midpoint = (a: Vec3, b: Vec3): Vec3 => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 });
export const subtract = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const scale = (a: Vec3, s: number): Vec3 => ({ x: a.x / s, y: a.y / s, z: a.z / s });
export const flat = (a: Vec3): Vec3 => ({ x: a.x, y: a.y, z: 0 });
export function angleBetween(a: Vec3, b: Vec3): number {
  const denominator = Math.hypot(a.x, a.y, a.z) * Math.hypot(b.x, b.y, b.z);
  return denominator < 1e-8 ? NaN : Math.acos(Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y + a.z * b.z) / denominator))) * 180 / Math.PI;
}
export const angleAt3D = (a: Vec3, b: Vec3, c: Vec3) => angleBetween(subtract(a, b), subtract(c, b));
export const angleAt2D = (a: Vec3, b: Vec3, c: Vec3) => angleAt3D(flat(a), flat(b), flat(c));
export const horizontalTilt = (a: Vec3, b: Vec3) => Math.atan2(Math.abs(a.y - b.y), Math.abs(a.x - b.x)) * 180 / Math.PI;
export function median(values: number[]): number {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b), mid = Math.floor(sorted.length / 2);
  return sorted.length ? (sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2) : NaN;
}
export const mad = (values: number[]) => { const m = median(values); return median(values.map(v => Math.abs(v - m))); };
export const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
export function variation(values: number[]) { const m = mean(values); return m > 1e-8 ? Math.sqrt(mean(values.map(v => (v - m) ** 2))) / m : Infinity; }

/**
 * Tính góc xoay thân (Body Yaw) theo độ (°), kết hợp cả vai và hông từ 3D world landmarks.
 * - Nhìn chính diện camera: ~0°
 * - Quay trái (bên trái cơ thể): góc dương (+90°)
 * - Quay phải (bên phải cơ thể): góc âm (-90°)
 * Bất biến với việc hiển thị lật gương (mirrored display) trên giao diện.
 */
export function calculateBodyYaw(
  leftShoulder?: Vec3,
  rightShoulder?: Vec3,
  leftHip?: Vec3,
  rightHip?: Vec3
): number | null {
  const vectors: { dx: number; dz: number }[] = [];
  if (leftShoulder && rightShoulder) {
    vectors.push({
      dx: leftShoulder.x - rightShoulder.x,
      dz: leftShoulder.z - rightShoulder.z,
    });
  }
  if (leftHip && rightHip) {
    vectors.push({
      dx: leftHip.x - rightHip.x,
      dz: leftHip.z - rightHip.z,
    });
  }
  if (!vectors.length) return null;
  const avgDx = mean(vectors.map(v => v.dx));
  const avgDz = mean(vectors.map(v => v.dz));
  const norm = Math.hypot(avgDx, avgDz);
  if (norm < 1e-6) return null;
  return Math.atan2(avgDz, Math.abs(avgDx)) * (180 / Math.PI);
}
