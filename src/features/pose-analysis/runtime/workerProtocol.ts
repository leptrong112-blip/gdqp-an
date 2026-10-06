import type { AnalysisSnapshot, CalibrationProfile, CanonicalPoseFrame, LightingMetrics } from '../types';
import type { ScoreResult } from '../scoring/scoringTypes';
import type { SequenceEngine } from '../scoring/sequenceEngine';
import type { PoseAttemptContext, PoseFinalTiming } from './attemptTiming';
export interface PoseDetector {
  initialize(delegate?: 'CPU' | 'GPU'): Promise<void>;
  prepareHands?(): Promise<void>;
  detect(source: TexImageSource, timestampMs: number, width: number, height: number, trackHands?: boolean): CanonicalPoseFrame;
  dispose(): void;
}
export type SessionCommand =
  | 'startCalibration'
  | 'startAttempt'
  | 'enablePreconditionScoring'
  | 'disablePreconditionScoring'
  | 'reset'
  | 'selectAttention'
  | 'selectAtEase'
  | 'selectTurnLeft'
  | 'selectTurnRight'
  | 'selectSalute'
  | 'selectBasicDrill';
export type WorkerCommand =
  | { type: 'initialize'; delegate?: 'CPU' | 'GPU'; prepareHands?: boolean }
  | { type: 'analyzeFrame'; frame: ImageBitmap; timestampMs: number; width: number; height: number; lighting: LightingMetrics; attemptId?: string; sentAtMs?: number; capturedAtMs?: number }
  | { type: SessionCommand; attempt?: PoseAttemptContext }
  | { type: 'dispose' };
export type WorkerEvent =
  | { type: 'ready'; delegate: 'CPU' | 'GPU'; sequenceEngine: SequenceEngine['kind'] }
  | { type: 'analysis'; snapshot: AnalysisSnapshot; attemptId?: string }
  | { type: 'calibrationComplete'; profile: CalibrationProfile }
  | { type: 'commandCue'; command: import('./commandFlow').PoseCommandText; attemptId?: string; timestampMs: number }
  | { type: 'score'; result: ScoreResult; attemptId?: string; timing?: PoseFinalTiming }
  | { type: 'frameComplete'; attemptId?: string }
  | { type: 'error'; message: string }
  | { type: 'disposed' };
