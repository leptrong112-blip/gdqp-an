import type { DualMeasurement, FeatureId, MovementId, PoseStage, QualityReport } from '../types';
import type { ScoreResult } from '../scoring/scoringTypes';
import { mad, median } from '../pipeline/geometry';

export interface DiagnosticSessionConfig {
  participantCode?: string;
  trialCode?: string;
  device?: 'laptop' | 'phone' | 'other';
  cameraHeight: 'desk' | 'chest' | 'floor' | 'high' | 'other';
  cameraAngle: 'straight' | 'tilted_down' | 'tilted_up' | 'other';
  distanceMeters: 'near' | 'optimal' | 'far';
  clothing: 'fitted' | 'uniform_jacket' | 'loose' | 'normal';
  lighting: 'good' | 'backlit' | 'low_light';
  notes?: string;
}

export interface TeacherReferenceEvaluation {
  status: 'MEETS_CRITERIA' | 'DOES_NOT_MEET' | 'INSUFFICIENT_EVIDENCE' | 'NOT_EVALUATED';
  unmetCriteria?: string[];
  teacherNotes?: string;
  evaluatedAt?: string;
}

export interface DiagnosticFrameRecord {
  timestampMs: number;
  stage?: PoseStage;
  inferenceFps?: number;
  qualityPassed: boolean;
  qualityReasons: string[];
  metrics: {
    coverage: number;
    meanConfidence: number;
    rootMovement: number;
    scaleVariation: number;
  };
  features: Partial<Record<FeatureId, { value: number; confidence: number }>>;
  dualMeasurements: DualMeasurement[];
}

export interface DiagnosticSessionReport {
  sessionId: string;
  recordedAt: string;
  movementId: MovementId;
  movementName: string;
  rubricVersion: string;
  testConfig: DiagnosticSessionConfig;
  referenceEvaluation: TeacherReferenceEvaluation;
  frameCount: number;
  durationMs: number;
  qualityInterruptionCount: number;
  truncated: boolean;
  aiAssessment: 'PASS' | 'FAIL' | 'INSUFFICIENT_EVIDENCE' | 'NOT_EVALUATED';
  refusalReasons: string[];
  officialScore?: {
    total: number;
    passed: boolean;
    assessment?: 'pass' | 'fail' | 'incomplete';
    unassessedPoints?: number;
    criteria: Array<{
      id: string;
      label: string;
      points: number;
      maximum: number;
      statusLevel: string;
      mistakes: string[];
      measurements?: Array<{ feature: string; value: number; variability: number }>;
    }>;
  };
  summary: {
    featureAggregates: Record<
      string,
      {
        officialMedian: number;
        median2D: number;
        median3D: number;
        medianDelta: number;
        mad: number;
        unit: string;
        officialSystem: 'CURRENT_3D' | 'CURRENT_2D';
      }
    >;
    topDeductions: string[];
    unreliableFeatures: string[];
  };
  analysis: {
    observed: string[];
    hypothesis: string[];
    needsHumanReview: string[];
  };
  frames?: DiagnosticFrameRecord[];
}

const DEFAULT_CONFIG: DiagnosticSessionConfig = {
  device: 'other',
  cameraHeight: 'desk',
  cameraAngle: 'straight',
  distanceMeters: 'optimal',
  clothing: 'normal',
  lighting: 'good',
};

const DEFAULT_EVALUATION: TeacherReferenceEvaluation = {
  status: 'NOT_EVALUATED',
  unmetCriteria: [],
  teacherNotes: '',
};

// Telemetry only, no images: ~3 minutes at the UI's 5 Hz sampling rate.
const MAX_SESSION_FRAMES = 1000;

export function diagnosticAssessment(result?: ScoreResult | null): DiagnosticSessionReport['aiAssessment'] {
  if (!result) return 'NOT_EVALUATED';
  if (result.status === 'scored' && result.assessment) {
    return result.assessment === 'incomplete' ? 'INSUFFICIENT_EVIDENCE' : result.assessment === 'pass' ? 'PASS' : 'FAIL';
  }
  if (result.status === 'notScorable' || result.criteria.some(c => c.statusLevel === 'NOT_SCORABLE')) return 'INSUFFICIENT_EVIDENCE';
  const passed = result.passed ?? (result.total >= 65 && result.criteria.every(c => !c.required || c.points / c.maximum >= .6));
  return passed ? 'PASS' : 'FAIL';
}

export class DiagnosticSessionRecorder {
  private isRecording = false;
  private sessionId = '';
  private movementId: MovementId = 'attention';
  private config: DiagnosticSessionConfig = { ...DEFAULT_CONFIG };
  private referenceEvaluation: TeacherReferenceEvaluation = { ...DEFAULT_EVALUATION };
  private frames: DiagnosticFrameRecord[] = [];
  private startTime = 0;
  private qualityInterruptionCount = 0;
  private lastQualityPassed = true;
  private officialResult: ScoreResult | null = null;
  private truncated = false;
  private sourceStart: number | null = null;
  private lastSource: number | null = null;

  start(movementId: MovementId, config?: Partial<DiagnosticSessionConfig>) {
    this.isRecording = true;
    this.sessionId = `qpan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    this.movementId = movementId;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.referenceEvaluation = { ...DEFAULT_EVALUATION };
    this.frames = [];
    this.startTime = Date.now();
    this.qualityInterruptionCount = 0;
    this.lastQualityPassed = true;
    this.officialResult = null;
    this.truncated = false;
    this.sourceStart = this.lastSource = null;
  }

  recordFrame(
    quality: QualityReport,
    features?: Partial<Record<FeatureId, { value: number; confidence: number }>>,
    dualMeasurements?: DualMeasurement[],
    metadata?: { timestampMs: number; stage: PoseStage; inferenceFps: number }
  ) {
    if (!this.isRecording) return;
    if (this.frames.length >= MAX_SESSION_FRAMES) { this.truncated = true; this.stop(); return; }
    if (metadata) {
      if (!Number.isFinite(metadata.timestampMs) || (this.lastSource !== null && metadata.timestampMs <= this.lastSource)) return;
      this.sourceStart ??= metadata.timestampMs;
      this.lastSource = metadata.timestampMs;
    }

    if (this.lastQualityPassed && !quality.passed) {
      this.qualityInterruptionCount++;
    }
    this.lastQualityPassed = quality.passed;

    this.frames.push({
      timestampMs: metadata ? metadata.timestampMs - this.sourceStart! : Date.now() - this.startTime,
      stage: metadata?.stage,
      inferenceFps: metadata?.inferenceFps,
      qualityPassed: quality.passed,
      qualityReasons: [...quality.reasons],
      metrics: {
        coverage: quality.metrics.coverage,
        meanConfidence: quality.metrics.meanConfidence,
        rootMovement: quality.metrics.rootMovement,
        scaleVariation: quality.metrics.scaleVariation,
      },
      features: features ? structuredClone(features) : {},
      dualMeasurements: dualMeasurements ? structuredClone(dualMeasurements) : [],
    });
  }

  stop(): boolean {
    if (!this.isRecording) return false;
    this.isRecording = false;
    return true;
  }

  setReferenceEvaluation(evalData: Partial<TeacherReferenceEvaluation>) {
    this.referenceEvaluation = {
      ...this.referenceEvaluation,
      ...evalData,
      evaluatedAt: new Date().toISOString(),
    };
  }

  finish(result: ScoreResult) {
    if (!this.isRecording) return;
    this.officialResult = structuredClone(result);
    this.stop();
  }

  setTestConfig(config: Partial<DiagnosticSessionConfig>) {
    this.config = { ...this.config, ...config };
  }

  getActiveStatus() {
    return {
      isRecording: this.isRecording,
      sessionId: this.sessionId,
      frameCount: this.frames.length,
      maxFrames: MAX_SESSION_FRAMES,
      durationMs: this.isRecording ? Date.now() - this.startTime : 0,
      config: this.config,
      referenceEvaluation: this.referenceEvaluation,
      truncated: this.truncated,
    };
  }

  clear() {
    this.isRecording = false;
    this.sessionId = '';
    this.frames = [];
    this.qualityInterruptionCount = 0;
    this.referenceEvaluation = { ...DEFAULT_EVALUATION };
    this.officialResult = null;
    this.truncated = false;
    this.sourceStart = this.lastSource = null;
  }

  generateReport(officialResult: ScoreResult | null = this.officialResult): DiagnosticSessionReport | null {
    if (!this.frames.length && !this.sessionId) return null;

    const featureKeys: FeatureId[] = [
      'leftKneeAngle',
      'rightKneeAngle',
      'leftElbowAngle',
      'rightElbowAngle',
      'footOpeningAngle',
      'heelGapRatio',
      'leftWristHipDistance',
      'rightWristHipDistance',
      'torsoTilt',
      'shoulderTilt',
      'hipTilt',
    ];

    const aggregates: DiagnosticSessionReport['summary']['featureAggregates'] = {};
    const unreliable: string[] = [];

    for (const key of featureKeys) {
      const duals = this.frames
        .map(f => f.dualMeasurements.find(d => d.featureId === key))
        .filter((d): d is DualMeasurement => !!d);

      if (duals.length > 0) {
        const offVals = duals.map(d => d.officialValue).filter(Number.isFinite);
        const vals2D = duals.map(d => d.value2D).filter(Number.isFinite);
        const vals3D = duals.map(d => d.value3D).filter(Number.isFinite);
        const deltas = duals.map(d => d.delta).filter(Number.isFinite);
        const confs = duals.map(d => d.confidence).filter(Number.isFinite);

        const medOff = median(offVals);
        const med2D = median(vals2D);
        const med3D = median(vals3D);
        const medDelta = median(deltas);
        const medConf = median(confs);
        const variability = mad(offVals);

        aggregates[key] = {
          officialMedian: medOff,
          median2D: med2D,
          median3D: med3D,
          medianDelta: medDelta,
          mad: variability,
          unit: duals[0].unit,
          officialSystem: duals[0].officialSystem,
        };

        if (medConf < 0.65 || variability > 12) {
          unreliable.push(duals[0].label);
        }
      }
    }

    const observed: string[] = [];
    const hypothesis: string[] = [];
    const needsHumanReview: string[] = [];

    // Phân tích OBSERVED
    if (aggregates.footOpeningAngle) {
      const { median2D, median3D, medianDelta } = aggregates.footOpeningAngle;
      if (Number.isFinite(medianDelta) && medianDelta > 20) {
        observed.push(
          `Góc mở 2 mũi chân phân kỳ mạnh giữa 2D (${median2D.toFixed(1)}°) và 3D ground plane (${median3D.toFixed(1)}°), chênh lệch trung vị ${medianDelta.toFixed(1)}°.`
        );
        hypothesis.push(
          'Góc đặt camera (hướng phẳng hoặc hơi chúc) gây co ngắn hình chiếu 2D của bàn chân; 3D ground plane giữ được góc thực tế trên sàn.'
        );
      } else {
        observed.push(`Góc mở 2 mũi chân ổn định ở mức ~${aggregates.footOpeningAngle.officialMedian.toFixed(1)}°.`);
      }
    }

    if (aggregates.leftKneeAngle && aggregates.rightKneeAngle) {
      const lDelta = aggregates.leftKneeAngle.medianDelta;
      const rDelta = aggregates.rightKneeAngle.medianDelta;
      if (lDelta > 10 || rDelta > 10) {
        observed.push(
          `Góc gối 3D có độ lệch đáng kể so với 2D (trái: ${lDelta.toFixed(1)}°, phải: ${rDelta.toFixed(1)}°).`
        );
        hypothesis.push(
          'Khi nhìn từ chính diện, chuyển động gập gối về phía trước (mặt phẳng đứng dọc Sagittal) khó quan sát trên ảnh 2D; MediaPipe worldLandmarks phải dựa vào suy diễn chiều sâu Z.'
        );
      }
    }

    if (aggregates.leftWristHipDistance || aggregates.rightWristHipDistance) {
      const lDist = aggregates.leftWristHipDistance?.officialMedian ?? 0;
      const rDist = aggregates.rightWristHipDistance?.officialMedian ?? 0;
      if (lDist > 0.6 || rDist > 0.6) {
        observed.push(
          `Khoảng cách cổ tay - hông đo được khá lớn (trái: ${lDist.toFixed(2)}, phải: ${rDist.toFixed(2)} bề rộng vai).`
        );
        hypothesis.push(
          'Trang phục rộng, áo khoác đồng phục hoặc tỷ lệ hông tự nhiên khiến khoảng cách đo từ khớp hông trong khung xương ra tay tăng lên dù tay buông sát ngoài đùi.'
        );
      }
    }

    // Phân tích đối chiếu Giáo viên
    const aiAssessment = diagnosticAssessment(officialResult);
    if (this.referenceEvaluation.status === 'INSUFFICIENT_EVIDENCE' || aiAssessment === 'INSUFFICIENT_EVIDENCE' || aiAssessment === 'NOT_EVALUATED') {
      needsHumanReview.push('Chưa đủ kết quả AI hoặc đánh giá tham chiếu để kết luận đồng thuận/bất đồng; thiếu dữ liệu không có nghĩa là thực hiện sai.');
    } else if (this.referenceEvaluation.status !== 'NOT_EVALUATED') {
      const teacherStatus = this.referenceEvaluation.status;
      const aiPassed = aiAssessment === 'PASS';
      const teacherPassed = teacherStatus === 'MEETS_CRITERIA';

      if (teacherPassed !== aiPassed) {
        needsHumanReview.push(
          `BẤT ĐỒNG ĐÁNH GIÁ: Giáo viên đánh giá "${teacherStatus === 'MEETS_CRITERIA' ? 'ĐẠT (Đáp ứng tiêu chí)' : 'CHƯA ĐẠT'}" nhưng hệ thống AI chấm "${aiPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}". Cần kiểm tra video và tiêu chí: ${(this.referenceEvaluation.unmetCriteria || []).join(', ') || 'Chung'}.`
        );
      } else {
        observed.push(`Đánh giá của giáo viên và kết luận của AI đồng thuận: ${aiPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}.`);
      }
    } else {
      needsHumanReview.push('Chưa nhập đánh giá tham chiếu của giáo viên để so sánh đối chuẩn.');
    }

    if (unreliable.length > 0) {
      needsHumanReview.push(`Các khớp có độ tin cậy thấp hoặc dao động lớn trong phiên: ${unreliable.join(', ')}.`);
    }

    const durationMs = this.frames.length > 1
      ? this.frames[this.frames.length - 1].timestampMs - this.frames[0].timestampMs
      : 0;

    const report: DiagnosticSessionReport = {
      sessionId: this.sessionId,
      recordedAt: new Date(this.startTime).toISOString(),
      movementId: this.movementId,
      movementName: this.movementId === 'attention' ? 'Đứng nghiêm' : this.movementId === 'atEase' ? 'Đứng nghỉ' : this.movementId,
      rubricVersion: 'v1.7-salute-hand-observation',
      testConfig: { ...this.config },
      referenceEvaluation: { ...this.referenceEvaluation },
      frameCount: this.frames.length,
      durationMs,
      qualityInterruptionCount: this.qualityInterruptionCount,
      truncated: this.truncated,
      aiAssessment,
      refusalReasons: officialResult?.status === 'notScorable' ? [...officialResult.reasons] : [],
      officialScore: officialResult && officialResult.status === 'scored'
        ? {
            total: officialResult.total,
            passed: aiAssessment === 'PASS',
            assessment: officialResult.assessment,
            unassessedPoints: officialResult.unassessedPoints,
            criteria: officialResult.criteria.map(c => ({
              id: c.id,
              label: c.label,
              points: c.points,
              maximum: c.maximum,
              statusLevel: c.statusLevel ?? 'NEEDS_ADJUSTMENT',
              mistakes: c.mistakes ?? [],
              measurements: c.measurements.map(m => ({ ...m })),
            })),
          }
        : undefined,
      summary: {
        featureAggregates: aggregates,
        topDeductions: officialResult && officialResult.status === 'scored'
          ? officialResult.criteria
              .filter(c => c.statusLevel !== 'NOT_SCORABLE' && c.points < c.maximum)
              .sort((a, b) => (b.maximum - b.points) - (a.maximum - a.points))
              .map(c => `${c.label} (-${(c.maximum - c.points).toFixed(1)}đ)`)
          : [],
        unreliableFeatures: unreliable,
      },
      analysis: {
        observed,
        hypothesis,
        needsHumanReview,
      },
      frames: structuredClone(this.frames),
    };

    return report;
  }
}

export function exportReportToJson(report: DiagnosticSessionReport): void {
  const jsonStr = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `qpan_pose_${report.movementId}_${report.sessionId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function diagnosticReportToCsv(report: DiagnosticSessionReport): string {

  const headers = [
    'timestampMs',
    'qualityPassed',
    'coverage',
    'meanConfidence',
    'rootMovement',
    'scaleVariation',
    'leftKneeAngle_3D',
    'leftKneeAngle_2D',
    'rightKneeAngle_3D',
    'rightKneeAngle_2D',
    'footOpeningAngle_3D',
    'footOpeningAngle_2D',
    'leftElbowAngle_3D',
    'leftElbowAngle_2D',
    'rightElbowAngle_3D',
    'rightElbowAngle_2D',
    'heelGapRatio_2D',
    'heelGapRatio_3D',
    'leftWristHip_2D',
    'rightWristHip_2D',
    'torsoTilt_3D',
    'shoulderTilt_2D',
    'hipTilt_2D',
    'sessionId', 'participantCode', 'trialCode', 'device', 'movementId', 'rubricVersion',
    'stage', 'inferenceFps', 'bodyYaw', 'shoulderTilt_official', 'leftWristHip_official', 'rightWristHip_official',
    'aiAssessment', 'aiTotal', 'teacherAssessment', 'refusalReasons', 'truncated',
    'scoreAssessment', 'unassessedPoints',
  ];

  const rows = (report.frames ?? []).map(f => {
    const dMap = new Map(f.dualMeasurements.map(d => [d.featureId, d]));
    const g = (k: FeatureId, sys: '2D' | '3D') => {
      const d = dMap.get(k);
      if (!d) return '';
      const v = sys === '2D' ? d.value2D : d.value3D;
      return Number.isFinite(v) ? v.toFixed(2) : '';
    };

    return [
      f.timestampMs,
      f.qualityPassed ? 1 : 0,
      f.metrics.coverage.toFixed(2),
      f.metrics.meanConfidence.toFixed(2),
      f.metrics.rootMovement.toFixed(4),
      f.metrics.scaleVariation.toFixed(4),
      g('leftKneeAngle', '3D'),
      g('leftKneeAngle', '2D'),
      g('rightKneeAngle', '3D'),
      g('rightKneeAngle', '2D'),
      g('footOpeningAngle', '3D'),
      g('footOpeningAngle', '2D'),
      g('leftElbowAngle', '3D'),
      g('leftElbowAngle', '2D'),
      g('rightElbowAngle', '3D'),
      g('rightElbowAngle', '2D'),
      g('heelGapRatio', '2D'),
      g('heelGapRatio', '3D'),
      g('leftWristHipDistance', '2D'),
      g('rightWristHipDistance', '2D'),
      g('torsoTilt', '3D'),
      g('shoulderTilt', '2D'),
      g('hipTilt', '2D'),
      report.sessionId, report.testConfig.participantCode ?? '', report.testConfig.trialCode ?? '', report.testConfig.device ?? '',
      report.movementId, report.rubricVersion, f.stage ?? '', f.inferenceFps ?? '',
      f.features.bodyYaw?.value ?? '', f.features.shoulderTilt?.value ?? '',
      f.features.leftWristHipDistance?.value ?? '', f.features.rightWristHipDistance?.value ?? '',
      report.aiAssessment, report.officialScore?.total ?? '', report.referenceEvaluation.status,
      report.refusalReasons.join(' | '), report.truncated ? 1 : 0,
      report.officialScore?.assessment ?? '', report.officialScore?.unassessedPoints ?? '',
    ].map(value => {
      let cell = String(value);
      if (/^[=+@\-]/.test(cell) && typeof value === 'string') cell = `'${cell}`;
      return /[",\r\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell;
    }).join(',');
  });

  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
}

export function exportReportToCsv(report: DiagnosticSessionReport): void {
  const csvContent = diagnosticReportToCsv(report);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `qpan_pose_${report.movementId}_${report.sessionId}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
