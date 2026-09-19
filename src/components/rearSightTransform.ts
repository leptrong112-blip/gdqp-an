import { Object3D, Quaternion, Vector3 } from 'three';
import type { SightPresetConfig } from './rangeSightPresets';

export function bindRearSight(weapon: Object3D) {
  const node = weapon.getObjectByName('RearSight');
  if (!node?.parent || node.userData.role !== 'rear-sight-visual') return null;
  const original = { position: node.position.clone(), quaternion: node.quaternion.clone(), scale: node.scale.clone() };
  const targetPosition = new Vector3(), targetRotation = new Quaternion(), offsetRotation = new Quaternion();
  const localAxis = new Vector3(1, 0, 0);
  return {
    node,
    restore() { node.position.copy(original.position); node.quaternion.copy(original.quaternion); node.scale.copy(original.scale); },
    update(preset: SightPresetConfig, delta: number) {
      targetPosition.copy(original.position); targetPosition.y += preset.localOffsetY; targetPosition.z += preset.localOffsetZ;
      targetRotation.copy(original.quaternion).multiply(offsetRotation.setFromAxisAngle(localAxis, preset.localPitchRad));
      const blend = 1 - Math.exp(-14 * Math.min(delta, .05));
      node.position.lerp(targetPosition, blend); node.quaternion.slerp(targetRotation, blend); node.scale.copy(original.scale);
      // Finish at the exact authored transform; repeated preset changes never accumulate offsets.
      if (node.position.distanceToSquared(targetPosition) < 1e-12) node.position.copy(targetPosition);
      if (node.quaternion.angleTo(targetRotation) < 1e-5) node.quaternion.copy(targetRotation);
    },
  };
}
