import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Center } from '@react-three/drei';
import { Suspense, useEffect, useState, useRef, useMemo } from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

// 1. Component con: Mô hình Chiến sĩ K20 thế hệ mới (VNSoldiernghinghiem.glb / VNSoldier.glb)
function SoldierK20Model({ modelPath }: { modelPath: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(modelPath);

  const cleanScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  const { actions, names } = useAnimations(animations, groupRef);

  useEffect(() => {
    if (!actions || names.length === 0) return;
    const clipName = names.includes('rig.002Action') ? 'rig.002Action' : names[0];
    const action = actions[clipName];
    if (action) {
      action.reset();
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.fadeIn(0.2).play();
    }
    return () => {
      action?.stop();
    };
  }, [actions, names]);

  return (
    <Center top>
      <primitive ref={groupRef} object={cleanScene} scale={0.9} />
    </Center>
  );
}

// 2. Component con: Mô hình Chiến sĩ các tư thế bắn truyền thống
function DynamicRifleModel({ animationName }: { animationName: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/vietnam_people_army_advanced_animations.optimized.glb');

  const cleanScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  const { actions, names } = useAnimations(animations, groupRef);

  useEffect(() => {
    if (names.length > 0) {
      const targetClip = names.includes(animationName) ? animationName : names[0];
      Object.values(actions).forEach((act) => act?.stop());
      const action = actions[targetClip];
      if (action) {
        action.reset();
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.fadeIn(0.15).play();
      }
    }
  }, [animationName, actions, names]);

  return (
    <Center top>
      <primitive ref={groupRef} object={cleanScene} scale={0.9} />
    </Center>
  );
}

type PostureType = "nghinghiem" | "tactical" | "stand" | "kneel" | "prone";

export default function PostureSimulation() {
  const [posture, setPosture] = useState<PostureType>("nghinghiem");

  const animMap: Record<string, string> = {
    stand: "CanhGioiCoDong",
    kneel: "QuyBan",
    prone: "NamBan",
  };

  const postureGuides: Record<PostureType, { title: string; note: string; badge: string }> = {
    nghinghiem: {
      title: "Điều lệnh đội ngũ từng người: Tư thế Nghiêm - Nghỉ (Quân phục K20)",
      note: "Khẩu lệnh 'Nghiêm!': Hai gót chân sát nhau, hai bàn chân mở rộng 45 độ, ngực nở vai thẳng, hai tay buông tự nhiên áp đùi. Khẩu lệnh 'Nghỉ!': Trùng gối tự nhiên.",
      badge: "Mô hình K20 Mới",
    },
    tactical: {
      title: "Kỹ thuật Trườn Tiến Đặt Súng K20 (Súng AK-47)",
      note: "Cây súng AK-47 đặt nằm trên mặt đất. Chiến sĩ trườn tiến người lên ngang tầm súng, sau đó tay phải vươn nhấc súng chuyển dịch về phía trước đặt xuống đất rồi tiếp tục trườn tiến áp sát mục tiêu.",
      badge: "Mô hình K20 Mới",
    },
    stand: {
      title: "Tư thế Đứng Bắn (Cảnh giới cơ động)",
      note: "Hai chân mở rộng bằng vai vững chắc, súng hướng về phía trước ngực, mắt quan sát bao quát trận địa, sẵn sàng giương súng ngắm bắn.",
      badge: "Kỹ thuật bắn AK",
    },
    kneel: {
      title: "Tư thế Quỳ Bắn súng tiểu liên AK",
      note: "Mông phải ngồi lên gót chân phải, đùi trái tạo góc vuông với hướng bắn, cùi chỏ trái tỳ chắc lên đầu gối trái tạo thành thế kiềng 3 chân kiên cố.",
      badge: "Kỹ thuật bắn AK",
    },
    prone: {
      title: "Tư thế Nằm Bắn súng tiểu liên AK",
      note: "Thân người mở góc 30 độ so với hướng bắn, hai gót chân ép sát mặt đất, hai cùi chỏ chống đất mở rộng bằng vai cố định súng cho đường ngắm chính xác nhất.",
      badge: "Kỹ thuật bắn AK",
    },
  };

  const currentGuide = postureGuides[posture];

  return (
    <div className="w-full h-full relative select-none bg-slate-950 flex flex-col">
      {/* THANH NÚT BẤM CHUYỂN ĐỔI TƯ THẾ */}
      <div className="absolute top-2 left-2 z-20 flex flex-wrap gap-1.5 pointer-events-auto">
        <button
          onClick={() => setPosture("nghinghiem")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1 ${
            posture === "nghinghiem"
              ? "bg-amber-500 text-slate-950 ring-2 ring-amber-300 font-extrabold"
              : "bg-slate-800/90 text-slate-200 hover:bg-slate-700"
          }`}
        >
          <span>⭐</span> 🫡 Điều lệnh Nghiêm - Nghỉ K20
        </button>
        <button
          onClick={() => setPosture("tactical")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1 ${
            posture === "tactical"
              ? "bg-amber-500 text-slate-950 ring-2 ring-amber-300 font-extrabold"
              : "bg-slate-800/90 text-slate-200 hover:bg-slate-700"
          }`}
        >
          <span>⭐</span> 🐍 Trườn Tiến Đặt Súng K20 (AK-47)
        </button>
        <button
          onClick={() => setPosture("stand")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-all ${
            posture === "stand" ? "bg-emerald-600 text-white ring-2 ring-emerald-400" : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          }`}
        >
          🧍 Đứng Bắn (Cảnh giới)
        </button>
        <button
          onClick={() => setPosture("kneel")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-all ${
            posture === "kneel" ? "bg-emerald-600 text-white ring-2 ring-emerald-400" : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          }`}
        >
          🧎 Quỳ Bắn
        </button>
        <button
          onClick={() => setPosture("prone")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-all ${
            posture === "prone" ? "bg-emerald-600 text-white ring-2 ring-emerald-400" : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          }`}
        >
          🛌 Nằm Bắn
        </button>
      </div>

      {/* CHỈ DẪN KỸ THUẬT QUÂN SỰ NẰM DƯỚI ĐÁY */}
      <div className="absolute bottom-2 left-2 right-2 z-20 pointer-events-none flex justify-center">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-3.5 py-2 max-w-xl text-left shadow-lg">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-bold text-amber-400">{currentGuide.title}</span>
            <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
              {currentGuide.badge}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight">{currentGuide.note}</p>
        </div>
      </div>

      {/* KHÔNG GIAN CANVAS 3D */}
      <div className="w-full h-full z-10 flex-1">
        <Canvas camera={{ position: [0, 0.9, 2.6], fov: 45 }} shadows>
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
          <directionalLight position={[-10, 10, -10]} intensity={0.5} />

          <Suspense fallback={null}>
            {posture === "nghinghiem" && <SoldierK20Model key="nghinghiem" modelPath="/models/VNSoldiernghinghiem.glb" />}
            {posture === "tactical" && <SoldierK20Model key="tactical" modelPath="/models/VNSoldier.glb" />}
            {(posture === "stand" || posture === "kneel" || posture === "prone") && (
              <DynamicRifleModel key={posture} animationName={animMap[posture]} />
            )}
          </Suspense>

          <OrbitControls enablePan={true} enableZoom={true} minDistance={1} maxDistance={8} />
        </Canvas>
      </div>
    </div>
  );
}

useGLTF.preload("/models/vietnam_people_army_advanced_animations.optimized.glb");
useGLTF.preload("/models/VNSoldiernghinghiem.glb");
useGLTF.preload("/models/VNSoldier.glb");
