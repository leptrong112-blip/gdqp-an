import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Center } from '@react-three/drei';
import { Suspense, useEffect, useState, useRef } from 'react';
import * as THREE from 'three';

// 1. Component con: Chịu trách nhiệm tải file và kích hoạt chu kỳ bò trườn
function SoldierCrawlModel({ actionName }: { actionName: string }) {
  const group = useRef<any>(null);
  
  // Nạp mô hình chiến sĩ QĐND Việt Nam trang phục K20 từ kho tài sản tĩnh
  const { scene, animations } = useGLTF('/models/vietnam_people_army_advanced_animations.optimized.glb');
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    if (names.length === 0) return;
    const targetClip = names.includes(actionName) ? actionName : names[0];
    const action = actions[targetClip];

    if (action) {
      // Dừng các hành động khác để tránh đè xương (glitch mesh)
      Object.values(actions).forEach((act) => { if (act) act.stop(); });
      
      action.reset();
      // Động tác bò trườn thao trường bắt buộc phải lặp vô hạn (LoopRepeat)
      action.setLoop(THREE.LoopRepeat, Infinity); 
      action.fadeIn(0.2).play();
    }
  }, [actionName, actions, names]);

  return (
    <Center>
      <primitive ref={group} object={scene} scale={0.9} />
    </Center>
  );
}

// 2. Component chính: Giao diện thao trường phối hợp nút điều khiển
export default function CrawlSimulation() {
  const [activeAction, setActiveAction] = useState<string>("Truon");

  return (
    <div className="w-full h-full relative select-none bg-slate-950">
      
      {/* THANH NÚT BẤM CHUYỂN ĐỔI ĐỘNG TÁC CHIẾN THUẬT */}
      <div className="absolute top-2 left-2 z-20 flex flex-wrap gap-1.5 pointer-events-auto">
        <button 
          onClick={() => setActiveAction("Truon")} 
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-all ${
            activeAction === "Truon" ? "bg-emerald-600 text-white" : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          }`}
        >
          🐍 Động tác Trườn dã chiến
        </button>
        <button 
          onClick={() => setActiveAction("BoCao")} 
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-all ${
            activeAction === "BoCao" ? "bg-emerald-600 text-white" : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          }`}
        >
          🪖 Động tác Bò Cao (20-30cm)
        </button>
      </div>

      {/* KHÔNG GIAN TRIỂN LÃM MÔ PHỎNG 3D */}
      <div className="w-full h-full z-10">
        <Canvas camera={{ position: [0, 1.2, 3], fov: 45 }} shadows>
          {/* Hệ thống đèn Studio thủ công siêu sáng và rõ nét chi tiết vân phủ (texture) */}
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
          <directionalLight position={[-10, 10, -10]} intensity={0.5} />
          
          <Suspense fallback={null}>
            <SoldierCrawlModel actionName={activeAction} />
          </Suspense>

          <OrbitControls enablePan={true} enableZoom={true} minDistance={1} maxDistance={10} />
        </Canvas>
      </div>
    </div>
  );
}

// Kích hoạt nạp trước tài nguyên vào bộ nhớ đệm giúp web chạy mượt
useGLTF.preload('/models/vietnam_people_army_advanced_animations.optimized.glb');
