import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import { Quaternion, Vector3 } from 'three';
import { LANDMARK_NAMES, type LandmarkName } from '../../src/features/pose-analysis/types';
import { mediaPipeTupleToModel, mediaPipeWorldToModel } from '../../src/features/pose-analysis/motion/coordinateTransform';
import {
  BoneResultCode,
  MOTION_CONTRACT_VERSION,
  MOTION_OUTPUT_BONE,
  MOTION_OUTPUT_HEADER,
  POSE_INPUT_FLOATS,
  POSE_INPUT_HEADER,
  motionBoneOffset,
  poseLandmarkOffset,
  type QuaternionTuple,
  type RigBoneName,
  type Vec3Tuple,
} from '../../src/features/pose-analysis/motion/motionContract';
import { packCanonicalPoseFrame } from '../../src/features/pose-analysis/motion/packPoseFrame';
import {
  SOLDIER_BONE_INDEX,
  SOLDIER_RIG_PROFILE,
  checkSoldierRigCompatibility,
  type RigCompatibilityProbe,
} from '../../src/features/pose-analysis/motion/soldierRigProfile';
import { retargetPoseTypeScript } from '../../src/features/pose-analysis/motion/typescriptRetarget';
import {
  leftArmRaisedFrame,
  leftElbowBentFrame,
  leftLegStepFrame,
  lowConfidenceLeftElbowFrame,
  missingLeftElbowFrame,
  motionPoseFrame,
  neutralMotionFrame,
  rightArmRaisedFrame,
  turnedMotionFrame,
} from './fixtures/pose/motion';

function outputQuaternion(data: Float32Array, name: RigBoneName): Quaternion {
  const offset = motionBoneOffset(SOLDIER_BONE_INDEX[name]);
  return new Quaternion(
    data[offset + MOTION_OUTPUT_BONE.qx],
    data[offset + MOTION_OUTPUT_BONE.qy],
    data[offset + MOTION_OUTPUT_BONE.qz],
    data[offset + MOTION_OUTPUT_BONE.qw],
  );
}

function outputCode(data: Float32Array, name: RigBoneName): BoneResultCode {
  return data[motionBoneOffset(SOLDIER_BONE_INDEX[name]) + MOTION_OUTPUT_BONE.resultCode] as BoneResultCode;
}

function outputValid(data: Float32Array, name: RigBoneName): boolean {
  return data[motionBoneOffset(SOLDIER_BONE_INDEX[name]) + MOTION_OUTPUT_BONE.valid] === 1;
}

function worldRotations(data: Float32Array): Map<RigBoneName, Quaternion> {
  const result = new Map<RigBoneName, Quaternion>();
  for (const bone of SOLDIER_RIG_PROFILE.bones) {
    const local = outputQuaternion(data, bone.name);
    const parent = bone.parent ? result.get(bone.parent) : undefined;
    result.set(bone.name, parent ? parent.clone().multiply(local) : local);
  }
  return result;
}

function assertDrivenDirection(
  data: Float32Array,
  boneName: RigBoneName,
  sourceFrom: Vec3Tuple,
  sourceTo: Vec3Tuple,
) {
  const bone = SOLDIER_RIG_PROFILE.bones[SOLDIER_BONE_INDEX[boneName]];
  assert.equal(bone.driver?.kind, 'segment');
  if (bone.driver?.kind !== 'segment') return;
  const tip = SOLDIER_RIG_PROFILE.bones[SOLDIER_BONE_INDEX[bone.driver.tipBone]];
  const actual = new Vector3(...tip.translation)
    .multiply(new Vector3(...bone.scale))
    .applyQuaternion(worldRotations(data).get(boneName)!)
    .normalize();
  const from = new Vector3(...mediaPipeTupleToModel(sourceFrom));
  const expected = new Vector3(...mediaPipeTupleToModel(sourceTo)).sub(from).normalize();
  assert.ok(actual.dot(expected) > 0.9999, `${boneName} must point along its target segment in world space`);
}

function actualRigProbe(): RigCompatibilityProbe {
  const bytes = fs.readFileSync('public/models/training/soldier-animated.glb');
  const jsonLength = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
  const parent = new Map<number, number>();
  gltf.nodes.forEach((node: { children?: number[] }, index: number) => node.children?.forEach(child => parent.set(child, index)));
  const skin = gltf.skins[0];
  const joints = new Set<number>(skin.joints);
  return {
    byteLength: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    bones: skin.joints.map((index: number) => {
      const node = gltf.nodes[index];
      const parentIndex = parent.get(index);
      return {
        name: node.name,
        parent: parentIndex !== undefined && joints.has(parentIndex) ? gltf.nodes[parentIndex].name : null,
        translation: (node.translation ?? [0, 0, 0]) as Vec3Tuple,
        rotation: (node.rotation ?? [0, 0, 0, 1]) as QuaternionTuple,
        scale: (node.scale ?? [1, 1, 1]) as Vec3Tuple,
      };
    }),
  };
}

test('packed contract is stable, reusable, finite and does not mutate CanonicalPoseFrame', () => {
  const frame = neutralMotionFrame();
  const before = structuredClone(frame);
  const target = new Float32Array(POSE_INPUT_FLOATS);
  const packed = packCanonicalPoseFrame(frame, target);
  assert.equal(packed, target);
  assert.equal(packed.length, POSE_INPUT_FLOATS);
  assert.equal(packed[POSE_INPUT_HEADER.version], MOTION_CONTRACT_VERSION);
  assert.equal(packed[POSE_INPUT_HEADER.landmarkCount], LANDMARK_NAMES.length);
  assert.deepEqual(frame, before);
  assert.ok([...packed].every(Number.isFinite));
  const leftShoulder = poseLandmarkOffset('leftShoulder');
  assert.equal(packed[leftShoulder], Math.fround(frame.landmarks.leftShoulder!.world!.x));
  assert.equal(packed[leftShoulder + 3], Math.fround(0.99));
});

test('coordinate transform is explicit and UI mirroring never changes packed body data', () => {
  assert.deepEqual(mediaPipeWorldToModel({ x: 1, y: 2, z: 3 }), [-1, -2, 3]);
  const normal = packCanonicalPoseFrame(motionPoseFrame());
  const mirroredUi = packCanonicalPoseFrame(motionPoseFrame({}, { mirrorUi: true }));
  assert.deepEqual(mirroredUi, normal);
});

test('rig profile matches the actual GLB hash, joint order, hierarchy and bind transforms', () => {
  const probe = actualRigProbe();
  assert.deepEqual(checkSoldierRigCompatibility(probe), []);
  assert.ok(SOLDIER_RIG_PROFILE.bones.some(bone => bone.name === 'LeftForearm' &&
    Math.abs(bone.translation[0]) > 0.1 && Math.abs(bone.translation[1]) > 0.1 && Math.abs(bone.translation[2]) > 0.08));
  assert.ok(checkSoldierRigCompatibility({ ...probe, sha256: 'changed' }).includes('asset SHA-256 changed'));
});

test('neutral pose produces only finite normalized local quaternions and keeps root translation disabled', () => {
  const result = retargetPoseTypeScript(packCanonicalPoseFrame(neutralMotionFrame()));
  assert.equal(result.supportedBoneCount, 13);
  assert.equal(result.validBoneCount, 13);
  assert.equal(result.data[MOTION_OUTPUT_HEADER.rootTranslationValid], 0);
  assert.ok([...result.data].every(Number.isFinite));
  for (const bone of SOLDIER_RIG_PROFILE.bones) {
    const quaternion = outputQuaternion(result.data, bone.name);
    assert.ok(Math.abs(quaternion.length() - 1) < 1e-6, `${bone.name} quaternion must be normalized`);
  }
});

test('left and right arm raises retarget the correct anatomical side', () => {
  const left = retargetPoseTypeScript(packCanonicalPoseFrame(leftArmRaisedFrame())).data;
  assertDrivenDirection(left, 'LeftUpperArm', [-0.18, -0.34, 0], [-0.38, -0.34, 0]);
  assert.ok(outputValid(left, 'LeftUpperArm'));
  const right = retargetPoseTypeScript(packCanonicalPoseFrame(rightArmRaisedFrame())).data;
  assertDrivenDirection(right, 'RightUpperArm', [0.18, -0.34, 0], [0.38, -0.34, 0]);
  assert.ok(outputValid(right, 'RightUpperArm'));
});

test('bent elbow output is parent-local and reconstructs the expected world direction', () => {
  const data = retargetPoseTypeScript(packCanonicalPoseFrame(leftElbowBentFrame())).data;
  assertDrivenDirection(data, 'LeftForearm', [-0.38, -0.34, 0], [-0.38, -0.56, 0]);
  const local = outputQuaternion(data, 'LeftForearm');
  const world = worldRotations(data).get('LeftForearm')!;
  assert.ok(1 - Math.abs(local.dot(world)) > 1e-3, 'forearm output must be local, not copied from world rotation');
});

test('simple leg motion follows hip-knee and knee-ankle segments', () => {
  const data = retargetPoseTypeScript(packCanonicalPoseFrame(leftLegStepFrame())).data;
  assertDrivenDirection(data, 'LeftUpLeg', [-0.11, 0, 0], [-0.1, 0.23, -0.24]);
  assertDrivenDirection(data, 'LeftLeg', [-0.1, 0.23, -0.24], [-0.09, 0.52, -0.34]);
});

test('body turn changes the parent-local hips basis without swapping left/right', () => {
  const neutral = retargetPoseTypeScript(packCanonicalPoseFrame(neutralMotionFrame())).data;
  const turned = retargetPoseTypeScript(packCanonicalPoseFrame(turnedMotionFrame(60))).data;
  assert.ok(Math.abs(outputQuaternion(neutral, 'Hips').dot(outputQuaternion(turned, 'Hips'))) < 0.95);
  const world = worldRotations(turned).get('Hips')!;
  const actualLeft = new Vector3(1, 0, 0).applyQuaternion(world).normalize();
  const frame = turnedMotionFrame(60);
  const left = frame.landmarks.leftHip!.world!, right = frame.landmarks.rightHip!.world!;
  const expectedLeft = new Vector3(...mediaPipeWorldToModel(left)).sub(new Vector3(...mediaPipeWorldToModel(right))).normalize();
  assert.ok(actualLeft.dot(expectedLeft) > 0.999);
});

test('missing and low-confidence joints hold a safe bind pose and invalidate descendants', () => {
  const missing = retargetPoseTypeScript(packCanonicalPoseFrame(missingLeftElbowFrame())).data;
  assert.equal(outputCode(missing, 'LeftUpperArm'), BoneResultCode.MissingLandmark);
  assert.equal(outputCode(missing, 'LeftForearm'), BoneResultCode.ParentUnavailable);
  assert.deepEqual(outputQuaternion(missing, 'LeftUpperArm').toArray(), [0, 0, 0, 1]);
  assert.ok(outputValid(missing, 'RightUpperArm'));

  const low = retargetPoseTypeScript(packCanonicalPoseFrame(lowConfidenceLeftElbowFrame())).data;
  assert.equal(outputCode(low, 'LeftUpperArm'), BoneResultCode.LowConfidence);
  assert.equal(outputCode(low, 'LeftForearm'), BoneResultCode.ParentUnavailable);
});

test('non-finite landmark data cannot escape into output and unsupported twist stays at bind pose', () => {
  const frame = motionPoseFrame({ leftWrist: { x: Number.NaN, y: 0, z: 0 } });
  const result = retargetPoseTypeScript(packCanonicalPoseFrame(frame));
  assert.ok([...result.data].every(Number.isFinite));
  assert.equal(outputCode(result.data, 'LeftForearm'), BoneResultCode.MissingLandmark);
  for (const name of ['LeftHand', 'RightHand', 'Head', 'LeftToeBase', 'RightToeBase'] as const) {
    assert.equal(outputCode(result.data, name), BoneResultCode.Unsupported);
    assert.equal(outputValid(result.data, name), false);
    assert.deepEqual(outputQuaternion(result.data, name).toArray(), [0, 0, 0, 1]);
  }
});
