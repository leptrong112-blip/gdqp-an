import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';
import { Suspense, useEffect, useState, useRef } from 'react';
import * as THREE from 'three';

function DynamicRifleModel({ modelPath }: { modelPath: string }) {
  const groupRef = useRef<any>(null);
  const { scene, animations } = useGLTF(modelPath);
  const { actions, names } = useAnimations(animations, groupRef);

  useEffect(() => {
    if (names.length > 0 && names[0] && actions[names[0]]) {
      Object.values(actions).forEach((act) => act?.stop());
      actions[names[0]]?.reset().fadeIn(0.15).play();
    }
    return () => {
      if (names.length > 0 && names[0]) actions[names[0]]?.fadeOut(0.15);
    };
  }, [modelPath, actions, names]);

  return (
    // Trả về rotation=[0, 0, 0] để sửa dứt điểm lỗi lộn ngược đầu tiếp đất tếu táo của biệt đội bắn súng
    <group position={[0, -0.6, 0]} rotation={[0, 0, 0]}>
      <primitive ref={groupRef} object={scene} scale={1} />
    </group>
  );
}

export default function PostureSimulation() {
  const [posture, setPosture] = useState<"stand" | "kneel" | "prone">("stand");

  const modelMap = {
    stand: "/models/rifle_stand.glb",
    kneel: "/models/rifle_kneel.glb",
    prone: "/models/rifle_prone.glb",
  };

  return (
    <div className="w-full h-full relative select-none bg-slate-950">
      <div className="absolute top-2 left-2 z-20 flex gap-1.5 pointer-events-auto">
        <button 
          onClick={() => setPosture("stand")} 
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-all ${
            posture === "stand" ? "bg-emerald-600 text-white" : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          }`}
        >
          🧍 Tư thế Đứng Bắn
        </button>
        <button 
          onClick={() => setPosture("kneel")} 
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-all ${
            posture === "kneel" ? "bg-emerald-600 text-white" : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          }`}
        >
          🧎 Tư thế Quỳ Bắn
        </button>
        <button 
          onClick={() => setPosture("prone")} 
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-all ${
            posture === "prone" ? "bg-emerald-600 text-white" : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          }`}
        >
          🛌 Tư thế Nằm Bắn
        </button>
      </div>

      <div className="w-full h-full z-10">
        <Canvas camera={{ position: [0, 0.5, 3], fov: 45 }} shadows>
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
          <directionalLight position={[-10, 10, -10]} intensity={0.5} />
          
          <Suspense fallback={null}>
            <DynamicRifleModel key={posture} modelPath={modelMap[posture]} />
          </Suspense>

          <OrbitControls enablePan={true} enableZoom={true} minDistance={1} maxDistance={8} />
        </Canvas>
      </div>
    </div>
  );
}

useGLTF.preload("/models/rifle_stand.glb");
useGLTF.preload("/models/rifle_kneel.glb");
useGLTF.preload("/models/rifle_prone.glb");