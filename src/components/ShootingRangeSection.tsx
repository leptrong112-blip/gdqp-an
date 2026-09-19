import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Crosshair,
  Target,
  Trophy,
  Shield,
  HelpCircle,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  Award,
  Zap,
  Eye,
  Sliders,
  Wind,
  Play,
} from "lucide-react";
import {
  AK_TARGETS,
  AK_EXERCISES,
  AIMING_ERROR_CASES,
  TargetInfo,
  ExerciseInfo,
  AimingErrorCase,
  TargetId,
  ExerciseId,
} from "../data/akShootingData";
import { useGamification } from "../context/GamificationContext";

import ShootingRange3D, { RangeImpact } from "./ShootingRange3D";
import { useRangeControls } from './useRangeControls';
import RangeViewControls from './RangeViewControls';
import ArcadeRangeSection from './ArcadeRangeSection';
import { loadSightPreset } from "./rangeSightPresets";

interface ShotRecord {
  shotNumber: number;
  x: number; // Millimetres on the target (+X right, origin at centre)
  y: number; // Millimetres on the target (+Y up, origin at centre)
  score: number;
  isHit: boolean; // Trúng bia hay bắn trượt
  screenX: number; // Tọa độ pixel X trên toàn viewport
  screenY: number; // Tọa độ pixel Y trên toàn viewport
  clockPosition: string; // "12 giờ", "3 giờ", "chính tâm 10"...
  time: number;
}

export default function ShootingRangeSection() {
  const { fireXPToast, recordSkillCompletion } = useGamification();

  // Tab điều hướng chính
  const [activeTab, setActiveTab] = useState<"simulator" | "handbook" | "sightLab" | "arcade">("simulator");

  // State chọn bài bắn & bia
  const [selectedExerciseId, setSelectedExerciseId] = useState<ExerciseId>("tap_dong_tien");
  const [sightPresetId, setSightPresetId] = useState<string>(loadSightPreset);
  const [hasSeparateSight, setHasSeparateSight] = useState(false);
  const selectedExercise = AK_EXERCISES.find((e) => e.id === selectedExerciseId) || AK_EXERCISES[0];

  // Map exercise sang target tương ứng
  const getTargetForExercise = (exId: ExerciseId): TargetInfo => {
    switch (exId) {
      case "tap_dong_tien":
        return AK_TARGETS.find((t) => t.id === "dong_tien")!;
      case "bai_1":
        return AK_TARGETS.find((t) => t.id === "bia_4")!;
      case "bai_2":
        return AK_TARGETS.find((t) => t.id === "bia_6")!;
      case "bai_3":
        return AK_TARGETS.find((t) => t.id === "bia_8")!;
      default:
        return AK_TARGETS[0];
    }
  };

  const currentTarget = getTargetForExercise(selectedExerciseId);

  // ═════════════════════ SIMULATOR STATES ═════════════════════
  // Tọa độ ngắm súng (tương đối từ -1 đến 1, 0 là chính tâm)
  const [aimPos, setAimPos] = useState({ x: 0, y: 0 });
  const fire3DRef = useRef<(() => RangeImpact | null) | null>(null);
  const [adsHeld, setAdsHeld] = useState(false);
  const [touchAdsHeld, setTouchAdsHeld] = useState(false);
  const touchAimRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const touchAdsRef = useRef<number | null>(null);
  const touchFireRef = useRef(false);
  const releaseTouchControls = useCallback(() => {
    touchAimRef.current = null;
    touchAdsRef.current = null;
    setTouchAdsHeld(false);
  }, []);
  const [isHoldingBreath, setIsHoldingBreath] = useState(false);
  const [breathSecondsLeft, setBreathSecondsLeft] = useState(4);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isAimingDownSights, setIsAimingDownSights] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Trạng thái đạn & kết quả
  const [shots, setShots] = useState<ShotRecord[]>([]);
  const [isShooting, setIsShooting] = useState(false);
  const [recoilOffset, setRecoilOffset] = useState({ x: 0, y: 0 });
  const [lastShotReport, setLastShotReport] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Sway (dao động thở)
  const swayRef = useRef({ phase: 0 });
  const [swayOffset, setSwayOffset] = useState({ x: 0, y: 0 });

  // Tham chiếu khung nhìn thao trường để tính pixel thực tế
  const rangeRef = useRef<HTMLDivElement>(null);
  const lastValidAimRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const fireInputRef = useRef<() => void>(() => {});
  const [controlRound, setControlRound] = useState(0);
  const controls = useRangeControls(rangeRef, {
    active: activeTab === 'simulator' && hasStarted && !isCompleted,
    round: `${selectedExerciseId}:${controlRound}:${activeTab}`,
    fire: () => fireInputRef.current(), ads: setAdsHeld,
    toggleAds: () => setIsAimingDownSights(value => !value),
    release: () => { setAdsHeld(false); setIsHoldingBreath(false); },
  });
  const shotLock = useRef(false);
  const shotTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearShotTimers = useCallback(() => {
    shotTimers.current.forEach(clearTimeout); shotTimers.current = []; shotLock.current = false;
  }, []);
  useEffect(() => { clearShotTimers(); setIsShooting(false); return clearShotTimers; }, [activeTab, selectedExerciseId, controlRound, clearShotTimers]);

  // Âm thanh Web Audio API Synthesizer (AK Gunshot + Casing Ping)
  const playGunshotSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();

      // 1. Noise blast (tiếng nổ đanh)
      const bufferSize = ctx.sampleRate * 0.45;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(950, ctx.currentTime);
      noiseFilter.Q.setValueAtTime(2.5, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(1.0, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start();

      // 2. Bass thump (tiếng nén trầm uy lực)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(130, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.25);

      oscGain.gain.setValueAtTime(0.8, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);

      // 3. Vỏ đạn kim loại rơi nảy leng keng (Brass casing ping sau 0.4s)
      setTimeout(() => {
        try {
          const pingOsc = ctx.createOscillator();
          const pingGain = ctx.createGain();
          pingOsc.type = "sine";
          pingOsc.frequency.setValueAtTime(2400, ctx.currentTime);
          pingOsc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.12);

          pingGain.gain.setValueAtTime(0.12, ctx.currentTime);
          pingGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

          pingOsc.connect(pingGain);
          pingGain.connect(ctx.destination);
          pingOsc.start();
          pingOsc.stop(ctx.currentTime + 0.13);
        } catch (_) {}
      }, 380);
    } catch (e) {
      console.warn("Web Audio not supported or blocked", e);
    }
  }, [soundEnabled]);

  // Âm thanh lên đạn súng AK khi nhấn Bắt đầu (Cock / Slide Sound)
  const playCockSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();

      // Tiếng kéo bệ khóa nòng súng AK
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(450, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.08);
      gain1.gain.setValueAtTime(0.35, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.09);

      // Tiếng lò xo đẩy bệ khóa nòng va đập kim loại "Cạch - rắc"
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = "triangle";
          osc2.frequency.setValueAtTime(750, ctx.currentTime);
          osc2.frequency.exponentialRampToValueAtTime(130, ctx.currentTime + 0.12);
          gain2.gain.setValueAtTime(0.5, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.13);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.13);
        } catch (_) {}
      }, 110);
    } catch (_) {}
  }, [soundEnabled]);

  // Vòng lặp tính dao động thở (Weapon Sway)
  useEffect(() => {
    let animId: number;
    const updateSway = () => {
      swayRef.current.phase += isHoldingBreath ? 0.02 : 0.05;
      const amplitude = isHoldingBreath ? 0.004 : 0.022; // Nín thở thì dao động giảm 80%
      const sx = Math.sin(swayRef.current.phase * 0.9) * amplitude;
      const sy = Math.cos(swayRef.current.phase * 1.5) * amplitude * 1.2;
      setSwayOffset({ x: sx, y: sy });
      animId = requestAnimationFrame(updateSway);
    };
    animId = requestAnimationFrame(updateSway);
    return () => cancelAnimationFrame(animId);
  }, [isHoldingBreath]);

  // Đếm ngược thời gian nín thở
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isHoldingBreath) {
      timer = setInterval(() => {
        setBreathSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsHoldingBreath(false);
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathSecondsLeft(4);
    }
    return () => clearInterval(timer);
  }, [isHoldingBreath]);

  // Bắn theo đường ngắm trong cảnh 3D.
  const handleFire = useCallback(
    () => {
      if (!hasStarted || isShooting || isCompleted || controls.panel || shotLock.current) return;
      if (shots.length >= selectedExercise.ammoCount) return;

      const impact = fire3DRef.current?.();
      if (!impact) return;
      shotLock.current = true;
      setIsShooting(true);
      playGunshotSound();

      // Hiệu ứng giật nảy súng lên trên (Recoil kick)
      const kickY = -0.12 + (Math.random() - 0.5) * 0.04;
      const kickX = (Math.random() - 0.5) * 0.06;
      setRecoilOffset({ x: kickX, y: kickY });

      // Score and marks share the visible 3D ray, in target-local millimetres.
      const { x: hitLocalX, y: hitLocalY, score, isHit, screenX: screenImpactX, screenY: screenImpactY } = impact;
      const rect = rangeRef.current?.getBoundingClientRect();
      const viewportW = rect?.width || 900, viewportH = rect?.height || 600;
      const center10X = 0, center10Y = 0;
      const distFrom10 = Math.hypot(hitLocalX, hitLocalY);

      // 4. Xác định hướng giờ lệch (Clock Position)
      let clock = "Chính tâm 10";
      if (distFrom10 > 4) {
        const dx = hitLocalX - center10X;
        const dy = hitLocalY - center10Y;
        const angle = Math.atan2(dx, dy) * (180 / Math.PI); // 0 độ = 12h, 90 độ = 3h, 180 = 6h, 270 = 9h
        const normalized = (angle + 360) % 360;
        const hour = Math.round(normalized / 30) || 12;
        clock = `hướng ${hour} giờ`;
      }

      const newShot: ShotRecord = {
        shotNumber: shots.length + 1,
        x: hitLocalX,
        y: hitLocalY,
        score,
        isHit,
        screenX: Math.max(12, Math.min(viewportW - 12, screenImpactX)),
        screenY: Math.max(12, Math.min(viewportH - 12, screenImpactY)),
        clockPosition: clock,
        time: Date.now(),
      };

      const nextShots = [...shots, newShot];
      setShots(nextShots);

      // Thông báo đài báo bia
      const modeText = (isAimingDownSights || adsHeld || touchAdsHeld) ? "" : " (Bắn từ hông)";
      const reportText = isHit
        ? `Viên ${newShot.shotNumber}: ${score} Điểm (${clock})${modeText}!`
        : `Viên ${newShot.shotNumber}: 0 Điểm - Bắn trượt ra ngoài bia (${clock})${modeText}!`;
      setLastShotReport(reportText);

      // Hồi phục sau giật (recoil settle)
      shotTimers.current.push(setTimeout(() => {
        setRecoilOffset({ x: 0, y: 0 });
        setIsShooting(false);
        shotLock.current = false;
      }, 280));

      // Kiểm tra hoàn thành bài bắn
      if (nextShots.length >= selectedExercise.ammoCount) {
        shotTimers.current.push(setTimeout(() => {
          setIsCompleted(true);
          const total = nextShots.reduce((acc, s) => acc + s.score, 0);
          fireXPToast(total * 4, `Hoàn thành ${selectedExercise.title}`);
          recordSkillCompletion("ak_shooting");
        }, 900));
      }
    },
    [
      hasStarted,
      controls.panel,
      isShooting,
      isCompleted,
      shots,
      selectedExercise,
      playGunshotSound,
      swayOffset.x,
      swayOffset.y,
      currentTarget,
      adsHeld,
      touchAdsHeld,
      isAimingDownSights,
      isHoldingBreath,
      fireXPToast,
      recordSkillCompletion,
    ]
  );
  fireInputRef.current = handleFire;

  // Reset bài bắn
  const handleResetShots = useCallback(() => {
    clearShotTimers();
    setControlRound(r => r + 1);
    releaseTouchControls();
    setIsHoldingBreath(false);
    setShots([]);
    setLastShotReport(null);
    setIsCompleted(false);
    const initialY = 0;
    setAimPos({ x: 0, y: initialY });
    lastValidAimRef.current = { x: 0, y: initialY };
  }, [currentTarget.id, releaseTouchControls]);

  // Thay đổi bài bắn (chuyển sang bài mới sẽ hiện màn hình Bắt đầu)
  const handleChangeExercise = (exId: ExerciseId) => {
    clearShotTimers();
    releaseTouchControls();
    setIsHoldingBreath(false);
    setSelectedExerciseId(exId);
    setShots([]);
    setLastShotReport(null);
    setIsCompleted(false);
    setHasStarted(false);
    const target = getTargetForExercise(exId);
    const initialY = 0;
    setAimPos({ x: 0, y: initialY });
    lastValidAimRef.current = { x: 0, y: initialY };
  };

  // One finger owns relative aiming; other fingers can operate ADS and fire.
  const handleTouchAimDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' || !hasStarted || isCompleted || touchAimRef.current) return;
    if ((e.target as HTMLElement).closest('button, [data-range-controls]')) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    touchAimRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const handleTouchAimMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const pointer = touchAimRef.current;
    if (!pointer || pointer.id !== e.pointerId) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = 2 / Math.max(1, Math.min(rect.width, rect.height));
    const next = {
      x: Math.max(-1.1, Math.min(1.1, lastValidAimRef.current.x + (e.clientX - pointer.x) * scale)),
      y: Math.max(-1.1, Math.min(1.1, lastValidAimRef.current.y - (e.clientY - pointer.y) * scale)),
    };
    touchAimRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    lastValidAimRef.current = next;
    setAimPos(next);
  };
  const releaseTouchAim = (e: React.PointerEvent<HTMLDivElement>) => {
    if (touchAimRef.current?.id === e.pointerId) touchAimRef.current = null;
  };
  const releaseTouchAds = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (touchAdsRef.current !== e.pointerId) return;
    touchAdsRef.current = null;
    setTouchAdsHeld(false);
  };

  useEffect(() => {
    releaseTouchControls();
    setAdsHeld(false);
    setIsHoldingBreath(false);
  }, [activeTab, hasStarted, isCompleted, releaseTouchControls]);

  // Lắng nghe sự kiện nhả chuột toàn cục để đảm bảo không bị kẹt trạng thái nín thở
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (e.button === 2 || !(e.buttons & 2)) {
        setAdsHeld(false);
      }
    };
    const release = () => { setAdsHeld(false); setIsHoldingBreath(false); releaseTouchControls(); };
    const onVisibility = () => { if (document.hidden) release(); };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("blur", release);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', release);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("blur", release);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', release);
    };
  }, [releaseTouchControls]);

  // Phím tắt bàn phím: Space / Enter để Bắt đầu hoặc Bắn, Q để đổi Ngắm bắn, Shift để Nín thở, R để Bắn lại
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== "simulator" || e.repeat || controls.panel) return;
      if (e.target instanceof HTMLElement && e.target.closest('button, input, select, textarea, [contenteditable="true"]')) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (!hasStarted) {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          playCockSound();
          setHasStarted(true);
        }
        return;
      }

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handleFire();
      } else if (e.code === "KeyQ") {
        e.preventDefault();
        setIsAimingDownSights((prev) => !prev);
      } else if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        e.preventDefault();
        setIsHoldingBreath((prev) => !prev);
      } else if (e.code === "KeyR") {
        e.preventDefault();
        handleResetShots();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, hasStarted, playCockSound, handleFire, handleResetShots, controls.panel]);

  // Tổng điểm và xếp loại
  const totalScore = shots.reduce((acc, s) => acc + s.score, 0);
  const maxPossibleScore = selectedExercise.ammoCount * 10;
  const currentGrade = selectedExercise.scoringCriteria.find(
    (c) => totalScore >= c.minScore && totalScore <= c.maxScore
  ) || selectedExercise.scoringCriteria[selectedExercise.scoringCriteria.length - 1];

  // ═════════════════════ SIGHT LAB STATE ═════════════════════
  const [selectedErrorCaseId, setSelectedErrorCaseId] = useState<string>("chuan");
  const selectedErrorCase =
    AIMING_ERROR_CASES.find((c) => c.id === selectedErrorCaseId) || AIMING_ERROR_CASES[0];

  // Handbok selected target
  const [handbookTargetId, setHandbookTargetId] = useState<TargetId>("dong_tien");
  const handbookTarget = AK_TARGETS.find((t) => t.id === handbookTargetId) || AK_TARGETS[0];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 select-none animate-fadeIn pb-12">
      {/* ═══════════════════ PHẦN ĐẦU TRANG & ĐIỀU HƯỚNG TABS ═══════════════════ */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-black border border-red-500/20">
              <Crosshair className="w-3.5 h-3.5" />
              MÔ-ĐUN CHUYÊN BIỆT GDQP-AN THPT
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Trường Bắn Ảo &amp; Hệ Thống Bia Súng Tiểu Liên AK
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-sans max-w-2xl leading-relaxed">
              Mô phỏng ngắm bắn chuẩn xác theo SGK GDQP: Nằm bắn bia số 4 (100m), Quỳ bắn bia số 6 (150m), Đứng bắn bia số 8 (200m) và Tập ngắm bia đồng tiền (10m) có tính điểm &amp; báo bia tự động.
            </p>
          </div>

          {/* Cụm 3 Tabs chuyển đổi */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <button onClick={() => setActiveTab('arcade')} className={`px-4 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer ${activeTab === 'arcade' ? 'bg-cyan-600 text-white' : 'text-cyan-600 dark:text-cyan-300'}`}>Game · Băng đạn &amp; bia động</button>
            <button
              onClick={() => setActiveTab("simulator")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === "simulator"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/25"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Crosshair className="w-4 h-4" />
              <span>Bắn Tập Ảo</span>
            </button>

            <button
              onClick={() => setActiveTab("handbook")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === "handbook"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/25"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Hệ Thống Bia &amp; Bài Bắn</span>
            </button>

            <button
              onClick={() => setActiveTab("sightLab")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === "sightLab"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/25"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Thí Nghiệm Sai Số Ngắm</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════ TAB 1: BẮN TẬP TƯƠNG TÁC (SIMULATOR) ═══════════════════ */}
      {activeTab === 'arcade' && <ArcadeRangeSection />}
      {activeTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* CỘT TRÁI (8 COLS): KHUNG NHÌN THAO TRƯỜNG BẮN SÚNG */}
          <div className="lg:col-span-8 min-w-0 space-y-4">
            
            {/* Thanh điều khiển nhanh bài bắn & thước ngắm */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-3 rounded-2xl">
              <div className="flex min-w-0 max-w-full items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Bài bắn:</span>
                {AK_EXERCISES.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => handleChangeExercise(ex.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap cursor-pointer transition-all ${
                      selectedExerciseId === ex.id
                        ? "bg-red-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {ex.id === "tap_dong_tien" ? "🪙 Bia Đồng Tiền 10m" : ex.id === "bai_1" ? "🎯 Bài 1 (Bia 4 - 100m)" : ex.id === "bai_2" ? "🌲 Bài 2 (Bia 6 - 150m)" : "🏃 Bài 3 (Bia 8 - 200m)"}
                  </button>
                ))}
              </div>

              {/* Tùy chỉnh Thước ngắm & Âm thanh */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">AKM · Ngắm cơ khí 3D</span>

                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-xl border cursor-pointer transition-colors ${
                    soundEnabled
                      ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                      : "bg-red-50 dark:bg-red-950/40 border-red-300 text-red-600"
                  }`}
                  title={soundEnabled ? "Tắt âm thanh súng" : "Bật âm thanh súng"}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* ══════════ KHUNG NHÌN SÚNG & THAO TRƯỜNG (VIEWPORT CHÍNH) ══════════ */}
            <div
              ref={rangeRef}
              tabIndex={0}
              data-range-gameplay
              data-pointer-locked={controls.locked}
              onPointerDown={(e) => { if (e.pointerType !== 'mouse' && !controls.panel) handleTouchAimDown(e); }}
              onPointerMove={(e) => { if (e.pointerType !== 'mouse' && !controls.panel) handleTouchAimMove(e); }}
              onPointerUp={releaseTouchAim}
              onPointerCancel={releaseTouchAim}
              onLostPointerCapture={releaseTouchAim}
              onPointerLeave={(e) => { if (e.pointerType === 'mouse' && !controls.locked) { setAdsHeld(false); setIsHoldingBreath(false); } }}
              onContextMenu={(e) => e.preventDefault()}
              className={`relative w-full h-[520px] sm:h-[600px] lg:h-[660px] rounded-3xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-2xl select-none ${controls.locked ? 'cursor-none' : 'cursor-crosshair'} group touch-none bg-gradient-to-b from-sky-400 via-sky-200 to-emerald-800`}
            >
              <RangeViewControls
                controls={controls}
                isAds={controls.panel ? controls.previewAds : (isAimingDownSights || adsHeld || touchAdsHeld)}
                breath
                sightPresetId={sightPresetId}
                onSightPresetChange={setSightPresetId}
                hasSeparateSight={hasSeparateSight}
              />
              <ShootingRange3D
                ads={controls.panel ? controls.previewAds : (isAimingDownSights || adsHeld || touchAdsHeld)}
                aim={aimPos}
                sway={controls.panel ? { x: 0, y: 0 } : swayOffset}
                look={controls.look}
                alignment={controls.alignment}
                sightPresetId={sightPresetId}
                onSightAvailabilityChange={setHasSeparateSight}
                hideReticle={true}
                recoil={recoilOffset}
                targetId={currentTarget.id}
                shots={shots}
                fireRef={fire3DRef}
              />

              {/* ══════════ HUD GÓC TRÊN TRÁI: CỰ LY & CHẾ ĐỘ NGẮM (LUÔN RÕ RÀNG, KHÔNG BỊ SÚNG CHE) ══════════ */}
              <div data-range-controls onPointerDown={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()}
                className="absolute top-14 left-3 sm:left-4 z-20 flex flex-col gap-1.5 pointer-events-auto">
                <div className="flex flex-wrap items-center gap-2 max-w-[calc(100vw-6rem)]">
                  {/* Nút đổi nhanh Ngắm Bắn / Bắn từ hông */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAimingDownSights((prev) => !prev);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg border transition-all cursor-pointer ${
                      isAimingDownSights
                        ? "bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300"
                        : "bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700"
                    }`}
                    title="Nhấn phím Q hoặc nhấp vào đây để đổi chế độ ngắm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{(isAimingDownSights || adsHeld || touchAdsHeld) ? "🎯 Ngắm Bắn (ADS)" : "👀 Bắn Từ Hông"}</span>
                    <span className="text-[10px] opacity-75 font-mono ml-0.5">[Q]</span>
                  </button>

                  {/* Huy hiệu Cự ly bia */}
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white text-xs font-mono font-bold flex items-center gap-1.5 pointer-events-none shadow-md">
                    <Wind className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CỰ LY: <strong className="text-amber-400 font-extrabold">{currentTarget.standardDistance}M</strong></span>
                  </div>

                  {/* Nút xem lại lệnh / chuẩn bị */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setHasStarted(false);
                    }}
                    className="bg-black/60 hover:bg-black/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/20 text-white text-xs font-mono font-bold flex items-center gap-1 shadow-md cursor-pointer transition-colors"
                    title="Xem lại lệnh & thông số bài bắn"
                  >
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Lệnh bắn</span>
                  </button>
                </div>

                {/* Gợi ý thao tác nhanh */}
                <div className="bg-black/55 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-slate-300 flex flex-wrap items-center gap-2 pointer-events-none w-fit">
                  <span className="w-full sm:hidden [@media(any-pointer:coarse)]:block">Kéo để ngắm · Giữ ADS · Chạm BẮN</span>
                  <span>🖱️ Chuột trái: Bắn</span>
                  <span>•</span>
                  <span>Giữ chuột phải: ADS · Shift: Nín thở</span>
                </div>
              </div>

              {/* ══════════ HUD GÓC TRÊN PHẢI: SỐ ĐẠN & BÁO BIA ══════════ */}
              <div className="absolute top-40 right-3 sm:top-32 sm:right-4 lg:top-24 z-20 flex flex-col items-end gap-2 pointer-events-none max-w-[85%]">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ĐẠN: {shots.length} / {selectedExercise.ammoCount} VIÊN</span>
                </div>
                {lastShotReport && (
                  <div className="bg-amber-500 text-slate-950 px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-xl animate-bounce border border-amber-300">
                    📢 {lastShotReport}
                  </div>
                )}
              </div>

              {/* ══════════ THANH ĐIỀU KHIỂN NÚT BẤM DƯỚI KHUNG NHÌN ══════════ */}
              <div
                data-range-controls
                onPointerDown={(e) => e.stopPropagation()}
                onPointerMove={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseMove={(e) => e.stopPropagation()}
                className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-30 flex flex-wrap items-center justify-between pointer-events-auto gap-2"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Giữ ADS để ngắm"
                    aria-pressed={touchAdsHeld}
                    disabled={!hasStarted || isCompleted}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      if (touchAdsRef.current !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
                      e.preventDefault();
                      e.currentTarget.setPointerCapture(e.pointerId);
                      touchAdsRef.current = e.pointerId;
                      setTouchAdsHeld(true);
                    }}
                    onPointerUp={releaseTouchAds}
                    onPointerCancel={releaseTouchAds}
                    onLostPointerCapture={releaseTouchAds}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`min-h-12 min-w-20 touch-none rounded-2xl border px-3 text-xs font-black shadow-lg sm:hidden [@media(any-pointer:coarse)]:inline-flex items-center justify-center ${touchAdsHeld ? 'bg-amber-500 text-slate-950 border-amber-300' : 'bg-slate-900/90 text-white border-white/30'}`}
                  >Giữ ADS</button>
                  {/* Nút chuyển chế độ ngắm */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAimingDownSights(!isAimingDownSights);
                    }}
                    className={`hidden sm:flex [@media(any-pointer:coarse)]:hidden items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-2xl text-xs font-black shadow-lg transition-all cursor-pointer border ${
                      isAimingDownSights
                        ? "bg-amber-500 text-slate-950 border-amber-300 hover:bg-amber-400"
                        : "bg-black/60 text-slate-200 border-white/20 hover:bg-black/80"
                    }`}
                    title="Nhấn phím Q hoặc bấm vào đây để chuyển chế độ ngắm"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">{(isAimingDownSights || adsHeld) ? "Chế độ: Ngắm Bắn" : "Chế độ: Bắn Từ Hông"}</span>
                    <span className="sm:hidden">{(isAimingDownSights || adsHeld) ? "Ngắm Bắn" : "Bắn Hông"}</span>
                    <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-black/20">Q</span>
                  </button>

                  {/* Nút nín thở */}
                  <button
                    type="button"
                    aria-pressed={isHoldingBreath}
                    disabled={!hasStarted || isCompleted}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsHoldingBreath(!isHoldingBreath);
                    }}
                    className={`min-h-12 flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-2xl text-xs font-black shadow-lg transition-all cursor-pointer border ${
                      isHoldingBreath
                        ? "bg-blue-600 text-white border-blue-400 scale-105"
                        : "bg-black/60 text-slate-200 border-white/20 hover:bg-black/80"
                    }`}
                    title="Bấm phím Shift để bật/tắt nín thở"
                  >
                    <span>🫁</span>
                    <span>{isHoldingBreath ? `Nín Thở (${breathSecondsLeft}s)` : "Nín Thở"}</span>
                    <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-black/20 hidden sm:inline">Shift</span>
                  </button>
                </div>

                {/* Nút Bóp cò bắn */}
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    touchFireRef.current = e.pointerType !== 'mouse';
                    if (touchFireRef.current) {
                      e.preventDefault();
                      handleFire();
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (touchFireRef.current && e.detail !== 0) return;
                    handleFire();
                  }}
                  disabled={!hasStarted || isShooting || isCompleted}
                  className={`flex items-center gap-2 px-5 sm:px-7 py-3 rounded-2xl text-sm font-black shadow-xl transition-all cursor-pointer border ${
                    isCompleted
                      ? "bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed"
                      : isShooting
                      ? "bg-amber-500 text-slate-950 scale-95"
                      : "bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:brightness-110 text-white border-amber-400/50 shadow-red-600/40 hover:scale-105 active:scale-95"
                  }`}
                >
                  <Crosshair className="w-5 h-5" />
                  <span>{isCompleted ? "HẾT ĐẠN" : isShooting ? "..." : "BẮN"}</span>
                </button>
              </div>

              {/* ══════════ MÀN HÌNH BẮT ĐẦU VÀO TUYẾN BẮN (BRIEFING & START OVERLAY) ══════════ */}
              {!hasStarted && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-5 sm:p-6 text-center animate-fadeIn select-none pointer-events-auto"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/25 border border-red-500/40 text-red-400 text-[11px] font-black uppercase tracking-wider mb-2.5 shadow-sm">
                    <Target className="w-3.5 h-3.5" />
                    <span>LỆNH TIẾN VÀO TUYẾN BẮN</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1.5 max-w-lg">
                    {selectedExercise.title}
                  </h2>
                  <p className="text-xs text-slate-300 max-w-md mb-5 leading-relaxed">
                    {selectedExercise.subtitle}
                  </p>

                  {/* 4 thông số bài bắn theo chuẩn quân sự */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 max-w-lg w-full mb-6 text-left">
                    <div className="bg-slate-900/90 border border-slate-700/80 p-2.5 rounded-xl shadow-xs">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Cự ly</span>
                      <span className="text-sm font-black text-amber-400">{currentTarget.standardDistance} mét</span>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-700/80 p-2.5 rounded-xl shadow-xs">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Mục tiêu</span>
                      <span className="text-sm font-black text-white truncate block">{currentTarget.name.split("(")[0]}</span>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-700/80 p-2.5 rounded-xl shadow-xs">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Cơ số đạn</span>
                      <span className="text-sm font-black text-emerald-400">{selectedExercise.ammoCount} viên</span>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-700/80 p-2.5 rounded-xl shadow-xs">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Tư thế</span>
                      <span className="text-sm font-black text-sky-400">{currentTarget.postureLabel.split(" ")[0]} bắn</span>
                    </div>
                  </div>

                  {/* Nút BẮT ĐẦU BẮN */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playCockSound();
                      setHasStarted(true);
                    }}
                    className="group relative inline-flex items-center gap-3 px-8 py-3.5 sm:px-10 sm:py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:brightness-110 text-white font-black text-base sm:text-lg shadow-2xl shadow-red-600/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-amber-400/60"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-inner">
                      <Play className="w-4 h-4 text-amber-300 fill-amber-300" />
                    </div>
                    <span>BẮT ĐẦU BẮN</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Hướng dẫn thao tác nhanh */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] text-slate-400">
                    <span className="w-full text-amber-300">Cảm ứng: Kéo để ngắm · Giữ ADS · Chạm Nín thở (4 giây) · Chạm BẮN</span>
                    <span>🖱️ <strong>Chuột trái:</strong> Bóp cò</span>
                    <span>•</span>
                    <span><strong>Giữ chuột phải:</strong> ADS · Shift: Nín thở</span>
                    <span>•</span>
                    <span>🎯 <strong>Phím Q:</strong> Ngắm / Không ngắm</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">⌨️ <strong>Space / Enter:</strong> Bắt đầu</span>
                  </div>
                </div>
              )}
            </div>

            {/* Hướng dẫn thao tác nhanh */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-red-600 dark:text-red-400 font-extrabold flex items-center gap-1">
                  🖱️ Chuột trái: BẮN NGAY
                </span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
                <span><strong>Chuột phải:</strong> ADS · <strong>Shift:</strong> Nín thở</span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
                <span>🎯 <strong>Phím Q:</strong> Đổi Ngắm bắn / Bắn từ hông</span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
                <span>⌨️ <strong>Phím Space / Enter:</strong> Bóp cò</span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
                <span>🔄 <strong>Phím R:</strong> Bắn lại</span>
              </div>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">💡 Thước 3: Ngắm chính giữa mép dưới bia số 4</span>
            </div>

          </div>

          {/* CỘT PHẢI (4 COLS): BẢNG BÁO BIA, ĐIỂM SỐ & XẾP LOẠI */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Thẻ bảng điểm hiện tại */}
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">Bảng Điểm Xạ Thủ</h3>
                </div>
                <button
                  onClick={handleResetShots}
                  className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-red-600 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Bắn lại
                </button>
              </div>

              {/* Đồng hồ hiển thị tổng điểm lớn */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-center space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Điểm Đạt Được</div>
                <div className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                  {totalScore} <span className="text-lg text-slate-400 font-normal">/ {maxPossibleScore}</span>
                </div>
                <div className="pt-1">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold ${
                      currentGrade.grade === "Giỏi" || currentGrade.grade === "Xuất sắc"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : currentGrade.grade === "Khá"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        : currentGrade.grade === "Đạt"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        : "bg-red-500/10 text-red-600 border border-red-500/20"
                    }`}
                  >
                    Xếp loại: {currentGrade.grade.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Danh sách từng phát bắn */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Chi tiết phát bắn:</div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {shots.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-3 text-center">
                      Chưa bắn viên nào. Hãy nín thở và bóp cò!
                    </div>
                  ) : (
                    shots.map((s) => (
                      <div
                        key={s.shotNumber}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-[10px]">
                            {s.shotNumber}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Viên {s.shotNumber}</span>
                        </div>
                        <div className="text-slate-500 font-mono text-[11px]">{s.clockPosition}</div>
                        <div
                          className={`font-black font-mono ${
                            s.isHit ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                          }`}
                        >
                          {s.isHit ? `+${s.score}đ` : "Trượt (0đ)"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Tiêu chuẩn đánh giá bài bắn */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
                <div className="font-bold text-slate-600 dark:text-slate-300">Thang điểm chuẩn Quân đội:</div>
                {selectedExercise.scoringCriteria.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-500">
                    <span>{c.grade}:</span>
                    <span className="font-mono font-semibold">{c.minScore} - {c.maxScore} điểm</span>
                  </div>
                ))}
              </div>
            </div>

            {/* BẢNG BÁO CÁO TỔNG KẾT KHI BẮN XONG */}
            {isCompleted && (
              <div className="bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-500/10 dark:from-amber-950/30 dark:to-slate-900 border-2 border-amber-400 dark:border-amber-700 rounded-3xl p-5 shadow-xl space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Award className="w-6 h-6" />
                  <h4 className="font-black text-sm">BÁO CÁO KẾT QUẢ XẠ THỦ</h4>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  <strong>Nhận xét:</strong> {currentGrade.description}.
                  {shots.some((s) => !s.isHit)
                    ? ` (Có ${shots.filter((s) => !s.isHit).length} viên bắn trượt ra ngoài bia - cần giữ bình tĩnh, nín thở và lấy đường ngắm chuẩn).`
                    : totalScore >= 25
                    ? " Kỹ thuật ngắm bắn rất vững vàng, độ chụm đạn tốt!"
                    : " Cần chú ý giữ mặt súng thăng bằng và hạ đúng tầm đỉnh đầu ngắm."}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-amber-300/40 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <span>Thưởng kinh nghiệm:</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Zap className="w-3.5 h-3.5 fill-current" /> +{totalScore * 4} XP
                  </span>
                </div>
                <button
                  onClick={handleResetShots}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  Bắn Lại Lượt Mới
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ═══════════════════ TAB 2: HỆ THỐNG BIA & BÀI BẮN (HANDBOOK) ═══════════════════ */}
      {activeTab === "handbook" && (
        <div className="space-y-6">
          
          {/* Cụm 4 thẻ chọn bia chuẩn */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <Target className="w-5 h-5 text-red-600" /> Hệ Thống 4 Loại Bia Súng Tiểu Liên AK
              </h2>
              <span className="text-xs text-slate-400 font-medium">Chuẩn giáo trình Quân đội &amp; SGK GDQP</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {AK_TARGETS.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setHandbookTargetId(t.id)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                    handbookTargetId === t.id
                      ? "bg-red-500/10 border-red-500/60 dark:bg-red-950/40 shadow-md scale-[1.02]"
                      : "bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {t.distanceLabel}
                      </span>
                      <span className="text-[11px] font-bold text-red-600 dark:text-red-400">{t.postureLabel}</span>
                    </div>

                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{t.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">{t.subName}</p>
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <span>Kích thước: {t.dimensions.widthCm}x{t.dimensions.heightCm} cm</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chi tiết loại bia đang chọn */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Cột trái: Thông tin quy chuẩn */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-red-600 text-white font-black text-xs">
                  {handbookTarget.distanceLabel}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{handbookTarget.postureLabel}</span>
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{handbookTarget.name}</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                {handbookTarget.purpose}
              </p>

              <div className="space-y-2 pt-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
                  <div className="font-bold text-red-600 dark:text-red-400 mb-1">🎯 Điểm ngắm chuẩn với Thước ngắm 3:</div>
                  <p className="text-slate-600 dark:text-slate-300 font-sans">{handbookTarget.aimingPointThước3}</p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
                  <div className="font-bold text-blue-600 dark:text-blue-400 mb-1">💡 Mẹo sư phạm ghi nhớ thi cử:</div>
                  <p className="text-slate-600 dark:text-slate-300 font-sans">{handbookTarget.pedagogicalNotes}</p>
                </div>
              </div>
            </div>

            {/* Cột phải: Bảng vòng tính điểm */}
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="font-black text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Quy cách các vòng tính điểm
              </div>
              <div className="space-y-2">
                {handbookTarget.rings.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-white dark:bg-[#111827] rounded-xl text-xs border border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{r.description}</span>
                    <span className="font-black font-mono text-red-600 dark:text-red-400">{r.points} điểm</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BẢNG 3 BÀI BẮN CHÍNH QUY CỦA SÚNG AK */}
          <div className="space-y-4 pt-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" /> Các Bài Bắn Tiêu Chuẩn Súng Tiểu Liên AK
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {AK_EXERCISES.filter((e) => e.id !== "tap_dong_tien").map((ex) => (
                <div
                  key={ex.id}
                  className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-black text-[10px] font-mono">
                        {ex.distance}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">{ex.ammoCount} viên</span>
                    </div>

                    <h3 className="font-black text-base text-slate-900 dark:text-white">{ex.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">{ex.subtitle}</p>

                    <div className="space-y-1.5 pt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <div>• <strong>Tư thế:</strong> {ex.posture}</div>
                      <div>• <strong>Bia sử dụng:</strong> {ex.targetUsed}</div>
                      <div>• <strong>Hình thức:</strong> {ex.firingMode}</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-[11px]">
                    <div className="font-bold text-slate-700 dark:text-slate-300">Tiêu chuẩn xếp loại:</div>
                    {ex.scoringCriteria.slice(0, 3).map((c, i) => (
                      <div key={i} className="flex justify-between text-slate-500">
                        <span>{c.grade}:</span>
                        <span className="font-mono font-bold">{c.minScore}-{c.maxScore}đ</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ═══════════════════ TAB 3: THÍ NGHIỆM SAI SỐ ĐƯỜNG NGẮM (SIGHT LAB) ═══════════════════ */}
      {activeTab === "sightLab" && (
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-2 flex items-center gap-2">
              <Eye className="w-5 h-5 text-red-600" /> Khảo Sát Ảnh Hưởng Của Các Sai Lệch Đường Ngắm
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-sans max-w-3xl leading-relaxed">
              Theo quy luật hình học và vật lý của đường đạn súng AK: Sai lệch 1mm của đầu ngắm trên súng ở cự ly 100m sẽ làm điểm trúng trên bia bị lệch tới gần 30cm! Hãy chọn từng trường hợp dưới đây để quan sát trực quan:
            </p>

            {/* Các trường hợp sai số ngắm */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-6">
              {AIMING_ERROR_CASES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedErrorCaseId(c.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedErrorCaseId === c.id
                      ? "bg-red-600 text-white border-red-600 shadow-md scale-105"
                      : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <div className="font-black text-xs leading-snug">{c.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* MÔ HÌNH SO SÁNH SONG SONG: KHE NGẮM vs ĐIỂM CHẠM TRÊN BIA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Cột 1: Mắt nhìn qua khe ngắm */}
            <div className="lg:col-span-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-4">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  1. Góc Nhìn Mắt Xạ Thủ (Khe Ngắm &amp; Đầu Ngắm)
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                  Mô phỏng 1:1
                </span>
              </div>

              {/* Khung mô phỏng khe ngắm */}
              <div className="w-full h-64 bg-slate-900 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner">
                {/* Vành bảo vệ & Đầu ngắm thay đổi vị trí theo sai số */}
                <div
                  className="relative flex flex-col items-center transition-all duration-300"
                  style={{
                    transform: `translate(${selectedErrorCase.deviationDirection.x * 24}px, ${-selectedErrorCase.deviationDirection.y * 24}px)`,
                  }}
                >
                  <div className="w-16 h-16 rounded-full border-2 border-slate-500 border-b-transparent relative flex items-end justify-center mb-[-8px]">
                    <div className="w-2 h-7 bg-slate-100 rounded-t-xs" />
                  </div>
                </div>

                {/* Khe chữ U cố định */}
                <div className="absolute bottom-0 w-64 h-28 bg-slate-950 rounded-t-2xl border-t-2 border-slate-700 flex justify-center">
                  <div className="w-7 h-6 bg-transparent border-x-4 border-b-4 border-slate-950" />
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center font-sans">
                <strong>Tình trạng ngắm:</strong> {selectedErrorCase.sightCondition}
              </p>
            </div>

            {/* Cột 2: Điểm trúng thực tế trên bia */}
            <div className="lg:col-span-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-4">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  2. Điểm Đạn Găm Trên Bia Số 4 (100m)
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 font-mono font-bold">
                  {selectedErrorCase.impactResult}
                </span>
              </div>

              {/* Khung mô phỏng bia */}
              <div className="w-full h-64 bg-emerald-950/40 rounded-2xl flex items-center justify-center relative overflow-hidden border border-emerald-900/40 shadow-inner">
                {/* Hình bia số 4 */}
                <div className="w-44 h-44 rounded-full border border-emerald-500/30 flex items-center justify-center relative">
                  <div className="w-32 h-32 rounded-full border border-emerald-500/40 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border border-emerald-500/60 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-600/80 border border-emerald-400 flex items-center justify-center text-[10px] font-bold text-white">
                        10
                      </div>
                    </div>
                  </div>

                  {/* Lỗ đạn rơi tại vị trí sai số */}
                  <div
                    className="absolute w-4 h-4 rounded-full bg-red-600 border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 animate-pulse"
                    style={{
                      left: `calc(50% + ${selectedErrorCase.deviationDirection.x * 65}px)`,
                      top: `calc(50% - ${selectedErrorCase.deviationDirection.y * 65}px)`,
                    }}
                  />
                </div>
              </div>

              <div className="w-full mt-4 space-y-2">
                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/50 text-xs">
                  <span className="font-bold text-red-700 dark:text-red-400">Nguyên nhân vật lý:</span>{" "}
                  <span className="text-slate-700 dark:text-slate-300 font-sans">{selectedErrorCase.explanation}</span>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">Cách sửa động tác:</span>{" "}
                  <span className="text-slate-700 dark:text-slate-300 font-sans">{selectedErrorCase.correction}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
