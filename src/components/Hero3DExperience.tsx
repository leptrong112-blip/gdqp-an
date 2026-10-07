import React, { useState, useEffect, useRef, lazy, Suspense, Component, type ReactNode } from "react";
import { Camera, Wrench, Compass, CheckCircle2, Eye, Cpu } from "lucide-react";

// Lazy-load the 3D Canvas
const Hero3DCanvas = lazy(() => import("./Hero3DCanvas"));

function checkWebGLSupport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

class CanvasErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.warn("[Hero3DExperience] WebGL Canvas encountered an error, falling back:", error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function Hero3DExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebGLSupported] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [isInView, setIsInView] = useState<boolean>(true);
  const [mode, setMode] = useState<"mannequin" | "soldier">("mannequin");

  // 2.5D Subtle Pointer Parallax state (tilt max 2 degrees)
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setWebGLSupported(checkWebGLSupport());

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mediaQuery.addEventListener?.("change", handleMotionChange);

    if ("IntersectionObserver" in window && containerRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            setIsInView(entry.isIntersecting);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(containerRef.current);
      return () => {
        observer.disconnect();
        mediaQuery.removeEventListener?.("change", handleMotionChange);
      };
    }

    return () => {
      mediaQuery.removeEventListener?.("change", handleMotionChange);
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    // Tối đa 2.2 độ tilt
    setTilt({ x: -y * 4.4, y: x * 4.4 });
  };

  const handlePointerLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // 2D Soldier Fallback (Seamlessly blended, no box frame)
  const renderSoldierGraphic = () => (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      <img
        src="/images/hero-soldier.png"
        alt="Chiến sĩ Trải Nghiệm Số GDQP-AN"
        className="max-h-[380px] sm:max-h-[440px] w-auto object-contain drop-shadow-2xl"
        style={{
          maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
        }}
        loading="eager"
      />
    </div>
  );

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full h-[380px] sm:h-[440px] lg:h-[480px] flex items-center justify-center select-none perspective-[1200px]"
    >
      {/* ── 1. SUBTLE TACTICAL DEPTH GRID (NO RIGID BORDER) ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 dark:opacity-15 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px]"
        style={{
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      {/* ── 2. SOFT ATMOSPHERIC GLOWS ── */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-gradient-to-tr from-red-500/10 to-amber-500/15 dark:from-red-600/15 dark:to-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-cyan-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── 3. MODE SWITCH PILL (TỐI GIẢN Ở GÓC TRÊN) ── */}
      {webglSupported && (
        <div className="absolute top-2 right-2 z-30 flex items-center gap-1 p-1 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setMode("mannequin")}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === "mannequin"
                ? "bg-red-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Cpu className="w-3 h-3" />
            <span>Khung xương AI</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("soldier")}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === "soldier"
                ? "bg-red-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Chiến sĩ số</span>
          </button>
        </div>
      )}

      {/* ── 4. PARALLAX 3D SPATIAL STAGE (OPEN, BORDERLESS) ── */}
      <div
        className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* CENTER ELEMENT: AI POSE JOINT SKELETON OR SOLDIER */}
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{ transform: "translateZ(0px)" }}
        >
          {mode === "mannequin" && webglSupported ? (
            <CanvasErrorBoundary fallback={renderSoldierGraphic()}>
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-mono">
                    Đang khởi tạo AI Pose Mannequin…
                  </div>
                }
              >
                <div
                  className="w-full h-full"
                  style={{
                    maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
                  }}
                >
                  <Hero3DCanvas isPaused={!isInView} reducedMotion={reducedMotion} />
                </div>
              </Suspense>
            </CanvasErrorBoundary>
          ) : (
            renderSoldierGraphic()
          )}
        </div>

        {/* ── 5. LAYERED FLOATING MODULE CARDS WITH OPTICAL DEPTH (TRANSLATE-Z) ── */}

        {/* FLOATING CARD 1: AI POSE REAL-TIME ANALYSIS (TOP-LEFT, Z: 35px) */}
        <div
          className="absolute top-6 left-0 sm:left-2 z-20 p-3 sm:p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-300/40 dark:shadow-black/50 transition-all duration-300 pointer-events-none hover:scale-105"
          style={{ transform: "translateZ(35px)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-black text-slate-900 dark:text-white">
                  AI Pose Analysis
                </span>
              </div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold mt-0.5">
                Cột sống: 180° · Chuẩn đứng nghiêm
              </div>
            </div>
          </div>
        </div>

        {/* FLOATING CARD 2: 3D SIMULATION STAGE (BOTTOM-RIGHT, Z: 28px) */}
        <div
          className="absolute bottom-6 right-0 sm:right-2 z-20 p-3 sm:p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-300/40 dark:shadow-black/50 transition-all duration-300 pointer-events-none hover:scale-105"
          style={{ transform: "translateZ(28px)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-black text-slate-900 dark:text-white">
                Mô Phỏng 3D AK-47
              </div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-sans mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-red-500" />
                <span>7 bước tháo lắp chuẩn</span>
              </div>
            </div>
          </div>
        </div>

        {/* FLOATING CARD 3: DI TÍCH 360° VR & BẢN ĐỒ (BOTTOM-LEFT, Z: 18px) */}
        <div
          className="hidden sm:block absolute bottom-8 left-4 z-10 p-2.5 rounded-2xl bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-300/30 dark:shadow-black/40 transition-all pointer-events-none"
          style={{ transform: "translateZ(18px)" }}
        >
          <div className="flex items-center gap-2 text-xs">
            <Compass className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
              Di Tích 360° VR
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-mono">
              Panoramic
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
