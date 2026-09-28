export const DEFAULT_AK_MODEL = '/models/ak47.glb';
export const EXTENDED_AK_MODEL = '/models/gun ak47 (2).glb';

export function getAKModelPath(section: 'structure' | 'procedure', mode: 'thao' | 'lap', stepIndex: number) {
  return section === 'procedure' && mode === 'thao' && (stepIndex === 4 || stepIndex === 5)
    ? EXTENDED_AK_MODEL
    : DEFAULT_AK_MODEL;
}

// Keep the shared procedure clock in its original coordinates, including on
// backward jumps to the old asset. Only the new GLB has this extended timeline.
export function getAKClipTime(modelPath: string, procedureTime: number) {
  if (modelPath !== EXTENDED_AK_MODEL || procedureTime <= 11) return procedureTime;
  const step5End = 382 / 24; // Last key of the added vtulk_low_mat1_0 tracks.
  const step6End = 430 / 24; // End of the authored Animation clip.
  if (procedureTime <= 13.42) {
    return 11 + (procedureTime - 11) / (13.42 - 11) * (step5End - 11);
  }
  return step5End + Math.min(1, (procedureTime - 13.42) / (15.42 - 13.42)) * (step6End - step5End);
}
