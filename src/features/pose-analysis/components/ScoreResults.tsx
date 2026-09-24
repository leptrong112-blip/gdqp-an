import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RotateCcw,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { MovementId } from '../types';
import type { ScoreResult } from '../scoring/scoringTypes';
import { buildRequirementCards, extractTopCorrections } from '../scoring/postureFeedback';
import { SequenceSummary } from './SequenceSummary';

interface ScoreResultsProps {
  result: ScoreResult;
  movementId?: MovementId;
  onRetry?: () => void;
  scoreComparison?: { previous: number; delta: number } | null;
  compact?: boolean;
}

export function ScoreResults({
  result,
  movementId = 'attention',
  onRetry,
  scoreComparison,
  compact = false,
}: ScoreResultsProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // ═══════════════════ TRƯỜNG HỢP KHÔNG THỂ CHẤM ĐIỂM (LỖI CHẤT LƯỢNG / CAMERA) ═══════════════════
  if (result.status === 'notScorable') {
    return (
      <section
        role="alert"
        className="rounded-3xl p-5 sm:p-6 bg-amber-50 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-700 shadow-xl space-y-4"
        aria-label="Chưa thể chấm điểm bài tập"
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-extrabold text-amber-950 dark:text-amber-200">
              Chưa thể chấm điểm bài tập
            </h2>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Hệ thống không trừ điểm oan khi chất lượng hình ảnh hoặc dữ liệu khớp chưa đủ độ tin cậy.
            </p>
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-800/80 text-xs space-y-2">
          <h3 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
            Lý do từ chối chấm:
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
            {result.reasons.map((reason, idx) => (
              <li key={idx} className="leading-relaxed">{reason}</li>
            ))}
          </ul>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-amber-100/50 dark:bg-amber-900/30 p-3 rounded-xl border border-amber-200/50 dark:border-amber-800/40">
          💡 <strong>Gợi ý khắc phục:</strong> Chỉnh camera thấy rõ từ đỉnh đầu đến hai bàn chân, giữ phòng đủ sáng và đứng yên không cử động trong suốt 3 giây giữ thế.
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
          >
            <RotateCcw size={16} />
            <span>Thực hiện lại bài tập</span>
          </button>
        )}
      </section>
    );
  }

  // ═══════════════════ TRƯỜNG HỢP ĐÃ CHẤM ĐIỂM THÀNH CÔNG ═══════════════════
  const { total, confidence, criteria } = result;
  const cards = buildRequirementCards(criteria, movementId);
  const topCorrections = extractTopCorrections(criteria);

  // Xếp loại điểm số
  let tierLabel = 'CẦN CỐ GẮNG';
  let tierColor = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
  if (total >= 90) {
    tierLabel = 'XUẤT SẮC';
    tierColor = 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/40';
  } else if (total >= 80) {
    tierLabel = 'TỐT';
    tierColor = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
  } else if (total >= 65) {
    tierLabel = 'ĐẠT';
    tierColor = 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30';
  }

  const isTurn = movementId === 'turnLeft' || movementId === 'turnRight';
  const exerciseName = isTurn
    ? (movementId === 'turnLeft' ? 'Động tác quay trái' : 'Động tác quay phải')
    : movementId === 'atEase'
    ? 'Tư thế đứng nghỉ'
    : movementId === 'salute'
    ? 'Động tác chào / thôi chào'
    : 'Tư thế đứng nghiêm';
  const exerciseSubtitle =
    isTurn
      ? 'Phân tích hướng quay, tư thế và diễn biến chuyển động · Beta'
      : movementId === 'salute'
      ? 'Đánh giá tự động theo điều lệnh chào QĐNDVN · SGK 10 Bài 9'
      : movementId === 'atEase'
      ? 'Đánh giá tự động theo điều lệnh đứng nghỉ QĐNDVN'
      : 'Đánh giá tự động dựa trên 4 yêu cầu điều lệnh Quân ngũ QĐNDVN';

  return (
    <section
      className={`rounded-3xl border border-emerald-300 dark:border-emerald-800/80 bg-white dark:bg-slate-900 shadow-2xl space-y-5 text-slate-800 dark:text-slate-100 ${
        compact ? 'p-4 sm:p-5' : 'p-5 sm:p-7'
      }`}
      aria-label={`Kết quả chấm điểm ${exerciseName}`}
    >
      {/* ══════════ KHỐI TỔNG ĐIỂM & XẾP HẠNG ══════════ */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 font-mono">
            Kết quả bài tập · AI Pose Beta
          </span>
          <h2 className="text-lg sm:text-2xl font-black mt-0.5">{exerciseName}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {exerciseSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mức đạt theo tiêu chí</p>
            <div className="text-3xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
              {total}
              <span className="text-xl sm:text-3xl">%</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Tương đương {total}/100 điểm · Điểm tham khảo</p>
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${tierColor}`}>
                {tierLabel}
              </span>
              {scoreComparison && (
                <span
                  className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    scoreComparison.delta > 0
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : scoreComparison.delta < 0
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                  title={`Lần trước: ${scoreComparison.previous} điểm`}
                >
                  {scoreComparison.delta > 0 ? (
                    <>
                      <TrendingUp size={12} />
                      <span>+{scoreComparison.delta} đ</span>
                    </>
                  ) : scoreComparison.delta < 0 ? (
                    <>
                      <TrendingDown size={12} />
                      <span>{scoreComparison.delta} đ</span>
                    </>
                  ) : (
                    <>
                      <Minus size={12} />
                      <span>Bằng lần trước</span>
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {result.sequence && <SequenceSummary report={result.sequence} />}

      {/* ══════════ CẦN CẢI THIỆN NHẤT (NẾU CÓ ĐIỂM TRỪ) ══════════ */}
      {topCorrections.length > 0 && (
        <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wider text-[11px]">
            <Target size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Cần cải thiện nhất:</span>
          </div>
          <ol className="list-decimal pl-5 space-y-1.5 font-medium text-slate-700 dark:text-slate-200">
            {topCorrections.map((tip, idx) => (
              <li key={idx} className="leading-relaxed">
                <strong>{tip}</strong>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ══════════ 4 THẺ YÊU CẦU CỐT LÕI (TÁI SỬ DỤNG TỪ BƯỚC 2) ══════════ */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>Chi tiết yêu cầu bài tập:</span>
          <span className="text-[10px] font-normal text-slate-400">Thang điểm 100</span>
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map(card => {
            const isPass = card.statusLevel === 'PASS';
            const isAdjust = card.statusLevel === 'NEEDS_ADJUSTMENT';
            const isFail = card.statusLevel === 'NOT_ACHIEVED';

            return (
              <div
                key={card.id}
                className={`rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-2.5 ${
                  isPass
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : isAdjust
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                    : isFail
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                        {card.number}
                      </span>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                        {card.title}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black font-mono">
                        {card.points} / {card.maximum}
                      </span>
                    </div>
                  </div>

                  {/* Thanh tiến trình mini */}
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isPass
                          ? 'bg-emerald-500'
                          : isAdjust
                          ? 'bg-amber-500'
                          : isFail
                          ? 'bg-rose-500'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, (card.points / card.maximum) * 100))}%` }}
                    />
                  </div>

                  {/* Nhãn trạng thái */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {isPass && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 size={13} /> Đạt
                      </span>
                    )}
                    {isAdjust && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-700 dark:text-amber-400">
                        <AlertTriangle size={13} /> Cần điều chỉnh
                      </span>
                    )}
                    {isFail && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-700 dark:text-rose-400">
                        <XCircle size={13} /> Chưa đạt
                      </span>
                    )}
                    {card.statusLevel === 'NOT_SCORABLE' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                        <HelpCircle size={13} /> Không đủ dữ liệu
                      </span>
                    )}
                  </div>

                  {/* Nhận xét thực tế */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {card.feedback}
                  </p>
                </div>

                {/* Danh sách lỗi phụ (nếu có nhiều hơn 1 lỗi) */}
                {card.mistakes.length > 1 && (
                  <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                    {card.mistakes.slice(1).map((m, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════ CHI TIẾT THÔNG SỐ KỸ THUẬT (MỞ RỘNG) ══════════ */}
      <div className="pt-1">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Xem chi tiết thông số phân tích</span>
          {showTechnicalDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showTechnicalDetails && (
          <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2 animate-in fade-in duration-150">
            {criteria.map(c => (
              <div key={c.id} className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50 last:border-none">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{c.label}</span>
                  <span className="text-[11px] text-slate-400 ml-2">({c.feedback})</span>
                </div>
                <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                  {c.points} / {c.maximum} đ
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════ CHÂN TRANG & NÚT THỰC HIỆN LẠI ══════════ */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span>Độ tin cậy phân tích: <strong>{Math.round(confidence * 100)}%</strong></span>
          <span>Xử lý 100% Offline trên máy · Điểm tham khảo kỹ thuật</span>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
          >
            <RotateCcw size={16} />
            <span>Thực hiện lại bài tập</span>
          </button>
        )}
      </div>
    </section>
  );
}
