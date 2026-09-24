export const LANDMARK_NAMES = ['nose', 'leftEyeInner', 'leftEye', 'leftEyeOuter', 'rightEyeInner', 'rightEye', 'rightEyeOuter', 'leftEar', 'rightEar', 'mouthLeft', 'mouthRight', 'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist', 'leftPinky', 'rightPinky', 'leftIndex', 'rightIndex', 'leftThumb', 'rightThumb', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle', 'leftHeel', 'rightHeel', 'leftFootIndex', 'rightFootIndex'] as const;
export type LandmarkName = typeof LANDMARK_NAMES[number];
export type Vec3 = { x: number; y: number; z: number };
export interface Landmark {
  /** MediaPipe image coordinates normalized to the source frame (x/y in 0..1). */
  image: Vec3;
  world?: Vec3;
  visibility: number;
  /** The pinned web SDK omits per-point presence; null means unavailable, never fabricated. */
  presence: number | null;
  confidence: number;
}
export interface CanonicalPoseFrame {
  timestampMs: number;
  personCount: number;
  aspectRatio: number;
  landmarks: Partial<Record<LandmarkName, Landmark>>;
}
export interface LightingMetrics { mean: number; darkRatio: number; brightRatio: number }
export type QualityId = 'lighting' | 'person' | 'framing' | 'reliability' | 'stability' | 'orientation';
export interface QualityCheck { id: QualityId; label: string; passed: boolean; message: string }
export interface QualityReport {
  passed: boolean;
  reasons: string[];
  checks: QualityCheck[];
  metrics: { coverage: number; meanConfidence: number; rootMovement: number; scaleVariation: number; lighting: LightingMetrics };
}
export interface CalibrationProfile {
  bodyScale: number; worldScale: number; shoulderWidth: number; hipWidth: number; torsoLength: number; legLength: number;
  baselineJitter: number; coverage: number; frontFacing: boolean; sampleCount: number;
}
export interface NormalizedPoseFrame extends CanonicalPoseFrame { body: Partial<Record<LandmarkName, Vec3>>; worldBody: Partial<Record<LandmarkName, Vec3>> }
export type MovementId =
  | 'attention'
  | 'atEase'
  | 'turnRight'
  | 'turnLeft'
  | 'aboutFace'
  | 'salute'
  | 'basicDrill';
export type FeatureId =
  | 'torsoTilt'
  | 'shoulderTilt'
  | 'hipTilt'
  | 'leftKneeAngle'
  | 'rightKneeAngle'
  | 'maxKneeAngle'
  | 'minKneeAngle'
  | 'kneeAngleDiff'
  | 'heelGapRatio'
  | 'footOpeningAngle'
  | 'leftElbowAngle'
  | 'rightElbowAngle'
  | 'leftWristHipDistance'
  | 'rightWristHipDistance'
  | 'rightWristHeadDistance'
  | 'headOffset'
  | 'bodyYaw'
  | 'yawVelocity'
  | 'turnProgress'
  | 'torsoStability';
export interface FeatureValue { value: number; confidence: number }
export interface FeatureSample { timestampMs: number; values: Partial<Record<FeatureId, FeatureValue>> }
export interface FeatureWindow { samples: FeatureSample[]; validDurationMs: number; qualityPassed: boolean }
export type PoseStage = 'idle' | 'loading-model' | 'quality-check' | 'calibrating' | 'countdown' | 'scoring' | 'completed' | 'result' | 'blocked' | 'unsupported' | 'error';
export type DynamicPhase = 'WAITING_FOR_START' | 'START_READY' | 'MOVING' | 'FINAL_HOLD' | 'COMPLETE';
export interface DynamicProgress {
  phase: DynamicPhase;
  currentYawDeg: number;
  targetYawDeg: number;
  progressRatio: number;
  holdRemainingMs?: number;
  message?: string;
}
export interface AnalysisSnapshot {
  frame: CanonicalPoseFrame; quality: QualityReport; stage: PoseStage; progress: number;
  inferenceMs: number; inferenceFps: number; message?: string;
  dynamicProgress?: DynamicProgress;
  drillProgress?: { index: number; completed: number; total: number; movementId: 'attention' | 'atEase' | 'salute' };
}
