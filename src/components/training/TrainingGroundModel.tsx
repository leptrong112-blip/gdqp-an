import { useEffect, useMemo } from 'react';
import { Html, useGLTF } from '@react-three/drei';
import { Color, Mesh, MeshStandardMaterial } from 'three';
import { GroundZone, ZONE_CENTERS, ZONE_LABELS } from './trainingSceneConfig';

const MODEL = '/models/training/training-ground.glb?finish=earth-01';

export default function TrainingGroundModel({ highlightedZone, showLabel = true }: {
  highlightedZone?: GroundZone; showLabel?: boolean;
}) {
  const { scene } = useGLTF(MODEL);
  const { model, materials } = useMemo(() => {
    const model = scene.clone(true);
    const materials: { material: MeshStandardMaterial; zone: string; color: Color; intensity: number }[] = [];
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const zone = object.name.split('_')[0].toLowerCase();
      object.receiveShadow = true;
      const groundOverlay = /paving|compacted_lane|path|approach|_pad|bare_observation_ground/i.test(object.name);
      const groundMarking = /white_markings|lane_marking|movement_(DICH|XUAT)/i.test(object.name);
      object.castShadow = !/grass|pebble|terrain|marking|path/i.test(object.name) && !groundOverlay && !groundMarking;
      const cloneMaterial = (source: MeshStandardMaterial) => {
        const material = source.clone();
        // Separate coplanar surface finishes in the depth buffer. Geometry and
        // all object transforms remain exactly as authored in the current GLB.
        if (groundOverlay || groundMarking) {
          material.polygonOffset = true;
          material.polygonOffsetFactor = groundMarking ? -3 : -1;
          material.polygonOffsetUnits = groundMarking ? -6 : -2;
        }
        if (material.isMeshStandardMaterial) materials.push({ material, zone, color: material.emissive.clone(), intensity: material.emissiveIntensity });
        return material;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map((material) => cloneMaterial(material as MeshStandardMaterial))
        : cloneMaterial(object.material as MeshStandardMaterial);
    });
    return { model, materials };
  }, [scene]);

  useEffect(() => {
    for (const item of materials) {
      item.material.emissive.copy(item.color);
      item.material.emissiveIntensity = item.intensity;
      if (item.zone === highlightedZone) {
        item.material.emissive.set('#78894f');
        item.material.emissiveIntensity = 0.16;
      }
    }
  }, [materials, highlightedZone]);
  useEffect(() => () => materials.forEach(({ material }) => material.dispose()), [materials]);

  return <group dispose={null}>
    <primitive object={model} />
    {highlightedZone && showLabel && <Html center position={[
      ZONE_CENTERS[highlightedZone][0], highlightedZone === 'vegetation' ? 6 : 2.3,
      ZONE_CENTERS[highlightedZone][2],
    ]} style={{ pointerEvents: 'none' }}>
      <div className="whitespace-nowrap rounded-full border border-white/25 bg-slate-950/80 px-3 py-1 text-[10px] font-bold tracking-wide text-white shadow-lg">
        <span className="mr-1.5 text-emerald-400">●</span>{ZONE_LABELS[highlightedZone]}
      </div>
    </Html>}
  </group>;
}
