import type { FeatureId, FeatureSample, LandmarkName, NormalizedPoseFrame, Vec3 } from '../types';
import { angleAt3D, angleBetween, calculateBodyYaw, distance, horizontalTilt, horizontalTilt3D, mean, midpoint, subtract } from './geometry';
export function extractFeatures(frame: NormalizedPoseFrame, dynamicTurn = false): FeatureSample {
  const sample: FeatureSample = { timestampMs: frame.timestampMs, values: {} }, p = frame.body, w = frame.worldBody;
  const add = (id: FeatureId, names: LandmarkName[], fn: () => number) => {
    if (names.some(n => !frame.landmarks[n] || !p[n])) return;
    const value = fn(), confidence = Math.min(...names.map(n => frame.landmarks[n]!.confidence));
    if (Number.isFinite(value)) sample.values[id] = { value, confidence };
  };
  if (p.leftShoulder && p.rightShoulder && p.leftHip && p.rightHip) {
    const width = distance(p.leftShoulder, p.rightShoulder);
    if (!dynamicTurn || (w.leftShoulder && w.rightShoulder)) {
      add('shoulderTilt', ['leftShoulder', 'rightShoulder'], () => dynamicTurn
        ? horizontalTilt3D(w.leftShoulder!, w.rightShoulder!)
        : horizontalTilt(p.leftShoulder!, p.rightShoulder!));
    }
    add('hipTilt', ['leftHip', 'rightHip'], () => horizontalTilt(p.leftHip!, p.rightHip!));
    if (w.leftShoulder && w.rightShoulder && w.leftHip && w.rightHip) add('torsoTilt', ['leftShoulder', 'rightShoulder', 'leftHip', 'rightHip'], () => angleBetween(subtract(midpoint(w.leftHip!, w.rightHip!), midpoint(w.leftShoulder!, w.rightShoulder!)), { x: 0, y: 1, z: 0 }));
    if (width > 1e-6) {
      add('heelGapRatio', ['leftHeel', 'rightHeel', 'leftShoulder', 'rightShoulder'], () => distance(p.leftHeel!, p.rightHeel!) / width);
      add('headOffset', ['nose', 'leftShoulder', 'rightShoulder'], () => Math.abs(p.nose!.x - midpoint(p.leftShoulder!, p.rightShoulder!).x) / width);
      for (const side of ['left', 'right'] as const) add(`${side}WristHipDistance`, [`${side}Wrist`, `${side}Hip`, 'leftShoulder', 'rightShoulder'], () => distance(p[`${side}Wrist`]!, p[`${side}Hip`]!) / width);
      const headTargetKey: LandmarkName = frame.landmarks.rightEye ? 'rightEye' : frame.landmarks.rightEar ? 'rightEar' : 'nose';
      add('rightWristHeadDistance', ['rightWrist', headTargetKey, 'leftShoulder', 'rightShoulder'], () => distance(p.rightWrist!, p[headTargetKey]!) / width);
    }
  }
  if (w.leftShoulder || w.rightShoulder || w.leftHip || w.rightHip) {
    const yaw = calculateBodyYaw(w.leftShoulder, w.rightShoulder, w.leftHip, w.rightHip, frame.frontalXSign);
    if (yaw !== null) {
      const conf = mean(
        (['leftShoulder', 'rightShoulder', 'leftHip', 'rightHip'] as const)
          .map(n => frame.landmarks[n]?.confidence)
          .filter((c): c is number => c !== undefined)
      );
      sample.values.bodyYaw = { value: yaw, confidence: conf };
    }
  }
  if (dynamicTurn && w.leftShoulder && w.rightShoulder) {
    const span = distance(w.leftShoulder, w.rightShoulder);
    for (const side of ['left', 'right'] as const) {
      delete sample.values[`${side}WristHipDistance`];
      if (span > 1e-6 && w[`${side}Wrist`] && w[`${side}Hip`]) {
        add(`${side}WristHipDistance`, [`${side}Wrist`, `${side}Hip`, 'leftShoulder', 'rightShoulder'],
          () => distance(w[`${side}Wrist`]!, w[`${side}Hip`]!) / span);
      }
    }
  }
  add('footOpeningAngle', ['leftHeel', 'rightHeel', 'leftFootIndex', 'rightFootIndex'], () => {
    if (w.leftHeel && w.rightHeel && w.leftFootIndex && w.rightFootIndex) {
      const vL = subtract(w.leftFootIndex, w.leftHeel);
      const vR = subtract(w.rightFootIndex, w.rightHeel);
      if (Math.abs(vL.z) > 0.015 || Math.abs(vR.z) > 0.015) {
        const angleGround = angleBetween({ x: vL.x, y: 0, z: vL.z }, { x: vR.x, y: 0, z: vR.z });
        if (Number.isFinite(angleGround)) return angleGround;
      }
    }
    return angleBetween(subtract(p.leftFootIndex!, p.leftHeel!), subtract(p.rightFootIndex!, p.rightHeel!));
  });
  for (const side of ['left', 'right'] as const) {
    for (const [id, names] of [[`${side}KneeAngle`, [`${side}Hip`, `${side}Knee`, `${side}Ankle`]], [`${side}ElbowAngle`, [`${side}Shoulder`, `${side}Elbow`, `${side}Wrist`]]] as [FeatureId, LandmarkName[]][]) {
      if (names.every(n => w[n])) add(id, names, () => angleAt3D(...names.map(n => w[n]!) as [Vec3, Vec3, Vec3]));
    }
  }
  const lk = sample.values.leftKneeAngle, rk = sample.values.rightKneeAngle;
  if (lk && rk) {
    const conf = Math.min(lk.confidence, rk.confidence);
    sample.values.maxKneeAngle = { value: Math.max(lk.value, rk.value), confidence: conf };
    sample.values.minKneeAngle = { value: Math.min(lk.value, rk.value), confidence: conf };
    sample.values.kneeAngleDiff = { value: Math.abs(lk.value - rk.value), confidence: conf };
  }
  return sample;
}
