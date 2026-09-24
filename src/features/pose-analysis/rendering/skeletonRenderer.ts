import type { CanonicalPoseFrame, Landmark, Vec3 } from '../types';
import { POSE_CONFIG } from '../config';
import { POSE_CONNECTIONS } from './poseTopology';

export interface SkeletonViewport {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export function getSkeletonViewport(containerWidth: number, containerHeight: number, aspectRatio: number): SkeletonViewport {
  const height = Math.min(containerHeight, containerWidth / aspectRatio);
  const width = height * aspectRatio;
  return { width, height, offsetX: (containerWidth - width) / 2, offsetY: (containerHeight - height) / 2 };
}

export function projectSkeletonPoint(viewport: SkeletonViewport, point: Vec3) {
  return { x: viewport.offsetX + point.x * viewport.width, y: viewport.offsetY + point.y * viewport.height };
}

function drawable(point: Landmark | undefined): point is Landmark {
  return !!point && Number.isFinite(point.confidence) && point.confidence >= POSE_CONFIG.landmarkConfidence &&
    Number.isFinite(point.visibility) && point.visibility >= POSE_CONFIG.landmarkConfidence &&
    (point.presence === null || (Number.isFinite(point.presence) && point.presence >= POSE_CONFIG.landmarkConfidence)) &&
    Number.isFinite(point.image.x) && Number.isFinite(point.image.y) &&
    point.image.x >= 0 && point.image.x <= 1 && point.image.y >= 0 && point.image.y <= 1;
}

export function shouldDrawSkeleton(frame: CanonicalPoseFrame | null): boolean {
  if (!frame || frame.personCount !== 1) return false;
  return Object.values(frame.landmarks).some(drawable);
}

export function drawSkeleton(canvas: HTMLCanvasElement, frame: CanonicalPoseFrame | null) {
  const rect = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(rect.width * dpr), height = Math.round(rect.height * dpr);
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, rect.width, rect.height);
  if (!frame || !shouldDrawSkeleton(frame) || !Number.isFinite(frame.aspectRatio) || frame.aspectRatio <= 0) return;
  // Same contain transform as <video>; no cropping and no double mirroring.
  const viewport = getSkeletonViewport(rect.width, rect.height, frame.aspectRatio);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.fillStyle = '#fef08a';
  for (const [a, b] of POSE_CONNECTIONS) {
    const p = frame.landmarks[a], q = frame.landmarks[b]; if (!drawable(p) || !drawable(q)) continue;
    const start = projectSkeletonPoint(viewport, p.image);
    const end = projectSkeletonPoint(viewport, q.image);
    ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y);
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(2, 6, 23, 0.8)'; ctx.stroke();
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#34d399'; ctx.stroke();
  }
  const names = new Set(POSE_CONNECTIONS.flat()); names.add('nose');
  for (const name of names) {
    const p = frame.landmarks[name]; if (!drawable(p)) continue;
    const point = projectSkeletonPoint(viewport, p.image);
    ctx.beginPath(); ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(2, 6, 23, 0.9)'; ctx.stroke(); ctx.fill();
  }
}
