export type Vec3 = [number, number, number];
export const CAMERA_PRESETS = {
  overview: { position: [26, 20, 32], target: [0, 0, -2] },
  formationArea: { position: [-12.2, 1.8, 7.6], target: [-15, 0.9, 4] },
  movementArea: { position: [7, 6.5, 18], target: [1, 0.7, 10] },
  vegetationArea: { position: [-12, 4, -7], target: [-18, 1.4, -13] },
  wallArea: { position: [13, 3.8, -1], target: [8, 0.8, -6] },
  sandbagArea: { position: [22.5, 3.2, 1], target: [18, 0.7, -4] },
  trenchArea: { position: [21, 6.5, -9.5], target: [15, -0.3, -16] },
  openArea: { position: [27, 4.5, 18], target: [22, 0.6, 12] },
  compass: { position: [0, 2.2, 3.0], target: [0, 0.25, 0] },
} satisfies Record<string, { position: Vec3; target: Vec3 }>;
export type CameraPreset = keyof typeof CAMERA_PRESETS;
export type GroundZone = 'formation' | 'movement' | 'vegetation' | 'wall' | 'sandbag' | 'trench' | 'open';
export const ZONE_LABELS: Record<GroundZone, string> = {
  formation: 'KHU ĐỘI NGŨ', movement: 'ĐƯỜNG VẬN ĐỘNG', vegetation: 'CÂY & BỤI CÂY',
  wall: 'TƯỜNG HUẤN LUYỆN', sandbag: 'KHU BAO CÁT', trench: 'HÀO MÔ PHỎNG', open: 'KHU QUAN SÁT',
};
export const ZONE_CENTERS: Record<GroundZone, Vec3> = {
  formation: [-15, 0, 4], movement: [1, 0, 10], vegetation: [-18, 0, -14],
  wall: [8, 0, -7], sandbag: [18, 0, -5], trench: [15, 0, -16], open: [22, 0, 12],
};
// These pads are flattened by build_training_ground.py; feet remain at y=0.
export const OBSERVATION_POINTS: Record<GroundZone, Vec3> = {
  ...ZONE_CENTERS, vegetation: [-16, 0, -9], wall: [8, 0, -3], sandbag: [18, 0, -1], trench: [15, 0, -10],
};
