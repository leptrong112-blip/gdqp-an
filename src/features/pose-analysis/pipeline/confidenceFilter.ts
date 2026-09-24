import { POSE_CONFIG as C } from '../config';
import type { CanonicalPoseFrame, Landmark } from '../types';
export function usable(p: Landmark | undefined): p is Landmark {
  return !!p && Number.isFinite(p.confidence) && p.confidence >= C.landmarkConfidence &&
    Number.isFinite(p.visibility) && p.visibility >= C.landmarkConfidence &&
    (p.presence === null || (Number.isFinite(p.presence) && p.presence >= C.landmarkConfidence)) &&
    Object.values(p.image).every(Number.isFinite) && (!p.world || Object.values(p.world).every(Number.isFinite));
}
export function filterLandmarks(frame: CanonicalPoseFrame): CanonicalPoseFrame {
  return { ...frame, landmarks: Object.fromEntries(Object.entries(frame.landmarks).filter(([, p]) => usable(p))) };
}
