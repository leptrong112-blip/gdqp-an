import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Center, Html, useProgress } from '@react-three/drei';
import { Component, Suspense, useEffect, useState, useRef, useMemo, type ReactNode, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Maximize2, Minimize2, Eye, EyeOff, RotateCcw, Sparkles } from 'lucide-react';
import {
  AKPartDetail,
  AK_STRUCTURE_PARTS,
  AK_STEPS_THAO,
  AK_STEPS_LAP,
  getAKPartIdFromMeshName,
  matchMeshToPart,
} from '../data/ak47StructureData';

import { getAKModelPath, getAKClipTime } from '../data/ak47ProcedureAsset';

// Keep asset failures inside the viewport so the step navigation remains usable.
class AKModelBoundary extends Component<
  { modelPath: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error(`[AK47Simulation] Không tải được model: ${this.props.modelPath}`, error);
  }

  render() {
    if (this.state.failed) {
      return <Html center><div role="alert" className="rounded-xl bg-slate-950/95 p-4 text-center text-white min-w-[260px]">
        <p>Không tải được mô hình của bước này.</p>
        <p className="mt-2 text-xs break-all text-slate-300">{this.props.modelPath}</p>
        <p className="mt-2 text-xs">Bạn vẫn có thể chọn bước khác.</p>
      </div></Html>;
    }
    return this.props.children;
  }
}

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
      const zoomDistance = Math.max(2.2, maxDim * 2.2);

      const direction = camera.position.clone().sub(center).normalize();
      const idealPos = center.clone().add(direction.multiplyScalar(zoomDistance));

      setLerpState({ pos: idealPos, target: center });
    } else {
      setLerpState({ pos: new THREE.Vector3(0, 0, 3.8), target: new THREE.Vector3(0, 0, 0) });
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
  modelPath: string;
  currentAnimTime: MutableRefObject<number>;
  section: "structure" | "procedure";
  mode: "thao" | "lap";
  stepIndex: number;
  activePartId?: string | null;
  xrayMode?: boolean;
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

// AK47 Model Renderer với cơ chế Scrubbing, Highlight phát sáng và chế độ X-Ray xuyên thấu
function AK47Model({
  modelPath,
  currentAnimTime,
  section,
  mode,
  stepIndex,
  activePartId,
  xrayMode = false,
  onPartSelect,
  onMeshSelect,
  onStepSelect,
}: AK47ModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene: sourceScene, animations } = useGLTF(modelPath);
  // Asset switches must not leave poses or highlight materials in the shared cache.
  const scene = useMemo(() => clone(sourceScene), [sourceScene]);
  const { actions, names } = useAnimations(animations, group);
  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null);

  // Resume the same procedure time when crossing the step-specific asset boundary.
  useEffect(() => {
    onMeshSelect(null);
    const action = actions[names[0]];
    if (action) {
      action.play();
      action.paused = true;
      action.time = Math.min(action.getClip().duration, getAKClipTime(modelPath, currentAnimTime.current));
      action.getMixer().update(0);
    } else {
      console.warn(`[AK47Simulation] Model không có animation, hiển thị tĩnh: ${modelPath}`);
    }
  }, [actions, names, modelPath, currentAnimTime, onMeshSelect]);

  const meshMap = useRef<{
    mesh: THREE.Mesh;
    origColor: THREE.Color;
    origEmissive: THREE.Color;
    origEmissiveIntensity: number;
    origTransparent: boolean;
    origOpacity: number;
    partId: string | null;
  }[]>([]);

  // Tách biệt vật liệu độc lập cho từng mesh khi tải mô hình 3D (tránh lỗi dùng chung material)
  useEffect(() => {
    if (!scene) return;
    const list: typeof meshMap.current = [];
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        // Bắt buộc clone riêng biệt material cho từng mesh để chỉnh màu độc lập
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else if (mesh.material) {
          mesh.material = mesh.material.clone();
        }

        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          // Bắt buộc reset mọi material về trạng thái đặc nguyên khối
          m.transparent = false;
          m.opacity = 1.0;
          m.depthWrite = true;

          if (m instanceof THREE.MeshStandardMaterial) {
            // Tinh chỉnh metalness & roughness để thân kim loại đón sáng rõ ràng:
            // Cân bằng metalness ~0.35 để phần kim loại đen không bị triệt tiêu ánh sáng diffuse,
            // giúp nhìn rõ từng chi tiết cơ khí (nắp hộp khóa nòng, thân súng, nòng, thước ngắm...)
            m.metalness = 0.35;
            m.roughness = 0.55;
          }
        });

        const primaryMat = mats[0] as THREE.MeshStandardMaterial;
        const partId = getAKPartIdFromMeshName(mesh.name);

        list.push({
          mesh,
          origColor: primaryMat?.color ? primaryMat.color.clone() : new THREE.Color(1, 1, 1),
          origEmissive: primaryMat?.emissive ? primaryMat.emissive.clone() : new THREE.Color(0, 0, 0),
          origEmissiveIntensity: primaryMat?.emissiveIntensity || 0,
          origTransparent: false,
          origOpacity: 1.0,
          partId,
        });
      }
    });
    meshMap.current = list;
    return () => {
      list.forEach(({ mesh }) => {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach(material => material.dispose());
      });
      meshMap.current = [];
      document.body.style.cursor = 'auto';
    };
  }, [scene]);

  // Cập nhật hiệu ứng phát sáng (Highlight) và X-Ray xuyên thấu chuẩn xác 100%
  useEffect(() => {
    const list = meshMap.current;
    if (!list.length) return;

    // Các bộ phận vỏ bọc bên ngoài sẽ mờ đi khi bật X-Ray
    const outerPartIds = ["receiver_box", "cover", "stock", "handguard", "barrel", "grip"];

    for (const item of list) {
      const { mesh, origColor, origEmissive, origEmissiveIntensity, partId } = item;

      const isSelected = Boolean(
        activePartId &&
        (partId === activePartId || (activePartId.length > 3 && mesh.name.toLowerCase().startsWith(activePartId.toLowerCase())))
      );
      const isHovered = Boolean(hoveredPartId && partId === hoveredPartId);
      const isOuter = Boolean(partId && outerPartIds.includes(partId));

      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        if (!(mat instanceof THREE.MeshStandardMaterial)) return;

        if (isSelected) {
          // Chi tiết được chọn: Giữ nguyên vân kim loại/gỗ, phủ hào quang Emerald ngọc lục bảo phát sáng rực rỡ, ĐẶC 100%
          mat.color.copy(origColor);
          mat.emissive.set('#10b981');
          mat.emissiveIntensity = 0.95;
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.depthWrite = true;
        } else if (isHovered) {
          // Rê chuột qua: Viền Cyan nổi bật
          mat.color.copy(origColor);
          mat.emissive.set('#06b6d4');
          mat.emissiveIntensity = 0.55;
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.depthWrite = true;
        } else if (xrayMode && isOuter) {
          // Chế độ X-Ray (CHỈ KHI BẬT): Vỏ ngoài mờ ảo như kính pha lê để nhìn cơ cấu bên trong
          mat.color.set('#334155');
          mat.emissive.set('#000000');
          mat.emissiveIntensity = 0;
          mat.transparent = true;
          mat.opacity = 0.22;
          mat.depthWrite = false;
        } else {
          // Trạng thái bình thường: Tuyệt đối KHÔNG TRONG SUỐT (Súng luôn đặc 100% nguyên bản)
          mat.color.copy(origColor);
          mat.emissive.copy(origEmissive);
          mat.emissiveIntensity = origEmissiveIntensity;
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.depthWrite = true;
        }
        mat.needsUpdate = true;
      });
    }
  }, [activePartId, hoveredPartId, xrayMode, scene]);

  // Tính toán mốc thời gian mục tiêu của hoạt ảnh
  const targetTime = useMemo(() => {
    if (section === "structure") {
      return 0.00; // Súng ở trạng thái tĩnh nguyên vẹn
    }
    if (stepIndex === -1) {
      return mode === "thao" ? 0.00 : 15.42; // Trạng thái chờ: thao = súng nguyên vẹn, lap = súng đã tháo xong
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
    if (Math.abs(diff) > 0) {
      const speed = 2.4; // Tốc độ trượt chuyển động
      const deltaMove = Math.sign(diff) * Math.min(Math.abs(diff), delta * speed);
      currentAnimTime.current += deltaMove;
      action.time = Math.min(action.getClip().duration, getAKClipTime(modelPath, currentAnimTime.current));
      action.getMixer().update(0);
    }
  });

  // Focus mesh khi người dùng chọn từ danh sách bên ngoài
  useEffect(() => {
    if (!activePartId || !scene) return;
    let found: THREE.Object3D | null = null;
    scene.traverse((child) => {
      if (found) return;
      if ((child as THREE.Mesh).isMesh) {
        const partId = getAKPartIdFromMeshName(child.name);
        if (partId === activePartId || child.name.toLowerCase().startsWith(activePartId.toLowerCase())) {
          found = child;
        }
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
    onMeshSelect(clickedMesh);

    if (section === "procedure") {
      const partId = getAKPartIdFromMeshName(clickedMesh.name);
      let targetStep = -1;
      if (partId === "mag") targetStep = mode === "thao" ? 0 : 5;
      else if (partId === "rod" || partId === "bayonet") targetStep = mode === "thao" ? 1 : 4;
      else if (partId === "cover") targetStep = mode === "thao" ? 2 : 3;
      else if (partId === "return_spring") targetStep = mode === "thao" ? 3 : 2;
      else if (partId === "bolt_carrier" || partId === "bolt") targetStep = mode === "thao" ? 4 : 1;
      else if (partId === "gas_tube" || partId === "handguard") targetStep = mode === "thao" ? 5 : 0;

      if (targetStep !== -1) {
        onStepSelect(targetStep);
      }
    } else {
      const part = matchMeshToPart(clickedMesh.name);
      if (part) {
        onPartSelect(part);
      }
    }
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Object3D;
    const part = matchMeshToPart(mesh.name);
    if (part) {
      setHoveredPartId(part.id);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHoveredPartId(null);
    document.body.style.cursor = 'auto';
  };

  return (
    <Center>
      <primitive
        ref={group}
        object={scene}
        scale={0.01}
        onClick={handleMeshClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
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
  highlightEnabled?: boolean;
  onToggleHighlight?: () => void;
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
  highlightEnabled = true,
  onToggleHighlight,
  onPartSelect,
  onStepSelect,
  cameraResetKey,
}: AK47SimulationProps) {
  const modelPath = getAKModelPath(section, mode, stepIndex);
  const currentAnimTime = useRef(0);
  const [targetMesh, setTargetMesh] = useState<THREE.Object3D | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [xrayMode, setXrayMode] = useState(false);
  const selectedPart = AK_STRUCTURE_PARTS.find((p) => p.id === activePartId);

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
      {/* Background Image with Blur - Cân bằng trung hòa, dịu mắt */}
      <div
        className="absolute inset-0 pointer-events-none z-0 transform scale-105 transition-all duration-300"
        style={{
          backgroundImage: 'url(/military_range_bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 45%',
          filter: 'blur(5px) brightness(0.92) contrast(0.98)',
        }}
      />

      {/* Dimmed Overlay - Lớp phủ trung hòa dịu nhẹ giúp tôn vinh cây súng ở tiền cảnh */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: isLight
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(10, 18, 30, 0.25)',
        }}
      />

      {/* Radial Vignette - Giữ tâm sáng và viền êm ái */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 45%, rgba(10, 20, 32, 0.42) 100%)',
        }}
      />

      {/* FLOATING 3D VIEWPORT CONTROLS */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setXrayMode((prev) => !prev)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border transition-all shadow-lg flex items-center gap-1.5 cursor-pointer ${
            xrayMode
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-cyan-500/20'
              : 'bg-slate-900/85 border-white/15 text-slate-300 hover:text-white hover:bg-slate-800/90'
          }`}
          title="Bật/Tắt chế độ xuyên thấu để nhìn các bộ phận bên trong (khóa nòng, lò xo đẩy về...)"
        >
          {xrayMode ? <Eye className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{xrayMode ? 'Đang bật X-Ray' : 'X-Ray'}</span>
        </button>

        <button
          onClick={() => {
            setTargetMesh(null);
            onPartSelect(null);
          }}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/85 backdrop-blur-md border border-white/15 text-slate-300 hover:text-white hover:bg-slate-800/90 transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
          title="Đặt lại camera về toàn cảnh súng và bỏ chọn chi tiết"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Toàn cảnh</span>
        </button>

        {activePartId ? (
          <button
            onClick={() => {
              onPartSelect(null);
              setTargetMesh(null);
              if (onToggleHighlight && section === "procedure") {
                onToggleHighlight();
              }
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 backdrop-blur-md border border-rose-400/50 text-rose-300 hover:bg-rose-500/30 transition-all shadow-lg flex items-center gap-1.5 cursor-pointer animate-pulse hover:animate-none"
            title="Tắt hiệu ứng highlight (Bỏ chọn chi tiết để xem súng thật)"
          >
            <span className="text-rose-400 font-extrabold text-sm leading-none">✕</span>
            <span>Tắt Highlight</span>
          </button>
        ) : (
          section === "procedure" && (
            <button
              onClick={() => {
                if (onToggleHighlight) onToggleHighlight();
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30 transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
              title="Bật sáng linh kiện đang thao tác"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bật Highlight</span>
            </button>
          )
        )}
      </div>

      {/* THÔNG TIN CHI TIẾT BỘ PHẬN ĐANG CHỌN (GỌN GÀNG GÓC TRÁI, KHÔNG CHE KHUẤT SÚNG) */}
      {selectedPart && section === "structure" && (
        <div className="absolute top-14 left-3 z-20 pointer-events-auto max-w-xs sm:max-w-sm animate-fadeIn">
          <div className="p-3 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-emerald-500/40 shadow-2xl text-white flex items-start gap-2.5">
            <span className="text-lg p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
              {selectedPart.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-black text-emerald-300 truncate">
                  {selectedPart.name}
                </h4>
                <button
                  onClick={() => {
                    onPartSelect(null);
                    setTargetMesh(null);
                  }}
                  className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Bỏ chọn chi tiết"
                >
                  ✕
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                {selectedPart.groupName}
              </p>
              <p className="text-[11px] text-slate-300 leading-snug mt-1 line-clamp-2">
                {selectedPart.purpose}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* NATIVE FULLSCREEN EXIT / ENTER BUTTON */}
      <div className="absolute top-3 right-3 z-30 pointer-events-auto">
        <button
          onClick={toggleFullscreen}
          className="px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-slate-900/90 backdrop-blur-md border border-white/20 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xl flex items-center gap-1.5"
          title={isFullscreen ? "Thoát toàn màn hình" : "Xem toàn màn hình"}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Thu nhỏ</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Toàn màn hình</span>
            </>
          )}
        </button>
      </div>

      {/* 3D CANVAS CONTAINER */}
      <div className="w-full h-full flex-1 min-h-0 relative z-10">
        <Canvas
          camera={{ position: [0, 0, 3.8], fov: 40 }}
          shadows
          gl={{ alpha: true }}
          onPointerMissed={() => {
            onPartSelect(null);
            setTargetMesh(null);
          }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          {/* Hệ thống chiếu sáng đa hướng studio cho súng AK - Trung hòa và làm nổi bật chi tiết */}
          {/* 1. Ánh sáng môi trường dịu nhẹ toàn diện */}
          <ambientLight intensity={1.9} />

          {/* 2. Đèn chính trực diện từ phía camera (Front Key Light): Chiếu thẳng vào mặt súng đối diện người xem */}
          <directionalLight position={[0, 1.5, 6]} intensity={2.8} />

          {/* 3. Đèn chiếu góc trên bên phải (Top-Right Sunlight): Tạo khối nổi và bóng đổ chiều sâu */}
          <directionalLight position={[8, 12, 6]} intensity={2.2} />

          {/* 4. Đèn hắt sáng từ bên trái (Left Fill Light): Chiếu sáng nòng súng, lưỡi lê và thước ngắm */}
          <directionalLight position={[-8, 3, 5]} intensity={2.0} />

          {/* 5. Đèn hắt từ bên phải (Right Fill Light): Chiếu sáng báng súng và báng cầm */}
          <directionalLight position={[8, 2, 5]} intensity={1.8} />

          {/* 6. Đèn hắt gầm (Ground Bounce Light): Chiếu sáng đáy hộp tiếp đạn và vòng cò súng */}
          <directionalLight position={[0, -5, 3]} intensity={1.2} color="#e2e8f0" />

          {/* 7. Đèn viền sau (Rim Backlight): Tách biệt đường viền súng khỏi nền */}
          <directionalLight position={[0, 4, -8]} intensity={1.5} />

          {/* 8. Điểm sáng vàng ấm kim loại nhẹ */}
          <pointLight position={[0, 0, 3]} intensity={1.0} color="#fff8e7" />

          <AKModelBoundary key={modelPath} modelPath={modelPath}>
            <Suspense fallback={<Model3DLoader />}>
              <group rotation={[0, Math.PI / 2, 0]}>
                <AK47Model
                  modelPath={modelPath}
                  currentAnimTime={currentAnimTime}
                  section={section}
                  mode={mode}
                  stepIndex={stepIndex}
                  activePartId={activePartId}
                  xrayMode={xrayMode}
                  onPartSelect={onPartSelect}
                  onMeshSelect={setTargetMesh}
                  onStepSelect={onStepSelect}
                />
              </group>
            </Suspense>
          </AKModelBoundary>

          <CameraRig targetMesh={targetMesh} />
          <OrbitControls makeDefault enablePan={true} enableZoom={true} minDistance={1} maxDistance={20} />
        </Canvas>
      </div>

      {/* FLOATING HINT AT BOTTOM - CHỈ HIỆN Ở MỤC CẤU TẠO ĐỂ KHÔNG BAO GIỜ CHE THANH ĐIỀU KHIỂN THÁO LẮP */}
      {section === "structure" && (
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
              Nhấp vào bộ phận trên súng để xem cấu tạo riêng biệt · Kéo chuột xoay 360°
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

useGLTF.preload('/models/ak47.glb');
