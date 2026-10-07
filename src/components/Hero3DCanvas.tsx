import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Hero3DCanvasProps {
  isPaused: boolean;
  reducedMotion: boolean;
}

// Mô hình Khung Xương AI Pose tối giản, chuẩn điều lệnh đứng nghiêm (Minimalist AI Pose Joint Mannequin)
function AIPoseMannequin({ isPaused, reducedMotion }: { isPaused: boolean; reducedMotion: boolean }) {
  const mannequinGroupRef = useRef<THREE.Group>(null);
  const pulseJointsRef = useRef<THREE.Group>(null);
  const pointerTarget = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (isPaused) return;

    const t = state.clock.getElapsedTime();

    if (!reducedMotion && mannequinGroupRef.current) {
      // Nhịp thở tinh tế
      const breath = Math.sin(t * 1.8) * 0.015;
      mannequinGroupRef.current.position.y = -0.9 + breath;

      // Xoay nhẹ nhàng êm ái theo con trỏ chuột (tối đa ~12 độ)
      pointerTarget.current.x = THREE.MathUtils.lerp(pointerTarget.current.x, state.pointer.x * 0.22, 0.04);
      pointerTarget.current.y = THREE.MathUtils.lerp(pointerTarget.current.y, -state.pointer.y * 0.12, 0.04);

      mannequinGroupRef.current.rotation.y = pointerTarget.current.x;
      mannequinGroupRef.current.rotation.x = pointerTarget.current.y;
    }

    // Nhịp phát sáng nhẹ ở các khớp AI
    if (pulseJointsRef.current && !reducedMotion) {
      const pulse = 0.7 + Math.sin(t * 3) * 0.3;
      pulseJointsRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissiveIntensity = pulse;
        }
      });
    }
  });

  return (
    <group ref={mannequinGroupRef} position={[0, -0.9, 0]}>
      {/* ── 1. ĐẦU VÀ CỔ ── */}
      <mesh position={[0, 1.82, 0]}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Kính ngắm AI định vị góc nhìn */}
      <mesh position={[0, 1.84, 0.11]}>
        <boxGeometry args={[0.16, 0.04, 0.05]} />
        <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.8} />
      </mesh>
      {/* Cổ */}
      <mesh position={[0, 1.66, 0]}>
        <cylinderGeometry args={[0.03, 0.035, 0.08, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} />
      </mesh>

      {/* ── 2. CỘT SỐNG & LỒNG NGỰC (TRỤC ĐỨNG NGHIÊM) ── */}
      <mesh position={[0, 1.36, 0]}>
        <cylinderGeometry args={[0.038, 0.035, 0.52, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} />
      </mesh>

      {/* Khung xương sườn tối giản */}
      <mesh position={[0, 1.48, 0]}>
        <torusGeometry args={[0.14, 0.012, 8, 24]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, 1.36, 0]}>
        <torusGeometry args={[0.12, 0.012, 8, 24]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.3} />
      </mesh>

      {/* ── 3. KHUNG VAI VÀ TAY (ÁP SÁT ĐÙI THEO ĐIỀU LỆNH) ── */}
      {/* Xương đòn */}
      <mesh position={[0, 1.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.44, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} />
      </mesh>

      {/* Cánh tay trái (thẳng dọc thân) */}
      <mesh position={[-0.24, 1.32, 0]}>
        <cylinderGeometry args={[0.024, 0.022, 0.28, 12]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[-0.25, 1.02, 0.02]}>
        <cylinderGeometry args={[0.022, 0.02, 0.26, 12]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>

      {/* Cánh tay phải (thẳng dọc thân) */}
      <mesh position={[0.24, 1.32, 0]}>
        <cylinderGeometry args={[0.024, 0.022, 0.28, 12]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[0.25, 1.02, 0.02]}>
        <cylinderGeometry args={[0.022, 0.02, 0.26, 12]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>

      {/* ── 4. KHUNG CHẬU VÀ CHÂN (ĐỨNG NGHIÊM, GÓT CHẠM NHAU) ── */}
      {/* Xương chậu */}
      <mesh position={[0, 1.08, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.032, 0.032, 0.26, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} />
      </mesh>

      {/* Đùi trái & đùi phải (thẳng tắp khép sát) */}
      <mesh position={[-0.09, 0.82, 0]}>
        <cylinderGeometry args={[0.03, 0.026, 0.44, 12]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[0.09, 0.82, 0]}>
        <cylinderGeometry args={[0.03, 0.026, 0.44, 12]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>

      {/* Cẳng chân trái & cẳng chân phải */}
      <mesh position={[-0.07, 0.36, 0]}>
        <cylinderGeometry args={[0.026, 0.022, 0.42, 12]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[0.07, 0.36, 0]}>
        <cylinderGeometry args={[0.026, 0.022, 0.42, 12]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>

      {/* Bàn chân mở góc chữ V 45° chuẩn điều lệnh quân đội */}
      <mesh position={[-0.09, 0.12, 0.07]} rotation={[0, -Math.PI / 8, 0]}>
        <boxGeometry args={[0.06, 0.03, 0.16]} />
        <meshStandardMaterial color="#334155" roughness={0.4} />
      </mesh>
      <mesh position={[0.09, 0.12, 0.07]} rotation={[0, Math.PI / 8, 0]}>
        <boxGeometry args={[0.06, 0.03, 0.16]} />
        <meshStandardMaterial color="#334155" roughness={0.4} />
      </mesh>

      {/* ── 5. CÁC ĐIỂM KHỚP AI PHÁT SÁNG (AI POSE KEYPOINTS) ── */}
      <group ref={pulseJointsRef}>
        {/* Khớp vai */}
        <mesh position={[-0.22, 1.6, 0]}>
          <sphereGeometry args={[0.042, 16, 16]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0.22, 1.6, 0]}>
          <sphereGeometry args={[0.042, 16, 16]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.8} />
        </mesh>

        {/* Khớp khuỷu tay */}
        <mesh position={[-0.245, 1.16, 0.01]}>
          <sphereGeometry args={[0.036, 14, 14]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0.245, 1.16, 0.01]}>
          <sphereGeometry args={[0.036, 14, 14]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.8} />
        </mesh>

        {/* Cổ tay */}
        <mesh position={[-0.25, 0.88, 0.02]}>
          <sphereGeometry args={[0.032, 14, 14]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0.25, 0.88, 0.02]}>
          <sphereGeometry args={[0.032, 14, 14]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.8} />
        </mesh>

        {/* Khớp háng */}
        <mesh position={[-0.1, 1.05, 0]}>
          <sphereGeometry args={[0.04, 14, 14]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0.1, 1.05, 0]}>
          <sphereGeometry args={[0.04, 14, 14]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.8} />
        </mesh>

        {/* Khớp gối */}
        <mesh position={[-0.08, 0.58, 0]}>
          <sphereGeometry args={[0.038, 14, 14]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0.08, 0.58, 0]}>
          <sphereGeometry args={[0.038, 14, 14]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.8} />
        </mesh>

        {/* Khớp mắt cá chân */}
        <mesh position={[-0.07, 0.15, 0]}>
          <sphereGeometry args={[0.034, 14, 14]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0.07, 0.15, 0]}>
          <sphereGeometry args={[0.034, 14, 14]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* ── 6. TRỤC ĐO ĐỘ THẲNG ĐIỀU LỆNH (180° SPINE LASER) ── */}
      <mesh position={[0, 1.05, -0.06]}>
        <cylinderGeometry args={[0.006, 0.006, 1.8, 8]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.6} />
      </mesh>

      {/* ── 7. VÒNG CHÂN THAO TRƯỜNG TỐI GIẢN ── */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.44, 32]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 0.72, 32]} />
        <meshBasicMaterial color="#64748b" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function Hero3DCanvas({ isPaused, reducedMotion }: Hero3DCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 3.4], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      }}
      className="w-full h-full pointer-events-none"
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 5, 4]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-4, 2, -2]} intensity={0.8} color="#94a3b8" />
      <pointLight position={[0, 1.2, 1.5]} intensity={0.5} color="#10b981" />
      <AIPoseMannequin isPaused={isPaused} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
