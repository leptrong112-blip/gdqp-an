import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';

export const F1_PARTS = [
  { id: 'body', name: '1. Thân vỏ có khía', detail: 'Phần thân có dạng bầu dục với các hàng ô nổi và rãnh đặc trưng. Trong mô hình trơ này, thân là khối minh họa kín, giúp học sinh nhận biết hình dáng bên ngoài và phân biệt với các chi tiết ở phía trên.' },
  { id: 'crown', name: '2. Cụm nắp phía trên', detail: 'Chi tiết minh họa vị trí cụm phía trên thân. Mô hình dùng một khối đặc đơn giản để học sinh nhận biết hình dáng và vị trí; không thể hiện cơ cấu hay vật liệu bên trong.' },
  { id: 'lever', name: '3. Cần bẩy (mỏ vịt)', detail: 'Chi tiết dạng thanh dẹt, uốn dọc theo một bên thân; thường được gọi là mỏ vịt. Hãy xoay mô hình để quan sát đường cong, bề mặt và vị trí tương đối của chi tiết trên mẫu trưng bày.' },
  { id: 'ring', name: '4. Vòng kéo bên ngoài', detail: 'Chi tiết dạng vòng kim loại nằm gần phần trên, là một dấu hiệu nhận dạng bên ngoài. Vòng trong mô hình là chi tiết trang trí độc lập để quan sát, không liên kết với cơ cấu hoạt động.' },
];

interface Props {
  expanded: boolean; selected: string | null; onExpand: () => void; onSelect: (id: string | null) => void;
  reset: number; scale: number; rotation: number; height: number;
}

export default function F1ClassroomModel(props: Props) {
  const gltf = useGLTF('/models/f1-classroom.glb');
  const root = useRef<THREE.Group>(null!);
  const controls = useRef<OrbitControlsImpl>(null!);
  const { camera, size } = useThree();
  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse(o => { if (o instanceof THREE.Mesh) o.material = (o.material as THREE.MeshStandardMaterial).clone(); });
    return cloned;
  }, [gltf.scene]);
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  const progress = useRef(0);
  const framing = useRef(2);
  const scratch = useMemo(() => ({ box: new THREE.Box3(), center: new THREE.Vector3(), size: new THREE.Vector3(), eye: new THREE.Vector3(), direction: new THREE.Vector3(1.5, .8, 4).normalize() }), []);
  useEffect(() => {
    const action = mixer.clipAction(gltf.animations[0]);
    action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.play();
    return () => { mixer.stopAllAction(); mixer.uncacheRoot(scene); };
  }, [mixer, gltf.animations, scene]);
  useEffect(() => () => {
    scene.traverse(o => { if (o instanceof THREE.Mesh) (o.material as THREE.Material).dispose(); });
  }, [scene]);
  useEffect(() => { framing.current = 2.2; }, [props.expanded, props.selected, props.reset, props.scale, props.rotation, props.height, size.width, size.height]);
  useEffect(() => {
    for (const part of F1_PARTS) {
      scene.getObjectByName(part.id)?.traverse(o => {
        if (o instanceof THREE.Mesh) {
          const material = o.material as THREE.MeshStandardMaterial;
          material.emissive.set(props.selected === part.id ? '#b88c28' : '#000000');
          material.emissiveIntensity = .28;
        }
      });
    }
  }, [scene, props.selected]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, .05);
    const goal = props.expanded ? 1.6 : 0;
    progress.current += Math.sign(goal - progress.current) * Math.min(Math.abs(goal - progress.current), dt);
    // Sampling the embedded GLB clip supports smooth reversal midway through.
    const action = mixer.existingAction(gltf.animations[0]);
    if (action) { action.enabled = true; action.paused = false; }
    mixer.setTime(progress.current);
    root.current.updateWorldMatrix(true, true);
    if (framing.current > 0 && controls.current) {
      const focus = props.selected ? scene.getObjectByName(props.selected) || root.current : root.current;
      scratch.box.setFromObject(focus); scratch.box.getCenter(scratch.center); scratch.box.getSize(scratch.size);
      const perspective = camera as THREE.PerspectiveCamera;
      const fit = Math.max(scratch.size.y, scratch.size.x / perspective.aspect, scratch.size.z);
      const distance = Math.max(1, fit / (2 * Math.tan(THREE.MathUtils.degToRad(perspective.fov / 2))) * 1.55);
      scratch.eye.copy(scratch.center).addScaledVector(scratch.direction, distance);
      const alpha = 1 - Math.exp(-7 * dt);
      camera.position.lerp(scratch.eye, alpha); controls.current.target.lerp(scratch.center, alpha);
      controls.current.update(); framing.current -= dt;
    }
  });
  return <>
    <group ref={root} scale={props.scale} rotation={[0, props.rotation, 0]} position={[0, props.height, 0]}>
      <primitive object={scene} onClick={(event: { stopPropagation: () => void; object: THREE.Object3D; delta: number }) => {
        event.stopPropagation(); if (event.delta > 5) return;
        if (!props.expanded) { props.onExpand(); return; }
        let object: THREE.Object3D | null = event.object;
        while (object && !F1_PARTS.some(p => p.id === object!.name)) object = object.parent;
        if (object) props.onSelect(object.name === props.selected ? null : object.name);
      }} />
    </group>
    <OrbitControls ref={controls} makeDefault minDistance={.6} maxDistance={25} onStart={() => { framing.current = 0; }} />
  </>;
}
