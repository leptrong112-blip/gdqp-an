import type { FeatureId } from '../types';
import type { SequenceReport } from './sequenceAnalysis';
export type MovementType = 'STATIC' | 'DYNAMIC';

export interface DynamicMovementConfig {
  direction: 'left' | 'right';
  targetYawDeg: number;
  yawToleranceDeg: number;
  startReadyDurationMs: number;
  finalHoldDurationMs: number;
  maxAttemptDurationMs: number;
}

export interface FeatureRule { feature: FeatureId; ideal: [number, number]; zero: [number, number]; essential?: boolean }
export interface Criterion { id: string; label: string; weight: number; rules: FeatureRule[]; feedback: string; required?: boolean }
export interface MovementDefinition {
  id: string;
  label: string;
  type?: MovementType;
  minimumDurationMs: number;
  minimumSamples: number;
  criteria: Criterion[];
  dynamicConfig?: DynamicMovementConfig;
  /** Robust temporal aggregation for the two static training postures only. */
  robustPosture?: boolean;
}
export type CriterionStatusLevel = 'PASS' | 'NEEDS_ADJUSTMENT' | 'NOT_ACHIEVED' | 'NOT_SCORABLE';
export interface CriterionResult {
  id: string;
  label: string;
  points: number;
  maximum: number;
  status: 'good' | 'improve';
  statusLevel?: CriterionStatusLevel;
  feedback: string;
  specificFeedback?: string;
  mistakes?: string[];
  required?: boolean;
  measurements: { feature: FeatureId; value: number; variability: number }[];
}
export type ScoreResult =
  | { status: 'notScorable'; reasons: string[]; drill?: DrillSummary }
  | { status: 'scored'; total: number; confidence: number; criteria: CriterionResult[]; corrections: string[]; sequence?: SequenceReport; passed?: boolean; drill?: DrillSummary };

export interface DrillStepResult { movementId: 'attention' | 'atEase' | 'salute'; result: ScoreResult }
export interface DrillSummary { steps: DrillStepResult[]; totalPoints: number; maximum: number; completion: number; passed: boolean }
