import { useState, useEffect, Suspense, lazy } from "react";
import { PracticalSkill } from "../../data/practicalSkills";
import {
  CheckCircle2, Lock, Unlock, AlertTriangle, Lightbulb, ShieldCheck,
  PlayCircle, Image as ImageIcon, Box, Trophy, ArrowRight, RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGamification } from "../../context/GamificationContext";

const CrawlSimulation = lazy(() => import("./CrawlSimulation"));
const GrenadeSimulation = lazy(() => import("./GrenadeSimulation"));
const PostureSimulation = lazy(() => import("./PostureSimulation"));

interface StepByStepModuleProps {
  skill: PracticalSkill;
}

export default function StepByStepModule({ skill }: StepByStepModuleProps) {
  const { recordSkillCompletion, fireXPToast } = useGamification();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showReport, setShowReport] = useState(false);
  const [mediaTab, setMediaTab] = useState<"video" | "3d">("video");

  useEffect(() => {
    setCurrentStepIdx(0);
    setCheckedItems({});
    setQuizAnswers({});
    setShowReport(false);
  }, [skill.id]);

  const steps = skill.steps;
  const currentStep = steps[currentStepIdx];

  const isChecklistDone = currentStep?.checklist.every((_, i) => checkedItems[`${currentStep.id}-check-${i}`]);
  const isQuizzesDone = currentStep?.quizzes.every((q) => quizAnswers[q.id] === q.correctIdx);
  const isCurrentStepDone = isChecklistDone && (currentStep?.quizzes.length === 0 || isQuizzesDone);

  const handleNextStep = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      setShowReport(true);
      const { xpGained } = recordSkillCompletion(skill.id);
      if (xpGained > 0) fireXPToast(xpGained, `Hoàn thành ${skill.name}`);
    }
  };

  const handleQuizSelect = (quizId: string, optIdx: number, correctIdx: number) => {
    setQuizAnswers(prev => ({ ...prev, [quizId]: optIdx }));
    if (optIdx === correctIdx) fireXPToast(5, "Trả lời đúng!");
  };

  const calculateProgress = () => {
    if (showReport) return 100;
    const stepWeight = 100 / steps.length;
    let progress = currentStepIdx * stepWeight;
    if (isChecklistDone) progress += stepWeight * 0.5;
    if (isCurrentStepDone) progress = (currentStepIdx + 1) * stepWeight;
    return progress;
  };

  // ── COMPLETION REPORT ──
  if (showReport) {
    return (
      <div className="w-full bg-white flex flex-col items-center justify-center py-12 px-5 md:py-20 md:px-8 text-center space-y-6">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
          <Trophy className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900">Báo Cáo Thực Hành</h2>
        <p className="text-lg text-slate-600 font-medium">
          Bạn đã hoàn thành xuất sắc kỹ năng <span className="text-emerald-700 font-bold">{skill.name}</span>!
        </p>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-4">
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex flex-col items-center">
            <span className="text-4xl font-black text-amber-500 mb-1">+30</span>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Điểm XP</span>
          </div>
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex flex-col items-center">
            <span className="text-4xl font-black text-blue-500 mb-1">100%</span>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Hoàn thành</span>
          </div>
        </div>
        <button
          onClick={() => { setCurrentStepIdx(0); setCheckedItems({}); setQuizAnswers({}); setShowReport(false); }}
          className="mt-4 flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-5 h-5" /> Ôn tập lại kỹ năng này
        </button>
      </div>
    );
  }

  // ── MAIN LAYOUT (CÓ LỒNG KÍNH VÀ THANH CUỘN BÊN TRONG CHỐNG TRÀN) ──
  return (
    // 💡 Thêm h-full, overflow-hidden để nhốt giao diện lại
    <div className="w-full bg-white flex flex-col">

      {/* ── TOP HEADER ── */}
      <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 bg-slate-50 flex flex-col gap-2 shrink-0">
        <div className="flex justify-between items-center">
          <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider line-clamp-1">{skill.name}</span>
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full uppercase shrink-0">
            {currentStepIdx + 1} / {steps.length}
          </span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${calculateProgress()}%` }}
          />
        </div>
      </div>

      {/* ── NỘI DUNG CUỘN ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-slate-200">
        
        {/* TIMELINE NGANG — cuộn ngang được trên mobile */}
        <div className="flex gap-2 md:gap-3 overflow-x-auto pb-3 mb-5 scrollbar-hide shrink-0">
          {steps.map((s, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div
                key={s.id}
                onClick={() => setCurrentStepIdx(idx)}
                className={`min-w-[140px] md:min-w-[180px] flex-1 p-2.5 md:p-3 rounded-xl border-2 transition-all duration-200 flex flex-col cursor-pointer ${
                  isCurrent
                    ? "bg-white border-emerald-500 shadow-md"
                    : isCompleted
                    ? "bg-emerald-50 border-emerald-200 hover:border-emerald-400"
                    : "bg-slate-50 border-slate-200 hover:border-slate-400"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${
                    isCurrent ? "text-emerald-700" : isCompleted ? "text-emerald-600" : "text-slate-500"
                  }`}>
                    Bước {idx + 1}
                  </span>
                  {isCompleted
                    ? <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                    : isCurrent
                    ? <Unlock className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                    : <Unlock className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />}
                </div>
                <p className={`text-[10px] md:text-xs font-bold leading-snug line-clamp-2 ${
                  isCurrent ? "text-slate-900" : isCompleted ? "text-emerald-800" : "text-slate-600"
                }`}>{s.title}</p>
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* TIÊU ĐỀ & MỤC TIÊU */}
            <div className="space-y-3 md:space-y-4">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 leading-tight">
                {currentStep.title}
              </h2>
              <div className="flex items-start gap-3 bg-blue-50/50 border border-blue-100 rounded-2xl p-4 md:p-5">
                <ShieldCheck className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-extrabold text-blue-700 uppercase tracking-widest mb-1">Mục tiêu huấn luyện</p>
                  <p className="text-sm font-medium text-blue-950 leading-relaxed">{currentStep.objective}</p>
                </div>
              </div>
            </div>

            {/* VIDEO & 3D VIEWER */}
            <div className="w-full aspect-video bg-slate-900 rounded-3xl overflow-hidden relative flex items-center justify-center shadow-xl border border-slate-800 group shrink-0">
              {mediaTab === "video" ? (
                currentStep.videoSrc ? (
                  // Kiểm tra xem là YouTube link hay link MP4 trực tiếp
                  currentStep.videoSrc.includes("youtube.com") || currentStep.videoSrc.includes("youtu.be") ? (
                    // ✅ YOUTUBE EMBED
                    <iframe
                      key={currentStep.videoSrc}
                      className="w-full h-full"
                      src={currentStep.videoSrc}
                      title={currentStep.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    // ✅ LINK VIDEO TRỰC TIẾP (.mp4, v.v.)
                    <video
                      key={currentStep.videoSrc}
                      className="w-full h-full object-cover"
                      controls
                      controlsList="nodownload"
                      playsInline
                    >
                      <source src={currentStep.videoSrc} type="video/mp4" />
                      Trình duyệt không hỗ trợ video.
                    </video>
                  )
                ) : (
                  // ⏳ CHƯA CÓ VIDEO → hiện placeholder
                  <>
                    <ImageIcon className="w-16 h-16 text-slate-700 mb-4 group-hover:scale-110 transition-transform duration-500" />
                    <p className="absolute bottom-8 text-slate-400 font-mono text-sm text-center px-8">
                      {currentStep.mediaPlaceholderText}
                    </p>
                  </>
                )
              ) : (
                <div className="w-full h-full bg-[#0f172a] flex items-center justify-center">
                  <Suspense fallback={<div className="text-emerald-500 font-mono text-sm animate-pulse flex items-center gap-2"><Box className="w-5 h-5 animate-spin" /> Đang tải dữ liệu 3D...</div>}>
                    {skill.id === "crawl"   && <CrawlSimulation />}
                    {skill.id === "grenade" && <GrenadeSimulation />}
                    {skill.id === "posture" && <PostureSimulation />}
                    {!["crawl","grenade","posture"].includes(skill.id) && (
                      <div className="text-slate-500 font-mono text-sm border border-dashed border-slate-700 p-4 rounded-xl bg-slate-900/50 text-center">
                        [Mô hình 3D cho "<strong className="text-slate-300">{skill.name}</strong>" đang được cập nhật]
                      </div>
                    )}
                  </Suspense>
                </div>
              )}

              {/* Tab toggle Video / 3D — ẩn khi đang phát video (controls đã có) */}
              <div className="absolute top-3 right-3 flex gap-2 z-30">
                <button
                  onClick={() => setMediaTab("video")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                    mediaTab === "video"
                      ? "bg-emerald-500 text-white"
                      : "bg-black/60 backdrop-blur-md text-slate-300 border border-white/10 hover:bg-black/80"
                  }`}
                >
                  <PlayCircle className="w-4 h-4" /> Video
                </button>
                {currentStep.has3DModel && (
                  <button
                    onClick={() => setMediaTab("3d")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                      mediaTab === "3d"
                        ? "bg-emerald-500 text-white"
                        : "bg-black/60 backdrop-blur-md text-slate-300 border border-white/10 hover:bg-black/80"
                    }`}
                  >
                    <Box className="w-4 h-4" /> Khảo sát 3D
                  </button>
                )}
              </div>
            </div>


            {/* KIẾN THỨC & CHECKLIST */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-emerald-800">
                    <Lightbulb className="w-5 h-5" />
                    <h3 className="font-black text-base uppercase tracking-wider">Kiến thức cốt lõi</h3>
                  </div>
                  <p className="text-sm text-emerald-950 leading-relaxed font-medium">
                    {currentStep.keyKnowledge}
                  </p>
                </div>

                <div className="bg-red-50 rounded-2xl p-6 border border-red-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-red-800">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="font-black text-base uppercase tracking-wider">Lỗi thường gặp</h3>
                  </div>
                  <ul className="text-sm text-red-950 leading-relaxed font-medium list-disc pl-5 space-y-2">
                    {currentStep.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              </div>

              <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Kiểm tra thao tác (Checklist)
                </h3>
                <div className="space-y-3">
                  {currentStep.checklist.map((item, idx) => {
                    const checkId = `${currentStep.id}-check-${idx}`;
                    const isChecked = !!checkedItems[checkId];
                    return (
                      <label
                        key={checkId}
                        className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                          isChecked
                            ? "bg-emerald-50 border-emerald-400 shadow-sm"
                            : "bg-white border-slate-200 hover:border-emerald-200"
                        }`}
                      >
                        <div className={`w-6 h-6 mt-0.5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isChecked ? "bg-emerald-500 border-emerald-500" : "bg-slate-100 border-slate-300"
                        }`}>
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className={`text-sm font-medium leading-relaxed ${
                          isChecked ? "text-emerald-900" : "text-slate-700"
                        }`}>{item}</span>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isChecked}
                          onChange={(e) => setCheckedItems(prev => ({ ...prev, [checkId]: e.target.checked }))}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* QUIZZES BÀI TẬP TÌNH HUỐNG */}
            {isChecklistDone && currentStep.quizzes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-inner shrink-0"
              >
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <h3 className="font-black text-slate-900 text-xl uppercase tracking-wider">Bài tập tình huống</h3>
                </div>
                
                {currentStep.quizzes.map(quiz => {
                  const selectedIdx = quizAnswers[quiz.id];
                  const isAnswered = selectedIdx !== undefined;
                  const isCorrect = selectedIdx === quiz.correctIdx;
                  return (
                    <div key={quiz.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                      <p className="font-extrabold text-slate-800 text-base leading-relaxed">{quiz.question}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {quiz.options.map((opt, optIdx) => {
                          let btnClass = "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-400";
                          if (isAnswered) {
                            if (optIdx === quiz.correctIdx) btnClass = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold";
                            else if (optIdx === selectedIdx) btnClass = "border-red-500 bg-red-50 text-red-900";
                            else btnClass = "border-slate-100 text-slate-400 opacity-50 bg-slate-50";
                          }
                          return (
                            <button
                              key={optIdx}
                              disabled={isAnswered}
                              onClick={() => handleQuizSelect(quiz.id, optIdx, quiz.correctIdx)}
                              className={`text-left p-4 rounded-xl border-2 text-sm transition-all duration-150 ${btnClass}`}
                            >
                              {String.fromCharCode(65 + optIdx)}. {opt}
                            </button>
                          );
                        })}
                      </div>
                      <AnimatePresence>
                        {isAnswered && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                            <div className={`mt-2 p-4 rounded-xl text-sm font-bold border ${
                              isCorrect ? "bg-emerald-100/50 text-emerald-800 border-emerald-200" : "bg-red-100/50 text-red-800 border-red-200"
                            }`}>
                              {isCorrect ? "✅ CHÍNH XÁC: " : "❌ SAI LẦM: "} {quiz.explanation}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* NÚT CHUYỂN BƯỚC */}
            <div className="pt-6 md:pt-8 border-t border-slate-100 flex justify-stretch md:justify-end shrink-0">
              <button
                disabled={!isCurrentStepDone}
                onClick={handleNextStep}
                className={`w-full md:w-auto flex items-center justify-center gap-3 px-6 md:px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-200 ${
                  isCurrentStepDone
                    ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-1 cursor-pointer"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-200"
                }`}
              >
                {currentStepIdx < steps.length - 1 ? "Hoàn thành bước này" : "Kết thúc khóa huấn luyện"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}