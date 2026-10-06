import type { CanonicalPoseFrame, HandFeatures, SaluteHandMetrics, Vec3 } from '../types';
import { angleAt3D, angleBetween, distance, subtract } from './geometry';

export const HAND_EDGES: [number, number][] = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
const finite = (p: Vec3) => p && [p.x, p.y, p.z].every(Number.isFinite);
export const HAND_SYNC_TOLERANCE_MS = 100;
export function handFeatures(frame: CanonicalPoseFrame): HandFeatures {
  const hand = frame.saluteHand;
  const validLandmarks = hand?.image.filter(finite).length ?? 0;
  const ageMs = hand ? frame.timestampMs - hand.timestampMs : undefined;
  const unknown = (reason: string): HandFeatures => ({ available: false, confidence: hand?.confidence,
    validLandmarks, ageMs, handedness: hand?.handedness, quality: 'INSUFFICIENT_HAND_EVIDENCE', reason });
  if (!hand) return frame.handEvidence ? { ...frame.handEvidence, available: false, quality: 'INSUFFICIENT_HAND_EVIDENCE' } : unknown('Chưa thấy đủ 21 điểm bàn tay.');
  if (validLandmarks !== 21 || hand.world.length !== 21 || !hand.world.every(finite)) return unknown('Chưa thấy đủ 21 điểm bàn tay.');
  if (ageMs! < 0 || ageMs! > HAND_SYNC_TOLERANCE_MS) return unknown('Dữ liệu bàn tay quá cũ hoặc lệch thời gian với cơ thể.');
  if (hand.confidence !== undefined && (!Number.isFinite(hand.confidence) || hand.confidence < .65)) return unknown('Độ tin cậy bàn tay thấp.');
  if (hand.identityStable === false) return unknown('Nhận diện bên tay chưa ổn định.');
  if (hand.sharpness !== undefined && (!Number.isFinite(hand.sharpness) || hand.sharpness < 8)) return unknown('Ảnh vùng bàn tay chưa rõ; có thể bị mờ hoặc thiếu tương phản.');
  const px = (p: Vec3) => ({ x: p.x * hand.sourceWidth, y: p.y * hand.sourceHeight, z: 0 });
  if (hand.image.some(p => p.x <= 0 || p.x >= 1 || p.y <= 0 || p.y >= 1) ||
    distance(px(hand.image[5]), px(hand.image[17])) < 8 || Math.max(...hand.image.map(p => distance(px(p), px(hand.image[0])))) < 28) return unknown('Bàn tay bị cắt hoặc quá nhỏ trên ảnh gốc.');
  const p = hand.world;
  const fingerExtension = [5, 9, 13, 17].map(i => Math.min(angleAt3D(p[i], p[i + 1], p[i + 2]), angleAt3D(p[i + 1], p[i + 2], p[i + 3])));
  const fingerSpread = Math.max(...[[5,9],[9,13],[13,17]].map(([a,b]) => angleBetween(subtract(p[a+3],p[a]), subtract(p[b+3],p[b]))));
  const a = subtract(p[5], p[0]), b = subtract(p[17], p[0]);
  const normal = { x: a.y*b.z-a.z*b.y, y: a.z*b.x-a.x*b.z, z: a.x*b.y-a.y*b.x };
  const len = Math.hypot(normal.x, normal.y, normal.z);
  const wrist = subtract(p[9], p[0]), wristLen = Math.hypot(wrist.x, wrist.y, wrist.z);
  if (len < 1e-6 || wristLen < 1e-6 || !fingerExtension.every(Number.isFinite) || !Number.isFinite(fingerSpread)) return unknown('Hình học bàn tay chưa đáng tin cậy.');
  return { available: true, quality: 'OBSERVED', confidence: hand.confidence, validLandmarks, ageMs, handedness: hand.handedness,
    fingerExtension, fingerSpread, fingerAlignment: fingerSpread,
    palmOrientation: { x: normal.x/len, y: normal.y/len, z: normal.z/len },
    wristOrientation: { x: wrist.x/wristLen, y: wrist.y/wristLen, z: wrist.z/wristLen } };
}

/** Cheap image-quality proxy on the native ROI, not a claim to detect blur perfectly. */
export function handSharpness(rgba: ArrayLike<number>, width: number, height: number): number {
  const gray = (x: number, y: number) => { const i = (y * width + x) * 4; return (rgba[i] + rgba[i+1] + rgba[i+2]) / 3; };
  let sum = 0, square = 0, n = 0;
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const lap = 4 * gray(x, y) - gray(x-1,y) - gray(x+1,y) - gray(x,y-1) - gray(x,y+1);
    sum += lap; square += lap * lap; n++;
  }
  return n ? Math.max(0, square/n-(sum/n)**2) : 0;
}
export function raisedSaluteWrist(frame: CanonicalPoseFrame): boolean {
  const { rightWrist: wrist, rightShoulder: shoulder, nose, rightHip: hip } = frame.landmarks;
  return frame.personCount === 1 && !!wrist && !!shoulder && !!nose && !!hip &&
    [wrist, shoulder, nose, hip].every(p => p.confidence >= .6) && wrist.image.y < shoulder.image.y + .05 &&
    Math.hypot((wrist.image.x - nose.image.x) * frame.aspectRatio, wrist.image.y - nose.image.y) < .4;
}

/** Associate by anatomical Pose wrist proximity; display mirroring/handedness labels do not decide. */
export function matchSaluteHand(frame: CanonicalPoseFrame, images: Vec3[][], worlds: Vec3[][], width: number, height: number) {
  if (!raisedSaluteWrist(frame)) return undefined;
  const right = frame.landmarks.rightWrist!, left = frame.landmarks.leftWrist;
  const ls = frame.landmarks.leftShoulder, rs = frame.landmarks.rightShoulder;
  if (!ls || !rs) return undefined;
  const px = (p: Vec3) => ({ x: p.x * width, y: p.y * height, z: 0 });
  const span = distance(px(ls.image), px(rs.image));
  if (span < 30) return undefined;
  const candidates = images.flatMap((image, i) => {
    const world = worlds[i];
    if (image.length !== 21 || world?.length !== 21 || !image.every(finite) || !world.every(finite) ||
      image.some(p => p.x <= 0 || p.x >= 1 || p.y <= 0 || p.y >= 1)) return [];
    const wrist = px(image[0]), dr = distance(wrist, px(right.image));
    if (dr > span * .4 || (left && left.confidence >= .6 && distance(wrist, px(left.image)) <= dr + span * .12)) return [];
    const palmPixels = distance(px(image[5]), px(image[17]));
    const handPixels = Math.max(...image.map(p => distance(px(p), wrist)));
    if (palmPixels < 8 || handPixels < 28 || handPixels > span * 1.2) return [];
    const palm = distance(world[5], world[17]);
    if (palm < .015 || palm > .15 || HAND_EDGES.some(([a,b]) => distance(world[a], world[b]) < .001)) return [];
    return [{ dr, observation: { timestampMs: frame.timestampMs, image, world, sourceWidth: width, sourceHeight: height } }];
  }).sort((a,b) => a.dr - b.dr);
  if (!candidates.length || (candidates[1] && candidates[1].dr - candidates[0].dr < span * .15)) return undefined;
  return candidates[0].observation;
}

export function saluteHandMetrics(frame: CanonicalPoseFrame): SaluteHandMetrics | undefined {
  const hand = frame.saluteHand;
  if (!hand || hand.timestampMs !== frame.timestampMs || !handFeatures(frame).available || !raisedSaluteWrist(frame) ||
    hand.world.length !== 21 || hand.image.length !== 21 || !hand.world.every(finite) || !hand.image.every(finite)) return;
  const p = hand.world, palm = distance(p[5], p[17]);
  const elbow = frame.landmarks.rightElbow, wrist = frame.landmarks.rightWrist;
  const head = frame.landmarks.rightEye ?? frame.landmarks.rightEar ?? frame.landmarks.nose;
  const ls = frame.landmarks.leftShoulder, rs = frame.landmarks.rightShoulder;
  if (!elbow || !wrist || !head || !ls || !rs || [elbow,wrist,head,ls,rs].some(v => v.confidence < .6) || palm < .015) return;
  const px = (v: Vec3) => ({ x: v.x * frame.aspectRatio, y: v.y, z: 0 });
  const width = distance(px(ls.image), px(rs.image));
  if (width < .02) return;
  const extension = Math.min(...[5,9,13,17].flatMap(i => [angleAt3D(p[i], p[i+1], p[i+2]), angleAt3D(p[i+1], p[i+2], p[i+3])]));
  const spread = Math.max(...[[5,9],[9,13],[13,17]].map(([a,b]) => angleBetween(subtract(p[a+3],p[a]), subtract(p[b+3],p[b]))));
  const segment = subtract(p[6],p[5]), from = subtract(p[4],p[5]);
  const norm = segment.x**2 + segment.y**2 + segment.z**2;
  if (norm < 1e-8) return;
  const t = Math.max(0,Math.min(1,(from.x*segment.x+from.y*segment.y+from.z*segment.z)/norm));
  const thumbGap = distance(p[4],{ x:p[5].x+t*segment.x,y:p[5].y+t*segment.y,z:p[5].z+t*segment.z }) / palm;
  // Both vectors in the image plane; world origins of Pose and Hands differ.
  const wristBend = angleBetween(subtract(px(hand.image[9]),px(hand.image[0])), subtract(px(wrist.image),px(elbow.image)));
  const tipHeadDistance = distance(px(hand.image[12]),px(head.image)) / width;
  const metrics = { extension, spread, thumbGap, wristBend, tipHeadDistance };
  return Object.values(metrics).every(Number.isFinite) ? metrics : undefined;
}
