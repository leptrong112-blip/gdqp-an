import React, { useState, useRef, useEffect, useMemo, Suspense, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, Grid, ContactShadows, Center, Html, useProgress } from "@react-three/drei";
import * as THREE from "three";
import F1ClassroomModel, { F1_PARTS } from "./F1ClassroomModel";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  Camera,
  CameraOff,
  RotateCcw,
  FlipHorizontal,
  CheckCircle2,
  QrCode,
  Eye,
  Sparkles,
  Sliders,
  X,
  Play,
  Pause,
  MapPin,
  ChevronRight,
  Upload,
  Layers,
  Smartphone,
  Laptop,
  Crosshair,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ════════════════════════════════════════════════════════════════════════════════
// 1. DATA DICTIONARIES & METADATA FOR 3D GLB MODELS
// ════════════════════════════════════════════════════════════════════════════════

export type ARCategoryType = "weapon" | "soldier" | "custom";

export interface ARPartDetail {
  id: string;
  name: string;
  detail: string;
}

export interface ARModelItem {
  id: string;
  name: string;
  category: ARCategoryType;
  subtitle: string;
  description: string;
  modelPath: string;
  animationName?: string;
  alternativeAnimations?: { label: string; animationName: string; baseHeightOffset?: number }[];
  baseHeightOffset?: number;
  initialPoseTime?: number;
  defaultScale: number;
  realScale: number;
  miniScale: number;
  recommendedPlacement: "table" | "floor";
  placementGuidance: string;
  historicalEra?: string;
  specs: { label: string; value: string }[];
  parts?: ARPartDetail[];
}

const WEBAR_CATALOG: ARModelItem[] = [
  // ── NHÓM 1: VŨ KHÍ BỘ BINH (ĐẶT TRÊN BÀN HỌC) ──────────────────────────
  {
    id: "ak47",
    name: "Súng Tiểu Liên AK-47",
    category: "weapon",
    subtitle: "Vũ khí bộ binh cơ bản của QĐND Việt Nam",
    description:
      "Súng tiểu liên AK-47 (cỡ 7,62mm) là vũ khí bộ binh tự động cá nhân uy lực cao, hoạt động theo nguyên lý trích khí thuốc súng lùi piston. Đặt súng lên mặt bàn để xoay 360° và quan sát chi tiết từng bộ phận cấu tạo theo SGK GDQP Lớp 11.",
    modelPath: "/models/ak47.glb",
    defaultScale: 0.01,
    realScale: 0.013,
    miniScale: 0.007,
    recommendedPlacement: "table",
    placementGuidance: "Đặt ngang trên mặt bàn học sinh để quan sát cấu tạo và các chi tiết.",
    historicalEra: "Trang bị chủ lực từ năm 1950 đến nay",
    specs: [
      { label: "Cỡ đạn", value: "7,62 x 39mm" },
      { label: "Hộp tiếp đạn", value: "30 viên" },
      { label: "Tầm bắn thẳng (Mục tiêu cao 0.5m)", value: "350 mét" },
      { label: "Tầm bắn ghi trên thước ngắm", value: "800 - 1000 mét" },
      { label: "Tốc độ bắn lý thuyết", value: "600 phát/phút" },
      { label: "Khối lượng không đạn", value: "3,8 kg (AK thường) / 3,14 kg (AKM)" },
    ],
    parts: [
      {
        id: "dulo",
        name: "1. Nòng súng & Đầu ngắm",
        detail: "Có 4 rãnh khương tuyến xoắn từ trái sang phải, làm cho đầu đạn xoay tròn quanh trục khi bay để giữ ổn định quỹ đạo và tăng độ chính xác.",
      },
      {
        id: "hopkhoanong",
        name: "2. Hộp khóa nòng & Nắp hộp",
        detail: "Bộ phận cốt lõi liên kết tất cả các chi tiết lại với nhau và chứa bệ khóa nòng, bộ phận cò và lò xo đẩy về.",
      },
      {
        id: "tiepdan",
        name: "3. Hộp tiếp đạn cong (30 viên)",
        detail: "Chứa 30 viên đạn xếp thành hai hàng so le. Lò xo tiếp đạn luôn đẩy viên đạn trên cùng vào vị trí sẵn sàng để nạp vào buồng đạn.",
      },
      {
        id: "bangsung",
        name: "4. Báng súng gỗ",
        detail: "Tỳ vào hõm vai người bắn để giữ súng ổn định, giảm tác động của lực giật khi bắn liên thanh hoặc phát một.",
      },
      {
        id: "opllottay",
        name: "5. Ốp lót tay & Ống dẫn thoi",
        detail: "Ốp lót tay bằng gỗ tẩm sấy giúp người bắn cầm chắc súng và không bị bỏng khi nòng súng nóng lên sau khi bắn liên thanh.",
      },
      {
        id: "thuocngam",
        name: "6. Thước ngắm cơ khí",
        detail: "Có các vạch khấc từ 1 đến 10 (tương ứng cự ly 100m - 1000m) và vạch 'П' (tầm bắn thẳng) để ngắm mục tiêu ở các cự ly khác nhau.",
      },
    ],
  },
  {
    id: "grenade",
    name: "Mô Hình Trơ F-1 · Khám Phá 3D",
    category: "weapon",
    subtitle: "Quan sát hình dáng và các chi tiết bên ngoài",
    description: "Mô hình minh họa trơ dùng trong lớp học. Nhấp vào mô hình để tách các nhóm chi tiết bên ngoài; chọn một phần để camera phóng gần và đọc mô tả. Chuyển động chỉ phục vụ quan sát, không thể hiện quy trình tháo lắp thực tế.",
    modelPath: "/models/f1-classroom.glb",
    animationName: "ExploreExterior",
    defaultScale: 1,
    realScale: 1,
    miniScale: .65,
    recommendedPlacement: "table",
    placementGuidance: "Xoay để quan sát, nhấp để khám phá các phần bên ngoài.",
    historicalEra: "Mô hình minh họa dành cho lớp học",
    specs: [
      { label: "Nội dung", value: "4 nhóm chi tiết bên ngoài" },
      { label: "Tương tác", value: "Tách / thu gọn, chọn và phóng gần" },
      { label: "Tỉ lệ", value: "Quy ước để quan sát" },
    ],
    parts: F1_PARTS,
  },

  // ── NHÓM 2: CHIẾN THUẬT VẬN ĐỘNG (ĐẶT TRÊN SÀN NHÀ) ──────────────────────
  {
    id: "crawl",
    name: "Chiến Sĩ Tư Thế Bò Cao & Trườn",
    category: "soldier",
    subtitle: "Vận động áp sát mặt đất vượt qua hỏa lực địch",
    description:
      "Đặt mô hình người chiến sĩ đang thực hiện động tác bò hoặc trườn ngay trên sàn nhà của bạn. Mô hình người lính QĐND Việt Nam trang bị quân phục dã chiến K20 và súng tiểu liên AK-47, cho phép học sinh quan sát góc áp sát mặt đất, động tác giữ súng và cử động chân tay nhịp nhàng.",
    modelPath: "/models/vietnam_people_army_advanced_animations.optimized.glb",
    animationName: "Truon",
    alternativeAnimations: [
      { label: "🐍 Động tác Trườn", animationName: "Truon", baseHeightOffset: 0.12 },
      { label: "🪖 Động tác Bò Cao", animationName: "BoCao", baseHeightOffset: 0.14 },
    ],
    baseHeightOffset: 0.14,
    initialPoseTime: 0,
    defaultScale: 0.85,
    realScale: 1.0,
    miniScale: 0.45,
    recommendedPlacement: "floor",
    placementGuidance: "Đặt ngay trên sàn nhà lớp học hoặc phòng khách để kiểm tra cự ly áp sát mặt sàn.",
    historicalEra: "Kỹ thuật chiến đấu bộ binh cơ bản",
    specs: [
      { label: "Trang bị", value: "Quân phục K20, Mũ dã chiến, Súng AK-47" },
      { label: "Độ cao thân người so với sàn", value: "Dưới 20 - 30 cm" },
      { label: "Vị trí đặt súng", value: "Đặt trên cánh tay thuận, nòng súng hướng trước" },
      { label: "Địa hình áp dụng", value: "Nơi có vật che khuất, che đỡ cao từ 30cm - 40cm" },
      { label: "Yêu cầu kỹ thuật", value: "Đầu không ngẩng cao, mông không nhấp nhô, êm nhẹ" },
    ],
    parts: [
      {
        id: "apsat",
        name: "1. Thân người áp sát mặt đất",
        detail: "Bụng, ngực và đùi trong ép sát mặt sàn để giảm tối đa tiết diện trúng đạn thẳng của địch.",
      },
      {
        id: "giusung",
        name: "2. Thế giữ súng dã chiến",
        detail: "Tay thuận nắm ốp lót tay, súng đặt trên cẳng tay, nòng súng hướng chếch lên để tránh cát đất lọt vào nòng.",
      },
      {
        id: "chuyendong",
        name: "3. Cử động nhịp nhàng hai chân",
        detail: "Dùng mũi bàn chân và cẳng tay đẩy thân người tiến về phía trước từng bước nhịp nhàng, êm dịu.",
      },
    ],
  },
  {
    id: "kneel",
    name: "Chiến Sĩ Tư Thế Quỳ Bắn",
    category: "soldier",
    subtitle: "Tư thế bắn vững chãi sau vật che đỡ",
    description:
      "Mô hình chiến sĩ QĐND Việt Nam quỳ bắn với súng tiểu liên AK-47, báng súng tỳ chắc vào hõm vai, cùi chỏ trái tỳ trên đầu gối trái, mắt ngắm thẳng mục tiêu. Đặt mô hình trên sàn nhà giúp học sinh đối chiếu góc gập đầu gối và thế ngồi vững vàng theo SGK.",
    modelPath: "/models/vietnam_people_army_advanced_animations.optimized.glb",
    animationName: "QuyBan",
    baseHeightOffset: 0.08,
    initialPoseTime: 1.2,
    defaultScale: 0.85,
    realScale: 1.0,
    miniScale: 0.45,
    recommendedPlacement: "floor",
    placementGuidance: "Đặt trên sàn nhà để quan sát góc ngắm và điểm tỳ báng súng.",
    historicalEra: "Kỹ thuật bắn súng tiểu liên AK",
    specs: [
      { label: "Trang bị", value: "Quân phục K20, Mũ dã chiến, Súng AK-47" },
      { label: "Góc quỳ chân thuận", value: "Gối gập khoảng 90° so với hướng bắn" },
      { label: "Điểm tỳ khuỷu tay", value: "Tỳ trên đầu gối chân trước" },
      { label: "Độ vững kết cấu", value: "Tạo thành thế kiềng ba chân ổn định" },
    ],
    parts: [
      {
        id: "diemtyvai",
        name: "1. Điểm tỳ báng súng vào hõm vai",
        detail: "Đế báng súng ép chặt vào hõm vai phải, cằm áp nhẹ vào báng súng để cố định đường ngắm.",
      },
      {
        id: "khuyutay",
        name: "2. Khuỷu tay trái tỳ đầu gối",
        detail: "Khuỷu tay trái tỳ vững trên đỉnh đầu gối trái, tay ngửa đỡ ốp lót tay dưới thân súng.",
      },
      {
        id: "chantraiphair",
        name: "3. Thế kiềng chân quỳ",
        detail: "Mông phải ngồi lên gót chân phải, chân trái vuông góc tạo thành thế chân vạc kiên cố.",
      },
    ],
  },
  {
    id: "prone",
    name: "Chiến Sĩ Tư Thế Nằm Bắn",
    category: "soldier",
    subtitle: "Tư thế bắn chuẩn mực áp sát mặt đất",
    description:
      "Tư thế nằm bắn là tư thế vững vàng nhất của bài bắn súng tiểu liên AK. Thân người mở góc khoảng 30° so với hướng bắn, ngực tỳ nhẹ xuống đất, hai khuỷu tay mở rộng tỳ chắc chắn để lấy đường ngắm chính xác.",
    modelPath: "/models/vietnam_people_army_advanced_animations.optimized.glb",
    animationName: "NamBan",
    baseHeightOffset: 0.12,
    initialPoseTime: 1.2,
    defaultScale: 0.85,
    realScale: 1.0,
    miniScale: 0.45,
    recommendedPlacement: "floor",
    placementGuidance: "Đặt áp sát mặt sàn để quan sát góc nằm và cẳng tay.",
    historicalEra: "Bài 1 bắn súng tiểu liên AK",
    specs: [
      { label: "Trang bị", value: "Quân phục K20, Mũ dã chiến, Súng AK-47" },
      { label: "Góc mở thân người", value: "Khoảng 30° so với hướng bắn" },
      { label: "Độ chụm hai gót chân", value: "Hai chân mở rộng bằng vai, gót chân ép sát đất" },
      { label: "Điểm tỳ khuỷu tay", value: "Hai khuỷu tay chống đất tạo góc kiên cố" },
    ],
    parts: [
      {
        id: "gocchienthuat",
        name: "1. Góc mở thân người 30°",
        detail: "Người chếch 30 độ so với hướng bắn giúp giảm tác động lực giật trực diện của súng.",
      },
      {
        id: "apgottot",
        name: "2. Hai gót chân ép sát đất",
        detail: "Mũi chân mở sang hai bên, hai gót ép sát mặt đất để hạ thấp tối đa tiết diện trúng đạn.",
      },
      {
        id: "ngamchuan",
        name: "3. Hai khuỷu tay chống vững",
        detail: "Hai khuỷu tay mở rộng tự nhiên bằng vai, tạo chân kiềng cố định súng cho đường ngắm ổn định.",
      },
    ],
  },
  {
    id: "stand",
    name: "Chiến Sĩ Đứng Cảnh Giới Cơ Động",
    category: "soldier",
    subtitle: "Tư thế sẵn sàng chiến đấu đa hướng",
    description:
      "Tư thế đứng cảnh giới với súng AK-47 giương sẵn, cơ động linh hoạt trong tuần tra, tác chiến địa hình rừng núi hoặc đô thị. Đặt trên sàn để quan sát vóc dáng và độ mở hai bàn chân.",
    modelPath: "/models/vietnam_people_army_advanced_animations.optimized.glb",
    animationName: "CanhGioiCoDong",
    alternativeAnimations: [
      { label: "🛡️ Cảnh giới cơ động", animationName: "CanhGioiCoDong" },
      { label: "🚶 Đi đều điều lệnh", animationName: "DiDeu" },
      { label: "🧍 Đứng nghiêm", animationName: "Nghiem" },
    ],
    baseHeightOffset: 0.04,
    initialPoseTime: 0,
    defaultScale: 0.85,
    realScale: 1.0,
    miniScale: 0.45,
    recommendedPlacement: "floor",
    placementGuidance: "Đặt trên sàn nhà để quan sát toàn diện dáng đứng và góc súng.",
    historicalEra: "Điều lệnh & Tác chiến đô thị",
    specs: [
      { label: "Trang bị", value: "Quân phục K20, Mũ dã chiến, Súng AK-47" },
      { label: "Trọng tâm cơ thể", value: "Phân bố đều trên hai chân, chân trái hơi bước tới" },
      { label: "Tầm quan sát", value: "Góc quét 180° - 360°" },
      { label: "Tư thế súng", value: "Low Ready / Sẵn sàng tác chiến phản xạ nhanh" },
    ],
    parts: [
      {
        id: "dangsansang",
        name: "1. Thế đứng sẵn sàng phản ứng nhanh",
        detail: "Chân trước chân sau, gối hơi chùng linh hoạt để di chuyển đổi hướng tức thì.",
      },
      {
        id: "quansatrong",
        name: "2. Bao quát trận địa",
        detail: "Mắt quan sát cảnh giới mọi hướng, cảnh giác cao độ trong địa bàn tác chiến phức tạp.",
      },
    ],
  },
  {
    id: "throw",
    name: "Chiến Sĩ Động Tác Ném Lựu Đạn",
    category: "soldier",
    subtitle: "Kỹ thuật ném xa đúng hướng mục tiêu",
    description:
      "Tư thế vung tay ném quả lựu đạn F-1 với độ rướn toàn thân, tận dụng lực đẩy của chân, sức vặn của hông và độ mở cánh tay đưa lựu đạn bay tới mục tiêu theo góc 45°.",
    modelPath: "/models/vietnam_people_army_advanced_animations.optimized.glb",
    animationName: "NemLuuDan",
    baseHeightOffset: 0.04,
    initialPoseTime: 0.75,
    defaultScale: 0.85,
    realScale: 1.0,
    miniScale: 0.45,
    recommendedPlacement: "floor",
    placementGuidance: "Đặt trên sàn để quan sát góc mở vai và tư thế rướn người.",
    historicalEra: "Kỹ thuật ném lựu đạn ném trúng đích",
    specs: [
      { label: "Trang bị", value: "Quân phục K20, Mũ dã chiến, Lựu đạn F-1" },
      { label: "Góc bay tối ưu", value: "45 độ so với mặt đất" },
      { label: "Cự ly ném đạt chuẩn", value: "Nam THPT: 35m - 40m" },
      { label: "Quy tắc an toàn", value: "Rút chốt dứt khoát, ném đúng hướng, ẩn nấp ngay" },
    ],
    parts: [
      {
        id: "ruonnguoi",
        name: "1. Tư thế rướn vặn hông lấy đà",
        detail: "Chân phải chùng gối, ngả người ra sau lấy đà, cánh tay phải mở rộng hình cánh cung.",
      },
      {
        id: "vungnem",
        name: "2. Vung tay ném góc 45°",
        detail: "Đạp mạnh chân sau xoay hông, đưa cánh tay vút qua mang tai phóng lựu đạn bay cao xa.",
      },
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════════════
// 2. 3D MODEL RENDERER WITH SMOOTH CLONING & ANIMATIONS
// ════════════════════════════════════════════════════════════════════════════════

interface ModelGLBProps {
  modelPath: string;
  isPaused: boolean;
  scale: number;
  rotationY: number;
  animationName?: string;
  initialPoseTime?: number;
  onModelClick?: () => void;
  resetTrigger?: number;
}

function Model3DLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-emerald-500/30 shadow-2xl text-center min-w-[200px] pointer-events-none select-none">
        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mb-3" />
        <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase mb-1">
          Đang tải mô hình 3D...
        </span>
        <span className="text-sm font-black text-white font-mono">
          {progress.toFixed(0)}%
        </span>
        <div className="w-36 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Html>
  );
}

function ModelGLBViewer({
  modelPath,
  isPaused,
  scale,
  rotationY,
  animationName,
  initialPoseTime = 0,
  onModelClick,
  resetTrigger,
}: ModelGLBProps) {
  const rootRef = useRef<THREE.Group>(null);
  const animRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(modelPath);

  // Nhân bản an toàn scene bằng SkeletonUtils
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

  const { actions, names, mixer } = useAnimations(animations, animRef);

  useEffect(() => {
    if (!actions || names.length === 0) return;
    const clipName = animationName && names.includes(animationName) ? animationName : names[0];
    const targetAction = actions[clipName];

    // Dừng các action khác để tránh xung đột xương hoặc đè vũ khí
    names.forEach((n) => {
      if (n !== clipName && actions[n]) {
        actions[n]?.stop();
      }
    });

    if (targetAction) {
      if (isPaused) {
        // Trạng thái tĩnh (3D tĩnh): pose tại initialPoseTime (ví dụ đang quỳ hoặc nằm chuẩn mực)
        targetAction.reset();
        targetAction.setLoop(THREE.LoopRepeat, Infinity);
        targetAction.play();
        targetAction.time = initialPoseTime;
        targetAction.paused = true;
        if (mixer) {
          mixer.update(0);
        }
      } else {
        // Trạng thái chuyển động: tiếp tục chạy hoạt ảnh
        targetAction.paused = false;
        targetAction.timeScale = 1;
        if (!targetAction.isRunning()) {
          targetAction.reset();
          targetAction.setLoop(THREE.LoopRepeat, Infinity);
          targetAction.fadeIn(0.15).play();
        }
      }
    }
  }, [actions, names, mixer, isPaused, modelPath, animationName, initialPoseTime]);

  // Xem lại từ đầu (quay về frame 0 hoặc pose ban đầu)
  useEffect(() => {
    if (resetTrigger !== undefined && resetTrigger > 0) {
      if (!actions || names.length === 0) return;
      const clipName = animationName && names.includes(animationName) ? animationName : names[0];
      const targetAction = actions[clipName];
      if (targetAction) {
        targetAction.reset();
        targetAction.time = isPaused ? initialPoseTime : 0;
        if (isPaused) {
          targetAction.paused = true;
        }
        if (mixer) {
          mixer.update(0);
        }
      }
    }
  }, [resetTrigger, animationName, actions, names, isPaused, initialPoseTime, mixer]);

  return (
    <group ref={rootRef} scale={scale} rotation={[0, rotationY, 0]}>
      <group ref={animRef} onClick={onModelClick}>
        <Center>
          <primitive object={clonedScene} />
        </Center>
      </group>
    </group>
  );
}



// ════════════════════════════════════════════════════════════════════════════════
// 4. MAIN WEBAR COMPONENT SECTION
// ════════════════════════════════════════════════════════════════════════════════

export default function WebARSection() {
  // ── States ────────────────────────────────────────────────────────────────
  const [selectedItemId, setSelectedItemId] = useState<string>("ak47");
  const [activeCategory, setActiveCategory] = useState<ARCategoryType>("weapon");
  
  // Custom uploaded GLB model
  const [customModelUrl, setCustomModelUrl] = useState<string | null>(null);
  const [customModelName, setCustomModelName] = useState<string>("");

  // Camera & Device mode:
  // Trên Laptop/PC: Mặc định TẮT camera để vào Thao trường 3D Studio sắc nét, tránh mở webcam rọi vào mặt!
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  
  // MẶC ĐỊNH LÀ 3D TĨNH (isPaused = true) - người dùng bấm vào thì mới bắt đầu chạy chuyển động/quy trình
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [resetAnimTrigger, setResetAnimTrigger] = useState<number>(0);

  // Biến thể hoạt ảnh con (Trườn / Bò cao / Đi đều / Cảnh giới)
  const [selectedSubAnimation, setSelectedSubAnimation] = useState<string | null>(null);

  // Transformations
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(1.0);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [heightOffset, setHeightOffset] = useState<number>(0);

  // Selected Part Inspection (Xem cấu tạo chi tiết bên cột phải)
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);

  // Modals & Toasts
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [snapshotToast, setSnapshotToast] = useState<string | null>(null);

  // Fullscreen & Expanded Viewport States
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const toggleFullscreen = useCallback(() => {
    if (!canvasContainerRef.current) return;
    if (!document.fullscreenElement) {
      canvasContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const handleZoomIn = () => {
    setScaleMultiplier((prev) => Math.min(3.0, Number((prev + 0.2).toFixed(1))));
  };

  const handleZoomOut = () => {
    setScaleMultiplier((prev) => Math.max(0.4, Number((prev - 0.2).toFixed(1))));
  };

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentItem = useMemo(() => {
    return WEBAR_CATALOG.find((item) => item.id === selectedItemId) || WEBAR_CATALOG[0];
  }, [selectedItemId]);

  // ── Camera Management ────────────────────────────────────────────────────
  const startCamera = useCallback(async (mode: "environment" | "user") => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setIsCameraActive(false);
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Camera access denied or unavailable:", err);
      setIsCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Switch facing mode if camera is active
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    if (isCameraActive) {
      startCamera(nextMode);
    }
  };

  // Toggle Camera on/off
  const handleToggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera(facingMode);
    }
  };

  // Switch catalog item
  const handleSelectItem = (item: ARModelItem) => {
    setSelectedItemId(item.id);
    setActiveCategory(item.category);
    setScaleMultiplier(1.0);
    setRotationAngle(0);
    setHeightOffset(0);
    setSelectedPartId(null);
    setSelectedSubAnimation(null);
    setIsPaused(true); // Luôn bắt đầu ở dạng 3D tĩnh khi chuyển mô hình
  };

  // Custom GLB file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".glb") && !file.name.endsWith(".gltf")) {
      alert("Vui lòng chọn file định dạng 3D (.glb hoặc .gltf)!");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCustomModelUrl(objectUrl);
    setCustomModelName(file.name.replace(/\.[^/.]+$/, ""));
    setActiveCategory("custom");
    setScaleMultiplier(1.0);
    setRotationAngle(0);
    setHeightOffset(0);
    setSelectedSubAnimation(null);
  };

  // Snapshot photo capture
  const handleTakeSnapshot = () => {
    const canvas = canvasContainerRef.current?.querySelector("canvas");
    if (!canvas) return;

    try {
      const offscreen = document.createElement("canvas");
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const ctx = offscreen.getContext("2d");

      if (ctx) {
        if (isCameraActive && videoRef.current && videoRef.current.readyState >= 2) {
          ctx.drawImage(videoRef.current, 0, 0, offscreen.width, offscreen.height);
        } else {
          ctx.fillStyle = "#0c1420";
          ctx.fillRect(0, 0, offscreen.width, offscreen.height);
        }

        ctx.drawImage(canvas, 0, 0);

        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.roundRect(24, offscreen.height - 70, 360, 46, 12);
        ctx.fill();

        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 16px Inter, sans-serif";
        ctx.fillText("★ GDQP-AN 3D WEBAR", 40, offscreen.height - 42);

        ctx.fillStyle = "#ffffff";
        ctx.font = "12px Inter, sans-serif";
        const displayName = activeCategory === "custom" ? customModelName : currentItem.name;
        ctx.fillText(`Mô hình: ${displayName}`, 210, offscreen.height - 42);

        const dataUrl = offscreen.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `GDQP_3D_${Date.now()}.png`;
        link.href = dataUrl;
        link.click();

        setSnapshotToast("Đã chụp & lưu ảnh vào máy của bạn!");
        setTimeout(() => setSnapshotToast(null), 3500);
      }
    } catch (e) {
      console.error("Snapshot error:", e);
    }
  };

  // Active model path & scale & animation
  const activeModelPath = activeCategory === "custom" && customModelUrl ? customModelUrl : currentItem.modelPath;
  const computedScale = (activeCategory === "custom" ? 1.0 : currentItem.defaultScale) * scaleMultiplier;
  const activeAnimation = selectedSubAnimation || currentItem.animationName;
  const activeInitialPoseTime = currentItem.initialPoseTime || 0;
  const activeBaseHeightOffset = activeCategory === "custom" ? 0 : (
    (currentItem.alternativeAnimations?.find((a) => a.animationName === activeAnimation)?.baseHeightOffset ??
    currentItem.baseHeightOffset ??
    0) * scaleMultiplier
  );

  // Selected part object
  const activePartObj = useMemo(() => {
    if (!selectedPartId || !currentItem.parts) return null;
    return currentItem.parts.find((p) => p.id === selectedPartId) || null;
  }, [selectedPartId, currentItem.parts]);

  return (
    <div className="w-full flex flex-col space-y-5">
      {/* ── HEADER BANNER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 tracking-widest block font-mono">
              Thực Hành &amp; Quan Sát Trực Quan
            </span>
            <span className="px-2 py-0.5 rounded-full bg-red-600/10 text-red-600 dark:text-red-400 text-[10px] font-extrabold border border-red-500/20">
              WebAR &amp; 3D Studio
            </span>
          </div>
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-tight mt-1">
            Không Gian 3D Vũ Khí &amp; Động Tác Chiến Đấu
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans max-w-3xl">
            <span className="hidden sm:inline">Quan sát chi tiết cấu tạo súng tiểu liên AK-47, động tác bò/đi khom của chiến sĩ trên thao trường 3D. </span>Hỗ trợ quét mã hoặc bật camera chiếu trực tiếp lên bàn học và sàn nhà!
          </p>
        </div>

        {/* Action Buttons: Phone QR (Chỉ hiện trên desktop) & Bật Camera AR */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => setIsQRModalOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold shadow-md shadow-red-600/25 hover:from-red-700 hover:to-rose-700 transition-all cursor-pointer border border-red-400/30"
            title="Dùng camera điện thoại quét để chiếu lên bàn học ngoài đời thực"
          >
            <Smartphone className="w-4 h-4 text-amber-300" />
            <span>Mở trên điện thoại (Chiếu AR)</span>
          </button>

          <button
            onClick={handleToggleCamera}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isCameraActive
                ? "bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20"
            }`}
            title={isCameraActive ? "Tắt camera, trở về Thao trường 3D" : "Bật camera thiết bị để chiếu AR"}
          >
            {isCameraActive ? <Camera className="w-4 h-4" /> : <Camera className="w-4 h-4 text-amber-300" />}
            <span>{isCameraActive ? "Camera AR: Đang bật" : "Bật Camera AR"}</span>
          </button>
        </div>
      </div>

      {/* ── LAPTOP / PC NOTIFICATION BANNER (Chỉ hiển thị trên máy tính, ẩn hoàn toàn trên điện thoại) ── */}
      <div className="hidden md:flex p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-300">
        <div className="flex items-center gap-2.5">
          <Laptop className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>
            <strong className="font-extrabold">Bạn đang dùng Laptop / Máy tính?</strong> Bạn đang ở chế độ <strong>3D Studio Thao trường chuẩn</strong> (xoay chuột 360° để quan sát đa chiều). Để chiếu súng AK lên mặt bàn hoặc chiếu chiến sĩ lên sàn nhà bằng camera sau, hãy bấm nút <strong>"Mở trên điện thoại"</strong> để quét mã QR!
          </span>
        </div>
        <button
          onClick={() => setIsQRModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
        >
          Quét mã QR ngay
        </button>
      </div>

      {/* ── CATEGORY TABS SELECTOR & CUSTOM UPLOAD BUTTON ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full sm:w-auto">
          {[
            { id: "weapon", shortLabel: "🔫 Súng AK-47", label: "🔫 Vũ Khí Bộ Binh (AK-47 & Lựu đạn)", count: 2 },
            { id: "soldier", shortLabel: "🪖 Động Tác Chiến Thuật", label: "🪖 Chiến Thuật Vận Động (Bò, Quỳ, Nằm)", count: 5 },
            ...(customModelUrl ? [{ id: "custom", shortLabel: `📁 ${customModelName}`, label: `📁 ${customModelName} (Tải lên)`, count: 1 }] : []),
          ].map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveCategory(tab.id as ARCategoryType);
                  if (tab.id !== "custom") {
                    const firstItem = WEBAR_CATALOG.find((i) => i.category === tab.id);
                    if (firstItem) handleSelectItem(firstItem);
                  }
                }}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                    : "bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Nút Tải Lên File 3D GLB Từ Máy Tính / Mạng */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
            title="Tải lên file 3D .glb mũ cối, ba lô hoặc bất kỳ hiện vật nào bạn tải từ mạng về"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Tải lên file .glb của bạn</span>
          </button>
        </div>
      </div>

      {/* ── MAIN WORKSPACE: 3D AR VIEWPORT & CONTROL CONSOLE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── CỘT TRÁI: KHUNG VIEWPORT 3D THAO TRƯỜNG / WEBAR (COL-8 HOẶC COL-12 KHI MỞ RỘNG) ──────── */}
        <div className={`${isExpanded ? "lg:col-span-12" : "lg:col-span-8"} flex flex-col space-y-3 transition-all duration-300`}>
          <div
            ref={canvasContainerRef}
            className={`w-full ${
              isFullscreen
                ? "fixed inset-0 z-[99999] w-screen h-screen rounded-none border-none bg-black"
                : isExpanded
                ? "h-[640px] sm:h-[720px] lg:h-[800px] rounded-3xl"
                : "h-[450px] sm:h-[520px] lg:h-[580px] rounded-3xl"
            } overflow-hidden relative shadow-xl border border-slate-800 bg-[#090d16] flex flex-col justify-between transition-all duration-300`}
          >
            {/* 1. Live Camera Stream Background (chỉ hiển thị khi người dùng bật Camera) */}
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className={`absolute inset-0 w-full h-full object-cover z-0 pointer-events-none transition-opacity duration-500 ${
                isCameraActive ? "opacity-100" : "opacity-0"
              }`}
            />

            {/* 1b. Fallback Studio Background if camera is inactive */}
            {!isCameraActive && (
              <div className="absolute inset-0 bg-gradient-to-b from-[#0e1726] via-[#090e17] to-[#04070d] z-0 pointer-events-none flex items-center justify-center">
                <div className="absolute w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
              </div>
            )}

            {/* 2. Top Controls Bar Overlay */}
            <div className="relative z-20 p-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md text-white text-xs font-bold border border-white/10 flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isCameraActive ? "Chế độ: Thực tế tăng cường (AR)" : "Chế độ: Thao trường 3D Studio"}</span>
                </div>

                {activeCategory !== "custom" && (
                  <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md text-amber-300 border border-white/10 text-xs font-semibold shadow-md">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>
                      {currentItem.recommendedPlacement === "table" ? "Phù hợp: Mặt bàn học" : "Phù hợp: Sàn nhà"}
                    </span>
                  </div>
                )}

                {/* Chuyển đổi các biến thể động tác nếu mô hình hỗ trợ (Trườn / Bò cao / Cảnh giới / Đi đều...) */}
                {currentItem.alternativeAnimations && currentItem.alternativeAnimations.length > 0 && (
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-red-500/30 shadow-md">
                    {currentItem.alternativeAnimations.map((alt) => {
                      const isSelected = (selectedSubAnimation || currentItem.animationName) === alt.animationName;
                      return (
                        <button
                          key={alt.animationName}
                          onClick={() => {
                            setSelectedSubAnimation(alt.animationName);
                            setIsPaused(false);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-red-600 text-white shadow-xs"
                              : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                          }`}
                        >
                          {alt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Camera & Playback controls */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {isCameraActive && (
                  <button
                    onClick={handleToggleFacingMode}
                    className="p-2 rounded-xl bg-slate-950/85 backdrop-blur-md text-white border border-white/10 hover:bg-slate-800 transition-all cursor-pointer shadow-md"
                    title="Đổi camera trước / sau"
                  >
                    <FlipHorizontal className="w-4 h-4 text-slate-300" />
                  </button>
                )}

                {/* Play / Pause button */}
                <button
                  onClick={() => { setIsPaused((prev) => !prev); if (currentItem.id === "grenade") setSelectedPartId(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md text-xs font-bold border transition-all cursor-pointer shadow-md ${
                    isPaused
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/40 shadow-emerald-900/30 animate-pulse"
                      : "bg-slate-950/85 hover:bg-slate-800 text-amber-300 border-white/10"
                  }`}
                  title={currentItem.id === "grenade" ? "Tách hoặc thu gọn mô hình minh họa" : isPaused ? "Bắt đầu chạy mô phỏng quy trình" : "Tạm dừng mô phỏng"}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 fill-current text-white" /> : <Pause className="w-3.5 h-3.5 fill-current text-white" />}
                  <span>{currentItem.id === "grenade" ? (isPaused ? "Tách mô hình" : "Thu gọn") : (isPaused ? "Bắt đầu quy trình" : "Tạm dừng")}</span>
                </button>

                {/* Reset to frame 0 button */}
                <button
                  onClick={() => {
                    setResetAnimTrigger((k) => k + 1);
                    if (currentItem.id === "grenade") { setSelectedPartId(null); setIsPaused(true); }
                    setIsPaused(true);
                  }}
                  className="p-2 rounded-xl bg-slate-950/85 backdrop-blur-md text-slate-300 border border-white/10 hover:bg-slate-800 hover:text-white transition-all cursor-pointer shadow-md"
                  title="Xem lại từ đầu (quay về thế 3D tĩnh ban đầu)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleTakeSnapshot}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs shadow-lg shadow-red-600/30 hover:scale-105 transition-all cursor-pointer border border-red-400/40"
                  title="Chụp ảnh thực tế cùng mô hình 3D"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chụp ảnh 3D</span>
                </button>

                {/* Nút Phóng to / Thu nhỏ khung nhìn (Expand Viewport) */}
                <button
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md text-xs font-bold border transition-all cursor-pointer shadow-md ${
                    isExpanded
                      ? "bg-amber-500 text-slate-950 border-amber-300 hover:bg-amber-400"
                      : "bg-slate-950/85 hover:bg-slate-800 text-slate-200 border-white/10"
                  }`}
                  title={isExpanded ? "Thu gọn về kích thước chuẩn" : "Mở rộng 100% khung nhìn 3D"}
                >
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isExpanded ? "Thu nhỏ khung" : "Phóng to khung"}</span>
                </button>

                {/* Nút Toàn màn hình (Fullscreen) */}
                <button
                  onClick={toggleFullscreen}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md text-xs font-bold border transition-all cursor-pointer shadow-md ${
                    isFullscreen
                      ? "bg-red-600 text-white border-red-400"
                      : "bg-slate-950/85 hover:bg-slate-800 text-slate-200 border-white/10"
                  }`}
                  title={isFullscreen ? "Thoát toàn màn hình (ESC)" : "Xem toàn màn hình (Fullscreen)"}
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-white" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-300" />}
                  <span className="hidden sm:inline">{isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}</span>
                </button>
              </div>
            </div>

            {/* 3. Three.js Canvas Layer */}
            <div className="absolute inset-0 z-10">
              <Canvas
                gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
                camera={{ position: [0, 1.2, 2.5], fov: 45 }}
              >
                <ambientLight intensity={1.5} />
                <directionalLight position={[5, 10, 5]} intensity={2.2} castShadow />
                <directionalLight position={[-5, 6, -5]} intensity={0.9} />
                <pointLight position={[0, 3, 2]} intensity={0.8} />

                {/* Grid dã chiến & bóng đổ mềm tự nhiên chỉ hiển thị ở chế độ Studio 3D (khi tắt camera) */}
                {!isCameraActive && (
                  <>
                    <Grid
                      position={[0, -0.01, 0]}
                      args={[16, 16]}
                      cellSize={0.5}
                      cellThickness={0.8}
                      cellColor="#1e293b"
                      sectionSize={2}
                      sectionThickness={1.2}
                      sectionColor="#334155"
                      fadeDistance={14}
                    />
                    <ContactShadows
                      position={[0, -0.005, 0]}
                      opacity={0.3}
                      scale={2.5}
                      blur={2.5}
                      far={0.8}
                      resolution={256}
                      color="#000000"
                    />
                  </>
                )}

                {/* 3D GLB Model Rendering */}
                <Suspense fallback={<Model3DLoader />}>
                  <group position={[0, (currentItem.id === "grenade" && activeCategory !== "custom" ? 0 : heightOffset) + activeBaseHeightOffset, 0]}>
                    {currentItem.id === "grenade" && activeCategory !== "custom" ? <F1ClassroomModel
                      expanded={!isPaused} selected={selectedPartId} reset={resetAnimTrigger}
                      scale={computedScale} rotation={rotationAngle} height={.98 * computedScale + heightOffset}
                      onExpand={() => setIsPaused(false)} onSelect={setSelectedPartId}
                    /> : <ModelGLBViewer
                      key={`${activeModelPath}-${activeAnimation}`}
                      modelPath={activeModelPath}
                      animationName={activeAnimation}
                      initialPoseTime={activeInitialPoseTime}
                      isPaused={isPaused}
                      scale={computedScale}
                      rotationY={rotationAngle}
                      resetTrigger={resetAnimTrigger}
                      onModelClick={() => setIsPaused(false)}
                    />}
                  </group>
                </Suspense>

                {(currentItem.id !== "grenade" || activeCategory === "custom") && <OrbitControls
                  enablePan={true}
                  enableZoom={true}
                  minDistance={0.4}
                  maxDistance={7.0}
                  maxPolarAngle={Math.PI / 2 + 0.05}
                />}
              </Canvas>
            </div>

            {/* 4. Bottom Instructions */}
            <div className="relative z-20 p-4 flex items-center justify-between gap-3 pointer-events-none">
              <div className="px-3.5 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-slate-300 text-[11px] font-medium flex items-center gap-2 pointer-events-auto">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Kéo chuột để xoay 360° · Cuộn chuột để phóng to / thu nhỏ</span>
              </div>

              <div className="pointer-events-auto flex items-center gap-2">
                {/* Nút Phóng to / Thu nhỏ mô hình */}
                <div className="flex items-center bg-slate-950/85 backdrop-blur-md rounded-xl border border-white/10 p-0.5 shadow-md">
                  <button
                    onClick={handleZoomOut}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Thu nhỏ mô hình (-20%)"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono font-bold text-amber-300 px-1.5 select-none min-w-[36px] text-center">
                    {Math.round(scaleMultiplier * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Phóng to mô hình (+20%)"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setRotationAngle(0);
                    if (currentItem.id === "grenade") { setSelectedPartId(null); setResetAnimTrigger(k => k + 1); }
                    setScaleMultiplier(1.0);
                    setHeightOffset(0);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer hover:bg-slate-800"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Đặt lại góc nhìn</span>
                </button>
              </div>
            </div>

            {/* Snapshot Toast Notification */}
            <AnimatePresence>
              {snapshotToast && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-xl border border-emerald-400 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>{snapshotToast}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── AR SPATIAL CONTROLS BAR (TỈ LỆ THỰC TẾ & XOAY ĐIỀU CHỈNH) ── */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
            
            {/* Quick Scale Presets */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-red-500" /> Kích thước:
              </span>
              <button
                onClick={() => setScaleMultiplier(1.0)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  scaleMultiplier === 1.0
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {currentItem.id === "grenade" ? "Toàn cảnh" : "Chuẩn 1:1"}
              </button>
              <button
                onClick={() => setScaleMultiplier(0.6)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  scaleMultiplier === 0.6
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                Mini Bàn Học
              </button>
            </div>

            {/* Rotation Slider */}
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Góc xoay:
              </span>
              <input
                type="range"
                min={-Math.PI}
                max={Math.PI}
                step={0.05}
                value={rotationAngle}
                onChange={(e) => setRotationAngle(parseFloat(e.target.value))}
                className="w-full accent-red-600 cursor-pointer"
              />
              <button
                onClick={() => setRotationAngle(0)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                title="Trả về góc 0°"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Height Adjustment */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Cao độ:</span>
              <button
                onClick={() => setHeightOffset((h) => Math.max(-0.4, h - 0.05))}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-xs flex items-center justify-center hover:bg-slate-200 cursor-pointer"
                title="Hạ thấp"
              >
                -
              </button>
              <span className="text-xs font-mono font-bold w-10 text-center">
                {heightOffset > 0 ? `+${Math.round(heightOffset * 100)}` : Math.round(heightOffset * 100)}cm
              </span>
              <button
                onClick={() => setHeightOffset((h) => Math.min(0.6, h + 0.05))}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-xs flex items-center justify-center hover:bg-slate-200 cursor-pointer"
                title="Nâng cao"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* ── CỘT PHẢI: DANH SÁCH MÔ HÌNH & CHI TIẾT CẤU TẠO (COL-4 HOẶC DÀN 2 CỘT KHI MỞ RỘNG) ──────── */}
        <div className={`${isExpanded ? "lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0" : "lg:col-span-4 space-y-4"} transition-all duration-300`}>
          
          {/* Danh Sách Lựa Chọn Mô Hình Cùng Phân Loại */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-red-600 dark:text-red-400 tracking-wider">
                Mô Hình 3D Chuẩn ({WEBAR_CATALOG.filter((i) => i.category === activeCategory).length})
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Bấm để chuyển</span>
            </div>

            <div className="space-y-2">
              {WEBAR_CATALOG.filter((item) => item.category === activeCategory).map((item) => {
                const isSelected = item.id === currentItem.id && activeCategory !== "custom";
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-red-600/10 dark:bg-red-950/40 border-red-500/50 text-red-700 dark:text-red-400 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs flex items-center gap-1.5">
                        <span>{item.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-600/10 text-red-600 dark:text-red-400 font-mono font-bold">
                          3D GLB
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {item.subtitle}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? "text-red-600 dark:text-red-400 translate-x-1" : "text-slate-400"
                      }`}
                    />
                  </button>
                );
              })}

              {activeCategory === "custom" && customModelName && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-between">
                  <span>Mô hình tải lên: {customModelName}</span>
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                </div>
              )}
            </div>
          </div>

          {/* Sơ Đồ Cấu Tạo Từng Bộ Phận (Nếu Mô Hình Có Danh Sách Chi Tiết) */}
          {activeCategory !== "custom" && currentItem.parts && currentItem.parts.length > 0 && (
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 tracking-wider flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5" /> Sơ Đồ Cấu Tạo Chi Tiết
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Bấm xem giải thích</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {currentItem.parts.map((part) => {
                  const isPartSelected = selectedPartId === part.id;
                  return (
                    <button
                      key={part.id}
                      onClick={() => { setSelectedPartId(isPartSelected ? null : part.id); if (currentItem.id === "grenade") setIsPaused(false); }}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                        isPartSelected
                          ? "bg-red-600 text-white border-red-600 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span>{part.name}</span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isPartSelected ? "rotate-90 text-white" : "text-slate-400"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Hộp Thông Tin Bộ Phận Được Chọn */}
              <AnimatePresence>
                {activePartObj && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 space-y-1">
                      <div className="font-extrabold text-xs text-red-700 dark:text-red-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {activePartObj.name}
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-200 font-sans leading-relaxed">
                        {activePartObj.detail}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Chi Tiết Hiện Vật & Thông Số Kỹ Thuật Quân Sự */}
          {activeCategory !== "custom" && (
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                    THÔNG SỐ GIÁO TRÌNH GDQP
                  </span>
                  {currentItem.historicalEra && (
                    <span className="text-[9px] text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {currentItem.historicalEra}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-black text-slate-900 dark:text-white mt-1">
                  {currentItem.name}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed font-sans font-medium">
                  {currentItem.description}
                </p>
              </div>

              {/* Thông Số Kỹ Thuật Bảng Rút Gọn */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Thông số kỹ thuật:
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {currentItem.specs.map((spec, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs border border-slate-100 dark:border-slate-800"
                    >
                      <span className="text-slate-500 dark:text-slate-400 font-medium">{spec.label}</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: QUÉT MÃ QR CODE CHO ĐIỆN THOẠI ── */}
      <AnimatePresence>
        {isQRModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-black text-sm uppercase">
                  <Smartphone className="w-4 h-4" /> Mở Camera Chiếu Bàn / Sàn Nhà Bằng Điện Thoại
                </div>
                <button
                  onClick={() => setIsQRModalOpen(false)}
                  className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-md flex items-center justify-center border border-slate-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      window.location.href
                    )}`}
                    alt="Mã QR mở WebAR GDQP"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Dùng camera điện thoại của bạn quét mã QR này
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                    Trình duyệt trên điện thoại có <strong>camera sau</strong>, cho phép bạn hướng thẳng xuống mặt bàn học để đặt súng AK-47 hoặc rọi xuống sàn nhà để quan sát chiến sĩ bò trườn ngoài đời thực!
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsQRModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs shadow-md shadow-red-600/20 hover:bg-red-700 cursor-pointer"
                >
                  Đã hiểu, Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Preload tất cả các mô hình GLB chuẩn chất lượng cao để chuyển đổi tức thì
useGLTF.preload("/models/ak47.glb");
useGLTF.preload("/models/f1-classroom.glb");
useGLTF.preload("/models/vietnam_people_army_advanced_animations.optimized.glb");
