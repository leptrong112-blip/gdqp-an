import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { AK_TARGETS, TargetId } from '../data/akShootingData';
import { arcadeFlightSeconds, arcadeTargetX } from './arcadeRangeLogic';
import { DEFAULT_ADS_ALIGNMENT, MAX_LOOK_PITCH, type AdsVisualAlignment } from './rangeVisualConfig';
import { getSightPreset, DEFAULT_PRESET_ID } from './rangeSightPresets';
import { bindRearSight } from './rearSightTransform';
import { createArcadeFlight, type Flight, type Vec3, type TrajectorySnapshot } from '../features/physics/projectile';
import { usePhysicsEngine } from '../features/physics/usePhysicsEngine';


// Coordinates measured from this GLB, after its authored node transforms.
// Keep the imported scale: one world unit is one metre.
const REAR = new THREE.Vector3(0, 0.131485, -0.19994);
const FRONT = new THREE.Vector3(0, 0.126158, -0.58458);
const ALIGN = new THREE.Quaternion().setFromUnitVectors(FRONT.clone().sub(REAR).normalize(), new THREE.Vector3(0, 0, -1));
const MODEL_OFFSET = REAR.clone().applyQuaternion(ALIGN).negate();
const EYE_HEIGHT = 1.55;
const EYE_RELIEF = 0.22;
// Game presentation: keep the target visible above the model, including raised sight states.
// Independent from the scoring ray and from user-saved alignment offsets.
const ADS_EYE = new THREE.Vector3(0, .03, .32);
const FREE_EYE = new THREE.Vector3(-0.18, 0.12, 0.46);
const LOOK = new THREE.Vector3(0, 0, -10);

export interface RangeImpact {
  x: number;
  y: number;
  score: number;
  isHit: boolean;
  screenX: number;
  screenY: number;
  targetIndex?: number;
  snapshot?: TrajectorySnapshot;
}
export interface ArcadeSceneOptions {
  moving: boolean; running: boolean; targets: number; reloading: boolean;
  fireRef: React.MutableRefObject<((aim?: { x: number; y: number }) => Promise<RangeImpact | null>) | null>;
}
interface Props {
  ads: boolean; aim: { x: number; y: number }; sway: { x: number; y: number };
  recoil: { x: number; y: number }; targetId: TargetId;
  shots: { x: number; y: number; isHit: boolean; shotNumber: number; targetIndex?: number }[];
  fireRef: React.MutableRefObject<(() => RangeImpact | null) | null>;
  arcade?: ArcadeSceneOptions;
  look?: React.MutableRefObject<{ x: number; y: number; active: boolean }>;
  alignment?: AdsVisualAlignment;
  hideReticle?: boolean;
  sightPresetId?: string;
  onSightAvailabilityChange?: (available: boolean) => void;
}

// Visual assistance for a desktop viewport. Width/distance still decreases
// with range, while distant boards remain readable. Preserve each aspect ratio.
const TARGET_DISPLAY_SCALE: Record<TargetId, number> = {
  dong_tien: 4,
  bia_4: 7,
  bia_6: 9,
  bia_8: 11,
};

export function targetSize(id: TargetId) {
  const target = AK_TARGETS.find(t => t.id === id)!;
  const scale = TARGET_DISPLAY_SCALE[id];
  const width = target.dimensions.widthCm / 100 * scale;
  const height = target.dimensions.heightCm / 100 * scale;
  return { width, height, scale, centerY: Math.max(EYE_HEIGHT, height / 2 + .6) };
}

function updateRigAim(rig: THREE.Group, props: Props) {
  const distance = AK_TARGETS.find(t => t.id === props.targetId)!.standardDistance;
  const layout = targetSize(props.targetId);
  const pitch = Math.atan2(layout.centerY - EYE_HEIGHT, distance - EYE_RELIEF);
  const horizontalRange = props.arcade ? layout.width / distance * 3.5 : .09;
  const verticalRange = props.arcade ? Math.max(.06, layout.height / distance) : .06;
  const yaw = props.look?.current.active ? props.look.current.x : -props.aim.x * horizontalRange;
  const elevation = props.look?.current.active ? props.look.current.y : props.aim.y * verticalRange;
  if (props.look && !props.look.current.active) Object.assign(props.look.current, { x: yaw, y: elevation });
  rig.rotation.set(THREE.MathUtils.clamp(pitch + elevation + props.sway.y * verticalRange - props.recoil.y * .15, -MAX_LOOK_PITCH, MAX_LOOK_PITCH), yaw - props.sway.x * horizontalRange + props.recoil.x * .15, 0, 'YXZ');
}

function TargetBoard({ id, active, shots, arcade, lane = 1, time }: { id: TargetId; active: boolean; shots: Props['shots']; arcade?: ArcadeSceneOptions; lane?: number; time?: React.MutableRefObject<number> }) {
  const board = useRef<THREE.Group>(null!);
  const target = AK_TARGETS.find(t => t.id === id)!;
  const { width, height, scale, centerY } = targetSize(id);
  // Inactive boards move to a side lane so nearer boards cannot hide the selected one.
  const x = active ? 0 : -Math.max(6, width + 2);
  useFrame(() => { if (arcade && time) board.current.position.x = arcadeTargetX(lane, width, time.current, arcade.moving); });
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#eee9d8'; ctx.fillRect(0, 0, 1024, 1024);
    if (id !== 'dong_tien' && !arcade) {
      ctx.fillStyle = target.bgHex;
      ctx.beginPath(); ctx.moveTo(110, 990); ctx.lineTo(110, 480);
      ctx.quadraticCurveTo(110, 330, 380, 300); ctx.lineTo(380, 165);
      ctx.quadraticCurveTo(512, 35, 644, 165); ctx.lineTo(644, 300);
      ctx.quadraticCurveTo(914, 330, 914, 480); ctx.lineTo(914, 990); ctx.closePath(); ctx.fill();
    }
    const unit = Math.min(width, height);
    for (let ring = 5; ring >= 1; ring--) {
      ctx.beginPath();
      ctx.ellipse(512, 512, unit * .085 * ring / width * 1024, unit * .085 * ring / height * 1024, 0, 0, Math.PI * 2);
      ctx.strokeStyle = id === 'dong_tien' || arcade ? '#36454e' : '#faf6e7'; ctx.lineWidth = 12; ctx.stroke();
    }
    ctx.fillStyle = id === 'dong_tien' || arcade ? '#222' : '#fff';
    ctx.font = 'bold 76px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('10', 512, 538);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8; return map;
  }, [id, width, height, target.bgHex, !!arcade]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <group ref={board} position={[x, centerY, EYE_RELIEF - target.standardDistance]}>
    <mesh position={[0, 0, -.028]}><boxGeometry args={[width + .035, height + .035, .05]} /><meshStandardMaterial color="#454a39" /></mesh>
    <mesh><planeGeometry args={[width, height]} /><meshBasicMaterial map={texture} /></mesh>
    {[-width * .35, width * .35].map(px => <mesh key={px} position={[px, -centerY / 2 - height / 4, -.05]}>
      <boxGeometry args={[.035 * scale, centerY - height / 2, .045]} /><meshStandardMaterial color="#77603c" />
    </mesh>)}
    {active && shots.filter(s => s.isHit && (!arcade || s.targetIndex === lane)).map(s => <mesh key={s.shotNumber} position={[s.x / 1000, s.y / 1000, .003]}>
      <circleGeometry args={[.004 * scale, 12]} /><meshBasicMaterial color="#f33b27" />
    </mesh>)}
    {active && <Html position={[0, height / 2 + Math.max(.65, target.standardDistance * .025), 0]} zIndexRange={[5, 0]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
      <span className="rounded bg-amber-300 px-2 py-1 text-[10px] font-bold text-slate-950">{arcade ? `Bia ${lane + 1}` : target.name} · {target.standardDistance}m</span>
    </Html>}
  </group>;
}

function Scene(props: Props) {
  const physics = usePhysicsEngine();
  const physicsRef = useRef(physics);
  physicsRef.current = physics;
  const flightPoint = useRef<Vec3>([0, 0, 0]);
  const { scene } = useGLTF('/models/ak47_adjustable.glb');
  const weapon = useMemo(() => scene.clone(true), [scene]);
  const rig = useRef<THREE.Group>(null!);
  const gunDisplay = useRef<THREE.Group>(null!);
  const { camera, size } = useThree();
  const eye = useRef(FREE_EYE.clone());
  const vectors = useMemo(() => ({ eye: new THREE.Vector3(), look: new THREE.Vector3(), origin: new THREE.Vector3(), direction: new THREE.Vector3(), hit: new THREE.Vector3(), projected: new THREE.Vector3() }), []);
  const target = AK_TARGETS.find(t => t.id === props.targetId)!;
  const targetLayout = targetSize(props.targetId);
  const latestProps = useRef(props);
  latestProps.current = props;
  const gameTime = useRef(0);
  const orb = useRef<THREE.Mesh>(null!);
  const pending = useRef<{ end: THREE.Vector3; path: Flight; born: number; resolve: (impact: RangeImpact | null) => void } | null>(null);
  const arcadeRef = useRef(props.arcade);
  arcadeRef.current = props.arcade;
  const arcadeFireRef = props.arcade?.fireRef;

  // Cấu hình trạng thái Thước ngắm 3D
  const preset = getSightPreset(props.sightPresetId || DEFAULT_PRESET_ID);
  const rearSight = useMemo(() => bindRearSight(weapon), [weapon]);
  useEffect(() => {
    props.onSightAvailabilityChange?.(!!rearSight);
  }, [rearSight, props.onSightAvailabilityChange]);
  useEffect(() => () => rearSight?.restore(), [rearSight]);
  useEffect(() => {
    if (!arcadeFireRef) return;
    arcadeFireRef.current = (shotAim) => {
      if (pending.current || !arcadeRef.current?.running) return Promise.resolve(null);
      // Pointer movement and click can arrive before the next render frame.
      // Capture the click's aim now instead of firing along the previous frame.
      updateRigAim(rig.current, shotAim ? { ...latestProps.current, aim: shotAim } : latestProps.current);
      rig.current.updateWorldMatrix(true, false);
      const start = new THREE.Vector3(0, 0, -.55).applyMatrix4(rig.current.matrixWorld);
      const eyeOrigin = new THREE.Vector3(0, 0, EYE_RELIEF).applyMatrix4(rig.current.matrixWorld);
      const direction = new THREE.Vector3(0, 0, -1).transformDirection(rig.current.matrixWorld);
      const travel = (EYE_RELIEF - target.standardDistance - eyeOrigin.z) / direction.z;
      if (travel <= 0) return Promise.resolve(null);
      const end = eyeOrigin.addScaledVector(direction, travel);
      const path = createArcadeFlight(physicsRef.current, start.toArray(), end.toArray(), arcadeFlightSeconds(target.standardDistance));
      return new Promise<RangeImpact | null>(resolve => {
        pending.current = { end, path, born: gameTime.current, resolve };
      });
    };
    return () => { arcadeFireRef.current = null; pending.current?.resolve(null); pending.current = null; };
  }, [arcadeFireRef, target.standardDistance]);

  useEffect(() => {
    props.fireRef.current = () => {
      if (!rig.current) return null;
      updateRigAim(rig.current, latestProps.current);
      rig.current.updateWorldMatrix(true, false);
      vectors.origin.set(0, 0, EYE_RELIEF).applyMatrix4(rig.current.matrixWorld);
      vectors.direction.set(0, 0, -1).transformDirection(rig.current.matrixWorld);
      const z = EYE_RELIEF - target.standardDistance;
      const travel = (z - vectors.origin.z) / vectors.direction.z;
      if (travel <= 0) return null;
      vectors.hit.copy(vectors.origin).addScaledVector(vectors.direction, travel);
      const { width, height, centerY } = targetSize(props.targetId);
      const x = vectors.hit.x, y = vectors.hit.y - centerY;
      const radius = Math.hypot(x, y);
      const isHit = Math.abs(x) <= width / 2 && Math.abs(y) <= height / 2;
      const score = isHit ? Math.max(5, 11 - Math.ceil(Math.max(radius, .000001) / (Math.min(width, height) * .085))) : 0;
      vectors.projected.copy(vectors.hit).project(camera);
      return { x: x * 1000, y: y * 1000, score, isHit, screenX: (vectors.projected.x + 1) * size.width / 2, screenY: (1 - vectors.projected.y) * size.height / 2 };
    };
    return () => { props.fireRef.current = null; };
  }, [camera, size, target, props.targetId, props.fireRef, vectors]);
  useFrame((_, delta) => {
    if (props.arcade?.running) gameTime.current += Math.min(delta, .05);
    const projectile = pending.current;
    if (orb.current) orb.current.visible = !!projectile;
    if (projectile) {
      const elapsed = gameTime.current - projectile.born;
      orb.current.position.fromArray(projectile.path.sample(elapsed, flightPoint.current));
      // A compact stylized tracer. Timing is tuned for the game, not a weapon.
      orb.current.lookAt(projectile.end);
      const thickness = Math.max(.009, target.standardDistance * .00025);
      orb.current.scale.set(thickness, thickness, Math.min(1.5, target.standardDistance * .025));
      if (elapsed >= projectile.path.duration) {
        const { width, height, centerY } = targetLayout;
        const y = projectile.end.y - centerY;
        let hitLane = -1, x = projectile.end.x;
        for (let lane = 0; lane < (props.arcade?.targets || 0); lane++) {
          const localX = projectile.end.x - arcadeTargetX(lane, width, gameTime.current, !!props.arcade?.moving);
          if (Math.abs(localX) <= width / 2 && Math.abs(y) <= height / 2) { hitLane = lane; x = localX; break; }
        }
        const isHit = hitLane >= 0;
        const score = isHit ? Math.max(5, 11 - Math.ceil(Math.max(Math.hypot(x, y), .000001) / (Math.min(width, height) * .085))) : 0;
        vectors.projected.copy(projectile.end).project(camera);
        const resolvedSnapshot = projectile.path.snapshot;
        pending.current = null;
        orb.current.visible = false;
        projectile.resolve({
          x: x * 1000,
          y: y * 1000,
          score,
          isHit,
          targetIndex: hitLane,
          screenX: (vectors.projected.x + 1) * size.width / 2,
          screenY: (1 - vectors.projected.y) * size.height / 2,
          snapshot: resolvedSnapshot,
        });
      }
    }
    const blend = 1 - Math.exp(-14 * Math.min(delta, .05));
    const a = props.alignment || DEFAULT_ADS_ALIGNMENT;
    gunDisplay.current.position.x = THREE.MathUtils.lerp(gunDisplay.current.position.x, props.ads ? a.weaponOffsetX : 0, blend);
    gunDisplay.current.position.y = THREE.MathUtils.lerp(gunDisplay.current.position.y, (props.arcade?.reloading ? -.35 : 0) + (props.ads ? a.weaponOffsetY : 0), blend);
    gunDisplay.current.position.z = THREE.MathUtils.lerp(gunDisplay.current.position.z, (pending.current ? .045 : 0) + (props.ads ? a.weaponOffsetZ : 0), blend);

    // Áp dụng góc xoay mô hình súng khi ADS (Pitch, Yaw, Roll)
    gunDisplay.current.rotation.x = THREE.MathUtils.lerp(gunDisplay.current.rotation.x, props.ads ? (a.weaponPitch || 0) : 0, blend);
    gunDisplay.current.rotation.y = THREE.MathUtils.lerp(gunDisplay.current.rotation.y, props.ads ? (a.weaponYaw || 0) : 0, blend);
    gunDisplay.current.rotation.z = THREE.MathUtils.lerp(gunDisplay.current.rotation.z, props.ads ? (a.weaponRoll || 0) : 0, blend);

    vectors.eye.copy(props.ads ? ADS_EYE : FREE_EYE);
    if (props.ads) {
      vectors.eye.x += a.cameraOffsetX;
      vectors.eye.y += a.cameraOffsetY;
      vectors.eye.z += a.cameraOffsetZ;
    }
    eye.current.lerp(vectors.eye, blend);
    updateRigAim(rig.current, props);
    rig.current.updateWorldMatrix(true, false);
    vectors.eye.copy(eye.current).applyMatrix4(rig.current.matrixWorld);

    // Áp dụng góc nhìn camera khi ADS (Camera Pitch & Yaw)
    const adsLook = LOOK.clone();
    if (props.ads) {
      adsLook.x += (a.cameraYaw || 0) * 10;
      adsLook.y += (a.cameraPitch || 0) * 10;
    }
    vectors.look.copy(adsLook).applyMatrix4(rig.current.matrixWorld);

    camera.position.copy(vectors.eye);
    camera.lookAt(vectors.look);

    // Áp dụng góc nghiêng camera (Camera Roll)
    if (props.ads && a.cameraRoll) {
      const upDir = new THREE.Vector3(Math.sin(a.cameraRoll), Math.cos(a.cameraRoll), 0).applyQuaternion(rig.current.quaternion);
      camera.up.copy(upDir);
    } else {
      camera.up.set(0, 1, 0).applyQuaternion(rig.current.quaternion);
    }

    const perspective = camera as THREE.PerspectiveCamera;
    perspective.fov = THREE.MathUtils.lerp(perspective.fov, props.ads ? 42 : 60, blend);
    perspective.updateProjectionMatrix();

    rearSight?.update(preset, delta);
  });
  return <>
    <color attach="background" args={['#b8dded']} />
    <fog attach="fog" args={['#b8dded', 180, 420]} />
    <hemisphereLight args={['#e3f4ff', '#7b8053', 1.6]} />
    <directionalLight position={[-15, 35, 12]} intensity={2.2} />
    {props.arcade && <mesh ref={orb} visible={false}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#ffe3a0" transparent opacity={.85} toneMapped={false} /></mesh>}
    <group ref={rig} position={[0, EYE_HEIGHT, 0]}>
      <group ref={gunDisplay}>
        <group quaternion={ALIGN} position={MODEL_OFFSET}>
          <primitive object={weapon} />
        </group>
      </group>
    </group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.02, -115]}><planeGeometry args={[500, 500]} /><meshStandardMaterial color="#77905a" roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -110]}><planeGeometry args={[7, 230]} /><meshStandardMaterial color="#baa47b" roughness={1} /></mesh>
    <mesh position={[0, -.03, 1.2]}><boxGeometry args={[6, .1, 3]} /><meshStandardMaterial color="#a6aaa0" /></mesh>
    <mesh position={[0, 3, -220]}><boxGeometry args={[55, 6, 9]} /><meshStandardMaterial color="#7d7750" /></mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * 18, 1.2, -110]} rotation={[0, 0, side * .2]}>
      <boxGeometry args={[8, 3, 230]} /><meshStandardMaterial color="#66794b" roughness={1} />
    </mesh>)}
    {Array.from({ length: 24 }, (_, i) => <group key={i} position={[(i % 2 ? 1 : -1) * (24 + i % 4 * 3), 0, -12 - i * 9]}>
      <mesh position={[0, 2, 0]}><cylinderGeometry args={[.22, .32, 4, 6]} /><meshStandardMaterial color="#6e5840" /></mesh>
      <mesh position={[0, 5 + i % 3, 0]}><coneGeometry args={[2.2, 6, 7]} /><meshStandardMaterial color={i % 2 ? '#476947' : '#56794d'} /></mesh>
    </group>)}
    {[-1, 1].flatMap(side => Array.from({ length: 23 }, (_, i) => <mesh key={`${side}-${i}`} position={[side * 4.5, .4, -i * 10]}>
      <boxGeometry args={[.09, .8, .09]} /><meshStandardMaterial color={i % 5 === 0 ? '#dc644c' : '#eee8ce'} />
    </mesh>))}
    {props.arcade ? Array.from({ length: props.arcade.targets }, (_, lane) => <TargetBoard key={lane} id={props.targetId} active shots={props.shots} arcade={props.arcade} lane={lane} time={gameTime} />)
      : AK_TARGETS.map(t => <TargetBoard key={t.id} id={t.id} active={props.targetId === t.id} shots={props.shots} />)}
  </>;


}

class SceneBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="absolute inset-0 grid place-items-center bg-slate-900 text-white p-8 text-center">Không tải được cảnh 3D. Hãy tải lại trang và kiểm tra WebGL / tệp ak47_adjustable.glb.</div> : this.props.children; }
}

export default function ShootingRange3D(props: Props) {
  return <div className="absolute inset-0" aria-label="Trường bắn AKM 3D">
    <SceneBoundary><Canvas dpr={[1, 1.5]} camera={{ position: [0, EYE_HEIGHT, .5], near: .005, far: 500, fov: 60 }} gl={{ antialias: true }}>
      <Suspense fallback={<Html center><span className="whitespace-nowrap rounded bg-slate-900 px-4 py-2 text-white">Đang tải AKM 3D…</span></Html>}><Scene {...props} /></Suspense>
    </Canvas></SceneBoundary>
  </div>;
}
