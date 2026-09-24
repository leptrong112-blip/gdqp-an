import type { FeatureId, FeatureSample } from '../types';
import { mad } from './geometry';

// Robust spread, not absolute height: mild lowering of the whole body is not an error.
// These are stability tolerances (degrees/body-normalized distance), not pose grades.
const limits: Partial<Record<FeatureId, number>> = {
  torsoTilt: 5, shoulderTilt: 5, hipTilt: 5,
  leftKneeAngle: 8, rightKneeAngle: 8, leftElbowAngle: 8, rightElbowAngle: 8,
  leftWristHipDistance: 0.12, rightWristHipDistance: 0.12,
};
export function stableStaticHold(samples: readonly FeatureSample[]): boolean {
  const end = samples.at(-1)?.timestampMs ?? 0;
  const recent = samples.filter(s => end - s.timestampMs <= 800);
  if (recent.length < 6) return true; // Need enough evidence before assessing variability.
  return Object.entries(limits).every(([key, limit]) => {
    const values = recent.map(s => s.values[key as FeatureId]).filter(v => v && v.confidence >= 0.6).map(v => v!.value);
    if (values.length < 6) return true;
    values.sort((a, b) => a - b);
    const trim = Math.floor(values.length * 0.2);
    // MAD alone is zero when a slight majority is identical, even during two-pose oscillation.
    // Central spread catches repeated changes while ignoring isolated extremes.
    const spread = values[values.length - 1 - trim] - values[trim];
    return mad(values) <= limit! && spread <= limit! * 2;
  });
}
