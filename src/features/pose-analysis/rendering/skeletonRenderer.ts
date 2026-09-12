import type { CanonicalPoseFrame } from '../types';
import { POSE_CONNECTIONS } from './poseTopology';
export function drawSkeleton(canvas: HTMLCanvasElement, frame: CanonicalPoseFrame | null) {
  const rect = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(rect.width * dpr), height = Math.round(rect.height * dpr);
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, rect.width, rect.height);
  if (!frame || frame.personCount !== 1) return;
  // Same contain transform as <video>; no cropping and no double mirroring.
  const h = Math.min(rect.height, rect.width / frame.aspectRatio), w = h * frame.aspectRatio;
  const offsetX = (rect.width - w) / 2, offsetY = (rect.height - h) / 2;
  ctx.lineWidth = 2.5; ctx.strokeStyle = '#34d399'; ctx.fillStyle = '#fef08a';
  for (const [a, b] of POSE_CONNECTIONS) {
    const p = frame.landmarks[a], q = frame.landmarks[b]; if (!p || !q) continue;
    ctx.beginPath(); ctx.moveTo(offsetX + p.image.x * h, offsetY + p.image.y * h); ctx.lineTo(offsetX + q.image.x * h, offsetY + q.image.y * h); ctx.stroke();
  }
  const names = new Set(POSE_CONNECTIONS.flat()); names.add('nose');
  for (const name of names) { const p = frame.landmarks[name]; if (!p) continue; ctx.beginPath(); ctx.arc(offsetX + p.image.x * h, offsetY + p.image.y * h, 3.5, 0, Math.PI * 2); ctx.fill(); }
}
