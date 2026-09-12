import type { CanonicalPoseFrame, LandmarkName } from '../../../../src/features/pose-analysis/types';
const coordinates: Partial<Record<LandmarkName, [number, number]>> = {
  nose: [0, 0.12], leftEar: [-0.035, 0.13], rightEar: [0.035, 0.13],
  leftShoulder: [-0.12, 0.28], rightShoulder: [0.12, 0.28], leftElbow: [-0.125, 0.415], rightElbow: [0.125, 0.415], leftWrist: [-0.13, 0.55], rightWrist: [0.13, 0.55],
  leftHip: [-0.08, 0.5], rightHip: [0.08, 0.5], leftKnee: [-0.055, 0.655], rightKnee: [0.055, 0.655], leftAnkle: [-0.03, 0.81], rightAnkle: [0.03, 0.81],
  leftHeel: [-0.02, 0.86], rightHeel: [0.02, 0.86], leftFootIndex: [-0.040710678, 0.91], rightFootIndex: [0.040710678, 0.91],
};
export function attentionFrame(timestampMs = 0, size = 1, xOffset = 0, mirrored = false): CanonicalPoseFrame {
  const landmarks: CanonicalPoseFrame['landmarks'] = {};
  for (const [key, [x, y]] of Object.entries(coordinates)) landmarks[key as LandmarkName] = {
    image: { x: 2 / 3 + xOffset + x * size * (mirrored ? -1 : 1), y: 0.5 + (y - 0.5) * size, z: 0 },
    world: { x: x * (mirrored ? -1 : 1), y: y - 0.5, z: 0 }, visibility: 0.99, presence: null, confidence: 0.99,
  };
  return { timestampMs, personCount: 1, aspectRatio: 4 / 3, landmarks };
}
export const goodLighting = { mean: 120, darkRatio: 0.05, brightRatio: 0.01 };
