export const POSE_CONFIG = {
  modelPath: '/models/pose/pose_landmarker_full.task', wasmPath: '/mediapipe/wasm',
  landmarkConfidence: 0.6, reliabilityMean: 0.75, reliabilityCoverage: 0.85, frameMargin: 0.03,
  calibrationMs: 2000, countdownMs: 3000, attemptMs: 3000, minimumValidAttemptMs: 2400,
  maximumQualityGapMs: 500, maximumFrameGapMs: 250, smoothingMs: 100, expiryMs: 200,
  targetFps: 15, uiIntervalMs: 200, stabilityWindowMs: 1000, qualityWarmupMs: 1000,
  maximumRootMovement: 0.08, maximumScaleVariation: 0.08,
  outliers: {
    historySize: 15, minimumBoneSamples: 5, resetAfterMs: 1500,
    minimumBoneRatio: 0.5, maximumBoneRatio: 1.75,
    jumpBaseTorsoLengths: 0.75, jumpTorsoLengthsPerSecond: 6,
    reacquireRadiusTorsoLengths: 0.25,
  },
  lighting: { minimumMean: 45, maximumMean: 220, maximumDarkRatio: 0.35, maximumBrightRatio: 0.2 },
} as const;
