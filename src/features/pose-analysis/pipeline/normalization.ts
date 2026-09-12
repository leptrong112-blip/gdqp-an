import type { CalibrationProfile, CanonicalPoseFrame, LandmarkName, NormalizedPoseFrame } from '../types';
import { distance, flat, mad, median, midpoint, scale, subtract, variation } from './geometry';
export function measurements(frame: CanonicalPoseFrame) {
  const p = frame.landmarks, ls = p.leftShoulder, rs = p.rightShoulder, lh = p.leftHip, rh = p.rightHip;
  if (!ls || !rs || !lh || !rh || !p.leftAnkle || !p.rightAnkle) return null;
  const shoulders = midpoint(flat(ls.image), flat(rs.image)), root = midpoint(flat(lh.image), flat(rh.image));
  const shoulderWidth = distance(flat(ls.image), flat(rs.image)), hipWidth = distance(flat(lh.image), flat(rh.image));
  const torsoLength = distance(shoulders, root), legLength = (distance(flat(lh.image), flat(p.leftAnkle.image)) + distance(flat(rh.image), flat(p.rightAnkle.image))) / 2;
  const worldScale = ls.world && rs.world ? distance(ls.world, rs.world) : NaN;
  return { root, shoulderWidth, hipWidth, torsoLength, legLength, bodyScale: median([shoulderWidth, hipWidth * 1.15, torsoLength * 0.85]), worldScale };
}
export function createCalibration(frames: CanonicalPoseFrame[]): CalibrationProfile | null {
  const m = frames.map(measurements).filter((v): v is NonNullable<typeof v> => !!v);
  if (m.length < 12) return null;
  for (const key of ['shoulderWidth', 'hipWidth', 'torsoLength', 'legLength', 'worldScale'] as const) {
    if (m.some(v => !Number.isFinite(v[key]) || v[key] <= 0.001) || variation(m.map(v => v[key])) > 0.12) return null;
  }
  const med = (key: keyof typeof m[number]) => median(m.map(v => v[key] as number));
  return { bodyScale: med('bodyScale'), worldScale: med('worldScale'), shoulderWidth: med('shoulderWidth'), hipWidth: med('hipWidth'), torsoLength: med('torsoLength'), legLength: med('legLength'), baselineJitter: mad(m.map(v => v.root.x)) / med('torsoLength'), coverage: 1, frontFacing: true, sampleCount: m.length };
}
export function normalizePose(frame: CanonicalPoseFrame, profile: CalibrationProfile): NormalizedPoseFrame | null {
  const m = measurements(frame), lh = frame.landmarks.leftHip?.world, rh = frame.landmarks.rightHip?.world;
  if (!m || !lh || !rh || profile.bodyScale <= 0 || profile.worldScale <= 0) return null;
  const root = midpoint(lh, rh), body: NormalizedPoseFrame['body'] = {}, worldBody: NormalizedPoseFrame['worldBody'] = {};
  for (const [key, p] of Object.entries(frame.landmarks)) {
    const name = key as LandmarkName;
    body[name] = scale(subtract(flat(p.image), m.root), profile.bodyScale);
    if (p.world) worldBody[name] = scale(subtract(p.world, root), profile.worldScale);
  }
  return { ...frame, body, worldBody };
}
