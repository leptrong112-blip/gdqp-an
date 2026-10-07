import type { FeatureSample, MovementId } from '../types';
import type { MovementDefinition } from '../scoring/scoringTypes';
import { attentionMovement } from '../scoring/attentionMovement';
import { atEaseMovement } from '../scoring/atEaseMovement';
import { ruleScore } from '../scoring/scoringEngine';

export const ATTENTION_FEET_INSTRUCTION = '2 gót chân đặt sát vào nhau, 2 mũi bàn chân mở rộng 45 độ.';
export const COMMAND_FLOW = {
  attention: { precondition: 'atEase', command: 'NGHIÊM' },
  atEase: { precondition: 'attention', command: 'NGHỈ' },
  turnLeft: { precondition: 'attention', command: 'BÊN TRÁI — QUAY' },
  turnRight: { precondition: 'attention', command: 'BÊN PHẢI — QUAY' },
  salute: { precondition: 'attention', command: 'CHÀO' },
  basicDrill: { precondition: 'atEase', command: 'NGHIÊM' },
} as const;
export type PoseCommandText = typeof COMMAND_FLOW[keyof typeof COMMAND_FLOW]['command'] | 'THÔI';
export type PreconditionStatus = 'WRONG_PRECONDITION' | 'INSUFFICIENT_EVIDENCE' | 'READY';
export const PREPARATION_STABLE_MS = 1500;
export const MOVEMENT_SETTLE_MS = 700;
export const COMMAND_OVERLAY_MS = 1100;
export const STOP_OVERLAY_MS = 1500;
export function commandFlow(id: MovementId) { return id === 'aboutFace' ? undefined : COMMAND_FLOW[id]; }
export function preparationDefinition(id: MovementId) {
  return commandFlow(id)?.precondition === 'atEase' ? atEaseMovement : attentionMovement;
}
/** Pose identity gate, not a grade: reuses existing rule bands without changing rubric math. */
export function postureReadiness(sample: FeatureSample | undefined, definition: MovementDefinition): PreconditionStatus {
  if (!sample) return 'INSUFFICIENT_EVIDENCE';
  // Natural knee asymmetry inside the attention ideal band is not proof of nghỉ.
  // Require an observed bend outside that band as well as the resting identity.
  if (definition.id === 'attention') {
    const resting = atEaseMovement.criteria.find(c => c.id === 'legs')!;
    const restingValues = resting.rules.map(rule => sample.values[rule.feature]);
    if (restingValues.some(v => !v || !Number.isFinite(v.value) || v.confidence < .6)) return 'INSUFFICIENT_EVIDENCE';
    const attentionLegs = definition.criteria.find(c => c.id === 'legs')!;
    const naturallyStraight = attentionLegs.rules.every(rule => {
      const value = sample.values[rule.feature];
      return !!value && Number.isFinite(value.value) && value.confidence >= .6 && value.value >= rule.ideal[0] && value.value <= rule.ideal[1];
    });
    if (!naturallyStraight && resting.rules.every((rule, i) => ruleScore(restingValues[i]!.value, rule) >= .6)) return 'WRONG_PRECONDITION';
  }
  const core = definition.criteria.filter(c => c.required || c.id === 'arms');
  let wrong = false;
  for (const criterion of core) {
    const scores: number[] = [], essential: number[] = [];
    for (const rule of criterion.rules) {
      const value = sample.values[rule.feature];
      if (!value || !Number.isFinite(value.value) || value.confidence < .6) return 'INSUFFICIENT_EVIDENCE';
      const score = ruleScore(value.value, rule); scores.push(score);
      if (rule.essential) essential.push(score);
    }
    const fraction = definition.robustPosture ? Math.min(scores.reduce((a, b) => a + b, 0) / scores.length, ...essential) : Math.min(...scores);
    if (fraction < .6) wrong = true;
  }
  return wrong ? 'WRONG_PRECONDITION' : 'READY';
}
