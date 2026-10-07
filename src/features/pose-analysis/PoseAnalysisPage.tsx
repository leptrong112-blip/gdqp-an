import React, { useState, useEffect, useRef } from 'react';
import { usePoseSession } from './hooks/usePoseSession';
import { PoseViewport } from './components/PoseViewport';
import { PoseStepDashboard } from './components/PoseStepDashboard';
import { SessionControls } from './components/SessionControls';
import { PoseResultDialog } from './components/PoseResultDialog';
import { ExerciseDropdown } from './components/ExerciseDropdown';
import type { MovementId } from './types';
import { EXERCISE_CATALOG } from './scoring/movements';
import { Minimize2, LayoutDashboard } from 'lucide-react';
import { PoseDiagnosticOverlay } from './components/PoseDiagnosticOverlay';
import WasmCompatibilityNotice from '../../components/WasmCompatibilityNotice';
import { useAccount } from '../../components/AccountGate';
import { PoseStudentForm } from './components/PoseStudentForm';
import type { PoseStudentSession } from './results/studentSession';
import { buildPoseResultSubmission } from './results/buildPoseResult';
import { usePoseResultStorage } from './hooks/usePoseResultStorage';
import type { PoseSaveState } from './results/resultSaver';
import { displayedProcessingLatency } from './results/resultPresentation';
import { poseScoreOnTen } from './results/scoreScale';
import { preparationDefinition, STOP_OVERLAY_MS } from './runtime/commandFlow';

export default function PoseAnalysisPage() {
  const { user } = useAccount();
  const [student, setStudent] = useState<PoseStudentSession | null>(null);
  const studentRef = useRef<PoseStudentSession | null>(null);
  const attemptStudents = useRef(new Map<string, PoseStudentSession>());
  const storage = usePoseResultStorage();
  const [formatError, setFormatError] = useState<PoseSaveState | null>(null);
  const session = usePoseSession({ onAttemptStarted: attempt => {
    if (studentRef.current) attemptStudents.current.set(attempt.id, Object.freeze({ ...studentRef.current }));
  }, onFinalResult: (result, attempt) => {
    if (result.status !== 'scored') return;
    const identity = attemptStudents.current.get(attempt.id);
    const record = identity ? buildPoseResultSubmission(result, attempt, identity, null) : null;
    if (record) storage.prepare(record, STOP_OVERLAY_MS + 250);
    else setFormatError({ id: attempt.id, status: 'error', error: 'Chưa tạo được bản lưu hợp lệ. Kết quả vẫn được giữ trên màn hình; hãy thực hiện lại lượt này.' });
  } });
  const [presentedTiming, setPresentedTiming] = useState<{ id: string; latencyMs: number } | null>(null);
  const finalStudent = session.finalAttempt ? attemptStudents.current.get(session.finalAttempt.id) ?? null : student;
  const currentExercise = EXERCISE_CATALOG.find(e => e.id === session.movementId) || EXERCISE_CATALOG[0];
  const activeMovementId = session.snapshot?.drillProgress?.movementId ?? session.movementId;
  const activeExercise = EXERCISE_CATALOG.find(e => e.id === activeMovementId) ?? currentExercise;
  const studioContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDashboardInFullscreen, setShowDashboardInFullscreen] = useState(true);
  const [dismissedResult, setDismissedResult] = useState<typeof session.result>(null);

  // activeStep: 1 = Kiểm tra vị trí/camera, 2 = Hướng dẫn động tác & thực hiện
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  // Chế độ chẩn đoán AI dành cho lập trình viên/giáo viên kiểm tra số đo khớp thực tế (?poseDebug=1 hoặc ?debug=1)
  const [debugMode, setDebugMode] = useState(() => {
    try {
      const search = window.location.search;
      if (search.includes('poseDebug=1') || search.includes('debug=1')) {
        return true;
      }
      return localStorage.getItem('pose_debug_mode') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleDebugMode = (enabled: boolean) => {
    setDebugMode(enabled);
    try {
      localStorage.setItem('pose_debug_mode', enabled ? 'true' : 'false');
    } catch {}
  };

  // Chế độ tự động hiệu chuẩn khi đứng đúng vị trí (dành cho học sinh tự quay 1 mình)
  const [autoCalibrate, setAutoCalibrate] = useState(() => {
    try {
      return localStorage.getItem('pose_auto_calibrate') !== 'false';
    } catch {
      return true;
    }
  });
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);

  const handleToggleAutoCalibrate = (enabled: boolean) => {
    setAutoCalibrate(enabled);
    try {
      localStorage.setItem('pose_auto_calibrate', enabled ? 'true' : 'false');
    } catch {}
  };

  // Bật/tắt toàn màn hình thật của trình duyệt & laptop/pc
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (studioContainerRef.current?.requestFullscreen) {
          await studioContainerRef.current.requestFullscreen();
        } else if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen(prev => !prev);
    }
  };

  // Đồng bộ trạng thái khi người dùng nhấn Esc hoặc thay đổi chế độ màn hình
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const ready = !!session.snapshot?.quality.passed;

  // The processor owns the only exercise countdown. Auto-calibration does not
  // run a second 3-2-1 sequence and only starts from the required preparation.
  useEffect(() => {
    setAutoCountdown(null);
    if (autoCalibrate && activeStep === 2 && session.stage === 'quality-check' && ready &&
        session.snapshot?.workflow?.status === 'READY' && !session.result) session.calibrate();
  }, [autoCalibrate, activeStep, session.stage, ready, session.snapshot?.workflow?.status, session.result, session.calibrate]);

  const handleSelectMovement = (id: MovementId) => {
    session.changeMovement(id);
    setActiveStep(2);
  };

  const handleRetry = () => {
    setDismissedResult(null);
    session.retry();
    setActiveStep(2);
  };

  const handleChangeStudent = () => {
    studentRef.current = null;
    session.resetStudentSession();
    setStudent(null);
    attemptStudents.current.clear();
    setDismissedResult(null);
    setPresentedTiming(null);
    setFormatError(null);
    setActiveStep(1);
  };

  const handleResultPresented = (renderedAtMs: number) => {
    const attempt = session.finalAttempt, result = session.result;
    if (!attempt || !result || !finalStudent) return;
    const latencyMs = Math.max(0, renderedAtMs - (attempt.timing.scoringWindowFinishedAtMs ?? attempt.timing.resultFinalizedAtMs));
    setPresentedTiming({ id: attempt.id, latencyMs });
    storage.presented(attempt.id, latencyMs);
  };

  if (!student) return <PoseStudentForm onStart={identity => {
    studentRef.current = identity;
    setStudent(identity);
  }} />;

  return (
    <div
      ref={studioContainerRef}
      className={
        isFullscreen
          ? "fixed inset-0 z-[999999] w-screen h-screen bg-slate-950 text-white p-3 sm:p-5 flex flex-col overflow-hidden select-none"
          : "max-w-[1600px] mx-auto space-y-6 pb-8 select-none"
      }
    >
      {/* ═══════════════════ TIÊU ĐỀ (CHẾ ĐỘ TOÀN MÀN HÌNH HOẶC CHẾ ĐỘ THƯỜNG) ═══════════════════ */}
      {isFullscreen ? (
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-white">
                {currentExercise.name} · Toàn màn hình
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                AI MediaPipe Pose Landmark · Xử lý Offline bảo mật 100% trên thiết bị
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Chuyển đổi động tác ở chế độ toàn màn hình */}
            <ExerciseDropdown
              currentId={session.movementId}
              onSelect={handleSelectMovement}
              isFullscreen={true}
            />

            <button
              onClick={() => setShowDashboardInFullscreen(!showDashboardInFullscreen)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                showDashboardInFullscreen
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700 shadow-md'
              }`}
              title="Bật/tắt bảng chỉ dẫn bên phải"
            >
              <LayoutDashboard size={15} />
              <span className="hidden sm:inline">
                {showDashboardInFullscreen ? 'Ẩn bảng chỉ dẫn' : 'Hiện bảng chỉ dẫn'}
              </span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg hover:scale-105"
              title="Thoát chế độ toàn màn hình (Esc)"
            >
              <Minimize2 size={15} />
              <span>Thoát (Esc)</span>
            </button>
          </div>
        </div>
      ) : (
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-red-600 dark:text-red-400 font-bold">
              AI Pose Analysis · Bản thử nghiệm
            </p>
            <h1 className="text-2xl sm:text-3xl font-black mt-2">
              {currentExercise.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-3xl">
              Quy trình 2 bước: <strong>Bước 1</strong> kiểm tra camera &amp; vị trí toàn thân <span className="mx-1 text-red-600 dark:text-red-400 font-black">→</span> <strong>Bước 2</strong> làm theo hướng dẫn, chờ đếm ngược rồi giữ mỗi tư thế ổn định để chấm điểm.
            </p>
          </div>

          {/* Chọn bài tập (Menu xổ xuống nhỏ gọn, mở rộng được 5-10 động tác) */}
          <div className="self-start sm:self-center shrink-0">
            <ExerciseDropdown
              currentId={session.movementId}
              onSelect={handleSelectMovement}
              isFullscreen={false}
            />
          </div>
        </header>
      )}

      {/* ═══════════════════ KHUNG CHÍNH (CAMERA + DASHBOARD GIỮ NGUYÊN KHÔNG BỊ UNMOUNT) ═══════════════════ */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">
        <p><strong>{student.studentName}</strong> · Lớp {student.className}</p>
        <button type="button" onClick={handleChangeStudent} className="rounded-lg px-3 py-2 font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">Đổi học sinh</button>
      </div>
      <div
        className={
          isFullscreen
            ? "flex-1 min-h-0 flex flex-col lg:flex-row gap-4 pt-3 overflow-hidden relative"
            : "grid lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start"
        }
      >
        {/* KHU VỰC CAMERA */}
        <div className={isFullscreen ? "flex-1 min-h-0 relative h-full flex flex-col" : "space-y-4"}>
          <PoseViewport
            videoRef={session.videoRef}
            canvasRef={session.canvasRef}
            mirrored={session.facing === 'user'}
            stage={session.stage}
            progress={session.snapshot?.progress ?? 0}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            autoCountdown={autoCountdown}
            movementLabel={activeExercise.name}
            qualityPassed={ready}
            pauseReason={session.snapshot?.quality.reasons[0] ?? session.snapshot?.message}
            drillProgress={session.snapshot?.drillProgress}
            dynamicProgress={session.snapshot?.dynamicProgress}
            handStatus={session.snapshot?.frame.handStatus}
            commandCue={session.commandCue}
            workflow={session.snapshot?.workflow}
            saluteProgress={session.snapshot?.saluteProgress}
            diagnosticOverlay={debugMode ? (
              <PoseDiagnosticOverlay
                snapshot={session.snapshot}
                stage={session.stage}
                movementId={activeMovementId}
                result={session.stage === 'stop-command' ? null : session.result}
                onClose={() => handleToggleDebugMode(false)}
                allowExport={user?.role === 'admin'}
              />
            ) : undefined}
          />

          {session.sequenceEngine === 'javascript' && <WasmCompatibilityNotice feature="pose-sequence" />}

          {session.result && session.stage !== 'stop-command' && (
            <button type="button" onClick={() => setDismissedResult(null)} className={`shrink-0 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-lg ${session.result.status === 'scored' && session.result.assessment === 'incomplete' ? 'bg-amber-600 hover:bg-amber-700' : session.result.status === 'scored' && session.result.passed !== false ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
              {session.result.status === 'scored'
                ? session.result.assessment === 'incomplete'
                  ? `Xem kết quả · ${poseScoreOnTen(session.result.total)}/${poseScoreOnTen(100 - (session.result.unassessedPoints ?? 0))} điểm ở phần đã đánh giá`
                  : `Xem kết quả · ${session.result.passed === false ? 'Chưa đạt' : 'Đạt'} ${poseScoreOnTen(session.result.total)}/10 điểm`
                : 'Xem lý do chưa thể chấm điểm'}
            </button>
          )}

          {!isFullscreen && (
            <>
              <SessionControls
                stage={session.stage}
                ready={ready}
                start={session.start}
                stop={session.stop}
                calibrate={session.calibrate}
                retry={handleRetry}
                changeCamera={session.changeCamera}
              />

              {session.error && (
                <p role="alert" className="p-4 rounded-2xl bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200 text-sm">
                  {session.error}
                </p>
              )}

              {session.reduced && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Đang dùng chế độ tiết kiệm tài nguyên. Giữ máy cố định; hệ thống sẽ từ chối chấm nếu camera quá chậm.
                </p>
              )}

              {/* Mẹo kê máy tính & góc chụp */}
              <section className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-slate-800 dark:text-slate-200 text-xs space-y-2">
                <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <span>💡</span> Mẹo lấy trọn toàn thân &amp; Giữ khung hình ổn định
                </h3>
                <ul className="space-y-1.5 list-disc pl-4 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  <li><strong>Gập nhẹ màn hình cụp xuống:</strong> Camera laptop thường ngửa lên trần nhà. Hãy gập nhẹ màn hình về phía trước để hướng xuống sàn.</li>
                  <li><strong>Lùi xa 2.0 – 2.5 mét:</strong> Đứng lùi lại khoảng 3–4 bước chân để camera thu đủ từ đỉnh đầu đến 2 bàn chân.</li>
                  <li><strong>Đứng yên 1 giây:</strong> Khi đã đứng vào vị trí, hãy giữ nguyên người khoảng 1 giây để hệ thống nhận diện khung hình ổn định.</li>
                  <li><strong>Bật "Toàn màn hình":</strong> Bấm nút góc trên bên phải khung camera để mở toàn màn hình laptop, giúp đứng xa 2.5m vẫn nhìn rất rõ.</li>
                  <li><strong>Không gian phòng hẹp?</strong> Hãy mở trang web trên <em>Điện thoại di động</em> (dựng đứng máy) – camera điện thoại góc rộng hơn, chỉ cần đứng cách 1.5m!</li>
                </ul>
              </section>

              <details className="text-xs border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                <summary className="cursor-pointer font-semibold">Thông tin kỹ thuật &amp; Thiết bị</summary>
                <label className="mt-3 flex items-center gap-2"><input type="checkbox" checked={session.muted} onChange={e => session.setMuted(e.target.checked)} />Tắt âm thanh khẩu lệnh</label>
                {session.movementId !== 'attention' && session.movementId !== 'basicDrill' && <label className="mt-3 flex items-start gap-2">
                  <input type="checkbox" checked={session.scorePrecondition} disabled={!['idle', 'quality-check', 'result', 'blocked'].includes(session.stage)} onChange={e => session.setScorePrecondition(e.target.checked)} />
                  Chấm riêng Đứng nghiêm trước động tác (giữ tối thiểu 3 giây, điểm riêng)
                </label>}
                <dl className="mt-3 space-y-2 text-slate-600 dark:text-slate-300">
                  <div>Chế độ: {session.mode || 'Chưa khởi tạo'}</div>
                  <div>FPS phân tích: {session.snapshot?.inferenceFps.toFixed(1) ?? '—'}</div>
                  <div>Thời gian suy luận: {session.snapshot?.inferenceMs.toFixed(0) ?? '—'} ms</div>
                  <div>Số người phát hiện: {session.snapshot?.frame.personCount ?? '—'}</div>
                  <div>Độ tin cậy: {session.snapshot ? Math.round(session.snapshot.quality.metrics.meanConfidence * 100) : '—'}%</div>
                </dl>
                <label className="mt-3 flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={session.preferGpu}
                    disabled={!['idle', 'result', 'error'].includes(session.stage)}
                    onChange={e => session.setPreferGpu(e.target.checked)}
                  />
                  Thử GPU trong Worker (tự về CPU nếu không hỗ trợ)
                </label>

                <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
                  <label className="flex items-center justify-between cursor-pointer text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-xs flex items-center gap-1.5">
                      🛠️ Chế độ Chẩn đoán AI (Developer HUD)
                    </span>
                    <input
                      type="checkbox"
                      checked={debugMode}
                      onChange={e => handleToggleDebugMode(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Bật HUD trực tiếp trên camera hiển thị: Số đo thực tế → Dải chuẩn → Đóng góp điểm → Độ tin cậy (Hỗ trợ URL <code className="text-amber-500">?poseDebug=1</code>).
                  </p>
                </div>
              </details>
            </>
          )}
        </div>

        {/* CỘT PHẢI: BẢNG TIẾN TRÌNH 2 BƯỚC (BƯỚC 1 -> BƯỚC 2) */}
        {(!isFullscreen || showDashboardInFullscreen) && (
          <aside
            className={
              isFullscreen
                ? "w-full lg:w-[380px] xl:w-[420px] h-full overflow-y-auto shrink-0 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 shadow-2xl animate-in slide-in-from-right-4 duration-200"
                : "space-y-4"
            }
          >
            <PoseStepDashboard
              stage={session.stage}
              report={session.stage === 'result' ? undefined : session.snapshot?.quality}
              ready={ready}
              progress={session.snapshot?.progress ?? 0}
              result={session.stage === 'stop-command' ? null : session.result}
              onStart={session.start}
              onStop={session.stop}
              onCalibrate={session.calibrate}
              onRetry={handleRetry}
              scoreComparison={session.scoreComparison}
              isFullscreen={isFullscreen}
              movementId={activeMovementId}
              preparationLabel={preparationDefinition(activeMovementId).label}
              workflowMessage={session.snapshot?.message}
              activeStep={activeStep}
              onStepChange={setActiveStep}
              autoCalibrate={autoCalibrate}
              onToggleAutoCalibrate={handleToggleAutoCalibrate}
              autoCountdown={autoCountdown}
            />

            {!isFullscreen && (
              <section className="p-4 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-[11px] text-slate-500 dark:text-slate-400">
                Video được xử lý trên thiết bị. Họ tên, lớp và kết quả được lưu để giáo viên theo dõi; hình ảnh và dữ liệu khớp không tải lên máy chủ.
              </section>
            )}
          </aside>
        )}
      </div>

      <PoseResultDialog
          result={session.result}
          open={!!session.result && ['result', 'blocked'].includes(session.stage) && dismissedResult !== session.result}
          onClose={() => setDismissedResult(session.result)}
          movementId={session.movementId}
          onRetry={handleRetry}
          scoreComparison={session.scoreComparison}
          student={finalStudent}
          attempt={session.finalAttempt}
          processingLatencyMs={displayedProcessingLatency(session.finalAttempt, presentedTiming)}
          saveState={session.finalAttempt ? storage.getState(session.finalAttempt.id) ?? (formatError?.id === session.finalAttempt.id ? formatError : null) : null}
          onSaveRetry={formatError?.id === session.finalAttempt?.id ? undefined : () => { if (session.finalAttempt) void storage.retry(session.finalAttempt.id); }}
          onChangeStudent={handleChangeStudent}
          onPresented={handleResultPresented}
      />
    </div>
  );
}
