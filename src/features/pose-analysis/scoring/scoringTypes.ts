import type { FeatureId } from '../types';
export type MovementType = 'STATIC' | 'DYNAMIC';

export interface DynamicMovementConfig {
  direction: 'left' | 'right';
  targetYawDeg: number;
  yawToleranceDeg: number;
  startReadyDurationMs: number;
  finalHoldDurationMs: number;
  maxAttemptDurationMs: number;
}

export interface FeatureRule { feature: FeatureId; ideal: [number, number]; zero: [number, number] }
export interface Criterion { id: string; label: string; weight: number; rules: FeatureRule[]; feedback: string }
export interface MovementDefinition {
  id: string;
  label: string;
  type?: MovementType;
  minimumDurationMs: number;
  minimumSamples: number;
  criteria: Criterion[];
  dynamicConfig?: DynamicMovementConfig;
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
  measurements: { feature: FeatureId; value: number; variability: number }[];
}
export type ScoreResult =
  | { status: 'notScorable'; reasons: string[] }
  | { status: 'scored'; total: number; confidence: number; criteria: CriterionResult[]; corrections: string[] };
