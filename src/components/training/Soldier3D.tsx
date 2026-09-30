import { useEffect, useMemo } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import { Mesh, Skeleton, SkinnedMesh } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { SoldierAnimationName, useSoldierAnimationController } from './animationController';

export const SOLDIER_MODEL_URL = '/models/training/soldier-animated.glb';

export interface SoldierTransformOffset {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export interface Soldier3DProps {
  modelUrl?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  animation?: SoldierAnimationName;
  animationClipName?: string;
  visible?: boolean;
  paused?: boolean;
  playbackSpeed?: number;
  resetSignal?: number;
  fadeDuration?: number;
  transformOffset?: SoldierTransformOffset;
}

/** 
 * Soldier3D: Render và animate mô hình chiến sĩ với hỗ trợ các file GLB động tác riêng biệt
 * (quay phai.glb, quay sau.glb, quay tay trai.glb) kèm offset căn tâm & scale chuẩn mực.
 */
export default function Soldier3D({
  modelUrl = SOLDIER_MODEL_URL,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  animation = 'Idle',
  animationClipName,
  visible = true,
  paused = false,
  playbackSpeed = 1,
  resetSignal = 0,
  fadeDuration = 0.25,
  transformOffset,
}: Soldier3DProps) {
  const assetUrl = modelUrl || SOLDIER_MODEL_URL;
  const { scene, animations } = useGLTF(assetUrl);
  const model = useMemo(() => {
    // Object3D.clone alone shares skeletons. Each visible soldier needs its own
    // cloned bone hierarchy; geometry, immutable materials and textures can share.
    const instance = clone(scene);
    instance.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        // The bind-pose bounds need not contain a saluting arm or a seated body.
        if ('isSkinnedMesh' in object) object.frustumCulled = false;
      }
    });
    return instance;
  }, [scene]);

  const { actions, mixer } = useAnimations(animations, model);

  useEffect(() => () => {
    // Only skeletons are instance-owned; never dispose the cached GLB's shared
    // geometry, textures or materials when a tab hides/unmounts a soldier.
    const skeletons = new Set<Skeleton>();
    model.traverse((object) => {
      if (object instanceof SkinnedMesh) skeletons.add(object.skeleton);
    });
    skeletons.forEach((skeleton) => skeleton.dispose());
  }, [model]);

  // Ưu tiên animationClipName cụ thể của file GLB (ví dụ Action, Action.002, Action.018), fallback theo animation prop
  const activeAnim = animationClipName || animation;

  useSoldierAnimationController({
    actions,
    mixer,
    animation: activeAnim,
    paused: paused || !visible,
    playbackSpeed,
    resetSignal,
    fadeDuration,
  });

  const finalScale = scale * (transformOffset?.scale ?? 1);
  const offsetPos = transformOffset?.position ?? [0, 0, 0];
  const offsetRot = transformOffset?.rotation ?? [0, 0, 0];

  return (
    <group position={position} rotation={rotation} scale={finalScale} visible={visible} dispose={null}>
      <group position={offsetPos} rotation={offsetRot}>
        <primitive object={model} dispose={null} />
      </group>
    </group>
  );
}

// Chỉ preload các model thực tế đang được UI hiển thị
useGLTF.preload(SOLDIER_MODEL_URL);
useGLTF.preload('/models/quay phai.glb');
useGLTF.preload('/models/quay sau.glb');
useGLTF.preload('/models/quay tay trai.glb');
