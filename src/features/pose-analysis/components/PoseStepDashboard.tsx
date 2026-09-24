import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  RotateCcw,
  Camera,
  Square,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { QualityReport, PoseStage, MovementId } from '../types';
import type { ScoreResult } from '../scoring/scoringTypes';
import { EXERCISE_CATALOG } from '../scoring/movements';
import { ScoreResults } from './ScoreResults';

interface PoseStepDashboardProps {
  stage: PoseStage;
  report?: QualityReport;
  ready: boolean;
  progress: number;
  result: ScoreResult | null;
  onStart: () => void;
  onStop: () => void;
  onCalibrate: () => void;
  onRetry?: () => void;
  scoreComparison?: { previous: number; delta: number } | null;
  isFullscreen?: boolean;
  movementId?: MovementId;
  activeStep?: 1 | 2;
  onStepChange?: (step: 1 | 2) => void;
  autoCalibrate?: boolean;
  onToggleAutoCalibrate?: (enabled: boolean) => void;
  autoCountdown?: number | null;
}

const CHECKLIST_ITEMS = [
  { id: 'lighting', label: 'Ánh sáng đầy đủ' },
  { id: 'person', label: 'Một người trong khung hình' },
  { id: 'framing', label: 'Thấy toàn thân (đầu đến chân)' },
  { id: 'reliability', label: 'Các khớp nhận diện rõ ràng' },
  { id: 'stability', label: 'Khung hình & người đứng yên' },
  { id: 'orientation', label: 'Đứng nhìn chính diện camera' },
];

export function PoseStepDashboard({
  stage,
  report,
  ready,
  progress,
  result,
  onStart,
  onStop,
  onCalibrate,
  onRetry,
  scoreComparison,
  isFullscreen = false,
  movementId = 'attention',
  activeStep: activeStepProp,
  onStepChange,
  autoCalibrate = true,
  onToggleAutoCalibrate,
  autoCountdown = null,
}: PoseStepDashboardProps) {
  const currentExercise = EXERCISE_CATALOG.find(e => e.id === movementId) || EXERCISE_CATALOG[0];

  // activeStep: 1 = Kiểm tra vị trí/camera, 2 = Hướng dẫn động tác & thực hiện
  const [internalStep, setInternalStep] = useState<1 | 2>(1);
  const activeStep = activeStepProp ?? internalStep;
  const handleStepChange = (s: 1 | 2) => {
    setInternalStep(s);
    onStepChange?.(s);
  };

  const [showStep1Details, setShowStep1Details] = useState(false);
  const [transitionCountdown, setTransitionCountdown] = useState<number | null>(null);

  // Xử lý tự động chuyển sang Bước 2 sau 2.5 - 3 giây khi Bước 1 đạt chuẩn tất cả tiêu chí
  useEffect(() => {
    // Nếu đang trong quá trình hiệu chuẩn, đếm ngược, chấm điểm, hoàn thành hoặc có kết quả, giữ luôn ở Bước 2
    if (['calibrating', 'countdown', 'scoring', 'completed', 'result'].includes(stage)) {
      handleStepChange(2);
      setTransitionCountdown(null);
      return;
    }

    // Nếu đang ở Bước 1 và các tiêu chí đều ĐẠT (ready === true)
    if (activeStep === 1) {
      if (ready) {
        setTransitionCountdown(3);
        const timer1 = setTimeout(() => setTransitionCountdown(2), 1000);
        const timer2 = setTimeout(() => setTransitionCountdown(1), 2000);
        const timer3 = setTimeout(() => {
          setTransitionCountdown(null);
          handleStepChange(2);
        }, 2800);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
          clearTimeout(timer3);
        };
      } else {
        setTransitionCountdown(null);
      }
    }
  }, [ready, stage, activeStep]);

  const running = ['quality-check', 'calibrating', 'countdown', 'scoring', 'completed', 'blocked', 'loading-model'].includes(stage);

  return (
    <div className="flex flex-col h-full space-y-4 text-slate-800 dark:text-slate-100 select-none">
      {/* ══════════ THANH TIẾN TRÌNH 2 BƯỚC ══════════ */}
      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-bold gap-2">
        <button
          onClick={() => handleStepChange(1)}
          className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeStep === 1
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : ready
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          {ready ? <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" /> : <span className="w-4 h-4 rounded-full bg-slate-400/30 flex items-center justify-center text-[10px]">1</span>}
          <span>Bước 1: Vị trí</span>
        </button>

        <ArrowRight size={14} className="text-slate-400 shrink-0" />

        <button
          onClick={() => handleStepChange(2)}
          className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeStep === 2
              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-slate-400/30 flex items-center justify-center text-[10px]">2</span>
          <span>Bước 2: Động tác</span>
        </button>
      </div>

      {/* ══════════ NỘI DUNG BƯỚC 1: KIỂM TRA ĐIỀU KIỆN ══════════ */}
      {activeStep === 1 ? (
        <section className="rounded-3xl border border-slate-200 dark:border-slate-700/80 p-5 bg-white dark:bg-slate-900/95 shadow-xl space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                  Bước 1 / 2
                </span>
                <h2 className="text-base font-extrabold mt-0.5">Kiểm tra camera &amp; Vị trí</h2>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                ready
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {ready ? '✓ Đã đạt chuẩn' : 'Đang căn chỉnh'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Đứng lùi lại khoảng 2.0 – 2.5m, chỉnh góc màn hình máy tính cụp nhẹ xuống để camera thấy được từ đầu đến chân.
            </p>

            {/* Checklist 6 điều kiện */}
            <ul className="space-y-2 pt-1">
              {CHECKLIST_ITEMS.map((item, index) => {
                const check = report?.checks[index];
                const isPassed = !!check?.passed;
                return (
                  <li
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                      isPassed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      {isPassed ? (
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      ) : (
                        <Circle size={16} className="text-slate-400 shrink-0" />
                      )}
                      <span>{item.label}</span>
                    </span>
                    <span className="text-[10px] font-bold font-mono">
                      {isPassed ? 'ĐẠT' : 'CHƯA'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Dòng trạng thái hướng dẫn */}
          <div className="space-y-3 pt-2">
            {transitionCountdown !== null ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={20} className="text-amber-300 shrink-0" />
                  <div>
                    <p className="font-extrabold text-xs">Vị trí đã chuẩn xác!</p>
                    <p className="text-[11px] text-emerald-100 font-semibold">
                      Tự động chuyển sang Bước 2 trong <span className="font-black text-amber-300 font-mono text-sm">{transitionCountdown}s</span>...
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setTransitionCountdown(null);
                    handleStepChange(2);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white text-emerald-800 font-black text-xs shadow hover:bg-amber-300 hover:text-slate-950 transition-colors shrink-0 cursor-pointer ml-2"
                >
                  Sang ngay →
                </button>
              </div>
            ) : (
              <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed border ${
                ready
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-950/80 border-amber-500/40 text-amber-800 dark:text-amber-200'
              }`}>
                {ready ? (
                  <div className="flex items-center justify-between">
                    <span>Tất cả điều kiện đã đạt! Bấm chuyển sang Bước 2.</span>
                    <button
                      onClick={() => handleStepChange(2)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors shrink-0 ml-2 cursor-pointer"
                    >
                      Sang Bước 2 →
                    </button>
                  </div>
                ) : (
                  report?.reasons[0] || (running ? 'Đang kiểm tra chất lượng hình ảnh...' : 'Bật camera để bắt đầu kiểm tra.')
                )}
              </div>
            )}

            {/* Nút bật/dừng camera */}
            <div className="flex gap-2">
              {!running ? (
                <button
                  onClick={onStart}
                  className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Camera size={16} /> Bật camera kiểm tra
                </button>
              ) : (
                <button
                  onClick={onStop}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Square size={14} /> Tắt camera
                </button>
              )}
            </div>
          </div>
        </section>
      ) : (
        /* ══════════ NỘI DUNG BƯỚC 2: HƯỚNG DẪN ĐỘNG TÁC & CHẤM ĐIỂM ══════════ */
        <section className="rounded-3xl border border-emerald-500/30 dark:border-emerald-500/25 p-5 bg-white dark:bg-slate-900/95 shadow-xl space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                  Bước 2 / 2
                </span>
                <h2 className="text-base font-extrabold mt-0.5">{currentExercise.name}</h2>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Chuẩn QĐNDVN
              </span>
            </div>

            {/* Thẻ gập xem lại Bước 1 */}
            <button
              onClick={() => setShowStep1Details(!showStep1Details)}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 size={14} /> Bước 1: Vị trí camera đã đạt chuẩn
              </span>
              {showStep1Details ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showStep1Details && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                {CHECKLIST_ITEMS.map((item) => (
                  <div key={item.id} className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 4 ĐỘNG TÁC CẦN THỰC HIỆN THEO ĐỘNG TÁC ĐANG CHỌN */}
            <div className="space-y-2 pt-1">
              <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Yêu cầu 4 động tác cốt lõi:
              </h3>

              <div className="grid gap-2">
                {currentExercise.guidelines.map((guide, idx) => {
                  const colorStyles = [
                    {
                      bg: 'bg-amber-500/10 border-amber-500/25',
                      badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
                      title: 'text-amber-900 dark:text-amber-200',
                    },
                    {
                      bg: 'bg-blue-500/10 border-blue-500/25',
                      badge: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
                      title: 'text-blue-900 dark:text-blue-200',
                    },
                    {
                      bg: 'bg-rose-500/10 border-rose-500/25',
                      badge: 'bg-rose-500/20 text-rose-700 dark:text-rose-400',
                      title: 'text-rose-900 dark:text-rose-200',
                    },
                    {
                      bg: 'bg-emerald-500/10 border-emerald-500/25',
                      badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
                      title: 'text-emerald-900 dark:text-emerald-200',
                    },
                  ];
                  const style = colorStyles[idx % colorStyles.length];

                  return (
                    <div
                      key={guide.number}
                      className={`p-2.5 rounded-2xl border text-xs flex items-start gap-2.5 ${style.bg}`}
                    >
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 font-bold font-mono text-[11px] ${style.badge}`}
                      >
                        {guide.number}
                      </div>
                      <div>
                        <h4 className={`font-extrabold ${style.title}`}>{guide.title}</h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {guide.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* KHU VỰC THỰC HIỆN & TIẾN TRÌNH ĐẾM NGƯỢC */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            {stage === 'calibrating' && (
              <div className="p-3.5 rounded-2xl bg-amber-500/20 border-2 border-amber-500 text-center animate-pulse">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  Đang hiệu chuẩn (2 giây)
                </span>
                <p className="text-base font-black mt-1">Giữ nguyên tư thế để máy đo kích thước...</p>
              </div>
            )}

            {stage === 'countdown' && (
              <div className="p-3.5 rounded-2xl bg-amber-500 text-slate-950 text-center shadow-xl">
                <span className="text-xs font-black uppercase tracking-wider">
                  Chuẩn bị {currentExercise.name.toLowerCase()}
                </span>
                <div className="text-3xl font-black font-mono my-0.5">
                  {Math.max(1, Math.ceil(3 * (1 - progress)))}
                </div>
                <p className="text-xs font-bold">Chỉnh ngay ngắn chân, tay và mắt nhìn thẳng!</p>
              </div>
            )}

            {stage === 'scoring' && (
              <div className="p-3.5 rounded-2xl bg-emerald-600 text-white text-center shadow-xl space-y-2 animate-in fade-in">
                {currentExercise.definition?.type === 'DYNAMIC' ? (
                  <>
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-emerald-200">
                      <span>{currentExercise.name}</span>
                      <span className="font-mono text-amber-300 font-extrabold text-sm">
                        {Math.round(progress * 100)}%
                      </span>
                    </div>
                    <p className="text-xs font-bold text-emerald-100">
                      {progress < 0.25
                        ? 'Đứng nhìn thẳng camera, chuẩn bị quay...'
                        : progress < 0.65
                        ? 'Quay người vuông góc 90° dứt khoát!'
                        : 'Giữ yên tư thế kết thúc ổn định!'}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-emerald-200">
                      <span>Đang chấm... Giữ nguyên tư thế</span>
                      <span className="font-mono text-amber-300 font-extrabold text-sm">
                        {(progress * 3.0).toFixed(1)} / 3.0s
                      </span>
                    </div>
                    <p className="text-xs font-bold text-emerald-100">Hít thở đều, giữ toàn thân bất động!</p>
                  </>
                )}
                <div className="h-2.5 bg-emerald-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-300 transition-[width] duration-150 rounded-full"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
            )}

            {stage === 'completed' && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center shadow-xl space-y-1.5 animate-pulse">
                <CheckCircle2 size={26} className="mx-auto text-amber-300" />
                <p className="text-sm font-black uppercase tracking-wider">✓ Hoàn thành bài!</p>
                <p className="text-xs text-emerald-100 font-medium">Đang tính điểm và tổng hợp kết quả...</p>
              </div>
            )}

            {stage === 'result' && result && (
              <div className="animate-in fade-in duration-200">
                <ScoreResults
                  result={result}
                  movementId={movementId}
                  onRetry={onRetry || onStart}
                  scoreComparison={scoreComparison}
                  compact={true}
                />
              </div>
            )}

            {/* Khu vực kích hoạt hiệu chuẩn & Chấm điểm */}
            {autoCountdown !== null && stage === 'quality-check' ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping" />
                    <span className="font-extrabold text-xs uppercase tracking-wider text-amber-200">
                      Tự động hiệu chuẩn &amp; Chấm
                    </span>
                  </div>
                  <span className="text-2xl font-black font-mono text-amber-300 animate-bounce">
                    {autoCountdown}s
                  </span>
                </div>
                <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                  Đã nhận diện đủ toàn thân! Đứng yên đúng tư thế, hệ thống sẽ tự động đo tỉ lệ cơ thể sau <span className="font-black text-amber-300 font-mono">{autoCountdown}s</span>...
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={onCalibrate}
                    className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-amber-300 text-emerald-950 font-black text-xs shadow transition-colors cursor-pointer"
                  >
                    Hiệu chuẩn ngay →
                  </button>
                  <button
                    onClick={() => onToggleAutoCalibrate?.(false)}
                    className="py-2 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-950 text-emerald-200 text-xs font-bold border border-emerald-400/30 transition-colors cursor-pointer"
                  >
                    Tắt tự động
                  </button>
                </div>
              </div>
            ) : (
              ['quality-check', 'blocked'].includes(stage) && (
                <div className="space-y-2">
                  <button
                    disabled={!ready}
                    onClick={onCalibrate}
                    className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                      ready
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.02] shadow-emerald-600/30'
                        : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <RotateCcw size={18} />
                    <span>Bắt đầu hiệu chuẩn &amp; Chấm điểm</span>
                  </button>

                  {onToggleAutoCalibrate && (
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer pt-1 hover:text-slate-900 dark:hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={autoCalibrate}
                        onChange={e => onToggleAutoCalibrate(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span>Tự động hiệu chuẩn khi đứng đúng vị trí (Quay 1 mình)</span>
                    </label>
                  )}
                </div>
              )
            )}

            {running && stage !== 'result' && (
              <button
                onClick={onStop}
                className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Square size={14} /> Dừng phiên
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}