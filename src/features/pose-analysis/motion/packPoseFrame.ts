import { LANDMARK_NAMES, type CanonicalPoseFrame } from '../types';
import {
  MOTION_CONTRACT_VERSION,
  POSE_COORDINATE_SPACE_MEDIAPIPE_WORLD,
  POSE_INPUT_FLOATS,
  POSE_INPUT_HEADER,
  POSE_INPUT_HEADER_FLOATS,
  POSE_INPUT_LANDMARK_STRIDE,
} from './motionContract';

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

/** Packs only MediaPipe world landmarks. Image-space mirroring is intentionally ignored. */
export function packCanonicalPoseFrame(frame: CanonicalPoseFrame, target?: Float32Array): Float32Array {
  const packed = target ?? new Float32Array(POSE_INPUT_FLOATS);
  if (packed.length !== POSE_INPUT_FLOATS) {
    throw new RangeError(`Pose input buffer must contain ${POSE_INPUT_FLOATS} floats.`);
  }
  packed.fill(0);
  packed[POSE_INPUT_HEADER.version] = MOTION_CONTRACT_VERSION;
  packed[POSE_INPUT_HEADER.timestampMs] = finiteOr(frame.timestampMs, 0);
  packed[POSE_INPUT_HEADER.personCount] = Number.isInteger(frame.personCount) ? Math.max(0, frame.personCount) : 0;
  packed[POSE_INPUT_HEADER.aspectRatio] = finiteOr(frame.aspectRatio, 1);
  packed[POSE_INPUT_HEADER.landmarkCount] = LANDMARK_NAMES.length;
  packed[POSE_INPUT_HEADER.coordinateSpace] = POSE_COORDINATE_SPACE_MEDIAPIPE_WORLD;

  LANDMARK_NAMES.forEach((name, index) => {
    const landmark = frame.landmarks[name];
    const world = landmark?.world;
    const offset = POSE_INPUT_HEADER_FLOATS + index * POSE_INPUT_LANDMARK_STRIDE;
    if (!landmark || !world || ![world.x, world.y, world.z, landmark.confidence].every(Number.isFinite)) return;
    const confidence = Math.max(0, Math.min(1, landmark.confidence));
    if (confidence === 0) return;
    packed[offset] = world.x;
    packed[offset + 1] = world.y;
    packed[offset + 2] = world.z;
    packed[offset + 3] = confidence;
  });
  return packed;
}

