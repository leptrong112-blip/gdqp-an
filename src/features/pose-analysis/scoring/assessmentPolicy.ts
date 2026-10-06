/** Overall grade is score-based; criterion findings remain independent feedback. */
export const POSE_PASS_SCORE = 65;
export function overallPoseAssessment(total: number, missingPoints = 0, complete = true): 'pass' | 'fail' | 'incomplete' {
  if (!complete || missingPoints > 0) return 'incomplete';
  return total >= POSE_PASS_SCORE ? 'pass' : 'fail';
}
