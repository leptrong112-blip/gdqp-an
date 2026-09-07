import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Center } from '@react-three/drei';
import { Suspense, useEffect, useState, useRef } from 'react';
import * as THREE from 'three';

// 1. Component con: Chịu trách nhiệm tải file và kích hoạt chu kỳ bò trườn
function SoldierCrawlModel({ actionIndex }: { actionIndex: number }) {
  const group = useRef<any>(null);
  
  // Nạp mô hình lê đội trưởng của ông từ kho tài sản tĩnh
  const { scene, animations } = useGLTF('/models/soldier_crawl.glb');
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    if (names.length === 0) return;
    
    // Đảm bảo nút bấm không gọi vượt quá số lượng animation thực tế trong file
    const safeIndex = actionIndex % names.length;
    const currentActionName = names[safeIndex];
    
    if (!currentActionName) return;
    const action = actions[currentActionName];

    if (action) {
      // Dừng các hành động khác để tránh đè xương (glitch mesh)
      Object.values(actions).forEach((act) => { if (act) act.stop(); });
      
      action.reset();
      // Động tác bò trườn thao trường bắt buộc phải lặp vô hạn (LoopRepeat)
      action.setLoop(THREE.LoopRepeat, Infinity); 
      action.fadeIn(0.2).play();
    }
  }, [actionIndex, actions, names]);

  return (
    <Center>
      {/* 💡 MẸO: Nếu anh lính hiện lên bị to quá hoặc nhỏ quá, ông chỉnh lại hệ số scale này nhé (ví dụ 0.5 hoặc 1.5) */}
      <primitive ref={group} object={scene} scale={1} />
    </Center>
  );
}

// 2. Component chính: Giao diện thao trường phối hợp nút điều khiển
export default function CrawlSimulation() {
  const [activeAnimationIndex, setActiveAnimationIndex] = useState<number>(0);

  return (
    <div className="w-full h-full relative select-none bg-slate-950">
      
      {/* THANH NÚT BẤM CHUYỂN ĐỔI ĐỘNG TÁC CHIẾN THUẬT */}
      <div className="absolute top-2 left-2 z-20 flex flex-wrap gap-1.5 pointer-events-auto">
        <button 
          onClick={() => setActiveAnimationIndex(0)} 
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-all ${
            activeAnimationIndex === 0 ? "bg-emerald-600 text-white" : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          }`}
        >
          🪖 Động tác bò trườn 1
        </button>
        <button 
          onClick={() => setActiveAnimationIndex(1)} 
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-all ${
            activeAnimationIndex === 1 ? "bg-emerald-600 text-white" : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          }`}
        >
          🧗 Động tác bò trườn 2
        </button>
      </div>

      {/* KHÔNG GIAN TRIỂN LÃM MÔ PHỎNG 3D */}
      <div className="w-full h-full z-10">
        <Canvas camera={{ position: [0, 1.5, 4], fov: 45 }} shadows>
          {/* Hệ thống đèn Studio thủ công siêu sáng và rõ nét chi tiết vân phủ (texture) */}
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
          <directionalLight position={[-10, 10, -10]} intensity={0.5} />
          
          <Suspense fallback={null}>
            <SoldierCrawlModel actionIndex={activeAnimationIndex} />
          </Suspense>

          <OrbitControls enablePan={true} enableZoom={true} minDistance={1} maxDistance={10} />
        </Canvas>
      </div>
    </div>
  );
}

// Kích hoạt nạp trước tài nguyên vào bộ nhớ đệm giúp web chạy mượt
useGLTF.preload('/models/soldier_crawl.glb');