import type { CanonicalPoseFrame, LandmarkName } from '../../../../src/features/pose-analysis/types';

// Approximate manual transcription of the visible overlay in the four reference
// screenshots supplied on 2026-10-08, in the user's order. No photos or identity
// are stored. These are projected silhouette regression fixtures, NOT detector
// output, measured world coordinates, confidence estimates or training labels.
// Depth=0 and confidence=.99 below are controlled simulation assumptions only.
const order = ['nose', 'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow',
  'leftWrist', 'rightWrist', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee',
  'leftAnkle', 'rightAnkle', 'leftHeel', 'rightHeel', 'leftFootIndex', 'rightFootIndex'] as const satisfies readonly LandmarkName[];
export const referenceSilhouettes = [
  { posture:'attention', points:[[83,58],[20,145],[131,144],[20,239],[148,237],[31,324],[161,319],
    [57,324],[123,319],[75,455],[133,448],[95,579],[139,578],[102,595],[135,595],[81,616],[164,614]] },
  { posture:'attention', points:[[228,85],[167,155],[284,153],[153,239],[301,235],[154,316],[311,312],
    [197,318],[266,315],[211,435],[262,429],[222,553],[268,548],[230,570],[263,566],[204,585],[293,578]] },
  { posture:'attention', points:[[200,54],[141,124],[245,120],[131,208],[258,205],[131,287],[259,284],
    [162,282],[225,282],[168,406],[226,406],[180,523],[218,522],[185,536],[213,536],[175,553],[237,552]] },
  { posture:'atEase', points:[[195,47],[134,124],[261,120],[115,214],[283,208],[100,294],[286,287],
    [157,307],[234,309],[142,425],[230,433],[173,548],[220,551],[183,562],[215,565],[147,594],[244,591]] },
] as const;

export function referenceSilhouetteFrame(index: number, timestampMs: number): CanonicalPoseFrame {
  const points = referenceSilhouettes[index].points;
  // Place the cropped reference in a full camera frame with head/foot margins.
  // Never treat the user's screenshot crop as actual camera framing.
  const rootX = (points[7][0] + points[8][0]) / 2, rootY = (points[7][1] + points[8][1]) / 2;
  const height = Math.max(...points.map(p => p[1])) - points[0][1];
  const scale = .75 / height;
  const frame: CanonicalPoseFrame = { timestampMs, aspectRatio:4/3, personCount:1, landmarks:{} };
  order.forEach((name, i) => {
    const [x,y] = points[i];
    frame.landmarks[name] = {
      image:{x:.5+(x-rootX)*scale/frame.aspectRatio, y:.14+(y-points[0][1])*scale, z:0},
      world:{x:(x-rootX)*scale, y:(y-rootY)*scale, z:0},
      confidence:.99, visibility:.99, presence:null,
    };
  });
  return frame;
}
