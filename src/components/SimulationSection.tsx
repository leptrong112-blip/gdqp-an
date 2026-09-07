import { useState, useEffect, useRef } from "react";
import {
  Wrench,
  ChevronRight,
  ChevronLeft,
  Shield,
  Layers,
  CheckCircle2,
  FileText,
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  BookOpen,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Sparkles,
  Search,
  Crosshair,
  AlertTriangle,
} from "lucide-react";
import AK47Simulation from "./AK47Simulation";
import {
  AKPartDetail,
  AK_MAIN_GROUPS,
  AK_STRUCTURE_PARTS,
  AK_STEPS_THAO,
  AK_STEPS_LAP,
  AK_SAFETY_RULES,
} from "../data/ak47StructureData";

interface SimulationSectionProps {
  siteTheme?: "light" | "dark";
}

export default function SimulationSection({ siteTheme = "light" }: SimulationSectionProps) {
  // ── Main Section Mode: "structure" (Cấu tạo 11 bộ phận) | "procedure" (Quy trình tháo lắp)
  const [section, setSection] = useState<"structure" | "procedure">("structure");

  // ── Cấu tạo súng states
  const [selectedPart, setSelectedPart] = useState<AKPartDetail>(AK_STRUCTURE_PARTS[0]);
  const [searchTerm, setSearchTerm] = useState("");

  // ── Quy trình tháo lắp states
  const [procedureMode, setProcedureMode] = useState<"thao" | "lap">("thao");
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlayingAuto, setIsPlayingAuto] = useState(false);

  // ── Camera reset trigger
  const [cameraResetKey, setCameraResetKey] = useState(0);

  // ── Responsive Mobile Navigation Tab
  // "viewport" | "leftPanel" | "rightPanel"
  const [mobileTab, setMobileTab] = useState<"viewport" | "leftPanel" | "rightPanel">("viewport");

  // ── Desktop Sidebars Collapse
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  const isLight = siteTheme === "light";
  const steps = procedureMode === "thao" ? AK_STEPS_THAO : AK_STEPS_LAP;
  const totalSteps = steps.length;
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);

  // ── Auto-play effect cho quy trình tháo lắp ──────────────────────────────
  const autoPlayTimerRef = useRef<any>(null);
  useEffect(() => {
    if (isPlayingAuto && section === "procedure") {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlayingAuto(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3200);
    } else {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPlayingAuto, section, totalSteps]);

  // Đổi mục chính (Cấu tạo súng <-> Quy trình tháo lắp)
  const handleSectionChange = (newSec: "structure" | "procedure") => {
    setSection(newSec);
    setIsPlayingAuto(false);
    setCameraResetKey((k) => k + 1);
  };

  // Đổi chế độ tháo / lắp
  const handleProcedureModeChange = (m: "thao" | "lap") => {
    setProcedureMode(m);
    setCurrentStep(0);
    setIsPlayingAuto(false);
  };

  // Nhấp chọn bước từ danh sách hoặc click trên mô hình 3D
  const handleStepJump = (idx: number) => {
    if (idx >= 0 && idx < totalSteps) {
      setCurrentStep(idx);
    }
  };

  // Lọc danh sách bộ phận cấu tạo theo từ khóa tìm kiếm
  const filteredParts = AK_STRUCTURE_PARTS.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.groupName.toLowerCase().includes(term) ||
      p.purpose.toLowerCase().includes(term)
    );
  });

  const isMaximized = isLeftCollapsed && isRightCollapsed;
  const toggleMaximize = () => {
    if (isMaximized) {
      setIsLeftCollapsed(false);
      setIsRightCollapsed(false);
    } else {
      setIsLeftCollapsed(true);
      setIsRightCollapsed(true);
    }
  };

  return (
    <div
      className={`w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden select-none transition-colors duration-200 ${
        isLight ? "bg-slate-100 text-slate-800" : "bg-[#0b0f19] text-slate-100"
      }`}
    >
      {/* ═══════════════════ WORKSPACE SUB-HEADER ═══════════════════ */}
      <header
        className={`flex items-center justify-between px-3 sm:px-4 py-2 shrink-0 z-20 border-b transition-colors duration-200 ${
          isLight ? "bg-white border-slate-200 text-slate-900" : "bg-[#111827] border-slate-800 text-white"
        }`}
      >
        {/* Left: Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
              isLight
                ? "bg-red-50 border border-red-200 text-red-600"
                : "bg-red-500/15 border border-red-500/30 text-red-400"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className={`text-xs font-bold leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>
              Mô Phỏng 3D AK-47
            </h2>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-normal border hidden md:inline ${
                isLight
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              Chuẩn GDQP-AN
            </span>
          </div>
        </div>

        {/* Center: 2 Main Section Tabs (Đề xuất của thầy giáo: Chia làm 2 mục Cấu tạo & Tháo lắp) */}
        <div
          className={`flex items-center gap-1 p-1 rounded-xl border shadow-xs ${
            isLight ? "bg-slate-100 border-slate-200" : "bg-slate-900/90 border-slate-800"
          }`}
        >
          <button
            onClick={() => handleSectionChange("structure")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              section === "structure"
                ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                : isLight
                ? "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>1. Cấu tạo súng (11 bộ phận)</span>
          </button>

          <button
            onClick={() => handleSectionChange("procedure")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              section === "procedure"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : isLight
                ? "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>2. Tháo lắp súng</span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sub-mode switch for procedure */}
          {section === "procedure" && (
            <div
              className={`hidden sm:flex items-center gap-1 p-0.5 rounded-lg border ${
                isLight ? "bg-slate-100 border-slate-200" : "bg-white/5 border-white/10"
              }`}
            >
              <button
                onClick={() => handleProcedureModeChange("thao")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  procedureMode === "thao"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : isLight
                    ? "text-slate-600 hover:text-slate-900"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🔧 Tháo súng
              </button>
              <button
                onClick={() => handleProcedureModeChange("lap")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  procedureMode === "lap"
                    ? "bg-amber-500 text-white shadow-sm"
                    : isLight
                    ? "text-slate-600 hover:text-slate-900"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🔩 Lắp súng
              </button>
            </div>
          )}

          {/* Reset Camera button */}
          <button
            onClick={() => setCameraResetKey((k) => k + 1)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
              isLight
                ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            }`}
            title="Đặt lại góc nhìn camera 360°"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span className="hidden md:inline">Đặt lại góc nhìn</span>
          </button>

          {/* Desktop Fullscreen Toggle */}
          <button
            onClick={toggleMaximize}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer ${
              isMaximized
                ? "bg-red-600 border-red-500 text-white shadow-xs"
                : isLight
                ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            }`}
            title={isMaximized ? "Hiện lại các bảng công cụ" : "Toàn màn hình 3D (Thu gọn 2 cột)"}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isMaximized ? "Hiện bảng công cụ" : "Toàn màn hình 3D"}</span>
          </button>

          {/* Mobile view selector pills */}
          <div className="flex lg:hidden items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/10">
            <button
              onClick={() => setMobileTab("leftPanel")}
              className={`p-1.5 rounded text-[11px] flex items-center gap-1 ${
                mobileTab === "leftPanel" ? "bg-red-600 text-white" : "text-slate-400"
              }`}
              title="Danh mục"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMobileTab("viewport")}
              className={`p-1.5 rounded text-[11px] flex items-center gap-1 ${
                mobileTab === "viewport" ? "bg-red-600 text-white" : "text-slate-400"
              }`}
              title="Khung 3D"
            >
              <Wrench className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMobileTab("rightPanel")}
              className={`p-1.5 rounded text-[11px] flex items-center gap-1 ${
                mobileTab === "rightPanel" ? "bg-red-600 text-white" : "text-slate-400"
              }`}
              title="Chi tiết"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════ MAIN 3-COLUMN WORKSPACE ═══════════════════ */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* ── CỘT TRÁI (LEFT PANEL) ─────────────────────────────────── */}
        <aside
          className={`w-[260px] shrink-0 flex-col overflow-hidden transition-all duration-200 border-r ${
            mobileTab === "leftPanel"
              ? "flex absolute inset-0 z-40 w-full bg-[#111827]"
              : isLeftCollapsed
              ? "hidden"
              : "hidden lg:flex"
          } ${
            isLight ? "bg-white border-slate-200 text-slate-800" : "bg-[#111827] border-slate-800 text-slate-100"
          }`}
        >
          {/* Header cột trái */}
          <div
            className={`flex items-center justify-between px-3.5 py-2.5 shrink-0 border-b ${
              isLight ? "border-slate-100" : "border-slate-800"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Layers className={`w-3.5 h-3.5 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
              <span
                className={`text-[10px] font-bold uppercase tracking-widest ${
                  isLight ? "text-slate-600" : "text-slate-300"
                }`}
              >
                {section === "structure"
                  ? "11 Bộ phận chính (SGK)"
                  : `Linh kiện tháo rời (${steps.length})`}
              </span>
            </div>

            {/* Desktop Collapse Button */}
            <button
              onClick={() => setIsLeftCollapsed(true)}
              className="hidden lg:flex text-slate-400 hover:text-white p-1 rounded transition-colors"
              title="Thu gọn bảng"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Close Button */}
            {mobileTab === "leftPanel" && (
              <button
                onClick={() => setMobileTab("viewport")}
                className="lg:hidden text-white bg-slate-800 p-1.5 rounded-lg flex items-center gap-1 text-xs font-bold"
              >
                <X className="w-4 h-4" /> Đóng
              </button>
            )}
          </div>

          {/* NỘI DUNG CỘT TRÁI - MỤC 1: CẤU TẠO SÚNG (11 BỘ PHẬN CHÍNH) */}
          {section === "structure" ? (
            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* Search box */}
              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm chi tiết, bộ phận..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Danh sách 11 bộ phận chính - Mỗi bộ phận riêng biệt không gộp chung */}
              <div className="flex-1 overflow-y-auto py-1.5 space-y-0.5">
                {filteredParts.map((part) => {
                  const isActive = selectedPart.id === part.id;
                  return (
                    <button
                      key={part.id}
                      onClick={() => {
                        setSelectedPart(part);
                        if (mobileTab === "leftPanel") setMobileTab("rightPanel");
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left cursor-pointer group relative transition-colors duration-100"
                      style={{
                        background: isActive
                          ? isLight
                            ? "rgba(220, 38, 38, 0.08)"
                            : "rgba(239, 68, 68, 0.12)"
                          : undefined,
                      }}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r bg-red-600" />
                      )}
                      <span className="text-sm shrink-0 leading-none">{part.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-[11.5px] truncate leading-tight transition-colors ${
                            isActive
                              ? isLight
                                ? "text-red-700 font-bold"
                                : "text-red-400 font-bold"
                              : isLight
                              ? "text-slate-700 group-hover:text-slate-900"
                              : "text-slate-300 group-hover:text-white"
                          }`}
                        >
                          {part.name}
                        </div>
                        <div className="text-[9.5px] text-slate-400 truncate mt-0.5">
                          {part.groupName}
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-3 h-3 shrink-0 transition-transform ${
                          isActive ? "text-red-500 translate-x-0.5" : "text-slate-400 opacity-40 group-hover:opacity-100"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* NỘI DUNG CỘT TRÁI - MỤC 2: QUY TRÌNH THÁO LẮP (BỘ PHẬN THÁO RỜI) */
            <div className="flex-1 overflow-y-auto py-2">
              <div className="px-3.5 py-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Thao tác từng linh kiện:
              </div>
              {steps.map((st, idx) => {
                const isActive = currentStep === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      handleStepJump(idx);
                      if (mobileTab === "leftPanel") setMobileTab("viewport");
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left cursor-pointer group relative transition-colors"
                    style={{
                      background: isActive
                        ? isLight
                          ? "rgba(16, 185, 129, 0.1)"
                          : "rgba(16, 185, 129, 0.15)"
                        : undefined,
                    }}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r bg-emerald-500" />
                    )}
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isActive
                          ? "bg-emerald-600 text-white"
                          : idx < currentStep
                          ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/40"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                      }`}
                    >
                      {idx < currentStep ? "✓" : idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-[12px] truncate font-medium ${
                          isActive
                            ? isLight
                              ? "text-emerald-800 font-bold"
                              : "text-emerald-400 font-bold"
                            : isLight
                            ? "text-slate-700"
                            : "text-slate-300"
                        }`}
                      >
                        {st.partName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {procedureMode === "thao" ? `Tháo bước ${idx + 1}` : `Lắp bước ${idx + 1}`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* ── CỘT GIỮA: 3D VIEWPORT CANVAS ─────────────────────────── */}
        <main
          className={`flex-1 min-h-0 overflow-hidden relative flex flex-col ${
            mobileTab === "viewport" ? "flex w-full h-full" : "hidden lg:flex"
          }`}
        >
          {/* Sub-bar điều khiển quy trình tháo lắp ở giữa màn hình */}
          {section === "procedure" && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/20 shadow-2xl">
              <button
                onClick={() => handleStepJump(0)}
                disabled={currentStep === 0}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title="Về bước đầu tiên"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleStepJump(currentStep - 1)}
                disabled={currentStep === 0}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-white/10 text-slate-200 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 cursor-pointer"
                title="Bước trước đó"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trước</span>
              </button>

              {/* Nút Tự động chạy toàn bộ quy trình */}
              <button
                onClick={() => setIsPlayingAuto(!isPlayingAuto)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md ${
                  isPlayingAuto
                    ? "bg-amber-500 text-white animate-pulse"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
                title={isPlayingAuto ? "Tạm dừng tự động" : "Tự động trình chiếu quy trình"}
              >
                {isPlayingAuto ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlayingAuto ? "Tạm dừng" : "Tự động chạy"}</span>
              </button>

              <button
                onClick={() => handleStepJump(currentStep + 1)}
                disabled={currentStep === totalSteps - 1}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-600/80 text-white hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-emerald-600/80 cursor-pointer"
                title="Bước tiếp theo"
              >
                <span className="hidden sm:inline">Tiếp</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleStepJump(totalSteps - 1)}
                disabled={currentStep === totalSteps - 1}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title="Đến bước cuối cùng"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 3D Simulation Canvas */}
          <AK47Simulation
            theme={isLight ? "light" : "dark"}
            section={section}
            mode={procedureMode}
            stepIndex={currentStep}
            activePartId={section === "structure" ? selectedPart.id : steps[currentStep]?.meshPrefix}
            onPartSelect={(part) => {
              if (part) setSelectedPart(part);
            }}
            onStepSelect={(stepIdx) => {
              setCurrentStep(stepIdx);
            }}
            cameraResetKey={cameraResetKey}
          />

          {/* Floating Mobile Bottom Navigation Pills */}
          <div className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setMobileTab("leftPanel")}
              className="px-3.5 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xl active:scale-95 transition-transform cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-red-400" />
              <span>{section === "structure" ? "11 Bộ phận" : "Linh kiện"}</span>
            </button>
            <button
              onClick={() => setMobileTab("rightPanel")}
              className="px-3.5 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xl active:scale-95 transition-transform cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>{section === "structure" ? "Xem chú thích" : `Bước ${currentStep + 1}/${totalSteps}`}</span>
            </button>
          </div>
        </main>

        {/* ── CỘT PHẢI (RIGHT PANEL) ────────────────────────────────── */}
        <aside
          className={`w-[320px] shrink-0 flex-col overflow-hidden transition-all duration-200 border-l ${
            mobileTab === "rightPanel"
              ? "flex absolute inset-0 z-40 w-full bg-[#111827]"
              : isRightCollapsed
              ? "hidden"
              : "hidden lg:flex"
          } ${
            isLight ? "bg-white border-slate-200 text-slate-800" : "bg-[#111827] border-slate-800 text-slate-100"
          }`}
        >
          {/* Header Cột phải */}
          <div
            className={`flex items-center justify-between px-4 py-2.5 shrink-0 border-b ${
              isLight ? "border-slate-100" : "border-slate-800"
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${
                isLight ? "text-slate-600" : "text-slate-300"
              }`}
            >
              {section === "structure"
                ? "Chú thích cấu tạo chi tiết"
                : `Quy trình ${procedureMode === "thao" ? "tháo" : "lắp"} súng AK-47`}
            </span>

            {/* Desktop Collapse Button */}
            <button
              onClick={() => setIsRightCollapsed(true)}
              className="hidden lg:flex text-slate-400 hover:text-white p-1 rounded transition-colors"
              title="Thu gọn bảng"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Close Button */}
            {mobileTab === "rightPanel" && (
              <button
                onClick={() => setMobileTab("viewport")}
                className="lg:hidden text-white bg-slate-800 p-1.5 rounded-lg flex items-center gap-1 text-xs font-bold"
              >
                <X className="w-4 h-4" /> Đóng
              </button>
            )}
          </div>

          {/* ── NỘI DUNG CỘT PHẢI - MỤC 1: CHÚ THÍCH CẤU TẠO (CHỈ 1 BỘ PHẬN ĐỘC LẬP) ── */}
          {section === "structure" ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Card tiêu đề bộ phận */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isLight
                    ? "bg-red-50/60 border-red-200"
                    : "bg-red-950/30 border-red-900/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">{selectedPart.emoji}</span>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400">
                      {selectedPart.groupName}
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                      {selectedPart.name}
                    </h3>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-2 pt-2 border-t border-red-200/50 dark:border-red-900/40">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Vị trí:</span>
                  <span>{selectedPart.location}</span>
                </div>
              </div>

              {/* Tác dụng chiến thuật */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/80 border-slate-800"
                }`}
              >
                <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-extrabold text-[11px] uppercase tracking-wider mb-2">
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Tác dụng chiến thuật</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 font-sans">
                  {selectedPart.purpose}
                </p>
              </div>

              {/* Cấu tạo chi tiết của riêng 1 bộ phận này (Đáp ứng đúng: không gộp chung) */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/80 border-slate-800"
                }`}
              >
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-extrabold text-[11px] uppercase tracking-wider mb-2">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Cấu tạo chi tiết</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 font-sans">
                  {selectedPart.structure}
                </p>
              </div>

              {/* Mẹo ghi nhớ & Kiến thức thi cử */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isLight ? "bg-blue-50/60 border-blue-200" : "bg-blue-950/30 border-blue-900/50"
                }`}
              >
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-extrabold text-[11px] uppercase tracking-wider mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ghi nhớ thi cử GDQP</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-sans">
                  {selectedPart.learningTips}
                </p>
              </div>
            </div>
          ) : (
            /* ── NỘI DUNG CỘT PHẢI - MỤC 2: QUY TRÌNH THÁO LẮP ĐỒNG BỘ ── */
            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* Progress bar */}
              <div
                className={`px-4 py-3 shrink-0 border-b ${
                  isLight ? "border-slate-100 bg-slate-50/50" : "border-slate-800 bg-slate-900/50"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {procedureMode === "thao" ? "Quy trình tháo súng" : "Quy trình lắp súng"}
                  </span>
                  <span className="font-mono font-bold text-slate-500">
                    Bước {currentStep + 1} / {totalSteps}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Thẻ bước hiện tại */}
                <div
                  className={`p-3.5 rounded-2xl border shadow-sm ${
                    isLight
                      ? "bg-emerald-50/70 border-emerald-200 text-slate-800"
                      : "bg-emerald-950/40 border-emerald-800/60 text-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Bước hiện tại ({currentStep + 1}/{totalSteps})</span>
                  </div>
                  <h4 className="text-sm font-black mb-2 text-slate-900 dark:text-white">
                    {steps[currentStep]?.title}
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 font-sans mb-3">
                    {steps[currentStep]?.actionDescription}
                  </p>
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-emerald-200/60 dark:border-emerald-800/50 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300 font-medium">
                    ⚠️ {steps[currentStep]?.keyPoints}
                  </div>
                </div>

                {/* Danh sách các bước dạng checklist trực quan */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    Các bước quy trình chuẩn:
                  </div>
                  {steps.map((st, idx) => {
                    const isDone = idx < currentStep;
                    const isActive = idx === currentStep;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleStepJump(idx)}
                        className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isActive
                            ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30"
                            : isDone
                            ? isLight
                              ? "bg-slate-50 border-slate-200 text-slate-600"
                              : "bg-slate-900/50 border-slate-800 text-slate-400"
                            : isLight
                            ? "bg-white border-slate-200/80 text-slate-500"
                            : "bg-slate-900/20 border-slate-800/60 text-slate-500"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                            isActive
                              ? "bg-white text-emerald-700"
                              : isDone
                              ? "bg-emerald-500/20 text-emerald-500"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                          }`}
                        >
                          {isDone ? "✓" : idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-[11.5px] leading-tight font-bold ${
                              isActive ? "text-white" : isLight ? "text-slate-800" : "text-slate-200"
                            }`}
                          >
                            {st.title}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Khung quy tắc an toàn quân đội */}
                <div
                  className={`p-3.5 rounded-2xl border ${
                    isLight ? "bg-amber-50/70 border-amber-200" : "bg-amber-950/30 border-amber-900/50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-extrabold text-[11px] uppercase tracking-wider mb-2">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Quy tắc an toàn bắt buộc</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 font-sans">
                    {AK_SAFETY_RULES.map((rule, rIdx) => (
                      <li key={rIdx} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>
                          <strong>{rule.title}:</strong> {rule.desc}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}