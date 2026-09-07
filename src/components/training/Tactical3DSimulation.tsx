import React, { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, useGLTF, useAnimations, Html, useProgress } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  Users,
  Move,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
  Eye,
  ShieldAlert,
  Compass,
} from "lucide-react";

// ── TYPES & DATA ─────────────────────────────────────────────────────────────
type CategoryType = "doingu" | "vandong" | "diahinh" | "laban";

interface ActionItem {
  id: string;
  name: string;
  keyPoints: string;
}

const DRILL_CATEGORIES: {
  id: CategoryType;
  title: string;
  icon: any;
  actions: ActionItem[];
}[] = [
  {
    id: "doingu",
    title: "Đội ngũ",
    icon: Users,
    actions: [
      {
        id: "nghiem",
        name: "Đứng nghiêm",
        keyPoints:
          "Người đứng thẳng, 2 gót chân sát nhau, 2 bàn chân mở rộng 45°. Ngực nở, vai thăng bằng, 2 tay buông tự nhiên dọc thân mình, mắt nhìn thẳng, nét mặt nghiêm trang.",
      },
      {
        id: "nghi",
        name: "Đứng nghỉ",
        keyPoints:
          "Trùng gối chân trái (hoặc chân phải), thân trên vẫn giữ tư thế đứng thẳng tự nhiên. Khi mỏi có thể đổi chân nhưng không di chuyển gót chân.",
      },
      {
        id: "quaytrai",
        name: "Quay bên trái",
        keyPoints:
          "Lấy gót chân trái và mũi chân phải làm trụ, quay người sang bên trái góc 90°. Sau đó rút chân phải lên áp sát chân trái về tư thế nghiêm dứt khoát.",
      },
      {
        id: "quayphai",
        name: "Quay bên phải",
        keyPoints:
          "Lấy gót chân phải và mũi chân trái làm trụ, quay người sang bên phải góc 90°. Sau đó rút chân trái lên áp sát chân phải về tư thế nghiêm dứt khoát.",
      },
      {
        id: "quaysau",
        name: "Quay đằng sau",
        keyPoints:
          "Lấy gót chân phải và mũi chân trái làm trụ, quay người sang bên phải hướng ra sau 180°. Sau đó rút chân trái về áp sát chân phải về tư thế nghiêm.",
      },
      {
        id: "dideu",
        name: "Đi đều",
        keyPoints:
          "Bước chân trái lên trước cách 60-75cm, đánh tay phải ra trước vuông góc với thắt lưng. Bước nhịp nhàng theo nhịp 1 - 2, 1 - 2 dứt khoát, thống nhất.",
      },
    ],
  },
  {
    id: "vandong",
    title: "Vận động",
    icon: Move,
    actions: [
      {
        id: "dikhom",
        name: "Đi khom",
        keyPoints:
          "Áp dụng khi vật che khuất cao ngang ngực. Thân người cúi khom 45°, hai gối chùng, súng ở tư thế sẵn sàng chiến đấu, bước đi nhẹ nhàng, giữ bí mật cao.",
      },
      {
        id: "chaykhom",
        name: "Chạy khom",
        keyPoints:
          "Áp dụng khi cần cơ động nhanh qua đoạn địa hình trống trải có vật che khuất thấp. Thân cúi thấp, bước chạy ngắn, sức bật bằng mũi bàn chân, mắt bao quát địch.",
      },
      {
        id: "bocao",
        name: "Bò cao",
        keyPoints:
          "Áp dụng khi địa hình có vật che khuất ngang tầm gối hoặc đất gồ ghề. Di chuyển bằng hai cẳng tay và hai đầu gối, súng kẹp sát sườn chắc chắn.",
      },
      {
        id: "truon",
        name: "Trườn dã chiến",
        keyPoints:
          "Áp dụng khi sát địch, hoả lực bắn thẳng dày đặc. Toàn thân nằm rạp sát mặt đất, dùng sức co nẩy của khuỷu tay và mũi bàn chân đẩy người trườn tới.",
      },
      {
        id: "vottien",
        name: "Vọt tiến",
        keyPoints:
          "Dùng sức bật mạnh của hai chân vụt đứng dậy chạy nhanh 3-5 bước vượt qua tầm ngắm của địch, sau đó lập tức nằm ngã ngửa ẩn nấp vào công sự.",
      },
    ],
  },
  {
    id: "diahinh",
    title: "Địa hình",
    icon: MapPin,
    actions: [
      {
        id: "chekhuat",
        name: "Vật che khuất (Bụi cây)",
        keyPoints:
          "Vật che khuất chỉ che giấu được hành động quan sát của địch, KHÔNG chống được mảnh bom hay đạn bắn thẳng (bụi cây, lùm cỏ, rèm lá). Phải giữ im lặng, không làm rung động cành lá.",
      },
      {
        id: "chedo",
        name: "Vật che đỡ (Bờ tường)",
        keyPoints:
          "Vật che đỡ VỪA che giấu được hành động VỪA chống đỡ được hoả lực đạn bắn thẳng (bờ tường gạch, gốc cây to). Tận dụng mép tường để tỳ súng bắn trả địch.",
      },
      {
        id: "baocat",
        name: "Công sự bao cát",
        keyPoints:
          "Công sự dã chiến đắp bằng bao cát hấp thụ động năng đạn, bảo vệ an toàn cho chiến sĩ. Kê nòng súng lên mặt bao cát tạo thế tỳ bắn ổn định.",
      },
      {
        id: "haoluyentap",
        name: "Giao thông hào",
        keyPoints:
          "Chiến hào giao thông kết nối các tổ chiến đấu, bảo vệ sinh lực trước pháo hỏa. Khi cơ động dưới hào phải cúi thấp đầu dưới mép hào.",
      },
      {
        id: "trongtrai",
        name: "Vùng trống trải",
        keyPoints:
          "Địa hình trống trải không có vật che chắn. Chiến sĩ phải triệt để áp dụng động tác trườn sát mặt đất, lợi dụng thời cơ đêm tối, khói bụi để vượt qua.",
      },
    ],
  },
  {
    id: "laban",
    title: "La bàn",
    icon: Compass,
    actions: [
      {
        id: "monap",
        name: "Mở nắp la bàn",
        keyPoints:
          "Mở nắp hộp tạo góc 45° đến 90° để nhìn thấy mặt số phản chiếu trong gương và ngắm thẳng qua khe ngắm tới mục tiêu ngoài thực địa.",
      },
      {
        id: "needle_demo",
        name: "Kim chỉ hướng Bắc",
        keyPoints:
          "Đặt địa bàn thăng bằng trên lòng bàn tay ngang ngực. Đầu kim nam châm sơn đỏ phát quang luôn tự do định vị và chỉ chính xác về cực Bắc từ.",
      },
      {
        id: "dongnap",
        name: "Đóng nắp bảo vệ",
        keyPoints:
          "Trước khi cơ động hành quân, gập nắp la bàn lại. Càng hãm sẽ nâng kim nam châm khỏi đầu nhọn trụ quay, bảo vệ kim không bị mòn hoặc gãy.",
      },
      {
        id: "dophuongvi",
        name: "Đo góc phương vị",
        keyPoints:
          "Gióng khe ngắm - sợi chỉ ngắm - mục tiêu. Nhìn qua gương phản chiếu đọc góc trên vòng chia độ (0° - 360°) và thang ly giác quân sự (60-00).",
      },
    ],
  },
];

// ── CAMERA RIG (TỰ ĐỘNG CÂN BẰNG TỌA ĐỘ THEO ĐỘNG TÁC) ──────────────────────
function CameraRig({
  cameraPos,
  targetPos,
  resetSignal,
  controlsRef,
}: {
  cameraPos: [number, number, number];
  targetPos: [number, number, number];
  resetSignal: number;
  controlsRef: React.RefObject<any>;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (camera) {
      camera.position.set(cameraPos[0], cameraPos[1], cameraPos[2]);
    }
    if (controlsRef.current) {
      controlsRef.current.target.set(targetPos[0], targetPos[1], targetPos[2]);
      controlsRef.current.update();
    }
  }, [cameraPos, targetPos, resetSignal, camera, controlsRef]);

  return null;
}

// ── 3D LOADING PLACEHOLDER ──────────────────────────────────────────────────
function Simulation3DLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/90 border border-red-500/30 backdrop-blur-md shadow-2xl min-w-[200px] text-center pointer-events-none select-none">
        <div className="w-9 h-9 border-3 border-red-500/20 border-t-red-500 rounded-full animate-spin mb-2.5" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Đang tải mô hình 3D...</span>
        <span className="text-[11px] font-mono text-red-400 mt-1">{progress.toFixed(0)}%</span>
        <div className="w-36 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300"
            style={{ width: `${Math.max(8, progress)}%` }}
          />
        </div>
      </div>
    </Html>
  );
}

// ── ACTION CONFIGURATION: MAPPING MỖI ĐỘNG TÁC VỚI MODEL GLB CHUẨN ──────────
interface ActionConfig {
  modelPath: string;
  animName: string;
  playbackSpeed: number;
  position: [number, number, number];
  rotationY?: number;
  camPos: [number, number, number];
  camTarget: [number, number, number];
}

function getActionConfig(category: CategoryType, actionId: string): ActionConfig {
  // ── 1. ĐỘI NGŨ (vietnam_people_army_rigged.glb - CHIẾN SĨ QĐNDVN) ──
  if (category === "doingu") {
    const animMap: Record<string, string> = {
      nghiem: "Nghiem",
      nghi: "Nghi",
      quaytrai: "QuayTrai_90",
      quayphai: "QuayPhai_90",
      quaysau: "QuaySau_180",
      dideu: "DiDeu",
    };
    return {
      modelPath: "/models/vietnam_people_army_rigged.glb",
      animName: animMap[actionId] || "Nghiem",
      playbackSpeed: actionId.startsWith("quay") ? 0.75 : 1.0,
      position: [0, 0, 0],
      rotationY: 0,
      camPos: [0, 1.35, 2.5],
      camTarget: [0, 0.75, 0],
    };
  }

  // ── 2. VẬN ĐỘNG CHIẾN ĐẤU (02_gdqp_van_dong_co_ban.glb) ──
  if (category === "vandong") {
    switch (actionId) {
      case "dikhom":
        return {
          modelPath: "/models/02_gdqp_van_dong_co_ban.glb",
          animName: "DiKhom",
          playbackSpeed: 1.0,
          position: [0, 0, 0],
          rotationY: 0,
          camPos: [0, 1.3, 2.8],
          camTarget: [0, 0.7, 0],
        };
      case "chaykhom":
        return {
          modelPath: "/models/02_gdqp_van_dong_co_ban.glb",
          animName: "DiKhom",
          playbackSpeed: 1.7,
          position: [0, 0, 0],
          rotationY: 0,
          camPos: [0, 1.3, 2.8],
          camTarget: [0, 0.7, 0],
        };
      case "bocao":
        return {
          modelPath: "/models/02_gdqp_van_dong_co_ban.glb",
          animName: "Bo",
          playbackSpeed: 1.0,
          position: [0, 0, 0],
          rotationY: 0,
          camPos: [0, 1.0, 2.5],
          camTarget: [0, 0.35, 0],
        };
      case "truon":
        return {
          modelPath: "/models/02_gdqp_van_dong_co_ban.glb",
          animName: "Truon",
          playbackSpeed: 1.0,
          position: [0, 0, 0],
          rotationY: 0,
          camPos: [0, 0.8, 2.4],
          camTarget: [0, 0.25, 0],
        };
      case "vottien":
        return {
          modelPath: "/models/02_gdqp_van_dong_co_ban.glb",
          animName: "VotTien",
          playbackSpeed: 1.2,
          position: [0, 0, 0],
          rotationY: 0,
          camPos: [0, 1.3, 3.0],
          camTarget: [0, 0.65, 0],
        };
      default:
        return {
          modelPath: "/models/02_gdqp_van_dong_co_ban.glb",
          animName: "DiKhom",
          playbackSpeed: 1.0,
          position: [0, 0, 0],
          rotationY: 0,
          camPos: [0, 1.3, 2.8],
          camTarget: [0, 0.7, 0],
        };
    }
  }

  // ── 3. ĐỊA HÌNH ĐỊA VẬT (03_gdqp_dia_hinh_dia_vat.glb + Soldier) ──
  if (category === "diahinh") {
    switch (actionId) {
      case "chekhuat":
        return {
          modelPath: "/models/02_gdqp_van_dong_co_ban.glb",
          animName: "DiKhom",
          playbackSpeed: 0.8,
          position: [-3.7, 0, 2.15],
          rotationY: 0,
          camPos: [-3.7, 1.4, 4.4],
          camTarget: [-3.7, 0.7, 2.45],
        };
      case "chedo":
        return {
          modelPath: "/models/02_gdqp_van_dong_co_ban.glb",
          animName: "DiKhom",
          playbackSpeed: 0.8,
          position: [3.65, 0, -2.6],
          rotationY: 0,
          camPos: [3.65, 1.4, -0.7],
          camTarget: [3.65, 0.65, -2.2],
        };
      case "baocat":
        return {
          modelPath: "/models/02_gdqp_van_dong_co_ban.glb",
          animName: "DiKhom",
          playbackSpeed: 0.8,
          position: [0, 0, -4.45],
          rotationY: 0,
          camPos: [0, 1.4, -2.4],
          camTarget: [0, 0.65, -4.05],
        };
      case "haoluyentap":
        return {
          modelPath: "/models/02_gdqp_van_dong_co_ban.glb",
          animName: "Bo",
          playbackSpeed: 0.9,
          position: [0, -0.2, 3.55],
          rotationY: 0,
          camPos: [0, 1.4, 5.5],
          camTarget: [0, 0.35, 3.55],
        };
      case "trongtrai":
      default:
        return {
          modelPath: "/models/02_gdqp_van_dong_co_ban.glb",
          animName: "Truon",
          playbackSpeed: 1.0,
          position: [0, 0, 0],
          rotationY: 0,
          camPos: [0, 0.9, 2.5],
          camTarget: [0, 0.25, 0],
        };
    }
  }

  // ── 4. LA BÀN QUÂN SỰ (04_gdqp_la_ban.glb) ──
  return {
    modelPath: "/models/04_gdqp_la_ban.glb",
    animName: actionId === "monap" ? "MoNap" : actionId === "dongnap" ? "DongNap" : "NeedleDemo",
    playbackSpeed: 1.0,
    position: [0, 0, 0],
    rotationY: 0,
    camPos: [0, 2.4, 3.2],
    camTarget: [0, 0.25, 0],
  };
}

// ── 3D CHIẾN SĨ GLB (TỰ ĐỘNG CHƠI ĐÚNG ANIMATION CLIP ĐƯỢC CHỈ ĐỊNH) ─────────
interface DynamicSoldierGLBProps {
  modelPath: string;
  position: [number, number, number];
  rotationY?: number;
  isPaused: boolean;
  playbackSpeed?: number;
  animName: string;
  resetSignal?: number;
}

function DynamicSoldierGLB({
  modelPath,
  position,
  rotationY = 0,
  isPaused,
  playbackSpeed = 1,
  animName,
  resetSignal = 0,
}: DynamicSoldierGLBProps) {
  const rootRef = useRef<THREE.Group>(null);
  const animRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(modelPath);

  // Nhân bản scene an toàn bằng SkeletonUtils để hỗ trợ chế độ Đội hình 3 người đồng diễn
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  const { actions, names } = useAnimations(animations, animRef);

  useEffect(() => {
    if (!actions || names.length === 0) return;
    const clipName = actions[animName] ? animName : names[0];
    const action = actions[clipName];
    if (!action) return;

    let timeoutId: any = null;
    let cancelReplay = false;
    const isTurn = animName.startsWith("Quay");

    const playClip = () => {
      if (cancelReplay) return;
      action.reset();
      if (isTurn) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      } else {
        action.setLoop(THREE.LoopRepeat, Infinity);
      }
      action.timeScale = isPaused ? 0 : playbackSpeed;
      action.fadeIn(0.2).play();
    };

    playClip();

    const mixer = action.getMixer();
    const handleFinished = (e: any) => {
      if (e.action === action && isTurn && !cancelReplay) {
        // Sau khi hoàn thành động tác quay, giữ nguyên tư thế nghiêm chuẩn 1.8s để học sinh quan sát, sau đó lặp lại nhịp nhàng
        timeoutId = setTimeout(() => {
          if (!cancelReplay) {
            action.fadeOut(0.25);
            timeoutId = setTimeout(() => {
              if (!cancelReplay) {
                playClip();
              }
            }, 200);
          }
        }, 1800);
      }
    };

    mixer.addEventListener("finished", handleFinished);

    return () => {
      cancelReplay = true;
      if (timeoutId) clearTimeout(timeoutId);
      mixer.removeEventListener("finished", handleFinished);
      action.fadeOut(0.2);
    };
  }, [actions, animName, names, playbackSpeed, isPaused, modelPath, resetSignal]);

  useEffect(() => {
    const clipName = actions?.[animName] ? animName : names[0];
    if (clipName && actions?.[clipName]) {
      actions[clipName].timeScale = isPaused ? 0 : playbackSpeed;
    }
  }, [isPaused, playbackSpeed, actions, animName, names]);

  return (
    <group ref={rootRef} position={position} rotation={[0, rotationY, 0]}>
      <group ref={animRef}>
        <primitive object={clonedScene} />
      </group>
    </group>
  );
}

// ── 3D SA BÀN THAO TRƯỜNG THỰC ĐỊA (03_gdqp_dia_hinh_dia_vat.glb) ─────────────
function TacticalTerrain3D() {
  const { scene } = useGLTF("/models/03_gdqp_dia_hinh_dia_vat.glb");
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  return (
    <group position={[0, 0, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

// ── 3D ĐỊA BÀN / LA BÀN QUÂN SỰ (04_gdqp_la_ban.glb) ──────────────────────────
function Compass3D({
  activeActionId,
  isPaused,
}: {
  activeActionId: string;
  isPaused: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF("/models/04_gdqp_la_ban.glb");
  const { actions } = useAnimations(animations, groupRef);

  useEffect(() => {
    if (!actions) return;

    // Dừng êm các action trước đó
    Object.values(actions).forEach((act) => {
      act?.fadeOut(0.15);
    });

    if (activeActionId === "monap") {
      const act = actions["MoNap"];
      if (act) {
        act.reset();
        act.setLoop(THREE.LoopOnce, 1);
        act.clampWhenFinished = true;
        act.timeScale = isPaused ? 0 : 1;
        act.fadeIn(0.15).play();
      }
    } else if (activeActionId === "dongnap") {
      const act = actions["DongNap"];
      if (act) {
        act.reset();
        act.setLoop(THREE.LoopOnce, 1);
        act.clampWhenFinished = true;
        act.timeScale = isPaused ? 0 : 1;
        act.fadeIn(0.15).play();
      }
    } else if (activeActionId === "needle_demo" || activeActionId === "dophuongvi") {
      // Đảm bảo nắp ở trạng thái mở để nhìn thấy kim và mặt gương
      const moAct = actions["MoNap"];
      if (moAct) {
        moAct.reset();
        moAct.time = moAct.getClip().duration;
        moAct.clampWhenFinished = true;
        moAct.setLoop(THREE.LoopOnce, 1);
        moAct.play();
      }
      const act = actions["NeedleDemo"];
      if (act) {
        act.reset();
        act.setLoop(THREE.LoopRepeat, Infinity);
        act.timeScale = isPaused ? 0 : 1;
        act.fadeIn(0.15).play();
      }
    }
  }, [actions, activeActionId, isPaused]);

  useEffect(() => {
    if (!actions) return;
    Object.values(actions).forEach((act) => {
      if (act && act.isRunning()) {
        act.timeScale = isPaused ? 0 : 1;
      }
    });
  }, [isPaused, actions]);

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={0.95}>
      <primitive object={scene} />
    </group>
  );
}

// ── MAIN TACTICAL DRILL 3D COMPONENT ─────────────────────────────────────────
export default function Tactical3DSimulation() {
  const [activeCategory, setActiveCategory] = useState<CategoryType>("doingu");
  const [selectedActionId, setSelectedActionId] = useState<string>("nghiem");
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [formationMode, setFormationMode] = useState<"single" | "squad">("squad");
  const [resetCount, setResetCount] = useState<number>(0);
  const controlsRef = useRef<any>(null);

  const currentCategoryObj =
    DRILL_CATEGORIES.find((c) => c.id === activeCategory) || DRILL_CATEGORIES[0];
  const activeAction =
    currentCategoryObj.actions.find((a) => a.id === selectedActionId) ||
    currentCategoryObj.actions[0];

  const actionConfig = useMemo(() => {
    return getActionConfig(activeCategory, activeAction.id);
  }, [activeCategory, activeAction.id]);

  const handleCategorySwitch = (catId: CategoryType) => {
    setActiveCategory(catId);
    const firstAction = DRILL_CATEGORIES.find((c) => c.id === catId)!.actions[0];
    setSelectedActionId(firstAction.id);
    if (catId === "doingu") {
      setFormationMode("squad");
    } else {
      setFormationMode("single");
    }
    setResetCount((c) => c + 1);
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* ── HEADER TITLE BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 tracking-widest block font-mono">
            Thực Hành Trực Quan 3D
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
            Mô phỏng Thao trường & Điều lệnh quân sự
          </h1>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-x-auto">
          {DRILL_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySwitch(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-red-600 text-white shadow-md"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAIN WORKSPACE GRID (3D STAGE & CONTROL PANEL) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT: 3D INTERACTIVE STAGE ───────────────────────────── */}
        <div className="lg:col-span-7 h-[420px] sm:h-[480px] lg:h-[520px] bg-slate-900 rounded-3xl overflow-hidden relative shadow-lg border border-slate-800 flex flex-col">
          {/* Stage Top Bar Controls: Formation Toggle or Context Badge */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            {activeCategory === "doingu" || activeCategory === "vandong" ? (
              <div className="flex items-center gap-1 bg-slate-950/85 backdrop-blur-md p-1 rounded-2xl border border-white/10 shadow-md">
                <button
                  onClick={() => setFormationMode("single")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    formationMode === "single"
                      ? "bg-red-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Xem chi tiết 1 chiến sĩ trung tâm"
                >
                  <span>👤 1 Chiến sĩ</span>
                </button>
                <button
                  onClick={() => setFormationMode("squad")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    formationMode === "squad"
                      ? "bg-red-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Xem đội hình đồng diễn 3 chiến sĩ"
                >
                  <span>👥 {activeCategory === "doingu" ? "Đội hình 3" : "Tổ 3 chiến sĩ"}</span>
                </button>
              </div>
            ) : activeCategory === "diahinh" ? (
              <div className="px-3 py-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/10 text-emerald-400 text-xs font-bold flex items-center gap-1.5 shadow-md">
                <MapPin className="w-3.5 h-3.5" />
                <span>Sa bàn thao trường tổng hợp</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/10 text-amber-400 text-xs font-bold flex items-center gap-1.5 shadow-md">
                <Compass className="w-3.5 h-3.5" />
                <span>Địa bàn quân sự 3D</span>
              </div>
            )}
          </div>

          {/* Reset Camera & Pause/Play Buttons */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <button
              onClick={() => setResetCount((c) => c + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md text-white text-xs font-bold border border-white/10 hover:bg-slate-800 transition-all cursor-pointer shadow-md"
              title="Đặt lại góc nhìn chuẩn ban đầu"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Góc nhìn chuẩn</span>
            </button>
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md text-white text-xs font-bold border border-white/10 hover:bg-slate-800 transition-all cursor-pointer shadow-md"
            >
              {isPaused ? (
                <Play className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Pause className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isPaused ? "Tiếp tục" : "Tạm dừng"}</span>
            </button>
          </div>

          {/* 3D CANVAS STAGE */}
          <div className="w-full h-full">
            <Canvas gl={{ antialias: true }}>
              <color attach="background" args={["#0c1420"]} />
              <ambientLight intensity={1.2} />
              <directionalLight position={[6, 12, 6]} intensity={1.8} castShadow />
              <directionalLight position={[-6, 8, -4]} intensity={0.9} />
              <pointLight position={[0, 4, 2]} intensity={0.8} />

              {/* Camera Controller syncing with selected action & reset button */}
              <CameraRig
                cameraPos={
                  formationMode === "squad" && (activeCategory === "doingu" || activeCategory === "vandong")
                    ? [actionConfig.camPos[0], actionConfig.camPos[1] + 0.35, actionConfig.camPos[2] + 1.3]
                    : actionConfig.camPos
                }
                targetPos={actionConfig.camTarget}
                resetSignal={resetCount}
                controlsRef={controlsRef}
              />

              {/* Lưới tọa độ dã chiến cho Đội ngũ, Vận động và La bàn */}
              {activeCategory !== "diahinh" && (
                <Grid
                  position={[0, -0.01, 0]}
                  args={[20, 20]}
                  cellSize={0.5}
                  cellThickness={1}
                  cellColor="#24384a"
                  sectionSize={2}
                  sectionThickness={1.5}
                  sectionColor="#3b566e"
                  fadeDistance={18}
                />
              )}

              {/* HIỂN THỊ MÔ HÌNH 3D CHUẨN XÁC THEO TỪNG DANH MỤC */}
              <Suspense fallback={<Simulation3DLoader />}>
                {activeCategory === "laban" ? (
                  <Compass3D activeActionId={activeAction.id} isPaused={isPaused} />
                ) : activeCategory === "diahinh" ? (
                  <group>
                    <TacticalTerrain3D />
                    <DynamicSoldierGLB
                      key={`${activeAction.id}-soldier-terrain`}
                      modelPath={actionConfig.modelPath}
                      position={actionConfig.position}
                      animName={actionConfig.animName}
                      isPaused={isPaused}
                      playbackSpeed={actionConfig.playbackSpeed}
                      rotationY={actionConfig.rotationY || 0}
                      resetSignal={resetCount}
                    />
                  </group>
                ) : formationMode === "single" ? (
                  <DynamicSoldierGLB
                    key={`${activeAction.id}-single`}
                    modelPath={actionConfig.modelPath}
                    position={actionConfig.position}
                    animName={actionConfig.animName}
                    isPaused={isPaused}
                    playbackSpeed={actionConfig.playbackSpeed}
                    rotationY={actionConfig.rotationY || 0}
                    resetSignal={resetCount}
                  />
                ) : (
                  <group position={[0, 0, 0]}>
                    <DynamicSoldierGLB
                      key={`${activeAction.id}-squad-left`}
                      modelPath={actionConfig.modelPath}
                      position={[
                        actionConfig.position[0] - 1.25,
                        actionConfig.position[1],
                        actionConfig.position[2],
                      ]}
                      animName={actionConfig.animName}
                      isPaused={isPaused}
                      playbackSpeed={actionConfig.playbackSpeed}
                      rotationY={actionConfig.rotationY || 0}
                      resetSignal={resetCount}
                    />
                    <DynamicSoldierGLB
                      key={`${activeAction.id}-squad-center`}
                      modelPath={actionConfig.modelPath}
                      position={actionConfig.position}
                      animName={actionConfig.animName}
                      isPaused={isPaused}
                      playbackSpeed={actionConfig.playbackSpeed}
                      rotationY={actionConfig.rotationY || 0}
                      resetSignal={resetCount}
                    />
                    <DynamicSoldierGLB
                      key={`${activeAction.id}-squad-right`}
                      modelPath={actionConfig.modelPath}
                      position={[
                        actionConfig.position[0] + 1.25,
                        actionConfig.position[1],
                        actionConfig.position[2],
                      ]}
                      animName={actionConfig.animName}
                      isPaused={isPaused}
                      playbackSpeed={actionConfig.playbackSpeed}
                      rotationY={actionConfig.rotationY || 0}
                      resetSignal={resetCount}
                    />
                  </group>
                )}
              </Suspense>

              <OrbitControls
                ref={controlsRef}
                enablePan={true}
                enableZoom={true}
                maxPolarAngle={Math.PI / 2 - 0.05}
                minDistance={0.8}
                maxDistance={12}
              />
            </Canvas>
          </div>

          {/* Floating Instructions */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-slate-300 text-[11px] font-medium flex items-center gap-1.5 pointer-events-none whitespace-nowrap">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Kéo chuột để xoay 360° · Cuộn chuột để phóng to/thu nhỏ</span>
          </div>
        </div>

        {/* ── RIGHT: CONTROL PANEL & KEY POINTS ─────────────────────── */}
        <div className="lg:col-span-5 space-y-4">
          {/* Selection Panel Card */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5 transition-colors">
            <div>
              <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 tracking-wider">
                {activeCategory === "laban"
                  ? "KỸ THUẬT ĐỊNH HƯỚNG CHIẾN THUẬT"
                  : activeCategory === "diahinh"
                  ? "LỢI DỤNG ĐỊA HÌNH ĐỊA VẬT"
                  : "ĐIỀU LỆNH & KĨ THUẬT CHIẾN ĐẤU"}
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {currentCategoryObj.title} {activeCategory === "laban" ? "quân sự" : "chuẩn tác chiến"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
                Chọn mục bên dưới để kích hoạt động tác và quan sát mô hình 3D thực hiện chuẩn xác.
              </p>
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {currentCategoryObj.actions.map((act) => {
                const isSelected = selectedActionId === act.id;
                return (
                  <button
                    key={act.id}
                    onClick={() => {
                      setSelectedActionId(act.id);
                      setResetCount((c) => c + 1);
                    }}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-emerald-700 dark:bg-emerald-600 text-white border-emerald-700 dark:border-emerald-600 shadow-md shadow-emerald-900/20"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <span>{act.name}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-white shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Điểm Cần Quan Sát Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-900/60 space-y-2.5">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Điểm cần quan sát & yêu cầu kỹ thuật
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans font-medium">
                {activeAction.keyPoints}
              </p>
            </div>

            {/* Teacher Note */}
            <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300 font-sans flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                Mô hình 3D thực tế xây dựng dựa trên giáo trình Giáo dục Quốc phòng & An ninh của Bộ Giáo dục và Đào tạo.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Preload tất cả các mô hình 3D để việc chuyển đổi danh mục và động tác tức thì, mượt mà
useGLTF.preload("/models/vietnam_people_army_rigged.glb");
useGLTF.preload("/models/02_gdqp_van_dong_co_ban.glb");
useGLTF.preload("/models/03_gdqp_dia_hinh_dia_vat.glb");
useGLTF.preload("/models/04_gdqp_la_ban.glb");
