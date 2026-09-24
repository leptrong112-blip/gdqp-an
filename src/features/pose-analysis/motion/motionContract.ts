import { LANDMARK_NAMES, type LandmarkName } from '../types';

export const MOTION_CONTRACT_VERSION = 1;

/**
 * Packed input is deliberately Float32-only so the exact layout can later be
 * shared with raw WebAssembly without object marshalling.
 *
 * Header: [version, timestampMs, personCount, aspectRatio, landmarkCount,
 *          coordinateSpace, reserved, reserved]
 * Landmark: [worldX, worldY, worldZ, confidence], in LANDMARK_NAMES order.
 * Missing or unusable landmarks contain zero coordinates and confidence 0.
 */
export const POSE_INPUT_HEADER_FLOATS = 8;
export const POSE_INPUT_LANDMARK_STRIDE = 4;
export const POSE_INPUT_FLOATS =
  POSE_INPUT_HEADER_FLOATS + LANDMARK_NAMES.length * POSE_INPUT_LANDMARK_STRIDE;

export const POSE_INPUT_HEADER = {
  version: 0,
  timestampMs: 1,
  personCount: 2,
  aspectRatio: 3,
  landmarkCount: 4,
  coordinateSpace: 5,
} as const;

/** MediaPipe world coordinates, before the explicit model-space transform. */
export const POSE_COORDINATE_SPACE_MEDIAPIPE_WORLD = 1;

export type RigBoneName =
  | 'Armature'
  | 'Hips'
  | 'LeftUpLeg'
  | 'LeftLeg'
  | 'LeftFoot'
  | 'LeftToeBase'
  | 'RightUpLeg'
  | 'RightLeg'
  | 'RightFoot'
  | 'RightToeBase'
  | 'Spine'
  | 'Chest'
  | 'LeftUpperArm'
  | 'LeftForearm'
  | 'LeftHand'
  | 'Neck'
  | 'Head'
  | 'RightUpperArm'
  | 'RightForearm'
  | 'RightHand';

export type Vec3Tuple = readonly [number, number, number];
export type QuaternionTuple = readonly [number, number, number, number];

export type VirtualJoint = LandmarkName | 'hipCenter' | 'shoulderCenter' | 'headCenter';

export type RigDriver =
  | { readonly kind: 'bodyBasis' }
  | {
      readonly kind: 'segment';
      readonly from: VirtualJoint;
      readonly to: VirtualJoint;
      /** Child joint whose bind offset defines the real GLB bone direction. */
      readonly tipBone: RigBoneName;
    };

export interface RigBoneProfile {
  readonly name: RigBoneName;
  readonly parent: RigBoneName | null;
  readonly translation: Vec3Tuple;
  readonly rotation: QuaternionTuple;
  readonly scale: Vec3Tuple;
  readonly driver?: RigDriver;
}

export interface SoldierRigProfile {
  readonly profileVersion: 1;
  readonly asset: {
    readonly url: string;
    readonly byteLength: number;
    readonly sha256: string;
  };
  readonly axes: {
    readonly up: '+Y';
    readonly forward: '+Z';
    readonly anatomicalLeft: '+X';
    readonly mediaPipeWorldToModel: '[-x,-y,+z]';
    readonly uiMirrorAffectsData: false;
  };
  readonly confidenceThreshold: number;
  readonly bones: readonly RigBoneProfile[];
}

export enum BoneResultCode {
  Valid = 0,
  Unsupported = 1,
  MissingLandmark = 2,
  LowConfidence = 3,
  InvalidGeometry = 4,
  ParentUnavailable = 5,
}

/**
 * Packed output header:
 * [version, timestampMs, boneCount, rootTranslationValid, rootX, rootY, rootZ, reserved]
 * Bone record: [qx, qy, qz, qw, confidence, valid, resultCode, reserved].
 * Quaternion values are local to the bone's parent and always finite/normalized.
 */
export const MOTION_OUTPUT_HEADER_FLOATS = 8;
export const MOTION_OUTPUT_BONE_STRIDE = 8;
export const MOTION_OUTPUT_HEADER = {
  version: 0,
  timestampMs: 1,
  boneCount: 2,
  rootTranslationValid: 3,
  rootX: 4,
  rootY: 5,
  rootZ: 6,
} as const;

export const MOTION_OUTPUT_BONE = {
  qx: 0,
  qy: 1,
  qz: 2,
  qw: 3,
  confidence: 4,
  valid: 5,
  resultCode: 6,
} as const;

export function poseLandmarkOffset(name: LandmarkName): number {
  const index = LANDMARK_NAMES.indexOf(name);
  if (index < 0) throw new RangeError(`Unknown pose landmark: ${name}`);
  return POSE_INPUT_HEADER_FLOATS + index * POSE_INPUT_LANDMARK_STRIDE;
}

export function motionBoneOffset(index: number): number {
  if (!Number.isInteger(index) || index < 0) throw new RangeError('Bone index must be a non-negative integer.');
  return MOTION_OUTPUT_HEADER_FLOATS + index * MOTION_OUTPUT_BONE_STRIDE;
}

export function motionOutputFloatCount(boneCount: number): number {
  if (!Number.isInteger(boneCount) || boneCount < 0) throw new RangeError('Bone count must be a non-negative integer.');
  return MOTION_OUTPUT_HEADER_FLOATS + boneCount * MOTION_OUTPUT_BONE_STRIDE;
}

