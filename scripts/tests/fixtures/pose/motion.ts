import type { CanonicalPoseFrame, LandmarkName, Vec3 } from '../../../../src/features/pose-analysis/types';

const neutralWorld: Partial<Record<LandmarkName, Vec3>> = {
  nose: { x: 0, y: -0.52, z: 0 },
  leftEar: { x: -0.055, y: -0.48, z: 0 },
  rightEar: { x: 0.055, y: -0.48, z: 0 },
  leftShoulder: { x: -0.18, y: -0.34, z: 0 },
  rightShoulder: { x: 0.18, y: -0.34, z: 0 },
  leftElbow: { x: -0.21, y: -0.12, z: 0 },
  rightElbow: { x: 0.21, y: -0.12, z: 0 },
  leftWrist: { x: -0.22, y: 0.08, z: 0 },
  rightWrist: { x: 0.22, y: 0.08, z: 0 },
  leftHip: { x: -0.11, y: 0, z: 0 },
  rightHip: { x: 0.11, y: 0, z: 0 },
  leftKnee: { x: -0.1, y: 0.36, z: 0 },
  rightKnee: { x: 0.1, y: 0.36, z: 0 },
  leftAnkle: { x: -0.09, y: 0.7, z: 0 },
  rightAnkle: { x: 0.09, y: 0.7, z: 0 },
  leftHeel: { x: -0.09, y: 0.75, z: 0.02 },
  rightHeel: { x: 0.09, y: 0.75, z: 0.02 },
  leftFootIndex: { x: -0.09, y: 0.76, z: 0.12 },
  rightFootIndex: { x: 0.09, y: 0.76, z: 0.12 },
};

function copyPoint(point: Vec3): Vec3 {
  return { x: point.x, y: point.y, z: point.z };
}

export function motionPoseFrame(
  overrides: Partial<Record<LandmarkName, Vec3 | null>> = {},
  options: { timestampMs?: number; confidence?: Partial<Record<LandmarkName, number>>; mirrorUi?: boolean } = {},
): CanonicalPoseFrame {
  const aspectRatio = 4 / 3;
  const landmarks: CanonicalPoseFrame['landmarks'] = {};
  for (const [key, base] of Object.entries(neutralWorld)) {
    const name = key as LandmarkName;
    const replacement = overrides[name];
    if (replacement === null) continue;
    const world = copyPoint(replacement ?? base);
    const imageX = 0.5 + world.x * 0.65 / aspectRatio;
    landmarks[name] = {
      image: {
        x: options.mirrorUi ? 1 - imageX : imageX,
        y: 0.5 + world.y * 0.55,
        z: world.z,
      },
      world,
      visibility: options.confidence?.[name] ?? 0.99,
      presence: null,
      confidence: options.confidence?.[name] ?? 0.99,
    };
  }
  return { timestampMs: options.timestampMs ?? 1000, personCount: 1, aspectRatio, landmarks };
}

export const neutralMotionFrame = () => motionPoseFrame();

export const leftArmRaisedFrame = () => motionPoseFrame({
  leftElbow: { x: -0.38, y: -0.34, z: 0 },
  leftWrist: { x: -0.58, y: -0.34, z: 0 },
});

export const rightArmRaisedFrame = () => motionPoseFrame({
  rightElbow: { x: 0.38, y: -0.34, z: 0 },
  rightWrist: { x: 0.58, y: -0.34, z: 0 },
});

export const leftElbowBentFrame = () => motionPoseFrame({
  leftElbow: { x: -0.38, y: -0.34, z: 0 },
  leftWrist: { x: -0.38, y: -0.56, z: 0 },
});

export const leftLegStepFrame = () => motionPoseFrame({
  leftKnee: { x: -0.1, y: 0.23, z: -0.24 },
  leftAnkle: { x: -0.09, y: 0.52, z: -0.34 },
  leftHeel: { x: -0.09, y: 0.57, z: -0.32 },
  leftFootIndex: { x: -0.09, y: 0.58, z: -0.2 },
});

export function turnedMotionFrame(yawDegrees: number): CanonicalPoseFrame {
  const radians = yawDegrees * Math.PI / 180;
  const overrides: Partial<Record<LandmarkName, Vec3>> = {};
  for (const [key, point] of Object.entries(neutralWorld)) {
    overrides[key as LandmarkName] = {
      x: point.x * Math.cos(radians) + point.z * Math.sin(radians),
      y: point.y,
      z: -point.x * Math.sin(radians) + point.z * Math.cos(radians),
    };
  }
  return motionPoseFrame(overrides);
}

export const missingLeftElbowFrame = () => motionPoseFrame({ leftElbow: null });

export const lowConfidenceLeftElbowFrame = () => motionPoseFrame({}, {
  confidence: { leftElbow: 0.2 },
});
