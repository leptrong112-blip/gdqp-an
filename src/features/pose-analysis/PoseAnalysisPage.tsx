import React, { useState, useEffect, useRef } from 'react';
import { usePoseSession } from './hooks/usePoseSession';
import { PoseViewport } from './components/PoseViewport';
import { PoseStepDashboard } from './components/PoseStepDashboard';
import { SessionControls } from './components/SessionControls';
import { PoseResultDialog } from './components/PoseResultDialog';
import { ExerciseDropdown } from './components/ExerciseDropdown';
import { EXERCISE_CATALOG } from './scoring/movements';
import { Minimize2, LayoutDashboard } from 'lucide-react';
import { playCountdownBeep } from './utils/audioFeedback';
import type { MovementId } from './types';
import WasmCompatibilityNotice from '../../components/WasmCompatibilityNotice';

export default function PoseAnalysisPage() {
  const session = usePoseSession();
  const currentExercise = EXERCISE_CATALOG.find(e => e.id === session.movementId) || EXERCISE_CATALOG[0];
  const activeMovementId = session.snapshot?.drillProgress?.movementId ?? session.movementId;
  const activeExercise = EXERCISE_CATALOG.find(e => e.id === activeMovementId) ?? currentExercise;
  const studioContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDashboardInFullscreen, setShowDashboardInFullscreen] = useState(true);
  const [dismissedResult, setDismissedResult] = useState<typeof session.result>(null);

  // activeStep: 1 = Kiểm tra vị trí/camera, 2 = Hướng dẫn động tác & thực hiện
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

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

  // Luồng tự động hiệu chuẩn & đếm ngược khi người dùng đã vào vị trí chuẩn
  useEffect(() => {
    if (!autoCalibrate || activeStep !== 2 || session.stage !== 'quality-check' || !ready || session.result) {
      setAutoCountdown(null);
      return;
    }

    setAutoCountdown(3);
    playCountdownBeep(700, 0.08);

    const t1 = setTimeout(() => {
      setAutoCountdown(2);
      playCountdownBeep(700, 0.08);
    }, 1000);

    const t2 = setTimeout(() => {
      setAutoCountdown(1);
      playCountdownBeep(700, 0.08);
    }, 2000);

    const t3 = setTimeout(() => {
      setAutoCountdown(null);
      playCountdownBeep(1050, 0.18);
      session.calibrate();
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setAutoCountdown(null);
    };
  }, [autoCalibrate, activeStep, session.stage, ready, session.result, session.calibrate]);

  const handleSelectMovement = (id: MovementId) => {
    session.changeMovement(id);
    setActiveStep(2);
  };

  const handleRetry = () => {
    setDismissedResult(null);
    session.retry();
    setActiveStep(2);
  };

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
          />

          {session.sequenceEngine === 'javascript' && <WasmCompatibilityNotice feature="pose-sequence" />}

          {session.result && (
            <button type="button" onClick={() => setDismissedResult(null)} className="shrink-0 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-700">
              {session.result.status === 'scored'
                ? `Xem kết quả · Mức đạt ${session.result.total}%`
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
              result={session.result}
              onStart={session.start}
              onStop={session.stop}
              onCalibrate={session.calibrate}
              onRetry={handleRetry}
              scoreComparison={session.scoreComparison}
              isFullscreen={isFullscreen}
              movementId={activeMovementId}
              activeStep={activeStep}
              onStepChange={setActiveStep}
              autoCalibrate={autoCalibrate}
              onToggleAutoCalibrate={handleToggleAutoCalibrate}
              autoCountdown={autoCountdown}
            />

            {!isFullscreen && (
              <section className="p-4 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-[11px] text-slate-500 dark:text-slate-400">
                Video được xử lý trực tiếp ngay trên thiết bị bằng WebAssembly, không tải bất kỳ hình ảnh nào lên máy chủ. An toàn và bảo mật 100%.
              </section>
            )}
          </aside>
        )}
      </div>

      <PoseResultDialog
          result={session.result}
          open={!!session.result && dismissedResult !== session.result}
          onClose={() => setDismissedResult(session.result)}
          movementId={session.movementId}
          onRetry={handleRetry}
          scoreComparison={session.scoreComparison}
      />
    </div>
  );
}
