import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sampleTrajectoryPosition, type TrajectorySnapshot, type Vec3 } from '../features/physics/projectile';
import { usePhysicsEngineState } from '../features/physics/usePhysicsEngine';
import { targetSize } from './ShootingRange3D';
import type { TargetId } from '../data/akShootingData';
import WasmCompatibilityNotice from './WasmCompatibilityNotice';

export interface FlightCamReplayData {
  snapshot: TrajectorySnapshot;
  isHit: boolean;
  targetLane?: number;
  score?: number;
  impactOffset?: { x: number; y: number };
  timestamp: number;
}

export type FlightCamPhase = 'idle' | 'tracking' | 'impact' | 'complete';

export interface FlightCamMonitorProps {
  enabled: boolean;
  replayData: FlightCamReplayData | null;
  distance: number;
  speed?: number; // Slow-motion factor (default: 0.25)
  onToggle?: () => void;
  onReplay?: () => void;
  className?: string;
}

function ReplayFlightScene({
  replayData,
  distance,
  speed = 0.25,
  onPhaseChange,
}: {
  replayData: FlightCamReplayData;
  distance: number;
  speed: number;
  onPhaseChange: (phase: FlightCamPhase) => void;
}) {
  const { snapshot, isHit } = replayData;
  const duration = snapshot.duration;
  const targetId: TargetId = distance === 10 ? 'dong_tien' : distance === 100 ? 'bia_4' : 'bia_8';
  const { width, height, centerY } = targetSize(targetId);
  const replayElapsed = useRef(0);
  const isFirstFrame = useRef(true);
  const lastPhase = useRef<FlightCamPhase>('tracking');

  // Replay meshes
  const bulletRef = useRef<THREE.Mesh>(null!);
  const trailRef = useRef<THREE.Line>(null!);
  const impactRef = useRef<THREE.Mesh>(null!);

  const camPos = useRef(new THREE.Vector3());
  const lookPos = useRef(new THREE.Vector3());
  const scratchPos = useRef<Vec3>([0, 0, 0]);
  const scratchNext = useRef<Vec3>([0, 0, 0]);

  // Target texture with concentric rings matching main range 1:1
  const targetTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#eee9d8';
    ctx.fillRect(0, 0, 1024, 1024);

    const unit = Math.min(width, height);
    for (let ring = 5; ring >= 1; ring--) {
      ctx.beginPath();
      ctx.ellipse(
        512,
        512,
        (unit * 0.085 * ring / width) * 1024,
        (unit * 0.085 * ring / height) * 1024,
        0,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = '#36454e';
      ctx.lineWidth = 12;
      ctx.stroke();
    }
    ctx.fillStyle = '#222';
    ctx.font = 'bold 76px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('10', 512, 538);

    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [width, height]);

  // Trail buffer geometry
  const trailGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(128 * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setDrawRange(0, 0);
    return geo;
  }, []);

  // Reset clock on new shot timestamp
  useEffect(() => {
    replayElapsed.current = 0;
    isFirstFrame.current = true;
    lastPhase.current = 'tracking';
    onPhaseChange('tracking');
  }, [replayData.timestamp, onPhaseChange]);

  useFrame(({ camera }, delta) => {
    replayElapsed.current += Math.min(delta, 0.05);
    const simTime = Math.min(duration, replayElapsed.current * speed);
    const isTracking = simTime < duration;
    const isImpact = simTime >= duration && replayElapsed.current <= duration / speed + 0.8;
    const currentPhase: FlightCamPhase = isTracking ? 'tracking' : isImpact ? 'impact' : 'complete';

    if (currentPhase !== lastPhase.current) {
      lastPhase.current = currentPhase;
      onPhaseChange(currentPhase);
    }

    // 1. Projectile position
    sampleTrajectoryPosition(snapshot, simTime, scratchPos.current);
    if (bulletRef.current) {
      bulletRef.current.position.set(scratchPos.current[0], scratchPos.current[1], scratchPos.current[2]);
    }

    // 2. Trajectory lookahead direction
    const nextT = Math.min(duration, simTime + 0.02);
    sampleTrajectoryPosition(snapshot, nextT, scratchNext.current);
    const dir = new THREE.Vector3(
      scratchNext.current[0] - scratchPos.current[0],
      scratchNext.current[1] - scratchPos.current[1],
      scratchNext.current[2] - scratchPos.current[2]
    );
    if (dir.lengthSq() < 1e-6) {
      dir.set(
        snapshot.end[0] - snapshot.start[0],
        snapshot.end[1] - snapshot.start[1],
        snapshot.end[2] - snapshot.start[2]
      );
    }
    dir.normalize();

    // 3. Dynamic trail
    const positions = trailGeometry.attributes.position.array as Float32Array;
    const currentSampleCount = Math.min(
      128,
      Math.max(2, Math.ceil((simTime / duration) * (snapshot.sampleCount - 1)) + 1)
    );
    for (let k = 0; k < currentSampleCount; k++) {
      const idx = k * snapshot.stride;
      positions[k * 3 + 0] = snapshot.samples[idx + 1];
      positions[k * 3 + 1] = snapshot.samples[idx + 2];
      positions[k * 3 + 2] = snapshot.samples[idx + 3];
    }
    if (currentSampleCount > 1) {
      const lastIdx = (currentSampleCount - 1) * 3;
      positions[lastIdx + 0] = scratchPos.current[0];
      positions[lastIdx + 1] = scratchPos.current[1];
      positions[lastIdx + 2] = scratchPos.current[2];
    }
    trailGeometry.setDrawRange(0, currentSampleCount);
    trailGeometry.attributes.position.needsUpdate = true;

    // 4. Camera follow (behind + elevated)
    const followDist = Math.max(0.8, width * 0.3);
    const elevation = Math.max(0.25, height * 0.08);
    const targetCamPos = new THREE.Vector3(
      scratchPos.current[0] - dir.x * followDist,
      scratchPos.current[1] - dir.y * followDist + elevation,
      scratchPos.current[2] - dir.z * followDist
    );

    const leadDist = Math.max(2.2, width * 0.7);
    const targetLookPos = new THREE.Vector3(
      scratchPos.current[0] + dir.x * leadDist,
      scratchPos.current[1] + dir.y * leadDist + 0.05,
      scratchPos.current[2] + dir.z * leadDist
    );

    if (simTime >= duration * 0.6) {
      const blendFactor = Math.min(1, (simTime / duration - 0.6) / 0.4);
      const endVec = new THREE.Vector3(snapshot.end[0], snapshot.end[1], snapshot.end[2]);
      targetLookPos.lerp(endVec, blendFactor * 0.9);
    }

    if (isFirstFrame.current) {
      camPos.current.copy(targetCamPos);
      lookPos.current.copy(targetLookPos);
      isFirstFrame.current = false;
    } else {
      camPos.current.lerp(targetCamPos, 1 - Math.exp(-14 * delta));
      lookPos.current.lerp(targetLookPos, 1 - Math.exp(-16 * delta));
    }

    camera.position.copy(camPos.current);
    camera.lookAt(lookPos.current);

    // 5. Impact ring
    if (impactRef.current) {
      if (isImpact) {
        impactRef.current.visible = true;
        impactRef.current.position.set(snapshot.end[0], snapshot.end[1], snapshot.end[2]);
        impactRef.current.lookAt(camera.position);
        const age = replayElapsed.current - duration / speed;
        const scale = 1 + age * 2.5;
        impactRef.current.scale.set(scale, scale, 1);
        (impactRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - age / 0.8);
      } else {
        impactRef.current.visible = false;
      }
    }
  });

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 20, 15]} intensity={1.8} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -distance / 2]}>
        <planeGeometry args={[60, distance * 2 + 50]} />
        <meshStandardMaterial color="#556b2f" roughness={0.9} />
      </mesh>

      {/* Target board at distance */}
      <group position={[
        isHit
          ? snapshot.end[0] - (replayData.impactOffset?.x ?? 0)
          : (replayData.targetLane !== undefined && replayData.targetLane >= 0 ? (replayData.targetLane - 1) * width * 1.65 : 0),
        isHit
          ? snapshot.end[1] - (replayData.impactOffset?.y ?? 0)
          : centerY,
        snapshot.end[2]
      ]}>
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[width + 0.035, height + 0.035, 0.04]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={targetTexture} />
        </mesh>
      </group>

      {/* Projectile bullet */}
      <mesh ref={bulletRef}>
        <sphereGeometry args={[Math.max(0.025, width * 0.015), 12, 12]} />
        <meshBasicMaterial color="#ff7700" />
      </mesh>

      {/* Trajectory trail */}
      <primitive object={new THREE.Line(trailGeometry, new THREE.LineBasicMaterial({ color: '#f59e0b', linewidth: 2, transparent: true, opacity: 0.85 }))} ref={trailRef} />

      {/* Impact ring */}
      <mesh ref={impactRef} visible={false}>
        <ringGeometry args={[0.015, Math.max(0.08, width * 0.04), 24]} />
        <meshBasicMaterial color={isHit ? '#22c55e' : '#ef4444'} side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>
    </>
  );
}

export default function FlightCamMonitor({
  enabled,
  replayData,
  distance,
  speed = 0.25,
  onToggle,
  onReplay,
  className = '',
}: FlightCamMonitorProps) {
  const physicsState = usePhysicsEngineState();
  const [phase, setPhase] = useState<FlightCamPhase>('tracking');
  const replayEngine = replayData?.snapshot.engine;
  const displayedEngine = replayEngine ?? (physicsState.status === 'wasm' ? 'wasm' : physicsState.status === 'fallback' ? 'javascript' : null);
  const engineLabel = displayedEngine === 'wasm' ? 'C++/WASM' : displayedEngine === 'javascript' ? 'JAVASCRIPT' : 'ĐANG TẢI';
  const handlePhaseChange = React.useCallback((p: FlightCamPhase) => {
    setPhase(p);
  }, []);

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-black text-cyan-300">
          <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
          <span>FLIGHT CAM · {engineLabel}</span>
        </div>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
              enabled ? 'bg-cyan-600 text-white hover:bg-cyan-500' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {enabled ? 'BẬT' : 'TẮT'}
          </button>
        )}
      </div>

      {physicsState.status === 'fallback' && <WasmCompatibilityNotice feature="physics" />}

      {/* 16:9 Screen Monitor Container */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 shadow-2xl select-none">
        {!enabled ? (
          /* Offline Standby Screen */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950/90 text-slate-400">
            <div className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center mb-1.5 text-slate-600">
              ⏻
            </div>
            <span className="text-xs font-bold text-slate-300">FLIGHT CAM ĐÃ TẮT</span>
            <span className="text-[10px] text-slate-500 mt-1 max-w-[180px]">Bật để theo dõi góc nhìn đạn bay ở tốc độ chậm</span>
          </div>
        ) : !replayData ? (
          /* Ready / Standby Radar Screen */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-radial from-slate-900 to-slate-950 text-cyan-400">
            <div className="w-12 h-12 rounded-full border border-cyan-500/30 flex items-center justify-center mb-2 animate-pulse">
              <div className="w-6 h-6 rounded-full border border-cyan-400/50 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              </div>
            </div>
            <span className="text-xs font-mono font-black text-cyan-200 tracking-wider">CHỜ PHÁT BẮN TIẾP THEO</span>
            <span className="text-[10px] font-mono text-cyan-400/70 mt-1">CỰ LY {distance}M · LÕI {engineLabel} SẴN SÀNG</span>
          </div>
        ) : (
          /* Active 3D Replay Scene */
          <>
            <Canvas
              camera={{ position: [0, 1.5, 0], fov: 50, near: 0.05, far: 800 }}
              gl={{ antialias: true }}
              dpr={1}
            >
              <ReplayFlightScene
                replayData={replayData}
                distance={distance}
                speed={speed}
                onPhaseChange={handlePhaseChange}
              />
            </Canvas>

            {/* HUD Overlays */}
            <div className="absolute top-2 left-2 pointer-events-none flex items-center gap-1.5">
              {phase === 'tracking' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10px] font-mono font-extrabold text-red-400 drop-shadow">● REC 0.25X</span>
                </>
              ) : phase === 'impact' ? (
                <span className={`text-[10px] font-mono font-black drop-shadow ${replayData.isHit ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {replayData.isHit ? 'HIT TARGET' : 'MISS'}
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold text-slate-400">REPLAY COMPLETE</span>
              )}
            </div>

            <div className="absolute top-2 right-2 pointer-events-none">
              <span className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
                {replayData.snapshot.engine === 'wasm' ? 'WASM CAM' : 'JS CAM'}
              </span>
            </div>

            <div className="absolute bottom-2 left-2 right-2 pointer-events-none flex items-center justify-between text-[9px] font-mono font-bold text-slate-200 bg-black/75 px-2 py-1 rounded-lg border border-white/10">
              <span className="truncate">
                {phase === 'tracking'
                  ? 'ĐANG THEO DÕI...'
                  : phase === 'impact'
                  ? (replayData.isHit ? `TRÚNG BIA ${(replayData.targetLane ?? 0) + 1} (+${replayData.score ?? 0}đ)` : 'TRƯỢT BIA (0đ)')
                  : (replayData.isHit ? `KẾT QUẢ: +${replayData.score ?? 0}đ` : 'KẾT QUẢ: 0đ')}
              </span>
              <span className="text-amber-400 shrink-0 ml-1">
                {distance}M · {replayData.snapshot.duration.toFixed(2)}s
              </span>
            </div>
          </>
        )}
      </div>

      {/* Telemetry info card */}
      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1">
        <div className="flex justify-between text-slate-400">
          <span>Thời gian bay thực:</span>
          <span className="font-mono text-cyan-300">
            {replayData ? `${replayData.snapshot.duration.toFixed(2)}s` : `${(0.1 + Math.min(distance / 200, 1) * 0.1).toFixed(2)}s`}
          </span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Mẫu quỹ đạo {replayData ? (replayData.snapshot.engine === 'wasm' ? 'C++ WASM' : 'JavaScript') : engineLabel}:</span>
          <span className="font-mono text-emerald-300">
            {replayData ? `${replayData.snapshot.sampleCount} samples` : '128 max capacity'}
          </span>
        </div>
      </div>

      {/* Replay action button */}
      {onReplay && (
        <button
          type="button"
          disabled={!replayData || !enabled}
          onClick={onReplay}
          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-cyan-200 transition-colors cursor-pointer"
        >
          ↺ Phát lại lượt vừa rồi (Slow-mo 0.25x)
        </button>
      )}
    </div>
  );
}
