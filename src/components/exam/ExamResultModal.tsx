import React, { useState } from "react";
import { createPortal } from "react-dom";
import { ExamResultRecord } from "../../types/exam";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Target,
  RotateCcw,
  X,
  FileText,
  Check,
  Edit3,
  Award,
  BookOpen,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { motion } from "motion/react";

interface ExamResultModalProps {
  result: ExamResultRecord;
  onClose: () => void;
}

export const ExamResultModal: React.FC<ExamResultModalProps> = ({ result, onClose }) => {
  const [activeReviewTab, setActiveReviewTab] = useState<"mcq" | "tf" | "essay">(() => {
    if (result.details && result.details.length > 0) return "mcq";
    if (result.tfDetails && result.tfDetails.length > 0) return "tf";
    return "essay";
  });

  const getClassification = (score: number) => {
    if (score >= 9) return { label: "Xuất sắc", color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-300 dark:border-amber-800" };
    if (score >= 8) return { label: "Giỏi", color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-300 dark:border-emerald-800" };
    if (score >= 6.5) return { label: "Khá", color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/10 border-blue-300 dark:border-blue-800" };
    if (score >= 5) return { label: "Trung bình", color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-500/10 border-orange-300 dark:border-orange-800" };
    return { label: "Cần cố gắng", color: "text-red-500 dark:text-red-400", bg: "bg-red-500/10 border-red-300 dark:border-red-800" };
  };

  const classification = getClassification(result.score);
  const minutesSpent = Math.floor(result.durationSpentSeconds / 60);
  const secondsSpent = result.durationSpentSeconds % 60;

  const hasMcq = result.details && result.details.length > 0;
  const hasTf = result.tfDetails && result.tfDetails.length > 0;
  const hasEssay = result.essayDetails && result.essayDetails.length > 0;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-[#111827] text-slate-800 dark:text-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800 transition-colors"
      >
        {/* HEADER MODAL */}
        <div className="bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/10 p-2 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-7 h-7 text-amber-400 drop-shadow" />
            <h2 className="text-xl font-black uppercase tracking-wide text-white">
              Kết Quả Bài Thi Thử GDQP-AN
            </h2>
          </div>
          <p className="text-xs text-slate-300">
            Chế độ:{" "}
            <span className="font-bold text-amber-300 uppercase">
              {result.mode === "all" ? "Tổng hợp THPT" : `Lớp ${result.mode.replace("grade_", "")}`}
            </span>{" "}
            · Định dạng:{" "}
            <span className="font-bold text-emerald-300 uppercase">
              {result.format === "full" ? "Đề Chuẩn 3 Phần" : result.format}
            </span>{" "}
            · Nộp lúc {new Date(result.submittedAt).toLocaleTimeString("vi-VN")}{" "}
            {new Date(result.submittedAt).toLocaleDateString("vi-VN")}
          </p>
        </div>

        {/* NỘI DUNG CUỘN CHÍNH */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* DASHBOARD TỔNG QUAN ĐIỂM SỐ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Điểm tổng */}
            <div className={`p-4 rounded-2xl border ${classification.bg} text-center flex flex-col justify-center items-center`}>
              <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                Điểm Tổng Kết
              </span>
              <span className={`text-3xl font-black ${classification.color} my-1 font-mono`}>
                {result.score}
                <span className="text-xs text-slate-400 font-normal">/10</span>
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${classification.bg} ${classification.color}`}>
                {classification.label}
              </span>
            </div>

            {/* Chi tiết thành phần điểm */}
            <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col justify-center">
              <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1.5 text-center">
                Điểm Từng Phần
              </span>
              <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300 font-mono">
                {hasMcq && (
                  <div className="flex justify-between">
                    <span>Phần I:</span>
                    <strong className="text-red-600 dark:text-red-400">{result.mcqScore ?? 0}đ</strong>
                  </div>
                )}
                {hasTf && (
                  <div className="flex justify-between">
                    <span>Phần II:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{result.tfScore ?? 0}đ</strong>
                  </div>
                )}
                {hasEssay && (
                  <div className="flex justify-between">
                    <span>Phần III:</span>
                    <strong className="text-purple-600 dark:text-purple-400">{result.essayScore ?? 0}đ</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Thời gian làm bài */}
            <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center flex flex-col justify-center items-center">
              <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                Thời gian làm
              </span>
              <div className="flex items-center gap-1.5 my-1">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-xl font-black text-slate-800 dark:text-white font-mono">
                  {String(minutesSpent).padStart(2, "0")}:{String(secondsSpent).padStart(2, "0")}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Chính xác {result.accuracyPercent}%
              </span>
            </div>

            {/* XP thưởng */}
            <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/40 text-center flex flex-col justify-center items-center">
              <span className="text-[11px] font-extrabold uppercase text-amber-700 dark:text-amber-400 tracking-wider">
                XP Thưởng
              </span>
              <div className="flex items-center gap-1 my-1">
                <Zap className="w-5 h-5 text-amber-500 fill-current" />
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  +{result.xpGained}
                </span>
              </div>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                Đã cộng vào Rank
              </span>
            </div>
          </div>

          {/* THANH CHUYỂN TAB XEM LẠI CHI TIẾT */}
          <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            {hasMcq && (
              <button
                onClick={() => setActiveReviewTab("mcq")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeReviewTab === "mcq"
                    ? "bg-red-600 text-white shadow"
                    : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                }`}
              >
                <FileText className="w-4 h-4" /> Phần I: Trắc Nghiệm ABCD ({result.details.length})
              </button>
            )}

            {hasTf && (
              <button
                onClick={() => setActiveReviewTab("tf")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeReviewTab === "tf"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Phần II: Đúng / Sai ({result.tfDetails?.length || 0})
              </button>
            )}

            {hasEssay && (
              <button
                onClick={() => setActiveReviewTab("essay")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeReviewTab === "essay"
                    ? "bg-purple-600 text-white shadow"
                    : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                }`}
              >
                <Edit3 className="w-4 h-4" /> Phần III: Tự Luận ({result.essayDetails?.length || 0})
              </button>
            )}
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: XEM LẠI PHẦN I TRẮC NGHIỆM ABCD */}
          {/* ========================================================================= */}
          {activeReviewTab === "mcq" && hasMcq && (
            <div className="space-y-4">
              {result.details.map((detail, idx) => (
                <div
                  key={detail.questionId}
                  className={`p-4 rounded-2xl border transition-colors ${
                    detail.isCorrect
                      ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/30"
                      : "border-red-200 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                      Câu {idx + 1}: {detail.question}
                    </span>
                    {detail.isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full shrink-0 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Đúng
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded-full shrink-0 border border-red-300 dark:border-red-800">
                        <XCircle className="w-3.5 h-3.5" /> Sai
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
                    {detail.options.map((opt, oIdx) => {
                      const isUserSelected = detail.selectedOption === oIdx;
                      const isCorrectOpt = detail.correctOption === oIdx;

                      let styleClass = "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200";
                      if (isCorrectOpt) {
                        styleClass = "border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold";
                      } else if (isUserSelected && !detail.isCorrect) {
                        styleClass = "border-red-400 dark:border-red-700 bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-200 line-through";
                      }

                      return (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${styleClass}`}
                        >
                          <span>{opt}</span>
                          {isCorrectOpt && (
                            <span className="text-[9px] font-extrabold uppercase bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                              Đáp án đúng
                            </span>
                          )}
                          {isUserSelected && !isCorrectOpt && (
                            <span className="text-[9px] font-extrabold uppercase bg-red-500 text-white px-1.5 py-0.5 rounded">
                              Đã chọn
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                    <span className="font-extrabold text-slate-900 dark:text-white block mb-0.5">
                      💡 Trích dẫn SGK & Lời giải:
                    </span>
                    {detail.explanation}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: XEM LẠI PHẦN II ĐÚNG / SAI (THEO CHUẨN BỘ GD&ĐT) */}
          {/* ========================================================================= */}
          {activeReviewTab === "tf" && hasTf && (
            <div className="space-y-4">
              {result.tfDetails?.map((tfItem, qIdx) => (
                <div
                  key={tfItem.questionId}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="font-black text-xs uppercase text-emerald-700 dark:text-emerald-400">
                      Câu {qIdx + 1} (Phần II: Đúng / Sai)
                    </span>
                    <span className="text-xs font-extrabold font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                      Đạt {tfItem.earnedPoints} / {tfItem.maxPoints}đ (Đúng {tfItem.correctCount}/4 ý)
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                    {tfItem.context}
                  </p>

                  <div className="space-y-2">
                    {tfItem.items.map((it) => (
                      <div
                        key={it.id}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          it.isCorrect
                            ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/30"
                            : "border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span className="font-bold uppercase w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                              {it.id}
                            </span>
                            <span className="text-slate-800 dark:text-slate-100 leading-relaxed">
                              {it.statement}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold">
                            <span className="text-slate-500">
                              Chọn:{" "}
                              <strong>
                                {it.userChoice === true ? "ĐÚNG" : it.userChoice === false ? "SAI" : "Chưa chọn"}
                              </strong>
                            </span>
                            <span>·</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-black">
                              Đáp án: {it.correctChoice ? "ĐÚNG" : "SAI"}
                            </span>
                            {it.isCorrect ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            )}
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-slate-400 pl-7 leading-relaxed">
                          💡 <em>{it.explanation}</em>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: XEM LẠI PHẦN III TỰ LUẬN & ĐÁP ÁN MẪU */}
          {/* ========================================================================= */}
          {activeReviewTab === "essay" && hasEssay && (
            <div className="space-y-6">
              {result.essayDetails?.map((es, idx) => (
                <div
                  key={es.questionId}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="font-black text-xs uppercase text-purple-700 dark:text-purple-400">
                      Câu {idx + 1} (Phần III: Tự Luận Vận Dụng)
                    </span>
                    <span className="text-xs font-bold font-mono bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2.5 py-0.5 rounded-full">
                      Điểm ước tính: {es.estimatedScore ?? 0} / {es.maxScore}đ
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500">Đề bài:</span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed whitespace-pre-line">
                      {es.prompt}
                    </p>
                  </div>

                  {/* BÀI LÀM CỦA HỌC SINH */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <span className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" /> Bài làm của thí sinh:
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                      {es.userResponse?.trim() || "Thí sinh không làm câu hỏi này."}
                    </p>
                  </div>

                  {/* BAREM BIỂU ĐIỂM (RUBRIC) */}
                  {es.rubric && es.rubric.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-2">
                      <span className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" /> Barem tiêu chí chấm điểm của giáo viên:
                      </span>
                      <div className="space-y-1.5">
                        {es.rubric.map((r, rIdx) => (
                          <div key={rIdx} className="flex items-start justify-between gap-3 text-xs">
                            <span className="text-slate-700 dark:text-slate-300">• {r.criterion}</span>
                            <span className="font-bold text-amber-700 dark:text-amber-400 font-mono shrink-0">
                              +{r.points}đ
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ĐÁP ÁN GỢI Ý CHUẨN CỦA GIÁO VIÊN */}
                  <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Hướng dẫn chấm & Đáp án chuẩn mẫu của giáo viên:
                    </span>
                    <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                      {es.suggestedAnswer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER MODAL */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md"
          >
            <RotateCcw className="w-4 h-4" /> Đóng & Quay về
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default ExamResultModal;
