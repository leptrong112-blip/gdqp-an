import type { DualMeasurement, LandmarkName, NormalizedPoseFrame, Vec3 } from '../types';
import { angleAt2D, angleAt3D, angleBetween, distance, horizontalTilt, midpoint, subtract } from '../pipeline/geometry';
import { extractFeatures } from '../pipeline/featureExtraction';

/**
 * Phép đo kép song song trên cùng một frame cho các đặc trưng hình học:
 * So sánh số đo 2D (mặt phẳng ảnh camera) và 3D (không gian thực MediaPipe world landmarks).
 *
 * NGUYÊN TẮC NGHIÊN CỨU:
 * - Không coi 2D và 3D phải bằng nhau (do hiện tượng hình chiếu và góc camera).
 * - Không coi 3D luôn đúng hơn 2D (worldLandmarks là mô hình suy diễn đơn mắt, có thể có nhiễu trục Z).
 * - Không lấy chênh lệch làm sai số tuyệt đối; delta phản ánh độ phân kỳ giữa 2 góc nhìn.
 * - KHÔNG thay đổi kết quả chấm điểm chính thức.
 */
export function extractDualMeasurements(frame: NormalizedPoseFrame, dynamicTurn = false): DualMeasurement[] {
  const p = frame.body;
  const w = frame.worldBody;
  const l = frame.landmarks;
  const results: DualMeasurement[] = [];

  const getConf = (names: LandmarkName[]): number => {
    const confs = names.map(n => l[n]?.confidence).filter((c): c is number => typeof c === 'number');
    return confs.length ? Math.min(...confs) : 0;
  };

  // 1. Góc gối trái (leftKneeAngle)
  if (p.leftHip && p.leftKnee && p.leftAnkle) {
    const val2D = angleAt2D(p.leftHip, p.leftKnee, p.leftAnkle);
    const val3D = w.leftHip && w.leftKnee && w.leftAnkle ? angleAt3D(w.leftHip, w.leftKnee, w.leftAnkle) : NaN;
    const conf = getConf(['leftHip', 'leftKnee', 'leftAnkle']);
    const official = Number.isFinite(val3D) ? val3D : val2D;
    results.push({
      featureId: 'leftKneeAngle',
      label: 'Đầu gối trái',
      officialSystem: 'CURRENT_3D',
      officialValue: official,
      value2D: val2D,
      value3D: val3D,
      delta: Number.isFinite(val2D) && Number.isFinite(val3D) ? Math.abs(val3D - val2D) : NaN,
      unit: '°',
      confidence: conf,
      isReliable: conf >= 0.6 && Number.isFinite(val3D),
    });
  }

  // 2. Góc gối phải (rightKneeAngle)
  if (p.rightHip && p.rightKnee && p.rightAnkle) {
    const val2D = angleAt2D(p.rightHip, p.rightKnee, p.rightAnkle);
    const val3D = w.rightHip && w.rightKnee && w.rightAnkle ? angleAt3D(w.rightHip, w.rightKnee, w.rightAnkle) : NaN;
    const conf = getConf(['rightHip', 'rightKnee', 'rightAnkle']);
    const official = Number.isFinite(val3D) ? val3D : val2D;
    results.push({
      featureId: 'rightKneeAngle',
      label: 'Đầu gối phải',
      officialSystem: 'CURRENT_3D',
      officialValue: official,
      value2D: val2D,
      value3D: val3D,
      delta: Number.isFinite(val2D) && Number.isFinite(val3D) ? Math.abs(val3D - val2D) : NaN,
      unit: '°',
      confidence: conf,
      isReliable: conf >= 0.6 && Number.isFinite(val3D),
    });
  }

  // 3. Góc khuỷu tay trái (leftElbowAngle)
  if (p.leftShoulder && p.leftElbow && p.leftWrist) {
    const val2D = angleAt2D(p.leftShoulder, p.leftElbow, p.leftWrist);
    const val3D = w.leftShoulder && w.leftElbow && w.leftWrist ? angleAt3D(w.leftShoulder, w.leftElbow, w.leftWrist) : NaN;
    const conf = getConf(['leftShoulder', 'leftElbow', 'leftWrist']);
    const official = Number.isFinite(val3D) ? val3D : val2D;
    results.push({
      featureId: 'leftElbowAngle',
      label: 'Khuỷu tay trái',
      officialSystem: 'CURRENT_3D',
      officialValue: official,
      value2D: val2D,
      value3D: val3D,
      delta: Number.isFinite(val2D) && Number.isFinite(val3D) ? Math.abs(val3D - val2D) : NaN,
      unit: '°',
      confidence: conf,
      isReliable: conf >= 0.6 && Number.isFinite(val3D),
    });
  }

  // 4. Góc khuỷu tay phải (rightElbowAngle)
  if (p.rightShoulder && p.rightElbow && p.rightWrist) {
    const val2D = angleAt2D(p.rightShoulder, p.rightElbow, p.rightWrist);
    const val3D = w.rightShoulder && w.rightElbow && w.rightWrist ? angleAt3D(w.rightShoulder, w.rightElbow, w.rightWrist) : NaN;
    const conf = getConf(['rightShoulder', 'rightElbow', 'rightWrist']);
    const official = Number.isFinite(val3D) ? val3D : val2D;
    results.push({
      featureId: 'rightElbowAngle',
      label: 'Khuỷu tay phải',
      officialSystem: 'CURRENT_3D',
      officialValue: official,
      value2D: val2D,
      value3D: val3D,
      delta: Number.isFinite(val2D) && Number.isFinite(val3D) ? Math.abs(val3D - val2D) : NaN,
      unit: '°',
      confidence: conf,
      isReliable: conf >= 0.6 && Number.isFinite(val3D),
    });
  }

  // 5. Góc mở 2 mũi chân (footOpeningAngle)
  if (p.leftHeel && p.rightHeel && p.leftFootIndex && p.rightFootIndex) {
    const val2D = angleBetween(subtract(p.leftFootIndex, p.leftHeel), subtract(p.rightFootIndex, p.rightHeel));
    let val3D = NaN;
    if (w.leftHeel && w.rightHeel && w.leftFootIndex && w.rightFootIndex) {
      const vL = subtract(w.leftFootIndex, w.leftHeel);
      const vR = subtract(w.rightFootIndex, w.rightHeel);
      const angleGround = angleBetween({ x: vL.x, y: 0, z: vL.z }, { x: vR.x, y: 0, z: vR.z });
      if (Number.isFinite(angleGround)) val3D = angleGround;
    }
    const conf = getConf(['leftHeel', 'rightHeel', 'leftFootIndex', 'rightFootIndex']);
    const official = Number.isFinite(val3D) ? val3D : val2D;
    results.push({
      featureId: 'footOpeningAngle',
      label: 'Góc mở 2 mũi chân',
      officialSystem: 'CURRENT_3D',
      officialValue: official,
      value2D: val2D,
      value3D: val3D,
      delta: Number.isFinite(val2D) && Number.isFinite(val3D) ? Math.abs(val3D - val2D) : NaN,
      unit: '°',
      confidence: conf,
      isReliable: conf >= 0.6 && Number.isFinite(official),
    });
  }

  // 6. Độ nghiêng thân trên (torsoTilt)
  if (p.leftShoulder && p.rightShoulder && p.leftHip && p.rightHip) {
    const val2D = angleBetween(subtract(midpoint(p.leftHip, p.rightHip), midpoint(p.leftShoulder, p.rightShoulder)), { x: 0, y: 1, z: 0 });
    let val3D = NaN;
    if (w.leftShoulder && w.rightShoulder && w.leftHip && w.rightHip) {
      val3D = angleBetween(subtract(midpoint(w.leftHip, w.rightHip), midpoint(w.leftShoulder, w.rightShoulder)), { x: 0, y: 1, z: 0 });
    }
    const conf = getConf(['leftShoulder', 'rightShoulder', 'leftHip', 'rightHip']);
    const official = Number.isFinite(val3D) ? val3D : val2D;
    results.push({
      featureId: 'torsoTilt',
      label: 'Độ nghiêng thân trên',
      officialSystem: 'CURRENT_3D',
      officialValue: official,
      value2D: val2D,
      value3D: val3D,
      delta: Number.isFinite(val2D) && Number.isFinite(val3D) ? Math.abs(val3D - val2D) : NaN,
      unit: '°',
      confidence: conf,
      isReliable: conf >= 0.6 && Number.isFinite(val3D),
    });
  }

  // 7. Độ lệch 2 vai (shoulderTilt)
  if (p.leftShoulder && p.rightShoulder) {
    const val2D = horizontalTilt(p.leftShoulder, p.rightShoulder);
    const val3D = w.leftShoulder && w.rightShoulder ? horizontalTilt(w.leftShoulder, w.rightShoulder) : NaN;
    const conf = getConf(['leftShoulder', 'rightShoulder']);
    results.push({
      featureId: 'shoulderTilt',
      label: 'Độ lệch 2 vai',
      officialSystem: 'CURRENT_2D',
      officialValue: val2D,
      value2D: val2D,
      value3D: val3D,
      delta: Number.isFinite(val2D) && Number.isFinite(val3D) ? Math.abs(val3D - val2D) : NaN,
      unit: '°',
      confidence: conf,
      isReliable: conf >= 0.6 && Number.isFinite(val2D),
    });
  }

  // 8. Độ lệch 2 bên hông (hipTilt)
  if (p.leftHip && p.rightHip) {
    const val2D = horizontalTilt(p.leftHip, p.rightHip);
    const val3D = w.leftHip && w.rightHip ? horizontalTilt(w.leftHip, w.rightHip) : NaN;
    const conf = getConf(['leftHip', 'rightHip']);
    results.push({
      featureId: 'hipTilt',
      label: 'Độ lệch 2 bên hông',
      officialSystem: 'CURRENT_2D',
      officialValue: val2D,
      value2D: val2D,
      value3D: val3D,
      delta: Number.isFinite(val2D) && Number.isFinite(val3D) ? Math.abs(val3D - val2D) : NaN,
      unit: '°',
      confidence: conf,
      isReliable: conf >= 0.6 && Number.isFinite(val2D),
    });
  }

  // 9. Khoảng cách 2 gót chân (heelGapRatio)
  if (p.leftHeel && p.rightHeel && p.leftShoulder && p.rightShoulder) {
    const width2D = distance(p.leftShoulder, p.rightShoulder);
    const val2D = width2D > 1e-6 ? distance(p.leftHeel, p.rightHeel) / width2D : NaN;
    let val3D = NaN;
    if (w.leftHeel && w.rightHeel && w.leftShoulder && w.rightShoulder) {
      const width3D = distance(w.leftShoulder, w.rightShoulder);
      if (width3D > 1e-6) val3D = distance(w.leftHeel, w.rightHeel) / width3D;
    }
    const conf = getConf(['leftHeel', 'rightHeel', 'leftShoulder', 'rightShoulder']);
    results.push({
      featureId: 'heelGapRatio',
      label: 'Khoảng cách 2 gót chân',
      officialSystem: 'CURRENT_2D',
      officialValue: val2D,
      value2D: val2D,
      value3D: val3D,
      delta: Number.isFinite(val2D) && Number.isFinite(val3D) ? Math.abs(val3D - val2D) : NaN,
      unit: '× vai',
      confidence: conf,
      isReliable: conf >= 0.6 && Number.isFinite(val2D),
    });
  }

  // 10. Khoảng cách tay trái - hông (leftWristHipDistance)
  if (p.leftWrist && p.leftHip && p.leftShoulder && p.rightShoulder) {
    const width2D = distance(p.leftShoulder, p.rightShoulder);
    const val2D = width2D > 1e-6 ? distance(p.leftWrist, p.leftHip) / width2D : NaN;
    let val3D = NaN;
    if (w.leftWrist && w.leftHip && w.leftShoulder && w.rightShoulder) {
      const width3D = distance(w.leftShoulder, w.rightShoulder);
      if (width3D > 1e-6) val3D = distance(w.leftWrist, w.leftHip) / width3D;
    }
    const conf = getConf(['leftWrist', 'leftHip', 'leftShoulder', 'rightShoulder']);
    results.push({
      featureId: 'leftWristHipDistance',
      label: 'Tay trái - Hông',
      officialSystem: 'CURRENT_2D',
      officialValue: val2D,
      value2D: val2D,
      value3D: val3D,
      delta: Number.isFinite(val2D) && Number.isFinite(val3D) ? Math.abs(val3D - val2D) : NaN,
      unit: '× vai',
      confidence: conf,
      isReliable: conf >= 0.6 && Number.isFinite(val2D),
    });
  }

  // 11. Khoảng cách tay phải - hông (rightWristHipDistance)
  if (p.rightWrist && p.rightHip && p.leftShoulder && p.rightShoulder) {
    const width2D = distance(p.leftShoulder, p.rightShoulder);
    const val2D = width2D > 1e-6 ? distance(p.rightWrist, p.rightHip) / width2D : NaN;
    let val3D = NaN;
    if (w.rightWrist && w.rightHip && w.leftShoulder && w.rightShoulder) {
      const width3D = distance(w.leftShoulder, w.rightShoulder);
      if (width3D > 1e-6) val3D = distance(w.rightWrist, w.rightHip) / width3D;
    }
    const conf = getConf(['rightWrist', 'rightHip', 'leftShoulder', 'rightShoulder']);
    results.push({
      featureId: 'rightWristHipDistance',
      label: 'Tay phải - Hông',
      officialSystem: 'CURRENT_2D',
      officialValue: val2D,
      value2D: val2D,
      value3D: val3D,
      delta: Number.isFinite(val2D) && Number.isFinite(val3D) ? Math.abs(val3D - val2D) : NaN,
      unit: '× vai',
      confidence: conf,
      isReliable: conf >= 0.6 && Number.isFinite(val2D),
    });
  }

  const official = extractFeatures(frame, dynamicTurn).values;
  return results.map(d => {
    const feature = official[d.featureId];
    const turn3D = dynamicTurn && ['shoulderTilt', 'leftWristHipDistance', 'rightWristHipDistance'].includes(d.featureId);
    return { ...d, officialValue: feature?.value ?? NaN,
      officialSystem: turn3D ? 'CURRENT_3D' as const : d.officialSystem,
      value3D: turn3D && d.featureId === 'shoulderTilt' ? feature?.value ?? NaN : d.value3D,
      delta: turn3D && d.featureId === 'shoulderTilt'
        ? (feature && Number.isFinite(d.value2D) ? Math.abs(feature.value - d.value2D) : NaN) : d.delta,
      isReliable: !!feature && feature.confidence >= .6 && Number.isFinite(feature.value),
    };
  });
}
