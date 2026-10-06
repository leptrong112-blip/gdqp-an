/** Presentation only: persisted scores and pass/fail rules remain on the 100-point scale. */
export function poseScoreOnTen(points: number, sourceMaximum = 100): number {
  return Number((points * 10 / sourceMaximum).toFixed(2));
}
