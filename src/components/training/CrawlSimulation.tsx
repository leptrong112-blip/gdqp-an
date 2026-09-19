import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Center } from '@react-three/drei';
import { Suspense, useEffect, useState, useRef, useMemo } from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

// 1. Component con: Mô phỏng Bò Thấp K20 độ nét cao (VNSoldierBoThap.glb)
function SoldierBoThapModel() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/VNSoldierBoThap.glb');

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

  const { actions, names } = useAnimations(animations, group);

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
      <primitive ref={group} object={cleanScene} scale={0.85} />
    </Center>
  );
}

// 2. Component con: Mô phỏng Trườn Tiến Đặt Súng K20 (VNSoldier.glb)
function SoldierTruonTienModel() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/VNSoldier.glb');

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

  const { actions, names } = useAnimations(animations, group);

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
      <primitive ref={group} object={cleanScene} scale={0.85} />
    </Center>
  );
}

// 3. Component con: Mô phỏng Bò Cao truyền thống
function SoldierLegacyModel({ actionName }: { actionName: string }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/vietnam_people_army_advanced_animations.optimized.glb');
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    if (!actions || names.length === 0) return;
    const targetClip = names.includes(actionName) ? actionName : names[0];
    const action = actions[targetClip];

    if (action) {
      Object.values(actions).forEach((act) => { if (act) act.stop(); });
      action.reset();
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.fadeIn(0.2).play();
    }
    return () => {
      action?.stop();
    };
  }, [actionName, actions, names]);

  return (
    <Center top>
      <primitive ref={group} object={scene} scale={0.9} />
    </Center>
  );
}

// 4. Component chính: Thao trường mô phỏng 3D
export default function CrawlSimulation() {
  const [activeAction, setActiveAction] = useState<"BoThap" | "TruonTien" | "BoCao">("TruonTien");

  const actionGuides: Record<string, { title: string; note: string; badge: string }> = {
    TruonTien: {
      title: "Động tác Trườn Tiến Đặt Súng K20 (Súng AK-47)",
      note: "Cây súng AK-47 đặt nằm trên mặt đất. Chiến sĩ trườn tiến người lên ngang tầm súng, sau đó tay phải vươn nhấc súng chuyển dịch về phía trước đặt xuống đất rồi tiếp tục trườn tiến áp sát mục tiêu.",
      badge: "Mô hình K20 Mới",
    },
    BoThap: {
      title: "Động tác Bò Thấp dã chiến (Trang bị K20 & súng AKM)",
      note: "Người áp sát đất, tay ôm súng AKM ngang ngực chếch nòng lên tránh đất cát. Dùng mũi bàn chân và cẳng tay đẩy thân người trườn tiến vững chãi dưới tầm hỏa lực bắn tỉa.",
      badge: "Mô hình K20 Mới",
    },
    BoCao: {
      title: "Động tác Bò Cao dã chiến (20 - 30cm)",
      note: "Vận động bằng 2 cẳng tay và 2 đầu gối, thân người cách mặt đất 20-30cm. Ứng dụng khi địa hình có gờ đất hoặc cây cỏ che khuất tầm trung bình.",
      badge: "Cơ động nhanh",
    },
  };

  const currentGuide = actionGuides[activeAction];

  return (
    <div className="w-full h-full relative select-none bg-slate-950 flex flex-col">
      {/* THANH NÚT BẤM CHUYỂN ĐỔI ĐỘNG TÁC CHIẾN THUẬT */}
      <div className="absolute top-2 left-2 z-20 flex flex-wrap gap-1.5 pointer-events-auto">
        <button
          onClick={() => setActiveAction("TruonTien")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1.5 ${
            activeAction === "TruonTien"
              ? "bg-amber-500 text-slate-950 ring-2 ring-amber-300 font-extrabold"
              : "bg-slate-800/90 text-slate-200 hover:bg-slate-700"
          }`}
        >
          <span>⭐</span> 🐍 Động tác Trườn Tiến Đặt Súng K20
        </button>
        <button
          onClick={() => setActiveAction("BoThap")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1.5 ${
            activeAction === "BoThap"
              ? "bg-amber-500 text-slate-950 ring-2 ring-amber-300 font-extrabold"
              : "bg-slate-800/90 text-slate-200 hover:bg-slate-700"
          }`}
        >
          <span>⭐</span> 🪖 Động tác Bò Thấp K20 (AKM)
        </button>
        <button
          onClick={() => setActiveAction("BoCao")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1.5 ${
            activeAction === "BoCao"
              ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
              : "bg-slate-800/90 text-slate-200 hover:bg-slate-700"
          }`}
        >
          <span>🎖️</span> Động tác Bò Cao (20-30cm)
        </button>
      </div>

      {/* CHỈ DẪN KỸ THUẬT QUÂN SỰ NẰM DƯỚI ĐÁY KHÔNG GIAN 3D */}
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

      {/* KHÔNG GIAN MÔ PHỎNG 3D */}
      <div className="w-full h-full z-10 flex-1">
        <Canvas camera={{ position: [0, 1.3, 2.8], fov: 45 }} shadows>
          <ambientLight intensity={1.6} />
          <directionalLight position={[10, 20, 10]} intensity={1.8} castShadow />
          <directionalLight position={[-10, 10, -10]} intensity={0.7} />
          <directionalLight position={[0, -5, 5]} intensity={0.4} />

          <Suspense fallback={null}>
            {activeAction === "TruonTien" && <SoldierTruonTienModel key="truontien" />}
            {activeAction === "BoThap" && <SoldierBoThapModel key="bothap" />}
            {activeAction === "BoCao" && <SoldierLegacyModel key="bocao" actionName="BoCao" />}
          </Suspense>

          <OrbitControls enablePan={true} enableZoom={true} minDistance={0.8} maxDistance={8} />
        </Canvas>
      </div>
    </div>
  );
}

// Nạp trước tài nguyên vào cache
useGLTF.preload('/models/VNSoldier.glb');
useGLTF.preload('/models/VNSoldierBoThap.glb');
useGLTF.preload('/models/vietnam_people_army_advanced_animations.optimized.glb');
