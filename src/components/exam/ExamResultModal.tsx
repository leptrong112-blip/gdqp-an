import React from "react";
import { createPortal } from "react-dom";
import { ExamResultRecord } from "../../types/exam";
import { Trophy, CheckCircle2, XCircle, Clock, Zap, Target, RotateCcw, X } from "lucide-react";
import { motion } from "motion/react";

interface ExamResultModalProps {
  result: ExamResultRecord;
  onClose: () => void;
}

export const ExamResultModal: React.FC<ExamResultModalProps> = ({ result, onClose }) => {
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

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-[#111827] text-slate-800 dark:text-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800 transition-colors"
      >
        {/* HEADER */}
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
            · Nộp lúc {new Date(result.submittedAt).toLocaleTimeString("vi-VN")}
          </p>
        </div>

        {/* SUMMARY DASHBOARD */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Điểm số */}
            <div className={`p-4 rounded-2xl border ${classification.bg} text-center flex flex-col justify-center items-center`}>
              <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Điểm số</span>
              <span className={`text-3xl font-black ${classification.color} my-1 font-mono`}>
                {result.score}
                <span className="text-xs text-slate-400 font-normal">/10</span>
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${classification.bg} ${classification.color}`}>
                {classification.label}
              </span>
            </div>

            {/* Số câu đúng */}
            <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center flex flex-col justify-center items-center">
              <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Câu đúng</span>
              <div className="flex items-center gap-1.5 my-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-2xl font-black text-slate-800 dark:text-white font-mono">
                  {result.correctCount}/{result.totalQuestions}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Chính xác {result.accuracyPercent}%
              </span>
            </div>

            {/* Thời gian */}
            <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center flex flex-col justify-center items-center">
              <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Thời gian</span>
              <div className="flex items-center gap-1.5 my-1">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-xl font-black text-slate-800 dark:text-white font-mono">
                  {String(minutesSpent).padStart(2, "0")}:{String(secondsSpent).padStart(2, "0")}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Thời gian làm bài</span>
            </div>

            {/* XP nhận được */}
            <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/40 text-center flex flex-col justify-center items-center">
              <span className="text-[11px] font-extrabold uppercase text-amber-700 dark:text-amber-400 tracking-wider">XP Thưởng</span>
              <div className="flex items-center gap-1 my-1">
                <Zap className="w-5 h-5 text-amber-500 fill-current" />
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  +{result.xpGained}
                </span>
              </div>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">Đã cộng vào Rank</span>
            </div>
          </div>

          {/* QUESTION REVIEW LIST */}
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-red-600 dark:text-red-400" /> Chi Tiết Câu Hỏi & Đáp Án Giải Thích
            </h3>

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

                  {/* OPTIONS LIST */}
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

                  {/* EXPLANATION */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                    <span className="font-extrabold text-slate-900 dark:text-white block mb-0.5">
                      💡 Giải thích chi tiết:
                    </span>
                    {detail.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
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
