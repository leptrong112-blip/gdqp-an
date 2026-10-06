import React, { useState, useEffect, useRef } from 'react';
import {
  X, ChevronDown, ChevronUp, Activity, ShieldCheck,
  Compass, FileDown, Layers, PlayCircle, StopCircle, RefreshCw, AlertTriangle, CheckCircle2, HelpCircle
} from 'lucide-react';
import type { AnalysisSnapshot, FeatureId, MovementId, PoseStage } from '../types';
import { EXERCISE_CATALOG, MOVEMENTS } from '../scoring/movements';
import { ruleScore } from '../scoring/scoringEngine';
import type { FeatureRule, ScoreResult } from '../scoring/scoringTypes';
import {
  DiagnosticSessionRecorder,
  exportReportToJson,
  exportReportToCsv,
  type DiagnosticSessionConfig,
  type TeacherReferenceEvaluation,
} from '../diagnostics/diagnosticSession';

export interface PoseDiagnosticOverlayProps {
  snapshot?: AnalysisSnapshot | null;
  stage: PoseStage;
  movementId: MovementId;
  result?: ScoreResult | null;
  onClose: () => void;
  className?: string;
  allowExport?: boolean;
}

const FEATURE_NAMES: Record<FeatureId, string> = {
  leftKneeAngle: 'Đầu gối trái',
  rightKneeAngle: 'Đầu gối phải',
  maxKneeAngle: 'Gối chân trụ (thẳng)',
  minKneeAngle: 'Gối chân chùng (khụy)',
  kneeAngleDiff: 'Chênh lệch 2 gối',
  heelGapRatio: 'Khoảng cách 2 gót chân',
  footOpeningAngle: 'Góc mở 2 mũi chân',
  leftElbowAngle: 'Khuỷu tay trái',
  rightElbowAngle: 'Khuỷu tay phải',
  leftWristHipDistance: 'Tay trái - Hông',
  rightWristHipDistance: 'Tay phải - Hông',
  rightWristHeadDistance: 'Tay phải - Đầu',
  torsoTilt: 'Độ nghiêng thân trên',
  shoulderTilt: 'Độ lệch 2 vai',
  hipTilt: 'Độ lệch 2 bên hông',
  headOffset: 'Độ lệch đầu',
  bodyYaw: 'Góc xoay thân (Yaw)',
  yawVelocity: 'Vận tốc quay thân',
  turnProgress: 'Tiến trình quay',
  torsoStability: 'Độ ổn định thân',
  rootTravel: 'Dịch chuyển thân (đơn vị chiều dài thân)',
  pivotTravel: 'Dịch chuyển điểm trụ (đơn vị chiều dài thân)',
  saluteFingerExtension: 'Độ duỗi ngón tay chào',
  saluteFingerSpread: 'Góc xòe ngón tay chào',
  saluteThumbGap: 'Độ mở ngón cái',
  saluteWristBend: 'Góc gập cổ tay chào',
  saluteTipHeadDistance: 'Đầu ngón tay - vị trí chào',
};

function formatVal(val?: number, unit = '°'): string {
  if (val === undefined || !Number.isFinite(val)) return '—';
  if (unit === '°') return `${val.toFixed(1)}°`;
  return val.toFixed(2);
}

function formatRange(feature: FeatureId, range: [number, number]): string {
  const isAngle = feature.toLowerCase().includes('angle') || feature.toLowerCase().includes('tilt') || feature.toLowerCase().includes('yaw');
  const unit = isAngle ? '°' : '';
  return `[${range[0]}${unit}, ${range[1]}${unit}]`;
}

export function PoseDiagnosticOverlay({
  snapshot,
  stage,
  movementId,
  result,
  onClose,
  className = '',
  allowExport = false,
}: PoseDiagnosticOverlayProps) {
  const [minimized, setMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'comparison' | 'experiment' | 'report'>('telemetry');

  const recorderRef = useRef<DiagnosticSessionRecorder>(new DiagnosticSessionRecorder());
  const [recorderState, setRecorderState] = useState(() => recorderRef.current.getActiveStatus());

  // Test configuration
  const [testConfig, setTestConfig] = useState<DiagnosticSessionConfig>({
    device: 'other',
    cameraHeight: 'desk',
    cameraAngle: 'straight',
    distanceMeters: 'optimal',
    clothing: 'normal',
    lighting: 'good',
  });

  // Teacher evaluation
  const [teacherEval, setTeacherEval] = useState<TeacherReferenceEvaluation>({
    status: 'NOT_EVALUATED',
    unmetCriteria: [],
    teacherNotes: '',
  });

  const movement = MOVEMENTS[movementId] || EXERCISE_CATALOG.find(e => e.id === movementId)?.definition;
  const features = snapshot?.features ?? {};
  const dualMeasurements = snapshot?.dualMeasurements ?? [];
  const quality = snapshot?.quality;
  const metrics = quality?.metrics;

  // Record frames when recording is active
  useEffect(() => {
    if (snapshot && recorderRef.current.getActiveStatus().isRecording) {
      recorderRef.current.recordFrame(snapshot.quality, snapshot.features, snapshot.dualMeasurements, {
        timestampMs: snapshot.frame.timestampMs, stage: snapshot.stage, inferenceFps: snapshot.inferenceFps,
      });
      setRecorderState(recorderRef.current.getActiveStatus());
    }
  }, [snapshot]);

  useEffect(() => {
    if (result) { recorderRef.current.finish(result); setRecorderState(recorderRef.current.getActiveStatus()); }
  }, [result]);

  useEffect(() => {
    recorderRef.current.stop();
    setRecorderState(recorderRef.current.getActiveStatus());
  }, [movementId]);

  const allRules: { criterionId: string; criterionLabel: string; rule: FeatureRule }[] = [];
  if (movement?.criteria) {
    for (const c of movement.criteria) {
      for (const r of c.rules) {
        allRules.push({ criterionId: c.id, criterionLabel: c.label, rule: r });
      }
    }
  }

  const fps = snapshot?.inferenceFps ?? 0;
  const latency = snapshot?.inferenceMs ?? 0;
  const progressPercent = Math.round((snapshot?.progress ?? 0) * 100);

  const handleStartRecording = () => {
    setTeacherEval({ status: 'NOT_EVALUATED', unmetCriteria: [], teacherNotes: '' });
    recorderRef.current.start(movementId, testConfig);
    setRecorderState(recorderRef.current.getActiveStatus());
  };

  const handleStopRecording = () => {
    recorderRef.current.stop();
    setRecorderState(recorderRef.current.getActiveStatus());
  };

  const handleClearRecording = () => {
    recorderRef.current.clear();
    setRecorderState(recorderRef.current.getActiveStatus());
  };

  const handleUpdateTeacherEval = (updated: Partial<TeacherReferenceEvaluation>) => {
    const next = { ...teacherEval, ...updated };
    setTeacherEval(next);
    recorderRef.current.setReferenceEvaluation(next);
  };

  const handleExportJson = () => {
    if (!allowExport) return;
    const report = recorderRef.current.generateReport();
    if (report) exportReportToJson(report);
  };

  const handleExportCsv = () => {
    if (!allowExport) return;
    const report = recorderRef.current.generateReport();
    if (report) exportReportToCsv(report);
  };

  const report = recorderRef.current.generateReport();

  return (
    <aside
      aria-label="Bảng chẩn đoán AI Pose Diagnostic"
      className={`absolute top-16 right-4 z-40 w-[420px] max-w-[calc(100vw-2rem)] max-h-[calc(100%-5rem)] flex flex-col rounded-2xl bg-slate-950/95 text-slate-100 border border-emerald-500/40 shadow-2xl backdrop-blur-xl overflow-hidden font-mono text-xs transition-all ${className}`}
    >
      {/* HEADER */}
      <header className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <h2 className="font-bold text-emerald-300 tracking-wider text-[11px] uppercase">
            AI Pose Diagnostics (Phase 1)
          </h2>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 border border-emerald-500/40 text-emerald-300">
            {stage}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMinimized(prev => !prev)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            title={minimized ? 'Mở rộng' : 'Thu nhỏ'}
            aria-label={minimized ? 'Mở rộng bảng chẩn đoán' : 'Thu nhỏ bảng chẩn đoán'}
          >
            {minimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-red-950 hover:text-red-300 rounded text-slate-400"
            title="Đóng chế độ chẩn đoán"
            aria-label="Đóng chế độ chẩn đoán"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MINI QUICK STATS BAR */}
      <div className="grid grid-cols-4 gap-1 px-3 py-1.5 bg-slate-950/60 border-b border-slate-800/80 text-[10px] text-center">
        <div>
          <span className="text-slate-400">FPS:</span>{' '}
          <span className="font-bold text-amber-300">{fps > 0 ? fps.toFixed(1) : '—'}</span>
        </div>
        <div>
          <span className="text-slate-400">Độ trễ:</span>{' '}
          <span className="font-bold text-amber-300">{latency > 0 ? `${latency.toFixed(0)}ms` : '—'}</span>
        </div>
        <div>
          <span className="text-slate-400">Giữ:</span>{' '}
          <span className="font-bold text-emerald-300">{progressPercent}%</span>
        </div>
        <div>
          <span className="text-slate-400">Chất lượng:</span>{' '}
          <span className={`font-bold ${quality?.passed ? 'text-emerald-400' : 'text-red-400'}`}>
            {quality?.passed ? 'ĐẠT' : 'CHỜ'}
          </span>
        </div>
      </div>

      {!minimized && (
        <>
          <section aria-label="Latency và chuyển động Chào" className="max-h-52 overflow-y-auto border-b border-slate-800 p-3 space-y-1 text-[10px]">
            <p>Profile {snapshot?.performance?.profile ?? '—'} · Target {snapshot?.performance?.targetFps ?? '—'} FPS · Render {snapshot?.performance?.renderFps?.toFixed(1) ?? '—'} FPS</p>
            <p>Pose {snapshot?.performance?.poseMs?.toFixed(1) ?? '—'} ms · Hand {snapshot?.performance?.handMs?.toFixed(1) ?? '—'} ms · Worker {snapshot?.performance?.workerLatencyMs?.toFixed(1) ?? '—'} ms</p>
            <p>Landmark age {snapshot?.performance?.landmarkAgeMs?.toFixed(1) ?? '—'} ms · Skipped camera frames {snapshot?.performance?.droppedFrames ?? 0} ({((snapshot?.performance?.droppedFrameRatio ?? 0) * 100).toFixed(1)}%)</p>
            {Object.entries(snapshot?.performance?.benchmark ?? {}).map(([name, data]) => data && <p key={name}>{name}: median {data.medianMs.toFixed(1)} / p90 {data.p90Ms.toFixed(1)} ms (n={data.samples})</p>)}
            {snapshot?.saluteProgress && <>
              <p className="font-bold text-amber-300">STATE: {result?.saluteSequence?.state ?? snapshot.saluteProgress.state}</p>
              <p>Wrist y {snapshot.frame.landmarks.rightWrist?.image.y.toFixed(3) ?? '—'} · Rise {snapshot.saluteProgress.wristRise.toFixed(2)} · Velocity {snapshot.saluteProgress.wristVelocity.toFixed(2)} · Elbow {snapshot.saluteProgress.elbowAngle?.toFixed(1) ?? '—'}°</p>
              <p>Observed {snapshot.saluteProgress.observationCount} · Motion {String(snapshot.saluteProgress.motionObserved)} · Stable {snapshot.saluteProgress.stableMs} ms · Path {snapshot.saluteProgress.pathSmoothness?.toFixed(2) ?? '—'}</p>
              <p>Hand FPS {snapshot.frame.detectorTelemetry?.handFps.toFixed(1) ?? '—'} · Hand confidence (classification) {snapshot.saluteProgress.hand?.confidence?.toFixed(2) ?? '—'} · Label {snapshot.saluteProgress.hand?.handedness ?? '—'}</p>
              <p>Hand {snapshot.saluteProgress.hand?.quality ?? 'INSUFFICIENT_HAND_EVIDENCE'} · Valid {snapshot.saluteProgress.hand?.validLandmarks ?? 0}/21 · Age {snapshot.saluteProgress.hand?.ageMs?.toFixed(0) ?? '—'} ms</p>
              <p>Palm normal {snapshot.saluteProgress.hand?.palmOrientation ? Object.values(snapshot.saluteProgress.hand.palmOrientation).map(v => v.toFixed(2)).join(', ') : '—'} · Extension {snapshot.saluteProgress.hand?.fingerExtension?.map(v => v.toFixed(0)).join(', ') ?? '—'}</p>
              {snapshot.saluteProgress.hand?.reason && <p className="text-amber-300">{snapshot.saluteProgress.hand.reason}</p>}
            </>}
          </section>
          {/* 4 TABS */}
          <nav aria-label="Phân loại chẩn đoán" className="flex border-b border-slate-800 text-[10px]">
            <button
              type="button"
              onClick={() => setActiveTab('telemetry')}
              className={`flex-1 py-1.5 px-2 flex items-center justify-center gap-1 font-semibold transition-colors ${
                activeTab === 'telemetry'
                  ? 'border-b-2 border-emerald-400 text-emerald-300 bg-emerald-950/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3 h-3" />
              Số đo &amp; Điểm
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('comparison')}
              className={`flex-1 py-1.5 px-2 flex items-center justify-center gap-1 font-semibold transition-colors ${
                activeTab === 'comparison'
                  ? 'border-b-2 border-emerald-400 text-emerald-300 bg-emerald-950/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              2D vs 3D
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('experiment')}
              className={`flex-1 py-1.5 px-2 flex items-center justify-center gap-1 font-semibold transition-colors ${
                activeTab === 'experiment'
                  ? 'border-b-2 border-emerald-400 text-emerald-300 bg-emerald-950/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlayCircle className="w-3 h-3" />
              Thực nghiệm ({recorderState.frameCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`flex-1 py-1.5 px-2 flex items-center justify-center gap-1 font-semibold transition-colors ${
                activeTab === 'report'
                  ? 'border-b-2 border-emerald-400 text-emerald-300 bg-emerald-950/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileDown className="w-3 h-3" />
              Báo cáo &amp; Xuất
            </button>
          </nav>

          {/* TAB 1: TELEMETRY & SCORING */}
          {activeTab === 'telemetry' && (
            <div className="p-3 overflow-y-auto space-y-2.5 max-h-[440px] select-text">
              {/* STATUS DISTINCTION BANNER */}
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400">Trạng thái kết luận:</span>
                  {!quality?.passed ? (
                    <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-bold border border-amber-600/40">
                      KHÔNG ĐỦ DỮ LIỆU ĐỂ KẾT LUẬN
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-600/40">
                      ĐỦ ĐIỀU KIỆN THEO DÕI
                    </span>
                  )}
                </div>
                {!quality?.passed && (
                  <p className="text-amber-200/90 text-[9px]">
                    Lý do: {quality?.reasons[0] || 'Chưa thỏa mãn các cổng kiểm tra chất lượng.'}
                  </p>
                )}
              </div>

              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>KHỚP / QUY TẮC</span>
                <span className="text-emerald-400">ĐO THỰC → DẢI CHUẨN → ĐIỂM</span>
              </div>

              {allRules.map(({ criterionLabel, rule }, idx) => {
                const feat = features[rule.feature];
                const val = feat?.value;
                const conf = feat?.confidence ?? 0;
                const score = val !== undefined && Number.isFinite(val) ? ruleScore(val, rule) : null;

                let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
                if (score !== null) {
                  if (score >= 0.9) badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-500/50';
                  else if (score >= 0.6) badgeColor = 'bg-amber-950 text-amber-300 border-amber-500/50';
                  else badgeColor = 'bg-red-950 text-red-300 border-red-500/50';
                }

                return (
                  <div
                    key={`${rule.feature}-${idx}`}
                    className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 text-[11px]">
                        {FEATURE_NAMES[rule.feature] || rule.feature}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                        {score !== null ? `${Math.round(score * 100)}%` : '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-300 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-300 font-bold">{formatVal(val, rule.feature.includes('Ratio') || rule.feature.includes('Distance') ? 'vai' : '°')}</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-slate-400">{formatRange(rule.feature, rule.ideal)}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {conf > 0 ? (
                          <span className={conf >= 0.75 ? 'text-emerald-400' : 'text-amber-400'}>
                            tin cậy {Math.round(conf * 100)}%
                          </span>
                        ) : (
                          'chưa nhận diện'
                        )}
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-500 flex justify-between">
                      <span>Tiêu chí: {criterionLabel}</span>
                      <span>Ngưỡng 0đ: {formatRange(rule.feature, rule.zero)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: 2D VS 3D DUAL-MEASUREMENTS */}
          {activeTab === 'comparison' && (
            <div className="p-3 overflow-y-auto space-y-3 max-h-[440px] select-text">
              {/* RESEARCH DISCLAIMER */}
              <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/60 text-[10px] space-y-1 text-blue-200">
                <div className="font-bold flex items-center gap-1 text-blue-300">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Nguyên lý So sánh Song song 2D / 3D
                </div>
                <p className="text-[9px] leading-relaxed text-blue-200/80">
                  • 2D và 3D không nhất thiết bằng nhau do phối cảnh và góc đặt camera.<br />
                  • 3D worldLandmarks được suy diễn từ ảnh đơn mắt, không phải ground truth tuyệt đối.<br />
                  • Chênh lệch (Delta) đo độ phân kỳ hình học, không làm thay đổi điểm chính thức.
                </p>
              </div>

              {dualMeasurements.length === 0 ? (
                <p className="text-slate-400 text-center py-4 text-[11px]">Đang chờ frame normalized để so sánh...</p>
              ) : (
                <div className="space-y-2">
                  {dualMeasurements.map(d => (
                    <div
                      key={d.featureId}
                      className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-200">{d.label}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          d.officialSystem === 'CURRENT_3D'
                            ? 'bg-purple-950 text-purple-300 border border-purple-700/50'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-700/50'
                        }`}>
                          Đang dùng: {d.officialSystem}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-[10px] text-center pt-1 bg-slate-950/40 p-1.5 rounded-lg">
                        <div>
                          <div className="text-slate-400 text-[9px]">2D (Ảnh phẳng)</div>
                          <div className="font-bold text-cyan-300">{formatVal(d.value2D, d.unit)}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[9px]">3D (Không gian)</div>
                          <div className="font-bold text-purple-300">{formatVal(d.value3D, d.unit)}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[9px]">Độ lệch |3D - 2D|</div>
                          <div className={`font-bold ${d.delta > 15 ? 'text-amber-400' : 'text-slate-300'}`}>
                            {formatVal(d.delta, d.unit)}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-slate-500 pt-0.5">
                        <span>Độ tin cậy: {Math.round(d.confidence * 100)}%</span>
                        <span className={d.isReliable ? 'text-emerald-400' : 'text-amber-400'}>
                          {d.isReliable ? '✓ Dữ liệu ổn định' : '⚠ Chờ ổn định'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXPERIMENT & TEACHER EVALUATION */}
          {activeTab === 'experiment' && (
            <div className="p-3 overflow-y-auto space-y-3 max-h-[440px] select-text">
              {/* RECORDING STATUS & CONTROLS */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <p className="text-[10px] text-slate-400">Chỉ ghi số đo, không ghi video. Xuất dữ liệu trước khi bắt đầu phiên mới.</p>
                {recorderState.truncated && <p className="text-amber-300">Đã chạm giới hạn ghi; dữ liệu phiên chưa đầy đủ.</p>}
                <label className="block">Mã học sinh (không dùng tên thật)
                  <input aria-label="Mã học sinh" maxLength={32} disabled={recorderState.isRecording} value={testConfig.participantCode ?? ''}
                    onChange={e => setTestConfig(prev => ({ ...prev, participantCode: e.target.value }))}
                    className="w-full bg-slate-800 rounded p-1" placeholder="HS01" />
                </label>
                <label className="block">Mã lượt / tình huống
                  <input aria-label="Mã lượt" maxLength={64} disabled={recorderState.isRecording} value={testConfig.trialCode ?? ''}
                    onChange={e => setTestConfig(prev => ({ ...prev, trialCode: e.target.value }))}
                    className="w-full bg-slate-800 rounded p-1" placeholder="L01-quay-dung" />
                </label>
                <label className="block">Thiết bị
                  <select aria-label="Thiết bị" disabled={recorderState.isRecording} value={testConfig.device ?? 'other'}
                    onChange={e => setTestConfig(prev => ({ ...prev, device: e.target.value as DiagnosticSessionConfig['device'] }))}
                    className="w-full bg-slate-800 rounded p-1">
                    <option value="laptop">Laptop</option><option value="phone">Điện thoại</option><option value="other">Khác</option>
                  </select>
                </label>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 text-[11px]">Thu thập mẫu thực nghiệm</span>
                  <span className="text-[10px] text-slate-400">
                    {recorderState.frameCount} / {recorderState.maxFrames} frames
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!recorderState.isRecording ? (
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Bắt đầu ghi phiên ({movement?.label ?? movementId})
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopRecording}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg animate-pulse"
                    >
                      <StopCircle className="w-4 h-4" />
                      Dừng ghi phiên ({recorderState.frameCount} frames)
                    </button>
                  )}
                  {recorderState.frameCount > 0 && !recorderState.isRecording && (
                    <button
                      type="button"
                      onClick={handleClearRecording}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Xóa mẫu phiên này"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* TEST CONFIGURATION */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="font-bold text-slate-200 text-[11px]">Cấu hình điều kiện thử nghiệm:</div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <label className="text-slate-400 block mb-0.5">Độ cao camera:</label>
                    <select
                      value={testConfig.cameraHeight}
                      onChange={e => setTestConfig(prev => ({ ...prev, cameraHeight: e.target.value as any }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1 text-slate-200"
                    >
                      <option value="desk">Mặt bàn (0.7m - 0.8m)</option>
                      <option value="chest">Ngang ngực (1.2m - 1.4m)</option>
                      <option value="floor">Đặt sàn / Thấp (&lt;0.5m)</option>
                      <option value="high">Treo cao (&gt;1.6m)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-0.5">Góc chúc/ngửa:</label>
                    <select
                      value={testConfig.cameraAngle}
                      onChange={e => setTestConfig(prev => ({ ...prev, cameraAngle: e.target.value as any }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1 text-slate-200"
                    >
                      <option value="straight">Chính diện phẳng (0°)</option>
                      <option value="tilted_down">Cụp xuống sàn (15°-30°)</option>
                      <option value="tilted_up">Ngửa lên trần (10°-20°)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-0.5">Cự ly đứng:</label>
                    <select
                      value={testConfig.distanceMeters}
                      onChange={e => setTestConfig(prev => ({ ...prev, distanceMeters: e.target.value as any }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1 text-slate-200"
                    >
                      <option value="optimal">Chuẩn (2.0m - 2.5m)</option>
                      <option value="near">Gần (&lt;2.0m)</option>
                      <option value="far">Xa (&gt;2.8m)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-0.5">Trang phục:</label>
                    <select
                      value={testConfig.clothing}
                      onChange={e => setTestConfig(prev => ({ ...prev, clothing: e.target.value as any }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1 text-slate-200"
                    >
                      <option value="normal">Quần áo bình thường</option>
                      <option value="uniform_jacket">Áo khoác / Quân phục rộng</option>
                      <option value="fitted">Gọn gàng / Thể thao</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* TEACHER REFERENCE EVALUATION */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="font-bold text-amber-300 text-[11px] flex items-center justify-between">
                  <span>Đánh giá tham chiếu của Giáo viên:</span>
                  <span className="text-[9px] text-slate-400">(Ground truth đối chuẩn)</span>
                </div>

                <div className="space-y-1.5 text-[10px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="teacherStatus"
                      checked={teacherEval.status === 'MEETS_CRITERIA'}
                      onChange={() => handleUpdateTeacherEval({ status: 'MEETS_CRITERIA' })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-emerald-300 font-semibold">✓ Đáp ứng tiêu chí (Đúng chuẩn)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="teacherStatus"
                      checked={teacherEval.status === 'DOES_NOT_MEET'}
                      onChange={() => handleUpdateTeacherEval({ status: 'DOES_NOT_MEET' })}
                      className="text-red-300 focus:ring-red-500"
                    />
                    <span className="text-red-300 font-semibold">✗ Chưa đáp ứng tiêu chí (Làm sai)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="teacherStatus"
                      checked={teacherEval.status === 'INSUFFICIENT_EVIDENCE'}
                      onChange={() => handleUpdateTeacherEval({ status: 'INSUFFICIENT_EVIDENCE' })}
                      className="text-amber-300 focus:ring-amber-500"
                    />
                    <span className="text-amber-300">? Không đủ căn cứ đánh giá</span>
                  </label>
                </div>

                {teacherEval.status === 'DOES_NOT_MEET' && (
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <label className="text-slate-400 text-[10px] block">Tiêu chí giáo viên thấy chưa đạt:</label>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      {['Bàn chân / Gót', 'Đầu gối', 'Cánh tay', 'Thân người'].map(c => {
                        const checked = (teacherEval.unmetCriteria || []).includes(c);
                        return (
                          <label key={c} className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const current = teacherEval.unmetCriteria || [];
                                const next = checked ? current.filter(x => x !== c) : [...current, c];
                                handleUpdateTeacherEval({ unmetCriteria: next });
                              }}
                              className="rounded border-slate-700 text-red-500"
                            />
                            <span>{c}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-1">
                  <label className="text-slate-400 text-[10px] block mb-1">Ghi chú của giáo viên / người thử:</label>
                  <textarea
                    value={teacherEval.teacherNotes || ''}
                    onChange={e => handleUpdateTeacherEval({ teacherNotes: e.target.value })}
                    placeholder="VD: Chân trái có chùng nhẹ nhưng camera đặt thấp làm hình chân bị che..."
                    rows={2}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-[10px] text-slate-200 placeholder-slate-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REPORT & EXPORT */}
          {activeTab === 'report' && (
            <div className="p-3 overflow-y-auto space-y-3 max-h-[440px] select-text">
              {!report ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-slate-400 text-[11px]">Chưa có dữ liệu phiên thử nghiệm nào được ghi.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('experiment')}
                    className="py-1.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10px]"
                  >
                    Chuyển sang tab Thực nghiệm để bắt đầu ghi
                  </button>
                </div>
              ) : (
                <>
                  {/* SESSION SUMMARY CARD */}
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-[10px]">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-emerald-300">Phiên: {report.sessionId}</span>
                      <span className="text-slate-400">{report.frameCount} frames · {(report.durationMs / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-1 border-t border-slate-800 text-[9px]">
                      <div>Động tác: <span className="font-bold text-slate-200">{report.movementName}</span></div>
                      <div>Ngắt quãng QG: <span className="font-bold text-amber-300">{report.qualityInterruptionCount} lần</span></div>
                      <div>Tham chiếu GV: <span className={`font-bold ${
                        report.referenceEvaluation.status === 'MEETS_CRITERIA' ? 'text-emerald-400' :
                        report.referenceEvaluation.status === 'DOES_NOT_MEET' ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        {report.referenceEvaluation.status === 'MEETS_CRITERIA' ? 'ĐẠT' :
                         report.referenceEvaluation.status === 'DOES_NOT_MEET' ? 'CHƯA ĐẠT' : 'CHƯA NHẬP'}
                      </span></div>
                      <div>Rubric: <span className="text-slate-300">{report.rubricVersion}</span></div>
                    </div>
                  </div>

                  {/* 3-PART REPORT: OBSERVED, HYPOTHESIS, HUMAN REVIEW */}
                  <div className="space-y-2">
                    {/* OBSERVED */}
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="font-bold text-cyan-300 text-[10px] flex items-center gap-1">
                        <span>🔍</span> OBSERVED (Quan sát trực tiếp từ số đo)
                      </div>
                      {report.analysis.observed.length === 0 ? (
                        <p className="text-slate-500 text-[9px]">Chưa ghi nhận bất thường đáng kể.</p>
                      ) : (
                        <ul className="list-disc pl-4 space-y-1 text-[9px] text-slate-300">
                          {report.analysis.observed.map((obs, i) => (
                            <li key={i}>{obs}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* HYPOTHESIS */}
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="font-bold text-amber-300 text-[10px] flex items-center gap-1">
                        <span>💡</span> HYPOTHESIS (Giả thuyết kỹ thuật)
                      </div>
                      {report.analysis.hypothesis.length === 0 ? (
                        <p className="text-slate-500 text-[9px]">Dữ liệu nằm trong dung sai thông thường.</p>
                      ) : (
                        <ul className="list-disc pl-4 space-y-1 text-[9px] text-slate-300">
                          {report.analysis.hypothesis.map((hyp, i) => (
                            <li key={i}>{hyp}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* NEEDS HUMAN REVIEW */}
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="font-bold text-red-300 text-[10px] flex items-center gap-1">
                        <span>👨‍🏫</span> NEEDS HUMAN REVIEW (Cần đối chiếu trực quan)
                      </div>
                      {report.analysis.needsHumanReview.length === 0 ? (
                        <p className="text-slate-500 text-[9px]">Không có trường hợp bất đồng cần kiểm tra lại.</p>
                      ) : (
                        <ul className="list-disc pl-4 space-y-1 text-[9px] text-slate-300">
                          {report.analysis.needsHumanReview.map((nhr, i) => (
                            <li key={i}>{nhr}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* EXPORT ACTION BUTTONS */}
                  {allowExport && <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center gap-1.5 transition-colors shadow-lg"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      Xuất JSON
                    </button>
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="flex-1 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[10px] flex items-center justify-center gap-1.5 transition-colors shadow-lg"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      Xuất CSV
                    </button>
                  </div>}
                </>
              )}
            </div>
          )}

          {/* FOOTER & PRIVACY NOTICE */}
          <footer className="px-3 py-2 bg-slate-900/90 border-t border-slate-800 text-[9px] text-slate-400 flex items-center justify-between">
            <span title="Dữ liệu khớp cơ thể chỉ lưu trong bộ nhớ RAM, không tải lên server.">
              🔒 100% Cục bộ trên RAM (Bảo mật quyền riêng tư)
            </span>
            <span className="text-emerald-400 font-semibold">WebAssembly Offline</span>
          </footer>
        </>
      )}
    </aside>
  );
}
