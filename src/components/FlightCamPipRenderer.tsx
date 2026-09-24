import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sampleTrajectoryPosition, type TrajectorySnapshot, type Vec3 } from '../features/physics/projectile';

export interface FlightCamReplayData {
  snapshot: TrajectorySnapshot;
  isHit: boolean;
  targetLane?: number;
  score?: number;
  timestamp: number;
}

export interface FlightCamStatus {
  state: 'idle' | 'tracking' | 'impact';
  text: string;
  simTime: number;
  duration: number;
  isHit: boolean;
  score: number;
  lane: number;
}

export interface FlightCamPipRendererProps {
  enabled: boolean;
  replayData: FlightCamReplayData | null;
  gunRef?: React.RefObject<THREE.Group | null>;
  speed?: number; // Presentation slow-motion factor (default: 0.25x)
  onStatusChange?: (status: FlightCamStatus) => void;
}

export default function FlightCamPipRenderer({
  enabled,
  replayData,
  gunRef,
  speed = 0.25,
  onStatusChange,
}: FlightCamPipRendererProps) {
  const secondaryCamera = useMemo(() => new THREE.PerspectiveCamera(48, 16 / 9, 0.05, 800), []);
  const replayElapsed = useRef(0);
  const lastActiveTimestamp = useRef(0);
  const isFirstFrame = useRef(true);

  // Smooth camera vectors
  const camPos = useRef(new THREE.Vector3());
  const lookPos = useRef(new THREE.Vector3());
  const scratchPos = useRef<Vec3>([0, 0, 0]);
  const scratchNext = useRef<Vec3>([0, 0, 0]);

  // Visual objects for flight replay
  const { group, bulletMesh, trailLine, impactRing, trailGeometry } = useMemo(() => {
    const grp = new THREE.Group();
    grp.name = 'FlightCamPipObjects';

    // Glowing tracer bullet
    const bGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const bMat = new THREE.MeshBasicMaterial({ color: '#ff7700' });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    grp.add(bMesh);

    // Dynamic trajectory trail
    const maxTrailPoints = 128;
    const trailPositions = new Float32Array(maxTrailPoints * 3);
    const tGeo = new THREE.BufferGeometry();
    tGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    tGeo.setDrawRange(0, 0);

    const tMat = new THREE.LineBasicMaterial({
      color: '#f59e0b',
      linewidth: 2,
      transparent: true,
      opacity: 0.85,
    });
    const tLine = new THREE.Line(tGeo, tMat);
    grp.add(tLine);

    // Impact ring
    const iGeo = new THREE.RingGeometry(0.02, 0.18, 24);
    const iMat = new THREE.MeshBasicMaterial({
      color: '#22c55e',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const iRing = new THREE.Mesh(iGeo, iMat);
    iRing.visible = false;
    grp.add(iRing);

    return { group: grp, bulletMesh: bMesh, trailLine: tLine, impactRing: iRing, trailGeometry: tGeo };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (group.parent) group.parent.remove(group);
      bulletMesh.geometry.dispose();
      (bulletMesh.material as THREE.Material).dispose();
      trailGeometry.dispose();
      (trailLine.material as THREE.Material).dispose();
      impactRing.geometry.dispose();
      (impactRing.material as THREE.Material).dispose();
    };
  }, [group, bulletMesh, trailGeometry, trailLine, impactRing]);

  // Detect new shot and reset replay timer immediately (cancels previous replay)
  useEffect(() => {
    if (!replayData) {
      replayElapsed.current = 0;
      lastActiveTimestamp.current = 0;
      onStatusChange?.({
        state: 'idle',
        text: 'FLIGHT CAM · Chờ lượt tiếp theo',
        simTime: 0,
        duration: 0,
        isHit: false,
        score: 0,
        lane: 0,
      });
      return;
    }
    if (replayData.timestamp !== lastActiveTimestamp.current) {
      lastActiveTimestamp.current = replayData.timestamp;
      replayElapsed.current = 0;
      isFirstFrame.current = true;
    }
  }, [replayData, onStatusChange]);

  useFrame((state, delta) => {
    const { gl, scene, camera, size } = state;
    const dpr = Math.min(gl.getPixelRatio(), 2);
    const bufferW = Math.round(size.width * dpr);
    const bufferH = Math.round(size.height * dpr);

    // 1. Always render the main gameplay camera first
    gl.autoClear = true;
    gl.setScissorTest(false);
    gl.setViewport(0, 0, bufferW, bufferH);
    gl.render(scene, camera);

    if (!enabled || !replayData) {
      return;
    }

    const snapshot = replayData.snapshot;
    const duration = snapshot.duration;
    const impactHoldSeconds = 0.65;
    const totalReplaySeconds = duration / speed + impactHoldSeconds;

    replayElapsed.current += Math.min(delta, 0.05);
    const currentReplayTime = replayElapsed.current;
    const simTime = Math.min(duration, currentReplayTime * speed);

    const isTracking = simTime < duration;
    const isImpact = simTime >= duration && currentReplayTime <= totalReplaySeconds;
    const isFinished = currentReplayTime > totalReplaySeconds;

    // Report status to parent UI
    if (onStatusChange) {
      if (isTracking) {
        onStatusChange({
          state: 'tracking',
          text: 'FLIGHT CAM · Đang theo dõi (Replay 0.25x)',
          simTime,
          duration,
          isHit: replayData.isHit,
          score: replayData.score ?? 0,
          lane: replayData.targetLane ?? 0,
        });
      } else if (isImpact) {
        const resultText = replayData.isHit
          ? `TRÚNG BIA ${(replayData.targetLane ?? 0) + 1} (+${replayData.score ?? 0}đ)`
          : 'TRƯỢT BIA (0đ)';
        onStatusChange({
          state: 'impact',
          text: resultText,
          simTime: duration,
          duration,
          isHit: replayData.isHit,
          score: replayData.score ?? 0,
          lane: replayData.targetLane ?? 0,
        });
      } else if (isFinished) {
        onStatusChange({
          state: 'idle',
          text: 'FLIGHT CAM · Chờ lượt tiếp theo',
          simTime: duration,
          duration,
          isHit: replayData.isHit,
          score: replayData.score ?? 0,
          lane: replayData.targetLane ?? 0,
        });
      }
    }

    if (isFinished) {
      // Replay completed; keep idle
      return;
    }

    // Attach replay meshes to scene if needed
    if (!group.parent) {
      scene.add(group);
    }
    group.visible = true;

    // Sample current projectile position
    sampleTrajectoryPosition(snapshot, simTime, scratchPos.current);
    bulletMesh.position.set(scratchPos.current[0], scratchPos.current[1], scratchPos.current[2]);

    // Sample lookahead point for flight direction
    const nextT = Math.min(duration, simTime + 0.025);
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

    // Update trajectory trail up to current time
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
    // Set the very last point to the exact bullet position for seamless line
    if (currentSampleCount > 1) {
      const lastIdx = (currentSampleCount - 1) * 3;
      positions[lastIdx + 0] = scratchPos.current[0];
      positions[lastIdx + 1] = scratchPos.current[1];
      positions[lastIdx + 2] = scratchPos.current[2];
    }
    trailGeometry.setDrawRange(0, currentSampleCount);
    trailGeometry.attributes.position.needsUpdate = true;

    // Camera follow calculation (cinematic offset: behind and slightly elevated)
    const followDist = 0.95;
    const elevation = 0.28;
    const targetCamPos = new THREE.Vector3(
      scratchPos.current[0] - dir.x * followDist,
      scratchPos.current[1] - dir.y * followDist + elevation,
      scratchPos.current[2] - dir.z * followDist
    );

    // Look-at point: looks ahead along trajectory, blends towards target near impact
    const leadDist = 2.4;
    const targetLookPos = new THREE.Vector3(
      scratchPos.current[0] + dir.x * leadDist,
      scratchPos.current[1] + dir.y * leadDist + 0.05,
      scratchPos.current[2] + dir.z * leadDist
    );

    if (simTime >= duration * 0.65) {
      const blendFactor = Math.min(1, (simTime / duration - 0.65) / 0.35);
      const endVec = new THREE.Vector3(snapshot.end[0], snapshot.end[1], snapshot.end[2]);
      targetLookPos.lerp(endVec, blendFactor * 0.85);
    }

    if (isFirstFrame.current) {
      camPos.current.copy(targetCamPos);
      lookPos.current.copy(targetLookPos);
      isFirstFrame.current = false;
    } else {
      camPos.current.lerp(targetCamPos, 1 - Math.exp(-14 * delta));
      lookPos.current.lerp(targetLookPos, 1 - Math.exp(-16 * delta));
    }

    secondaryCamera.position.copy(camPos.current);
    secondaryCamera.lookAt(lookPos.current);

    // Impact ring display
    if (isImpact) {
      impactRing.visible = true;
      impactRing.position.set(snapshot.end[0], snapshot.end[1], snapshot.end[2]);
      impactRing.lookAt(secondaryCamera.position);
      (impactRing.material as THREE.MeshBasicMaterial).color.set(
        replayData.isHit ? '#22c55e' : '#ef4444'
      );
      const impactAge = currentReplayTime - duration / speed;
      const ringScale = 1 + impactAge * 2.5;
      impactRing.scale.set(ringScale, ringScale, 1);
      (impactRing.material as THREE.MeshBasicMaterial).opacity = Math.max(
        0,
        1 - impactAge / impactHoldSeconds
      );
    } else {
      impactRing.visible = false;
    }

    // 2. Compute PIP Scissor and Viewport (16:9 aspect ratio, responsive layout)
    const isMobile = size.width < 768;
    const pipW_css = isMobile ? Math.min(180, Math.round(size.width * 0.45)) : Math.min(260, Math.round(size.width * 0.32));
    const pipH_css = Math.round(pipW_css * (9 / 16));
    const margin_css = isMobile ? 8 : 16;
    const pipLeft_css = size.width - pipW_css - margin_css;
    const pipTop_css = isMobile ? 54 : 64;

    const scissorX = Math.round(pipLeft_css * dpr);
    const scissorY = Math.round((size.height - pipTop_css - pipH_css) * dpr);
    const scissorW = Math.round(pipW_css * dpr);
    const scissorH = Math.round(pipH_css * dpr);

    secondaryCamera.aspect = pipW_css / pipH_css;
    secondaryCamera.updateProjectionMatrix();

    // Temporarily hide the first-person gun model to prevent camera clipping
    const previousGunVisibility = gunRef?.current ? gunRef.current.visible : true;
    if (gunRef?.current) {
      gunRef.current.visible = false;
    }

    // 3. Render the secondary Flight Camera pass
    gl.autoClear = false;
    gl.clearDepth();
    gl.setViewport(scissorX, scissorY, scissorW, scissorH);
    gl.setScissor(scissorX, scissorY, scissorW, scissorH);
    gl.setScissorTest(true);

    gl.render(scene, secondaryCamera);

    // 4. Restore complete WebGL state
    if (gunRef?.current) {
      gunRef.current.visible = previousGunVisibility;
    }
    // Hide replay meshes so the main camera does not see them in its pass
    group.visible = false;
    gl.setScissorTest(false);
    gl.setViewport(0, 0, bufferW, bufferH);
    gl.autoClear = true;
  }, 1);

  return null;
}
