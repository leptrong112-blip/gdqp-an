import { useCallback, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CAMERA_PRESETS, CameraPreset } from './trainingSceneConfig';

interface TrainingCameraControllerProps {
  preset: CameraPreset;
  resetSignal?: number;
}

/** A preset starts one transition. Ordinary React updates leave the orbit alone. */
export default function TrainingCameraController({
  preset,
  resetSignal = 0,
}: TrainingCameraControllerProps) {
  const camera = useThree((state) => state.camera);
  const controls = useRef<OrbitControlsImpl>(null);
  const transition = useRef<{ position: Vector3; target: Vector3 } | null>(null);
  const boundedTarget = useRef(new Vector3());
  const correction = useRef(new Vector3());

  useEffect(() => {
    const view = CAMERA_PRESETS[preset];
    const orbit = controls.current;
    if (!view || !orbit) return;
    // Drain the previous gesture's damping before starting a requested view.
    orbit.enableDamping = false;
    orbit.update();
    transition.current = {
      position: new Vector3(...view.position),
      target: new Vector3(...view.target),
    };
  }, [preset, resetSignal]);

  const cancelTransition = useCallback(() => {
    transition.current = null;
    if (controls.current) controls.current.enableDamping = true;
  }, []);

  useFrame((_, delta) => {
    const orbit = controls.current;
    if (!orbit) return;
    const destination = transition.current;
    if (destination) {
      const amount = 1 - Math.exp(-5 * Math.min(delta, 0.1));
      camera.position.lerp(destination.position, amount);
      orbit.target.lerp(destination.target, amount);
      if (camera.position.distanceToSquared(destination.position) < 0.0004
        && orbit.target.distanceToSquared(destination.target) < 0.0004) {
        camera.position.copy(destination.position);
        orbit.target.copy(destination.target);
        transition.current = null;
        orbit.enableDamping = true;
      }
      orbit.update();
    }

    // Bound panning while keeping the camera-to-target offset consistent.
    boundedTarget.current.set(
      Math.max(-35, Math.min(35, orbit.target.x)),
      Math.max(-1.25, Math.min(6, orbit.target.y)),
      Math.max(-27.5, Math.min(27.5, orbit.target.z)),
    );
    correction.current.subVectors(boundedTarget.current, orbit.target);
    if (correction.current.lengthSq() > 0) {
      orbit.target.copy(boundedTarget.current);
      camera.position.add(correction.current);
    }
    camera.position.y = Math.max(0.45, camera.position.y);
  }, -0.5);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={preset === 'compass' ? 1.2 : 3}
      maxDistance={100}
      minPolarAngle={0.08}
      maxPolarAngle={Math.PI / 2 - 0.025}
      enablePan
      screenSpacePanning={false}
      rotateSpeed={0.65}
      zoomSpeed={0.8}
      panSpeed={0.65}
      onStart={cancelTransition}
    />
  );
}
