import React, { useState, useEffect, useCallback } from "react";
import {
  ActiveExamSession,
  ExamMode,
  ExamResultRecord,
} from "../../types/exam";
import {
  createExamSession,
  evaluateExam,
  loadActiveSession,
  loadExamHistory,
  saveActiveSession,
  clearActiveSession,
} from "../../utils/examEngine";
import ExamTimer from "./ExamTimer";
import ExamResultModal from "./ExamResultModal";
import { useGamification } from "../../context/GamificationContext";
import {
  Trophy,
  Clock,
  CheckCircle2,
  FileText,
  Award,
  ArrowRight,
  ArrowLeft,
  Send,
  History,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function MockExamSection() {
  const { fireXPToast, refreshState } = useGamification();

  const [activeSession, setActiveSession] = useState<ActiveExamSession | null>(
    () => loadActiveSession()
  );
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedResult, setSelectedResult] = useState<ExamResultRecord | null>(
    null
  );
  const [examHistory, setExamHistory] = useState<ExamResultRecord[]>(() =>
    loadExamHistory()
  );

  useEffect(() => {
    const session = loadActiveSession();
    if (session && session.status === "in_progress") {
      const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
      if (elapsed >= session.durationSeconds) {
        handleAutoSubmit(session);
      } else {
        setActiveSession(session);
      }
    }
  }, []);

  const handleStartExam = (mode: ExamMode) => {
    const newSession = createExamSession(mode);
    setActiveSession(newSession);
    setCurrentQIndex(0);
  };

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (!activeSession || activeSession.status !== "in_progress") return;

    const updatedAnswers = {
      ...activeSession.userAnswers,
      [questionId]: optionIdx,
    };

    const updatedSession: ActiveExamSession = {
      ...activeSession,
      userAnswers: updatedAnswers,
    };

    setActiveSession(updatedSession);
    saveActiveSession(updatedSession);
  };

  const handleSubmitExam = useCallback(() => {
    if (!activeSession) return;

    const resultRecord = evaluateExam(activeSession);
    setActiveSession(null);
    setSelectedResult(resultRecord);
    setExamHistory(loadExamHistory());

    if (resultRecord.xpGained > 0) {
      fireXPToast(
        resultRecord.xpGained,
        `Thi thử ${
          resultRecord.mode === "all"
            ? "THPT"
            : `Lớp ${resultRecord.mode.replace("grade_", "")}`
        }`
      );
    }
    refreshState();
  }, [activeSession, fireXPToast, refreshState]);

  const handleAutoSubmit = useCallback(
    (sessionToSubmit: ActiveExamSession) => {
      const resultRecord = evaluateExam(sessionToSubmit);
      setActiveSession(null);
      setSelectedResult(resultRecord);
      setExamHistory(loadExamHistory());

      if (resultRecord.xpGained > 0) {
        fireXPToast(resultRecord.xpGained, "Hết giờ - Tự động nộp bài");
      }
      refreshState();
    },
    [fireXPToast, refreshState]
  );

  const handleExpireTimer = useCallback(() => {
    if (activeSession && activeSession.status === "in_progress") {
      handleAutoSubmit(activeSession);
    }
  }, [activeSession, handleAutoSubmit]);

  const modesConfig = [
    {
      mode: "grade_10" as ExamMode,
      title: "Thi Thử Lớp 10",
      duration: "15 phút",
      questionsCount: "8 câu",
      desc: "Nội dung Lịch sử quân sự, Đội ngũ từng người và Phòng chống tệ nạn",
      color: "from-blue-600 to-indigo-700",
      badge: "Lớp 10",
    },
    {
      mode: "grade_11" as ExamMode,
      title: "Thi Thử Lớp 11",
      duration: "15 phút",
      questionsCount: "8 câu",
      desc: "Nội dung Luật NVQS, Chủ quyền lãnh thổ và Quy trình tháo lắp AK-47",
      color: "from-emerald-600 to-teal-700",
      badge: "Lớp 11",
    },
    {
      mode: "grade_12" as ExamMode,
      title: "Thi Thử Lớp 12",
      duration: "15 phút",
      questionsCount: "8 câu",
      desc: "Nội dung Tổ chức QĐND/CAND, Bản đồ quân sự và Chiến thuật bộ binh",
      color: "from-purple-600 to-pink-700",
      badge: "Lớp 12",
    },
    {
      mode: "all" as ExamMode,
      title: "Thi Thử Tổng Hợp THPT",
      duration: "30 phút",
      questionsCount: "24 câu",
      desc: "Toàn bộ chương trình GDQP-AN THPT từ Lớp 10 đến Lớp 12",
      color: "from-red-600 via-rose-700 to-amber-600",
      badge: "Tổng Hợp",
      featured: true,
    },
  ];

  return (
    <div className="w-full space-y-8">
      {/* 1. MÀN HÌNH CHỌN ĐỀ THI */}
      {!activeSession && (
        <div className="space-y-8">
          {/* BANNER GIAO DIỆN */}
          <div className="bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="relative z-10 space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30">
                <Sparkles className="w-3.5 h-3.5" /> Chế Độ Kiểm Tra Có Kiểm Soát Thời Gian
              </div>
              <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">
                Thi Thử Trắc Nghiệm GDQP-AN
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Hệ thống rút đề ngẫu nhiên từ ngân hàng chuẩn hóa. Tự động chấm điểm, tính tỷ lệ chính xác, lưu lịch sử tiến bộ và cộng điểm XP danh hiệu.
              </p>
            </div>
          </div>

          {/* CHỌN CHẾ ĐỘ THI */}
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-wide mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-600 dark:text-red-400" /> Chọn Chế Độ Thi Thử
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modesConfig.map((m) => (
                <motion.div
                  key={m.mode}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`p-6 rounded-3xl bg-gradient-to-br ${m.color} text-white shadow-lg flex flex-col justify-between relative overflow-hidden cursor-pointer`}
                  onClick={() => handleStartExam(m.mode)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-xs font-black uppercase bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                      {m.badge}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold bg-black/30 px-3 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5" /> {m.duration}
                    </span>
                  </div>

                  <div className="space-y-1 mb-6">
                    <h3 className="text-xl font-extrabold text-white">{m.title}</h3>
                    <p className="text-xs text-white/80 leading-relaxed">
                      {m.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-xs font-semibold text-white/90">
                      Quy mô: {m.questionsCount}
                    </span>
                    <button className="flex items-center gap-1.5 bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-black shadow transition-all hover:bg-amber-300 cursor-pointer">
                      Bắt đầu thi <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* LỊCH SỬ THI THỬ GẦN ĐÂY */}
          {examHistory.length > 0 && (
            <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" /> Lịch Sử 10 Lượt Thi Gần Nhất
              </h2>

              <div className="space-y-2">
                {examHistory.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedResult(rec)}
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/50 dark:hover:bg-slate-800 hover:border-amber-200 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {rec.mode === "all"
                            ? "Thi Tổng hợp THPT"
                            : `Thi Lớp ${rec.mode.replace("grade_", "")}`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(rec.submittedAt).toLocaleDateString("vi-VN")}{" "}
                          {new Date(rec.submittedAt).toLocaleTimeString("vi-VN")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Đúng {rec.correctCount}/{rec.totalQuestions} câu · Chính xác {rec.accuracyPercent}%
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                        {rec.score}/10
                      </span>
                      <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                        Xem lại
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. MÀN HÌNH ĐANG LÀM BÀI THI */}
      {activeSession && (
        <div className="space-y-6">
          {/* HEADER BÀI THI */}
          <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-slate-800">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest">
                Đang làm bài thi thử · Chế độ{" "}
                {activeSession.mode === "all"
                  ? "Tổng hợp THPT"
                  : `Lớp ${activeSession.mode.replace("grade_", "")}`}
              </span>
              <h2 className="text-lg font-bold text-white">
                Câu {currentQIndex + 1} trên {activeSession.questions.length}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <ExamTimer
                startedAt={activeSession.startedAt}
                durationSeconds={activeSession.durationSeconds}
                onExpire={handleExpireTimer}
              />

              <button
                onClick={handleSubmitExam}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Nộp bài
              </button>
            </div>
          </div>

          {/* GRID CÂU HỎI */}
          {(() => {
            const currentQ = activeSession.questions[currentQIndex];
            if (!currentQ) return null;
            const selectedOptIdx = activeSession.userAnswers[currentQ.id];

            return (
              <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-1 rounded-full border border-red-100 dark:border-red-900">
                    Câu hỏi {currentQIndex + 1}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                    {currentQ.question}
                  </h3>
                </div>

                <div className="space-y-3">
                  {currentQ.options.map((optionText, optIdx) => {
                    const isSelected = selectedOptIdx === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(currentQ.id, optIdx)}
                        className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "border-red-600 dark:border-red-500 bg-red-50 dark:bg-red-950/60 text-red-950 dark:text-red-200 shadow-sm"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <span>{optionText}</span>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? "border-red-600 bg-red-600 text-white"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    disabled={currentQIndex === 0}
                    onClick={() => setCurrentQIndex((prev) => prev - 1)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Câu trước
                  </button>

                  <div className="flex gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-xs p-1">
                    {activeSession.questions.map((q, idx) => {
                      const isAnswered = activeSession.userAnswers[q.id] !== undefined;
                      const isCurrent = idx === currentQIndex;

                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQIndex(idx)}
                          className={`w-7 h-7 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center shrink-0 transition-all ${
                            isCurrent
                              ? "bg-red-600 text-white shadow-md scale-105"
                              : isAnswered
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={currentQIndex === activeSession.questions.length - 1}
                    onClick={() => setCurrentQIndex((prev) => prev + 1)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    Câu sau <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 3. MODAL KẾT QUẢ BÀI THI */}
      {selectedResult && (
        <ExamResultModal
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  );
}
