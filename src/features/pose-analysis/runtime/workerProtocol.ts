import type { AnalysisSnapshot, CalibrationProfile, CanonicalPoseFrame, LightingMetrics } from '../types';
import type { ScoreResult } from '../scoring/scoringTypes';
export interface PoseDetector {
  initialize(delegate?: 'CPU' | 'GPU'): Promise<void>;
  detect(source: TexImageSource, timestampMs: number, width: number, height: number): CanonicalPoseFrame;
  dispose(): void;
}
export type SessionCommand =
  | 'startCalibration'
  | 'startAttempt'
  | 'reset'
  | 'selectAttention'
  | 'selectAtEase'
  | 'selectTurnLeft'
  | 'selectTurnRight';
export type WorkerCommand =
  | { type: 'initialize'; delegate?: 'CPU' | 'GPU' }
  | { type: 'analyzeFrame'; frame: ImageBitmap; timestampMs: number; width: number; height: number; lighting: LightingMetrics }
  | { type: SessionCommand }
  | { type: 'dispose' };
export type WorkerEvent =
  | { type: 'ready'; delegate: 'CPU' | 'GPU' }
  | { type: 'analysis'; snapshot: AnalysisSnapshot }
  | { type: 'calibrationComplete'; profile: CalibrationProfile }
  | { type: 'score'; result: ScoreResult }
  | { type: 'error'; message: string }
  | { type: 'disposed' };
