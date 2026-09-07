import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Center, Html, useProgress } from '@react-three/drei';
import { Suspense, useEffect, useState, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Maximize2, Minimize2 } from 'lucide-react';
import {
  AKPartDetail,
  AK_STRUCTURE_PARTS,
  AK_STEPS_THAO,
  AK_STEPS_LAP,
} from '../data/ak47StructureData';

// Component "CameraRig" - Điều khiển Smooth Camera Lerp khi focus vào từng bộ phận
function CameraRig({ targetMesh }: { targetMesh: THREE.Object3D | null }) {
  const { camera, controls } = useThree();
  const [lerpState, setLerpState] = useState<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  useEffect(() => {
    if (targetMesh) {
      const box = new THREE.Box3().setFromObject(targetMesh);
      const center = new THREE.Vector3();
      box.getCenter(center);

      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const zoomDistance = Math.max(1.6, maxDim * 1.6);

      const direction = camera.position.clone().sub(center).normalize();
      const idealPos = center.clone().add(direction.multiplyScalar(zoomDistance));

      setLerpState({ pos: idealPos, target: center });
    } else {
      setLerpState({ pos: new THREE.Vector3(0, 0, 4.8), target: new THREE.Vector3(0, 0, 0) });
    }
  }, [targetMesh, camera]);

  useFrame(() => {
    if (!controls || !lerpState) return;

    const distPos = camera.position.distanceTo(lerpState.pos);
    const distTarget = (controls as any).target.distanceTo(lerpState.target);

    if (distPos > 0.04 || distTarget > 0.04) {
      camera.position.lerp(lerpState.pos, 0.08);
      (controls as any).target.lerp(lerpState.target, 0.08);
      (controls as any).update();
    } else {
      setLerpState(null);
    }
  });

  return null;
}

interface AK47ModelProps {
  section: "structure" | "procedure";
  mode: "thao" | "lap";
  stepIndex: number;
  activePartId?: string | null;
  onPartSelect: (part: AKPartDetail | null) => void;
  onMeshSelect: (mesh: THREE.Object3D | null) => void;
  onStepSelect: (step: number) => void;
}

// Hiển thị tiến trình tải mô hình 3D trong không gian 3D
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

// AK47 Model Renderer với cơ chế Scrubbing & tương tác 2 chiều
function AK47Model({
  section,
  mode,
  stepIndex,
  activePartId,
  onPartSelect,
  onMeshSelect,
  onStepSelect,
}: AK47ModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/ak47.glb');
  const { actions, names } = useAnimations(animations, group);
  const currentAnimTime = useRef<number>(0);

  // Tính toán mốc thời gian mục tiêu của hoạt ảnh
  const targetTime = useMemo(() => {
    if (section === "structure") {
      return 0.00; // Súng ở trạng thái tĩnh nguyên vẹn
    }
    if (mode === "thao") {
      return AK_STEPS_THAO[stepIndex]?.targetTime ?? 0.00;
    } else {
      return AK_STEPS_LAP[stepIndex]?.targetTime ?? 15.42;
    }
  }, [section, mode, stepIndex]);

  // Cập nhật mượt mà tư thế tháo/lắp theo thời gian thực (60 FPS)
  useFrame((_state, delta) => {
    if (!actions || names.length === 0) return;
    const action = actions[names[0]];
    if (!action) return;

    if (!action.isRunning()) {
      action.play();
      action.paused = true;
    }

    const diff = targetTime - currentAnimTime.current;
    if (Math.abs(diff) > 0.02) {
      const speed = 2.4; // Tốc độ trượt chuyển động
      const deltaMove = Math.sign(diff) * Math.min(Math.abs(diff), delta * speed);
      currentAnimTime.current += deltaMove;
      action.time = currentAnimTime.current;
      action.getMixer().update(0);
    }
  });

  // Focus mesh khi người dùng chọn từ danh sách bên ngoài
  useEffect(() => {
    if (!activePartId || !scene) return;
    const part = AK_STRUCTURE_PARTS.find((p) => p.id === activePartId);
    if (!part) return;

    let found: THREE.Object3D | null = null;
    scene.traverse((child) => {
      if (found) return;
      if (child.name.toLowerCase().includes(part.meshPrefix)) {
        found = child;
      }
    });

    if (found) {
      onMeshSelect(found);
    }
  }, [activePartId, scene, onMeshSelect]);

  // Xử lý khi nhấp chuột trực tiếp lên chi tiết 3D của súng
  const handleMeshClick = (e: any) => {
    e.stopPropagation();
    const clickedMesh = e.object as THREE.Object3D;
    const meshName = clickedMesh.name.toLowerCase();
    onMeshSelect(clickedMesh);

    if (section === "procedure") {
      // Ở chế độ tháo lắp: Nhấp vào bộ phận nào thì bảng tự động nhảy đúng thứ tự bước tháo/lắp bộ phận đó!
      let targetStep = -1;
      if (meshName.includes("mag")) {
        targetStep = mode === "thao" ? 0 : 5;
      } else if (meshName.includes("shompol") || meshName.includes("knife")) {
        targetStep = mode === "thao" ? 1 : 4;
      } else if (meshName.includes("crishk")) {
        targetStep = mode === "thao" ? 2 : 3;
      } else if (meshName.includes("2_low") || meshName.includes("pruj")) {
        targetStep = mode === "thao" ? 3 : 2;
      } else if (meshName.includes("spusk") || meshName.includes("vtulk") || meshName.includes("patr")) {
        targetStep = mode === "thao" ? 4 : 1;
      } else if (meshName.includes("pd3") || meshName.includes("prik") || meshName.includes("pd1") || meshName.includes("pd2")) {
        targetStep = mode === "thao" ? 5 : 0;
      }

      if (targetStep !== -1) {
        onStepSelect(targetStep);
      }
    } else {
      // Ở chế độ cấu tạo súng: Tìm chính xác 1 bộ phận độc lập để hiển thị chú thích riêng biệt
      const part = AK_STRUCTURE_PARTS.find((p) => meshName.includes(p.meshPrefix));
      if (part) {
        onPartSelect(part);
      }
    }
  };

  return (
    <Center>
      <primitive
        ref={group}
        object={scene}
        scale={0.01}
        onClick={handleMeshClick}
      />
    </Center>
  );
}

interface AK47SimulationProps {
  theme?: "dark" | "light";
  section: "structure" | "procedure";
  mode: "thao" | "lap";
  stepIndex: number;
  activePartId?: string | null;
  onPartSelect: (part: AKPartDetail | null) => void;
  onStepSelect: (step: number) => void;
  cameraResetKey?: number;
}

export default function AK47Simulation({
  theme = "dark",
  section = "structure",
  mode = "thao",
  stepIndex = 0,
  activePartId = null,
  onPartSelect,
  onStepSelect,
  cameraResetKey,
}: AK47SimulationProps) {
  const [targetMesh, setTargetMesh] = useState<THREE.Object3D | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lắng nghe phím F11 / toàn màn hình
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Xử lý khi bấm nút đặt lại góc nhìn camera
  useEffect(() => {
    if (cameraResetKey !== undefined && cameraResetKey > 0) {
      setTargetMesh(null);
    }
  }, [cameraResetKey]);

  const isLight = theme === "light";

  return (
    <div className="w-full h-full flex-1 min-h-0 relative flex flex-col select-none overflow-hidden bg-slate-950">
      {/* Background Image with Blur */}
      <div
        className="absolute inset-0 pointer-events-none z-0 transform scale-105 transition-all duration-300"
        style={{
          backgroundImage: 'url(/military_range_bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 45%',
          filter: 'blur(5px)',
        }}
      />

      {/* Dimmed Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: isLight
            ? 'rgba(15, 23, 42, 0.45)'
            : 'rgba(5, 12, 22, 0.65)',
        }}
      />

      {/* Radial Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 25%, rgba(2,6,14,0.75) 100%)',
        }}
      />

      {/* NATIVE FULLSCREEN EXIT BUTTON */}
      {isFullscreen && (
        <div className="absolute top-3 right-3 z-30 pointer-events-auto">
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-900/90 backdrop-blur-md border border-white/20 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xl flex items-center gap-1.5"
            title="Thoát toàn màn hình"
          >
            <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Thoát toàn màn hình</span>
          </button>
        </div>
      )}

      {/* 3D CANVAS CONTAINER */}
      <div className="w-full h-full flex-1 min-h-0 relative z-10">
        <Canvas
          camera={{ position: [0, 0, 4.8], fov: 42 }}
          shadows
          gl={{ alpha: true }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          <ambientLight intensity={1.3} />
          <directionalLight position={[10, 20, 10]} intensity={2.5} castShadow />
          <directionalLight position={[-10, 10, -15]} intensity={1.2} />
          <pointLight position={[0, 5, 0]} intensity={1.5} />
          <pointLight position={[0, -2, 4]} intensity={0.6} color="#f5c842" />

          <Suspense fallback={<Model3DLoader />}>
            <group rotation={[0, Math.PI / 2, 0]}>
              <AK47Model
                section={section}
                mode={mode}
                stepIndex={stepIndex}
                activePartId={activePartId}
                onPartSelect={onPartSelect}
                onMeshSelect={setTargetMesh}
                onStepSelect={onStepSelect}
              />
            </group>
          </Suspense>

          <CameraRig targetMesh={targetMesh} />
          <OrbitControls makeDefault enablePan={true} enableZoom={true} minDistance={1} maxDistance={20} />
        </Canvas>
      </div>

      {/* FLOATING HINT AT BOTTOM */}
      <div className="absolute bottom-14 lg:bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-max max-w-[90vw]">
        <div
          className="px-3.5 py-1.5 rounded-full text-[11px] font-medium flex items-center gap-1.5 shadow-lg transition-colors duration-300 text-slate-300"
          style={{
            background: 'rgba(10, 17, 27, 0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <span className="text-amber-400 font-semibold">💡 MẸO</span>
          <span className="text-slate-600">|</span>
          <span className="truncate">
            {section === "structure"
              ? "Nhấp vào bộ phận trên súng để xem cấu tạo riêng biệt · Kéo chuột xoay 360°"
              : "Nhấp vào bộ phận hoặc bấm bước để quan sát chuyển động tháo/lắp"}
          </span>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload('/models/ak47.glb');