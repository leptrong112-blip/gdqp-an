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

interface ShotRecord {
  shotNumber: number;
  x: number; // Tọa độ trên bia từ -1 đến 1
  y: number; // Tọa độ trên bia từ -1 đến 1
  score: number;
  clockPosition: string; // "12 giờ", "3 giờ", "chính tâm"...
  time: number;
}

export default function ShootingRangeSection() {
  const { fireXPToast, recordSkillCompletion } = useGamification();

  // Tab điều hướng chính
  const [activeTab, setActiveTab] = useState<"simulator" | "handbook" | "sightLab">("simulator");

  // State chọn bài bắn & bia
  const [selectedExerciseId, setSelectedExerciseId] = useState<ExerciseId>("tap_dong_tien");
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
  const [aimPos, setAimPos] = useState({ x: 0, y: 0.1 });
  const [isHoldingBreath, setIsHoldingBreath] = useState(false);
  const [breathSecondsLeft, setBreathSecondsLeft] = useState(4);
  const [rearSightSetting, setRearSightSetting] = useState<"3" | "1" | "P">("3");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isAimingDownSights, setIsAimingDownSights] = useState(true);
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

  // Tính điểm viên đạn dựa theo khoảng cách từ tâm và quy chuẩn bài bắn
  const calculateScore = (
    dx: number,
    dy: number,
    target: TargetInfo,
    sight: "3" | "1" | "P",
    isAds: boolean
  ): { score: number; clock: string; hitX: number; hitY: number } => {
    // Nếu không ngắm bắn (Hipfire / bắn từ hông): độ tản mát đạn tăng ngẫu nhiên
    let spreadX = 0;
    let spreadY = 0;
    if (!isAds) {
      spreadX = (Math.random() - 0.5) * 0.35;
      spreadY = (Math.random() - 0.5) * 0.35;
    }

    let bulletX = dx + spreadX;
    let bulletY = dy + spreadY;

    // Với thước ngắm 3 bắn ở 100m bia 4: ngắm mép dưới (y = -0.42) thì đạn bay vọt lên đúng tâm (y = 0)!
    if (target.id === "bia_4" && sight === "3") {
      bulletY = bulletY + 0.42; // Bù đường đạn bay cao 28cm
    } else if (target.id === "bia_6" && sight === "3") {
      bulletY = bulletY + 0.35;
    } else if (target.id === "bia_8" && sight === "3") {
      bulletY = bulletY + 0.25;
    }

    const dist = Math.sqrt(bulletX * bulletX + bulletY * bulletY);

    // Xác định hướng giờ (clock position)
    let clock = "Chính tâm 10";
    if (dist > 0.08) {
      const angle = Math.atan2(bulletX, -bulletY) * (180 / Math.PI); // 0 độ là 12h, 90 độ là 3h
      let normalizedAngle = (angle + 360) % 360;
      const hour = Math.round(normalizedAngle / 30) || 12;
      clock = `hướng ${hour} giờ`;
    }

    // Tính điểm theo bán kính bia
    let score = 0;
    if (target.id === "dong_tien") {
      if (dist < 0.12) score = 10;
      else if (dist < 0.25) score = 9;
      else if (dist < 0.40) score = 8;
      else if (dist < 0.60) score = 7;
      else if (dist < 0.85) score = 6;
      else score = 0;
    } else if (target.id === "bia_4") {
      if (dist < 0.15) score = 10;
      else if (dist < 0.30) score = 9;
      else if (dist < 0.45) score = 8;
      else if (dist < 0.65) score = 7;
      else if (dist < 0.85) score = 6;
      else if (dist < 1.1) score = 5;
      else score = 0;
    } else {
      if (dist < 0.20) score = 10;
      else if (dist < 0.40) score = 9;
      else if (dist < 0.60) score = 8;
      else if (dist < 0.85) score = 7;
      else if (dist < 1.1) score = 6;
      else score = 0;
    }

    return { score, clock, hitX: bulletX, hitY: bulletY };
  };

  // Thao tác bóp cò bắn
  const handleFire = useCallback(
    (customX?: number, customY?: number) => {
      if (!hasStarted || isShooting || isCompleted) return;
      if (shots.length >= selectedExercise.ammoCount) return;

      setIsShooting(true);
      playGunshotSound();

      // Hiệu ứng giật nảy súng lên trên (Recoil kick)
      const kickY = -0.15 + (Math.random() - 0.5) * 0.05;
      const kickX = (Math.random() - 0.5) * 0.08;
      setRecoilOffset({ x: kickX, y: kickY });

      // Tọa độ thực của đầu ngắm khi bóp cò (kết hợp tọa độ người ngắm + sway)
      const baseX = customX !== undefined ? customX : aimPos.x;
      const baseY = customY !== undefined ? customY : aimPos.y;
      const currentAimX = baseX + swayOffset.x;
      const currentAimY = baseY + swayOffset.y;

      const { score, clock, hitX, hitY } = calculateScore(
        currentAimX,
        currentAimY,
        currentTarget,
        rearSightSetting,
        isAimingDownSights
      );

      const newShot: ShotRecord = {
        shotNumber: shots.length + 1,
        x: hitX,
        y: hitY,
        score,
        clockPosition: clock,
        time: Date.now(),
      };

      const nextShots = [...shots, newShot];
      setShots(nextShots);

      // Thông báo đài báo bia
      const modeText = isAimingDownSights ? "" : " (Bắn từ hông)";
      const reportText =
        score > 0
          ? `Viên ${newShot.shotNumber}: ${score} Điểm (${clock})${modeText}!`
          : `Viên ${newShot.shotNumber}: Trượt ra ngoài bia${modeText}!`;
      setLastShotReport(reportText);

      // Hồi phục sau giật (recoil settle)
      setTimeout(() => {
        setRecoilOffset({ x: 0, y: 0 });
        setIsShooting(false);
      }, 280);

      // Kiểm tra hoàn thành bài bắn
      if (nextShots.length >= selectedExercise.ammoCount) {
        setTimeout(() => {
          setIsCompleted(true);
          const total = nextShots.reduce((acc, s) => acc + s.score, 0);
          fireXPToast(total * 4, `Hoàn thành ${selectedExercise.title}`);
          recordSkillCompletion("ak_shooting");
        }, 900);
      }
    },
    [
      hasStarted,
      isShooting,
      isCompleted,
      shots,
      selectedExercise,
      playGunshotSound,
      aimPos.x,
      aimPos.y,
      swayOffset.x,
      swayOffset.y,
      currentTarget,
      rearSightSetting,
      isAimingDownSights,
      fireXPToast,
      recordSkillCompletion,
    ]
  );

  // Reset bài bắn
  const handleResetShots = useCallback(() => {
    setShots([]);
    setLastShotReport(null);
    setIsCompleted(false);
    setAimPos({ x: 0, y: currentTarget.id === "bia_4" && rearSightSetting === "3" ? -0.42 : 0 });
  }, [currentTarget.id, rearSightSetting]);

  // Thay đổi bài bắn (chuyển sang bài mới sẽ hiện màn hình Bắt đầu)
  const handleChangeExercise = (exId: ExerciseId) => {
    setSelectedExerciseId(exId);
    setShots([]);
    setLastShotReport(null);
    setIsCompleted(false);
    setHasStarted(false);
    const target = getTargetForExercise(exId);
    setAimPos({ x: 0, y: target.id === "bia_4" ? -0.42 : 0 });
  };

  // Xử lý di chuột trên thao trường ngắm
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasStarted || isShooting || isCompleted) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 .. 1
    const ny = -(((e.clientY - rect.top) / rect.height - 0.38) * 2.2); // căn giữa tâm bia
    setAimPos({
      x: Math.max(-1.2, Math.min(1.2, nx)),
      y: Math.max(-1.2, Math.min(1.2, ny)),
    });
  };

  // Xử lý nhấp chuột trên khung ngắm: Giữ chuột phải để nín thở, chuột trái bóp cò bắn ngay cả khi giữ chuột phải
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasStarted || isShooting || isCompleted) return;
    e.preventDefault();

    // Chuột phải (button === 2) -> Giữ để nín thở
    if (e.button === 2) {
      setIsHoldingBreath(true);
      return;
    }

    // Chuột giữa (button === 1) -> Đổi chế độ ngắm (ADS / Bắn từ hông)
    if (e.button === 1) {
      setIsAimingDownSights((prev) => !prev);
      return;
    }

    // Chuột trái (button === 0 HOẶC có cờ bitmask buttons & 1, kể cả khi buttons = 3 tức đang giữ chuột phải)
    if (e.button === 0 || (e.buttons & 1)) {
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = -(((e.clientY - rect.top) / rect.height - 0.38) * 2.2);
      const targetX = Math.max(-1.2, Math.min(1.2, nx));
      const targetY = Math.max(-1.2, Math.min(1.2, ny));
      setAimPos({ x: targetX, y: targetY });
      handleFire(targetX, targetY);
    }
  };

  // Xử lý nhả chuột (nhả chuột phải -> thôi nín thở)
  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 2 || !(e.buttons & 2)) {
      setIsHoldingBreath(false);
    }
  };

  // Lắng nghe sự kiện nhả chuột toàn cục để đảm bảo không bị kẹt trạng thái nín thở
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (e.button === 2 || !(e.buttons & 2)) {
        setIsHoldingBreath(false);
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // Phím tắt bàn phím: Space / Enter để Bắt đầu hoặc Bắn, Q để đổi Ngắm bắn, Shift để Nín thở, R để Bắn lại
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== "simulator") return;
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
  }, [activeTab, hasStarted, playCockSound, handleFire, handleResetShots]);

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
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl shrink-0 border border-slate-200 dark:border-slate-700/60">
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
      {activeTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* CỘT TRÁI (8 COLS): KHUNG NHÌN THAO TRƯỜNG BẮN SÚNG */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Thanh điều khiển nhanh bài bắn & thước ngắm */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-3 rounded-2xl">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
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
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  <span className="text-[10px] text-slate-400 px-1">Thước:</span>
                  <button
                    onClick={() => setRearSightSetting("3")}
                    className={`px-2 py-0.5 rounded-lg cursor-pointer ${
                      rearSightSetting === "3" ? "bg-red-600 text-white" : "text-slate-600 dark:text-slate-300"
                    }`}
                    title="Thước 3: Cự ly 100m ngắm chính giữa mép dưới bia số 4"
                  >
                    3
                  </button>
                  <button
                    onClick={() => setRearSightSetting("1")}
                    className={`px-2 py-0.5 rounded-lg cursor-pointer ${
                      rearSightSetting === "1" ? "bg-red-600 text-white" : "text-slate-600 dark:text-slate-300"
                    }`}
                    title="Thước 1: Ngắm chính giữa tâm bia"
                  >
                    1
                  </button>
                  <button
                    onClick={() => setRearSightSetting("P")}
                    className={`px-2 py-0.5 rounded-lg cursor-pointer ${
                      rearSightSetting === "P" ? "bg-red-600 text-white" : "text-slate-600 dark:text-slate-300"
                    }`}
                    title="Thước П: Thước bắn thẳng"
                  >
                    П
                  </button>
                </div>

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
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => setIsHoldingBreath(false)}
              onContextMenu={(e) => e.preventDefault()}
              className="relative w-full h-[460px] sm:h-[520px] rounded-3xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-2xl select-none cursor-crosshair group touch-none bg-gradient-to-b from-sky-400 via-sky-200 to-emerald-800"
            >
              {/* BẦU TRỜI & DÃY NÚI QUÂN SỰ XA XA (THAO TRƯỜNG THẬT) */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Mặt trời */}
                <div className="absolute top-8 right-16 w-16 h-16 rounded-full bg-yellow-200/80 blur-md pointer-events-none" />
                {/* Dãy núi xa xôi */}
                <svg className="absolute bottom-40 w-full h-32 opacity-35" preserveAspectRatio="none" viewBox="0 0 1000 300">
                  <path d="M0,300 L120,160 L280,240 L450,110 L620,220 L800,140 L950,230 L1000,300 Z" fill="#2d5a27" />
                </svg>
                {/* Ụ đất bảo an chắn đạn phía sau mục tiêu */}
                <div className="absolute bottom-32 w-full h-24 bg-gradient-to-t from-[#5a3e1b] via-[#6e4c22] to-[#805a29] border-t-4 border-[#3e2c14]" />
                {/* Thảm cỏ thao trường có vệt đất dẫn hướng */}
                <div className="absolute bottom-0 w-full h-36 bg-gradient-to-t from-emerald-950 via-emerald-900 to-emerald-800">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-yellow-300 via-transparent to-transparent" />
                </div>

                {/* Các cọc mốc cự ly tiêu chuẩn thao trường quân sự ở 2 bên mép */}
                <div className="absolute bottom-36 left-4 sm:left-8 flex items-center gap-1 opacity-70">
                  <div className="w-1 h-6 bg-white border border-red-600" />
                  <span className="text-[9px] font-mono font-bold text-amber-200 bg-black/50 px-1 rounded">200M</span>
                </div>
                <div className="absolute bottom-28 left-8 sm:left-14 flex items-center gap-1 opacity-70">
                  <div className="w-1 h-8 bg-white border border-red-600" />
                  <span className="text-[9px] font-mono font-bold text-amber-200 bg-black/50 px-1 rounded">150M</span>
                </div>
                <div className="absolute bottom-16 left-12 sm:left-20 flex items-center gap-1 opacity-80">
                  <div className="w-1.5 h-10 bg-white border border-red-600" />
                  <span className="text-[10px] font-mono font-extrabold text-amber-200 bg-black/60 px-1.5 py-0.5 rounded">100M</span>
                </div>
              </div>

              {/* TẤM BIA CỐ ĐỊNH Ở GIỮA THAO TRƯỜNG (KÍCH THƯỚC CHUẨN CỰ LY QUÂN SỰ) */}
              <div
                className={`absolute left-1/2 top-[38%] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 flex flex-col items-center ${
                  isAimingDownSights ? "scale-125" : "scale-100"
                }`}
              >
                {/* 1. BIA ĐỒNG TIỀN (10M - TẬP NGẮM BAN ĐẦU - CỰ LY GẦN) */}
                {currentTarget.id === "dong_tien" && (
                  <div className="flex flex-col items-center">
                    <div className="w-36 h-36 bg-amber-50 rounded-xl border-4 border-slate-700 shadow-2xl flex items-center justify-center relative">
                      {/* Các vòng tròn tính điểm đồng xu */}
                      <div className="w-32 h-32 rounded-full border border-slate-400 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full border border-slate-400 flex items-center justify-center">
                          <div className="w-18 h-18 rounded-full border border-slate-500 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full border border-slate-600 flex items-center justify-center bg-slate-200/60">
                              {/* Vòng 10 đồng xu vàng */}
                              <div className="w-6 h-6 rounded-full bg-amber-400 border-2 border-amber-600 flex items-center justify-center text-[9px] font-black text-amber-950 shadow-inner">
                                10
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Chữ chú thích trên bia */}
                      <span className="absolute top-1 text-[8px] font-bold text-slate-500 font-mono">BIA ĐỒNG TIỀN (10M)</span>

                      {/* Vết đạn trên bia đồng tiền */}
                      {shots.map((s) => (
                        <div
                          key={s.shotNumber}
                          className="absolute w-2.5 h-2.5 rounded-full bg-slate-900 border border-amber-400 shadow-md transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[7px] font-bold text-white z-10"
                          style={{
                            left: `calc(50% + ${s.x * 45}px)`,
                            top: `calc(50% - ${s.y * 45}px)`,
                          }}
                        >
                          {s.shotNumber}
                        </div>
                      ))}
                    </div>

                    {/* Cọc chân gỗ đỡ bia cắm đất */}
                    <div className="flex items-center gap-4">
                      <div className="w-1 h-8 bg-amber-950/90 shadow-sm" />
                      <div className="w-1 h-8 bg-amber-950/90 shadow-sm" />
                    </div>
                  </div>
                )}

                {/* 2. BIA SỐ 4 (100M - NẰM BẮN CÓ BỆ TỲ - NHỎ GỌN CHUẨN 100M) */}
                {currentTarget.id === "bia_4" && (
                  <div className="flex flex-col items-center">
                    <div className="w-22 h-22 sm:w-24 sm:h-24 relative flex items-center justify-center filter drop-shadow-md">
                      {/* Bia bán thân số 4 quân đội hình ngực người xanh lục */}
                      <svg className="w-full h-full" viewBox="0 0 200 200">
                        {/* Thân bia hình đầu vai người */}
                        <path
                          d="M 60 190 L 60 140 C 60 130 50 110 30 110 L 20 180 C 20 195 40 195 60 195 Z"
                          fill="#1b4332"
                        />
                        <path
                          d="M 140 190 L 140 140 C 140 130 150 110 170 110 L 180 180 C 180 195 160 195 140 195 Z"
                          fill="#1b4332"
                        />
                        {/* Đầu và ngực */}
                        <path
                          d="M 30,195 L 30,110 C 30,80 65,70 65,40 C 65,15 135,15 135,40 C 135,70 170,80 170,110 L 170,195 Z"
                          fill="#2d6a4f"
                          stroke="#1b4332"
                          strokeWidth="3"
                        />
                        {/* Vòng tròn tính điểm 6, 7, 8, 9, 10 nét trắng */}
                        <circle cx="100" cy="115" r="75" fill="none" stroke="#e8f5e9" strokeWidth="1.2" strokeDasharray="3 3" />
                        <circle cx="100" cy="115" r="58" fill="none" stroke="#e8f5e9" strokeWidth="1.5" />
                        <circle cx="100" cy="115" r="42" fill="none" stroke="#e8f5e9" strokeWidth="1.8" />
                        <circle cx="100" cy="115" r="26" fill="none" stroke="#e8f5e9" strokeWidth="2.2" />
                        <circle cx="100" cy="115" r="12" fill="#1b4332" stroke="#e8f5e9" strokeWidth="2.5" />
                        <text x="100" y="119" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">10</text>
                        <text x="100" y="93" fill="#ffffff" fontSize="10" textAnchor="middle">9</text>
                        <text x="100" y="77" fill="#ffffff" fontSize="10" textAnchor="middle">8</text>
                        <text x="100" y="61" fill="#ffffff" fontSize="9" textAnchor="middle">7</text>
                      </svg>

                      {/* Vết đạn trên bia số 4 */}
                      {shots.map((s) => (
                        <div
                          key={s.shotNumber}
                          className="absolute w-2 h-2 rounded-full bg-slate-900 border border-red-500 shadow-md transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[6px] font-bold text-white z-10"
                          style={{
                            left: `calc(50% + ${s.x * 26}px)`,
                            top: `calc(57% - ${s.y * 26}px)`,
                          }}
                        >
                          {s.shotNumber}
                        </div>
                      ))}
                    </div>

                    {/* Chân cọc cắm bia 100m trên bệ đất */}
                    <div className="w-1.5 h-6 bg-amber-950 shadow-sm" />
                    <div className="w-8 h-2 bg-amber-900/60 rounded-full blur-[1px]" />
                  </div>
                )}

                {/* 3. BIA SỐ 6 (150M - QUỲ BẮN - XA VÀ NHỎ HƠN BIA 4) */}
                {currentTarget.id === "bia_6" && (
                  <div className="flex flex-col items-center">
                    <div className="w-15 h-20 sm:w-16 sm:h-22 relative flex items-center justify-center filter drop-shadow-sm opacity-95">
                      {/* Bia số 6: Người quỳ bắn */}
                      <svg className="w-full h-full" viewBox="0 0 160 220">
                        <path
                          d="M 40,210 L 40,150 C 40,120 50,90 70,60 C 70,40 65,20 85,20 C 105,20 100,40 100,60 C 120,90 135,130 135,210 Z"
                          fill="#1e3a8a"
                          stroke="#172554"
                          strokeWidth="3.5"
                        />
                        <circle cx="85" cy="100" r="55" fill="none" stroke="#bfdbfe" strokeWidth="1.5" strokeDasharray="3 3" />
                        <circle cx="85" cy="100" r="35" fill="none" stroke="#bfdbfe" strokeWidth="2" />
                        <circle cx="85" cy="100" r="16" fill="#172554" stroke="#bfdbfe" strokeWidth="2.5" />
                        <text x="85" y="105" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">10</text>
                      </svg>

                      {/* Lỗ đạn bia số 6 */}
                      {shots.map((s) => (
                        <div
                          key={s.shotNumber}
                          className="absolute w-1.5 h-1.5 rounded-full bg-slate-900 border border-blue-400 shadow-xs transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[5px] font-bold text-white z-10"
                          style={{
                            left: `calc(50% + ${s.x * 18}px)`,
                            top: `calc(45% - ${s.y * 18}px)`,
                          }}
                        >
                          {s.shotNumber}
                        </div>
                      ))}
                    </div>

                    {/* Chân cọc cắm bia 150m */}
                    <div className="w-1 h-5 bg-amber-950/80" />
                    <div className="w-6 h-1.5 bg-amber-900/50 rounded-full blur-[1px]" />
                  </div>
                )}

                {/* 4. BIA SỐ 8 (200M - ĐỨNG BẮN - Ở XA TÍT TẮP, THON NHỎ CHUẨN 200M) */}
                {currentTarget.id === "bia_8" && (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-24 sm:w-11 sm:h-28 relative flex items-center justify-center filter drop-shadow-sm opacity-90">
                      {/* Bia số 8: Người đứng / người chạy ở cự ly xa 200m */}
                      <svg className="w-full h-full" viewBox="0 0 120 280">
                        <path
                          d="M 30,270 L 45,190 L 35,120 C 35,90 40,50 60,50 C 60,30 55,10 65,10 C 75,10 70,30 70,50 C 90,50 95,90 95,120 L 85,190 L 100,270 Z"
                          fill="#991b1b"
                          stroke="#7f1d1d"
                          strokeWidth="4"
                        />
                        <circle cx="65" cy="110" r="40" fill="none" stroke="#fecaca" strokeWidth="2" strokeDasharray="3 3" />
                        <circle cx="65" cy="110" r="22" fill="none" stroke="#fecaca" strokeWidth="2.5" />
                        <circle cx="65" cy="110" r="10" fill="#7f1d1d" stroke="#fecaca" strokeWidth="3" />
                        <text x="65" y="114" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">10</text>
                      </svg>

                      {/* Lỗ đạn bia số 8 */}
                      {shots.map((s) => (
                        <div
                          key={s.shotNumber}
                          className="absolute w-1.5 h-1.5 rounded-full bg-slate-900 border border-red-400 shadow-xs transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[5px] font-bold text-white z-10"
                          style={{
                            left: `calc(50% + ${s.x * 12}px)`,
                            top: `calc(40% - ${s.y * 12}px)`,
                          }}
                        >
                          {s.shotNumber}
                        </div>
                      ))}
                    </div>

                    {/* Chân cọc cắm bia 200m */}
                    <div className="w-1 h-4 bg-amber-950/70" />
                    <div className="w-5 h-1.5 bg-amber-900/40 rounded-full blur-[1px]" />
                  </div>
                )}
              </div>

              {/* HIỆU ỨNG LỬA ĐẦU NÒNG (MUZZLE FLASH) KHI BẮN */}
              {isShooting && (
                <div className="absolute inset-0 bg-amber-400/20 pointer-events-none flex items-center justify-center z-30 animate-ping">
                  <div className="w-36 h-36 rounded-full bg-yellow-300/60 blur-xl" />
                </div>
              )}

              {/* ══════════ 1. CHẾ ĐỘ NGẮM BẮN (ADS): THƯỚC NGẮM & ĐẦU NGẮM SÚNG AK DI CHUYỂN THEO CHUỘT ══════════ */}
              {isAimingDownSights && (
                <div
                  className="absolute pointer-events-none z-20 transition-transform duration-75 ease-out"
                  style={{
                    left: `calc(50% + ${(aimPos.x + swayOffset.x) * 50}% + ${recoilOffset.x * 60}px)`,
                    top: `calc(38% - ${((aimPos.y + swayOffset.y) / 2.2) * 100}% + ${recoilOffset.y * 80}px)`,
                    transform: "translate(-50%, -18px)",
                  }}
                >
                  {/* CỤM ĐẦU NGẮM & THƯỚC NGẮM SÚNG TIỂU LIÊN AK */}
                  <div className="relative flex flex-col items-center">
                    {/* Vành bảo vệ đầu ngắm hình tròn khuyết & Cọc đầu ngắm (ở xa) */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-slate-900 border-b-transparent relative flex items-end justify-center mb-[-10px] sm:mb-[-12px] shadow-sm">
                      {/* Cọc đầu ngắm hình trụ thẳng đứng */}
                      <div className="w-2 sm:w-2.5 h-7 sm:h-9 bg-slate-950 rounded-t-xs shadow-md relative">
                        {/* Vạch dạ quang trên đỉnh đầu ngắm để lấy đường ngắm */}
                        <div className="w-full h-1.5 sm:h-2 bg-emerald-400 rounded-t-xs shadow-[0_0_8px_#34d399]" />
                      </div>
                    </div>

                    {/* Khe thước ngắm chữ U (ở gần mắt người bắn) */}
                    <div className="w-64 sm:w-72 h-32 sm:h-36 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-800 rounded-t-3xl border-t-2 border-slate-600 shadow-2xl relative flex justify-center">
                      {/* Khe chữ U chính giữa mép trên thước ngắm */}
                      <div className="absolute top-0 w-7 sm:w-8 h-5 sm:h-6 bg-transparent border-x-4 border-b-4 border-slate-950 rounded-b-xs" />
                      {/* Thân nắp hộp khóa nòng súng AK kéo dài xuống dưới */}
                      <div className="absolute top-10 sm:top-12 w-52 sm:w-60 h-28 bg-gradient-to-b from-slate-900 to-slate-950 rounded-t-xl border-t border-slate-700/60" />
                      {/* Chữ số khắc trên thước ngắm */}
                      <span className="absolute bottom-3 sm:bottom-4 text-[11px] sm:text-xs font-mono font-black text-slate-400 tracking-widest z-10">
                        AK-47 • THƯỚC [{rearSightSetting}]
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════ 2. CHẾ ĐỘ KHÔNG NGẮM (HIPFIRE): TÂM NGẮM CROSSHAIR + SÚNG HẠ XUỐNG GÓC PHẢI ══════════ */}
              {!isAimingDownSights && (
                <>
                  {/* Tâm ngắm chữ thập (Crosshair) di chuyển theo chuột */}
                  <div
                    className="absolute pointer-events-none z-20 flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `calc(50% + ${(aimPos.x + swayOffset.x) * 50}% + ${recoilOffset.x * 30}px)`,
                      top: `calc(38% - ${((aimPos.y + swayOffset.y) / 2.2) * 100}% + ${recoilOffset.y * 40}px)`,
                    }}
                  >
                    {/* Chấm tròn tâm màu đỏ */}
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                    {/* 4 vạch ngắm chữ thập chiến thuật */}
                    <div className="absolute -left-6 w-3.5 h-0.5 bg-white/90 rounded-full shadow-sm" />
                    <div className="absolute -right-6 w-3.5 h-0.5 bg-white/90 rounded-full shadow-sm" />
                    <div className="absolute -top-6 w-0.5 h-3.5 bg-white/90 rounded-full shadow-sm" />
                    <div className="absolute -bottom-6 w-0.5 h-3.5 bg-white/90 rounded-full shadow-sm" />
                    {/* Vòng tròn tản mát đạn */}
                    <div className="w-14 h-14 rounded-full border border-red-400/30 animate-pulse pointer-events-none" />
                  </div>

                  {/* Súng AK-47 ở góc nhìn từ hông (bottom-right) */}
                  <div
                    className="absolute -bottom-8 right-2 sm:right-8 pointer-events-none z-20 transition-transform duration-75 origin-bottom-right"
                    style={{
                      transform: `translate(${aimPos.x * 14 + recoilOffset.x * 40}px, ${-aimPos.y * 8 + recoilOffset.y * 70}px) rotate(-6deg)`,
                    }}
                  >
                    <svg className="w-56 h-40 sm:w-72 sm:h-52 drop-shadow-2xl" viewBox="0 0 320 200" fill="none">
                      {/* Nòng súng thép */}
                      <rect x="25" y="65" width="135" height="10" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
                      <rect x="65" y="54" width="85" height="9" rx="2" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
                      {/* Đầu vát nòng súng AK */}
                      <polygon points="12,63 26,63 26,77 12,74" fill="#0f172a" />
                      {/* Cọc đầu ngắm và vành */}
                      <circle cx="40" cy="53" r="9" stroke="#0f172a" strokeWidth="2.5" fill="none" />
                      <rect x="39" y="49" width="2" height="6" fill="#34d399" />
                      {/* Ốp lót tay trên và dưới bằng gỗ */}
                      <rect x="80" y="51" width="65" height="12" rx="3" fill="#9a3412" stroke="#7c2d12" strokeWidth="1.5" />
                      <rect x="75" y="67" width="75" height="18" rx="4" fill="#b45309" stroke="#78350f" strokeWidth="2" />
                      {/* Hộp khóa nòng thép đen */}
                      <rect x="150" y="58" width="105" height="38" rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="2.5" />
                      {/* Hộp tiếp đạn cong 30 viên súng AK */}
                      <path d="M 175,96 Q 190,145 215,175 L 188,184 Q 163,150 152,96 Z" fill="#334155" stroke="#0f172a" strokeWidth="2" />
                      {/* Vành cò & Cò súng */}
                      <path d="M 220,96 C 220,112 238,112 238,96" stroke="#0f172a" strokeWidth="2.5" fill="none" />
                      <path d="M 228,96 L 226,105" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
                      {/* Tay cầm (Pistol Grip) bằng gỗ */}
                      <path d="M 242,96 L 268,155 L 246,163 L 228,96 Z" fill="#9a3412" stroke="#7c2d12" strokeWidth="2" />
                      {/* Báng súng */}
                      <path d="M 250,65 L 320,78 L 320,122 L 250,90 Z" fill="#78350f" stroke="#451a03" strokeWidth="2" />
                    </svg>
                  </div>
                </>
              )}

              {/* ══════════ HUD GÓC TRÊN TRÁI: CỰ LY & CHẾ ĐỘ NGẮM (LUÔN RÕ RÀNG, KHÔNG BỊ SÚNG CHE) ══════════ */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-col gap-1.5 pointer-events-auto">
                <div className="flex items-center gap-2">
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
                    <span>{isAimingDownSights ? "🎯 Ngắm Bắn (ADS)" : "👀 Bắn Từ Hông"}</span>
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
                <div className="bg-black/55 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-slate-300 flex items-center gap-2 pointer-events-none w-fit">
                  <span>🖱️ Chuột trái: Bắn</span>
                  <span>•</span>
                  <span>🫁 Giữ chuột phải: Nín thở</span>
                </div>
              </div>

              {/* ══════════ HUD GÓC TRÊN PHẢI: SỐ ĐẠN & BÁO BIA ══════════ */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex flex-col items-end gap-2 pointer-events-none">
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
                onPointerDown={(e) => e.stopPropagation()}
                onPointerMove={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-30 flex items-center justify-between pointer-events-auto gap-2"
              >
                <div className="flex items-center gap-2">
                  {/* Nút chuyển chế độ ngắm */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAimingDownSights(!isAimingDownSights);
                    }}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-2xl text-xs font-black shadow-lg transition-all cursor-pointer border ${
                      isAimingDownSights
                        ? "bg-amber-500 text-slate-950 border-amber-300 hover:bg-amber-400"
                        : "bg-black/60 text-slate-200 border-white/20 hover:bg-black/80"
                    }`}
                    title="Nhấn phím Q hoặc bấm vào đây để chuyển chế độ ngắm"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">{isAimingDownSights ? "Chế độ: Ngắm Bắn" : "Chế độ: Bắn Từ Hông"}</span>
                    <span className="sm:hidden">{isAimingDownSights ? "Ngắm Bắn" : "Bắn Hông"}</span>
                    <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-black/20">Q</span>
                  </button>

                  {/* Nút nín thở */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsHoldingBreath(!isHoldingBreath);
                    }}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-2xl text-xs font-black shadow-lg transition-all cursor-pointer border ${
                      isHoldingBreath
                        ? "bg-blue-600 text-white border-blue-400 scale-105"
                        : "bg-black/60 text-slate-200 border-white/20 hover:bg-black/80"
                    }`}
                    title="Giữ chuột phải hoặc bấm phím Shift để nín thở"
                  >
                    <span>🫁</span>
                    <span>{isHoldingBreath ? `Nín Thở (${breathSecondsLeft}s)` : "Nín Thở"}</span>
                    <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-black/20 hidden sm:inline">Chuột Phải / Shift</span>
                  </button>
                </div>

                {/* Nút Bóp cò bắn */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFire();
                  }}
                  disabled={isShooting || isCompleted}
                  className={`flex items-center gap-2 px-5 sm:px-7 py-3 rounded-2xl text-sm font-black shadow-xl transition-all cursor-pointer border ${
                    isCompleted
                      ? "bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed"
                      : isShooting
                      ? "bg-amber-500 text-slate-950 scale-95"
                      : "bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:brightness-110 text-white border-amber-400/50 shadow-red-600/40 hover:scale-105 active:scale-95"
                  }`}
                >
                  <Crosshair className="w-5 h-5" />
                  <span>{isCompleted ? "HẾT ĐẠN" : isShooting ? "ĐANG BẮN..." : "BÓP CÒ (BẮN)"}</span>
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
                    <span>🖱️ <strong>Chuột trái:</strong> Bóp cò</span>
                    <span>•</span>
                    <span>🫁 <strong>Giữ chuột phải:</strong> Nín thở</span>
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
                <span>🫁 <strong>Giữ Chuột phải / Shift:</strong> Nín thở</span>
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
                        <div className="font-black text-red-600 dark:text-red-400 font-mono">+{s.score}đ</div>
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
                  {totalScore >= 25 ? " Kỹ thuật ngắm bắn rất vững vàng, độ chụm đạn tốt!" : " Cần chú ý giữ mặt súng thăng bằng và hạ đúng tầm đỉnh đầu ngắm."}
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
