import { Matrix4, Quaternion, Vector3 } from 'three';
import { LANDMARK_NAMES, type LandmarkName } from '../types';
import { mediaPipeTupleToModel } from './coordinateTransform';
import {
  BoneResultCode,
  MOTION_CONTRACT_VERSION,
  MOTION_OUTPUT_BONE,
  MOTION_OUTPUT_HEADER,
  POSE_COORDINATE_SPACE_MEDIAPIPE_WORLD,
  POSE_INPUT_FLOATS,
  POSE_INPUT_HEADER,
  POSE_INPUT_HEADER_FLOATS,
  POSE_INPUT_LANDMARK_STRIDE,
  motionBoneOffset,
  motionOutputFloatCount,
  type RigBoneName,
  type SoldierRigProfile,
  type VirtualJoint,
} from './motionContract';
import { SOLDIER_RIG_PROFILE } from './soldierRigProfile';

const EPSILON = 1e-7;

interface JointSample {
  point: Vector3;
  confidence: number;
  code: BoneResultCode;
}

interface BindBoneData {
  worldRotation: Quaternion;
  direction?: Vector3;
}

export interface TypeScriptRetargetResult {
  readonly data: Float32Array;
  readonly supportedBoneCount: number;
  readonly validBoneCount: number;
}

function quaternionFromTuple(tuple: readonly [number, number, number, number]): Quaternion {
  return new Quaternion(tuple[0], tuple[1], tuple[2], tuple[3]).normalize();
}

function safeQuaternion(value: Quaternion, fallback: Quaternion): Quaternion {
  const elements = [value.x, value.y, value.z, value.w];
  if (!elements.every(Number.isFinite) || value.lengthSq() < EPSILON) return fallback.clone().normalize();
  return value.normalize();
}

function buildBindData(profile: SoldierRigProfile): Map<RigBoneName, BindBoneData> {
  const result = new Map<RigBoneName, BindBoneData>();
  const byName = new Map(profile.bones.map(bone => [bone.name, bone]));
  for (const bone of profile.bones) {
    const local = quaternionFromTuple(bone.rotation);
    const parentWorld = bone.parent ? result.get(bone.parent)?.worldRotation : undefined;
    const worldRotation = parentWorld ? parentWorld.clone().multiply(local) : local;
    const entry: BindBoneData = { worldRotation };
    if (bone.driver?.kind === 'segment') {
      const tip = byName.get(bone.driver.tipBone);
      if (!tip || tip.parent !== bone.name) {
        throw new Error(`${bone.name} driver tip must be its direct child in the rig profile.`);
      }
      const localDirection = new Vector3(...tip.translation).multiply(new Vector3(...bone.scale));
      if (localDirection.lengthSq() < EPSILON) throw new Error(`${bone.name} has a zero-length bind direction.`);
      entry.direction = localDirection.applyQuaternion(worldRotation).normalize();
    }
    result.set(bone.name, entry);
  }
  return result;
}

function resultPriority(a: BoneResultCode, b: BoneResultCode): BoneResultCode {
  if (a === BoneResultCode.MissingLandmark || b === BoneResultCode.MissingLandmark) return BoneResultCode.MissingLandmark;
  if (a === BoneResultCode.LowConfidence || b === BoneResultCode.LowConfidence) return BoneResultCode.LowConfidence;
  if (a === BoneResultCode.InvalidGeometry || b === BoneResultCode.InvalidGeometry) return BoneResultCode.InvalidGeometry;
  return a !== BoneResultCode.Valid ? a : b;
}

class PackedPoseReader {
  constructor(
    private readonly input: Float32Array,
    private readonly threshold: number,
  ) {}

  private landmark(name: LandmarkName): JointSample {
    const index = LANDMARK_NAMES.indexOf(name);
    const offset = POSE_INPUT_HEADER_FLOATS + index * POSE_INPUT_LANDMARK_STRIDE;
    const confidence = this.input[offset + 3];
    if (!Number.isFinite(confidence) || confidence <= 0) {
      return { point: new Vector3(), confidence: 0, code: BoneResultCode.MissingLandmark };
    }
    if (confidence < this.threshold) {
      return { point: new Vector3(), confidence, code: BoneResultCode.LowConfidence };
    }
    const source = [this.input[offset], this.input[offset + 1], this.input[offset + 2]] as const;
    if (!source.every(Number.isFinite)) {
      return { point: new Vector3(), confidence: 0, code: BoneResultCode.InvalidGeometry };
    }
    const model = mediaPipeTupleToModel(source);
    return { point: new Vector3(...model), confidence, code: BoneResultCode.Valid };
  }

  joint(name: VirtualJoint): JointSample {
    if (name === 'hipCenter') return this.center('leftHip', 'rightHip');
    if (name === 'shoulderCenter') return this.center('leftShoulder', 'rightShoulder');
    if (name === 'headCenter') {
      const ears = this.center('leftEar', 'rightEar');
      return ears.code === BoneResultCode.Valid ? ears : this.landmark('nose');
    }
    return this.landmark(name);
  }

  private center(leftName: LandmarkName, rightName: LandmarkName): JointSample {
    const left = this.landmark(leftName), right = this.landmark(rightName);
    const code = resultPriority(left.code, right.code);
    if (code !== BoneResultCode.Valid) return { point: new Vector3(), confidence: Math.min(left.confidence, right.confidence), code };
    return {
      point: left.point.clone().add(right.point).multiplyScalar(0.5),
      confidence: Math.min(left.confidence, right.confidence),
      code: BoneResultCode.Valid,
    };
  }
}

function bodyBasis(reader: PackedPoseReader): JointSample & { rotation?: Quaternion } {
  const leftHip = reader.joint('leftHip'), rightHip = reader.joint('rightHip');
  const leftShoulder = reader.joint('leftShoulder'), rightShoulder = reader.joint('rightShoulder');
  const hips = reader.joint('hipCenter'), shoulders = reader.joint('shoulderCenter');
  const samples = [leftHip, rightHip, leftShoulder, rightShoulder, hips, shoulders];
  const code = samples.reduce((current, sample) => resultPriority(current, sample.code), BoneResultCode.Valid);
  const confidence = Math.min(...samples.map(sample => sample.confidence));
  if (code !== BoneResultCode.Valid) return { point: new Vector3(), confidence, code };

  const hipLeft = leftHip.point.clone().sub(rightHip.point).normalize();
  const shoulderLeft = leftShoulder.point.clone().sub(rightShoulder.point).normalize();
  const xAxis = hipLeft.add(shoulderLeft);
  const yAxis = shoulders.point.clone().sub(hips.point);
  if (xAxis.lengthSq() < EPSILON || yAxis.lengthSq() < EPSILON) {
    return { point: new Vector3(), confidence: 0, code: BoneResultCode.InvalidGeometry };
  }
  xAxis.normalize();
  yAxis.addScaledVector(xAxis, -yAxis.dot(xAxis));
  if (yAxis.lengthSq() < EPSILON) return { point: new Vector3(), confidence: 0, code: BoneResultCode.InvalidGeometry };
  yAxis.normalize();
  const zAxis = xAxis.clone().cross(yAxis);
  if (zAxis.lengthSq() < EPSILON) return { point: new Vector3(), confidence: 0, code: BoneResultCode.InvalidGeometry };
  zAxis.normalize();
  yAxis.copy(zAxis).cross(xAxis).normalize();
  const rotation = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(xAxis, yAxis, zAxis)).normalize();
  return { point: hips.point, confidence, code: BoneResultCode.Valid, rotation };
}

function writeBone(
  output: Float32Array,
  index: number,
  rotation: Quaternion,
  confidence: number,
  valid: boolean,
  code: BoneResultCode,
) {
  const offset = motionBoneOffset(index);
  output[offset + MOTION_OUTPUT_BONE.qx] = rotation.x;
  output[offset + MOTION_OUTPUT_BONE.qy] = rotation.y;
  output[offset + MOTION_OUTPUT_BONE.qz] = rotation.z;
  output[offset + MOTION_OUTPUT_BONE.qw] = rotation.w;
  output[offset + MOTION_OUTPUT_BONE.confidence] = Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0;
  output[offset + MOTION_OUTPUT_BONE.valid] = valid ? 1 : 0;
  output[offset + MOTION_OUTPUT_BONE.resultCode] = code;
}

/**
 * Deterministic TypeScript reference for Phase 1. It does not smooth, predict,
 * score, translate the root, or infer unsupported twist. Unavailable driven
 * chains remain at their bind-local rotation.
 */
export function retargetPoseTypeScript(
  input: Float32Array,
  profile: SoldierRigProfile = SOLDIER_RIG_PROFILE,
): TypeScriptRetargetResult {
  if (input.length !== POSE_INPUT_FLOATS) throw new RangeError(`Expected ${POSE_INPUT_FLOATS} packed input floats.`);
  if (input[POSE_INPUT_HEADER.version] !== MOTION_CONTRACT_VERSION) throw new Error('Unsupported motion input contract version.');
  if (input[POSE_INPUT_HEADER.coordinateSpace] !== POSE_COORDINATE_SPACE_MEDIAPIPE_WORLD) throw new Error('Unsupported pose coordinate space.');
  if (input[POSE_INPUT_HEADER.landmarkCount] !== LANDMARK_NAMES.length) throw new Error('Packed landmark count does not match the contract.');

  const output = new Float32Array(motionOutputFloatCount(profile.bones.length));
  output[MOTION_OUTPUT_HEADER.version] = MOTION_CONTRACT_VERSION;
  output[MOTION_OUTPUT_HEADER.timestampMs] = input[POSE_INPUT_HEADER.timestampMs];
  output[MOTION_OUTPUT_HEADER.boneCount] = profile.bones.length;
  // Root translation intentionally stays invalid/zero until calibrated root motion exists.
  output[MOTION_OUTPUT_HEADER.rootTranslationValid] = 0;

  const reader = new PackedPoseReader(input, profile.confidenceThreshold);
  const bind = buildBindData(profile);
  const targetWorld = new Map<RigBoneName, Quaternion>();
  const chainReliable = new Map<RigBoneName, boolean>();
  let supportedBoneCount = 0, validBoneCount = 0;

  profile.bones.forEach((bone, index) => {
    const bindLocal = quaternionFromTuple(bone.rotation);
    const parentWorld = bone.parent ? targetWorld.get(bone.parent) : undefined;
    const parentReliable = bone.parent ? chainReliable.get(bone.parent) === true : true;
    let desiredWorld = parentWorld ? parentWorld.clone().multiply(bindLocal) : bindLocal.clone();
    let local = bindLocal.clone();
    let confidence = 0;
    let valid = false;
    let reliable = parentReliable;
    let code = BoneResultCode.Unsupported;

    if (bone.driver) {
      supportedBoneCount++;
      if (!parentReliable) {
        reliable = false;
        code = BoneResultCode.ParentUnavailable;
      } else if (bone.driver.kind === 'bodyBasis') {
        const basis = bodyBasis(reader);
        confidence = basis.confidence;
        code = basis.code;
        if (basis.rotation && code === BoneResultCode.Valid) {
          desiredWorld = basis.rotation;
          valid = reliable = true;
        } else reliable = false;
      } else {
        const from = reader.joint(bone.driver.from), to = reader.joint(bone.driver.to);
        confidence = Math.min(from.confidence, to.confidence);
        code = resultPriority(from.code, to.code);
        const bindDirection = bind.get(bone.name)?.direction;
        const targetDirection = to.point.clone().sub(from.point);
        if (code === BoneResultCode.Valid && bindDirection && targetDirection.lengthSq() >= EPSILON) {
          targetDirection.normalize();
          const delta = new Quaternion().setFromUnitVectors(bindDirection, targetDirection);
          desiredWorld = delta.multiply(bind.get(bone.name)!.worldRotation.clone()).normalize();
          valid = reliable = true;
        } else {
          if (code === BoneResultCode.Valid) code = BoneResultCode.InvalidGeometry;
          reliable = false;
        }
      }
    }

    if (valid) {
      local = parentWorld
        ? parentWorld.clone().invert().multiply(desiredWorld)
        : desiredWorld.clone();
      local = safeQuaternion(local, bindLocal);
      validBoneCount++;
    } else {
      local = bindLocal;
      desiredWorld = parentWorld ? parentWorld.clone().multiply(local) : local.clone();
    }

    targetWorld.set(bone.name, safeQuaternion(desiredWorld, bind.get(bone.name)!.worldRotation));
    // Unsupported bones safely inherit their parent and remain usable as parents.
    chainReliable.set(bone.name, bone.driver ? reliable : parentReliable);
    writeBone(output, index, local, confidence, valid, code);
  });

  return { data: output, supportedBoneCount, validBoneCount };
}

