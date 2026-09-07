import { useEffect, useMemo } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import { Mesh, Skeleton, SkinnedMesh } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { SoldierAnimationName, useSoldierAnimationController } from './animationController';

export const SOLDIER_MODEL_URL = '/models/training/soldier-animated.glb';

export interface Soldier3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  animation?: SoldierAnimationName;
  visible?: boolean;
  paused?: boolean;
  playbackSpeed?: number;
  resetSignal?: number;
  fadeDuration?: number;
}

/** The exported asset is 1.75 m tall, feet at y=0, facing +Z. */
export default function Soldier3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  animation = 'Idle',
  visible = true,
  paused = false,
  playbackSpeed = 1,
  resetSignal = 0,
  fadeDuration = 0.25,
}: Soldier3DProps) {
  const { scene, animations } = useGLTF(SOLDIER_MODEL_URL);
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

  useSoldierAnimationController({
    actions,
    mixer,
    animation,
    paused: paused || !visible,
    playbackSpeed,
    resetSignal,
    fadeDuration,
  });

  return (
    <group position={position} rotation={rotation} scale={scale} visible={visible} dispose={null}>
      <primitive object={model} dispose={null} />
    </group>
  );
}

useGLTF.preload(SOLDIER_MODEL_URL);
