import { POSE_CONFIG as C } from '../config';
import type { CalibrationProfile, CanonicalPoseFrame, LandmarkName, LightingMetrics, QualityCheck, QualityReport } from '../types';
import { distance, flat, mean, median, variation } from './geometry';
import { aspectCorrectedImage, measurements } from './normalization';
import { usable } from './confidenceFilter';
import { kneeEvidenceIssue } from './kneeEvidence';
export const REQUIRED: LandmarkName[] = ['nose', 'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle', 'leftHeel', 'rightHeel', 'leftFootIndex', 'rightFootIndex'];
export function lightingMetrics(rgba: ArrayLike<number>): LightingMetrics {
  let sum = 0, dark = 0, bright = 0, count = 0;
  for (let i = 0; i < rgba.length; i += 4) { const y = 0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2]; sum += y; dark += Number(y < 25); bright += Number(y > 245); count++; }
  return { mean: count ? sum / count : 0, darkRatio: count ? dark / count : 1, brightRatio: count ? bright / count : 0 };
}
export class QualityChecker {
  private history: { frame: CanonicalPoseFrame; coverage: number; confidence: number }[] = [];
  private goodSince: number | null = null;
  reset() { this.history = []; this.goodSince = null; }
  check(frame: CanonicalPoseFrame, lighting: LightingMetrics, calibration?: CalibrationProfile, options?: { allowTurn?: boolean; assessKnees?: boolean }): QualityReport {
    const points = REQUIRED.map(n => frame.landmarks[n]), valid = points.filter(usable);
    const coverage = valid.length / REQUIRED.length, confidence = mean(valid.map(p => p.confidence));
    this.history.push({ frame, coverage, confidence });
    this.history = this.history.filter(v => frame.timestampMs - v.frame.timestampMs <= C.stabilityWindowMs);
    const recent = this.history.filter(v => frame.timestampMs - v.frame.timestampMs <= 750);
    const rollingCoverage = mean(recent.map(v => v.coverage)), rollingConfidence = mean(recent.map(v => v.confidence));
    const m = this.history.map(v => measurements(v.frame)).filter((v): v is NonNullable<typeof v> => !!v);
    const length = calibration?.torsoLength || median(m.map(v => v.torsoLength));
    const center = m.length ? { x: median(m.map(v => v.root.x)), y: median(m.map(v => v.root.y)), z: 0 } : { x: 0, y: 0, z: 0 };
    const rootMovement = m.length && length > 0 ? Math.max(...m.map(v => distance(v.root, center))) / length : Infinity;
    const scaleVariation = variation(m.map(v => v.torsoLength));
    const p = frame.landmarks, ls = p.leftShoulder?.world, rs = p.rightShoulder?.world, lh = p.leftHip?.world, rh = p.rightHip?.world;
    const facing = !!ls && !!rs && !!lh && !!rh && Math.abs(ls.z - rs.z) / Math.max(distance(ls, rs), 1e-6) < 0.35 && Math.abs(lh.z - rh.z) / Math.max(distance(lh, rh), 1e-6) < 0.4;
    const nose = p.nose?.image, shoulderY = p.leftShoulder && p.rightShoulder ? (p.leftShoulder.image.y + p.rightShoulder.image.y) / 2 : NaN;
    const headroom = nose ? nose.y - Math.abs(shoulderY - nose.y) * 0.3 > C.frameMargin : false;
    const allowTurn = !!options?.allowTurn;
    const kneeIssue = options?.assessKnees ? kneeEvidenceIssue(frame, recent.map(v => v.frame)) : null;
    const minFramingValid = allowTurn ? Math.floor(REQUIRED.length * 0.75) : REQUIRED.length;
    const framing = headroom && valid.length >= minFramingValid && valid.every(v => v.image.x > C.frameMargin && v.image.x < 1 - C.frameMargin && v.image.y > C.frameMargin && v.image.y < 1 - C.frameMargin);
    const footVisible = allowTurn || (['left', 'right'] as const).every(side => { const heel = p[`${side}Heel`], toe = p[`${side}FootIndex`]; return heel && toe && distance(flat(aspectCorrectedImage(frame, heel)), flat(aspectCorrectedImage(frame, toe))) > length * 0.025; });
    const checks: QualityCheck[] = [
      { id: 'lighting', label: 'Ánh sáng', passed: Number.isFinite(lighting.mean) && lighting.mean >= C.lighting.minimumMean && lighting.mean <= C.lighting.maximumMean && lighting.darkRatio < C.lighting.maximumDarkRatio && lighting.brightRatio < C.lighting.maximumBrightRatio, message: 'Bổ sung ánh sáng phía trước, tránh ngược sáng.' },
      { id: 'person', label: 'Một người', passed: frame.personCount === 1, message: frame.personCount > 1 ? 'Chỉ để một người trong khung hình.' : 'Đứng vào trước camera.' },
      { id: 'framing', label: 'Thấy toàn thân', passed: framing && footVisible, message: 'Lùi ra để thấy đầu, hai tay và cả bàn chân; giữ khoảng trống quanh người.' },
      { id: 'reliability', label: 'Khớp rõ ràng', passed: !kneeIssue && (allowTurn ? (rollingCoverage >= 0.75 && rollingConfidence >= 0.6) : (rollingCoverage >= C.reliabilityCoverage && rollingConfidence >= C.reliabilityMean && coverage === 1 && confidence >= C.reliabilityMean)), message: kneeIssue ?? 'Giữ các khớp không bị che khuất và hướng người về camera.' },
      { id: 'stability', label: 'Khung hình ổn định', passed: allowTurn ? (rootMovement <= C.maximumRootMovement * 3 && scaleVariation <= C.maximumScaleVariation * 2.5) : (rootMovement <= C.maximumRootMovement && scaleVariation <= C.maximumScaleVariation), message: 'Đặt máy trên giá cố định và đứng yên tại chỗ.' },
      { id: 'orientation', label: 'Nhìn chính diện', passed: allowTurn ? true : facing, message: 'Xoay người và camera để thấy chính diện hai vai và hông.' },
    ];
    const rawPassed = checks.every(c => c.passed);
    if (!rawPassed) this.goodSince = null;
    else if (this.goodSince === null) this.goodSince = frame.timestampMs;
    // Fail immediately for safety; require a continuous second before recovering.
    const passed = rawPassed && frame.timestampMs - (this.goodSince ?? frame.timestampMs) >= C.qualityWarmupMs;
    return { passed, reasons: rawPassed && !passed ? ['Giữ ổn định thêm một giây để xác nhận chất lượng.'] : checks.filter(c => !c.passed).map(c => c.message), checks, metrics: { coverage: rollingCoverage, meanConfidence: rollingConfidence, rootMovement, scaleVariation, lighting } };
  }
}
