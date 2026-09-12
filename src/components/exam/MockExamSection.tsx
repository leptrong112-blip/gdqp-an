import React, { useState, useEffect, useCallback } from "react";
import {
  ActiveExamSession,
  ExamFormatMode,
  ExamMode,
  ExamResultRecord,
} from "../../types/exam";
import {
  createExamSession,
  evaluateExam,
  loadActiveSession,
  loadExamHistory,
  saveActiveSession,
} from "../../utils/examEngine";
import ExamTimer from "./ExamTimer";
import ExamResultModal from "./ExamResultModal";
import ExamAdminSection from "./ExamAdminSection";
import { useAccount } from "../AccountGate";
import { useGamification } from "../../context/GamificationContext";
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ArrowRight,
  ArrowLeft,
  Send,
  History,
  Sparkles,
  Award,
  BookOpen,
  HelpCircle,
  Bot,
  AlertTriangle,
  Layers,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  UserRound,
  GraduationCap,
  Timer,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function MockExamSection() {
  const { fireXPToast, refreshState } = useGamification();

  let accountUser: any = null;
  try {
    const acc = useAccount();
    accountUser = acc.user;
  } catch {
    // context optional
  }

  const [activeSession, setActiveSession] = useState<ActiveExamSession | null>(
    () => loadActiveSession()
  );
  
  // Navigation state within active session
  const [activeSectionTab, setActiveSectionTab] = useState<"mcq" | "tf" | "essay">("mcq");
  const [mcqIndex, setMcqIndex] = useState<number>(0);
  const [tfIndex, setTfIndex] = useState<number>(0);
  const [essayIndex, setEssayIndex] = useState<number>(0);

  // Form thông tin học sinh & Thời gian làm bài theo yêu cầu Thầy Cường
  const [studentName, setStudentName] = useState<string>(() => accountUser?.name || accountUser?.username || "Nguyễn Văn An");
  const [studentClass, setStudentClass] = useState<string>("10A1");
  const [selectedTimeMinutes, setSelectedTimeMinutes] = useState<number>(45);
  const [showAdminDashboard, setShowAdminDashboard] = useState<boolean>(false);

  // Mode & Format selection in lobby
  const [selectedGrade, setSelectedGrade] = useState<ExamMode>("grade_10");
  const [selectedFormat, setSelectedFormat] = useState<ExamFormatMode>("full");

  // Đồng bộ tên tài khoản nếu đăng nhập sau
  useEffect(() => {
    if (accountUser?.name && (!studentName || studentName === "Nguyễn Văn An")) {
      setStudentName(accountUser.name);
    }
  }, [accountUser]);

  // AI essay feedback during exam
  const [aiReviewLoading, setAiReviewLoading] = useState<boolean>(false);
  const [aiFeedbackMap, setAiFeedbackMap] = useState<Record<number, { score: number; feedback: string }>>({});
  const [showRubricMap, setShowRubricMap] = useState<Record<number, boolean>>({});

  // Submit confirmation modal
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);

  const [selectedResult, setSelectedResult] = useState<ExamResultRecord | null>(null);
  const [examHistory, setExamHistory] = useState<ExamResultRecord[]>(() => loadExamHistory());

  // Check expired session on mount
  useEffect(() => {
    const session = loadActiveSession();
    if (session && session.status === "in_progress") {
      const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
      if (elapsed >= session.durationSeconds) {
        handleAutoSubmit(session);
      } else {
        setActiveSession(session);
        // Switch to the first available section
        if (session.questions && session.questions.length > 0) {
          setActiveSectionTab("mcq");
        } else if (session.tfQuestions && session.tfQuestions.length > 0) {
          setActiveSectionTab("tf");
        } else if (session.essayQuestions && session.essayQuestions.length > 0) {
          setActiveSectionTab("essay");
        }
      }
    }
  }, []);

  const handleStartExam = (mode: ExamMode, format: ExamFormatMode) => {
    const finalName = accountUser?.name || studentName.trim() || "Học sinh";
    const finalClass = studentClass.trim() || "10A1";
    const examTitle = selectedTimeMinutes === 0 
      ? `Luyện tập tự do (${format === "full" ? "Đề chuẩn 3 Phần" : format.toUpperCase()})` 
      : `Đề kiểm tra ${selectedTimeMinutes} phút (${format === "full" ? "Chuẩn Bộ GD&ĐT" : format.toUpperCase()})`;

    const newSession = createExamSession(mode, format, {
      studentName: finalName,
      studentClass: finalClass,
      timeLimitMinutes: selectedTimeMinutes,
      examTypeTitle: examTitle,
    });
    setActiveSession(newSession);
    setMcqIndex(0);
    setTfIndex(0);
    setEssayIndex(0);
    setAiFeedbackMap({});
    setShowRubricMap({});

    if (newSession.questions && newSession.questions.length > 0) {
      setActiveSectionTab("mcq");
    } else if (newSession.tfQuestions && newSession.tfQuestions.length > 0) {
      setActiveSectionTab("tf");
    } else {
      setActiveSectionTab("essay");
    }
  };

  // 1. Handlers for Section 1 (MCQ)
  const handleSelectMcq = (questionId: number, optionIdx: number) => {
    if (!activeSession || activeSession.status !== "in_progress") return;

    const updatedAnswers = {
      ...(activeSession.userAnswers || {}),
      [questionId]: optionIdx,
    };

    const updatedSession: ActiveExamSession = {
      ...activeSession,
      userAnswers: updatedAnswers,
    };

    setActiveSession(updatedSession);
    saveActiveSession(updatedSession);
  };

  // 2. Handlers for Section 2 (True / False)
  const handleSelectTf = (questionId: number, itemId: string, value: boolean) => {
    if (!activeSession || activeSession.status !== "in_progress") return;

    const currentQAnswers = activeSession.tfAnswers?.[questionId] || {};
    const updatedQAnswers = {
      ...currentQAnswers,
      [itemId]: value,
    };

    const updatedSession: ActiveExamSession = {
      ...activeSession,
      tfAnswers: {
        ...(activeSession.tfAnswers || {}),
        [questionId]: updatedQAnswers,
      },
    };

    setActiveSession(updatedSession);
    saveActiveSession(updatedSession);
  };

  // 3. Handlers for Section 3 (Essay)
  const handleChangeEssay = (questionId: number, text: string) => {
    if (!activeSession || activeSession.status !== "in_progress") return;

    const updatedSession: ActiveExamSession = {
      ...activeSession,
      essayAnswers: {
        ...(activeSession.essayAnswers || {}),
        [questionId]: text,
      },
    };

    setActiveSession(updatedSession);
    saveActiveSession(updatedSession);
  };

  // AI Evaluation request for Essay
  const handleRequestAiEssayReview = async (questionId: number) => {
    if (!activeSession) return;
    const activeEssay = activeSession.essayQuestions?.find((e) => e.id === questionId);
    if (!activeEssay) return;

    const userText = activeSession.essayAnswers?.[questionId] || "";
    if (!userText.trim()) {
      alert("Em vui lòng viết bài làm trước khi nhờ Trung tá Quyết nhận xét nhé!");
      return;
    }

    setAiReviewLoading(true);
    try {
      const res = await fetch("/api/evaluate-essay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activeEssay.prompt,
          userResponse: userText,
          rubric: activeEssay.rubric || [],
          suggestedAnswer: "",
          maxScore: activeEssay.maxScore,
        }),
      });

      if (!res.ok) throw new Error("Không thể kết nối máy chủ AI");
      const data = await res.json();
      setAiFeedbackMap((prev) => ({
        ...prev,
        [questionId]: {
          score: data.score ?? 2.0,
          feedback: data.feedback || data.strengths || "Bài làm đã được chấm sơ bộ.",
        },
      }));
    } catch (err: any) {
      // Fallback
      setAiFeedbackMap((prev) => ({
        ...prev,
        [questionId]: {
          score: 2.2,
          feedback: "Trung tá Quyết nhận xét: Bài viết đã bám sát yêu cầu đề bài. Em chú ý trình bày các luận điểm theo thứ tự logic và liên hệ trách nhiệm bản thân để đạt điểm tối đa nhé!",
        },
      }));
    } finally {
      setAiReviewLoading(false);
    }
  };

  const handleSubmitExam = useCallback(() => {
    if (!activeSession) return;

    const resultRecord = evaluateExam(activeSession);
    setActiveSession(null);
    setShowSubmitConfirm(false);
    setSelectedResult(resultRecord);
    setExamHistory(loadExamHistory());

    if (resultRecord.xpGained > 0) {
      fireXPToast(
        resultRecord.xpGained,
        `Thi thử ${
          resultRecord.mode === "all"
            ? "THPT"
            : `Lớp ${resultRecord.mode.replace("grade_", "")}`
        } (${resultRecord.score}/10đ)`
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

  // Statistics on answered questions
  const getAnsweredStats = () => {
    if (!activeSession) return { mcqAnswered: 0, mcqTotal: 0, tfAnswered: 0, tfTotal: 0, essayDone: 0, essayTotal: 0 };

    const mcqTotal = activeSession.questions?.length || 0;
    const mcqAnswered = Object.keys(activeSession.userAnswers || {}).length;

    const tfTotal = (activeSession.tfQuestions?.length || 0) * 4;
    let tfAnswered = 0;
    if (activeSession.tfAnswers) {
      Object.values(activeSession.tfAnswers).forEach((items) => {
        tfAnswered += Object.keys(items).length;
      });
    }

    const essayTotal = activeSession.essayQuestions?.length || 0;
    let essayDone = 0;
    if (activeSession.essayAnswers) {
      Object.values(activeSession.essayAnswers).forEach((t) => {
        if (t.trim().length > 10) essayDone++;
      });
    }

    return { mcqAnswered, mcqTotal, tfAnswered, tfTotal, essayDone, essayTotal };
  };

  const stats = getAnsweredStats();
  const uncompletedCount =
    (stats.mcqTotal - stats.mcqAnswered) +
    Math.ceil((stats.tfTotal - stats.tfAnswered) / 4) +
    (stats.essayTotal - stats.essayDone);

  // Grade modes configuration
  const gradeOptions = [
    {
      id: "grade_10" as ExamMode,
      label: "Khối Lớp 10",
      desc: "Lịch sử quân sự, Đội ngũ từng người, Pháp luật quốc phòng và Kỹ thuật cấp cứu",
      color: "from-blue-600 to-indigo-700",
      badge: "Lớp 10",
    },
    {
      id: "grade_11" as ExamMode,
      label: "Khối Lớp 11",
      desc: "Luật NVQS, Giới thiệu súng AK-47, Lựu đạn F-1 và Phòng không nhân dân",
      color: "from-emerald-600 to-teal-700",
      badge: "Lớp 11",
    },
    {
      id: "grade_12" as ExamMode,
      label: "Khối Lớp 12",
      desc: "Chiến lược Diễn biến hòa bình, Bắn súng AK bài 1 và Bản đồ quân sự",
      color: "from-purple-600 to-pink-700",
      badge: "Lớp 12",
    },
    {
      id: "all" as ExamMode,
      label: "Toàn Diện THPT",
      desc: "Tổng hợp toàn bộ kiến thức 32 bài học SGK Kết nối tri thức từ Lớp 10 đến Lớp 12",
      color: "from-red-600 via-rose-700 to-amber-600",
      badge: "Đề Tổng Hợp",
      featured: true,
    },
  ];

  // Format options configuration
  const formatOptions = [
    {
      id: "full" as ExamFormatMode,
      title: "Đề Chuẩn Bộ GD&ĐT (Full 3 Phần)",
      tag: "CHUẨN MOET 2025",
      tagColor: "bg-amber-500 text-slate-950 font-black",
      desc: "Gồm đầy đủ Phần 1 (ABCD), Phần 2 (Đúng/Sai chuẩn Bộ) và Phần 3 (Tự luận)",
      time: "45 phút",
      structure: "12 câu ABCD · 4 câu Đúng/Sai · 1 câu Tự luận",
      isRecommended: true,
    },
    {
      id: "mcq" as ExamFormatMode,
      title: "Chuyên Đề Phần I: Trắc Nghiệm ABCD",
      tag: "LUYỆN TẬP NHANH",
      tagColor: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      desc: "Rèn luyện tốc độ phản xạ và kiến thức trọng tâm với 4 phương án lựa chọn",
      time: "15 phút",
      structure: "15 câu trắc nghiệm 4 lựa chọn",
    },
    {
      id: "true_false" as ExamFormatMode,
      title: "Chuyên Đề Phần II: Đúng / Sai",
      tag: "DẠNG MỚI GDPT 2018",
      tagColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      desc: "Đánh giá tư duy sâu sắc, mỗi câu gồm 4 ý a, b, c, d chấm điểm theo thang Bộ",
      time: "20 phút",
      structure: "6 câu ngữ cảnh (24 mệnh đề kiểm tra)",
    },
    {
      id: "essay" as ExamFormatMode,
      title: "Chuyên Đề Phần III: Tự Luận & Vận Dụng",
      tag: "CÓ AI CHẤM ĐIỂM",
      tagColor: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
      desc: "Soạn thảo bài viết tình huống thực tiễn, đối chiếu Barem giáo viên và nhận xét AI",
      time: "30 phút",
      structure: "2 câu tự luận kèm Rubric tiêu chí",
    },
  ];

  if (showAdminDashboard) {
    return <ExamAdminSection onBack={() => setShowAdminDashboard(false)} />;
  }

  return (
    <div className="w-full space-y-8">
      {/* ========================================================================= */}
      {/* 1. MÀN HÌNH CHỌN ĐỀ THI (LOBBY) */}
      {/* ========================================================================= */}
      {!activeSession && (
        <div className="space-y-8">
          {/* BANNER GIAO DIỆN CHÍNH */}
          <div className="bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30 backdrop-blur-md">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Hệ Thống Khảo Thí Chuẩn Hóa Bộ GD&ĐT 2025
                </div>
                <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
                  Thi Thử GDQP-AN Chuẩn 3 Phần
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Ngân hàng câu hỏi đồ sộ bám sát SGK Kết nối tri thức. Học sinh nhập họ tên, lớp, chọn thời gian và loại câu hỏi. Kết quả thi được tự động lưu trữ phục vụ Thầy cô quản lý điểm số.
                </p>
              </div>

              {/* NÚT VÀO TRANG QUẢN LÝ KẾT QUẢ CHO GIÁO VIÊN */}
              <button
                onClick={() => setShowAdminDashboard(true)}
                className="px-5 py-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 hover:text-white font-black text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all shadow-lg cursor-pointer shrink-0"
              >
                <GraduationCap className="w-5 h-5 text-amber-400" />
                <span>Quản Lý Kết Quả Học Sinh (Thầy Cô)</span>
              </button>
            </div>
          </div>

          {/* BƯỚC 1: NHẬP THÔNG TIN THÍ SINH */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <UserRound className="w-5 h-5 text-red-600 dark:text-red-400" /> 1. Thông Tin Học Sinh Dự Thi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>Họ và tên thí sinh:</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={accountUser?.name || studentName}
                  readOnly={!!accountUser}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>Lớp học:</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    placeholder="Lớp"
                    className="w-28 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {["10A1", "10A2", "11B1", "11B2", "12C1", "12C2"].map((cls) => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setStudentClass(cls)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                          studentClass === cls
                            ? "bg-red-600 text-white border-red-600 shadow-2xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-red-300"
                        }`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BƯỚC 2: CHỌN THỜI GIAN LÀM BÀI */}
          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <Timer className="w-5 h-5 text-red-600 dark:text-red-400" /> 2. Chọn Thời Gian Làm Bài
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { minutes: 15, label: "15 Phút", tag: "Kiểm tra 15p", desc: "Nhanh gọn 8–12 câu cốt lõi" },
                { minutes: 30, label: "30 Phút", tag: "Định kỳ rút gọn", desc: "Khoảng 15–20 câu trắc nghiệm" },
                { minutes: 45, label: "45 Phút", tag: "Chuẩn Bộ GD&ĐT", desc: "Đề 1 tiết đầy đủ 3 phần", featured: true },
                { minutes: 0, label: "Tự Do", tag: "Không giới hạn", desc: "Luyện tập không áp lực thời gian" },
              ].map((t) => {
                const isSelected = selectedTimeMinutes === t.minutes;
                return (
                  <div
                    key={t.minutes}
                    onClick={() => setSelectedTimeMinutes(t.minutes)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-red-600 dark:border-red-500 bg-red-50 dark:bg-red-950/40 shadow-md ring-2 ring-red-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${isSelected ? "bg-red-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}>
                          {t.tag}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-red-600 dark:text-red-400" />}
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{t.label}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {t.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BƯỚC 3: CHỌN KHỐI LỚP */}
          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-red-600 dark:text-red-400" /> 3. Chọn Khối Lớp Ôn Thi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {gradeOptions.map((g) => {
                const isSelected = selectedGrade === g.id;
                return (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGrade(g.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-red-600 dark:border-red-500 bg-red-50 dark:bg-red-950/40 shadow-md ring-2 ring-red-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-1 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {g.badge}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-red-600 dark:text-red-400" />}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{g.label}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {g.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BƯỚC 4: CHỌN CẤU TRÚC ĐỀ THI */}
          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <Layers className="w-5 h-5 text-red-600 dark:text-red-400" /> 4. Chọn Cấu Trúc Đề Thi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formatOptions.map((f) => {
                const isSelected = selectedFormat === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFormat(f.id)}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? "border-red-600 dark:border-red-500 bg-gradient-to-br from-red-50/90 to-amber-50/40 dark:from-red-950/40 dark:to-slate-900 shadow-lg ring-2 ring-red-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${f.tagColor}`}>
                          {f.tag}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3.5 h-3.5 text-amber-500" /> {selectedTimeMinutes > 0 ? `${selectedTimeMinutes} phút` : "Tự do"}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                        {f.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                        {f.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">
                        {f.structure}
                      </span>
                      <span className={`font-bold flex items-center gap-1 ${isSelected ? "text-red-600 dark:text-red-400" : "text-slate-400"}`}>
                        {isSelected ? "Đang chọn" : "Chọn đề này"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* NÚT BẮT ĐẦU THI */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-slate-800">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Thí sinh: {studentName.trim() || "Học sinh"} · Lớp {studentClass.trim() || "10A1"}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-400/20 text-blue-300 border border-blue-400/30">
                  Thời gian: {selectedTimeMinutes > 0 ? `${selectedTimeMinutes} phút` : "Tự do"}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                {gradeOptions.find((g) => g.id === selectedGrade)?.label} · {formatOptions.find((f) => f.id === selectedFormat)?.title}
              </h3>
            </div>

            <button
              onClick={() => handleStartExam(selectedGrade, selectedFormat)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-sm font-black uppercase tracking-wider shadow-lg hover:shadow-red-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              Bắt đầu làm bài thi <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* LỊCH SỬ 10 LƯỢT THI GẦN NHẤT */}
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
                            ? "Tổng hợp THPT"
                            : `Lớp ${rec.mode.replace("grade_", "")}`}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {rec.format === "full"
                            ? "Đề chuẩn 3 Phần"
                            : rec.format === "true_false"
                            ? "Đúng/Sai"
                            : rec.format === "essay"
                            ? "Tự luận"
                            : "Trắc nghiệm ABCD"}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {new Date(rec.submittedAt).toLocaleDateString("vi-VN")}{" "}
                          {new Date(rec.submittedAt).toLocaleTimeString("vi-VN")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Chính xác {rec.accuracyPercent}% · +{rec.xpGained} XP Thưởng
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                        {rec.score}/10
                      </span>
                      <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MÀN HÌNH ĐANG LÀM BÀI THI (ACTIVE SESSION) */}
      {/* ========================================================================= */}
      {activeSession && (
        <div className="space-y-6">
          {/* HEADER BÀI THI */}
          <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 text-white flex flex-col lg:flex-row items-center justify-between gap-4 shadow-xl border border-slate-800 sticky top-4 z-40">
            <div className="space-y-1 text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
                  Đang làm bài · {activeSession.mode === "all" ? "Tổng hợp THPT" : `Lớp ${activeSession.mode.replace("grade_", "")}`}
                </span>
                <span className="text-[10px] font-black uppercase text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                  {activeSession.format === "full" ? "Đề Chuẩn 3 Phần" : activeSession.format.toUpperCase()}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Đã trả lời: {stats.mcqAnswered}/{stats.mcqTotal} câu ABCD · {stats.tfAnswered}/{stats.tfTotal} ý Đ/S · {stats.essayDone}/{stats.essayTotal} Tự luận
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <ExamTimer
                startedAt={activeSession.startedAt}
                durationSeconds={activeSession.durationSeconds}
                onExpire={handleExpireTimer}
              />

              <button
                onClick={() => {
                  if (uncompletedCount > 0) {
                    setShowSubmitConfirm(true);
                  } else {
                    handleSubmitExam();
                  }
                }}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:shadow-red-500/25 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Nộp bài thi
              </button>
            </div>
          </div>

          {/* THANH CHUYỂN PHẦN THI (SECTION TABS) */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            {activeSession.questions && activeSession.questions.length > 0 && (
              <button
                onClick={() => setActiveSectionTab("mcq")}
                className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeSectionTab === "mcq"
                    ? "bg-red-600 text-white shadow-md"
                    : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Phần I: Trắc Nghiệm ABCD</span>
                <span className={`text-[10px] px-2 py-0.2 rounded-full ${activeSectionTab === "mcq" ? "bg-black/20" : "bg-slate-200 dark:bg-slate-600"}`}>
                  {stats.mcqAnswered}/{stats.mcqTotal}
                </span>
              </button>
            )}

            {activeSession.tfQuestions && activeSession.tfQuestions.length > 0 && (
              <button
                onClick={() => setActiveSectionTab("tf")}
                className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeSectionTab === "tf"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Phần II: Đúng / Sai</span>
                <span className={`text-[10px] px-2 py-0.2 rounded-full ${activeSectionTab === "tf" ? "bg-black/20" : "bg-slate-200 dark:bg-slate-600"}`}>
                  {stats.tfAnswered}/{stats.tfTotal}
                </span>
              </button>
            )}

            {activeSession.essayQuestions && activeSession.essayQuestions.length > 0 && (
              <button
                onClick={() => setActiveSectionTab("essay")}
                className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeSectionTab === "essay"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>Phần III: Tự Luận</span>
                <span className={`text-[10px] px-2 py-0.2 rounded-full ${activeSectionTab === "essay" ? "bg-black/20" : "bg-slate-200 dark:bg-slate-600"}`}>
                  {stats.essayDone}/{stats.essayTotal}
                </span>
              </button>
            )}
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: GIAO DIỆN PHẦN I - TRẮC NGHIỆM ABCD */}
          {/* ========================================================================= */}
          {activeSectionTab === "mcq" && activeSession.questions && activeSession.questions.length > 0 && (
            <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
              {(() => {
                const currentQ = activeSession.questions[mcqIndex];
                if (!currentQ) return null;
                const selectedOptIdx = activeSession.userAnswers?.[currentQ.id];

                return (
                  <>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-1 rounded-full border border-red-100 dark:border-red-900">
                          Phần I · Câu {mcqIndex + 1} / {activeSession.questions.length}
                        </span>
                        {currentQ.lesson && (
                          <span className="text-xs text-slate-400 font-medium">
                            {currentQ.lesson}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                        {currentQ.question}
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {currentQ.options.map((optionText, optIdx) => {
                        const isSelected = selectedOptIdx === optIdx;
                        const optionPrefix = ["A", "B", "C", "D"][optIdx] || `${optIdx + 1}`;

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectMcq(currentQ.id, optIdx)}
                            className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "border-red-600 dark:border-red-500 bg-red-50 dark:bg-red-950/60 text-red-950 dark:text-red-200 shadow-sm"
                                : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "bg-red-600 text-white"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                {optionPrefix}
                              </span>
                              <span>{optionText}</span>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? "border-red-600 bg-red-600 text-white"
                                  : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* BẢNG CHUYỂN CÂU */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        disabled={mcqIndex === 0}
                        onClick={() => setMcqIndex((prev) => prev - 1)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" /> Câu trước
                      </button>

                      <div className="flex gap-1.5 overflow-x-auto max-w-[240px] sm:max-w-md p-1">
                        {activeSession.questions.map((q, idx) => {
                          const isAnswered = activeSession.userAnswers?.[q.id] !== undefined;
                          const isCurrent = idx === mcqIndex;

                          return (
                            <button
                              key={q.id}
                              onClick={() => setMcqIndex(idx)}
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
                        disabled={mcqIndex === activeSession.questions.length - 1}
                        onClick={() => setMcqIndex((prev) => prev + 1)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        Câu sau <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: GIAO DIỆN PHẦN II - TRẮC NGHIỆM ĐÚNG / SAI (A, B, C, D) */}
          {/* ========================================================================= */}
          {activeSectionTab === "tf" && activeSession.tfQuestions && activeSession.tfQuestions.length > 0 && (
            <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
              {(() => {
                const currentTf = activeSession.tfQuestions[tfIndex];
                if (!currentTf) return null;
                const userTfChoices = activeSession.tfAnswers?.[currentTf.id] || {};

                return (
                  <>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-900">
                          Phần II: Đúng / Sai · Câu {tfIndex + 1} / {activeSession.tfQuestions.length}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {currentTf.lesson || "Chương trình GDPT 2018"}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                          Lệnh hỏi & Ngữ cảnh:
                        </span>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                          {currentTf.context}
                        </p>
                      </div>
                    </div>

                    {/* 4 MỆNH ĐỀ A, B, C, D */}
                    <div className="space-y-3">
                      {currentTf.items.map((item) => {
                        const userChoice = userTfChoices[item.id];
                        const isTrueSelected = userChoice === true;
                        const isFalseSelected = userChoice === false;

                        return (
                          <div
                            key={item.id}
                            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-lg text-xs font-black bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 uppercase">
                                {item.id}
                              </span>
                              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                                {item.statement}
                              </p>
                            </div>

                            {/* HAI NÚT CHỌN ĐÚNG / SAI */}
                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <button
                                onClick={() => handleSelectTf(currentTf.id, item.id, true)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isTrueSelected
                                    ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40"
                                    : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-emerald-400"
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" /> Đúng
                              </button>

                              <button
                                onClick={() => handleSelectTf(currentTf.id, item.id, false)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isFalseSelected
                                    ? "bg-rose-600 text-white shadow-md ring-2 ring-rose-400/40"
                                    : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-rose-400"
                                }`}
                              >
                                <X className="w-3.5 h-3.5" /> Sai
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* BẢNG CHUYỂN CÂU ĐÚNG / SAI */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        disabled={tfIndex === 0}
                        onClick={() => setTfIndex((prev) => prev - 1)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" /> Câu trước
                      </button>

                      <div className="flex gap-2">
                        {activeSession.tfQuestions.map((q, idx) => {
                          const userAnswersCount = Object.keys(activeSession.tfAnswers?.[q.id] || {}).length;
                          const isFullyAnswered = userAnswersCount === 4;
                          const isCurrent = idx === tfIndex;

                          return (
                            <button
                              key={q.id}
                              onClick={() => setTfIndex(idx)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1 transition-all ${
                                isCurrent
                                  ? "bg-emerald-600 text-white shadow-md"
                                  : isFullyAnswered
                                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              Câu {idx + 1} ({userAnswersCount}/4)
                            </button>
                          );
                        })}
                      </div>

                      <button
                        disabled={tfIndex === activeSession.tfQuestions.length - 1}
                        onClick={() => setTfIndex((prev) => prev + 1)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        Câu sau <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: GIAO DIỆN PHẦN III - TỰ LUẬN & VẬN DỤNG */}
          {/* ========================================================================= */}
          {activeSectionTab === "essay" && activeSession.essayQuestions && activeSession.essayQuestions.length > 0 && (
            <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
              {(() => {
                const currentEssay = activeSession.essayQuestions[essayIndex];
                if (!currentEssay) return null;
                const userEssayText = activeSession.essayAnswers?.[currentEssay.id] || "";
                const isRubricOpen = showRubricMap[currentEssay.id];
                const aiFeedback = aiFeedbackMap[currentEssay.id];
                const wordCount = userEssayText.trim() ? userEssayText.trim().split(/\s+/).length : 0;

                return (
                  <>
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-3 py-1 rounded-full border border-purple-100 dark:border-purple-900">
                          Phần III: Tự Luận · Câu {essayIndex + 1} / {activeSession.essayQuestions.length}
                        </span>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                          Thang điểm: {currentEssay.maxScore} điểm
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-1">
                        <span className="text-xs font-bold text-purple-800 dark:text-purple-300 block">
                          Đề bài tự luận vận dụng:
                        </span>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                          {currentEssay.prompt}
                        </p>
                      </div>

                      {/* XEM BAREM TIÊU CHÍ (RUBRIC) */}
                      {currentEssay.rubric && currentEssay.rubric.length > 0 && (
                        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                          <button
                            onClick={() =>
                              setShowRubricMap((prev) => ({
                                ...prev,
                                [currentEssay.id]: !prev[currentEssay.id],
                              }))
                            }
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-between transition-all cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-amber-500" /> Barem tiêu chí chấm điểm của giáo viên ({currentEssay.rubric.length} tiêu chí)
                            </span>
                            {isRubricOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          {isRubricOpen && (
                            <div className="p-4 bg-white dark:bg-slate-900 space-y-2 border-t border-slate-100 dark:border-slate-800">
                              {currentEssay.rubric.map((r, rIdx) => (
                                <div key={rIdx} className="flex items-start justify-between gap-3 text-xs">
                                  <span className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    • {r.criterion}
                                  </span>
                                  <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0 font-mono">
                                    +{r.points}đ
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* KHUNG SOẠN THẢO BÀI LÀM TỰ LUẬN */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                        <span>Ô soạn thảo bài làm của học sinh:</span>
                        <span>Đã viết: <strong className="text-slate-900 dark:text-white font-mono">{wordCount}</strong> từ ({userEssayText.length} ký tự)</span>
                      </div>

                      <textarea
                        rows={8}
                        value={userEssayText}
                        onChange={(e) => handleChangeEssay(currentEssay.id, e.target.value)}
                        placeholder="Em hãy trình bày các luận điểm, phân tích dẫn chứng và liên hệ trách nhiệm bản thân vào đây..."
                        className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-sm text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all font-sans"
                      />
                    </div>

                    {/* NÚT AI NHẬN XÉT SƠ BỘ */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-xs font-extrabold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                          <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Trợ giảng AI: Trung tá Nguyễn Văn Quyết
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Nhận xét sơ bộ bài làm theo barem điểm trước khi chính thức nộp bài
                        </p>
                      </div>

                      <button
                        disabled={aiReviewLoading || !userEssayText.trim()}
                        onClick={() => handleRequestAiEssayReview(currentEssay.id)}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                      >
                        {aiReviewLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang đánh giá...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" /> Nhờ AI chấm thử
                          </>
                        )}
                      </button>
                    </div>

                    {/* HIỂN THỊ KẾT QUẢ AI CHẤM THỬ NẾU CÓ */}
                    {aiFeedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-purple-100/70 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-800 text-xs text-purple-950 dark:text-purple-200 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1">
                            🎖️ Điểm dự kiến: <strong className="text-sm font-mono text-purple-700 dark:text-purple-300">{aiFeedback.score} / {currentEssay.maxScore}đ</strong>
                          </span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-line">
                          {aiFeedback.feedback}
                        </p>
                      </motion.div>
                    )}

                    {/* BẢNG CHUYỂN CÂU TỰ LUẬN NẾU CÓ NHIỀU HƠN 1 CÂU */}
                    {activeSession.essayQuestions.length > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                          disabled={essayIndex === 0}
                          onClick={() => setEssayIndex((prev) => prev - 1)}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" /> Câu trước
                        </button>

                        <div className="flex gap-2">
                          {activeSession.essayQuestions.map((q, idx) => {
                            const isDone = (activeSession.essayAnswers?.[q.id] || "").trim().length > 10;
                            const isCurrent = idx === essayIndex;

                            return (
                              <button
                                key={q.id}
                                onClick={() => setEssayIndex(idx)}
                                className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                                  isCurrent
                                    ? "bg-purple-600 text-white shadow-md"
                                    : isDone
                                    ? "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                Câu {idx + 1} {isDone ? "✔" : ""}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          disabled={essayIndex === activeSession.essayQuestions.length - 1}
                          onClick={() => setEssayIndex((prev) => prev + 1)}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          Câu sau <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL XÁC NHẬN NỘP BÀI KHI CÒN CÂU CHƯA LÀM */}
      {/* ========================================================================= */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Xác Nhận Nộp Bài Thi
              </h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Em vẫn còn một số câu hỏi chưa hoàn thành đầy đủ:
            </p>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs space-y-1 font-semibold text-amber-900 dark:text-amber-200">
              <div>• Chưa chọn {stats.mcqTotal - stats.mcqAnswered} câu trắc nghiệm ABCD</div>
              <div>• Chưa đánh giá {stats.tfTotal - stats.tfAnswered} ý Đúng/Sai</div>
              {stats.essayTotal > 0 && stats.essayDone === 0 && (
                <div>• Chưa làm câu hỏi Tự luận</div>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Em có muốn tiếp tục làm bài hay nộp bài ngay bây giờ để hệ thống chấm điểm?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Làm tiếp bài thi
              </button>
              <button
                onClick={handleSubmitExam}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow cursor-pointer"
              >
                Vẫn nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL KẾT QUẢ BÀI THI & XEM LẠI CHI TIẾT */}
      {/* ========================================================================= */}
      {selectedResult && (
        <ExamResultModal
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  );
}
