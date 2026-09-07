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
} from "lucide-react";
import TheorySection from "./components/TheorySection";
import QuizSection from "./components/QuizSection";
import SimulationSection from "./components/SimulationSection";
import AiBotSection from "./components/AiBotSection";
import HomePortalSection from "./components/HomePortalSection";
import { GradeLevel } from "./types";
import TrainingSection from "./components/TrainingSection";
import { BADGES } from "./gamification";
import { BadgeToast } from "./components/GamificationSection";
import { useGamification } from "./context/GamificationContext";
import { Component, ErrorInfo, ReactNode } from "react";

const MapSection = lazy(() => import("./components/MapSection"));
const GamificationSection = lazy(() => import("./components/GamificationSection"));
const MockExamSection = lazy(() => import("./components/exam/MockExamSection"));
const WebARSection = lazy(() => import("./components/WebARSection"));
const ShootingRangeSection = lazy(() => import("./components/ShootingRangeSection"));

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
  const { state: gamState, rank: currentRank, xpToasts, unlockedBadgeToasts, removeBadgeToast } = useGamification();
  const [activeTab, setActiveTab] = useState<
    "home" | "theory" | "quiz" | "exam" | "sim" | "chat" | "training" | "map" | "gamification" | "webar" | "shooting"
  >("home");
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
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between shadow-xs shrink-0 transition-colors ${
        isDark ? "bg-[#111827]/95 border-slate-800 text-white" : "bg-white/95 border-slate-200/80 text-slate-900"
      }`}>
        
        {/* Left Logo + Mobile Menu Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 border rounded-xl shadow-xs cursor-pointer transition-colors ${
              isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Menu className="w-4 h-4" />
          </button>

          <button onClick={() => setActiveTab("home")} className="flex items-center gap-2.5 cursor-pointer text-left">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-amber-300 font-black text-lg flex items-center justify-center shadow-md border border-amber-400/40">
              ★
            </div>
            <div>
              <h1 className={`font-black text-base leading-tight tracking-tight flex items-center gap-1.5 ${isDark ? "text-white" : "text-slate-900"}`}>
                HỌC QPAN <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-bold font-mono">3D</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium leading-none">Nền Tảng Trải Nghiệm Số</p>
            </div>
          </button>
        </div>

        {/* Center: Dropdown Navigation Links (Desktop) */}
        <div className="hidden lg:flex items-center gap-1.5 font-bold text-xs">
          
          {/* Trang chủ */}
          <button
            onClick={() => setActiveTab("home")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === "home"
                ? "bg-red-600 text-white shadow-xs"
                : isDark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Trang chủ
          </button>

          {/* Khóa học ▾ Dropdown */}
          <div className="relative group">
            <button className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
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

          {/* Ôn luyện & Thi thử ▾ Dropdown */}
          <div className="relative group">
            <button className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "quiz" || activeTab === "exam"
                ? "bg-red-600 text-white shadow-xs"
                : isDark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
            }`}>
              <span>Ôn luyện &amp; Thi thử</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition-transform" />
            </button>

            <div className="absolute top-full left-0 mt-1 w-60 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
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

          {/* Phòng trải nghiệm 3D ▾ Dropdown */}
          <div className="relative group">
            <button className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "sim" || activeTab === "training" || activeTab === "webar" || activeTab === "shooting"
                ? "bg-red-600 text-white shadow-xs"
                : isDark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
            }`}>
              <span>Phòng trải nghiệm 3D</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition-transform" />
            </button>

            <div className="absolute top-full left-0 mt-1 w-68 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
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

          {/* Giáo viên AI & Bản đồ ▾ Dropdown */}
          <div className="relative group">
            <button className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "chat" || activeTab === "map"
                ? "bg-red-600 text-white shadow-xs"
                : isDark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
            }`}>
              <span>Giáo viên AI</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition-transform" />
            </button>

            <div className="absolute top-full right-0 mt-1 w-60 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
              <button
                onClick={() => setActiveTab("chat")}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Trung tá Nguyễn Văn Quyết AI</div>
                  <div className="text-[10px] text-slate-400">Trợ lý học tập hỏi đáp trực tuyến</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("map")}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Bản Đồ Di Tích TP.HCM</div>
                  <div className="text-[10px] text-slate-400">Tra cứu di tích lịch sử QPAN</div>
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* ☀️ / 🌙 Global Theme Switcher Button */}
          <button
            onClick={toggleSiteTheme}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isDark
                ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
            title={isDark ? "Chuyển sang Giao diện Sáng toàn website" : "Chuyển sang Giao diện Tối toàn website"}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            <span className="hidden sm:inline">{isDark ? "Giao diện Sáng" : "Giao diện Tối"}</span>
          </button>

          <button
            onClick={() => setActiveTab("gamification")}
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shrink-0 shadow-md border border-slate-700/50 cursor-pointer hover:shadow-lg transition-all group"
          >
            <div className="text-base group-hover:scale-110 transition-transform">{currentRank.emoji.split(" ")[0]}</div>
            <div className="text-left hidden sm:block">
              <div className="text-[9px] font-medium text-slate-400 leading-none">Tổng XP</div>
              <div className="text-xs font-black text-amber-400 font-mono">{gamState.xp.toLocaleString()}</div>
            </div>
          </button>
        </div>
      </header>

      {/* MOBILE OVERLAY NAVIGATION DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm lg:hidden flex justify-end">
          <div className="w-4/5 max-w-sm bg-white dark:bg-[#111827] h-full p-5 space-y-4 overflow-y-auto border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">Danh Mục Điều Hướng</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => { setActiveTab("home"); setIsMobileMenuOpen(false); }}
                className="w-full text-left p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-2"
              >
                <Home className="w-4 h-4" /> Trang Chủ Portal
              </button>

              <div className="pt-2 font-bold text-[11px] text-slate-400 uppercase tracking-widest px-1">Khóa học</div>
              <button
                onClick={() => { setGlobalGrade(10); setActiveTab("theory"); setIsMobileMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                📘 Lý thuyết Lớp 10
              </button>
              <button
                onClick={() => { setGlobalGrade(11); setActiveTab("theory"); setIsMobileMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                📗 Lý thuyết Lớp 11
              </button>
              <button
                onClick={() => { setGlobalGrade(12); setActiveTab("theory"); setIsMobileMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                📙 Lý thuyết Lớp 12
              </button>

              <div className="pt-2 font-bold text-[11px] text-slate-400 uppercase tracking-widest px-1">Mô Phỏng 3D &amp; Trường Bắn</div>
              <button
                onClick={() => { setActiveTab("shooting"); setIsMobileMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between"
              >
                <span>🎯 Trường Bắn Ảo &amp; Hệ Thống Bia AK</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded font-bold font-mono">Mới</span>
              </button>
              <button
                onClick={() => { setActiveTab("webar"); setIsMobileMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between"
              >
                <span>📱 WebAR Chiếu Bàn &amp; Sàn Nhà</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-red-600 text-white rounded font-bold font-mono">Mới</span>
              </button>
              <button
                onClick={() => { setActiveTab("sim"); setIsMobileMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                🔧 Tháo/Lắp súng AK-47 3D
              </button>
              <button
                onClick={() => { setActiveTab("training"); setIsMobileMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                🛡️ Thao Trường &amp; Điều Lệnh 3D
              </button>

              <div className="pt-2 font-bold text-[11px] text-slate-400 uppercase tracking-widest px-1">Ôn thi &amp; AI</div>
              <button
                onClick={() => { setActiveTab("exam"); setIsMobileMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                ⏱️ Thi Thử Trắc Nghiệm THPT
              </button>
              <button
                onClick={() => { setActiveTab("chat"); setIsMobileMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                🤖 Giảng Viên AI Trung tá Quyết
              </button>
              <button
                onClick={() => { setActiveTab("map"); setIsMobileMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                🗺️ Bản Đồ Di Tích TP.HCM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ MAIN CONTENT VIEWPORT (100% FULL BLEED WIDTH) ═══════════════════ */}
      <div className={`flex-1 min-h-0 flex flex-col min-w-0 ${activeTab === "sim" ? "overflow-hidden" : "h-full"} relative`}>
        <main id="tab-viewport" className={`flex-1 min-h-0 relative z-10 w-full ${activeTab === "sim" ? "h-full p-0 max-w-none flex flex-col overflow-hidden" : "p-4 sm:p-6 lg:p-10 w-full max-w-none"}`}>
          <ErrorBoundary>
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
                    <span className="text-sm text-slate-500 font-mono">Đang tải bản đồ 3D...</span>
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
      </div>
    </div>
  );
}