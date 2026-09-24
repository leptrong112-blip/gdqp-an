import type { CanonicalPoseFrame, LandmarkName } from '../types';
import { usable } from './confidenceFilter';
import { angleAt3D, distance, flat, mad } from './geometry';
import { aspectCorrectedImage, measurements } from './normalization';

function kneeAngles(frame: CanonicalPoseFrame): number[] | null {
  const angles: number[] = [];
  for (const side of ['left', 'right'] as const) {
    const names: LandmarkName[] = [`${side}Hip`, `${side}Knee`, `${side}Ankle`];
    const points = names.map(name => frame.landmarks[name]);
    if (points.some(p => !usable(p) || !p.world)) return null;
    const angle = angleAt3D(points[0]!.world!, points[1]!.world!, points[2]!.world!);
    if (!Number.isFinite(angle)) return null;
    angles.push(angle);
  }
  return angles;
}

/** Conservative evidence checks, not a detector of every possible depth ambiguity. */
export function kneeEvidenceIssue(frame: CanonicalPoseFrame, recent: readonly CanonicalPoseFrame[]): string | null {
  if (!kneeAngles(frame)) return 'Chưa nhìn rõ đầu gối và chân trụ. Giữ cả hai chân trong khung hình, tránh che khuất.';
  const left = frame.landmarks.leftKnee!, right = frame.landmarks.rightKnee!;
  const torso = measurements(frame)?.torsoLength ?? 0;
  if (torso > 0 && distance(flat(aspectCorrectedImage(frame, left)), flat(aspectCorrectedImage(frame, right))) < torso * 0.12) {
    return 'Hai đầu gối đang chồng hình; camera chưa phân biệt rõ chân chùng và chân trụ. Chỉnh vị trí camera để thấy riêng hai đầu gối.';
  }
  const angles = recent.map(kneeAngles).filter((v): v is number[] => v !== null);
  if (angles.length >= 6 && [0, 1].some(side => mad(angles.map(v => v[side])) > 8)) {
    return 'Số đo đầu gối chưa ổn định. Giữ yên tư thế đứng nghỉ và để camera thấy rõ cả hai chân.';
  }
  return null;
}
