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
  saluteHand?: { timestampMs: number; image: Vec3[]; world: Vec3[]; sourceWidth: number; sourceHeight: number;
    confidence?: number; handedness?: string; identityStable?: boolean; sharpness?: number };
  handStatus?: 'loading' | 'unavailable' | 'waiting' | 'not-visible' | 'observed';
  handEvidence?: HandFeatures;
  detectorTelemetry?: { poseMs: number; handMs: number; handFps: number; handConfidence?: number; handedness?: string; handLandmarks: number; handSharpness?: number };
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
  frontalXSign?: 1 | -1;
}
export interface NormalizedPoseFrame extends CanonicalPoseFrame { body: Partial<Record<LandmarkName, Vec3>>; worldBody: Partial<Record<LandmarkName, Vec3>>; frontalXSign?: 1 | -1 }
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
  | 'torsoStability'
  | 'rootTravel'
  | 'pivotTravel'
  | 'saluteFingerExtension' | 'saluteFingerSpread' | 'saluteThumbGap' | 'saluteWristBend' | 'saluteTipHeadDistance';
export interface SaluteHandMetrics {
  extension: number; spread: number; thumbGap: number; wristBend: number; tipHeadDistance: number;
}
export interface HandFeatures {
  available: boolean; confidence?: number; validLandmarks: number; ageMs?: number; handedness?: string;
  quality: 'OBSERVED' | 'INSUFFICIENT_HAND_EVIDENCE'; reason?: string;
  fingerExtension?: number[]; fingerAlignment?: number; fingerSpread?: number;
  palmOrientation?: Vec3; wristOrientation?: Vec3;
}
export interface SaluteProgress {
  state: 'ATTENTION_READY' | 'COUNTDOWN' | 'COMMAND' | 'TRANSITION' | 'HAND_ACQUIRED' | 'STABLE' | 'SCORING' | 'FINALIZED';
  commandMs?: number; firstMovementMs?: number; arrivalMs?: number; stableMs: number;
  motionObserved: boolean; observationCount: number; wristRise: number; wristVelocity: number;
  pathSmoothness?: number; elbowAngle?: number; wristHeadDistance?: number; hand?: HandFeatures;
}
export interface PosePerformanceTelemetry {
  poseMs?: number; handMs?: number; workerLatencyMs?: number; landmarkAgeMs?: number;
  droppedFrames?: number; droppedFrameRatio?: number; submittedFrames?: number; renderFps?: number;
  profile?: 'FAST' | 'NORMAL' | 'LOW'; targetFps?: number;
  benchmark?: Partial<Record<'pose' | 'hand' | 'worker' | 'age', { medianMs: number; p90Ms: number; samples: number }>>;
}
export interface FeatureValue { value: number; confidence: number }
export interface FeatureSample { timestampMs: number; values: Partial<Record<FeatureId, FeatureValue>>; saluteHand?: SaluteHandMetrics }
export interface FeatureWindow { samples: FeatureSample[]; validDurationMs: number; qualityPassed: boolean }
export type PoseStage = 'idle' | 'loading-model' | 'quality-check' | 'calibrating' | 'waiting-precondition' | 'precondition-scoring' | 'countdown' | 'transition' | 'scoring' | 'stop-command' | 'completed' | 'result' | 'blocked' | 'unsupported' | 'error';
export type DynamicPhase = 'WAITING_FOR_START' | 'START_READY' | 'MOVING' | 'FINAL_HOLD' | 'COMPLETE';
export interface DynamicProgress {
  phase: DynamicPhase;
  currentYawDeg: number;
  targetYawDeg: number;
  progressRatio: number;
  holdRemainingMs?: number;
  message?: string;
}
export interface DualMeasurement {
  featureId: FeatureId;
  label: string;
  officialSystem: 'CURRENT_3D' | 'CURRENT_2D';
  officialValue: number;
  value2D: number;
  value3D: number;
  delta: number;
  unit: string;
  confidence: number;
  isReliable: boolean;
}

export interface AnalysisSnapshot {
  frame: CanonicalPoseFrame; quality: QualityReport; stage: PoseStage; progress: number;
  inferenceMs: number; inferenceFps: number; message?: string;
  dynamicProgress?: DynamicProgress;
  drillProgress?: { index: number; completed: number; total: number; movementId: 'attention' | 'atEase' | 'salute' };
  features?: Partial<Record<FeatureId, FeatureValue>>;
  dualMeasurements?: DualMeasurement[];
  workflow?: { preconditionId: 'attention' | 'atEase'; preconditionLabel: string; status: 'WRONG_PRECONDITION' | 'INSUFFICIENT_EVIDENCE' | 'READY'; scoringPrecondition: boolean; message?: string };
  saluteProgress?: SaluteProgress;
  performance?: PosePerformanceTelemetry;
}
