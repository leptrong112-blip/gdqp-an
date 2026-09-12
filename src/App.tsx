import { useState, useEffect, lazy, Suspense } from "react";
import {
  Shield,
  BookOpen,
  Trophy,
  Crosshair,
  Bot,
  Star,
  MapPin,
  Zap,
  Menu,
  X,
  FileText,
  Sun,
  Moon,
  Home,
  ChevronDown,
  Sparkles,
  Rocket,
  Compass,
  Camera,
  Target,
  ClipboardCheck,
  Wrench,
  Award,
  BarChart3,
} from "lucide-react";
import TheorySection from "./components/TheorySection";
import SurveySection from "./components/SurveySection";
import SurveyAdminSection from "./components/SurveyAdminSection";
import AccountGate, { AccountMenu, useAccount } from "./components/AccountGate";
import QuizSection from "./components/QuizSection";
import SimulationSection from "./components/SimulationSection";
import AiBotSection from "./components/AiBotSection";
import FloatingAiChatbot from "./components/FloatingAiChatbot";
import HomePortalSection from "./components/HomePortalSection";
import Footer from "./components/Footer";
import { GradeLevel } from "./types";
import TrainingSection from "./components/TrainingSection";
import { BADGES } from "./gamification";
import { BadgeToast } from "./components/GamificationSection";
import { useGamification } from "./context/GamificationContext";
import { Component, ErrorInfo, ReactNode } from "react";

const MapSection = lazy(() => import("./components/MapSection"));
const PoseAnalysisPage = lazy(() => import("./features/pose-analysis/PoseAnalysisPage"));
const GamificationSection = lazy(() => import("./components/GamificationSection"));
const MockExamSection = lazy(() => import("./components/exam/MockExamSection"));
const WebARSection = lazy(() => import("./components/WebARSection"));
const ShootingRangeSection = lazy(() => import("./components/ShootingRangeSection"));
const ExamAdminSection = lazy(() => import("./components/exam/ExamAdminSection"));

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-600 bg-red-50 rounded-xl border border-red-200 m-8">
          <h2 className="text-xl font-bold mb-4">Đã xảy ra lỗi hệ thống!</h2>
          <pre className="text-sm bg-white p-4 rounded overflow-auto">{this.state.error?.toString()}</pre>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return <AccountGate><AuthenticatedApp /></AccountGate>;
}

function AuthenticatedApp() {
  const { user, loading: accountLoading, openLogin } = useAccount();
  const { state: gamState, rank: currentRank, xpToasts, unlockedBadgeToasts, removeBadgeToast } = useGamification();
  const [activeTab, setActiveTab] = useState<
    "home" | "theory" | "quiz" | "exam" | "sim" | "chat" | "training" | "map" | "gamification" | "webar" | "shooting" | "survey" | "admin" | "exam_admin" | "pose"
  >(window.location.pathname === '/survey' ? 'survey' : 'home');
  const [globalGrade, setGlobalGrade] = useState<GradeLevel>(11);
  const [liveStats, setLiveStats] = useState({ completedCount: 0, topScore: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global Site Theme ("light" | "dark")
  const [siteTheme, setSiteTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("gqd_site_theme") as "light" | "dark") || "light";
  });

  const toggleSiteTheme = () => {
    setSiteTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("gqd_site_theme", next);
      return next;
    });
  };

  useEffect(() => {
    if (siteTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [siteTheme]);

  // Preload mô hình 3D ngầm trong thời gian rảnh để mở tức thì khi người dùng bấm vào tab 3D
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = "/models/ak47.glb";
    link.as = "fetch";
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
    return () => {
      try {
        document.head.removeChild(link);
      } catch (_) {}
    };
  }, []);

  const updateStats = () => {
    try {
      const completed = localStorage.getItem("gqd_completed_lessons");
      const list = completed ? JSON.parse(completed) : [];

      const scores = localStorage.getItem("gqd_highscores");
      const scoreObj = scores ? JSON.parse(scores) : { 10: 0, 11: 0, 12: 0 };
      const maxScore = Math.max(scoreObj[10] || 0, scoreObj[11] || 0, scoreObj[12] || 0);

      setLiveStats({
        completedCount: list.length,
        topScore: maxScore,
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    updateStats();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [activeTab]);

  const isDark = siteTheme === "dark";
  const openSurveyArea = () => setActiveTab(user?.role === 'admin' ? 'admin' : 'survey');

  return (
    <div className={`${activeTab === "sim" ? "h-dvh overflow-hidden" : "min-h-screen"} flex flex-col font-sans transition-colors duration-200 ${isDark ? "bg-[#0b0f19] text-slate-100" : "bg-slate-100 text-slate-900"}`}>
      {/* XP Toast Float */}
      <div className="fixed top-16 right-6 z-50 space-y-2 pointer-events-none">
        {xpToasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-bounce bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 font-extrabold px-4 py-2 rounded-2xl shadow-xl border border-amber-300 flex items-center gap-2 text-xs"
          >
            <Zap className="w-4 h-4 fill-current text-slate-900" />
            <span>+{toast.amount} XP</span>
            {toast.label && <span className="opacity-80 font-normal">({toast.label})</span>}
          </div>
        ))}
      </div>

      {/* Badge Unlocked Toast Overlay */}
      {unlockedBadgeToasts.map((badge) => (
        <BadgeToast key={badge.id} badge={badge} onClose={() => removeBadgeToast(badge.id)} />
      ))}

      {/* ═══════════════════ TOP HEADER WITH DROPDOWN MENUS ═══════════════════ */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b px-3 sm:px-6 lg:px-10 py-2 sm:py-3 flex items-center justify-between shadow-xs shrink-0 transition-colors ${
        isDark ? "bg-[#111827]/95 border-slate-800 text-white" : "bg-white/95 border-slate-200/80 text-slate-900"
      }`}>
        
        {/* Left Logo + Mobile Menu Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 border rounded-xl shadow-xs cursor-pointer transition-colors ${
              isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
            aria-label="Mở danh mục điều hướng"
          >
            <Menu className="w-4 h-4" />
          </button>

          <button onClick={() => setActiveTab("home")} className="flex items-center gap-2 sm:gap-2.5 cursor-pointer text-left">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-amber-300 font-black text-base sm:text-lg flex items-center justify-center shadow-md border border-amber-400/40 shrink-0">
              ★
            </div>
            <div>
              <h1 className={`font-black text-sm sm:text-base leading-tight tracking-tight flex items-center gap-1 sm:gap-1.5 ${isDark ? "text-white" : "text-slate-900"}`}>
                <span>HỌC QPAN</span> <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-bold font-mono">3D</span>
              </h1>
              <p className="hidden sm:block text-[10px] text-slate-400 font-medium leading-none">Nền Tảng Trải Nghiệm Số</p>
            </div>
          </button>
        </div>

        {/* Center: Dropdown Navigation Links (Desktop) */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-1.5 font-bold text-xs">
          {/* 1. Trang chủ */}
          <button
            onClick={() => setActiveTab("home")}
            className={`px-2.5 xl:px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "home"
                ? "bg-red-600 text-white shadow-xs"
                : isDark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Trang chủ
          </button>

          {/* 2. Khóa học ▾ Dropdown */}
          <div className="relative group">
            <button className={`px-2.5 xl:px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === "theory"
                ? "bg-red-600 text-white shadow-xs"
                : isDark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
            }`}>
              <span>Khóa học</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition-transform" />
            </button>

            <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
              <button
                onClick={() => { setGlobalGrade(10); setActiveTab("theory"); }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black flex items-center justify-center">10</span>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Lý thuyết Lớp 10</div>
                  <div className="text-[10px] text-slate-400">Lịch sử & Truyền thống QĐND</div>
                </div>
              </button>

              <button
                onClick={() => { setGlobalGrade(11); setActiveTab("theory"); }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center justify-center">11</span>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Lý thuyết Lớp 11</div>
                  <div className="text-[10px] text-slate-400">Luật NVQS & Tháo lắp súng AK</div>
                </div>
              </button>

              <button
                onClick={() => { setGlobalGrade(12); setActiveTab("theory"); }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-black flex items-center justify-center">12</span>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Lý thuyết Lớp 12</div>
                  <div className="text-[10px] text-slate-400">Tổ chức QĐND/CAND & Bản đồ</div>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Phòng trải nghiệm 3D ▾ Dropdown */}
          <div className="relative group">
            <button className={`px-2.5 xl:px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === "sim" || activeTab === "training" || activeTab === "webar" || activeTab === "shooting" || activeTab === "pose"
                ? "bg-red-600 text-white shadow-xs"
                : isDark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
            }`}>
              <span>Phòng trải nghiệm 3D</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition-transform" />
            </button>

            <div className="absolute top-full left-0 mt-1 w-68 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
              <button onClick={() => setActiveTab("pose")} className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"><Camera className="w-4 h-4 text-emerald-500 shrink-0" /><div><div className="font-bold text-xs">Chấm điểm động tác bằng camera</div><div className="text-[10px] text-slate-400">Đứng nghiêm · AI Pose Analysis</div></div></button>
              <button
                onClick={() => setActiveTab("shooting")}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <Target className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Trường Bắn &amp; Hệ Thống Bia AK</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-mono font-bold">Mới</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Bia 4, 6, 8, Bia đồng tiền 10m &amp; Bắn tập</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("webar")}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-rose-500 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>WebAR Thực Tế Tăng Cường</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-red-600 text-white font-mono font-bold">Mới</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Chiếu súng AK &amp; chiến sĩ lên bàn/sàn</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("sim")}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <Crosshair className="w-4 h-4 text-red-500 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Mô Phỏng Tháo/Lắp súng AK-47</div>
                  <div className="text-[10px] text-slate-400">Workspace 3D tương tác real-time</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("training")}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Thao Trường &amp; Điều Lệnh 3D</div>
                  <div className="text-[10px] text-slate-400">Quan sát động tác 3D đa góc độ</div>
                </div>
              </button>
            </div>
          </div>

          {/* 4. Di Tích 360° VR (Thẻ riêng độc lập trên Navbar) */}
          <button
            onClick={() => setActiveTab("map")}
            className={`px-2.5 xl:px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer font-bold text-xs ${
              activeTab === "map"
                ? "bg-red-600 text-white shadow-xs"
                : isDark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Di Tích 360° VR</span>
          </button>

          {/* 5. Trợ giảng AI */}
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-2.5 xl:px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer font-bold text-xs ${
              activeTab === "chat"
                ? "bg-red-600 text-white shadow-xs"
                : isDark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-amber-500" />
            <span>Trợ giảng AI</span>
          </button>

          {/* 6. Ôn luyện & Thi thử ▾ Dropdown (ĐỂ CUỐI CÙNG THEO YÊU CẦU CỦA BẠN) */}
          <div className="relative group">
            <button className={`px-2.5 xl:px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === "quiz" || activeTab === "exam"
                ? "bg-red-600 text-white shadow-xs"
                : isDark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
            }`}>
              <span>Ôn luyện &amp; Thi thử</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition-transform" />
            </button>

            <div className="absolute top-full right-0 mt-1 w-60 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
              <button
                onClick={() => setActiveTab("quiz")}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Phòng Trắc Nghiệm SGK</div>
                  <div className="text-[10px] text-slate-400">Ôn tập câu hỏi cốt lõi</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("exam")}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-red-500 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Thi Thử Trắc Nghiệm THPT</div>
                  <div className="text-[10px] text-slate-400">Đề thi 15-30 phút kiểm soát thời gian</div>
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
          
          {/* Nút Khảo sát nổi bật */}
          <button
            onClick={openSurveyArea}
            className={`hidden sm:flex relative px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-bold transition-all items-center gap-1.5 cursor-pointer shadow-xs ${
              activeTab === "survey"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/25 shadow-md"
                : isDark
                  ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-400/60"
                  : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 hover:border-amber-400"
            }`}
            title="Đóng góp ý kiến & Khảo sát trải nghiệm website"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <ClipboardCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300 shrink-0" />
            <span className="hidden sm:inline">Khảo sát</span>
          </button>

          {/* ☀️ / 🌙 Global Theme Switcher Button */}
          <button
            onClick={toggleSiteTheme}
            className={`p-2 xl:px-2.5 xl:py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isDark
                ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
            title={isDark ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
            aria-label="Đổi giao diện sáng/tối"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            <span className="hidden 2xl:inline">{isDark ? "Giao diện Sáng" : "Giao diện Tối"}</span>
          </button>

          {/* Cấp bậc & XP (Ẩn trên mobile để đưa vào Menu Drawer) */}
          <button
            onClick={() => setActiveTab("gamification")}
            className="hidden md:flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-2.5 xl:px-3 py-1.5 rounded-xl items-center gap-2 shrink-0 shadow-md border border-slate-700/50 cursor-pointer hover:shadow-lg transition-all group"
            title="Xem hồ sơ thi đua & bảng xếp hạng"
          >
            <div className="text-base group-hover:scale-110 transition-transform">{currentRank.emoji.split(" ")[0]}</div>
            <div className="text-left hidden sm:block">
              <div className="text-[9px] font-medium text-slate-400 leading-none">Tổng XP</div>
              <div className="text-xs font-black text-amber-400 font-mono">{gamState.xp.toLocaleString()}</div>
            </div>
          </button>
          <AccountMenu onNavigate={setActiveTab} />
        </div>
      </header>

      {/* MOBILE OVERLAY NAVIGATION DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm lg:hidden flex justify-end">
          <div className="w-[85%] max-w-sm bg-white dark:bg-[#111827] h-full p-4 sm:p-5 space-y-4 overflow-y-auto border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 text-amber-300 font-black text-sm flex items-center justify-center shadow-xs">
                    ★
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm text-slate-900 dark:text-white leading-none">HỌC QPAN 3D</h2>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Danh mục trải nghiệm</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Đóng menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Card Học Sinh & XP */}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border border-slate-700/60 shadow-md">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{currentRank.emoji.split(" ")[0]}</span>
                  <div>
                    <div className="text-xs font-black text-white">{currentRank.name}</div>
                    <div className="text-[10px] text-amber-400 font-mono font-bold">
                      {gamState.xp.toLocaleString()} XP · {gamState.badges.length} huy hiệu
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setActiveTab("gamification"); setIsMobileMenuOpen(false); }}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 cursor-pointer"
                >
                  Hồ sơ
                </button>
              </div>

              {/* Quick Actions: Khảo sát & Trang chủ */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setActiveTab("home"); setIsMobileMenuOpen(false); }}
                  className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border cursor-pointer ${
                    activeTab === "home"
                      ? "bg-red-600 text-white border-red-600 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Home className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="truncate">Trang Chủ</span>
                </button>

                <button
                  onClick={() => { openSurveyArea(); setIsMobileMenuOpen(false); }}
                  className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border cursor-pointer ${
                    activeTab === "survey"
                      ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs font-black"
                      : "bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                  }`}
                >
                  <ClipboardCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="truncate">Khảo Sát</span>
                </button>
              </div>

              {/* Nhóm 1: Khóa học SGK (Grid 3 Cột) */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  <span>Khóa học lý thuyết SGK</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { grade: 10, label: "Lớp 10", color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900" },
                    { grade: 11, label: "Lớp 11", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900" },
                    { grade: 12, label: "Lớp 12", color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900" },
                  ].map((g) => (
                    <button
                      key={g.grade}
                      onClick={() => { setGlobalGrade(g.grade as any); setActiveTab("theory"); setIsMobileMenuOpen(false); }}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        activeTab === "theory" && globalGrade === g.grade
                          ? "bg-red-600 text-white border-red-600 shadow-sm"
                          : g.color
                      }`}
                    >
                      <div className="text-xs font-black">{g.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nhóm 2: Mô phỏng 3D & Thao Trường */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 pt-1 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-red-500" />
                  <span>Thao trường &amp; Trải nghiệm 3D</span>
                </div>

                <button
                  onClick={() => { setActiveTab("pose"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                    activeTab === "pose"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Chấm điểm động tác AI</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-mono font-bold">Mới</span>
                </button>

                <button
                  onClick={() => { setActiveTab("shooting"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                    activeTab === "shooting"
                      ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs font-black"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Trường bắn ảo &amp; Hệ bia AK</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold">Bắn tập</span>
                </button>

                <button
                  onClick={() => { setActiveTab("webar"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                    activeTab === "webar"
                      ? "bg-red-600 text-white border-red-600 shadow-xs"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>WebAR Chiếu bàn &amp; sàn</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 font-mono font-bold">AR</span>
                </button>

                <button
                  onClick={() => { setActiveTab("sim"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === "sim"
                      ? "bg-red-600 text-white shadow-xs font-bold"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <Wrench className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Tháo/Lắp súng AK-47 3D</span>
                </button>

                <button
                  onClick={() => { setActiveTab("training"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === "training"
                      ? "bg-red-600 text-white shadow-xs font-bold"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Thao trường &amp; Điều lệnh 3D</span>
                </button>
              </div>

              {/* Nhóm 3: Ôn Thi & Tiện Ích */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 pt-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-purple-500" />
                  <span>Ôn thi &amp; Trợ giảng AI</span>
                </div>

                <button
                  onClick={() => { setActiveTab("map"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                    activeTab === "map"
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Di Tích 360° VR TP.HCM</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-600 text-white font-mono font-bold">VR</span>
                </button>

                <button
                  onClick={() => { setActiveTab("exam"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === "exam"
                      ? "bg-red-600 text-white shadow-xs font-bold"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <FileText className="w-4 h-4 text-red-500 shrink-0" />
                  <span>Thi thử trắc nghiệm THPT</span>
                </button>

                <button
                  onClick={() => { setActiveTab("chat"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === "chat"
                      ? "bg-red-600 text-white shadow-xs font-bold"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <Bot className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Trợ giảng AI Trung tá Quyết</span>
                </button>
              </div>
            </div>

            {/* Footer Drawer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
              <button
                onClick={toggleSiteTheme}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                <span>{isDark ? "Giao diện sáng" : "Giao diện tối"}</span>
              </button>
              <span className="text-[10px] text-slate-400 font-mono font-bold">GDQP-AN 3D</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ MAIN CONTENT VIEWPORT (100% FULL BLEED WIDTH) ═══════════════════ */}
      <div className={`flex-1 min-h-0 flex flex-col min-w-0 ${activeTab === "sim" || activeTab === "theory" ? "overflow-hidden h-full" : "h-full"} relative`}>
        <main id="tab-viewport" className={`flex-1 min-h-0 relative z-10 w-full ${activeTab === "sim" ? "h-full p-0 max-w-none flex flex-col overflow-hidden" : activeTab === "theory" ? "h-full p-2 sm:p-3 lg:p-4 w-full max-w-none flex flex-col min-h-0 overflow-hidden" : "p-3 sm:p-6 lg:p-10 w-full max-w-none"}`}>
          <ErrorBoundary>
            {activeTab === "pose" && <Suspense fallback={<div role="status" className="p-12 text-center">Đang tải trang phân tích tư thế…</div>}><PoseAnalysisPage /></Suspense>}
            {activeTab === "survey" && <SurveySection />}
            {activeTab === "admin" && user?.role === 'admin' && <SurveyAdminSection onBack={() => setActiveTab("home")} />}
            {activeTab === "admin" && user?.role !== 'admin' && (
              <section className="max-w-lg mx-auto rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900 dark:bg-amber-950/30">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Khu vực dành riêng cho Admin</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Biểu đồ phân tích lựa chọn của học sinh và giáo viên chỉ hiển thị trong tài khoản quản trị viên.</p>
                <button onClick={openLogin} className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700">Đăng nhập Admin</button>
              </section>
            )}
            {activeTab === "home" && <HomePortalSection onNavigate={setActiveTab} />}
            {activeTab === "theory" && <TheorySection grade={globalGrade} onGradeChange={setGlobalGrade} />}
            {activeTab === "training" && <TrainingSection />}
            {activeTab === "quiz" && <QuizSection initialGrade={globalGrade} />}
            {activeTab === "exam" && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-64 gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-slate-500 font-mono">Đang tải phòng thi...</span>
                  </div>
                }
              >
                <MockExamSection />
              </Suspense>
            )}
            {activeTab === "exam_admin" && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-64 gap-3">
                    <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-slate-500 font-mono">Đang tải bảng điểm học sinh...</span>
                  </div>
                }
              >
                <ExamAdminSection onBack={() => setActiveTab("exam")} />
              </Suspense>
            )}
            {activeTab === "webar" && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-64 gap-3">
                    <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-slate-500 font-mono">Đang khởi tạo không gian WebAR...</span>
                  </div>
                }
              >
                <WebARSection />
              </Suspense>
            )}
            {activeTab === "shooting" && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-64 gap-3">
                    <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-slate-500 font-mono">Đang tải thao trường bắn súng...</span>
                  </div>
                }
              >
                <ShootingRangeSection />
              </Suspense>
            )}
            {activeTab === "sim" && <SimulationSection siteTheme={siteTheme} />}
            {activeTab === "chat" && <AiBotSection />}
            {activeTab === "map" && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-64 gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-slate-500 font-mono">Đang khởi tạo không gian thực tế ảo 360° VR...</span>
                  </div>
                }
              >
                <MapSection />
              </Suspense>
            )}
            {activeTab === "gamification" && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-64 gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-slate-500 font-mono">Đang tải bảng danh vọng...</span>
                  </div>
                }
              >
                <GamificationSection />
              </Suspense>
            )}
          </ErrorBoundary>
        </main>
        {activeTab !== "sim" && activeTab !== "pose" && <Footer onNavigate={setActiveTab} />}
        {activeTab !== "sim" && activeTab !== "pose" && <div className="flex justify-center gap-6 pb-6 text-sm text-slate-500"><button onClick={openSurveyArea}>{user?.role === 'admin' ? 'Báo cáo khảo sát' : 'Khảo sát trải nghiệm'}</button></div>}
      </div>

      {/* Cục Chatbot AI cố định ở góc dưới bên phải */}
      {activeTab !== "pose" && <FloatingAiChatbot />}
    </div>
  );
}
