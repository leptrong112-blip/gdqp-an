import { Canvas, useFrame, useGraph } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';
import { Suspense, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { createGroundFlight, type Flight, type PhysicsEngine, type Vec3 } from '../../features/physics/projectile';
import { usePhysicsEngineState } from '../../features/physics/usePhysicsEngine';
import WasmCompatibilityNotice from '../WasmCompatibilityNotice';

// 💡 THUẬT TOÁN QUÉT XƯƠNG (Chỉ giữ lại để tìm tọa độ phóng lựu đạn)
function findHandBone(nodes: any, isLeftHand: boolean) {
  const keys = Object.keys(nodes);
  const targetToken = isLeftHand ? "left" : "right";
  const altToken = isLeftHand ? "l" : "r";
  const vnToken = isLeftHand ? "trai" : "phai";

  const foundKey = keys.find(k => {
    const name = k.toLowerCase();
    const hasHandKeyword = name.includes("hand") || name.includes("wrist") || name.includes("tay") || name.includes("palm");
    const hasSideKeyword = name.includes(targetToken) || 
                           name.includes(vnToken) ||
                           name.endsWith(altToken) || 
                           name.includes("_" + altToken) || 
                           name.includes("." + altToken) || 
                           name.includes(":" + altToken);
    return hasHandKeyword && hasSideKeyword;
  });
  
  return foundKey ? nodes[foundKey] : null;
}

// 1. Component Người lính (Đã xóa code gắn súng AK thừa, dùng full từ Blender)
function SoldierWithWeapons({ 
  isThrowing, 
  isReleased, 
  onRelease, 
  rotationAngle 
}: { isThrowing: boolean; isReleased: boolean; onRelease: (pos: [number, number, number]) => void; rotationAngle: number }) {
  const groupRef = useRef<THREE.Group>(null);

  // Nạp model đã có sẵn súng và lựu đạn từ Blender
  const { scene, animations } = useGLTF('/models/tu_the_nem.glb');
  const { nodes } = useGraph(scene);
  const { actions, names } = useAnimations(animations, groupRef);

  // Tìm xương tay phải để lấy tọa độ phóng đạn
  const rightHandBone = useMemo(() => findHandBone(nodes, false), [nodes]);

  const onReleaseRef = useRef(onRelease);
  useEffect(() => { onReleaseRef.current = onRelease; }, [onRelease]);

  // Điều khiển trạng thái diễn hoạt
  useEffect(() => {
    if (names.length === 0) return;
    const action = actions[names[0]];
    if (!action) return;

    if (isThrowing) {
      action.paused = false;
      action.reset().setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.fadeIn(0.05).play();
    } else {
      action.reset();
      action.paused = true;
      action.play();
    }
  }, [isThrowing, actions, names]);

  // Quét Frame 373 để phóng đạn
  useFrame(() => {
    const action = names.length > 0 ? actions[names[0]] : null;

    if (isThrowing && action && !isReleased) {
      const duration = action.getClip().duration;
      const currentTime = action.time;
      const progress = currentTime / duration;
      
      if (progress >= 0.82) { // ~Frame 373
        if (rightHandBone) {
          const worldPos = new THREE.Vector3();
          rightHandBone.getWorldPosition(worldPos);
          onReleaseRef.current([worldPos.x, worldPos.y, worldPos.z]);
        } else {
          // Backup nếu không tìm thấy xương
          onReleaseRef.current([-0.5, 1.5, 0]);
        }
      }
    }
  });

  return (
    <group position={[-1.5, -0.5, 0]} rotation={[0, rotationAngle, 0]}>
      <primitive ref={groupRef} object={scene} scale={1} />
    </group>
  );
}

// 2. Component Quả lựu đạn bay Parabol (Lựu đạn này để tạo quỹ đạo bay)
function FlyingGrenade({ isFlying, visible, spawnPos, rotationAngle, onHit, physics }: { isFlying: boolean; visible: boolean; spawnPos: Vec3; rotationAngle: number; onHit: (position: Vec3) => void; physics: PhysicsEngine }) {
  const pathRef = useRef<Flight | null>(null);
  const pointRef = useRef<Vec3>([0, 0, 0]);
  const hitRef = useRef(false);
  const grenadeRef = useRef<THREE.Group>(null);
  const timeRef = useRef<number>(0);
  const [hasHit, setHasHit] = useState<boolean>(false);
  const { scene } = useGLTF('/models/grenade.glb');
  const grenadeClone = useMemo(() => scene.clone(), [scene]);

  useFrame((state, delta) => {
    if (!isFlying || !grenadeRef.current || !visible || hasHit) return;
    
    if (hitRef.current) return;
    if (!pathRef.current) {
      // Preserve the existing stylized launch; rotate it with the character.
      // Scene parameters are not calibrated to real equipment.
      pathRef.current = createGroundFlight(physics,
        [spawnPos[0], Math.max(-0.4, spawnPos[1]), spawnPos[2]],
        [3.6 * Math.cos(rotationAngle), 3.5, -3.6 * Math.sin(rotationAngle)], -0.4, 9.8);
    }
    // Ignore background-tab gaps while preserving ordinary frame-rate independence.
    if (document.hidden) return;
    timeRef.current += Math.min(delta, 0.1) * 1.6;
    const path = pathRef.current;
    const point = path.sample(timeRef.current, pointRef.current);
    grenadeRef.current.position.fromArray(point);
    grenadeRef.current.rotation.x = timeRef.current * 7.5;
    if (timeRef.current >= path.duration) {
      hitRef.current = true;
      setHasHit(true);
      onHit([...point]);
    }
  });

  useEffect(() => { 
    if (!isFlying) {
      timeRef.current = 0;
      pathRef.current = null;
      hitRef.current = false;
      setHasHit(false);
    }
  }, [isFlying]);

  return <primitive ref={grenadeRef} object={grenadeClone} position={spawnPos} scale={0.01} visible={visible && !hasHit} />;
}

// 3. Component Hiệu ứng pháo hoa bùng nổ
function ExplosionEffect({ triggerCount, position }: { triggerCount: number; position: Vec3 }) {
  const groupRef = useRef<THREE.Group>(null);
  const lastTriggerRef = useRef<number>(0);
  const particlesDataRef = useRef<any[]>([]);
  const [active, setActive] = useState<boolean>(false);

  useEffect(() => {
    if (triggerCount === 0 || triggerCount === lastTriggerRef.current) return;
    lastTriggerRef.current = triggerCount;

    particlesDataRef.current = Array.from({ length: 45 }).map(() => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const speed = 4.0 + Math.random() * 5.0; 

      return {
        x: position[0], y: position[1], z: position[2],
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: (Math.cos(phi) * speed) + 4.5, 
        vz: Math.sin(phi) * Math.sin(theta) * speed,
        life: 1.0
      };
    });
    setActive(true);
  }, [triggerCount, position]);

  useFrame((state, delta) => {
    if (!active || !groupRef.current) return;
    let anyAlive = false;
    const meshes = groupRef.current.children;

    particlesDataRef.current.forEach((p, i) => {
      if (i >= meshes.length) return;
      const mesh = meshes[i] as THREE.Mesh;
      p.life -= delta * 1.8;

      if (p.life > 0) {
        anyAlive = true;
        p.vy -= delta * 12.0; 
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.z += p.vz * delta;
        mesh.position.set(p.x, p.y, p.z);
        mesh.scale.setScalar(p.life * 1.2); 
        if (mesh.material) (mesh.material as THREE.MeshBasicMaterial).opacity = p.life;
      } else {
        mesh.position.set(0, -999, 0);
      }
    });
    if (!anyAlive) setActive(false);
  });

  return (
    <group ref={groupRef}>
      {active && Array.from({ length: 45 }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshBasicMaterial transparent opacity={1} color={["#ff3333", "#ff9900", "#ffff33", "#ffffff"][i % 4]} />
        </mesh>
      ))}
    </group>
  );
}

// 4. Giao diện Thao Trường
export default function GrenadeSimulation() {
  const physicsState = usePhysicsEngineState();
  const [isThrowing, setIsThrowing] = useState<boolean>(false);
  const [isReleased, setIsReleased] = useState<boolean>(false);
  const [explosionTrigger, setExplosionTrigger] = useState<number>(0);
  const [impactPosition, setImpactPosition] = useState<Vec3>([0, -0.4, 0]);
  const [attempt, setAttempt] = useState(0);
  const [msg, setMsg] = useState<string>("Sẵn sàng bốc chốt... Bấm nút để thực hành ném!");
  const [handSpawnPos, setHandSpawnPos] = useState<[number, number, number]>([-1.5, 0.5, 0]);
  const [rotY, setRotY] = useState<number>(0); 

  const handleStart = useCallback(() => {
    setIsThrowing(true);
    setIsReleased(false);
    setMsg("Đang thực hiện chuyển động ném…");
  }, []);

  const handleRelease = useCallback((handWorldPos: [number, number, number]) => {
    setHandSpawnPos(handWorldPos);
    setIsReleased(true); 
    setMsg("Vật ném đang bay…");
  }, []);

  const handleHit = useCallback((position: Vec3) => {
    setImpactPosition(position);
    setMsg(Math.hypot(position[0] - 2, position[2]) <= 0.35
      ? "Vật ném đã chạm vùng đánh dấu."
      : "Vật ném đã chạm đất ngoài vùng đánh dấu.");
    setExplosionTrigger(prev => prev + 1); 
  }, []);

  const handleReset = useCallback(() => {
    setAttempt(value => value + 1);
    setExplosionTrigger(0);
    setIsThrowing(false);
    setIsReleased(false);
    setMsg("Sẵn sàng bốc chốt... Bấm nút để thực hành ném!");
  }, []);

  return (
    <div className="w-full h-full relative select-none bg-slate-950">
      <div className="absolute top-2 left-2 z-20 flex gap-2 pointer-events-auto">
        <button disabled={isThrowing} onClick={handleStart} className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95">🚀 Ném Lựu Đạn</button>
        <button onClick={handleReset} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95">🔄 Nạp lại đạn</button>
      </div>

      <div role="status" aria-live="polite" className="absolute top-12 left-2 right-2 z-20 pointer-events-none text-xs text-amber-100 bg-slate-900/85 rounded-lg p-2">{msg}</div>

      {physicsState.status === 'fallback' && (
        <WasmCompatibilityNotice feature="physics" className="absolute top-24 left-2 right-2 z-20 max-w-md pointer-events-none" />
      )}

      <div className="absolute bottom-2 right-2 z-20 bg-slate-900/90 border border-slate-700 p-2.5 rounded-xl text-white text-[10px] w-52 flex flex-col gap-2 pointer-events-auto shadow-xl">
        <div className="font-bold text-amber-400 border-b border-slate-700 pb-1 flex justify-between">
          <span>🛠️ CĂN CHỈNH</span>
          <span className={`font-mono px-1 rounded text-[8px] ${isThrowing ? "bg-amber-100/20 text-amber-300" : "bg-slate-100/20 text-slate-300"}`}>
            {isReleased ? "ĐÃ NÉM" : isThrowing ? "ĐANG VUNG..." : "SẴN SÀNG"}
          </span>
        </div>
        <div>
          <span className="block mb-1 text-slate-300">Hướng mặt nhân vật:</span>
          <fieldset disabled={isThrowing} className="grid grid-cols-4 gap-1 disabled:opacity-50">
            <button onClick={() => setRotY(0)} className={`p-1 rounded text-[9px] font-bold ${rotY === 0 ? 'bg-emerald-600' : 'bg-slate-800'}`}>0°</button>
            <button onClick={() => setRotY(Math.PI / 2)} className={`p-1 rounded text-[9px] font-bold ${rotY === Math.PI / 2 ? 'bg-emerald-600' : 'bg-slate-800'}`}>90°</button>
            <button onClick={() => setRotY(Math.PI)} className={`p-1 rounded text-[9px] font-bold ${rotY === Math.PI ? 'bg-emerald-600' : 'bg-slate-800'}`}>180°</button>
            <button onClick={() => setRotY(-Math.PI / 2)} className={`p-1 rounded text-[9px] font-bold ${rotY === -Math.PI / 2 ? 'bg-emerald-600' : 'bg-slate-800'}`}>270°</button>
          </fieldset>
        </div>
      </div>

      <div className="w-full h-full z-10">
        <Canvas camera={{ position: [0, 1.5, 4.5], fov: 40 }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} />
          <Suspense fallback={null}>
            <SoldierWithWeapons isThrowing={isThrowing} isReleased={isReleased} onRelease={handleRelease} rotationAngle={rotY} />
            <FlyingGrenade key={`flight-${attempt}`} isFlying={isThrowing} visible={isReleased} spawnPos={handSpawnPos} rotationAngle={rotY} onHit={handleHit} physics={physicsState.engine} />
            <ExplosionEffect key={`effect-${attempt}`} triggerCount={explosionTrigger} position={impactPosition} />
            <mesh position={[2, -0.49, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.35, 32]} /><meshStandardMaterial color="#dc2626" /></mesh>
            <mesh position={[2, -0.485, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.2, 32]} /><meshStandardMaterial color="#ffffff" /></mesh>
            <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[10, 10]} /><meshStandardMaterial color="#1e293b" /></mesh>
          </Suspense>
          <OrbitControls enablePan={false} />
        </Canvas>
      </div>
    </div>
  );
}

useGLTF.preload('/models/tu_the_nem.glb');
useGLTF.preload('/models/grenade.glb');
