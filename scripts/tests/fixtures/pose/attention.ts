import type { CanonicalPoseFrame, LandmarkName } from '../../../../src/features/pose-analysis/types';
const coordinates: Partial<Record<LandmarkName, [number, number]>> = {
  nose: [0, 0.12], leftEar: [-0.035, 0.13], rightEar: [0.035, 0.13],
  leftShoulder: [-0.12, 0.28], rightShoulder: [0.12, 0.28], leftElbow: [-0.125, 0.415], rightElbow: [0.125, 0.415], leftWrist: [-0.13, 0.55], rightWrist: [0.13, 0.55],
  leftHip: [-0.08, 0.5], rightHip: [0.08, 0.5], leftKnee: [-0.055, 0.655], rightKnee: [0.055, 0.655], leftAnkle: [-0.03, 0.81], rightAnkle: [0.03, 0.81],
  leftHeel: [-0.02, 0.86], rightHeel: [0.02, 0.86], leftFootIndex: [-0.040710678, 0.91], rightFootIndex: [0.040710678, 0.91],
};
export function attentionFrame(timestampMs = 0, size = 1, xOffset = 0, mirrored = false): CanonicalPoseFrame {
  const aspectRatio = 4 / 3;
  const landmarks: CanonicalPoseFrame['landmarks'] = {};
  for (const [key, [x, y]] of Object.entries(coordinates)) landmarks[key as LandmarkName] = {
    image: { x: 0.5 + (xOffset + x * size * (mirrored ? -1 : 1)) / aspectRatio, y: 0.5 + (y - 0.5) * size, z: 0 },
    world: { x: x * (mirrored ? -1 : 1), y: y - 0.5, z: 0 }, visibility: 0.99, presence: null, confidence: 0.99,
  };
  return { timestampMs, personCount: 1, aspectRatio, landmarks };
}
export const goodLighting = { mean: 120, darkRatio: 0.05, brightRatio: 0.01 };

export function rotatedPoseFrame(yawDeg: number, timestampMs = 0, mirrored = false): CanonicalPoseFrame {
  const frame = attentionFrame(timestampMs);
  const rad = yawDeg * Math.PI / 180;
  for (const landmark of Object.values(frame.landmarks)) {
    if (!landmark?.world) continue;
    const x = landmark.world.x * Math.cos(rad), z = -landmark.world.x * Math.sin(rad);
    landmark.world = { x, y: landmark.world.y, z };
    landmark.image = { x: 0.5 + x * (mirrored ? -1 : 1) / frame.aspectRatio, y: landmark.image.y, z };
  }
  return frame;
}
