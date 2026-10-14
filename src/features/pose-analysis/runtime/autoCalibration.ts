import type { PoseStage } from '../types';

// Calibration measures body proportions, not a pose grade. Use the same camera
// gate as manual entry; identity remains mandatory before the exercise command.
export function shouldAutoCalibrate(enabled: boolean, stage: PoseStage, cameraReady: boolean, hasResult: boolean) {
  return enabled && stage === 'quality-check' && cameraReady && !hasResult;
}
