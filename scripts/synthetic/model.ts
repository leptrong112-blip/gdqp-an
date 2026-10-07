import type { CanonicalPoseFrame, LandmarkName, Vec3 } from '../../src/features/pose-analysis/types';

export const PROFILES = [
  { id: 'reference', bodyScale: 1, shoulderRatio: 1, legRatio: 1, armRatio: 1 },
  { id: 'narrow-long-legs', bodyScale: .95, shoulderRatio: .9, legRatio: 1.08, armRatio: 1 },
  { id: 'wide-short-legs', bodyScale: 1.02, shoulderRatio: 1.1, legRatio: .92, armRatio: 1 },
  { id: 'long-arms', bodyScale: .98, shoulderRatio: 1, legRatio: 1, armRatio: 1.08 },
  { id: 'short-arms', bodyScale: 1.04, shoulderRatio: 1, legRatio: .98, armRatio: .93 },
] as const;
export interface Camera { yaw: number; pitch: number; roll: number; distance: number; height: number; mirror: boolean }
export const CAMERA: Camera = { yaw: 0, pitch: 0, roll: 0, distance: 2.5, height: 0, mirror: false };
export type Skeleton = Partial<Record<LandmarkName, Vec3>>;
const rad = (a: number) => a * Math.PI / 180;
export const mix = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));
export function rng(seed: number) { let state = seed >>> 0; return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; }; }
export function rotate(p: Vec3, yaw = 0, pitch = 0, roll = 0): Vec3 {
  const a = rad(yaw), b = rad(pitch), c = rad(roll);
  const x = p.x * Math.cos(a) + p.z * Math.sin(a), z = -p.x * Math.sin(a) + p.z * Math.cos(a);
  const y = p.y * Math.cos(b) - z * Math.sin(b), zz = p.y * Math.sin(b) + z * Math.cos(b);
  return { x: x * Math.cos(c) - y * Math.sin(c), y: x * Math.sin(c) + y * Math.cos(c), z: zz };
}
export function project(p: Vec3, camera: Camera, aspect = 4 / 3): Vec3 {
  const factor = 2.5 / (camera.distance + p.z);
  return { x: .5 + p.x * factor / aspect, y: .5 + (p.y - camera.height) * factor, z: p.z / camera.distance };
}
export interface BodyState { rest?: number; restRight?: boolean; salute?: number; yaw?: number; root?: number; fault?: string; faultAmount?: number }
export function skeleton(state: BodyState = {}, profile = 0): Skeleton {
  const p = PROFILES[profile], out: Skeleton = {
    nose: { x: 0, y: -.38, z: -.015 }, leftEar: { x: -.035, y: -.37, z: 0 }, rightEar: { x: .035, y: -.37, z: 0 },
  };
  for (const [side, sign] of [['left', -1], ['right', 1]] as const) {
    const sx = sign * .12 * p.shoulderRatio, hx = sign * .08;
    out[`${side}Shoulder`] = { x: sx, y: -.22, z: 0 };
    out[`${side}Elbow`] = { x: sx + sign * .005, y: -.22 + .135 * p.armRatio, z: 0 };
    out[`${side}Wrist`] = { x: sx + sign * .01, y: -.22 + .27 * p.armRatio, z: 0 };
    out[`${side}Hip`] = { x: hx, y: 0, z: 0 };
    out[`${side}Knee`] = { x: sign * .055, y: .155 * p.legRatio, z: (side === (state.restRight ? 'right' : 'left') ? -.03 * (state.rest ?? 0) : 0) };
    out[`${side}Ankle`] = { x: sign * .03, y: .31 * p.legRatio, z: 0 };
    out[`${side}Heel`] = { x: sign * .02, y: .36 * p.legRatio, z: 0 };
    out[`${side}FootIndex`] = { x: sign * (.02 + .08 * Math.tan(rad(22.5))), y: .36 * p.legRatio, z: -.08 };
  }
  // Articulate upper arm and forearm separately; interpolate joint directions,
  // never measured features. Segment endpoint lengths vary smoothly in this model.
  const end = { rightElbow: { x: .28 * p.armRatio, y: -.24, z: 0 }, rightWrist: { x: .065, y: -.37, z: 0 } };
  const base = structuredClone(out);
  for (const [parent, name] of [['rightShoulder', 'rightElbow'], ['rightElbow', 'rightWrist']] as const) {
    const a = base[parent]!, b = base[name]!, c = parent === 'rightShoulder' ? base[parent]! : end[parent], d = end[name];
    const initial = Math.atan2(b.y - a.y, b.x - a.x), target = Math.atan2(d.y - c.y, d.x - c.x);
    const delta = Math.atan2(Math.sin(target - initial), Math.cos(target - initial));
    const angle = initial + delta * (state.salute ?? 0);
    const len = mix(Math.hypot(b.x-a.x,b.y-a.y), Math.hypot(d.x-c.x,d.y-c.y), state.salute ?? 0);
    out[name] = { x: out[parent]!.x + Math.cos(angle)*len, y: out[parent]!.y + Math.sin(angle)*len, z: 0 };
  }
  const beforeFault = structuredClone(out);
  if (state.fault === 'parallel-feet') for (const side of ['left','right'] as const) out[`${side}FootIndex`]!.x = out[`${side}Heel`]!.x;
  if (['both-knees', 'severe'].includes(state.fault ?? '')) for (const side of ['left','right'] as const) out[`${side}Knee`]!.z = -.13;
  if (state.fault === 'no-asymmetry') out.leftKnee!.z = out.rightKnee!.z = 0;
  if (['arms', 'severe'].includes(state.fault ?? '')) for (const side of ['left','right'] as const) { const sign = side === 'left' ? -1 : 1; out[`${side}Elbow`]!.x = sign*.25; out[`${side}Wrist`] = { x: sign*.32, y: -.17, z: 0 }; }
  if (state.fault === 'wrong-salute') out.rightWrist = { x: .33, y: -.1, z: 0 };
  if (['torso','severe'].includes(state.fault ?? '')) for (const [name, point] of Object.entries(out)) if (point.y < .06 && !name.endsWith('Hip')) point.x += (.06-point.y)*.8;
  for (const [name, point] of Object.entries(out)) {
    const original = beforeFault[name as LandmarkName]!;
    for (const axis of ['x','y','z'] as const) point[axis] = mix(original[axis], point[axis], state.faultAmount ?? 1);
    const transformed = rotate(point, state.yaw ?? 0);
    out[name as LandmarkName] = { x: (transformed.x + (state.root ?? 0)) * p.bodyScale, y: transformed.y * p.bodyScale, z: transformed.z * p.bodyScale };
  }
  return out;
}
export interface HandOptions { mode?: string; confidence?: number; sharpness?: number; ageMs?: number }
export function createSyntheticHand(body: Skeleton, camera: Camera, timestampMs: number, options: HandOptions = {}): NonNullable<CanonicalPoseFrame['saluteHand']> {
  const local: Vec3[] = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
  [[-.02,-.01],[-.03,-.025],[-.038,-.04],[-.038,-.06]].forEach(([x,y],i) => { local[i+1]={x,y,z:0}; });
  for (const [i,x] of [[5,-.027],[9,-.009],[13,.009],[17,.027]]) for (let j=0;j<4;j++) {
    local[i+j]={x: x + (options.mode === 'spread' ? x*j*1.3 : 0), y: -.04-j*.021, z: options.mode === 'flexed' && j >= 2 ? .04*(j-1) : 0 };
    if (options.mode === 'flexed' && j===3) local[i+j].y += .035;
  }
  if (options.mode === 'thumb-open') local[4].x = -.1;
  const wrist = body.rightWrist!, elbow = body.rightElbow!;
  const angle = Math.atan2(wrist.y-elbow.y,wrist.x-elbow.x) + Math.PI/2 + (options.mode === 'bent' ? Math.PI/2 : 0);
  const scale = options.mode === 'tiny' ? .1 : .65;
  const absolute = local.map(p => { const q = rotate(p,0,0,angle*180/Math.PI); return { x:wrist.x+q.x*scale,y:wrist.y+q.y*scale,z:wrist.z+q.z*scale }; });
  const transformed = absolute.map(p => rotate(p,camera.yaw,camera.pitch,camera.roll));
  const origin = transformed[0];
  const hand = { timestampMs: timestampMs-(options.ageMs ?? 0), image: transformed.map(p => project(p,camera)),
    world: transformed.map(p => ({x:p.x-origin.x,y:p.y-origin.y,z:p.z-origin.z})), sourceWidth: 960, sourceHeight: 720,
    confidence: options.confidence ?? .99, sharpness: options.sharpness ?? 25, handedness: 'Right', identityStable: true };
  if (options.mode === 'clipped') hand.image.forEach(p => { p.x += .7; });
  if (options.mode === 'partial') { hand.image = hand.image.slice(0,18); hand.world = hand.world.slice(0,18); }
  return hand;
}
export function createSyntheticHuman(state: BodyState, timestampMs: number, options: { profile?: number; camera?: Camera; noise?: number; seed?: number; hand?: HandOptions; occlusion?: string } = {}): CanonicalPoseFrame {
  const camera = options.camera ?? CAMERA, body = skeleton(state,options.profile), random = rng((options.seed ?? 12345) ^ Math.round(timestampMs*100));
  const landmarks: CanonicalPoseFrame['landmarks'] = {};
  for (const [name,p] of Object.entries(body)) {
    const gaussianLike = () => (random()+random()+random()+random()-2)*(options.noise ?? 0);
    const world = rotate(p,camera.yaw,camera.pitch,camera.roll);
    world.x += gaussianLike(); world.y += gaussianLike(); world.z += gaussianLike();
    landmarks[name as LandmarkName] = { world, image: project(world,camera), confidence:.99-Math.abs(gaussianLike()), visibility:.99, presence:null };
  }
  const frame: CanonicalPoseFrame = { timestampMs, personCount:1, aspectRatio:4/3, landmarks };
  if ((state.salute ?? 0) >= .9 && options.hand?.mode !== 'missing') { frame.saluteHand=createSyntheticHand(body,camera,timestampMs,options.hand); frame.handStatus='observed'; }
  const groups: Record<string, LandmarkName[]> = { wrist:['rightWrist'], feet:['leftHeel','leftFootIndex','rightHeel','rightFootIndex'], knee:['leftKnee'], shoulder:['leftShoulder'], torso:['leftHip','rightHip','leftShoulder','rightShoulder'] };
  for (const name of groups[options.occlusion ?? ''] ?? []) delete frame.landmarks[name];
  if (options.occlusion === 'cropped') for (const name of ['leftAnkle','rightAnkle','leftHeel','rightHeel','leftFootIndex','rightFootIndex'] as const) if (frame.landmarks[name]) frame.landmarks[name]!.image.y += .4;
  // mirror is presentation metadata only: anatomical detector input is unchanged.
  return frame;
}
