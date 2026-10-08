import { POSE_CONFIG as C } from '../config';
import type { CalibrationProfile, CanonicalPoseFrame, LandmarkName, LightingMetrics, QualityCheck, QualityReport } from '../types';
import { distance, flat, mean, median, midpoint, variation } from './geometry';
import { aspectCorrectedImage, measurements } from './normalization';
import { usable } from './confidenceFilter';
import { kneeEvidenceIssue } from './kneeEvidence';
export const REQUIRED: LandmarkName[] = ['nose', 'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle', 'leftHeel', 'rightHeel', 'leftFootIndex', 'rightFootIndex'];
const PREPARATION_REQUIRED = REQUIRED.filter(n => !n.endsWith('Elbow') && !n.endsWith('Wrist'));
export function lightingMetrics(rgba: ArrayLike<number>): LightingMetrics {
  let sum = 0, dark = 0, bright = 0, count = 0;
  for (let i = 0; i < rgba.length; i += 4) { const y = 0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2]; sum += y; dark += Number(y < 25); bright += Number(y > 245); count++; }
  return { mean: count ? sum / count : 0, darkRatio: count ? dark / count : 1, brightRatio: count ? bright / count : 0 };
}
export class QualityChecker {
  private history: { frame: CanonicalPoseFrame; coverage: number; confidence: number }[] = [];
  private goodSince: number | null = null;
  private evidence: { timestampMs:number; passed:boolean }[] = [];
  private evidenceStartedAt: number | null = null;
  reset() { this.history = []; this.goodSince = null; this.evidence = []; this.evidenceStartedAt = null; }
  check(frame: CanonicalPoseFrame, lighting: LightingMetrics, calibration?: CalibrationProfile, options?: { preparation?: boolean; allowTurn?: boolean; assessKnees?: boolean; relaxedPosture?: boolean; countdown?: boolean; transition?: boolean; tolerateBriefLoss?: boolean }): QualityReport {
    // Hands against the thighs may be occluded even in a correct starting pose.
    // Acquisition needs the full head/torso/legs, not proof of every arm joint.
    // Observed arms still participate in boundary checks; no points are inferred.
    const required = options?.preparation ? PREPARATION_REQUIRED : REQUIRED;
    const points = required.map(n => frame.landmarks[n]), valid = points.filter(usable);
    const coverage = valid.length / required.length, confidence = mean(valid.map(p => p.confidence));
    this.history.push({ frame, coverage, confidence });
    this.history = this.history.filter(v => frame.timestampMs - v.frame.timestampMs <= C.stabilityWindowMs);
    const recent = this.history.filter(v => frame.timestampMs - v.frame.timestampMs <= 750);
    const rollingCoverage = mean(recent.map(v => v.coverage)), rollingConfidence = mean(recent.map(v => v.confidence));
    const allowTurn = !!options?.allowTurn;
    const m = this.history.map(v => {
      if (!allowTurn) return measurements(v.frame);
      const p = v.frame.landmarks;
      if (!p.leftShoulder || !p.rightShoulder || !p.leftHip || !p.rightHip) return null;
      const shoulders = midpoint(flat(aspectCorrectedImage(v.frame, p.leftShoulder)), flat(aspectCorrectedImage(v.frame, p.rightShoulder)));
      const root = midpoint(flat(aspectCorrectedImage(v.frame, p.leftHip)), flat(aspectCorrectedImage(v.frame, p.rightHip)));
      return { root, torsoLength: distance(shoulders, root) };
    }).filter((v): v is NonNullable<typeof v> => !!v);
    const length = calibration?.torsoLength || median(m.map(v => v.torsoLength));
    const center = m.length ? { x: median(m.map(v => v.root.x)), y: median(m.map(v => v.root.y)), z: 0 } : { x: 0, y: 0, z: 0 };
    const rootMovement = m.length && length > 0 ? Math.max(...m.map(v => distance(v.root, center))) / length : Infinity;
    // Up to twice the existing vertical settling tolerance, without relaxing lateral drift.
    // This gates tracking only; absolute hip height never contributes to posture points.
    const staticMovement = options?.relaxedPosture && m.length && length > 0
      ? Math.max(...m.map(v => Math.hypot(v.root.x - center.x, (v.root.y - center.y) / 2))) / length : rootMovement;
    const scaleVariation = variation(m.map(v => v.torsoLength));
    // Countdown is presentation, not a graded static hold. Permit small settling.
    // During an action transition, movement is expected and must remain observed.
    // Missing joints, lighting, framing and orientation still gate each real frame.
    const motionStability = allowTurn || options?.transition
      ? rootMovement <= 1.25 && scaleVariation <= 0.35
      : options?.countdown || options?.preparation
        ? staticMovement <= C.maximumRootMovement * 2 && scaleVariation <= C.maximumScaleVariation * 1.5
        : staticMovement <= C.maximumRootMovement && scaleVariation <= C.maximumScaleVariation;
    const p = frame.landmarks, ls = p.leftShoulder?.world, rs = p.rightShoulder?.world, lh = p.leftHip?.world, rh = p.rightHip?.world;
    const facing = !!ls && !!rs && !!lh && !!rh && Math.abs(ls.z - rs.z) / Math.max(distance(ls, rs), 1e-6) < 0.35 && Math.abs(lh.z - rh.z) / Math.max(distance(lh, rh), 1e-6) < 0.4;
    const head = allowTurn ? [p.nose, p.leftEar, p.rightEar].find(usable) : p.nose;
    const nose = head?.image, shoulderY = p.leftShoulder && p.rightShoulder ? (p.leftShoulder.image.y + p.rightShoulder.image.y) / 2 : NaN;
    const headroom = nose ? nose.y - Math.abs(shoulderY - nose.y) * 0.3 > C.frameMargin : false;
    const kneeIssue = options?.assessKnees ? kneeEvidenceIssue(frame, recent.map(v => v.frame), { allowMotion: options?.transition }) : null;
    // Side-on turns naturally hide the far arm/leg. Require observed torso depth
    // and one complete visible leg, rather than a quota of frontal landmarks.
    const torsoNames = ['leftShoulder', 'rightShoulder', 'leftHip', 'rightHip'] as const;
    const torsoReliable = torsoNames.every(n => usable(p[n]) && p[n]?.world &&
      Object.values(p[n]!.world!).every(Number.isFinite));
    const visibleLeg = (['left', 'right'] as const).some(side =>
      usable(p[`${side}Knee`]) && usable(p[`${side}Ankle`]));
    const boundaryPoints = REQUIRED.map(n => p[n]).filter(usable);
    const framing = headroom && (allowTurn ? torsoReliable && visibleLeg : valid.length === required.length) && boundaryPoints.every(v => v.image.x > C.frameMargin && v.image.x < 1 - C.frameMargin && v.image.y > C.frameMargin && v.image.y < 1 - C.frameMargin);
    const footVisible = allowTurn || (['left', 'right'] as const).every(side => { const heel = p[`${side}Heel`], toe = p[`${side}FootIndex`]; return heel && toe && distance(flat(aspectCorrectedImage(frame, heel)), flat(aspectCorrectedImage(frame, toe))) > length * 0.025; });
    const actuallyCropped = (!!nose && !headroom) || boundaryPoints.some(v => v.image.x <= C.frameMargin || v.image.x >= 1-C.frameMargin || v.image.y <= C.frameMargin || v.image.y >= 1-C.frameMargin);
    const unclearFeet = !allowTurn && (!footVisible || (['leftHeel','rightHeel','leftFootIndex','rightFootIndex'] as const).some(n => !usable(p[n])));
    const visibilityMessage = unclearFeet
      ? 'Camera chưa nhận rõ bàn chân. Giữ chân không bị che và tăng ánh sáng vùng chân.'
      : 'Camera chưa nhận rõ các khớp. Tăng ánh sáng phía trước và tránh che khuất thân, tay hoặc chân.';
    const checks: QualityCheck[] = [
      { id: 'lighting', label: 'Ánh sáng', passed: Number.isFinite(lighting.mean) && lighting.mean >= C.lighting.minimumMean && lighting.mean <= C.lighting.maximumMean && lighting.darkRatio < C.lighting.maximumDarkRatio && lighting.brightRatio < C.lighting.maximumBrightRatio, message: 'Bổ sung ánh sáng phía trước, tránh ngược sáng.' },
      { id: 'person', label: 'Một người', passed: frame.personCount === 1, message: frame.personCount > 1 ? 'Chỉ để một người trong khung hình.' : 'Đứng vào trước camera.' },
      { id: 'framing', label: 'Thấy toàn thân', passed: framing && footVisible, message: actuallyCropped ? 'Lùi ra để camera thấy trọn đầu, tay và bàn chân; giữ khoảng trống quanh người.' : visibilityMessage },
      { id: 'reliability', label: 'Khớp rõ ràng', passed: !kneeIssue && (allowTurn ? torsoReliable && visibleLeg : (rollingCoverage >= C.reliabilityCoverage && rollingConfidence >= C.reliabilityMean && coverage === 1 && confidence >= C.reliabilityMean)), message: kneeIssue ?? (allowTurn ? 'Camera cần thấy rõ hai vai, hông và ít nhất một chân để theo dõi góc quay.' : visibilityMessage) },
      // Track visible steps so the movement scorer can mark them incorrect.
      // Only excessive tracking disruption should abort the camera evidence.
      { id: 'stability', label: 'Khung hình ổn định', passed: motionStability, message: allowTurn || options?.transition ? 'Giữ camera cố định và toàn thân trong khung hình.' : 'Đặt máy trên giá cố định và đứng yên tại chỗ.' },
      { id: 'orientation', label: 'Nhìn chính diện', passed: allowTurn ? true : facing, message: 'Xoay người và camera để thấy chính diện hai vai và hông.' },
    ];
    const rawPassed = checks.every(c => c.passed);
    if (frame.timestampMs - (this.evidence.at(-1)?.timestampMs ?? frame.timestampMs) > C.maximumFrameGapMs) {
      this.evidence = []; this.evidenceStartedAt = null;
    }
    this.evidenceStartedAt ??= frame.timestampMs;
    this.evidence.push({ timestampMs:frame.timestampMs, passed:rawPassed });
    this.evidence = this.evidence.filter(e => frame.timestampMs-e.timestampMs <= C.qualityWarmupMs).slice(-60);
    // One intermittent missing wrist must not require another uninterrupted
    // warmup forever. The current frame still needs ALL acquisition checks.
    const recoveredWindow = !!options?.tolerateBriefLoss && this.evidence.length >= 6 &&
      frame.timestampMs-this.evidenceStartedAt >= C.qualityWarmupMs &&
      frame.timestampMs-this.evidence[0].timestampMs >= C.qualityWarmupMs-C.maximumFrameGapMs &&
      this.evidence.filter(e=>e.passed).length/this.evidence.length >= C.reliabilityCoverage;
    if (!rawPassed) this.goodSince = null;
    else if (this.goodSince === null) this.goodSince = frame.timestampMs;
    // Require warmup for acquisition/graded static holds. Repeating that warmup
    // during a known action discards its first trajectory; use current evidence.
    const passed = rawPassed && (allowTurn || options?.transition || options?.countdown || recoveredWindow || frame.timestampMs - (this.goodSince ?? frame.timestampMs) >= C.qualityWarmupMs);
    return { passed, reasons: rawPassed && !passed ? ['Giữ ổn định thêm một giây để xác nhận chất lượng.'] : checks.filter(c => !c.passed).map(c => c.message), checks, metrics: { coverage: rollingCoverage, meanConfidence: rollingConfidence, rootMovement, scaleVariation, lighting } };
  }
}
