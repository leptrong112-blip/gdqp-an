import type {
  QuaternionTuple,
  RigBoneName,
  SoldierRigProfile,
  Vec3Tuple,
} from './motionContract';

/**
 * Versioned from public/models/training/soldier-animated.glb.
 * The order is the actual glTF skin.joints order, not an assumed humanoid order.
 * Tiny Blender floating-point noise in identity rotations is normalized to exact
 * identity; translations and the one non-unit scale retain exported values.
 */
export const SOLDIER_RIG_PROFILE: SoldierRigProfile = {
  profileVersion: 1,
  asset: {
    url: '/models/training/soldier-animated.glb',
    byteLength: 12_607_912,
    sha256: 'a421a4e44ff74e89c7fef3fe370558b05f54e8de2097ee806ca56e6d98f94c58',
  },
  axes: {
    up: '+Y',
    forward: '+Z',
    anatomicalLeft: '+X',
    mediaPipeWorldToModel: '[-x,-y,+z]',
    uiMirrorAffectsData: false,
  },
  confidenceThreshold: 0.6,
  bones: [
    { name: 'Armature', parent: null, translation: [0, 0, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1] },
    { name: 'Hips', parent: 'Armature', translation: [0, 0.7199999094, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1], driver: { kind: 'bodyBasis' } },
    { name: 'LeftUpLeg', parent: 'Hips', translation: [0.0779999942, -0.0199999809, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1], driver: { kind: 'segment', from: 'leftHip', to: 'leftKnee', tipBone: 'LeftLeg' } },
    { name: 'LeftLeg', parent: 'LeftUpLeg', translation: [0, -0.2999999225, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1], driver: { kind: 'segment', from: 'leftKnee', to: 'leftAnkle', tipBone: 'LeftFoot' } },
    { name: 'LeftFoot', parent: 'LeftLeg', translation: [0, -0.2999999821, 0.0149999997], rotation: [0, 0, 0, 1], scale: [1, 1, 1], driver: { kind: 'segment', from: 'leftAnkle', to: 'leftFootIndex', tipBone: 'LeftToeBase' } },
    { name: 'LeftToeBase', parent: 'LeftFoot', translation: [0, -0.0549999662, 0.0899999738], rotation: [0, 0, 0, 1], scale: [1, 1, 1] },
    { name: 'RightUpLeg', parent: 'Hips', translation: [-0.0779999942, -0.0199999809, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1], driver: { kind: 'segment', from: 'rightHip', to: 'rightKnee', tipBone: 'RightLeg' } },
    { name: 'RightLeg', parent: 'RightUpLeg', translation: [0, -0.2999999225, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1], driver: { kind: 'segment', from: 'rightKnee', to: 'rightAnkle', tipBone: 'RightFoot' } },
    { name: 'RightFoot', parent: 'RightLeg', translation: [0, -0.2999999821, 0.0149999997], rotation: [0, 0, 0, 1], scale: [1, 1, 1], driver: { kind: 'segment', from: 'rightAnkle', to: 'rightFootIndex', tipBone: 'RightToeBase' } },
    { name: 'RightToeBase', parent: 'RightFoot', translation: [0, -0.0549999662, 0.0899999738], rotation: [0, 0, 0, 1], scale: [1, 1, 1] },
    { name: 'Spine', parent: 'Hips', translation: [0, 0.1400000453, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1], driver: { kind: 'segment', from: 'hipCenter', to: 'shoulderCenter', tipBone: 'Chest' } },
    { name: 'Chest', parent: 'Spine', translation: [0, 0.1599999666, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1] },
    { name: 'LeftUpperArm', parent: 'Chest', translation: [0.1350000054, 0.0400000811, 0], rotation: [0, 0, 0, 1], scale: [1, 0.9999998808, 1], driver: { kind: 'segment', from: 'leftShoulder', to: 'leftElbow', tipBone: 'LeftForearm' } },
    { name: 'LeftForearm', parent: 'LeftUpperArm', translation: [0.1299999505, -0.129999876, 0.0899999961], rotation: [0, 0, 0, 1], scale: [1, 1, 1], driver: { kind: 'segment', from: 'leftElbow', to: 'leftWrist', tipBone: 'LeftHand' } },
    { name: 'LeftHand', parent: 'LeftForearm', translation: [0.1050000116, -0.1099999547, 0.0899999961], rotation: [0, 0, 0, 1], scale: [1, 1, 1] },
    { name: 'Neck', parent: 'Chest', translation: [0, 0.1600000858, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1], driver: { kind: 'segment', from: 'shoulderCenter', to: 'headCenter', tipBone: 'Head' } },
    { name: 'Head', parent: 'Neck', translation: [0, 0.1100001335, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1] },
    { name: 'RightUpperArm', parent: 'Chest', translation: [-0.1350000054, 0.0400000811, 0], rotation: [0, 0, 0, 1], scale: [1, 0.9999998808, 1], driver: { kind: 'segment', from: 'rightShoulder', to: 'rightElbow', tipBone: 'RightForearm' } },
    { name: 'RightForearm', parent: 'RightUpperArm', translation: [-0.1299999803, -0.129999876, 0.0899999812], rotation: [0, 0, 0, 1], scale: [1, 1, 1], driver: { kind: 'segment', from: 'rightElbow', to: 'rightWrist', tipBone: 'RightHand' } },
    { name: 'RightHand', parent: 'RightForearm', translation: [-0.1050000265, -0.1099999547, 0.0899999887], rotation: [0, 0, 0, 1], scale: [1, 1, 1] },
  ],
};

export interface RigCompatibilityBone {
  readonly name: string;
  readonly parent: string | null;
  readonly translation: Vec3Tuple;
  readonly rotation: QuaternionTuple;
  readonly scale: Vec3Tuple;
}

export interface RigCompatibilityProbe {
  readonly byteLength: number;
  readonly sha256: string;
  readonly bones: readonly RigCompatibilityBone[];
}

function tupleClose(actual: readonly number[], expected: readonly number[], tolerance: number): boolean {
  return actual.length === expected.length && actual.every((value, index) =>
    Number.isFinite(value) && Math.abs(value - expected[index]) <= tolerance
  );
}

/** Returns actionable incompatibilities instead of silently accepting a changed GLB. */
export function checkSoldierRigCompatibility(
  probe: RigCompatibilityProbe,
  tolerance = 1e-5,
): string[] {
  const issues: string[] = [];
  if (probe.byteLength !== SOLDIER_RIG_PROFILE.asset.byteLength) {
    issues.push(`asset byte length changed (${probe.byteLength})`);
  }
  if (probe.sha256.toLowerCase() !== SOLDIER_RIG_PROFILE.asset.sha256) {
    issues.push('asset SHA-256 changed');
  }
  if (probe.bones.length !== SOLDIER_RIG_PROFILE.bones.length) {
    issues.push(`skin joint count changed (${probe.bones.length})`);
  }
  SOLDIER_RIG_PROFILE.bones.forEach((expected, index) => {
    const actual = probe.bones[index];
    if (!actual) return;
    if (actual.name !== expected.name) issues.push(`joint ${index} changed from ${expected.name} to ${actual.name}`);
    if (actual.parent !== expected.parent) issues.push(`${expected.name} parent changed to ${actual.parent ?? 'null'}`);
    if (!tupleClose(actual.translation, expected.translation, tolerance)) issues.push(`${expected.name} bind translation changed`);
    if (!tupleClose(actual.rotation, expected.rotation, tolerance)) issues.push(`${expected.name} bind rotation changed`);
    if (!tupleClose(actual.scale, expected.scale, tolerance)) issues.push(`${expected.name} bind scale changed`);
  });
  return issues;
}

export const SOLDIER_BONE_INDEX: Readonly<Record<RigBoneName, number>> = Object.freeze(
  Object.fromEntries(SOLDIER_RIG_PROFILE.bones.map((bone, index) => [bone.name, index])) as Record<RigBoneName, number>,
);
