import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Center } from '@react-three/drei';
import { Suspense, useEffect, useState, useRef } from 'react';
import * as THREE from 'three';

function DynamicRifleModel({ animationName }: { animationName: string }) {
  const groupRef = useRef<any>(null);
  const { scene, animations } = useGLTF('/models/vietnam_people_army_advanced_animations.glb');
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
    <Center>
      <primitive ref={groupRef} object={scene} scale={0.9} />
    </Center>
  );
}

export default function PostureSimulation() {
  const [posture, setPosture] = useState<"stand" | "kneel" | "prone">("stand");

  const animMap = {
    stand: "CanhGioiCoDong",
    kneel: "QuyBan",
    prone: "NamBan",
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
          🧍 Tư thế Đứng Bắn (Cảnh giới)
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
            <DynamicRifleModel key={posture} animationName={animMap[posture]} />
          </Suspense>

          <OrbitControls enablePan={true} enableZoom={true} minDistance={1} maxDistance={8} />
        </Canvas>
      </div>
    </div>
  );
}

useGLTF.preload("/models/vietnam_people_army_advanced_animations.glb");